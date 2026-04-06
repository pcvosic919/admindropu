import uuid, json, os
from typing import Optional

_STORE_FILE = "sessions.json"

# In-memory store
_sessions: dict[str, dict] = {}


def _load():
    """Load sessions from disk on startup."""
    global _sessions
    if os.path.exists(_STORE_FILE):
        try:
            with open(_STORE_FILE) as f:
                _sessions = json.load(f)
        except Exception:
            _sessions = {}


def _save():
    """Persist sessions to disk."""
    try:
        with open(_STORE_FILE, "w") as f:
            json.dump(_sessions, f)
    except Exception:
        pass


# Load on import
_load()


def create_session(access_token: str, refresh_token: str = None, user_info: dict = None) -> str:
    sid = str(uuid.uuid4())
    _sessions[sid] = {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "user_info": user_info or {},
    }
    _save()
    return sid


def get_session(sid: str) -> Optional[dict]:
    return _sessions.get(sid)


def get_access_token(sid: str) -> Optional[str]:
    session = _sessions.get(sid)
    return session["access_token"] if session else None


def delete_session(sid: str):
    _sessions.pop(sid, None)
    _save()
