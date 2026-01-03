"""
API routes for file upload functionality.
"""

from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from services.excel_service import ExcelProcessor

router = APIRouter(prefix="/api", tags=["Upload"])

excel_processor = ExcelProcessor()

@router.post("/upload-excel")
async def upload_excel(
    file: UploadFile = File(...),
    company_id: int = Form(...),
):
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Only .xlsx and .xls files are allowed."
        )

    result = await excel_processor.process_excel_file(file, company_id=company_id)

    if result["status"] == "error":
        raise HTTPException(
            status_code=400,
            detail=result.get("errors", result.get("error", "Failed to process Excel file"))
        )

    return result

