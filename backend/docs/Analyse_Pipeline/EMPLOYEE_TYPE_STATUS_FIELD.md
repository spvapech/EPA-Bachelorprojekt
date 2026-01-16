# Employee Type Weighting - Implementierungshinweis

## Status-Feld in der Datenbank

⚠️ **Wichtig**: Das `status` Feld in der `employee` Tabelle enthält derzeit **numerische Werte** (0.0, 1.0) statt Text-Labels.

### Aktueller Zustand
```sql
-- In der employee Tabelle:
status NUMERIC  -- enthält 0.0, 1.0, NULL, etc.
```

### Empfohlene Änderung für optimale Nutzung

Um die volle Funktionalität der Employee Type Gewichtung zu nutzen, sollte das `status` Feld Text-Werte enthalten:

```sql
-- Empfohlene Änderung:
ALTER TABLE employee 
ALTER COLUMN status TYPE TEXT;

-- Oder neues Feld hinzufügen:
ALTER TABLE employee 
ADD COLUMN employee_type TEXT;

-- Mögliche Werte:
-- 'Manager' oder 'Führungskraft'
-- 'Employee' oder 'Angestellter'
-- 'Student' oder 'Praktikant'
-- 'Nicht-Employee' oder 'Ex-Employee'
```

### Workaround für aktuelle Implementierung

Falls die Datenbank-Struktur nicht geändert werden kann, gibt es zwei Optionen:

#### Option 1: Mapping der numerischen Werte

Erweitere die `get_employee_type_weight()` Methode:

```python
def get_employee_type_weight(self, status: Optional[str]) -> float:
    if not status:
        return self.employee_type_weights['default']
    
    # Konvertiere zu String falls numerisch
    status_str = str(status)
    
    # Mapping für numerische Werte (anpassen nach tatsächlicher Bedeutung)
    numeric_mappings = {
        '0.0': 'Student',           # Beispiel: 0.0 = Student
        '1.0': 'Employee',          # Beispiel: 1.0 = Employee
        '2.0': 'Manager',           # Beispiel: 2.0 = Manager
        '3.0': 'Nicht-Employee',    # Beispiel: 3.0 = Nicht-Employee
    }
    
    if status_str in numeric_mappings:
        mapped_type = numeric_mappings[status_str]
        return self.employee_type_weights[mapped_type]
    
    # Rest der Funktion...
```

#### Option 2: Zusätzliches Feld in der Datenbank

```sql
-- Füge ein neues Feld hinzu ohne das bestehende zu ändern
ALTER TABLE employee 
ADD COLUMN mitarbeiter_typ TEXT;

-- Setze Werte basierend auf bestehendem status Feld
UPDATE employee 
SET mitarbeiter_typ = CASE 
    WHEN status = 0.0 THEN 'Student'
    WHEN status = 1.0 THEN 'Employee'
    WHEN status = 2.0 THEN 'Manager'
    ELSE 'Nicht-Employee'
END;
```

### Verwendung mit aktuellem Schema

Mit dem aktuellen Schema (numerisches `status` Feld) funktioniert die Gewichtung trotzdem, aber:
- Alle unbekannten numerischen Werte erhalten die Standard-Gewichtung (1.0)
- Die Gewichtungs-Statistiken zeigen "0.0", "1.0" statt "Student", "Employee"

### Beispiel-Ausgabe mit numerischem Status

```
Gewichtungs-Statistiken:
  0.0: 22 Dokumente (44.0%) × Gewicht 1.0
  1.0: 26 Dokumente (52.0%) × Gewicht 1.0
```

Um die volle Funktionalität zu nutzen, sollten die Status-Werte als Text gespeichert werden:

```
Gewichtungs-Statistiken:
  Student: 22 Dokumente (44.0%) × Gewicht 0.8
  Employee: 26 Dokumente (52.0%) × Gewicht 1.5
```

## Migration Script (Optional)

Falls du die Datenbank anpassen möchtest:

```sql
-- backend/migrations/005_add_employee_type.sql

-- Füge neues Feld hinzu
ALTER TABLE employee 
ADD COLUMN IF NOT EXISTS employee_type TEXT;

-- Erstelle Index für bessere Performance
CREATE INDEX IF NOT EXISTS idx_employee_type ON employee(employee_type);

-- Beispiel-Mapping (anpassen nach tatsächlicher Bedeutung der Zahlen)
COMMENT ON COLUMN employee.employee_type IS 
'Mitarbeitertyp: Manager, Employee, Student, Nicht-Employee';
```

## Testing mit echten Daten

Um zu testen, ob die Status-Werte in deiner Datenbank Text oder Zahlen sind:

```bash
cd backend
uv run python -c "
from services.topic_model_service import TopicModelDatabase
db = TopicModelDatabase()
data = db.get_employee_texts_with_metadata(limit=10)
for item in data[:5]:
    print(f'Status: {item.get(\"status\")} (Type: {type(item.get(\"status\")).__name__})')
"
```

Das zeigt dir den Typ und Wert des Status-Feldes.
