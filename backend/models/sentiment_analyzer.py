"""
Sentiment Analysis for German Text
Analyzes sentiment (positive, neutral, negative) of text data.
Uses a simple rule-based approach with German sentiment words.
"""

from typing import Dict, Any, List


class SentimentAnalyzer:
    """
    Sentiment analyzer for German text using a lexicon-based approach.
    """
    
    def __init__(self):
        """Initialize the sentiment analyzer with German sentiment words."""
        # Positive German words
        self.positive_words = {
            'gut', 'super', 'toll', 'ausgezeichnet', 'hervorragend', 'wunderbar',
            'großartig', 'perfekt', 'prima', 'klasse', 'spitze', 'fantastisch',
            'exzellent', 'positiv', 'freundlich', 'hilfsbereit', 'nett', 'angenehm',
            'zufrieden', 'glücklich', 'erfreut', 'begeistert', 'motiviert',
            'professionell', 'kompetent', 'effizient', 'flexibel', 'modern',
            'innovativ', 'kreativ', 'dynamisch', 'fair', 'transparent', 'offen',
            'wertschätzend', 'respektvoll', 'unterstützend', 'fördernd',
            'beste', 'besten', 'besser', 'hervorragend', 'empfehlenswert',
            'liebe', 'mögen', 'gefällt', 'schätzen', 'loben', 'dankbar'
        }
        
        # Negative German words
        self.negative_words = {
            'schlecht', 'schlechtes', 'schlechte', 'mies', 'katastrophal', 
            'furchtbar', 'schrecklich', 'grausam', 'schlimm', 'übel', 'negativ',
            'unzufrieden', 'enttäuscht', 'frustriert', 'ärgerlich', 'stressig',
            'chaotisch', 'unprofessionell', 'inkompetent', 'ineffizient',
            'unfreundlich', 'unhöflich', 'respektlos', 'unfair', 'intransparent',
            'mangelhaft', 'ungenügend', 'unzureichend', 'problematisch',
            'schwierig', 'kompliziert', 'langsam', 'veraltet', 'altmodisch',
            'niedrig', 'gering', 'wenig', 'kaum', 'nicht', 'nie', 'kein',
            'fehlt', 'fehlen', 'vermissen', 'mangel', 'problem', 'probleme',
            'kritik', 'kritisch', 'beschwerde', 'ärger', 'hassen', 'hasse'
        }
        
        # Intensifiers
        self.intensifiers = {
            'sehr': 1.5,
            'extrem': 2.0,
            'total': 1.8,
            'absolut': 1.8,
            'wirklich': 1.3,
            'ziemlich': 1.2,
            'besonders': 1.5,
            'außerordentlich': 2.0,
            'unglaublich': 1.8
        }
        
        # Negations
        self.negations = {
            'nicht', 'kein', 'keine', 'keiner', 'keines', 'nie', 'niemals',
            'nimmer', 'nirgends', 'nichts', 'kaum', 'wenig'
        }
    
    def analyze_sentiment(self, text: str) -> Dict[str, Any]:
        """
        Analyze sentiment of a single text.
        
        Args:
            text: Input text to analyze
            
        Returns:
            Dictionary with sentiment analysis results:
            - polarity: float between -1 (negative) and 1 (positive)
            - sentiment: 'positive', 'neutral', or 'negative'
            - subjectivity: float between 0 (objective) and 1 (subjective)
            - confidence: float representing confidence in the classification
        """
        if not text or not isinstance(text, str) or not text.strip():
            return {
                "polarity": 0.0,
                "sentiment": "neutral",
                "subjectivity": 0.0,
                "confidence": 0.0
            }
        
        try:
            # Tokenize and lowercase
            words = text.lower().split()
            
            if not words:
                return {
                    "polarity": 0.0,
                    "sentiment": "neutral",
                    "subjectivity": 0.0,
                    "confidence": 0.0
                }
            
            positive_score = 0.0
            negative_score = 0.0
            sentiment_word_count = 0
            
            # Analyze each word with context
            for i, word in enumerate(words):
                # Check for intensifier
                multiplier = 1.0
                if i > 0 and words[i-1] in self.intensifiers:
                    multiplier = self.intensifiers[words[i-1]]
                
                # Check for negation
                is_negated = False
                if i > 0 and words[i-1] in self.negations:
                    is_negated = True
                if i > 1 and words[i-2] in self.negations:
                    is_negated = True
                
                # Score the word
                if word in self.positive_words:
                    sentiment_word_count += 1
                    score = 1.0 * multiplier
                    if is_negated:
                        negative_score += score
                    else:
                        positive_score += score
                        
                elif word in self.negative_words:
                    sentiment_word_count += 1
                    score = 1.0 * multiplier
                    if is_negated:
                        positive_score += score
                    else:
                        negative_score += score
            
            # Calculate polarity
            if positive_score + negative_score > 0:
                polarity = (positive_score - negative_score) / (positive_score + negative_score)
            else:
                polarity = 0.0
            
            # Calculate subjectivity (ratio of sentiment words to total words)
            subjectivity = min(sentiment_word_count / len(words), 1.0)
            
            # Classify sentiment
            if polarity > 0.1:
                sentiment = "positive"
            elif polarity < -0.1:
                sentiment = "negative"
            else:
                sentiment = "neutral"
            
            # Calculate confidence
            confidence = min(abs(polarity) + (subjectivity * 0.5), 1.0)
            
            return {
                "polarity": float(polarity),
                "sentiment": sentiment,
                "subjectivity": float(subjectivity),
                "confidence": float(confidence)
            }
            
        except Exception as e:
            # Fallback on error
            return {
                "polarity": 0.0,
                "sentiment": "neutral",
                "subjectivity": 0.0,
                "confidence": 0.0,
                "error": str(e)
            }
    
    def analyze_batch(self, texts: List[str]) -> List[Dict[str, Any]]:
        """
        Analyze sentiment for multiple texts.
        
        Args:
            texts: List of texts to analyze
            
        Returns:
            List of sentiment analysis results
        """
        return [self.analyze_sentiment(text) for text in texts]
    
    def get_sentiment_summary(self, sentiments: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Get summary statistics for a list of sentiment analyses.
        
        Args:
            sentiments: List of sentiment analysis results
            
        Returns:
            Summary statistics
        """
        if not sentiments:
            return {
                "count": 0,
                "avg_polarity": 0.0,
                "avg_subjectivity": 0.0,
                "positive_count": 0,
                "neutral_count": 0,
                "negative_count": 0,
                "positive_percentage": 0.0,
                "neutral_percentage": 0.0,
                "negative_percentage": 0.0
            }
        
        count = len(sentiments)
        avg_polarity = sum(s["polarity"] for s in sentiments) / count
        avg_subjectivity = sum(s["subjectivity"] for s in sentiments) / count
        
        positive_count = sum(1 for s in sentiments if s["sentiment"] == "positive")
        neutral_count = sum(1 for s in sentiments if s["sentiment"] == "neutral")
        negative_count = sum(1 for s in sentiments if s["sentiment"] == "negative")
        
        return {
            "count": count,
            "avg_polarity": float(avg_polarity),
            "avg_subjectivity": float(avg_subjectivity),
            "positive_count": positive_count,
            "neutral_count": neutral_count,
            "negative_count": negative_count,
            "positive_percentage": float(positive_count / count * 100),
            "neutral_percentage": float(neutral_count / count * 100),
            "negative_percentage": float(negative_count / count * 100)
        }
    
    def categorize_by_sentiment(
        self, 
        items: List[Dict[str, Any]], 
        sentiment_key: str = "sentiment_analysis"
    ) -> Dict[str, List[Dict[str, Any]]]:
        """
        Categorize items by their sentiment.
        
        Args:
            items: List of items with sentiment analysis
            sentiment_key: Key in items that contains sentiment analysis
            
        Returns:
            Dictionary with items grouped by sentiment
        """
        categorized = {
            "positive": [],
            "neutral": [],
            "negative": []
        }
        
        for item in items:
            sentiment = item.get(sentiment_key, {}).get("sentiment", "neutral")
            categorized[sentiment].append(item)
        
        return categorized
