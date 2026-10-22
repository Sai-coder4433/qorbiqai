import json
import os
import ssl
import urllib.request

ctx = ssl._create_unverified_context()

# Load access token
with open('/Users/saichakankar/.config/configstore/firebase-tools.json') as f:
    cfg = json.load(f)
token = cfg.get('tokens', {}).get('access_token')

# Load database
data_path = '/Users/saichakankar/Downloads/remix-remix-localos-ai/.data-reviewflow.json'
with open(data_path) as f:
    db_data = json.load(f)

def to_firestore_value(val):
    if val is None:
        return {'nullValue': None}
    elif isinstance(val, bool):
        return {'booleanValue': val}
    elif isinstance(val, int):
        return {'integerValue': str(val)}
    elif isinstance(val, float):
        return {'doubleValue': val}
    elif isinstance(val, str):
        return {'stringValue': val}
    elif isinstance(val, list):
        return {'arrayValue': {'values': [to_firestore_value(item) for item in val]}}
    elif isinstance(val, dict):
        return {'mapValue': {'fields': {k: to_firestore_value(v) for k, v in val.items()}}}
    return {'stringValue': str(val)}

def write_doc(collection_name, doc_id, fields_dict):
    url = f'https://firestore.googleapis.com/v1/projects/localos-ai-prod-saas/databases/(default)/documents/{collection_name}/{doc_id}'
    payload = {
        'fields': {k: to_firestore_value(v) for k, v in fields_dict.items() if v is not None}
    }
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode('utf-8'),
        headers={
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        },
        method='PATCH'
    )
    with urllib.request.urlopen(req, context=ctx) as resp:
        return resp.read()

print('Starting bulk sync to Firebase Firestore (localos-ai-prod-saas)...')

# 1. Sync Users
user_count = 0
for u in db_data.get('users', []):
    write_doc('users', u['uid'], u)
    user_count += 1
print(f'Synced {user_count} users to Firestore.')

# 2. Sync Businesses
biz_count = 0
for b in db_data.get('businesses', []):
    write_doc('businesses', b['id'], b)
    biz_count += 1
print(f'Synced {biz_count} businesses to Firestore.')

# 3. Sync QR Codes
qr_count = 0
for q in db_data.get('qrCodes', []):
    write_doc('qr_codes', q['id'], q)
    qr_count += 1
print(f'Synced {qr_count} QR codes to Firestore.')

# 4. Sync Subscriptions
sub_count = 0
for s in db_data.get('subscriptions', []):
    write_doc('subscriptions', s['id'], s)
    sub_count += 1
print(f'Synced {sub_count} subscriptions to Firestore.')

print('Bulk synchronization to Firestore completed successfully!')
