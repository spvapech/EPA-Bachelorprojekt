from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel
from database.supabase_client import get_supabase_client

router = APIRouter(prefix="/api", tags=["Companies"])
supabase = get_supabase_client()

class CompanyCreate(BaseModel):
    name: str

@router.get("/companies/search")
def search_companies(q: str = Query(..., min_length=1)):
    # Vorschläge aus DB, case-insensitive, enthält-suche
    res = (
        supabase.table("companies")
        .select("id,name")
        .ilike("name", f"%{q}%")
        .order("name", desc=False)
        .limit(10)
        .execute()
    )
    return res.data or []
@router.get("/companies")
def get_companies():
    # Vorschläge aus DB, case-insensitive, enthält-suche
    res = (
        supabase.table("companies")
        .select("id,name")
        .order("name", desc=False)
        .limit(10)
        .execute()
    )
    data = res.data or []
    for row in data:
        if "id" in row and row["id"] is not None:
            row["id"] = str(row["id"])
    return data

@router.post("/companies/")
def create_company(company: CompanyCreate):
    """
    Creates a new company in the database.
    Returns the created company with its ID.
    """
    # Check if company already exists
    existing = (
        supabase.table("companies")
        .select("id,name")
        .ilike("name", company.name)
        .execute()
    )
    
    if existing.data:
        # Company already exists, return it
        return existing.data[0]
    
    # Create new company
    result = (
        supabase.table("companies")
        .insert({"name": company.name})
        .execute()
    )
    
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create company")
    
    return result.data[0]