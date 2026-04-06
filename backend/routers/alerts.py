from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from pydantic import BaseModel
from mock_data import MOCK_ALERTS, MOCK_POLICIES

router = APIRouter(prefix="/api/alerts", tags=["alerts"])

class StatusUpdate(BaseModel):
    status: str

@router.get("")
def list_alerts(
    status: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    service: Optional[str] = Query(None),
):
    alerts = MOCK_ALERTS.copy()
    if status and status != "All":
        alerts = [a for a in alerts if a["status"] == status]
    if severity and severity != "All":
        alerts = [a for a in alerts if a["severity"] == severity]
    if service and service != "All":
        alerts = [a for a in alerts if a["service"] == service]

    counts = {
        "total": len(MOCK_ALERTS),
        "open": sum(1 for a in MOCK_ALERTS if a["status"] == "Open"),
        "investigating": sum(1 for a in MOCK_ALERTS if a["status"] == "Investigating"),
        "closed": sum(1 for a in MOCK_ALERTS if a["status"] == "Closed"),
        "critical": sum(1 for a in MOCK_ALERTS if a["severity"] == "Critical"),
        "high": sum(1 for a in MOCK_ALERTS if a["severity"] == "High"),
        "medium": sum(1 for a in MOCK_ALERTS if a["severity"] == "Medium"),
        "low": sum(1 for a in MOCK_ALERTS if a["severity"] == "Low"),
    }
    return {"alerts": alerts, "counts": counts}

@router.get("/policies")
def list_policies():
    return {
        "policies": MOCK_POLICIES,
        "total": len(MOCK_POLICIES),
        "enabled": sum(1 for p in MOCK_POLICIES if p["enabled"]),
    }

@router.get("/{alert_id}")
def get_alert(alert_id: str):
    alert = next((a for a in MOCK_ALERTS if a["id"] == alert_id), None)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return alert

@router.put("/{alert_id}/status")
def update_alert_status(alert_id: str, body: StatusUpdate):
    alert = next((a for a in MOCK_ALERTS if a["id"] == alert_id), None)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    valid_statuses = ["Open", "Investigating", "Closed"]
    if body.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Status must be one of {valid_statuses}")
    alert["status"] = body.status
    return {"success": True, "alert": alert}
