"""
FastAPI dependency for injecting an optional GraphClient.
If X-Session-Id header is present and valid, returns a live GraphClient.
Otherwise returns None (routes fall back to mock data).
"""
from fastapi import Header
from typing import Optional
from session_store import get_access_token
from graph_client import GraphClient


def get_graph(x_session_id: Optional[str] = Header(None)) -> Optional[GraphClient]:
    if x_session_id:
        token = get_access_token(x_session_id)
        if token:
            return GraphClient(token)
    return None
