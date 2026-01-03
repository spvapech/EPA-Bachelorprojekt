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
