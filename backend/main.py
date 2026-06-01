"""
AgentShield — FastAPI Application Entry Point

Assembles all components: shield, agent, audit, manifest, WebSocket, routes.
Run with: uvicorn main:app --reload --port 8000
"""

import sys
from pathlib import Path

# Add backend dir to path so imports work when running from backend/
sys.path.insert(0, str(Path(__file__).resolve().parent))

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from agent.base_agent import TravelAgent
from shield.interceptor import AgentShield
from shield.manifest import PermissionManifest
from shield.audit import AuditTrail
from api.ws import ConnectionManager
from api.routes import create_routes
from demo.scenarios import DEMO_SCENARIOS
from config import MANIFEST_DIR

# ─── Initialize Global State ─────────────────────────────────────────

manager = ConnectionManager()
audit = AuditTrail()
manifest = PermissionManifest(str(MANIFEST_DIR / "travel_agent.yaml"))


async def ws_broadcast(data: dict):
    """Broadcast helper that routes events to the WebSocket manager."""
    await manager.broadcast(data)


shield = AgentShield(
    manifest=manifest,
    audit=audit,
    ws_broadcast=ws_broadcast,
    active=True,
)

agent = TravelAgent(shield=shield)

# ─── Create FastAPI App ──────────────────────────────────────────────

app = FastAPI(
    title="AgentShield API",
    description="Security middleware for AI agents — intercepts, classifies, and blocks adversarial content.",
    version="1.0.0",
)

# CORS — allow frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Mount Routes ────────────────────────────────────────────────────

router = create_routes(agent, shield, audit, manifest, DEMO_SCENARIOS)
app.include_router(router)


# ─── WebSocket Endpoint ─────────────────────────────────────────────

@app.websocket("/ws/events")
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for real-time dashboard updates.
    The client connects and receives all shield events as they happen.
    """
    await manager.connect(websocket)
    try:
        while True:
            # Keep the connection alive — client can send heartbeats
            data = await websocket.receive_text()
            # Echo back status on any message (heartbeat response)
            await websocket.send_text('{"type":"HEARTBEAT","status":"ok"}')
    except WebSocketDisconnect:
        manager.disconnect(websocket)


# ─── Root Endpoint ───────────────────────────────────────────────────

@app.get("/")
async def root():
    return {
        "name": "AgentShield",
        "version": "1.0.0",
        "status": "running",
        "shield_active": shield.active,
        "docs": "/docs",
        "ws": "/ws/events",
    }
