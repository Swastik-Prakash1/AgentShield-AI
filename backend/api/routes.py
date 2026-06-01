"""
REST API routes for the AgentShield dashboard.

Provides endpoints for running demos, viewing audit trails,
inspecting the permission manifest, and managing shield state.
"""

from fastapi import APIRouter, Query
from typing import Optional

router = APIRouter(prefix="/api")


def create_routes(agent, shield, audit, manifest, scenarios):
    """
    Factory function that creates routes with access to app state.
    Called from main.py with the initialized components.
    """

    @router.post("/run-demo")
    async def run_demo(
        scenario_id: str = Query("malicious_hotel", description="Scenario to run"),
        shield_active: bool = Query(True, description="Whether AgentShield is active"),
    ):
        """Run a demo scenario with or without the shield active."""
        # Reset state for clean demo
        audit.reset()
        shield.reset()
        shield.active = shield_active

        scenario = scenarios.get(scenario_id)
        if not scenario:
            return {"error": f"Scenario '{scenario_id}' not found", "available": list(scenarios.keys())}

        # Broadcast demo start
        if shield.ws_broadcast:
            await shield.ws_broadcast({
                "type": "DEMO_START",
                "scenario_id": scenario_id,
                "shield_active": shield_active,
                "description": scenario.get("description", ""),
            })

        # Run the agent
        result = await agent.run_task(scenario["task"], scenario["context"])

        return {
            "scenario_id": scenario_id,
            "shield_active": shield_active,
            "result": result,
            "threats_caught": shield.threats_caught,
            "calls_inspected": shield.calls_inspected,
            "audit_trail": audit.get_all(),
        }

    @router.get("/audit")
    async def get_audit():
        """Get the full audit trail."""
        return {
            "events": audit.get_all(),
            "total": len(audit.events),
            "threats": len(audit.get_threats()),
        }

    @router.get("/audit/threats")
    async def get_threats():
        """Get only threat events from the audit trail."""
        return audit.get_threats()

    @router.get("/manifest")
    async def get_manifest():
        """Get the current permission manifest."""
        return manifest.to_dict()

    @router.post("/reset")
    async def reset():
        """Reset all state — audit trail, counters, manifest session."""
        audit.reset()
        shield.reset()

        if shield.ws_broadcast:
            await shield.ws_broadcast({"type": "RESET"})

        return {"status": "reset", "message": "All state cleared"}

    @router.get("/status")
    async def status():
        """Get current shield status and stats."""
        return {
            "shield_active": shield.active,
            "threats_caught": shield.threats_caught,
            "calls_inspected": shield.calls_inspected,
            "total_events": len(audit.events),
            "total_threats": len(audit.get_threats()),
        }

    @router.post("/shield/toggle")
    async def toggle_shield(active: Optional[bool] = None):
        """Toggle the shield on/off, or set it explicitly."""
        if active is not None:
            shield.active = active
        else:
            shield.active = not shield.active

        if shield.ws_broadcast:
            await shield.ws_broadcast({
                "type": "SHIELD_TOGGLE",
                "active": shield.active,
            })

        return {"shield_active": shield.active}

    @router.get("/scenarios")
    async def list_scenarios():
        """List available demo scenarios."""
        return {
            sid: {
                "task": s["task"],
                "attack_type": s["attack_type"],
                "description": s.get("description", ""),
            }
            for sid, s in scenarios.items()
        }

    return router
