import httpx
from datetime import datetime, timezone
from typing import Optional

GRAPH_BASE = "https://graph.microsoft.com/v1.0"
GRAPH_BETA = "https://graph.microsoft.com/beta"


class GraphClient:
    def __init__(self, access_token: str):
        self.headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
        }

    async def _get(self, url: str, params: dict = None) -> dict:
        async with httpx.AsyncClient(timeout=30.0) as client:
            r = await client.get(url, headers=self.headers, params=params)
            r.raise_for_status()
            return r.json()

    async def get_pages(self, path: str, params: dict = None, base: str = GRAPH_BASE) -> list:
        """Fetch all pages following @odata.nextLink."""
        results = []
        url = f"{base}{path}"
        async with httpx.AsyncClient(timeout=30.0) as client:
            while url:
                r = await client.get(url, headers=self.headers, params=params)
                r.raise_for_status()
                data = r.json()
                results.extend(data.get("value", []))
                url = data.get("@odata.nextLink")
                params = None
        return results

    # ── Users ───────────────────────────────────────────────────────────────

    async def get_users(self) -> list:
        return await self.get_pages(
            "/users",
            params={
                "$select": (
                    "id,displayName,userPrincipalName,userType,accountEnabled,"
                    "department,jobTitle,createdDateTime,assignedLicenses,"
                    "signInActivity,mail,onPremisesSyncEnabled"
                ),
                "$top": "999",
            },
        )

    async def get_me(self) -> dict:
        return await self._get(
            f"{GRAPH_BASE}/me",
            params={"$select": "id,displayName,userPrincipalName,mail"},
        )

    async def get_mfa_registration(self) -> list:
        """Requires Reports.Read.All"""
        try:
            return await self.get_pages(
                "/reports/authenticationMethods/userRegistrationDetails",
                params={"$top": "999"},
            )
        except Exception:
            return []

    # ── Directory roles ──────────────────────────────────────────────────────

    async def get_role_assignments(self) -> list:
        """Returns list of {principalId, roleDefinition{displayName}}"""
        try:
            return await self.get_pages(
                "/roleManagement/directory/roleAssignments",
                params={"$expand": "roleDefinition($select=displayName)", "$top": "999"},
            )
        except Exception:
            return []

    # ── Groups ───────────────────────────────────────────────────────────────

    async def get_groups(self) -> list:
        return await self.get_pages(
            "/groups",
            params={
                "$select": (
                    "id,displayName,description,groupTypes,mailEnabled,"
                    "securityEnabled,createdDateTime,visibility,mail"
                ),
                "$top": "999",
            },
        )

    async def get_group_members(self, group_id: str) -> list:
        try:
            return await self.get_pages(
                f"/groups/{group_id}/members",
                params={"$select": "id,displayName,userPrincipalName,userType", "$top": "999"},
            )
        except Exception:
            return []

    async def get_group_owners(self, group_id: str) -> list:
        try:
            return await self.get_pages(
                f"/groups/{group_id}/owners",
                params={"$select": "id,displayName,userPrincipalName,userType", "$top": "999"},
            )
        except Exception:
            return []

    # ── Teams ────────────────────────────────────────────────────────────────

    async def get_teams(self) -> list:
        return await self.get_pages(
            "/groups",
            params={
                "$filter": "resourceProvisioningOptions/Any(x:x eq 'Team')",
                "$select": "id,displayName,description,visibility,createdDateTime,mail",
                "$top": "999",
            },
        )

    async def get_team_members(self, group_id: str) -> list:
        try:
            return await self.get_pages(
                f"/groups/{group_id}/members",
                params={"$select": "id,displayName,userPrincipalName,userType", "$top": "999"},
            )
        except Exception:
            return []

    async def get_team_owners(self, group_id: str) -> list:
        try:
            return await self.get_pages(
                f"/groups/{group_id}/owners",
                params={"$select": "id,displayName,userPrincipalName,userType", "$top": "999"},
            )
        except Exception:
            return []

    # ── SharePoint ───────────────────────────────────────────────────────────

    async def get_sites(self) -> list:
        try:
            return await self.get_pages("/sites", params={"search": "*", "$top": "200"})
        except Exception:
            return []

    async def get_site_permissions(self, site_id: str) -> list:
        try:
            return await self.get_pages(f"/sites/{site_id}/permissions")
        except Exception:
            return []

    # ── Security ─────────────────────────────────────────────────────────────

    async def get_security_alerts(self, top: int = 100) -> list:
        try:
            return await self.get_pages(
                "/security/alerts_v2",
                params={"$top": str(top), "$orderby": "createdDateTime desc"},
            )
        except Exception:
            return []

    async def get_secure_score(self) -> Optional[dict]:
        try:
            data = await self._get(
                f"{GRAPH_BASE}/security/secureScores",
                params={"$top": "1"},
            )
            scores = data.get("value", [])
            return scores[0] if scores else None
        except Exception:
            return None

    # ── Licenses ─────────────────────────────────────────────────────────────

    async def get_subscribed_skus(self) -> list:
        try:
            data = await self._get(f"{GRAPH_BASE}/subscribedSkus")
            return data.get("value", [])
        except Exception:
            return []

    # ── Audit Logs ───────────────────────────────────────────────────────────

    async def get_sign_in_logs(self, top: int = 50) -> list:
        try:
            return await self.get_pages(
                "/auditLogs/signIns",
                params={"$top": str(top), "$orderby": "createdDateTime desc"},
            )
        except Exception:
            return []

    async def get_directory_audits(self, top: int = 50) -> list:
        try:
            return await self.get_pages(
                "/auditLogs/directoryAudits",
                params={"$top": str(top), "$orderby": "activityDateTime desc"},
            )
        except Exception:
            return []


def days_since(dt_str: Optional[str]) -> int:
    """Calculate days since an ISO datetime string."""
    if not dt_str:
        return 0
    try:
        dt = datetime.fromisoformat(dt_str.replace("Z", "+00:00"))
        return (datetime.now(timezone.utc) - dt).days
    except Exception:
        return 0
