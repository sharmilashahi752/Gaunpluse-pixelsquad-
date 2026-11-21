import urllib.request
import json
import sys

BASE = 'http://127.0.0.1:8000/api/reports'

endpoints = [
    ('Dashboard Stats', 'http://127.0.0.1:8000/api/dashboard/stats', 'GET', None),
    ('Reports Overview', f'{BASE}/overview', 'GET', None),
    ('Reports Categories', f'{BASE}/categories', 'GET', None),
    ('Reports Trends (6m)', f'{BASE}/trends?range=6m', 'GET', None),
    ('Reports Status Distribution', f'{BASE}/status-distribution', 'GET', None),
    ('Reports Priorities', f'{BASE}/priorities', 'GET', None),
    ('Reports Ward Comparison', f'{BASE}/ward-comparison', 'GET', None),
    ('Reports Infrastructure Condition', f'{BASE}/infrastructure-condition', 'GET', None),
    ('Reports Simulations Summary', f'{BASE}/simulations', 'GET', None),
    ('Reports Records (Issues)', f'{BASE}/records?type=issues&per_page=5', 'GET', None),
    ('Reports CSV Export', f'{BASE}/export?format=csv&type=issues', 'GET', None),
    ('Reports JSON Export', f'{BASE}/export?format=json&type=issues', 'GET', None),
    ('Reports AI Insights', f'{BASE}/ai-insights', 'POST', {}),
]

all_passed = True
print("Verifying Live Reporting & Analytics APIs on http://127.0.0.1:8000...")
for name, url, method, data in endpoints:
    req = urllib.request.Request(url, method=method)
    body = None
    if data is not None:
        req.add_header('Content-Type', 'application/json')
        body = json.dumps(data).encode('utf-8')
    try:
        with urllib.request.urlopen(req, data=body, timeout=10) as resp:
            content = resp.read()
            ct = resp.headers.get('Content-Type', '')
            if 'json' in ct:
                parsed = json.loads(content.decode('utf-8'))
                keys = list(parsed.keys())[:4]
                print(f"[PASS] {name:<35} HTTP {resp.status} - Keys: {keys}")
            else:
                print(f"[PASS] {name:<35} HTTP {resp.status} - {ct} ({len(content)} bytes)")
    except Exception as e:
        print(f"[FAIL] {name:<35} ERROR: {e}")
        all_passed = False

if all_passed:
    print("\nALL 13 API ENDPOINTS PASSED SUCCESSFULLY!")
    sys.exit(0)
else:
    print("\nSOME API ENDPOINTS FAILED!")
    sys.exit(1)
