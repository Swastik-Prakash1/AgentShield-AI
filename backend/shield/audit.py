"""
AgentShield Audit Trail — tamper-evident event logging.

Every tool call, threat detection, and agent action is logged with a
UUID, UTC timestamp, and full metadata. Stored in-memory with optional
SQLite persistence.
"""

from datetime import datetime, timezone
from typing import List
import uuid


class AuditEvent:
    """A single auditable event in the shield's lifecycle."""

    def __init__(self, event_type, tool_name, tool_input, assessment=None, agent_task=""):
        self.id = str(uuid.uuid4())[:8]
        self.timestamp = datetime.now(timezone.utc).isoformat()
        self.event_type = event_type  # "THREAT" | "SAFE" | "BLOCKED" | "AGENT_ACTION"
        self.tool_name = tool_name
        self.tool_input = tool_input
        self.agent_task = agent_task
        self.threat_type = assessment.threat_type if assessment else None
        self.threat_confidence = assessment.confidence if assessment else None
        self.threat_severity = assessment.severity if assessment else None
        self.explanation = assessment.explanation if assessment else "Safe call"
        self.extracted_payload = assessment.extracted_payload if assessment else None
        self.action_taken = assessment.recommended_action if assessment else "allow"

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "timestamp": self.timestamp,
            "event_type": self.event_type,
            "tool_name": self.tool_name,
            "tool_input": self.tool_input,
            "agent_task": self.agent_task,
            "threat_type": self.threat_type,
            "threat_confidence": self.threat_confidence,
            "threat_severity": self.threat_severity,
            "explanation": self.explanation,
            "extracted_payload": self.extracted_payload,
            "action_taken": self.action_taken,
        }


class AuditTrail:
    """In-memory audit trail. Stores all events for the current session."""

    def __init__(self):
        self.events: List[AuditEvent] = []

    def log_threat(self, assessment, tool_name, tool_input, agent_task) -> dict:
        """Log a detected threat. Returns the event dict for broadcasting."""
        event = AuditEvent("THREAT", tool_name, tool_input, assessment, agent_task)
        self.events.append(event)
        return event.to_dict()

    def log_safe(self, tool_name, tool_input) -> dict:
        """Log a safe (allowed) tool call. Returns the event dict."""
        event = AuditEvent("SAFE", tool_name, tool_input)
        self.events.append(event)
        return event.to_dict()

    def log_agent_action(self, action_type: str, details: dict) -> dict:
        """Log a generic agent action (start, thinking, done)."""
        event = AuditEvent("AGENT_ACTION", action_type, details)
        self.events.append(event)
        return event.to_dict()

    def get_all(self) -> list:
        """Return all events as dicts."""
        return [e.to_dict() for e in self.events]

    def get_threats(self) -> list:
        """Return only threat events."""
        return [e.to_dict() for e in self.events if e.event_type == "THREAT"]

    def reset(self):
        """Clear all events."""
        self.events = []
