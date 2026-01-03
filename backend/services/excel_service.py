"""
excel_service.py

Excel file upload and processing service.
Handles uploading Excel files with candidate and employee data,
normalizes columns, maps repeated "Sternebewertung" columns to
DB columns (sternebewertung_<topic>), and imports into Supabase.

Assumptions (based on your schemas):
- Candidates Excel is identified ONLY by column "Stellenbeschreibung" (-> stellenbeschreibung).
- Employee Excel does NOT have that column.
- Both Excel types have repeated "Sternebewertung" columns where the next column is the topic/comment.
- Candidates DB does NOT store topic comments (only the ratings); Employee DB stores BOTH ratings + topic comments.
"""

from __future__ import annotations

from fastapi import UploadFile
import pandas as pd
from typing import Dict, Any, List, Optional
from database.supabase_client import get_supabase_client
import io
import re


# ----------------------------
# Whitelists (DB column names)
# ----------------------------

CANDIDATES_ALLOWED = {
    "titel","status","datum","update_datum",
    "durchschnittsbewertung","gerundete_durchschnittsbewertung",
    "stellenbeschreibung","verbesserungsvorschlaege",
    "sternebewertung_erklaerung_der_weiteren_schritte",
    "sternebewertung_zufriedenstellende_reaktion",
    "sternebewertung_vollstaendigkeit_der_infos",
    "sternebewertung_zufriedenstellende_antworten",
    "sternebewertung_angenehme_atmosphaere",
    "sternebewertung_professionalitaet_des_gespraechs",
    "sternebewertung_wertschaetzende_behandlung",
    "sternebewertung_erwartbarkeit_des_prozesses",
    "sternebewertung_zeitgerechte_zu_oder_absage",
    "sternebewertung_schnelle_antwort",
    "company_id",
}

EMPLOYEE_ALLOWED = {
    "titel","status","datum","update_datum",
    "durchschnittsbewertung","gerundete_durchschnittsbewertung",
    "jobbeschreibung",
    "gut_am_arbeitgeber_finde_ich",
    "schlecht_am_arbeitgeber_finde_ich",
    "verbesserungsvorschlaege",

    # numeric ratings
    "sternebewertung_arbeitsatmosphaere",
    "sternebewertung_image",
    "sternebewertung_work_life_balance",
    "sternebewertung_karriere_weiterbildung",
    "sternebewertung_gehalt_sozialleistungen",
    "sternebewertung_kollegenzusammenhalt",
    "sternebewertung_umwelt_sozialbewusstsein",
    "sternebewertung_vorgesetztenverhalten",
    "sternebewertung_kommunikation",
    "sternebewertung_interessante_aufgaben",
    "sternebewertung_umgang_mit_aelteren_kollegen",
    "sternebewertung_arbeitsbedingungen",
    "sternebewertung_gleichberechtigung",

    # topic text columns (existieren bei employee!)
    "arbeitsatmosphaere",
    "image",
    "work_life_balance",
    "karriere_weiterbildung",
    "gehalt_sozialleistungen",
    "kollegenzusammenhalt",
    "umwelt_sozialbewusstsein",
    "vorgesetztenverhalten",
    "kommunikation",
    "interessante_aufgaben",
    "umgang_mit_aelteren_kollegen",
    "arbeitsbedingungen",
    "gleichberechtigung",
    "company_id",
}


# ----------------------------
# Helpers
# ----------------------------

def slugify(s: str) -> str:
    s = str(s).strip().lower()
    s = s.replace("ä", "ae").replace("ö", "oe").replace("ü", "ue").replace("ß", "ss")
    s = re.sub(r"[^a-z0-9]+", "_", s)
    return s.strip("_")


def normalize_columns(df: pd.DataFrame) -> pd.DataFrame:
    """
    Normalize column names to DB-friendly snake_case-ish:
    - Lowercase
    - German umlauts replaced
    - Non-alphanum -> underscore
    """
    df = df.copy()
    df.columns = [slugify(c) for c in df.columns]
    return df


def is_sternebewertung_col(col: str) -> bool:
    """
    After normalize_columns(), repeated headers like:
    'Sternebewertung', 'Sternebewertung.1', ...
    can become:
    - 'sternebewertung', 'sternebewertung_1', 'sternebewertung_2', ...
    depending on how pandas read the file / header duplicates.
    We treat 'sternebewertung' and 'sternebewertung_<number>' as rating columns.
    """
    return col == "sternebewertung" or re.fullmatch(r"sternebewertung_\d+", col) is not None


