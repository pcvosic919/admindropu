from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List
import asyncio

from mock_data import (
    MOCK_TEAMS_MEMBERS, MOCK_SPO_MEMBERS, MOCK_GUESTS,
    MOCK_GROUPS, MOCK_AUDIT_LOG, MOCK_USERS, fmt, tw_now,
    MOCK_TEAMS_PERMISSIONS, MOCK_SPO_PERMISSIONS
)
from graph_deps import get_graph
from graph_client import GraphClient, days_since
from graph_transforms import (
    transform_user, build_admin_roles_map, build_mfa_map, transform_group
)

router = APIRouter(prefix="/api/account-audit", tags=["account-audit"])


class RemediateRequest(BaseModel):
    userIds: List[str]
    action: str
    dryRun: bool = True
    reason: Optional[str] = None


_scan_results_cache = None


def build_scan_results_mock():
    all_risky = []
    for m in MOCK_TEAMS_MEMBERS:
        if m["riskLevel"] in ["Critical", "High", "Medium"]:
            all_risky.append({**m, "source": "Teams"})
    for m in MOCK_SPO_MEMBERS:
        if m["riskLevel"] in ["Critical", "High", "Medium"]:
            all_risky.append({**m, "source": "SharePoint"})
    for g in MOCK_GUESTS:
        if g["daysInactive"] > 30:
            all_risky.append({
                "id": g["id"], "userId": g["id"],
                "displayName": g["displayName"], "upn": g["userPrincipalName"],
                "userType": "Guest", "daysInactive": g["daysInactive"],
                "riskLevel": g["riskLevel"], "source": "Guest",
                "riskReason": f"Guest account inactive {g['daysInactive']} days",
            })
    return {
        "scanId": f"scan-{int(tw_now().timestamp())}",
        "timestamp": fmt(tw_now()),
        "summary": {
            "totalScanned": len(MOCK_USERS) + len(MOCK_TEAMS_MEMBERS) + len(MOCK_SPO_MEMBERS),
            "critical": sum(1 for r in all_risky if r["riskLevel"] == "Critical"),
            "high": sum(1 for r in all_risky if r["riskLevel"] == "High"),
            "medium": sum(1 for r in all_risky if r["riskLevel"] == "Medium"),
            "low": sum(1 for r in all_risky if r.get("riskLevel") == "Low"),
            "totalRisky": len(all_risky),
        },
        "riskyAccounts": all_risky,
    }


# ── Scan ─────────────────────────────────────────────────────────────────────

@router.post("/scan")
async def trigger_scan(graph: Optional[GraphClient] = Depends(get_graph)):
    global _scan_results_cache
    if graph:
        # Real scan: fetch all users and flag risky ones
        raw_users, role_assignments, mfa_regs = await asyncio.gather(
            graph.get_users(),
            graph.get_role_assignments(),
            graph.get_mfa_registration(),
        )
        admin_map = build_admin_roles_map(role_assignments)
        mfa_map = build_mfa_map(mfa_regs)
        users = [transform_user(u, admin_map, mfa_map) for u in raw_users]
        risky = [u for u in users if u["riskLevel"] in ("Critical", "High", "Medium")]
        _scan_results_cache = {
            "scanId": f"scan-{int(tw_now().timestamp())}",
            "timestamp": fmt(tw_now()),
            "summary": {
                "totalScanned": len(users),
                "critical": sum(1 for u in risky if u["riskLevel"] == "Critical"),
                "high": sum(1 for u in risky if u["riskLevel"] == "High"),
                "medium": sum(1 for u in risky if u["riskLevel"] == "Medium"),
                "low": sum(1 for u in risky if u["riskLevel"] == "Low"),
                "totalRisky": len(risky),
            },
            "riskyAccounts": risky,
        }
    else:
        _scan_results_cache = build_scan_results_mock()

    return {
        "success": True,
        "scanId": _scan_results_cache["scanId"],
        "timestamp": _scan_results_cache["timestamp"],
        "message": "Scan completed successfully",
        "summary": _scan_results_cache["summary"],
    }


@router.get("/results")
def get_results():
    global _scan_results_cache
    if not _scan_results_cache:
        _scan_results_cache = build_scan_results_mock()
    return _scan_results_cache


