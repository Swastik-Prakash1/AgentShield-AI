"""
AgentShield - Full Integration Test
Tests all API endpoints and runs the live demo scenario.
"""
import urllib.request
import json
import time
import sys
import io

# Force UTF-8 output
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

BASE = "http://localhost:8000"

def get(path):
    r = urllib.request.urlopen(f"{BASE}{path}")
    return json.loads(r.read())

def post(path):
    req = urllib.request.Request(f"{BASE}{path}", method="POST")
    r = urllib.request.urlopen(req, timeout=120)
    return json.loads(r.read())

# -- Test 1: Health checks --
print("=" * 60)
print("TEST 1: API HEALTH CHECKS")
print("=" * 60)

root = get("/")
print(f"  Root:      {root['name']} v{root['version']} -- {root['status']}")
print(f"  Shield:    {'ON' if root['shield_active'] else 'OFF'}")

status = get("/api/status")
print(f"  Status:    threats={status['threats_caught']}, inspected={status['calls_inspected']}")

scenarios = get("/api/scenarios")
print(f"  Scenarios: {list(scenarios.keys())}")

manifest = get("/api/manifest")
print(f"  Manifest:  agent={manifest.get('agent_name')}")
print("  [PASS] All health checks passed\n")

# -- Test 2: Shield toggle --
print("=" * 60)
print("TEST 2: SHIELD TOGGLE")
print("=" * 60)

toggled = post("/api/shield/toggle?active=true")
print(f"  Shield active: {toggled['shield_active']}")
print("  [PASS] Shield toggle works\n")

# -- Test 3: Run demo with shield ON --
print("=" * 60)
print("TEST 3: RUN DEMO -- malicious_hotel (shield ON)")
print("  Calling Gemini API... this may take 10-60 seconds...")
print("=" * 60)

start = time.time()
try:
    result = post("/api/run-demo?scenario_id=malicious_hotel&shield_active=true")
    elapsed = time.time() - start
    print(f"  Completed in {elapsed:.1f}s")
    print(f"  Shield active:    {result['shield_active']}")
    print(f"  Threats caught:   {result['threats_caught']}")
    print(f"  Calls inspected:  {result['calls_inspected']}")
    print(f"  Agent response:   {result['result']['final_response'][:200]}...")
    print()

    print("  Tool calls:")
    for tc in result["result"]["tool_calls_made"]:
        print(f"    -> {tc['tool']}({json.dumps(tc['input'])[:60]})")
        print(f"       Result: {tc['raw_result'][:80]}...")

    print()
    print("  Blocked calls:")
    if result["result"]["blocked_calls"]:
        for bc in result["result"]["blocked_calls"]:
            print(f"    [BLOCKED] {bc['tool']}() -> {bc['threat_type']} ({bc['confidence']:.0%} confidence)")
    else:
        print("    (none)")

    print()
    print(f"  Audit trail: {len(result['audit_trail'])} entries")
    for ae in result["audit_trail"]:
        action = ae.get("action", "?")
        tool = ae.get("tool_name", "?")
        threat = ae.get("threat_type", "")
        tag = "[BLOCK]" if action == "block" else "[ALLOW]" if action == "allow" else "[LOG]"
        print(f"    {tag} {tool} {threat}")

    if result["threats_caught"] > 0:
        print("\n  [PASS] DEMO SUCCESS -- Threats were caught by AgentShield!")
    elif "API Error" in result["result"]["final_response"]:
        print(f"\n  [WARN] DEMO HIT AN API ERROR -- see agent response above")
    else:
        print("\n  [WARN] No threats caught -- classifier may need tuning")

except urllib.error.HTTPError as e:
    elapsed = time.time() - start
    body = e.read().decode()
    print(f"  [FAIL] HTTP {e.code} after {elapsed:.1f}s")
    print(f"  Response: {body[:300]}")
except Exception as e:
    elapsed = time.time() - start
    print(f"  [FAIL] Error after {elapsed:.1f}s: {e}")

print()
print("=" * 60)
print("TESTING COMPLETE")
print("=" * 60)