def extract_sternebewertungen_by_position(df: pd.DataFrame) -> pd.DataFrame:
    """
    Rule:
    Each 'sternebewertung' column belongs to the topic/comment in the NEXT column.
    Create a numeric column: sternebewertung_<slug(next_col_name)>
    and keep the topic/comment column as-is (it already contains comments).

    Example:
      [sternebewertung] [arbeitsatmosphaere]  -> creates sternebewertung_arbeitsatmosphaere = numeric(sternebewertung)
      topic column 'arbeitsatmosphaere' stays with text/comments.
    """
    df = df.copy()
    cols = list(df.columns)

    for i, col in enumerate(cols):
        if is_sternebewertung_col(col):
            if i + 1 >= len(cols):
                continue

            topic_col = cols[i + 1]
            new_col = f"sternebewertung_{slugify(topic_col)}"

            # avoid overwriting if already exists
            if new_col in df.columns:
                continue

            df[new_col] = pd.to_numeric(df[col], errors="coerce")

    # Drop original repeated "sternebewertung" columns (they are intermediate)
    drop_cols = [c for c in df.columns if is_sternebewertung_col(c)]
    df = df.drop(columns=drop_cols, errors="ignore")
    return df


def to_iso_dt(val) -> Optional[str]:
    """
    Convert Excel date/time cell to ISO string for Supabase.
    Returns None if invalid/empty.
    """
    if val is None or (isinstance(val, float) and pd.isna(val)) or pd.isna(val):
        return None
    dt = pd.to_datetime(val, errors="coerce")
    if pd.isna(dt):
        return None
    # Keep timezone-naive ISO; Postgres can parse it. If you need timezone-aware, adjust here.
    return dt.isoformat()


def get_star_columns(df: pd.DataFrame) -> List[str]:
    return [c for c in df.columns if c.startswith("sternebewertung_")]


# ----------------------------
# Main service
# ----------------------------