# ── Teams members ─────────────────────────────────────────────────────────────

@router.get("/teams-members")
async def get_teams_members(
    riskLevel: Optional[str] = None,
    teamName: Optional[str] = None,
    graph: Optional[GraphClient] = Depends(get_graph),
):
    if graph:
        teams = await graph.get_teams()
        members_out = []
        for team in teams:
            tid = team["id"]
            tname = team.get("displayName", "")
            if teamName and teamName.lower() not in tname.lower():
                continue
            owners, mems = await asyncio.gather(
                graph.get_team_owners(tid),
                graph.get_team_members(tid),
            )
            owner_ids = {o["id"] for o in owners}
            for m in mems + [o for o in owners if o["id"] not in {x["id"] for x in mems}]:
                uid = m.get("id", "")
                user_type = m.get("userType") or "Member"
                role = "Owner" if uid in owner_ids else "Member"
                risk = "High" if user_type == "Guest" else "Low"
                entry = {
                    "id": f"{tid}-{uid}",
                    "userId": uid,
                    "displayName": m.get("displayName", ""),
                    "upn": m.get("userPrincipalName", ""),
                    "userType": user_type,
                    "teamName": tname,
                    "role": role,
                    "daysInactive": 0,
                    "riskLevel": risk,
                    "riskReason": "Guest in Team" if user_type == "Guest" else "Active member",
                }
                members_out.append(entry)

        if riskLevel and riskLevel != "All":
            members_out = [m for m in members_out if m["riskLevel"] == riskLevel]

        return {
            "members": members_out,
            "total": len(members_out),
            "riskBreakdown": {
                "critical": sum(1 for m in members_out if m["riskLevel"] == "Critical"),
                "high": sum(1 for m in members_out if m["riskLevel"] == "High"),
                "medium": sum(1 for m in members_out if m["riskLevel"] == "Medium"),
                "low": sum(1 for m in members_out if m["riskLevel"] == "Low"),
            },
        }

    # Mock fallback
    members = MOCK_TEAMS_MEMBERS.copy()
    if riskLevel and riskLevel != "All":
        members = [m for m in members if m["riskLevel"] == riskLevel]
    if teamName:
        members = [m for m in members if teamName.lower() in m["teamName"].lower()]
    return {
        "members": members, "total": len(members),
        "riskBreakdown": {
            "critical": sum(1 for m in MOCK_TEAMS_MEMBERS if m["riskLevel"] == "Critical"),
            "high": sum(1 for m in MOCK_TEAMS_MEMBERS if m["riskLevel"] == "High"),
            "medium": sum(1 for m in MOCK_TEAMS_MEMBERS if m["riskLevel"] == "Medium"),
            "low": sum(1 for m in MOCK_TEAMS_MEMBERS if m["riskLevel"] == "Low"),
        },
    }


# ── SPO members ───────────────────────────────────────────────────────────────

@router.get("/spo-members")
async def get_spo_members(
    riskLevel: Optional[str] = None,
    graph: Optional[GraphClient] = Depends(get_graph),
):
    if graph:
        sites = await graph.get_sites()
        members_out = []
        for site in sites[:20]:  # limit to avoid too many calls
            sid = site.get("id", "")
            sname = site.get("displayName") or site.get("name", "")
            surl = site.get("webUrl", "")
            perms = await graph.get_site_permissions(sid)
            for p in perms:
                granted = p.get("grantedToV2") or p.get("grantedTo") or {}
                user = granted.get("user") or {}
                upn = user.get("email") or user.get("loginName", "")
                display = user.get("displayName", "")
                if not display:
                    continue
                roles = p.get("roles") or []
                perm_level = "Full Control" if "owner" in roles else ("Edit" if "write" in roles else "Read")
                user_type = "Guest" if "#EXT#" in upn else "Member"
                risk = "High" if user_type == "Guest" else "Low"
                members_out.append({
                    "id": p.get("id", ""),
                    "userId": user.get("id", ""),
                    "displayName": display,
                    "upn": upn,
                    "userType": user_type,
                    "siteName": sname,
                    "siteUrl": surl,
                    "permissionLevel": perm_level,
                    "daysInactive": 0,
                    "riskLevel": risk,
                    "riskReason": "External user with site access" if user_type == "Guest" else "Active member",
                })

        if riskLevel and riskLevel != "All":
            members_out = [m for m in members_out if m["riskLevel"] == riskLevel]

        return {
            "members": members_out, "total": len(members_out),
            "riskBreakdown": {
                "critical": 0,
                "high": sum(1 for m in members_out if m["riskLevel"] == "High"),
                "medium": 0,
                "low": sum(1 for m in members_out if m["riskLevel"] == "Low"),
            },
        }

    # Mock fallback
    members = MOCK_SPO_MEMBERS.copy()
    if riskLevel and riskLevel != "All":
        members = [m for m in members if m["riskLevel"] == riskLevel]
    return {
        "members": members, "total": len(members),
        "riskBreakdown": {
            "critical": sum(1 for m in MOCK_SPO_MEMBERS if m["riskLevel"] == "Critical"),
            "high": sum(1 for m in MOCK_SPO_MEMBERS if m["riskLevel"] == "High"),
            "medium": sum(1 for m in MOCK_SPO_MEMBERS if m["riskLevel"] == "Medium"),
            "low": sum(1 for m in MOCK_SPO_MEMBERS if m["riskLevel"] == "Low"),
        },
    }


