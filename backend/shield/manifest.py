"""
AgentShield Permission Manifest — YAML-based declarative permission system.

Defines exactly what the agent is allowed to do: which tools, which domains,
which email recipients, rate limits, etc. Fast deterministic checks — no API calls.
"""

import yaml
from pathlib import Path


class PermissionManifest:
    """
    Loads and enforces a YAML permission manifest.

    The manifest declares:
    - Which tools the agent may use
    - Domain allow-lists for browse_web
    - Recipient allow-lists for send_email
    - Rate limits (max emails per session)
    - Explicitly denied actions
    """

    def __init__(self, yaml_path: str):
        with open(yaml_path, "r") as f:
            self.config = yaml.safe_load(f)
        self._email_count = 0

    def check_tool_permission(self, tool_name: str, tool_input: dict) -> str | None:
        """
        Check if a tool call is permitted by the manifest.

        Returns:
            None if the call is allowed.
            A string describing the violation if blocked.
        """
        tool_config = self.config.get("allowed_tools", {}).get(tool_name)

        # Tool not defined in manifest at all
        if tool_config is None:
            return f"Tool '{tool_name}' is not listed in the permission manifest"

        # Explicit allowed: false
        if tool_config.get("allowed") is False:
            return f"Tool '{tool_name}' is explicitly disabled in the manifest"

        # browse_web: domain allow-list check
        if tool_name == "browse_web":
            url = tool_input.get("url", "")
            allowed_domains = tool_config.get("allowed_domains", [])
            if allowed_domains:
                domain = url.split("//")[-1].split("/")[0].replace("www.", "")
                if not any(d in domain for d in allowed_domains):
                    return f"Domain '{domain}' not in allowed list: {allowed_domains}"

        # send_email: recipient allow-list + rate limit
        if tool_name == "send_email":
            to = tool_input.get("to", "")
            allowed_recipients = tool_config.get("allowed_recipients", [])
            if allowed_recipients and to not in allowed_recipients:
                return f"Recipient '{to}' not in allowed list: {allowed_recipients}"

            max_emails = tool_config.get("max_per_session", 5)
            if self._email_count >= max_emails:
                return f"Email rate limit of {max_emails} per session exceeded"
            self._email_count += 1

        # get_calendar: explicit disable check (already handled above by allowed: false)
        # Kept for clarity

        return None

    def reset(self):
        """Reset per-session counters (e.g., email count)."""
        self._email_count = 0

    def to_dict(self) -> dict:
        """Return the raw manifest config as a dict."""
        return self.config
