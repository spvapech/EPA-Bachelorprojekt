"""
API routes for LDA Topic Model functionality.
Provides endpoints for training, analyzing, and managing topic models.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from models.lda_topic_model import LDATopicAnalyzer
from services.topic_model_service import TopicModelDatabase
import os

router = APIRouter(prefix="/api/topics", tags=["Topic Modeling"])

# Global model instance
_topic_analyzer: Optional[LDATopicAnalyzer] = None
_topic_db = TopicModelDatabase()


class TrainModelRequest(BaseModel):
    """Request model for training LDA model."""
    source: str = Field(
        default="both", 
        description="Data source: 'candidates', 'employee', or 'both'"
    )
    num_topics: int = Field(
        default=5, 
        ge=2, 
        le=20, 
        description="Number of topics to extract"
    )
    limit: Optional[int] = Field(
        default=None,
        description="Maximum number of records to use per source"
    )


class PredictTopicsRequest(BaseModel):
    """Request model for predicting topics."""
    text: str = Field(..., description="Text to analyze")
    threshold: float = Field(
        default=0.1,
        ge=0.0,
        le=1.0,
        description="Minimum probability threshold"
    )


class AnalyzeRecordRequest(BaseModel):
    """Request model for analyzing a specific record."""
    record_id: int = Field(..., description="ID of the record")
    source: str = Field(..., description="Source: 'candidates' or 'employee'")
    fields: Optional[List[str]] = Field(
        default=None,
        description="Specific fields to analyze"
    )


@router.get("/status")
async def get_model_status():
    """Get current model status and information."""
    global _topic_analyzer
    
    if _topic_analyzer is None:
        return {
            "status": "not_initialized",
            "message": "No model has been trained yet"
        }
    
    model_info = _topic_analyzer.get_model_info()
    return model_info


@router.get("/database/stats")
async def get_database_stats():
    """Get database statistics for topic modeling."""
    try:
        stats = _topic_db.get_statistics()
        return {
            "status": "success",
            "data": stats
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get statistics: {str(e)}")


@router.post("/train")
async def train_model(request: TrainModelRequest):
    """
    Train a new LDA topic model on data from the database.
    
    This endpoint fetches text data from the specified source(s) and trains
    an LDA model to discover topics.
    """
    global _topic_analyzer
    
    try:
        # Fetch text data from database
        data = _topic_db.get_all_texts(
            source=request.source,
            limit=request.limit
        )
        
        if not data["texts"]:
            raise HTTPException(
                status_code=400,
                detail="No text data found in database. Please add data first."
            )
        
        # Initialize new analyzer
        _topic_analyzer = LDATopicAnalyzer(num_topics=request.num_topics)
        
        # Train model
        result = _topic_analyzer.train_model(data["texts"])
        
        # Add metadata
        result["data_sources"] = data["metadata"]
        
        # Save model
        try:
            model_path = _topic_analyzer.save_model()
            result["model_saved"] = True
            result["model_path"] = model_path
        except Exception as e:
            result["model_saved"] = False
            result["save_error"] = str(e)
        
        return {
            "status": "success",
            "message": f"Model trained successfully on {data['metadata']['total_count']} documents",
            "data": result
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to train model: {str(e)}"
        )


@router.get("/topics")
async def get_topics(num_words: int = 10):
    """
    Get all discovered topics with their top words.
    
    Args:
        num_words: Number of top words to return per topic (default: 10)
    """
    global _topic_analyzer
    
    if _topic_analyzer is None:
        raise HTTPException(
            status_code=400,
            detail="No model trained yet. Please train a model first."
        )
    
    try:
        topics = _topic_analyzer.get_topics(num_words=num_words)
        return {
            "status": "success",
            "num_topics": len(topics),
            "topics": topics
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get topics: {str(e)}"
        )


@router.post("/predict")
async def predict_topics(request: PredictTopicsRequest):
    """
    Predict topics for a given text.
    
    This endpoint analyzes the provided text and returns the most relevant topics
    with their probabilities.
    """
    global _topic_analyzer
    
    if _topic_analyzer is None:
        raise HTTPException(
            status_code=400,
            detail="No model trained yet. Please train a model first."
        )
    
    try:
        topics = _topic_analyzer.predict_topics(
            text=request.text,
            threshold=request.threshold
        )
        
        return {
            "status": "success",
            "text_preview": request.text[:100] + "..." if len(request.text) > 100 else request.text,
            "num_topics_found": len(topics),
            "topics": topics
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to predict topics: {str(e)}"
        )


@router.post("/analyze-record")
async def analyze_record(request: AnalyzeRecordRequest):
    """
    Analyze a specific record from the database.
    
    This endpoint fetches a record by ID and analyzes its text content
    to determine relevant topics.
    """
    global _topic_analyzer
    
    if _topic_analyzer is None:
        raise HTTPException(
            status_code=400,
            detail="No model trained yet. Please train a model first."
        )
    
    try:
        # Fetch record
        if request.source == "candidates":
            record = _topic_db.get_candidate_by_id(request.record_id)
            default_fields = ['stellenbeschreibung', 'verbesserungsvorschlaege']
        elif request.source == "employee":
            record = _topic_db.get_employee_by_id(request.record_id)
            default_fields = [
                'jobbeschreibung',
                'gut_am_arbeitgeber_finde_ich',
                'schlecht_am_arbeitgeber_finde_ich',
                'verbesserungsvorschlaege'
            ]
        else:
            raise HTTPException(
                status_code=400,
                detail="Invalid source. Must be 'candidates' or 'employee'"
            )
        
        if not record:
            raise HTTPException(
                status_code=404,
                detail=f"Record with ID {request.record_id} not found in {request.source}"
            )
        
        # Get fields to analyze
        fields_to_analyze = request.fields if request.fields else default_fields
        
        # Combine text from specified fields
        combined_text = ' '.join([
            str(record.get(field, ''))
            for field in fields_to_analyze
            if record.get(field)
        ])
        
        if not combined_text.strip():
            return {
                "status": "no_content",
                "message": "No text content found in specified fields",
                "record_id": request.record_id,
                "source": request.source
            }
        
        # Analyze topics
        topics = _topic_analyzer.predict_topics(combined_text)
        
        return {
            "status": "success",
            "record_id": request.record_id,
            "source": request.source,
            "fields_analyzed": fields_to_analyze,
            "text_length": len(combined_text),
            "topics": topics,
            "record_data": {
                "titel": record.get("titel"),
                "status": record.get("status"),
                "datum": record.get("datum")
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to analyze record: {str(e)}"
        )


@router.get("/models/list")
async def list_saved_models():
    """List all saved model files."""
    models_dir = "models"
    
    if not os.path.exists(models_dir):
        return {
            "status": "success",
            "models": [],
            "message": "No models directory found"
        }
    
    # Find all .model files
    model_files = [
        f.replace(".model", "")
        for f in os.listdir(models_dir)
        if f.endswith(".model")
    ]
    
    return {
        "status": "success",
        "count": len(model_files),
        "models": sorted(model_files, reverse=True)
    }


@router.post("/models/load")
async def load_saved_model(model_name: str):
    """Load a previously saved model."""
    global _topic_analyzer
    
    models_dir = "models"
    model_path = os.path.join(models_dir, model_name)
    
    if not os.path.exists(f"{model_path}.model"):
        raise HTTPException(
            status_code=404,
            detail=f"Model '{model_name}' not found"
        )
    
    try:
        _topic_analyzer = LDATopicAnalyzer()
        metadata = _topic_analyzer.load_model(model_path)
        
        return {
            "status": "success",
            "message": f"Model '{model_name}' loaded successfully",
            "metadata": metadata
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to load model: {str(e)}"
        )