# ── Guests ────────────────────────────────────────────────────────────────────

@router.get("/guests")
async def get_guests(graph: Optional[GraphClient] = Depends(get_graph)):
    if graph:
        raw_users, role_assignments, _ = await asyncio.gather(
            graph.get_users(),
            graph.get_role_assignments(),
            graph.get_mfa_registration(),
        )
        admin_map = build_admin_roles_map(role_assignments)
        users = [transform_user(u, admin_map, {}) for u in raw_users]
        guests = [u for u in users if u.get("userType") == "Guest"]
        return {
            "guests": guests,
            "total": len(guests),
            "inactive": sum(1 for g in guests if g["daysInactive"] > 60),
            "high_risk": sum(1 for g in guests if g["riskLevel"] in ("Critical", "High")),
        }

    guests = MOCK_GUESTS.copy()
    return {
        "guests": guests, "total": len(guests),
        "inactive": sum(1 for g in guests if g["daysInactive"] > 60),
        "high_risk": sum(1 for g in guests if g["riskLevel"] in ["Critical", "High"]),
    }


# ── Groups ────────────────────────────────────────────────────────────────────

@router.get("/groups")
async def get_groups(graph: Optional[GraphClient] = Depends(get_graph)):
    if graph:
        raw_groups = await graph.get_groups()
        groups_out = []
        # Fetch member counts for first 30 groups to avoid too many calls
        for g in raw_groups[:30]:
            gid = g.get("id", "")
            members = await graph.get_group_members(gid)
            has_external = any("#EXT#" in (m.get("userPrincipalName") or "") for m in members)
            groups_out.append(transform_group(g, len(members), has_external))
        return {
            "groups": groups_out, "total": len(groups_out),
            "with_guests": sum(1 for g in groups_out if g["hasExternalMembers"]),
            "high_risk": sum(1 for g in groups_out if g["riskLevel"] in ("Critical", "High")),
        }

    return {
        "groups": MOCK_GROUPS, "total": len(MOCK_GROUPS),
        "with_guests": sum(1 for g in MOCK_GROUPS if g["hasExternalMembers"]),
        "high_risk": sum(1 for g in MOCK_GROUPS if g["riskLevel"] in ["Critical", "High"]),
    }


# ── Remediate ─────────────────────────────────────────────────────────────────

