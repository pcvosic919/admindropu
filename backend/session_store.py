import uuid
from typing import Optional

# In-memory session store: session_id -> {access_token, refresh_token, user_info}
_sessions: dict[str, dict] = {}


def create_session(access_token: str, refresh_token: str = None, user_info: dict = None) -> str:
    sid = str(uuid.uuid4())
    _sessions[sid] = {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "user_info": user_info or {},
    }
    return sid


def get_session(sid: str) -> Optional[dict]:
    return _sessions.get(sid)


def get_access_token(sid: str) -> Optional[str]:
    session = _sessions.get(sid)
    return session["access_token"] if session else None


def delete_session(sid: str):
    _sessions.pop(sid, None)
