import urllib.request
import urllib.error
import json
import sys

BASE_LARAVEL = "http://127.0.0.1:8000/api"
BASE_AI = "http://127.0.0.1:8001"

def req(name, method, url, data=None):
    try:
        r = urllib.request.Request(url, method=method)
        if data:
            r.data = json.dumps(data).encode("utf-8")
            r.add_header("Content-Type", "application/json")
        with urllib.request.urlopen(r, timeout=6) as resp:
            content = resp.read()
            parsed = json.loads(content) if content else {}
            count = len(parsed) if isinstance(parsed, list) else len(parsed.keys())
            print(f"[PASS] {name:<35} HTTP {resp.status} - size: {len(content):<6} items/keys: {count}")
            return True, parsed
    except urllib.error.HTTPError as e:
        err_msg = e.read().decode("utf-8", errors="replace")[:250]
        print(f"[FAIL] {name:<35} HTTP {e.code} - {err_msg}")
        return False, None
    except Exception as e:
        print(f"[ERR ] {name:<35} {str(e)[:100]}")
        return False, None

print("=" * 70)
print("GAUNPULSE COMPREHENSIVE SYSTEM & FEATURE AUDIT")
print("=" * 70)

# 1. Health & Core
req("FastAPI Intelligence Health", "GET", f"{BASE_AI}/health")
req("Dashboard Real-time Stats", "GET", f"{BASE_LARAVEL}/dashboard/stats")

# 2. Location & Hierarchy
req("Locations - Provinces", "GET", f"{BASE_LARAVEL}/locations/provinces")
req("Locations - Districts", "GET", f"{BASE_LARAVEL}/locations/districts?province=Bagmati")
req("Locations - Municipalities", "GET", f"{BASE_LARAVEL}/locations/municipalities?district=Sindhupalchok")
req("Locations - Wards", "GET", f"{BASE_LARAVEL}/locations/wards?district=Sindhupalchok&municipality=Helambu%20Rural%20Municipality")
req("Locations - Search", "GET", f"{BASE_LARAVEL}/locations/search?q=Bhotenamlang")

# 3. Villages & Infrastructure
ok, villages = req("Villages - List", "GET", f"{BASE_LARAVEL}/villages")
v_id = villages[0]["id"] if ok and isinstance(villages, list) and len(villages) > 0 else 1

req(f"Villages - Single (ID {v_id})", "GET", f"{BASE_LARAVEL}/villages/{v_id}")
req(f"Villages - Network (ID {v_id})", "GET", f"{BASE_LARAVEL}/villages/{v_id}/network")
req(f"Villages - Readiness (ID {v_id})", "GET", f"{BASE_LARAVEL}/villages/{v_id}/network-readiness")
req(f"Villages - Integrity (ID {v_id})", "GET", f"{BASE_LARAVEL}/villages/{v_id}/integrity")
req(f"Villages - Discover OSM (ID {v_id})", "GET", f"{BASE_LARAVEL}/villages/{v_id}/discover-osm")

# 4. Issues & Alerts
ok, issues = req("Issues - List", "GET", f"{BASE_LARAVEL}/issues")
iss_id = issues[0]["id"] if ok and isinstance(issues, list) and len(issues) > 0 else 1
req(f"Issues - Detail (ID {iss_id})", "GET", f"{BASE_LARAVEL}/issues/{iss_id}")

# 5. Action Plans
ok, plans = req("Action Plans - List", "GET", f"{BASE_LARAVEL}/action-plans")
plan_id = plans[0]["id"] if ok and isinstance(plans, list) and len(plans) > 0 else 1
req(f"Action Plans - Detail (ID {plan_id})", "GET", f"{BASE_LARAVEL}/action-plans/{plan_id}")

# 6. Community Voices & Feedback
req("Community Feedback - List", "GET", f"{BASE_LARAVEL}/feedback")

# 7. Simulations
req("Simulations - List", "GET", f"{BASE_LARAVEL}/simulations")

# 8. Reports & Insights
req("Reports - Overview", "GET", f"{BASE_LARAVEL}/reports/overview")
req("Reports - Categories", "GET", f"{BASE_LARAVEL}/reports/categories")
req("Reports - Trends", "GET", f"{BASE_LARAVEL}/reports/trends")
req("Reports - Status Distribution", "GET", f"{BASE_LARAVEL}/reports/status-distribution")
req("Reports - Priorities", "GET", f"{BASE_LARAVEL}/reports/priorities")
req("Reports - Ward Comparison", "GET", f"{BASE_LARAVEL}/reports/ward-comparison")
req("Reports - Infrastructure Condition", "GET", f"{BASE_LARAVEL}/reports/infrastructure-condition")
req("Reports - Simulation Summary", "GET", f"{BASE_LARAVEL}/reports/simulations")
req("Reports - Paginated Records", "GET", f"{BASE_LARAVEL}/reports/records?type=issues&page=1")

# 9. AI Decision Support & Agent
req("AI Insights - Village 1", "GET", f"{BASE_LARAVEL}/ai/insights?village_id=1")
req("AI Chat (via Laravel)", "POST", f"{BASE_LARAVEL}/ai/chat", {"message": "What is the status of Seti bridge?", "village_id": v_id})
req("AI Chat (via FastAPI direct)", "POST", f"{BASE_AI}/ai/chat", {"message": "What is the status of Seti bridge?", "village_id": v_id})

print("=" * 70)
print("AUDIT COMPLETE")
print("=" * 70)
