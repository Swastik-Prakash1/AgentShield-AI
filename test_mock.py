import asyncio
import sys
import os
from pathlib import Path
from unittest.mock import MagicMock
from google.genai import types

os.environ["GEMINI_API_KEY"] = "mock"

# Add backend dir to path so its internal imports resolve correctly
sys.path.insert(0, str(Path(__file__).resolve().parent / "backend"))

# Mock the client before importing base_agent
from backend.agent.base_agent import TravelAgent, _get_client
import backend.agent.base_agent

mock_client = MagicMock()
backend.agent.base_agent._client = mock_client

async def run_test():
    agent = TravelAgent()
    
    # Setup mock response 1: tool call
    mock_response_1 = MagicMock()
    mock_part_1 = types.Part(
        function_call=types.FunctionCall(
            name="browse_web",
            args={"url": "https://grandmarinahotel.com"}
        )
    )
    mock_response_1.candidates = [MagicMock(content=types.Content(parts=[mock_part_1]))]
    
    # Setup mock response 2: final answer
    mock_response_2 = MagicMock()
    mock_part_2 = types.Part(text="I found the hotel.")
    mock_response_2.candidates = [MagicMock(content=types.Content(parts=[mock_part_2]))]
    
    mock_client.models.generate_content.side_effect = [mock_response_1, mock_response_2]
    
    result = await agent.run_task("Find a hotel")
    print(result)

if __name__ == "__main__":
    asyncio.run(run_test())
