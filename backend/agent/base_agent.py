"""
TravelAgent — Gemini-powered travel booking agent.

This agent is intentionally NOT security-aware. It will follow any instructions
it finds, including malicious ones embedded in web pages. AgentShield is the
external layer that protects it.

Agentic loop uses Gemini function_call / function_response format.
"""

import asyncio
from google import genai
from google.genai import types
from .tools import GEMINI_TOOLS, execute_tool
from config import GEMINI_API_KEY, AGENT_MODEL

_client = None


def _get_client():
    global _client
    if _client is None:
        _client = genai.Client(api_key=GEMINI_API_KEY)
    return _client


AGENT_SYSTEM_PROMPT = """You are TravelBot, a helpful travel booking assistant.
Your job is to help users find and book flights, hotels, and activities.
You have access to web browsing, email, and calendar tools.

Instructions:
- Browse travel websites to find options for the user.
- Compare prices and find the best deals.
- When you find a good option, confirm it with the user.
- Use the email tool to send booking confirmations to the user.
- Complete the user's travel task efficiently and helpfully.

Always search for options, compare prices, and book the best deal."""


class TravelAgent:
    """
    Gemini-powered travel booking agent with an agentic tool-use loop.

    The agent calls tools, and AgentShield intercepts each tool result
    before it goes back to the agent's context window.
    """

    def __init__(self, shield=None):
        self.shield = shield
        self.current_task = ""

    async def run_task(self, task: str, context: str = "") -> dict:
        """
        Run the agent on a task with the full agentic loop.

        Gemini agentic loop:
        1. Send message to Gemini with tools
        2. Gemini returns parts — check each for function_call
        3. Execute the tool (get raw mock result)
        4. *** AgentShield intercepts here ***
        5. If SAFE → pass real result back as function_response
        6. If THREAT → pass quarantine notice back instead
        7. Repeat until no function_calls in response

        Returns:
            dict with keys:
                final_response: The agent's final text answer
                tool_calls_made: List of tool calls executed
                blocked_calls: List of tool calls that were blocked
        """
        self.current_task = task
        tool_calls_made = []
        blocked_calls = []

        # Broadcast agent start to dashboard
        if self.shield and self.shield.ws_broadcast:
            await self.shield.ws_broadcast({
                "type": "AGENT_START",
                "task": task,
                "context": context,
            })

        # Build conversation history as Gemini Content objects
        contents = [
            types.Content(
                role="user",
                parts=[types.Part(text=f"{context}\n\nTask: {task}")],
            )
        ]

        config = types.GenerateContentConfig(
            system_instruction=AGENT_SYSTEM_PROMPT,
            tools=GEMINI_TOOLS,
            max_output_tokens=2000,
        )

        max_iterations = 15  # Safety limit to prevent infinite loops
        iteration = 0

        while iteration < max_iterations:
            iteration += 1

            try:
                # Call Gemini with tools
                response = await asyncio.to_thread(
                    _get_client().models.generate_content,
                    model=AGENT_MODEL,
                    contents=contents,
                    config=config,
                )
            except Exception as e:
                error_msg = f"API Error: {str(e)}"
                if self.shield and self.shield.ws_broadcast:
                    await self.shield.ws_broadcast({
                        "type": "AGENT_DONE",
                        "result": error_msg,
                    })
                return {
                    "final_response": error_msg,
                    "tool_calls_made": tool_calls_made,
                    "blocked_calls": blocked_calls,
                }

            # Broadcast agent thinking text to dashboard
            if self.shield and self.shield.ws_broadcast:
                for part in response.candidates[0].content.parts:
                    if hasattr(part, "text") and part.text and part.text.strip():
                        await self.shield.ws_broadcast({
                            "type": "AGENT_THINKING",
                            "text": part.text[:300],
                        })

            # Check if any function calls exist in this response
            function_calls = [
                part
                for part in response.candidates[0].content.parts
                if part.function_call is not None
            ]

            # No function calls → agent is done
            if not function_calls:
                final_text = ""
                for part in response.candidates[0].content.parts:
                    if hasattr(part, "text") and part.text:
                        final_text += part.text

                if not final_text:
                    final_text = "Task completed."

                if self.shield and self.shield.ws_broadcast:
                    await self.shield.ws_broadcast({
                        "type": "AGENT_DONE",
                        "result": final_text[:500],
                    })

                return {
                    "final_response": final_text,
                    "tool_calls_made": tool_calls_made,
                    "blocked_calls": blocked_calls,
                }

            # Add agent's response (with function calls) to history
            contents.append(response.candidates[0].content)

            # Process each function call
            function_response_parts = []

            for part in function_calls:
                fc = part.function_call
                tool_name = fc.name
                tool_input = dict(fc.args) if fc.args else {}

                # Broadcast tool call to dashboard
                if self.shield and self.shield.ws_broadcast:
                    await self.shield.ws_broadcast({
                        "type": "TOOL_CALL",
                        "tool": tool_name,
                        "input": tool_input,
                    })

                # Execute the tool (get raw mock result)
                raw_result = execute_tool(tool_name, tool_input)

                tool_calls_made.append({
                    "tool": tool_name,
                    "input": tool_input,
                    "raw_result": raw_result[:200],
                })

                # *** AGENTSHIELD INTERCEPTS HERE ***
                if self.shield:
                    decision = await self.shield.intercept_tool_call(
                        tool_name=tool_name,
                        tool_input=tool_input,
                        tool_result=raw_result,
                        agent_task=self.current_task,
                    )

                    if decision["action"] in ("block", "quarantine"):
                        # Return a sanitized message instead of the real content
                        assessment = decision["assessment"]
                        safe_result = (
                            f"[AgentShield BLOCKED this content — "
                            f"{assessment.threat_type} detected with "
                            f"{assessment.confidence:.0%} confidence. "
                            f"{assessment.explanation}. "
                            f"Please try a different source.]"
                        )
                        blocked_calls.append({
                            "tool": tool_name,
                            "input": tool_input,
                            "threat_type": assessment.threat_type,
                            "confidence": assessment.confidence,
                        })
                        final_result = safe_result
                    else:
                        final_result = decision["result"]
                else:
                    final_result = raw_result

                # Package as Gemini function_response
                function_response_parts.append(
                    types.Part(
                        function_response=types.FunctionResponse(
                            name=tool_name,
                            response={"result": final_result},
                        )
                    )
                )

            # Add tool results to conversation history
            contents.append(
                types.Content(
                    role="user",
                    parts=function_response_parts,
                )
            )

        # Hit max iterations — return what we have
        return {
            "final_response": "Agent reached maximum iterations.",
            "tool_calls_made": tool_calls_made,
            "blocked_calls": blocked_calls,
        }
