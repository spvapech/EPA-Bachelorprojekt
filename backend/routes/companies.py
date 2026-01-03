from fastapi import APIRouter, Query
from database.supabase_client import get_supabase_client

router = APIRouter(prefix="/api", tags=["Companies"])
supabase = get_supabase_client()

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
def search_companies():
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