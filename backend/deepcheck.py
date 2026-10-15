import urllib.request, json

BASE = 'http://127.0.0.1:8000'
results = []
PASS = 0
FAIL = 0

def check(name, url, method='GET', data=None, token=None, expect=None):
    global PASS, FAIL
    try:
        headers = {'Content-Type': 'application/json'}
        if token:
            headers['Authorization'] = f'Bearer {token}'
        if data:
            req = urllib.request.Request(url, data=json.dumps(data).encode(), headers=headers)
        else:
            req = urllib.request.Request(url, headers=headers)
        req.get_method = lambda: method
        r = urllib.request.urlopen(req, timeout=5)
        body = r.read().decode()
        status = r.status
        if expect and status != expect:
            results.append(f'  WARN [{status}] {name} (expected {expect})')
            FAIL += 1
        else:
            results.append(f'  OK   [{status}] {name}')
            PASS += 1
        try:
            return json.loads(body)
        except:
            return body
    except urllib.error.HTTPError as e:
        results.append(f'  ERR  [{e.code}] {name}')
        FAIL += 1
        return None
    except Exception as e:
        results.append(f'  FAIL [---] {name}: {str(e)[:60]}')
        FAIL += 1
        return None

# ---- Health
check('GET /health', BASE + '/health')

# ---- Auth: Register
check('POST /auth/register', BASE + '/auth/register', 'POST', {'name':'Deep Check','email':'deepcheck2@gmail.com','password':'aegis123'}, expect=201)

# ---- Auth: Login
login_data = 'username=deepcheck2%40gmail.com&password=aegis123'.encode()
req = urllib.request.Request(BASE + '/auth/login', data=login_data, headers={'Content-Type':'application/x-www-form-urlencoded'})
try:
    r = urllib.request.urlopen(req, timeout=5)
    tk = json.loads(r.read().decode())['access_token']
    results.append(f'  OK   [200] POST /auth/login (token acquired)')
    PASS += 1
except Exception as e:
    results.append(f'  FAIL [---] POST /auth/login: {str(e)[:60]}')
    FAIL += 1
    tk = None

check('GET /auth/me', BASE + '/auth/me', token=tk)

# ---- Contacts CRUD
c = check('POST /api/contacts/', BASE + '/api/contacts/', 'POST', {'name':'Safety Mom','relation':'Parent','phone':'+91 9876543210','priority':'Primary'}, tk, 201)
check('GET /api/contacts/', BASE + '/api/contacts/', token=tk)
if c and isinstance(c, dict):
    cid = c.get('id')
    check(f'DELETE /api/contacts/{cid}', BASE + f'/api/contacts/{cid}', 'DELETE', token=tk)

# ---- Alerts
a = check('POST /api/alerts/trigger', BASE + '/api/alerts/trigger', 'POST', {'x':81.8463,'y':25.4358}, tk, 201)
check('GET /api/alerts/active', BASE + '/api/alerts/active', token=tk)
check('GET /api/alerts/my', BASE + '/api/alerts/my', token=tk)
if a and isinstance(a, dict):
    aid = a.get('id')
    check(f'GET /api/alerts/{aid}/messages', BASE + f'/api/alerts/{aid}/messages', token=tk)
    check(f'POST /api/alerts/resolve/{aid}', BASE + f'/api/alerts/resolve/{aid}', 'POST', token=tk)

# ---- Hazards
check('POST /api/hazards/', BASE + '/api/hazards/', 'POST', {'category':'poor_lighting','description':'Lamp out on MG Road','x':81.84,'y':25.43}, tk, 201)
check('GET /api/hazards/ (public)', BASE + '/api/hazards/')

# ---- Auth: invalid creds
try:
    bad_data = 'username=nobody%40nowhere.com&password=wrongpass'.encode()
    req2 = urllib.request.Request(BASE + '/auth/login', data=bad_data, headers={'Content-Type':'application/x-www-form-urlencoded'})
    r2 = urllib.request.urlopen(req2, timeout=5)
    results.append(f'  WARN [BAD] POST /auth/login with wrong creds should have failed but succeeded!')
    FAIL += 1
except urllib.error.HTTPError as e:
    results.append(f'  OK   [{e.code}] POST /auth/login (bad creds correctly rejected)')
    PASS += 1

# ---- Auth: missing token
try:
    req3 = urllib.request.Request(BASE + '/auth/me')
    urllib.request.urlopen(req3, timeout=5)
    results.append(f'  WARN [BAD] GET /auth/me without token should have failed!')
    FAIL += 1
except urllib.error.HTTPError as e:
    results.append(f'  OK   [{e.code}] GET /auth/me (no token correctly rejected)')
    PASS += 1

print()
print('='*45)
print('   AEGIS COMPLETE DEEP CHECKUP REPORT')
print('='*45)
for line in results:
    print(line)
print()
print(f'  RESULT: {PASS} passed, {FAIL} failed')
print('='*45)
