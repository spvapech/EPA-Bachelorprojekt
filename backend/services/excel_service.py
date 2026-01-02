"""
Excel file upload and processing service.
Handles uploading Excel files with candidate and employee data.
"""

from fastapi import UploadFile
import pandas as pd
from typing import Dict, Any, List
from database.supabase_client import get_supabase_client
import io

import re
from datetime import datetime

def slugify(s: str) -> str:
    s = str(s).strip().lower()
    s = s.replace("ä", "ae").replace("ö", "oe").replace("ü", "ue").replace("ß", "ss")
    s = re.sub(r"[^a-z0-9]+", "_", s)
    return s.strip("_")

def normalize_columns(df: pd.DataFrame) -> pd.DataFrame:
    # Achtung: bei doppelten Excel-Headern macht pandas daraus "Sternbewertung", "Sternbewertung.1", ...
    df = df.copy()
    df.columns = [slugify(c) for c in df.columns]
    return df

def is_sternbewertung_col(col: str) -> bool:
    return col == "sternbewertung" or col.startswith("sternbewertung_") or col.startswith("sternbewertung_") or col.startswith("sternbewertung")  # robust

def extract_sternbewertungen_by_position(df: pd.DataFrame) -> pd.DataFrame:
    """
    Wenn 'sternbewertung' vorkommt, dann gehört der Wert zum Topic in der NÄCHSTEN Spalte.
    Wir erzeugen: sternbewertung_<topic>
    """
    df = df.copy()
    cols = list(df.columns)

    for i, col in enumerate(cols):
        if col.startswith("sternbewertung"):  # fängt auch sternbewertung_1 usw. ab
            if i + 1 >= len(cols):
                continue
            topic_col = cols[i + 1]  # nächste Spalte
            topic_slug = slugify(topic_col)
            new_col = f"sternbewertung_{topic_slug}"

            # Werte rüberkopieren (numerisch)
            df[new_col] = pd.to_numeric(df[col], errors="coerce")

    return df