@router.post("/remediate")
def remediate(body: RemediateRequest):
    valid_actions = ["Remove Guest", "Disable Account", "Remove from Team", "Remove from Group", "Revoke License", "Reset MFA"]
    if body.action not in valid_actions:
        raise HTTPException(status_code=400, detail=f"Invalid action. Must be one of: {valid_actions}")

    results = []
    for uid in body.userIds:
        user = next((u for u in MOCK_USERS if u["id"] == uid), None)
        results.append({
            "userId": uid,
            "displayName": user["displayName"] if user else uid,
            "action": body.action,
            "status": "DryRun" if body.dryRun else "Success",
            "isDryRun": body.dryRun,
            "timestamp": fmt(tw_now()),
        })

    if not body.dryRun:
        for result in results:
            if result["status"] == "Success":
                MOCK_AUDIT_LOG.insert(0, {
                    "id": f"audit-{len(MOCK_AUDIT_LOG)+1:03d}",
                    "timestamp": fmt(tw_now()),
                    "action": body.action,
                    "targetUser": result.get("displayName", result["userId"]),
                    "performedBy": "M365 Sentinel Platform",
                    "status": "Success",
                    "isDryRun": False,
                    "notes": body.reason or "Manual remediation via Account Audit module",
                })

    return {"success": True, "dryRun": body.dryRun, "action": body.action, "processedCount": len(results), "results": results}


# ── Audit log ─────────────────────────────────────────────────────────────────

@router.get("/audit-log")
async def get_audit_log(graph: Optional[GraphClient] = Depends(get_graph)):
    if graph:
        logs = await graph.get_directory_audits(top=100)
        transformed = [
            {
                "id": l.get("id", ""),
                "timestamp": l.get("activityDateTime", ""),
                "action": l.get("activityDisplayName", ""),
                "targetUser": (l.get("targetResources") or [{}])[0].get("userPrincipalName", ""),
                "performedBy": (l.get("initiatedBy") or {}).get("user", {}).get("userPrincipalName", "System"),
                "status": l.get("result", "success").capitalize(),
                "isDryRun": False,
                "notes": l.get("loggedByService", ""),
            }
            for l in logs
        ]
        return {"logs": transformed, "total": len(transformed)}

    return {"logs": MOCK_AUDIT_LOG, "total": len(MOCK_AUDIT_LOG)}


# ── Teams permissions ─────────────────────────────────────────────────────────

@router.get("/teams-permissions")
async def get_teams_permissions(graph: Optional[GraphClient] = Depends(get_graph)):
    if graph:
        teams = await graph.get_teams()
        perms_out = []
        for team in teams:
            tid = team["id"]
            tname = team.get("displayName", "")
            dept = ""
            owners, mems = await asyncio.gather(
                graph.get_team_owners(tid),
                graph.get_team_members(tid),
            )
            owner_ids = {o["id"] for o in owners}
            seen = set()
            for m in owners + mems:
                uid = m.get("id", "")
                if uid in seen:
                    continue
                seen.add(uid)
                upn = m.get("userPrincipalName", "")
                user_type = m.get("userType") or "Member"
                role = "Owner" if uid in owner_ids else "Member"
                perm_level = "Full Control" if role == "Owner" else "Edit"
                is_guest = user_type == "Guest"
                sharing_risk = "High" if is_guest else "Low"
                perms_out.append({
                    "id": f"tp-{tid[:8]}-{uid[:8]}",
                    "teamName": tname,
                    "department": dept,
                    "memberUPN": upn,
                    "memberName": m.get("displayName", ""),
                    "userType": user_type,
                    "role": role,
                    "permissionLevel": perm_level,
                    "channelAccess": "All Channels",
                    "canShare": role == "Owner",
                    "addedDate": team.get("createdDateTime", ""),
                    "lastActivity": "",
                    "sharingScope": "SpecificExternal" if is_guest else "OrganizationInternal",
                    "riskLevel": sharing_risk,
                })

        summary = {
            "owners": sum(1 for r in perms_out if r["role"] == "Owner"),
            "editors": sum(1 for r in perms_out if r["permissionLevel"] == "Edit"),
            "readers": sum(1 for r in perms_out if r["permissionLevel"] == "Read"),
            "guests": sum(1 for r in perms_out if r["userType"] == "Guest"),
            "critical": sum(1 for r in perms_out if r["riskLevel"] == "Critical"),
            "high": sum(1 for r in perms_out if r["riskLevel"] == "High"),
        }
        return {
            "permissions": perms_out, "total": len(perms_out),
            "summary": summary,
            "teams": sorted(list({r["teamName"] for r in perms_out})),
        }

    # Mock fallback
    data = MOCK_TEAMS_PERMISSIONS
    return {
        "permissions": data, "total": len(data),
        "summary": {
            "owners": sum(1 for r in data if r["role"] == "Owner"),
            "editors": sum(1 for r in data if r["permissionLevel"] == "Edit"),
            "readers": sum(1 for r in data if r["permissionLevel"] == "Read"),
            "guests": sum(1 for r in data if r["userType"] == "Guest"),
            "critical": sum(1 for r in data if r["riskLevel"] == "Critical"),
            "high": sum(1 for r in data if r["riskLevel"] == "High"),
        },
        "teams": sorted(list({r["teamName"] for r in data})),
    }


