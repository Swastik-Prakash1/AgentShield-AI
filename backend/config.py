"""AgentShield configuration — loads environment variables."""

import os
from dotenv import load_dotenv
from pathlib import Path

# Load .env from project root
_env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(_env_path)

# Gemini
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
SHIELD_CLASSIFIER_MODEL = os.getenv("SHIELD_CLASSIFIER_MODEL", "gemini-3.5-flash")
AGENT_MODEL = os.getenv("AGENT_MODEL", "gemini-3.5-flash")

# Demo
DEMO_ARTIFICIAL_DELAY_MS = int(os.getenv("DEMO_ARTIFICIAL_DELAY_MS", "800"))

# Paths
PROJECT_ROOT = Path(__file__).resolve().parent.parent
MANIFEST_DIR = PROJECT_ROOT / "manifests"
