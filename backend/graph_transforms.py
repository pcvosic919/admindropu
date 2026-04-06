"""
Transform Microsoft Graph API responses into the shape expected by the frontend.
"""
from datetime import datetime, timezone
from typing import Optional
from graph_client import days_since


# ── SKU display name mapping ─────────────────────────────────────────────────

_SKU_NAMES = {
    "SPE_E3": "Microsoft 365 E3",
    "SPE_E5": "Microsoft 365 E5",
    "O365_BUSINESS_PREMIUM": "Microsoft 365 Business Premium",
    "O365_BUSINESS_ESSENTIALS": "Microsoft 365 Business Basic",
    "ENTERPRISEPACK": "Office 365 E3",
    "ENTERPRISEPREMIUM": "Office 365 E5",
    "AAD_PREMIUM": "Azure AD Premium P1",
    "AAD_PREMIUM_P2": "Azure AD Premium P2",
    "EMS": "Enterprise Mobility + Security E3",
    "EMSPREMIUM": "Enterprise Mobility + Security E5",
    "POWER_BI_STANDARD": "Power BI (free)",
    "POWER_BI_PRO": "Power BI Pro",
    "TEAMS_EXPLORATORY": "Microsoft Teams Exploratory",
    "FLOW_FREE": "Power Automate Free",
    "WINDOWS_STORE": "Windows Store for Business",
    "VISIOCLIENT": "Visio Plan 2",
    "PROJECTCLIENT": "Project Plan 3",
}

_SKU_COSTS = {
    "SPE_E3": 36.0, "SPE_E5": 57.0, "O365_BUSINESS_PREMIUM": 22.0,
    "O365_BUSINESS_ESSENTIALS": 6.0, "ENTERPRISEPACK": 23.0,
    "ENTERPRISEPREMIUM": 38.0, "AAD_PREMIUM": 6.0, "AAD_PREMIUM_P2": 9.0,
    "EMS": 14.8, "EMSPREMIUM": 22.4, "POWER_BI_PRO": 10.0,
    "VISIOCLIENT": 28.0, "PROJECTCLIENT": 30.0,
}


def _risk_level(days_inactive: int, user_type: str, account_enabled: bool) -> tuple[str, str]:
    if not account_enabled:
        return "High", "Account disabled"
    if user_type == "Guest" and days_inactive > 90:
        return "Critical", f"Guest inactive {days_inactive} days"
    if user_type == "Guest" and days_inactive > 30:
        return "High", f"Guest inactive {days_inactive} days"
    if days_inactive > 180:
        return "Critical", f"Inactive {days_inactive} days"
    if days_inactive > 90:
        return "High", f"Inactive {days_inactive} days"
    if days_inactive > 30:
        return "Medium", f"Inactive {days_inactive} days"
    return "Low", "Active"


# ── Users ─────────────────────────────────────────────────────────────────────

def transform_user(u: dict, admin_roles_map: dict = None, mfa_map: dict = None) -> dict:
    uid = u.get("id", "")
    sign_in = u.get("signInActivity") or {}
    last_sign_in = sign_in.get("lastSignInDateTime") or sign_in.get("lastNonInteractiveSignInDateTime")
    days_inactive = days_since(last_sign_in)
    user_type = u.get("userType") or "Member"
    enabled = u.get("accountEnabled", True)
    risk_level, risk_reason = _risk_level(days_inactive, user_type, enabled)

    admin_roles = admin_roles_map.get(uid, []) if admin_roles_map else []
    mfa_enabled = mfa_map.get(uid, False) if mfa_map else None  # None = unknown

    return {
        "id": uid,
        "displayName": u.get("displayName", ""),
        "userPrincipalName": u.get("userPrincipalName", ""),
        "userType": user_type,
        "accountEnabled": enabled,
        "department": u.get("department") or "—",
        "jobTitle": u.get("jobTitle") or "—",
        "mfaEnabled": mfa_enabled if mfa_enabled is not None else True,
        "isAdmin": len(admin_roles) > 0,
        "adminRoles": admin_roles,
        "assignedLicenses": [lic.get("skuId", "") for lic in (u.get("assignedLicenses") or [])],
        "lastSignIn": last_sign_in or "",
        "daysInactive": days_inactive,
        "riskLevel": risk_level,
        "riskReason": risk_reason,
        "createdDateTime": u.get("createdDateTime", ""),
        "mail": u.get("mail") or u.get("userPrincipalName", ""),
    }


def build_admin_roles_map(role_assignments: list) -> dict:
    """Returns {userId: [roleName, ...]}"""
    result: dict[str, list] = {}
    for ra in role_assignments:
        pid = ra.get("principalId")
        role_def = ra.get("roleDefinition") or {}
        role_name = role_def.get("displayName", "Admin")
        if pid:
            result.setdefault(pid, []).append(role_name)
    return result


def build_mfa_map(mfa_registrations: list) -> dict:
    """Returns {userId: bool}"""
    result = {}
    for r in mfa_registrations:
        uid = r.get("id") or r.get("userId")
        if uid:
            result[uid] = r.get("isMfaRegistered", False) or r.get("isMfaCapable", False)
    return result


