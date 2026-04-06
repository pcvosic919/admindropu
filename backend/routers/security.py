from fastapi import APIRouter, Depends
from typing import Optional
from mock_data import (
    MOCK_SECURE_SCORE, MOCK_EXCHANGE_SECURITY,
    MOCK_SHAREPOINT_SECURITY, MOCK_TEAMS_SECURITY,
    MOCK_USERS, MOCK_ALERTS, tw_past, fmt
)
from graph_deps import get_graph
from graph_client import GraphClient
from graph_transforms import transform_alert, transform_secure_score

router = APIRouter(prefix="/api/security", tags=["security"])


@router.get("/posture")
async def get_posture(graph: Optional[GraphClient] = Depends(get_graph)):
    if graph:
        import asyncio
        users_task = asyncio.create_task(graph.get_users())
        score_task = asyncio.create_task(graph.get_secure_score())
        raw_users, raw_score = await users_task, await score_task

        total_users = len(raw_users)
        # mfaEnabled not directly available without Reports.Read.All — use 0 as unknown
        mfa_users = 0
        ss = transform_secure_score(raw_score) if raw_score else MOCK_SECURE_SCORE

        return {
            "secure_score": ss["current"],
            "max_score": ss["maxScore"],
            "comparison": ss.get("comparisonToSimilarCompanies", 50),
            "mfa_coverage": round(mfa_users / total_users * 100, 1) if total_users else 0,
            "conditional_access_coverage": None,
            "dlp_policies_active": None,
            "privileged_accounts_protected": None,
            "total_privileged_accounts": None,
            "recent_events": [],
        }

    # Mock fallback
    total_users = len(MOCK_USERS)
    mfa_users = sum(1 for u in MOCK_USERS if u["mfaEnabled"])
    return {
        "secure_score": MOCK_SECURE_SCORE["current"],
        "max_score": MOCK_SECURE_SCORE["maxScore"],
        "comparison": MOCK_SECURE_SCORE["comparisonToSimilarCompanies"],
        "mfa_coverage": round(mfa_users / total_users * 100, 1),
        "conditional_access_coverage": 78.5,
        "dlp_policies_active": 8,
        "privileged_accounts_protected": 4,
        "total_privileged_accounts": 5,
        "recent_events": [
            {"timestamp": fmt(tw_past(hours=2)), "event": "Secure Score increased by 1 point", "type": "positive"},
            {"timestamp": fmt(tw_past(hours=5)), "event": "DLP policy match detected in Exchange", "type": "warning"},
            {"timestamp": fmt(tw_past(hours=8)), "event": "New Conditional Access policy created", "type": "info"},
            {"timestamp": fmt(tw_past(days=1)), "event": "3 users enrolled in MFA", "type": "positive"},
            {"timestamp": fmt(tw_past(days=1, hours=4)), "event": "Risky sign-in detected and blocked", "type": "warning"},
            {"timestamp": fmt(tw_past(days=2)), "event": "Security alert escalated to Investigating", "type": "info"},
        ],
    }


@router.get("/exchange")
def get_exchange():
    return {
        **MOCK_EXCHANGE_SECURITY,
        "policies": [
            {"name": "Anti-Malware Policy", "enabled": True, "lastModified": fmt(tw_past(days=30))},
            {"name": "Anti-Spam Policy", "enabled": True, "lastModified": fmt(tw_past(days=15))},
            {"name": "Anti-Phishing Policy", "enabled": True, "lastModified": fmt(tw_past(days=7))},
            {"name": "Safe Attachments Policy", "enabled": False, "lastModified": fmt(tw_past(days=45))},
            {"name": "Safe Links Policy", "enabled": True, "lastModified": fmt(tw_past(days=20))},
            {"name": "DKIM Signing", "enabled": True, "lastModified": fmt(tw_past(days=90))},
            {"name": "DMARC Policy", "enabled": True, "lastModified": fmt(tw_past(days=90))},
        ],
    }


@router.get("/sharepoint")
def get_sharepoint():
    return {
        **MOCK_SHAREPOINT_SECURITY,
        "sharingPolicies": {
            "organizationSharingLevel": "ExistingExternalUserSharingOnly",
            "defaultSharingLinkType": "Specific people",
            "requireAcceptingAccountMatchInvitedAccount": True,
            "preventExternalUsersFromResharing": True,
        },
    }


@router.get("/teams")
def get_teams():
    return {
        **MOCK_TEAMS_SECURITY,
        "policies": {
            "guestAccess": True,
            "externalAccess": True,
            "allowPrivateChannels": True,
            "allowSharedChannels": False,
            "allowGuestAccessToChannels": True,
            "allowGuestAccessToMeetings": True,
        },
    }


@router.get("/secure-score")
async def get_secure_score(graph: Optional[GraphClient] = Depends(get_graph)):
    if graph:
        raw = await graph.get_secure_score()
        if raw:
            return transform_secure_score(raw)

    return MOCK_SECURE_SCORE


@router.get("/alerts")
async def get_alerts(graph: Optional[GraphClient] = Depends(get_graph)):
    if graph:
        raw = await graph.get_security_alerts(top=50)
        return {
            "alerts": [transform_alert(a) for a in raw],
            "total": len(raw),
        }

    return {
        "alerts": MOCK_ALERTS,
        "total": len(MOCK_ALERTS),
    }
