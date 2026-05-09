"""
API routes for file upload functionality.
"""

import io
import math
import pandas as pd
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


@router.post("/preview-excel")
async def preview_excel(file: UploadFile = File(...)):
    """Return the first 10 rows of an Excel file without persisting any data."""
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Only .xlsx and .xls files are allowed."
        )
    try:
        content = await file.read()
        df = pd.read_excel(io.BytesIO(content), nrows=10)
        columns = df.columns.tolist()

        def safe(v):
            if v is None:
                return None
            if isinstance(v, float) and math.isnan(v):
                return None
            return str(v) if not isinstance(v, (int, float, bool, str)) else v

        rows = [[safe(cell) for cell in row] for row in df.values.tolist()]
        return {"filename": file.filename, "columns": columns, "rows": rows, "total_columns": len(columns)}
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"Could not parse Excel file: {exc}")

