import sqlite3

db_path = r'C:\Users\Prabhat singh\OneDrive\Documents\minor project\backend\aegis.db'
conn = sqlite3.connect(db_path)
cur = conn.cursor()

print('=== DATABASE SCHEMA CHECK ===')
cur.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
tables = [r[0] for r in cur.fetchall()]
print('Tables:', tables)

for t in tables:
    cur.execute(f'SELECT COUNT(*) FROM {t}')
    count = cur.fetchone()[0]
    cur.execute(f'PRAGMA table_info({t})')
    cols = [c[1] for c in cur.fetchall()]
    print(f'  {t}: {count} rows | cols: {cols}')

conn.close()
print('=== DB CHECK COMPLETE ===')
