"""
API routes for file upload functionality.
"""

from fastapi import APIRouter, UploadFile, File, HTTPException
from services.excel_service import ExcelProcessor

router = APIRouter(prefix="/api", tags=["Upload"])

excel_processor = ExcelProcessor()


@router.post("/upload-excel")
async def upload_excel(file: UploadFile = File(...)):
    """
    Upload and process an Excel file with candidate or employee data.
    
    The file will be automatically processed and data will be imported
    into the appropriate table based on the column structure.
    """
    # Validate file type
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Only .xlsx and .xls files are allowed."
        )
    
    # Process the file
    result = await excel_processor.process_excel_file(file)
    
    if result["status"] == "error":
        raise HTTPException(
            status_code=400,
            detail=result.get("error", "Failed to process Excel file")
        )
    
    return result
