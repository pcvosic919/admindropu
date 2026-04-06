from fastapi import APIRouter, Query, Depends
from typing import Optional
from mock_data import MOCK_USERS, MOCK_LICENSES
from graph_deps import get_graph
from graph_client import GraphClient
from graph_transforms import (
    transform_user, transform_sku,
    build_admin_roles_map, build_mfa_map,
)

router = APIRouter(prefix="/api/identity", tags=["identity"])


# ── Shared helper ────────────────────────────────────────────────────────────

async def _fetch_users_real(graph: GraphClient) -> list:
    raw_users, role_assignments, mfa_regs = await _gather_user_data(graph)
    admin_map = build_admin_roles_map(role_assignments)
    mfa_map = build_mfa_map(mfa_regs)
    return [transform_user(u, admin_map, mfa_map) for u in raw_users]


async def _gather_user_data(graph: GraphClient):
    import asyncio
    users_task = asyncio.create_task(graph.get_users())
    roles_task = asyncio.create_task(graph.get_role_assignments())
    mfa_task = asyncio.create_task(graph.get_mfa_registration())
    return await users_task, await roles_task, await mfa_task


# ── Endpoints ────────────────────────────────────────────────────────────────

@router.get("/users")
async def list_users(
    department: Optional[str] = Query(None),
    userType: Optional[str] = Query(None),
    accountEnabled: Optional[bool] = Query(None),
    search: Optional[str] = Query(None),
    graph: Optional[GraphClient] = Depends(get_graph),
):
    if graph:
        users = await _fetch_users_real(graph)
    else:
        users = MOCK_USERS.copy()

    if department:
        users = [u for u in users if u.get("department") == department]
    if userType:
        users = [u for u in users if u.get("userType") == userType]
    if accountEnabled is not None:
        users = [u for u in users if u.get("accountEnabled") == accountEnabled]
    if search:
        s = search.lower()
        users = [
            u for u in users
            if s in u.get("displayName", "").lower() or s in u.get("userPrincipalName", "").lower()
        ]

    all_depts = list(set(u.get("department", "") for u in users if u.get("department")))
    return {"users": users, "total": len(users), "departments": all_depts}


@router.get("/inactive")
async def get_inactive_users(
    days: int = Query(90),
    graph: Optional[GraphClient] = Depends(get_graph),
):
    if graph:
        users = await _fetch_users_real(graph)
    else:
        users = MOCK_USERS.copy()

    inactive = [u for u in users if u.get("daysInactive", 0) >= days and u.get("accountEnabled", True)]
    return {
        "users": inactive,
        "total": len(inactive),
        "threshold_days": days,
        "breakdown": {
            "90_120_days": sum(1 for u in inactive if 90 <= u.get("daysInactive", 0) < 120),
            "120_180_days": sum(1 for u in inactive if 120 <= u.get("daysInactive", 0) < 180),
            "180_plus_days": sum(1 for u in inactive if u.get("daysInactive", 0) >= 180),
        },
    }


@router.get("/mfa-status")
async def get_mfa_status(graph: Optional[GraphClient] = Depends(get_graph)):
    if graph:
        users = await _fetch_users_real(graph)
    else:
        users = MOCK_USERS.copy()

    total = len(users)
    enabled = [u for u in users if u.get("mfaEnabled")]
    disabled = [u for u in users if not u.get("mfaEnabled")]
    admins_without_mfa = [u for u in users if u.get("isAdmin") and not u.get("mfaEnabled")]
    return {
        "total_users": total,
        "mfa_enabled": len(enabled),
        "mfa_disabled": len(disabled),
        "mfa_rate": round(len(enabled) / total * 100, 1) if total else 0,
        "admins_without_mfa": admins_without_mfa,
        "users_without_mfa": disabled,
    }


@router.get("/licenses")
async def get_licenses(graph: Optional[GraphClient] = Depends(get_graph)):
    if graph:
        raw_skus = await graph.get_subscribed_skus()
        licenses = [transform_sku(s) for s in raw_skus]
    else:
        licenses = MOCK_LICENSES

    total_assigned = sum(l.get("assigned", 0) for l in licenses)
    total_available = sum(l.get("total", 0) for l in licenses)
    return {
        "licenses": licenses,
        "summary": {
            "total_assigned": total_assigned,
            "total_available": total_available,
            "utilization_rate": round(total_assigned / total_available * 100, 1) if total_available else 0,
            "monthly_cost": round(sum(l.get("assigned", 0) * l.get("costPerUser", 0) for l in licenses), 2),
        },
    }


@router.get("/privileged")
async def get_privileged(graph: Optional[GraphClient] = Depends(get_graph)):
    if graph:
        users = await _fetch_users_real(graph)
    else:
        users = MOCK_USERS.copy()

    admins = [u for u in users if u.get("isAdmin")]
    global_admins = [u for u in users if "Global Administrator" in (u.get("adminRoles") or [])]
    return {
        "admins": admins,
        "global_admins": global_admins,
        "total_admins": len(admins),
        "global_admin_count": len(global_admins),
        "recent_role_changes": [],
    }


@router.get("/guests")
async def get_guests(graph: Optional[GraphClient] = Depends(get_graph)):
    if graph:
        users = await _fetch_users_real(graph)
    else:
        users = MOCK_USERS.copy()

    guests = [u for u in users if u.get("userType") == "Guest"]
    return {
        "guests": guests,
        "total": len(guests),
        "inactive_guests": sum(1 for g in guests if g.get("daysInactive", 0) > 60),
        "high_risk_guests": sum(1 for g in guests if g.get("riskLevel") in ["Critical", "High"]),
    }
