"""
API routes for analytics and company data.
"""

from fastapi import APIRouter, HTTPException, Query
from database.supabase_client import get_supabase_client
from typing import Optional, List, Dict, Any, Literal
from services.topic_average_rating_service import get_topic_rating_timeseries
from datetime import datetime, timedelta
from collections import defaultdict, Counter
import re
import html
import random

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])
supabase = get_supabase_client()


def clean_html_text(text: str) -> str:
    """
    Clean HTML entities and tags from text.
    Removes <br/>, <br>, and other HTML tags, and decodes HTML entities.
    """
    if not text or not isinstance(text, str):
        return text
    
    # Decode HTML entities (&lt; &gt; &amp; etc.)
    text = html.unescape(text)
    
    # Replace <br/>- or <br>- patterns (bullet points with br tags)
    text = re.sub(r'<br\s*/?\s*>\s*-\s*', '\n• ', text, flags=re.IGNORECASE)
    
    # Replace remaining <br/>, <br>, <br /> with newlines
    text = re.sub(r'<br\s*/?\s*>', '\n', text, flags=re.IGNORECASE)
    
    # Remove any other HTML tags
    text = re.sub(r'<[^>]+>', '', text)
    
    # Clean up patterns like "- text -" at line boundaries (incomplete bullet points)
    text = re.sub(r'^-\s*$', '', text, flags=re.MULTILINE)
    text = re.sub(r'^-\s+', '• ', text, flags=re.MULTILINE)
    
    # Clean up multiple newlines (max 2 consecutive newlines)
    text = re.sub(r'\n\s*\n\s*\n+', '\n\n', text)
    
    # Remove trailing dashes and whitespace from lines
    text = re.sub(r'\s+-\s*$', '', text, flags=re.MULTILINE)
    
    # Trim whitespace
    text = text.strip()
    
    return text


