"""
AgentShield Interceptor — the core middleware wrapper.

Wraps any Claude-powered agent's tool execution loop. Every tool call is
intercepted, checked against the permission manifest, and optionally
classified by the AI classifier before the result is passed back to the agent.
"""

import asyncio
from .classifier import classify_content, ThreatAssessment
from .manifest import PermissionManifest
from .audit import AuditTrail
from typing import Callable


class AgentShield:
    """
    Drop-in security middleware for any Claude-powered agent.

    Two-layer defense:
    1. Permission manifest (deterministic, fast — no API call)
    2. AI classifier (Claude-powered, contextual — catches prompt injections)

    Usage:
        shield = AgentShield(manifest=manifest, audit=audit, ws_broadcast=ws_fn)
        result = await shield.intercept_tool_call(
            tool_name="browse_web",
            tool_input={"url": "https://..."},
            tool_result="<page content>",
            agent_task="Book a hotel in Paris"
        )
        if result["action"] == "block":
            # Do not pass result to agent
        else:
            # Pass result["result"] to agent
    """

    def __init__(
        self,
        manifest: PermissionManifest,
        audit: AuditTrail,
        ws_broadcast: Callable = None,
        active: bool = True,
    ):
        self.manifest = manifest
        self.audit = audit
        self.ws_broadcast = ws_broadcast
        self.active = active
        self.threats_caught = 0
        self.calls_inspected = 0

    async def intercept_tool_call(
        self,
        tool_name: str,
        tool_input: dict,
        tool_result: str,
        agent_task: str,
    ) -> dict:
        """
        Intercept a completed tool call. Classify the result before
        returning it to the agent.

        Returns:
            dict with keys:
                action: "allow" | "block" | "quarantine"
                result: the tool result (or None if blocked)
                assessment: ThreatAssessment or None
        """
        self.calls_inspected += 1

        # Shield disabled — pass everything through
        if not self.active:
            await self._log_safe_call(tool_name, tool_input, tool_result)
            return {"action": "allow", "result": tool_result, "assessment": None}

        # Layer 1: Permission manifest check (fast, deterministic)
        manifest_violation = self.manifest.check_tool_permission(tool_name, tool_input)
        if manifest_violation:
            assessment = self._make_permission_violation(tool_name, manifest_violation)
            self.threats_caught += 1
            await self._handle_threat(assessment, tool_name, tool_input, agent_task)
            return {"action": "block", "result": None, "assessment": assessment}

        # Layer 2: AI classifier (Claude-powered, contextual)
        # Classify browse_web results — the primary attack surface
        if tool_name == "browse_web" and tool_result:
            assessment = await classify_content(
                agent_task=agent_task,
                content_to_check=tool_result,
                content_source=f"browse_web({tool_input.get('url', '')})",
                permission_manifest=self.manifest.to_dict(),
            )

            if assessment.recommended_action in ("block", "quarantine"):
                self.threats_caught += 1
                await self._handle_threat(assessment, tool_name, tool_input, agent_task)
                return {
                    "action": assessment.recommended_action,
                    "result": None,
                    "assessment": assessment,
                }

        # Also classify send_email body for data exfiltration attempts
        if tool_name == "send_email" and tool_input:
            body = tool_input.get("body", "")
            to = tool_input.get("to", "")
            content_to_check = f"Email to: {to}\nSubject: {tool_input.get('subject', '')}\nBody: {body}"
            assessment = await classify_content(
                agent_task=agent_task,
                content_to_check=content_to_check,
                content_source=f"send_email(to={to})",
                permission_manifest=self.manifest.to_dict(),
            )

            if assessment.recommended_action in ("block", "quarantine"):
                self.threats_caught += 1
                await self._handle_threat(assessment, tool_name, tool_input, agent_task)
                return {
                    "action": assessment.recommended_action,
                    "result": None,
                    "assessment": assessment,
                }

        # SAFE: log and pass through
        await self._log_safe_call(tool_name, tool_input, tool_result)
        return {"action": "allow", "result": tool_result, "assessment": None}

    async def _handle_threat(self, assessment, tool_name, tool_input, agent_task):
        """Log threat to audit trail and broadcast to dashboard via WebSocket."""
        event = self.audit.log_threat(assessment, tool_name, tool_input, agent_task)
        if self.ws_broadcast:
            await self.ws_broadcast({"type": "THREAT_DETECTED", "event": event})

    async def _log_safe_call(self, tool_name, tool_input, tool_result=None):
        """Log a safe tool call to audit trail and broadcast."""
        event = self.audit.log_safe(tool_name, tool_input)
        if self.ws_broadcast:
            await self.ws_broadcast({"type": "SAFE_CALL", "event": event})

    def _make_permission_violation(self, tool_name: str, reason: str) -> ThreatAssessment:
        """Create a ThreatAssessment for a manifest permission violation."""
        return ThreatAssessment(
            threat_type="PERMISSION_VIOLATION",
            confidence=1.0,
            severity="high",
            explanation=f"Agent tried to use '{tool_name}' which is not permitted: {reason}",
            extracted_payload=str(tool_name),
            recommended_action="block",
        )

    def reset(self):
        """Reset counters and manifest session state."""
        self.threats_caught = 0
        self.calls_inspected = 0
        self.manifest.reset()