# ── Licenses ──────────────────────────────────────────────────────────────────

def transform_sku(sku: dict) -> dict:
    sku_id = sku.get("skuPartNumber", "")
    display_name = _SKU_NAMES.get(sku_id, sku.get("skuPartNumber", sku_id))
    units = sku.get("prepaidUnits") or {}
    total = units.get("enabled", 0)
    consumed = sku.get("consumedUnits", 0)
    cost = _SKU_COSTS.get(sku_id, 0.0)
    return {
        "id": sku.get("id", sku_id),
        "name": display_name,
        "skuId": sku_id,
        "total": total,
        "assigned": consumed,
        "available": max(0, total - consumed),
        "costPerUser": cost,
        "status": "Active" if sku.get("capabilityStatus") == "Enabled" else sku.get("capabilityStatus", "Unknown"),
    }


# ── Groups ────────────────────────────────────────────────────────────────────

def transform_group(g: dict, member_count: int = 0, has_external: bool = False) -> dict:
    group_types = g.get("groupTypes") or []
    is_unified = "Unified" in group_types
    is_dynamic = "DynamicMembership" in group_types
    return {
        "id": g.get("id", ""),
        "displayName": g.get("displayName", ""),
        "description": g.get("description") or "",
        "groupType": "Microsoft 365" if is_unified else ("Security" if g.get("securityEnabled") else "Distribution"),
        "memberCount": member_count,
        "hasExternalMembers": has_external,
        "isDynamic": is_dynamic,
        "visibility": g.get("visibility") or "Private",
        "mailEnabled": g.get("mailEnabled", False),
        "mail": g.get("mail") or "",
        "riskLevel": "High" if has_external else "Low",
        "createdDateTime": g.get("createdDateTime", ""),
    }


# ── Security alerts ───────────────────────────────────────────────────────────

_ALERT_SEVERITY_MAP = {"high": "Critical", "medium": "High", "low": "Medium", "informational": "Low"}
_ALERT_STATUS_MAP = {"active": "Open", "resolved": "Resolved", "inProgress": "Investigating"}

def transform_alert(a: dict) -> dict:
    sev = a.get("severity", "medium").lower()
    status = a.get("status", "active")
    return {
        "id": a.get("id", ""),
        "title": a.get("title", "Security Alert"),
        "description": a.get("description", ""),
        "severity": _ALERT_SEVERITY_MAP.get(sev, "Medium"),
        "status": _ALERT_STATUS_MAP.get(status, status),
        "category": a.get("category", "General"),
        "createdDateTime": a.get("createdDateTime", ""),
        "lastUpdateDateTime": a.get("lastUpdateDateTime", ""),
        "userPrincipalName": (a.get("userStates") or [{}])[0].get("userPrincipalName", ""),
        "ipAddress": (a.get("networkConnections") or [{}])[0].get("sourceAddress", ""),
        "activityGroupName": a.get("activityGroupName", ""),
    }


# ── Secure Score ──────────────────────────────────────────────────────────────

def transform_secure_score(ss: dict) -> dict:
    current = int(ss.get("currentScore", 0))
    max_score = int(ss.get("maxScore", 100))
    avg = ss.get("averageComparativeScores") or []
    comparison = next((x.get("averageScore", 50) for x in avg if x.get("basis") == "AllTenants"), 50)
    history_points = ss.get("controlScores") or []
    return {
        "current": current,
        "maxScore": max_score,
        "percentage": round(current / max_score * 100) if max_score else 0,
        "comparisonToSimilarCompanies": int(comparison),
        "activeUserCount": ss.get("activeUserCount", 0),
        "history": [],
    }


# ── Dashboard summary ─────────────────────────────────────────────────────────

def build_dashboard_summary(
    users: list,
    alerts: list,
    secure_score_raw: Optional[dict],
    skus: list,
) -> dict:
    total_users = len(users)
    guest_count = sum(1 for u in users if u.get("userType") == "Guest")
    disabled_count = sum(1 for u in users if not u.get("accountEnabled", True))
    inactive_count = sum(1 for u in users if u.get("daysInactive", 0) >= 90)

    total_lic = sum(s.get("total", 0) for s in skus)
    used_lic = sum(s.get("assigned", 0) for s in skus)
    lic_rate = round(used_lic / total_lic * 100, 1) if total_lic else 0

    critical_alerts = sum(1 for a in alerts if a.get("severity") in ("Critical", "high"))

    ss_current = 0
    ss_max = 100
    if secure_score_raw:
        ss_current = int(secure_score_raw.get("currentScore", 0))
        ss_max = int(secure_score_raw.get("maxScore", 100))

    return {
        "totalUsers": total_users,
        "guestUsers": guest_count,
        "disabledAccounts": disabled_count,
        "activeAlerts": len(alerts),
        "criticalAlerts": critical_alerts,
        "secureScore": ss_current,
        "maxScore": ss_max,
        "licenseUtilization": lic_rate,
        "inactiveUsers": inactive_count,
    }