# ── SPO permissions ───────────────────────────────────────────────────────────

@router.get("/spo-permissions")
async def get_spo_permissions(graph: Optional[GraphClient] = Depends(get_graph)):
    if graph:
        sites = await graph.get_sites()
        perms_out = []
        for site in sites[:20]:
            sid = site.get("id", "")
            sname = site.get("displayName") or site.get("name", "")
            surl = site.get("webUrl", "")
            raw_perms = await graph.get_site_permissions(sid)
            for p in raw_perms:
                roles = p.get("roles") or []
                granted = p.get("grantedToV2") or p.get("grantedTo") or {}
                user = granted.get("user") or {}
                upn = user.get("email") or user.get("loginName", "")
                display = user.get("displayName", "")
                if not display:
                    continue
                perm_level = "Full Control" if "owner" in roles else ("Edit" if "write" in roles else "Read")
                user_type = "Guest" if "#EXT#" in upn else "Member"
                link = p.get("link") or {}
                link_scope = link.get("scope", "")
                if link_scope == "anonymous":
                    sharing_scope = "Anonymous"
                    risk = "Critical"
                elif user_type == "Guest":
                    sharing_scope = "SpecificExternal"
                    risk = "High"
                else:
                    sharing_scope = "OrganizationInternal"
                    risk = "Low"
                perms_out.append({
                    "id": p.get("id", ""),
                    "siteName": sname,
                    "siteUrl": surl,
                    "memberUPN": upn,
                    "memberName": display,
                    "userType": user_type,
                    "permissionLevel": perm_level,
                    "permissionType": "Direct",
                    "groupName": None,
                    "sharingScope": sharing_scope,
                    "sharingLinkType": link_scope or None,
                    "sharingWith": upn if user_type == "Guest" else None,
                    "grantedDate": "",
                    "riskLevel": risk,
                })

        summary = {
            "full_control": sum(1 for r in perms_out if r["permissionLevel"] == "Full Control"),
            "editors": sum(1 for r in perms_out if r["permissionLevel"] == "Edit"),
            "readers": sum(1 for r in perms_out if r["permissionLevel"] in ("Read", "Limited Access")),
            "external_shares": sum(1 for r in perms_out if r["sharingScope"] == "SpecificExternal"),
            "anonymous_links": sum(1 for r in perms_out if r["sharingScope"] == "Anonymous"),
            "org_shares": sum(1 for r in perms_out if r["sharingScope"] == "OrganizationInternal"),
            "critical": sum(1 for r in perms_out if r["riskLevel"] == "Critical"),
            "high": sum(1 for r in perms_out if r["riskLevel"] == "High"),
        }
        return {
            "permissions": perms_out, "total": len(perms_out),
            "summary": summary,
            "sites": sorted(list({r["siteName"] for r in perms_out})),
        }

    # Mock fallback
    data = MOCK_SPO_PERMISSIONS
    return {
        "permissions": data, "total": len(data),
        "summary": {
            "full_control": sum(1 for r in data if r["permissionLevel"] == "Full Control"),
            "editors": sum(1 for r in data if r["permissionLevel"] == "Edit"),
            "readers": sum(1 for r in data if r["permissionLevel"] in ("Read", "Limited Access")),
            "external_shares": sum(1 for r in data if r["sharingScope"] == "SpecificExternal"),
            "anonymous_links": sum(1 for r in data if r["sharingScope"] == "Anonymous"),
            "org_shares": sum(1 for r in data if r["sharingScope"] == "OrganizationInternal"),
            "critical": sum(1 for r in data if r["riskLevel"] == "Critical"),
            "high": sum(1 for r in data if r["riskLevel"] == "High"),
        },
        "sites": sorted(list({r["siteName"] for r in data})),
    }
