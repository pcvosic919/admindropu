from fastapi import APIRouter
import json, os

router = APIRouter()
CONFIG_FILE = "m365_config.json"


def load_config():
    if os.path.exists(CONFIG_FILE):
        with open(CONFIG_FILE) as f:
            return json.load(f)
    return {
        "tenant_id": "",
        "client_id": "",
        "client_secret": "",
        "redirect_uri": "http://localhost:8000/api/auth/callback",
    }


@router.get("/m365")
def get_m365_config():
    cfg = load_config()
    cfg["client_secret"] = "***" if cfg.get("client_secret") else ""
    return cfg


@router.post("/m365")
def save_m365_config(body: dict):
    cfg = load_config()
    cfg.update({k: v for k, v in body.items() if k in ["tenant_id", "client_id", "client_secret", "redirect_uri"]})
    with open(CONFIG_FILE, "w") as f:
        json.dump(cfg, f, indent=2)
    return {"status": "saved"}


@router.post("/m365/test")
def test_m365_connection():
    cfg = load_config()
    if not cfg.get("tenant_id") or not cfg.get("client_id") or not cfg.get("client_secret"):
        return {
            "success": False,
            "message": "Missing configuration. Please fill in Tenant ID, Client ID and Client Secret.",
        }
    # In real implementation, try to get a token using client credentials flow
    return {
        "success": True,
        "message": "Configuration looks complete. Real connection test requires valid Azure AD credentials.",
    }