class ExcelProcessor:
    """Process Excel files and import data into database."""
    
    def __init__(self):
        self.supabase = get_supabase_client()
    
    async def process_excel_file(self, file: UploadFile) -> Dict[str, Any]:
        """
        Process an uploaded Excel file and import data.
        
        Args:
            file: Uploaded Excel file
            
        Returns:
            Dictionary with import statistics
        """
        try:
            # Read Excel file
            contents = await file.read()
            df = pd.read_excel(io.BytesIO(contents))

            # 1: Spalten normalisieren (Titel -> titel, Update Datum -> update_datum, ...)
            df = normalize_columns(df)

            # 2: Sternbewertung-Mehrfachspalten in eindeutige Spalten überführen
            df = extract_sternbewertungen_by_position(df)
            
            # Detect data type (candidates or employees) based on columns
            is_candidates = self._is_candidates_data(df)
            is_employees = self._is_employee_data(df)

            """ chat-vorschlag
            def _is_candidates_data(self, df: pd.DataFrame) -> bool:
            # Kandidatenfiles enthalten typischerweise stellenbeschreibung oder bewerbung/gespraech topics
            return "stellenbeschreibung" in df.columns or any(c.startswith("sternbewertung_professionalitaet") for c in df.columns)

            def _is_employee_data(self, df: pd.DataFrame) -> bool:
            return "jobbeschreibung" in df.columns or "gut_am_arbeitgeber_finde_ich" in df.columns or any(c.startswith("sternbewertung_arbeitsatmosphaere") for c in df.columns)
            """


            result = {
                "status": "success",
                "filename": file.filename,
                "total_rows": len(df),
                "imported": {
                    "candidates": 0,
                    "employees": 0
                },
                "errors": []
            }
            
            if is_candidates:
                result["imported"]["candidates"] = await self._import_candidates(df)
            elif is_employees:
                result["imported"]["employees"] = await self._import_employees(df)
            else:
                result["status"] = "error"
                result["errors"].append("Unbekanntes Datenformat. Erwartete Spalten nicht gefunden.")
            
            return result
            
        except Exception as e:
            return {
                "status": "error",
                "filename": file.filename,
                "error": str(e)
            }
    
    def _is_candidates_data(self, df: pd.DataFrame) -> bool:
        # Candidate-Dateien haben typischerweise stellenbeschreibung ODER spezifische Topics (nach Sternbewertung-Mapping)
        if "stellenbeschreibung" in df.columns:
            return True
        # Falls Candidate-Topics bei euch vorkommen:
        return any(c.startswith("sternbewertung_") for c in df.columns) and "jobbeschreibung" not in df.columns

    def _is_employee_data(self, df: pd.DataFrame) -> bool:
        # Employee-Dateien haben typischerweise jobbeschreibung oder die "gut/schlecht am arbeitgeber..." Spalten
        return (
            "jobbeschreibung" in df.columns
            or "gut_am_arbeitgeber_finde_ich" in df.columns
            or "schlecht_am_arbeitgeber_finde_ich" in df.columns
        )

    async def _import_candidates(self, df: pd.DataFrame) -> int:
        """Import candidate data from dataframe."""
        imported = 0
        
        for _, row in df.iterrows():
            try:
                # Calculate average rating from star ratings
                star_ratings = []
                star_columns = [col for col in df.columns if col.startswith('sternebewertung_')]
                
                for col in star_columns:
                    if pd.notna(row.get(col)):
                        star_ratings.append(float(row[col]))
                
                avg_rating = sum(star_ratings) / len(star_ratings) if star_ratings else None
                rounded_avg = round(avg_rating, 1) if avg_rating else None
                
                # Prepare data
                data = {
                    "titel": str(row.get("titel", "")) if pd.notna(row.get("titel")) else None,
                    "status": str(row.get("status", "")) if pd.notna(row.get("status")) else None,
                    "durchschnittsbewertung": avg_rating,
                    "gerundete_durchschnittsbewertung": rounded_avg,
                    "stellenbeschreibung": str(row.get("stellenbeschreibung", "")) if pd.notna(row.get("stellenbeschreibung")) else None,
                    "verbesserungsvorschlaege": str(row.get("verbesserungsvorschlaege", "")) if pd.notna(row.get("verbesserungsvorschlaege")) else None,
                    # "datum": parse_dt(row.get("datum")),
                    # "update_datum": parse_dt(row.get("update_datum")),

                }
                
                # Add star ratings
                for col in star_columns:
                    if pd.notna(row.get(col)):
                        data[col] = float(row[col])

                # nur bekannte DB-Spalten senden (wichtig!)
                allowed = {
                    "titel", "status", "datum", "update_datum",
                    "durchschnittsbewertung", "gerundete_durchschnittsbewertung",
                    "stellenbeschreibung", "verbesserungsvorschlaege",
                    # plus alle sternbewertung_* Spalten, die es in candidates wirklich gibt
                }

                data = {k: v for k, v in data.items() if k in allowed}

                # Insert into database
                self.supabase.table("candidates").insert(data).execute()
                imported += 1
                
            except Exception as e:
                print(f"Error importing candidate row: {e}")
                continue
        
        return imported
    
    async def _import_employees(self, df: pd.DataFrame) -> int:
        """Import employee data from dataframe."""
        imported = 0
        
        for _, row in df.iterrows():
            try:
                # Calculate average rating from star ratings
                star_ratings = []
                star_columns = [col for col in df.columns if col.startswith('sternebewertung_')]
                
                for col in star_columns:
                    if pd.notna(row.get(col)):
                        star_ratings.append(float(row[col]))
                
                avg_rating = sum(star_ratings) / len(star_ratings) if star_ratings else None
                rounded_avg = round(avg_rating, 1) if avg_rating else None
                
                # Prepare data
                data = {
                    "titel": str(row.get("titel", "")) if pd.notna(row.get("titel")) else None,
                    "status": str(row.get("status", "")) if pd.notna(row.get("status")) else None,
                    "durchschnittsbewertung": avg_rating,
                    "gerundete_durchschnittsbewertung": rounded_avg,
                    "jobbeschreibung": str(row.get("jobbeschreibung", "")) if pd.notna(row.get("jobbeschreibung")) else None,
                    "gut_am_arbeitgeber_finde_ich": str(row.get("gut_am_arbeitgeber_finde_ich", "")) if pd.notna(row.get("gut_am_arbeitgeber_finde_ich")) else None,
                    "schlecht_am_arbeitgeber_finde_ich": str(row.get("schlecht_am_arbeitgeber_finde_ich", "")) if pd.notna(row.get("schlecht_am_arbeitgeber_finde_ich")) else None,
                    "verbesserungsvorschlaege": str(row.get("verbesserungsvorschlaege", "")) if pd.notna(row.get("verbesserungsvorschlaege")) else None,
                }
                
                # Add star ratings
                for col in star_columns:
                    if pd.notna(row.get(col)):
                        data[col] = float(row[col])
                
                # Insert into database
                self.supabase.table("employee").insert(data).execute()
                imported += 1
                
            except Exception as e:
                print(f"Error importing employee row: {e}")
                continue
        
        return imported