@router.get("/company/{company_id}/overview")
async def get_company_overview(company_id: int):
    """Get overall statistics for a company."""
    try:
        # Get candidates data
        candidates_response = supabase.table("candidates")\
            .select("durchschnittsbewertung, datum")\
            .eq("company_id", company_id)\
            .execute()
        
        # Get employee data
        employee_response = supabase.table("employee")\
            .select("durchschnittsbewertung, datum")\
            .eq("company_id", company_id)\
            .execute()
        
        candidates_data = candidates_response.data or []
        employee_data = employee_response.data or []
        
        # Calculate average score
        all_ratings = [
            float(r["durchschnittsbewertung"]) 
            for r in candidates_data + employee_data 
            if r.get("durchschnittsbewertung")
        ]
        
        avg_score = round(sum(all_ratings) / len(all_ratings), 2) if all_ratings else 0
        
        # Calculate trend (comparing last 30 days vs previous 30 days)
        now = datetime.now()
        thirty_days_ago = now - timedelta(days=30)
        sixty_days_ago = now - timedelta(days=60)
        
        recent_ratings = [
            float(r["durchschnittsbewertung"]) 
            for r in candidates_data + employee_data 
            if r.get("durchschnittsbewertung") and r.get("datum") 
            and datetime.fromisoformat(r["datum"].replace("Z", "+00:00")) >= thirty_days_ago
        ]
        
        previous_ratings = [
            float(r["durchschnittsbewertung"]) 
            for r in candidates_data + employee_data 
            if r.get("durchschnittsbewertung") and r.get("datum")
            and sixty_days_ago <= datetime.fromisoformat(r["datum"].replace("Z", "+00:00")) < thirty_days_ago
        ]
        
        recent_avg = sum(recent_ratings) / len(recent_ratings) if recent_ratings else 0
        previous_avg = sum(previous_ratings) / len(previous_ratings) if previous_ratings else 0
        trend = round(recent_avg - previous_avg, 2)
        
        # Find most critical category
        critical_category = await get_most_critical_category(company_id)
        
        return {
            "average_score": avg_score,
            "trend": trend,
            "total_reviews": len(candidates_data) + len(employee_data),
            "candidate_reviews": len(candidates_data),
            "employee_reviews": len(employee_data),
            "most_critical": critical_category
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching company overview: {str(e)}")


@router.get("/company/{company_id}/timeline")
async def get_company_timeline(
    company_id: int,
    days: int = Query(default=365, description="Number of days to include"),
    forecast_months: int = Query(default=6, description="Number of months to forecast"),
    source: str = Query(default="all", description="Data source: 'employee', 'candidates', or 'all'")
):
    """Get timeline data for ratings over time with forecast."""
    try:
        cutoff_date = datetime.now() - timedelta(days=days)
        
        timeline_data = []
        
        # Get candidates data (if source is 'candidates' or 'all')
        if source in ["candidates", "all"]:
            candidates_response = supabase.table("candidates")\
                .select("durchschnittsbewertung, datum")\
                .eq("company_id", company_id)\
                .gte("datum", cutoff_date.isoformat())\
                .order("datum")\
                .execute()
            
            candidates_data = candidates_response.data or []
            for item in candidates_data:
                if item.get("datum") and item.get("durchschnittsbewertung"):
                    timeline_data.append({
                        "date": item["datum"],
                        "score": float(item["durchschnittsbewertung"]),
                        "type": "candidate"
                    })
        
        # Get employee data (if source is 'employee' or 'all')
        if source in ["employee", "all"]:
            employee_response = supabase.table("employee")\
                .select("durchschnittsbewertung, datum")\
                .eq("company_id", company_id)\
                .gte("datum", cutoff_date.isoformat())\
                .order("datum")\
                .execute()
            
            employee_data = employee_response.data or []
            for item in employee_data:
                if item.get("datum") and item.get("durchschnittsbewertung"):
                    timeline_data.append({
                        "date": item["datum"],
                        "score": float(item["durchschnittsbewertung"]),
                        "type": "employee"
                    })
        
        # Sort by date
        timeline_data.sort(key=lambda x: x["date"])
        
        # Group by month for aggregation
        monthly_data = defaultdict(list)
        for item in timeline_data:
            try:
                date = datetime.fromisoformat(item["date"].replace("Z", "+00:00"))
                month_key = date.strftime("%Y-%m")
                monthly_data[month_key].append(item["score"])
            except:
                pass
        
        # Create aggregated monthly timeline
        aggregated_timeline = []
        for month_key in sorted(monthly_data.keys()):
            scores = monthly_data[month_key]
            date_obj = datetime.strptime(month_key, "%Y-%m")
            aggregated_timeline.append({
                "date": month_key,
                "date_display": date_obj.strftime("%b %Y"),
                "score": round(sum(scores) / len(scores), 2),
                "count": len(scores),
                "is_forecast": False
            })
        
        # Calculate forecast using linear regression
        forecast_data = calculate_forecast(aggregated_timeline, forecast_months)
        
        return {
            "timeline": aggregated_timeline,
            "forecast": forecast_data,
            "total_points": len(timeline_data),
            "current_date": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching timeline: {str(e)}")


def calculate_forecast(historical_data: List[Dict[str, Any]], months: int) -> List[Dict[str, Any]]:
    """
    Calculate forecast using linear regression based on historical data.
    
    Args:
        historical_data: List of historical monthly data points
        months: Number of months to forecast
        
    Returns:
        List of forecast data points
    """
    if len(historical_data) < 2:
        # Not enough data for forecast
        return []
    
    # Extract x (time index) and y (score) values
    x_values = list(range(len(historical_data)))
    y_values = [point["score"] for point in historical_data]
    
    # Calculate linear regression: y = mx + b
    n = len(x_values)
    sum_x = sum(x_values)
    sum_y = sum(y_values)
    sum_xy = sum(x * y for x, y in zip(x_values, y_values))
    sum_x_squared = sum(x * x for x in x_values)
    
    # Slope (m) and intercept (b)
    denominator = n * sum_x_squared - sum_x * sum_x
    
    if denominator == 0:
        # Fallback: use average of last values
        avg_score = sum(y_values) / len(y_values)
        forecast = []
        last_date = datetime.strptime(historical_data[-1]["date"], "%Y-%m")
        for i in range(1, months + 1):
            # Calculate next month
            month_offset = last_date.month + i
            year_offset = (month_offset - 1) // 12
            month = ((month_offset - 1) % 12) + 1
            next_month = last_date.replace(year=last_date.year + year_offset, month=month)
            forecast.append({
                "date": next_month.strftime("%Y-%m"),
                "date_display": next_month.strftime("%b %Y"),
                "score": round(avg_score, 2),
                "is_forecast": True
            })
        return forecast
    
    m = (n * sum_xy - sum_x * sum_y) / denominator
    b = (sum_y - m * sum_x) / n
    
    # Generate forecast
    forecast = []
    last_date = datetime.strptime(historical_data[-1]["date"], "%Y-%m")
    
    for i in range(1, months + 1):
        # Calculate next month
        month_offset = last_date.month + i
        year_offset = (month_offset - 1) // 12
        month = ((month_offset - 1) % 12) + 1
        next_month = last_date.replace(year=last_date.year + year_offset, month=month)
        
        # Predict score using linear regression
        future_x = len(historical_data) + i - 1
        predicted_score = m * future_x + b
        
        # Ensure score is within reasonable bounds (0-5 for ratings)
        predicted_score = max(0, min(5, predicted_score))
        
        forecast.append({
            "date": next_month.strftime("%Y-%m"),
            "date_display": next_month.strftime("%b %Y"),
            "score": round(predicted_score, 2),
            "is_forecast": True
        })
    
    return forecast


@router.get("/company/{company_id}/category-ratings")
async def get_category_ratings(company_id: int):
    """Get average ratings for each category."""
    try:
        # Get all rating columns for candidates
        candidates_response = supabase.table("candidates")\
            .select("*")\
            .eq("company_id", company_id)\
            .execute()
        
        # Get all rating columns for employees
        employee_response = supabase.table("employee")\
            .select("*")\
            .eq("company_id", company_id)\
            .execute()
        
        candidates_data = candidates_response.data or []
        employee_data = employee_response.data or []
        
        # Calculate averages for candidate categories
        candidate_categories = {}
        candidate_rating_fields = [
            col for col in (candidates_data[0].keys() if candidates_data else [])
            if col.startswith("sternebewertung_")
        ]
        
        for field in candidate_rating_fields:
            ratings = [
                float(r[field]) for r in candidates_data 
                if r.get(field) is not None
            ]
            if ratings:
                category_name = field.replace("sternebewertung_", "").replace("_", " ").title()
                candidate_categories[category_name] = round(sum(ratings) / len(ratings), 2)
        
        # Calculate averages for employee categories
        employee_categories = {}
        employee_rating_fields = [
            col for col in (employee_data[0].keys() if employee_data else [])
            if col.startswith("sternebewertung_")
        ]
        
        for field in employee_rating_fields:
            ratings = [
                float(r[field]) for r in employee_data 
                if r.get(field) is not None
            ]
            if ratings:
                category_name = field.replace("sternebewertung_", "").replace("_", " ").title()
                employee_categories[category_name] = round(sum(ratings) / len(ratings), 2)
        
        return {
            "candidate_categories": candidate_categories,
            "employee_categories": employee_categories
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching category ratings: {str(e)}")


async def get_most_critical_category(company_id: int) -> Dict[str, Any]:
    """Helper function to find the most critical (lowest rated) category."""
    try:
        category_data = await get_category_ratings(company_id)
        
        all_categories = {
            **category_data["candidate_categories"],
            **category_data["employee_categories"]
        }
        
        if not all_categories:
            return {"category": "N/A", "score": 0}
        
        lowest = min(all_categories.items(), key=lambda x: x[1])
        return {
            "category": lowest[0],
            "score": lowest[1]
        }
        
    except Exception:
        return {"category": "N/A", "score": 0}


@router.get("/company/{company_id}/reviews")
async def get_company_reviews(
    company_id: int,
    limit: int = Query(default=50, description="Maximum number of reviews to return"),
    source: Optional[str] = Query(default=None, description="Filter by source: 'candidates' or 'employee'")
):
    """Get detailed reviews for a company."""
    try:
        reviews = []
        
        if source is None or source == "candidates":
            candidates_response = supabase.table("candidates")\
                .select("*")\
                .eq("company_id", company_id)\
                .order("datum", desc=True)\
                .limit(limit if source == "candidates" else limit // 2)\
                .execute()
            
            for item in candidates_response.data or []:
                reviews.append({
                    "id": item["id"],
                    "type": "candidate",
                    "date": item.get("datum"),
                    "score": float(item.get("durchschnittsbewertung", 0)),
                    "title": item.get("titel", ""),
                    "description": item.get("stellenbeschreibung", ""),
                    "improvements": item.get("verbesserungsvorschlaege", "")
                })
        
        if source is None or source == "employee":
            employee_response = supabase.table("employee")\
                .select("*")\
                .eq("company_id", company_id)\
                .order("datum", desc=True)\
                .limit(limit if source == "employee" else limit // 2)\
                .execute()
            
            for item in employee_response.data or []:
                reviews.append({
                    "id": item["id"],
                    "type": "employee",
                    "date": item.get("datum"),
                    "score": float(item.get("durchschnittsbewertung", 0)),
                    "title": item.get("titel", ""),
                    "job_description": item.get("jobbeschreibung", ""),
                    "positive": item.get("gut_am_arbeitgeber_finde_ich", ""),
                    "negative": item.get("schlecht_am_arbeitgeber_finde_ich", ""),
                    "improvements": item.get("verbesserungsvorschlaege", "")
                })
        
        # Sort by date
        reviews.sort(key=lambda x: x.get("date") or "", reverse=True)
        
        return {
            "reviews": reviews[:limit],
            "total": len(reviews)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching reviews: {str(e)}")


@router.get("/company/{company_id}/negative-topics")
async def get_negative_topics(company_id: int):
    """Get the most mentioned negative topics."""
    try:
        # Get employee negative feedback
        employee_response = supabase.table("employee")\
            .select("schlecht_am_arbeitgeber_finde_ich, durchschnittsbewertung")\
            .eq("company_id", company_id)\
            .execute()
        
        # Get candidate improvement suggestions
        candidates_response = supabase.table("candidates")\
            .select("verbesserungsvorschlaege, durchschnittsbewertung")\
            .eq("company_id", company_id)\
            .execute()
        
        employee_data = employee_response.data or []
        candidates_data = candidates_response.data or []
        
        # Collect negative texts
        negative_texts = []
        for item in employee_data:
            if item.get("schlecht_am_arbeitgeber_finde_ich"):
                negative_texts.append(item["schlecht_am_arbeitgeber_finde_ich"])
        
        for item in candidates_data:
            if item.get("verbesserungsvorschlaege"):
                negative_texts.append(item["verbesserungsvorschlaege"])
        
        # Simple keyword analysis (can be enhanced with NLP)
        keywords = {}
        negative_keywords = [
            "gehalt", "kommunikation", "management", "work-life-balance", 
            "stress", "überstunden", "kollegen", "chef", "führung",
            "bezahlung", "karriere", "entwicklung", "atmosphäre"
        ]
        
        for text in negative_texts:
            text_lower = text.lower()
            for keyword in negative_keywords:
                if keyword in text_lower:
                    keywords[keyword] = keywords.get(keyword, 0) + 1
        
        # Sort by frequency
        sorted_topics = sorted(keywords.items(), key=lambda x: x[1], reverse=True)
        
        return {
            "negative_topics": [
                {"topic": topic, "count": count} 
                for topic, count in sorted_topics[:10]
            ],
            "total_negative_mentions": sum(keywords.values())
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching negative topics: {str(e)}")


@router.get("/company/{company_id}/topic-overview")
async def get_topic_overview(
    company_id: int,
    source: Optional[str] = Query(default=None, description="Filter by source: 'candidates' or 'employee'")
):
    """
    Get topic overview data formatted for the frontend TopicOverviewCard.
    
    This endpoint analyzes reviews and extracts topics with their frequency,
    average rating, sentiment, and timeline data - matching the format of
    the dummy data in TopicOverviewCard.jsx.
    
    Args:
        company_id: Company ID to analyze
        source: Optional filter - 'candidates' for Bewerber or 'employee' for Mitarbeiter
    """
    try:
        # Get reviews based on source filter
        candidates_data = []
        employee_data = []
        
        if source is None or source == "candidates":
            candidates_response = supabase.table("candidates")\
                .select("*")\
                .eq("company_id", company_id)\
                .execute()
            candidates_data = candidates_response.data or []
        
        if source is None or source == "employee":
            employee_response = supabase.table("employee")\
                .select("*")\
                .eq("company_id", company_id)\
                .execute()
            employee_data = employee_response.data or []
        
        all_reviews = candidates_data + employee_data
        
        if not all_reviews:
            return {
                "topics": [],
                "total_reviews": 0,
                "message": "No reviews found for this company"
            }
        
        # Define topic keywords to extract
        topic_definitions = {
            "Work-Life Balance": {
                "keywords": [
                    r'\bwork[\s-]*life[\s-]*balance\b',
                    r'\büberstunden\b',
                    r'\barbeitszeit\b',
                    r'\burlaub\b',
                    r'\bfreizeit\b',
                    r'\bprivatleben\b',
                    r'\bflexibilität\b',
                    r'\bhomeoffice\b',
                    r'\berreichbarkeit\b'
                ],
                "rating_fields": ["sternebewertung_work_life_balance"]
            },
            "Führungsqualität": {
                "keywords": [
                    r'\bführung\b',
                    r'\bmanagement\b',
                    r'\bvorgesetzte\b',
                    r'\bchef\b',
                    r'\bleitung\b',
                    r'\bführungskräfte\b',
                    r'\bvorgesetztenverhalten\b',
                    r'\bkompetenz\b',
                    r'\bentscheidung\b'
                ],
                "rating_fields": ["sternebewertung_vorgesetztenverhalten"]
            },
            "Gehalt & Benefits": {
                "keywords": [
                    r'\bgehalt\b',
                    r'\bbezahlung\b',
                    r'\blohn\b',
                    r'\bvergütung\b',
                    r'\bbenefits\b',
                    r'\bsozialleistungen\b',
                    r'\baltersvorsorge\b',
                    r'\bprämie\b',
                    r'\bbonus\b'
                ],
                "rating_fields": ["sternebewertung_gehalt_sozialleistungen"]
            },
            "Teamzusammenhalt": {
                "keywords": [
                    r'\bteam\b',
                    r'\bkollegen\b',
                    r'\bzusammenhalt\b',
                    r'\bkollegenzusammenhalt\b',
                    r'\batmosphäre\b',
                    r'\barbeitsatmosphäre\b',
                    r'\bzusammenarbeit\b',
                    r'\bgemeinschaft\b'
                ],
                "rating_fields": ["sternebewertung_kollegenzusammenhalt", "sternebewertung_arbeitsatmosphaere"]
            },
            "Karriereentwicklung": {
                "keywords": [
                    r'\bkarriere\b',
                    r'\bweiterbildung\b',
                    r'\bentwicklung\b',
                    r'\baufstieg\b',
                    r'\bförderung\b',
                    r'\bschulungen\b',
                    r'\bbeförderung\b',
                    r'\bperspektive\b'
                ],
                "rating_fields": ["sternebewertung_karriere_weiterbildung"]
            },
            "Kommunikation": {
                "keywords": [
                    r'\bkommunikation\b',
                    r'\binformation\b',
                    r'\btransparenz\b',
                    r'\bfeedback\b',
                    r'\bgespräch\b',
                    r'\baustausch\b',
                    r'\brückmeldung\b'
                ],
                "rating_fields": ["sternebewertung_kommunikation"]
            },
            "Arbeitsbedingungen": {
                "keywords": [
                    r'\barbeitsbedingungen\b',
                    r'\bausstattung\b',
                    r'\bbüro\b',
                    r'\barbeitsplatz\b',
                    r'\btechnik\b',
                    r'\bumgebung\b',
                    r'\binfrastruktur\b'
                ],
                "rating_fields": ["sternebewertung_arbeitsbedingungen"]
            }
        }
        
        # Analyze each topic
        topics_data = []
        
        for topic_name, topic_config in topic_definitions.items():
            topic_analysis = analyze_topic(
                topic_name=topic_name,
                keywords=topic_config["keywords"],
                rating_fields=topic_config["rating_fields"],
                all_reviews=all_reviews
            )
            
            if topic_analysis["frequency"] > 0:  # Only include topics that were found
                topics_data.append(topic_analysis)
        
        # Sort by frequency
        topics_data.sort(key=lambda x: x["frequency"], reverse=True)
        
        # Add IDs
        for idx, topic in enumerate(topics_data, start=1):
            topic["id"] = idx
        
        return {
            "topics": topics_data,
            "total_reviews": len(all_reviews),
            "total_topics": len(topics_data)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating topic overview: {str(e)}")

#sara: topicRatingCard
@router.get("/company/{company_id}/topic-ratings-timeseries")
async def topic_ratings_timeseries(
    company_id: int,
    source: Literal["employee", "candidates"] = Query(..., description="employee or candidates"),
    granularity: Literal["month", "year"] = Query("month", description="month or year"),
    start: Optional[str] = Query(None, description="ISO date/time, e.g. 2023-01-01"),
    end: Optional[str] = Query(None, description="ISO date/time, e.g. 2024-12-31"),
):
    """
    Returns average star-ratings per topic grouped by month/year for a company.
    Output format fits a line chart: [{period: 'YYYY-MM', topicA: 3.2, ...}, ...]
    """
    try:
        return get_topic_rating_timeseries(
            source=source,
            company_id=company_id,
            granularity=granularity,
            start=start,
            end=end,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error building topic ratings timeseries: {str(e)}")


def analyze_topic(
    topic_name: str,
    keywords: List[str],
    rating_fields: List[str],
    all_reviews: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Analyze a specific topic across all reviews.
    
    Returns a dictionary matching the format expected by TopicOverviewCard.jsx
    """
    # Text fields to search
    text_fields = [
        'stellenbeschreibung', 'verbesserungsvorschlaege',  # candidates
        'jobbeschreibung', 'gut_am_arbeitgeber_finde_ich',  # employee
        'schlecht_am_arbeitgeber_finde_ich', 'titel'
    ]
    
    # Find mentions and collect data
    mentions = []
    ratings = []
    monthly_ratings = defaultdict(list)
    example_texts = []
    typical_statements = []
    review_details = []
    
    for review in all_reviews:
        # Check if topic is mentioned in text fields
        mentioned = False
        mention_texts = []
        full_review_text = []
        
        for field in text_fields:
            text = review.get(field, "")
            if text and isinstance(text, str):
                text_lower = text.lower()
                for keyword_pattern in keywords:
                    if re.search(keyword_pattern, text_lower, re.IGNORECASE):
                        mentioned = True
                        # Extract sentence containing keyword
                        sentences = re.split(r'[.!?]+', text)
                        for sentence in sentences:
                            if re.search(keyword_pattern, sentence, re.IGNORECASE) and len(sentence.strip()) > 20:
                                mention_texts.append(sentence.strip())
                                break
                        
                        # Collect full text from all relevant fields
                        full_review_text.append(f"{field}: {text}")
                        break
        
        if mentioned:
            mentions.append(review)
            
            # Determine source type (employee or candidate)
            source_type = "Mitarbeiter" if 'gut_am_arbeitgeber_finde_ich' in review else "Bewerber"
            
            # Get employee status if available
            employer_status = review.get("status", "Unbekannt")
            
            # Collect example texts with full review details
            if mention_texts:
                for text in mention_texts[:3]:
                    example_texts.append(clean_html_text(text))
                    review_details.append({
                        "id": review.get("id"),
                        "preview": clean_html_text(text),
                        "fullReview": {
                            "titel": clean_html_text(review.get("titel", "Keine Titel")),
                            "datum": review.get("datum"),
                            "durchschnittsbewertung": review.get("durchschnittsbewertung"),
                            "status": employer_status,
                            "sourceType": source_type,
                            "gut_am_arbeitgeber": clean_html_text(review.get("gut_am_arbeitgeber_finde_ich", "")),
                            "schlecht_am_arbeitgeber": clean_html_text(review.get("schlecht_am_arbeitgeber_finde_ich", "")),
                            "verbesserungsvorschlaege": clean_html_text(review.get("verbesserungsvorschlaege", "")),
                            "stellenbeschreibung": clean_html_text(review.get("stellenbeschreibung", "")),
                            "jobbeschreibung": clean_html_text(review.get("jobbeschreibung", "")),
                            # Include all star ratings
                            "ratings": {
                                "arbeitsatmosphaere": review.get("sternebewertung_arbeitsatmosphaere"),
                                "image": review.get("sternebewertung_image"),
                                "work_life_balance": review.get("sternebewertung_work_life_balance"),
                                "karriere_weiterbildung": review.get("sternebewertung_karriere_weiterbildung"),
                                "gehalt_sozialleistungen": review.get("sternebewertung_gehalt_sozialleistungen"),
                                "kollegenzusammenhalt": review.get("sternebewertung_kollegenzusammenhalt"),
                                "umwelt_sozialbewusstsein": review.get("sternebewertung_umwelt_sozialbewusstsein"),
                                "vorgesetztenverhalten": review.get("sternebewertung_vorgesetztenverhalten"),
                                "kommunikation": review.get("sternebewertung_kommunikation"),
                                "interessante_aufgaben": review.get("sternebewertung_interessante_aufgaben"),
                                "umgang_mit_aelteren_kollegen": review.get("sternebewertung_umgang_mit_aelteren_kollegen"),
                                "arbeitsbedingungen": review.get("sternebewertung_arbeitsbedingungen"),
                                "gleichberechtigung": review.get("sternebewertung_gleichberechtigung")
                            }
                        }
                    })
            
            # Collect ratings
            avg_rating = review.get("durchschnittsbewertung")
            if avg_rating:
                ratings.append(float(avg_rating))
            
            # Collect specific rating fields
            for field in rating_fields:
                field_rating = review.get(field)
                if field_rating:
                    ratings.append(float(field_rating))
            
            # Group by month for timeline
            date_str = review.get("datum")
            if date_str:
                try:
                    date = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
                    month_key = date.strftime("%b")
                    if avg_rating:
                        monthly_ratings[month_key].append(float(avg_rating))
                except:
                    pass
    
    # Calculate average rating
    avg_rating = round(sum(ratings) / len(ratings), 1) if ratings else 0.0
    
    # Determine sentiment based on rating
    if avg_rating >= 3.5:
        sentiment = "Positiv"
        color = "green"
    elif avg_rating >= 2.5:
        sentiment = "Neutral"
        color = "orange"
    else:
        sentiment = "Negativ"
        color = "red"
    
    # Create timeline data (all available months, sorted chronologically)
    timeline_data = []
    months_order = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"]
    
    # Collect all dates from reviews to determine the full time range
    all_dates = []
    for review in mentions:
        date_str = review.get("datum")
        if date_str:
            try:
                date = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
                all_dates.append(date)
            except:
                pass
    
    if all_dates:
        # Find the earliest and latest dates
        min_date = min(all_dates)
        max_date = max(all_dates)
        
        # Generate all months between min and max date
        current_date = min_date.replace(day=1)
        end_date = max_date.replace(day=1)
        
        # Create a dictionary to store month-year combinations with their ratings
        monthly_data = defaultdict(list)
        for review in mentions:
            date_str = review.get("datum")
            avg_rating_review = review.get("durchschnittsbewertung")
            if date_str and avg_rating_review:
                try:
                    date = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
                    month_year_key = f"{months_order[date.month - 1]} {date.year}"
                    monthly_data[month_year_key].append(float(avg_rating_review))
                except:
                    pass
        
        # Generate timeline for all months in range
        while current_date <= end_date:
            month_name = months_order[current_date.month - 1]
            month_year_key = f"{month_name} {current_date.year}"
            
            if month_year_key in monthly_data and monthly_data[month_year_key]:
                month_avg = sum(monthly_data[month_year_key]) / len(monthly_data[month_year_key])
                timeline_data.append({
                    "month": month_year_key,
                    "rating": round(month_avg, 1),
                    "year": current_date.year,
                    "monthNum": current_date.month
                })
            
            # Move to next month
            if current_date.month == 12:
                current_date = current_date.replace(year=current_date.year + 1, month=1)
            else:
                current_date = current_date.replace(month=current_date.month + 1)
    
    # Select typical statements (up to 13 most relevant - 3 for "Typische Aussagen" + 10 for "Beispiel-Review")
    # Randomize the selection to show different examples each time
    if review_details:
        # Shuffle to get random examples
        random.shuffle(review_details)
        # Take up to 13 random examples
        selected_reviews = review_details[:13]
        typical_statements = [detail["preview"] for detail in selected_reviews]
    else:
        typical_statements = [f"Keine spezifischen Aussagen zu {topic_name} gefunden"]
        selected_reviews = [{
            "id": None,
            "preview": typical_statements[0],
            "fullReview": None
        }]
    
    # Select one example
    example = typical_statements[0] if typical_statements else f"Thema: {topic_name}"
    if len(example) > 80:
        example = example[:77] + "..."
    
    return {
        "topic": topic_name,
        "frequency": len(mentions),
        "avgRating": avg_rating,
        "sentiment": sentiment,
        "example": example,
        "color": color,
        "timelineData": timeline_data,
        "typicalStatements": typical_statements,
        "reviewDetails": selected_reviews  # Use the randomly selected reviews
    }


