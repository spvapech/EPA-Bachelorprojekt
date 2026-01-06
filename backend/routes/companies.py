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

@router.get("/companies/{company_id}/ratings/avg")
def get_company_ratings_avg(company_id: int):
    res = supabase.rpc("get_employee_ratings_avg", {"p_company_id": company_id}).execute()

    if res.data is None:
        raise HTTPException(status_code=500, detail="No data returned from RPC")

    # res.data ist meistens: [ { ... } ]
    return res.data[0] if len(res.data) > 0 else {}


@router.get("/companies/{company_id}/ratings")
def get_company_ratings_avg(company_id: int):
    res = supabase.rpc("get_employee_ratings_avg", {"p_company_id": company_id}).execute()

    if res.data is None:
        raise HTTPException(status_code=500, detail="No data returned from RPC")

    row = res.data[0] if len(res.data) > 0 else {}

    # Durchschnitt der Durchschnitte berechnen (nur numerische Werte)
    values = []
    for v in row.values():
        if v is None:
            continue
        # Supabase kann float, int, Decimal oder sogar string liefern -> sauber konvertieren
        try:
            values.append(float(v))
        except (TypeError, ValueError):
            continue

    avg_overall = round(sum(values) / len(values), 2) if values else None

    # Du gibst jetzt Kategorien + Gesamt-Ø zurück
    return {
        
        "avg_overall": avg_overall,
        
    }
    
    
    