class ExcelProcessor:
    """Process Excel files and import data into database."""

    def __init__(self):
        self.supabase = get_supabase_client()

    async def process_excel_file(self, file: UploadFile) -> Dict[str, Any]:
        """
        Process an uploaded Excel file and import into candidates OR employee table.

        Returns:
            {
              "status": "success" | "error",
              "filename": "...",
              "total_rows": int,
              "detected_type": "candidates" | "employees" | None,
              "imported": {"candidates": int, "employees": int},
              "errors": [ ... ],
            }
        """
        result: Dict[str, Any] = {
            "status": "success",
            "filename": getattr(file, "filename", None),
            "total_rows": 0,
            "detected_type": None,
            "imported": {"candidates": 0, "employees": 0},
            "errors": [],
        }

        try:
            contents = await file.read()
            if not contents:
                result["status"] = "error"
                result["errors"].append("Leere Datei oder Upload-Inhalt leer.")
                return result

            # Read excel
            df = pd.read_excel(io.BytesIO(contents))
            result["total_rows"] = int(len(df))

            # Normalize & map ratings
            df = normalize_columns(df)
            df = extract_sternebewertungen_by_position(df)

            # Detect type
            if self._is_candidates_data(df):
                result["detected_type"] = "candidates"
                imported, errors = await self._import_candidates(df)
                result["imported"]["candidates"] = imported
                result["errors"].extend(errors)
            else:
                result["detected_type"] = "employees"
                imported, errors = await self._import_employees(df)
                result["imported"]["employees"] = imported
                result["errors"].extend(errors)

            # If nothing imported and errors exist, mark as error
            if (result["imported"]["candidates"] + result["imported"]["employees"]) == 0 and result["errors"]:
                result["status"] = "error"

            return result

        except Exception as e:
            result["status"] = "error"
            result["errors"].append(str(e))
            return result

    def _is_candidates_data(self, df: pd.DataFrame) -> bool:
        # Candidates Excel is ONLY recognized by "stellenbeschreibung"
        return "stellenbeschreibung" in df.columns

    # Employee is the "else" case; kept for completeness/debugging
    def _is_employee_data(self, df: pd.DataFrame) -> bool:
        return "stellenbeschreibung" not in df.columns

    async def _import_candidates(self, df: pd.DataFrame) -> tuple[int, List[str]]:
        """
        Candidates:
        - store base fields + star ratings that exist in candidates DB
        - DO NOT store topic comment columns (not present in candidates table)
        - whitelist by CANDIDATES_ALLOWED
        """
        errors: List[str] = []
        rows_to_insert: List[Dict[str, Any]] = []

        # only star columns that exist in DB schema
        star_columns = [c for c in get_star_columns(df) if c in CANDIDATES_ALLOWED]

        for idx, row in df.iterrows():
            try:
                data: Dict[str, Any] = {
                    "titel": str(row.get("titel")) if pd.notna(row.get("titel")) else None,
                    "status": str(row.get("status")) if pd.notna(row.get("status")) else None,
                    "datum": to_iso_dt(row.get("datum")),
                    "update_datum": to_iso_dt(row.get("update_datum")),
                    "stellenbeschreibung": str(row.get("stellenbeschreibung")) if pd.notna(row.get("stellenbeschreibung")) else None,
                    "verbesserungsvorschlaege": str(row.get("verbesserungsvorschlaege")) if pd.notna(row.get("verbesserungsvorschlaege")) else None,
                }

                # Ratings
                vals: List[float] = []
                for c in star_columns:
                    v = row.get(c)
                    if pd.notna(v):
                        fv = float(v)
                        data[c] = fv
                        vals.append(fv)

                # Average: prefer Excel values if present; else compute from stars
                avg_excel = row.get("durchschnittsbewertung")
                rnd_excel = row.get("gerundete_durchschnittsbewertung")

                avg = float(avg_excel) if pd.notna(avg_excel) else (sum(vals) / len(vals) if vals else None)
                rnd = float(rnd_excel) if pd.notna(rnd_excel) else (round(avg, 1) if avg is not None else None)

                data["durchschnittsbewertung"] = avg
                data["gerundete_durchschnittsbewertung"] = rnd

                # Whitelist (critical)
                data = {k: v for k, v in data.items() if k in CANDIDATES_ALLOWED}

                rows_to_insert.append(data)

            except Exception as e:
                errors.append(f"candidates row {idx}: {e}")

        if rows_to_insert:
            try:
                self.supabase.table("candidates").insert(rows_to_insert).execute()
            except Exception as e:
                # If bulk insert fails, surface the error (often schema mismatch)
                errors.append(f"candidates bulk insert failed: {e}")
                # Optional: fallback to per-row insert for debugging (commented)
                # for i, payload in enumerate(rows_to_insert):
                #     try:
                #         self.supabase.table("candidates").insert(payload).execute()
                #     except Exception as ee:
                #         errors.append(f"candidates row insert failed (batch index {i}): {ee}")
                return 0, errors

        return len(rows_to_insert), errors

    async def _import_employees(self, df: pd.DataFrame) -> tuple[int, List[str]]:
        """
        Employees:
        - store base fields
        - store star ratings columns that exist in employee DB
        - store topic comment columns (text) that exist in employee DB
        - whitelist by EMPLOYEE_ALLOWED
        """
        errors: List[str] = []
        rows_to_insert: List[Dict[str, Any]] = []

        star_columns = [c for c in get_star_columns(df) if c in EMPLOYEE_ALLOWED]

        # topic text columns = columns present in DF that are also allowed and not rating columns
        # (plus excluding base columns we already map explicitly)
        base_cols = {
            "titel", "status", "datum", "update_datum",
            "durchschnittsbewertung", "gerundete_durchschnittsbewertung",
            "jobbeschreibung", "gut_am_arbeitgeber_finde_ich",
            "schlecht_am_arbeitgeber_finde_ich", "verbesserungsvorschlaege",
            "stellenbeschreibung",  # not used for employee
        }

        topic_text_cols = [
            c for c in df.columns
            if (c in EMPLOYEE_ALLOWED and not c.startswith("sternebewertung_") and c not in base_cols)
        ]

        for idx, row in df.iterrows():
            try:
                data: Dict[str, Any] = {
                    "titel": str(row.get("titel")) if pd.notna(row.get("titel")) else None,
                    "status": str(row.get("status")) if pd.notna(row.get("status")) else None,
                    "datum": to_iso_dt(row.get("datum")),
                    "update_datum": to_iso_dt(row.get("update_datum")),
                    "jobbeschreibung": str(row.get("jobbeschreibung")) if pd.notna(row.get("jobbeschreibung")) else None,
                    "gut_am_arbeitgeber_finde_ich": str(row.get("gut_am_arbeitgeber_finde_ich")) if pd.notna(row.get("gut_am_arbeitgeber_finde_ich")) else None,
                    "schlecht_am_arbeitgeber_finde_ich": str(row.get("schlecht_am_arbeitgeber_finde_ich")) if pd.notna(row.get("schlecht_am_arbeitgeber_finde_ich")) else None,
                    "verbesserungsvorschlaege": str(row.get("verbesserungsvorschlaege")) if pd.notna(row.get("verbesserungsvorschlaege")) else None,
                }

                # Topic comments (text)
                for c in topic_text_cols:
                    v = row.get(c)
                    if pd.notna(v):
                        data[c] = str(v)

                # Ratings
                vals: List[float] = []
                for c in star_columns:
                    v = row.get(c)
                    if pd.notna(v):
                        fv = float(v)
                        data[c] = fv
                        vals.append(fv)

                # Average: prefer Excel values; else compute
                avg_excel = row.get("durchschnittsbewertung")
                rnd_excel = row.get("gerundete_durchschnittsbewertung")

                avg = float(avg_excel) if pd.notna(avg_excel) else (sum(vals) / len(vals) if vals else None)
                rnd = float(rnd_excel) if pd.notna(rnd_excel) else (round(avg, 1) if avg is not None else None)

                data["durchschnittsbewertung"] = avg
                data["gerundete_durchschnittsbewertung"] = rnd

                # Whitelist (critical)
                data = {k: v for k, v in data.items() if k in EMPLOYEE_ALLOWED}

                rows_to_insert.append(data)

            except Exception as e:
                errors.append(f"employees row {idx}: {e}")

        if rows_to_insert:
            try:
                # Your table name is "employee" per schema
                self.supabase.table("employee").insert(rows_to_insert).execute()
            except Exception as e:
                errors.append(f"employees bulk insert failed: {e}")
                return 0, errors

        return len(rows_to_insert), errors
