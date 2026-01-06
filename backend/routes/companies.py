from fastapi import APIRouter, Query
from database.supabase_client import get_supabase_client
from datetime import datetime, timedelta, timezone

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
    
@router.get("/companies/{company_id}/ratings/trend")
def get_company_ratings_trend(company_id: int, days: int = Query(30, ge=1, le=3650)):
    print(f"Trend request for company {company_id}, days {days}")
    now = datetime.now(timezone.utc).replace(microsecond=0)
    cur_from = now - timedelta(days=days)
    prev_from = now - timedelta(days=2 * days)
    prev_to = cur_from

    cur = supabase.rpc("get_employee_ratings_avg_range", {
        "p_company_id": company_id,
        "p_from": cur_from.isoformat(),
        "p_to": now.isoformat(),
    }).execute()

    prev = supabase.rpc("get_employee_ratings_avg_range", {
        "p_company_id": company_id,
        "p_from": prev_from.isoformat(),
        "p_to": prev_to.isoformat(),
    }).execute()

    print(f"Cur data: {cur.data}")
    print(f"Prev data: {prev.data}")

    cur_row = cur.data[0] if cur.data else {}
    prev_row = prev.data[0] if prev.data else {}

    # optional: Meta-Felder rausfiltern, falls je vorhanden
    EXCLUDE_KEYS = {"company_id", "count", "n", "from", "to"}
    keys = (set(cur_row.keys()) | set(prev_row.keys())) - EXCLUDE_KEYS

    print(f"Keys: {keys}")
    print(f"Cur row: {cur_row}")
    print(f"Prev row: {prev_row}")

    eps = 0.05

    def to_float(x):
        try:
            return float(x) if x is not None else None
        except (TypeError, ValueError):
            return None

    result = {}
    deltas_for_overall = []

    for k in keys:
        c_val = to_float(cur_row.get(k))
        p_val = to_float(prev_row.get(k))

        print(f"Key {k}: c_val={c_val}, p_val={p_val}")

        # wenn current fehlt → keine Aussage
        if c_val is None:
            result[k] = {"score": None, "prev": p_val, "delta": None, "sign": "flat", "has_prev": p_val is not None}
            continue

        # wenn previous fehlt → NEW
        if p_val is None:
            result[k] = {"score": c_val, "prev": None, "delta": None, "sign": "new", "has_prev": False}
            continue

        # normaler Trend
        delta_raw = c_val - p_val
        sign = "flat"
        if delta_raw > eps:
            sign = "up"
        elif delta_raw < -eps:
            sign = "down"

        delta = round(delta_raw, 1)
        deltas_for_overall.append(delta_raw)

        result[k] = {"score": c_val, "prev": p_val, "delta": delta, "sign": sign, "has_prev": True}

    print(f"Deltas for overall: {deltas_for_overall}")

    overall = None
    if deltas_for_overall:
        overall = round(sum(deltas_for_overall) / len(deltas_for_overall), 1)

    print(f"Overall avgDelta: {overall}")
    print(f"Metrics: {result}")

    return {
        "days": days,
        "current_range": {"from": cur_from.isoformat(), "to": now.isoformat()},
        "previous_range": {"from": prev_from.isoformat(), "to": prev_to.isoformat()},
        "overall": {"avgDelta": overall},
        "metrics": result,
    }    
