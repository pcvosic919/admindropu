from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, List
import csv, io
from mock_data import MOCK_REPORTS, MOCK_USERS, MOCK_TEAMS_MEMBERS, MOCK_ALERTS, fmt, tw_past
from graph_deps import get_graph
from graph_client import GraphClient
from graph_transforms import transform_user, build_admin_roles_map, build_mfa_map

router = APIRouter(prefix="/api/reports", tags=["reports"])


class ScheduleRequest(BaseModel):
    reportId: str
    frequency: str
    time: str
    recipients: List[str]
    format: str


# ── Report data builders ──────────────────────────────────────────────────────

def _users_to_csv(users: list) -> str:
    buf = io.StringIO()
    fields = ["displayName", "userPrincipalName", "userType", "department",
              "jobTitle", "accountEnabled", "mfaEnabled", "isAdmin",
              "daysInactive", "riskLevel", "riskReason", "lastSignIn"]
    writer = csv.DictWriter(buf, fieldnames=fields, extrasaction="ignore")
    writer.writeheader()
    writer.writerows(users)
    return buf.getvalue()


def _teams_to_csv(members: list) -> str:
    buf = io.StringIO()
    fields = ["displayName", "upn", "userType", "teamName", "role", "daysInactive", "riskLevel", "riskReason"]
    writer = csv.DictWriter(buf, fieldnames=fields, extrasaction="ignore")
    writer.writeheader()
    writer.writerows(members)
    return buf.getvalue()


def _alerts_to_csv(alerts: list) -> str:
    buf = io.StringIO()
    fields = ["title", "severity", "status", "service", "triggeredAt", "affectedUser", "location"]
    writer = csv.DictWriter(buf, fieldnames=fields, extrasaction="ignore")
    writer.writeheader()
    writer.writerows(alerts)
    return buf.getvalue()


# ── Category → data function map ──────────────────────────────────────────────

_CATEGORY_COLS = {
    "Identity":    ["displayName", "userPrincipalName", "userType", "department", "jobTitle", "accountEnabled", "mfaEnabled", "isAdmin", "daysInactive", "riskLevel"],
    "Teams":       ["displayName", "upn", "userType", "teamName", "role", "daysInactive", "riskLevel"],
    "Security":    ["title", "severity", "status", "service", "triggeredAt", "affectedUser"],
    "Compliance":  ["displayName", "userPrincipalName", "userType", "mfaEnabled", "isAdmin", "riskLevel"],
    "Exchange":    ["title", "severity", "status", "service", "triggeredAt"],
    "SharePoint":  ["displayName", "upn", "userType", "siteName", "permissionLevel", "riskLevel"],
    "DLP":         ["title", "severity", "status", "service", "triggeredAt"],
    "Devices":     ["displayName", "userPrincipalName", "department", "riskLevel"],
    "CloudApps":   ["displayName", "userPrincipalName", "department", "riskLevel"],
}


async def _build_csv(report: dict, graph: Optional[GraphClient]) -> str:
    category = report.get("category", "Identity")
    fields = _CATEGORY_COLS.get(category, ["displayName", "userPrincipalName", "riskLevel"])

    if category in ("Security", "Exchange", "DLP", "CloudApps"):
        if graph:
            rows = await graph.get_security_alerts(top=200)
        else:
            rows = MOCK_ALERTS
    elif category == "Teams":
        rows = MOCK_TEAMS_MEMBERS
    else:
        # Identity, Compliance, SharePoint, Devices
        if graph:
            import asyncio
            raw, roles, mfa = await asyncio.gather(
                graph.get_users(), graph.get_role_assignments(), graph.get_mfa_registration()
            )
            rows = [transform_user(u, build_admin_roles_map(roles), build_mfa_map(mfa)) for u in raw]
        else:
            rows = MOCK_USERS

    buf = io.StringIO()
    writer = csv.DictWriter(buf, fieldnames=fields, extrasaction="ignore")
    writer.writeheader()
    writer.writerows(rows)
    return buf.getvalue()


# ── Endpoints ────────────────────────────────────────────────────────────────

@router.get("")
def list_reports(category: Optional[str] = None, search: Optional[str] = None):
    reports = MOCK_REPORTS.copy()
    if category and category != "All":
        reports = [r for r in reports if r["category"] == category]
    if search:
        s = search.lower()
        reports = [r for r in reports if s in r["name"].lower() or s in r["description"].lower()]
    categories = list(set(r["category"] for r in MOCK_REPORTS))
    return {"reports": reports, "total": len(reports), "categories": sorted(categories)}


@router.get("/{report_id}/generate")
async def generate_report(report_id: str, graph: Optional[GraphClient] = Depends(get_graph)):
    report = next((r for r in MOCK_REPORTS if r["id"] == report_id), None)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    csv_content = await _build_csv(report, graph)
    filename = f"{report['name'].replace(' ', '_')}_{fmt(tw_past(minutes=0))[:10]}.csv"

    # Update lastGenerated
    report["lastGenerated"] = fmt(tw_past(minutes=0))

    return StreamingResponse(
        iter([csv_content.encode("utf-8-sig")]),  # utf-8-sig for Excel BOM
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


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
