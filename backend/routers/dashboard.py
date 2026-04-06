from fastapi import APIRouter, Depends
from typing import Optional
from mock_data import get_dashboard_summary
from graph_deps import get_graph
from graph_client import GraphClient
from graph_transforms import build_dashboard_summary, transform_sku, transform_alert
import asyncio

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/summary")
async def get_summary(graph: Optional[GraphClient] = Depends(get_graph)):
    if graph:
        users_task = asyncio.create_task(graph.get_users())
        alerts_task = asyncio.create_task(graph.get_security_alerts(top=50))
        score_task = asyncio.create_task(graph.get_secure_score())
        skus_task = asyncio.create_task(graph.get_subscribed_skus())

        raw_users, raw_alerts, raw_score, raw_skus = await asyncio.gather(
            users_task, alerts_task, score_task, skus_task
        )

        skus = [transform_sku(s) for s in raw_skus]
        alerts = [transform_alert(a) for a in raw_alerts]
        return build_dashboard_summary(raw_users, alerts, raw_score, skus)

    return get_dashboard_summary()
