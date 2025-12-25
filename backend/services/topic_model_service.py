"""
Database service for LDA Topic Model integration with Supabase.
Handles fetching text data and storing topic analysis results.
"""

from database.supabase_client import get_supabase_client
from typing import List, Dict, Any, Optional
from datetime import datetime


class TopicModelDatabase:
    """Service for database operations related to topic modeling."""
    
    def __init__(self):
        self.supabase = get_supabase_client()
    
    def get_candidate_texts(
        self, 
        fields: Optional[List[str]] = None,
        limit: Optional[int] = None
    ) -> List[str]:
        """
        Fetch text data from candidates table for topic analysis.
        
        Args:
            fields: List of text fields to fetch (default: stellenbeschreibung, verbesserungsvorschlaege)
            limit: Maximum number of records to fetch
            
        Returns:
            List of combined text strings
        """
        if fields is None:
            fields = ['stellenbeschreibung', 'verbesserungsvorschlaege']
        
        # Build query
        query = self.supabase.table('candidates').select(','.join(fields))
        
        if limit:
            query = query.limit(limit)
        
        response = query.execute()
        
        # Combine text fields
        texts = []
        for record in response.data:
            combined_text = ' '.join([
                str(record.get(field, '')) 
                for field in fields 
                if record.get(field)
            ])
            if combined_text.strip():
                texts.append(combined_text)
        
        return texts
    
    def get_employee_texts(
        self, 
        fields: Optional[List[str]] = None,
        limit: Optional[int] = None
    ) -> List[str]:
        """
        Fetch text data from employee table for topic analysis.
        
        Args:
            fields: List of text fields to fetch
            limit: Maximum number of records to fetch
            
        Returns:
            List of combined text strings
        """
        if fields is None:
            fields = [
                'jobbeschreibung', 
                'gut_am_arbeitgeber_finde_ich',
                'schlecht_am_arbeitgeber_finde_ich',
                'verbesserungsvorschlaege'
            ]
        
        # Build query
        query = self.supabase.table('employee').select(','.join(fields))
        
        if limit:
            query = query.limit(limit)
        
        response = query.execute()
        
        # Combine text fields
        texts = []
        for record in response.data:
            combined_text = ' '.join([
                str(record.get(field, '')) 
                for field in fields 
                if record.get(field)
            ])
            if combined_text.strip():
                texts.append(combined_text)
        
        return texts
    
    def get_all_texts(
        self,
        source: str = "both",
        limit: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Fetch all text data for topic analysis.
        
        Args:
            source: Data source - "candidates", "employee", or "both"
            limit: Maximum number of records to fetch per source
            
        Returns:
            Dictionary with texts and metadata
        """
        result = {
            "texts": [],
            "sources": [],
            "metadata": {
                "candidates_count": 0,
                "employee_count": 0,
                "total_count": 0
            }
        }
        
        if source in ["candidates", "both"]:
            candidate_texts = self.get_candidate_texts(limit=limit)
            result["texts"].extend(candidate_texts)
            result["sources"].extend(["candidates"] * len(candidate_texts))
            result["metadata"]["candidates_count"] = len(candidate_texts)
        
        if source in ["employee", "both"]:
            employee_texts = self.get_employee_texts(limit=limit)
            result["texts"].extend(employee_texts)
            result["sources"].extend(["employee"] * len(employee_texts))
            result["metadata"]["employee_count"] = len(employee_texts)
        
        result["metadata"]["total_count"] = len(result["texts"])
        
        return result
    
    def get_candidate_by_id(self, candidate_id: int) -> Optional[Dict[str, Any]]:
        """
        Fetch a specific candidate record.
        
        Args:
            candidate_id: ID of the candidate
            
        Returns:
            Candidate record or None
        """
        response = self.supabase.table('candidates').select('*').eq('id', candidate_id).execute()
        
        if response.data:
            return response.data[0]
        return None
    
    def get_employee_by_id(self, employee_id: int) -> Optional[Dict[str, Any]]:
        """
        Fetch a specific employee record.
        
        Args:
            employee_id: ID of the employee
            
        Returns:
            Employee record or None
        """
        response = self.supabase.table('employee').select('*').eq('id', employee_id).execute()
        
        if response.data:
            return response.data[0]
        return None
    
    def get_statistics(self) -> Dict[str, Any]:
        """
        Get database statistics for topic modeling.
        
        Returns:
            Dictionary with statistics
        """
        # Count candidates
        candidates_response = self.supabase.table('candidates').select('id', count='exact').execute()
        
        # Count employees
        employee_response = self.supabase.table('employee').select('id', count='exact').execute()
        
        return {
            "candidates_total": candidates_response.count,
            "employee_total": employee_response.count,
            "total_records": candidates_response.count + employee_response.count,
            "timestamp": datetime.now().isoformat()
        }
