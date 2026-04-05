from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from mock_data import MOCK_REPORTS, fmt, tw_past

router = APIRouter(prefix="/api/reports", tags=["reports"])

class ScheduleRequest(BaseModel):
    reportId: str
    frequency: str
    time: str
    recipients: List[str]
    format: str

@router.get("")
def list_reports(category: Optional[str] = None, search: Optional[str] = None):
    reports = MOCK_REPORTS.copy()
    if category and category != "All":
        reports = [r for r in reports if r["category"] == category]
    if search:
        s = search.lower()
        reports = [r for r in reports if s in r["name"].lower() or s in r["description"].lower()]
    categories = list(set(r["category"] for r in MOCK_REPORTS))
    return {
        "reports": reports,
        "total": len(reports),
        "categories": sorted(categories),
    }

@router.get("/{report_id}")
def get_report(report_id: str):
    report = next((r for r in MOCK_REPORTS if r["id"] == report_id), None)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return {
        **report,
        "data": {
            "rows": 142,
            "columns": ["User", "Department", "Last Sign-in", "MFA Status", "Risk Level"],
            "generatedAt": fmt(tw_past(minutes=5)),
            "preview": [
                {"User": "James Smith", "Department": "Engineering", "Last Sign-in": "2026-03-28", "MFA Status": "Enabled", "Risk Level": "Low"},
                {"User": "Mary Johnson", "Department": "Finance", "Last Sign-in": "2026-03-27", "MFA Status": "Enabled", "Risk Level": "Low"},
                {"User": "John Williams", "Department": "HR", "Last Sign-in": "2026-01-15", "MFA Status": "Disabled", "Risk Level": "High"},
            ],
        }
    }

@router.post("/schedule")
def schedule_report(body: ScheduleRequest):
    report = next((r for r in MOCK_REPORTS if r["id"] == body.reportId), None)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    report["isScheduled"] = True
    report["frequency"] = body.frequency
    report["format"] = body.format
    return {
        "success": True,
        "message": f"Report '{report['name']}' scheduled successfully",
        "schedule": {
            "reportId": body.reportId,
            "frequency": body.frequency,
            "time": body.time,
            "recipients": body.recipients,
            "format": body.format,
            "nextRun": fmt(tw_past(days=-1)),
        }
    }
