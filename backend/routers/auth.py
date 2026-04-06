from fastapi import APIRouter, Header
from fastapi.responses import RedirectResponse
import httpx
import json
import os
from typing import Optional

from session_store import create_session, get_session, delete_session
from graph_client import GraphClient

router = APIRouter()


def load_config():
    if os.path.exists("m365_config.json"):
        with open("m365_config.json") as f:
            return json.load(f)
    return {}


@router.get("/login")
def login():
    cfg = load_config()
    tenant_id = cfg.get("tenant_id", "common")
    client_id = cfg.get("client_id", "")
    redirect_uri = cfg.get("redirect_uri", "http://localhost:8000/api/auth/callback")

    if not client_id:
        return RedirectResponse("http://localhost:5173?auth_error=not_configured")

    auth_url = (
        f"https://login.microsoftonline.com/{tenant_id}/oauth2/v2.0/authorize"
        f"?client_id={client_id}"
        f"&response_type=code"
        f"&redirect_uri={redirect_uri}"
        f"&scope=openid+profile+email+User.Read+offline_access"
        f"&response_mode=query"
    )
    return RedirectResponse(auth_url)


@router.get("/callback")
async def callback(code: str = None, error: str = None, error_description: str = None):
    if error:
        desc = error_description or error
        return RedirectResponse(f"http://localhost:5173?auth_error={desc}")

    if not code:
        return RedirectResponse("http://localhost:5173?auth_error=no_code")

    cfg = load_config()
    tenant_id = cfg.get("tenant_id", "common")
    client_id = cfg.get("client_id", "")
    client_secret = cfg.get("client_secret", "")
    redirect_uri = cfg.get("redirect_uri", "http://localhost:8000/api/auth/callback")

    if not client_id or not client_secret:
        return RedirectResponse("http://localhost:5173?auth_error=not_configured")

    # Exchange authorization code for tokens
    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.post(
            f"https://login.microsoftonline.com/{tenant_id}/oauth2/v2.0/token",
            data={
                "client_id": client_id,
                "client_secret": client_secret,
                "code": code,
                "redirect_uri": redirect_uri,
                "grant_type": "authorization_code",
                "scope": "openid profile email User.Read offline_access",
            },
        )

    if r.status_code != 200:
        err = r.json().get("error_description", "token_exchange_failed")
        return RedirectResponse(f"http://localhost:5173?auth_error={err[:80]}")

    tokens = r.json()
    access_token = tokens.get("access_token", "")
    refresh_token = tokens.get("refresh_token")

    # Fetch user info from Graph
    graph = GraphClient(access_token)
    try:
        me = await graph.get_me()
        user_info = {
            "name": me.get("displayName", "Microsoft Admin"),
            "email": me.get("mail") or me.get("userPrincipalName", ""),
            "tenantId": tenant_id,
        }
    except Exception:
        user_info = {"name": "Microsoft Admin", "email": "", "tenantId": tenant_id}

    sid = create_session(access_token, refresh_token, user_info)
    return RedirectResponse(f"http://localhost:5173?auth_success=true&sid={sid}")


@router.get("/me")
def get_me(x_session_id: Optional[str] = Header(None)):
    if x_session_id:
        session = get_session(x_session_id)
        if session and session.get("user_info"):
            return session["user_info"]
    return {
        "name": "Global Admin",
        "email": "admin@contoso.onmicrosoft.com",
        "tenantId": "contoso",
    }


@router.post("/logout")
def logout(x_session_id: Optional[str] = Header(None)):
    if x_session_id:
        delete_session(x_session_id)
    return {"success": True}
