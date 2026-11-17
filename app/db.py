"""SQLite storage, seed, migrations and transaction helpers. No passwords or data in Git."""
import sqlite3, json, os, secrets, hashlib, hmac, base64, time
from datetime import datetime, timedelta, timezone
from pathlib import Path
from contextlib import contextmanager

ROOT=Path(__file__).resolve().parent.parent
DB_PATH=Path(os.environ.get('CRUZA_DB_PATH',str(ROOT/'data'/'cruza.sqlite3')))

def utc(): return datetime.now(timezone.utc).isoformat(timespec='seconds')
def expire(hours=1): return (datetime.now(timezone.utc)+timedelta(hours=hours)).isoformat(timespec='seconds')

def hash_pwd(password):
    salt=secrets.token_bytes(16);n=260_000
    key=hashlib.pbkdf2_hmac('sha256',password.encode(),salt,n)
    return 'pbkdf2_sha256$%d$%s$%s'%(n,base64.b64encode(salt).decode(),base64.b64encode(key).decode())
def verify_pwd(pw,stored):
    try:
        method,n,salt,key=stored.split('$')
        if method!='pbkdf2_sha256':return False
        actual=hashlib.pbkdf2_hmac('sha256',pw.encode(),base64.b64decode(salt),int(n))
        return hmac.compare_digest(actual,base64.b64decode(key))
    except Exception: return False
DUMMY_HASH=hash_pwd('no-such-user-at-cruza')

def connect():
    DB_PATH.parent.mkdir(parents=True,exist_ok=True)
    c=sqlite3.connect(DB_PATH,timeout=10,isolation_level=None)
    c.row_factory=sqlite3.Row
    c.execute('PRAGMA foreign_keys=ON');c.execute('PRAGMA busy_timeout=10000');c.execute('PRAGMA journal_mode=WAL')
    return c
@contextmanager
def tx():
    c=connect(); c.execute('BEGIN IMMEDIATE')
    try:
        yield c;c.commit()
    except BaseException:
        c.rollback();raise
    finally:c.close()

def one(c,q,args=()):
    r=c.execute(q,args).fetchone();return dict(r) if r is not None else None

def allrows(c,q,args=()):return [dict(r) for r in c.execute(q,args).fetchall()]

def audit(c,actor,event,target='',details=''):
    c.execute('INSERT INTO audit(when_at,actor_id,event,target,details) VALUES(?,?,?,?,?)',(utc(),actor,event,target,str(details)[:350]))

def init_db(seed=False):
    with tx() as c:
        c.executescript('''
        CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY,username TEXT UNIQUE NOT NULL,
            full_name TEXT NOT NULL,email TEXT DEFAULT '',password_hash TEXT NOT NULL,
            role TEXT NOT NULL CHECK(role IN ('student','teacher','admin')),
            status TEXT NOT NULL CHECK(status IN ('active','pending','disabled','locked','reset_pending')),
            failed INTEGER NOT NULL DEFAULT 0,created_at TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS sessions(token_hash TEXT PRIMARY KEY,user_id INTEGER NOT NULL REFERENCES users(id),
            csrf TEXT NOT NULL,expires_at TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS courses(id INTEGER PRIMARY KEY,code TEXT NOT NULL UNIQUE,name TEXT NOT NULL,
            semester INTEGER NOT NULL CHECK(semester >0),credits INTEGER NOT NULL CHECK(credits>0),
            category TEXT NOT NULL CHECK(category IN ('Obligatoria','Optativa','Libre elección')));
        CREATE TABLE IF NOT EXISTS groups(id INTEGER PRIMARY KEY,course_id INTEGER NOT NULL REFERENCES courses(id),
            code TEXT NOT NULL,teacher_id INTEGER REFERENCES users(id),room TEXT NOT NULL,capacity INTEGER NOT NULL,
            sessions TEXT NOT NULL, UNIQUE(course_id,code));
        CREATE TABLE IF NOT EXISTS enrollments(student_id INTEGER NOT NULL REFERENCES users(id),
            course_id INTEGER NOT NULL REFERENCES courses(id), group_id INTEGER NOT NULL REFERENCES groups(id),
            period TEXT NOT NULL,PRIMARY KEY(student_id,course_id,period));
        CREATE TABLE IF NOT EXISTS drafts(student_id INTEGER PRIMARY KEY REFERENCES users(id),
            group_ids TEXT NOT NULL,updated_at TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS evaluations(id INTEGER PRIMARY KEY, group_id INTEGER NOT NULL REFERENCES groups(id),
            term INTEGER NOT NULL CHECK(term BETWEEN 1 AND 3), name TEXT NOT NULL,
            weight INTEGER NOT NULL CHECK(weight>0 AND weight<=100));
        CREATE TABLE IF NOT EXISTS grades(student_id INTEGER NOT NULL REFERENCES users(id),
            evaluation_id INTEGER NOT NULL REFERENCES evaluations(id),grade REAL CHECK(grade BETWEEN 0 AND 5),
            actor_id INTEGER REFERENCES users(id),updated_at TEXT,PRIMARY KEY(student_id,evaluation_id));
        CREATE TABLE IF NOT EXISTS attendance(student_id INTEGER NOT NULL REFERENCES users(id),
            group_id INTEGER NOT NULL REFERENCES groups(id),day TEXT NOT NULL,present INTEGER NOT NULL CHECK(present IN (0,1)),
            actor_id INTEGER NOT NULL REFERENCES users(id),PRIMARY KEY(student_id,group_id,day));
        CREATE TABLE IF NOT EXISTS history(id INTEGER PRIMARY KEY, student_id INTEGER NOT NULL REFERENCES users(id),
            course_id INTEGER NOT NULL REFERENCES courses(id),period TEXT NOT NULL,attempt INTEGER NOT NULL DEFAULT 1,
            grade REAL CHECK(grade BETWEEN 0 AND 5),credits INTEGER NOT NULL);
        CREATE TABLE IF NOT EXISTS agenda(id INTEGER PRIMARY KEY,student_id INTEGER NOT NULL REFERENCES users(id),
            title TEXT NOT NULL,due_date TEXT NOT NULL,due_time TEXT DEFAULT '',description TEXT DEFAULT '',
            course_id INTEGER REFERENCES courses(id),source TEXT DEFAULT 'personal',done INTEGER NOT NULL DEFAULT 0);
        CREATE TABLE IF NOT EXISTS activities(id INTEGER PRIMARY KEY,course_id INTEGER NOT NULL REFERENCES courses(id),
            title TEXT NOT NULL,due_date TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS activity_status(student_id INTEGER NOT NULL REFERENCES users(id),
            activity_id INTEGER NOT NULL REFERENCES activities(id),completed INTEGER NOT NULL DEFAULT 0,
            PRIMARY KEY(student_id,activity_id));
        CREATE TABLE IF NOT EXISTS recovery(id INTEGER PRIMARY KEY,user_id INTEGER NOT NULL REFERENCES users(id),
            status TEXT NOT NULL CHECK(status IN ('requested','issued','used','expired')),
            token_hash TEXT,expires_at TEXT,created_at TEXT NOT NULL,issued_by INTEGER REFERENCES users(id),used_at TEXT);
        CREATE TABLE IF NOT EXISTS abuse(key TEXT PRIMARY KEY, count INTEGER NOT NULL,window_at TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS audit(id INTEGER PRIMARY KEY,when_at TEXT NOT NULL,actor_id INTEGER,
            event TEXT NOT NULL,target TEXT NOT NULL,details TEXT NOT NULL);
        ''')
        if seed and not one(c,'SELECT id FROM users LIMIT 1'):seed_demo(c)

def seed_demo(c):
    creds=[('ADMIN','Administración académica','admin','ADMIN2026','active'),
        ('DOCENTE','Laura Ríos','teacher','CLASE2026','active'),
        ('ESTUDIANTE','Alex Rivera','student','CRUZA2026','active'),
        ('PENDIENTE','Sofía Martínez','student','CRUZA2026','pending')]
    for username,name,role,password,status in creds:
        c.execute('INSERT INTO users(username,full_name,email,password_hash,role,status,created_at) VALUES(?,?,?,?,?,?,?)',
            (username,name,username.lower()+'@demo.local',hash_pwd(password),role,status,utc()))
    teacher=one(c,"SELECT id FROM users WHERE username='DOCENTE'")['id']
    student=one(c,"SELECT id FROM users WHERE username='ESTUDIANTE'")['id']
    # Course ids stable, semester credits integer, realistic demo catalogue (fictitious).
    courses=[('DSI-101','Lógica y pensamiento computacional',1,3,'Obligatoria'),
      ('DSI-102','Fundamentos de programación',1,3,'Obligatoria'),
      ('MAT-101','Matemáticas básicas',1,3,'Obligatoria'),
      ('DSI-201','Algoritmos',2,3,'Obligatoria'),('DSI-202','Bases de datos',2,3,'Obligatoria'),
      ('MAT-202','Álgebra lineal',2,3,'Obligatoria'),('DSI-301','Desarrollo web',3,3,'Obligatoria'),
      ('DSI-302','Arquitectura de software',3,3,'Obligatoria'),('DSI-303','Bases de datos II',3,3,'Obligatoria'),
      ('ELE-301','Diseño de interfaces',3,2,'Optativa'),('ELE-302','Seguridad digital',3,2,'Optativa'),
      ('LIB-301','Arte y tecnología',3,2,'Libre elección'),
      ('DSI-401','Desarrollo móvil',4,3,'Obligatoria'),('DSI-402','Ingeniería de requisitos',4,3,'Obligatoria')]
    for x in courses:c.execute('INSERT INTO courses(code,name,semester,credits,category) VALUES(?,?,?,?,?)',x)
    groups=[('DSI-301','A','B-302',[('Lun','08:00','10:00'),('Mie','08:00','10:00')]),
      ('DSI-302','A','B-104',[('Mar','10:00','12:00')]),
      ('DSI-303','A','B-106',[('Jue','08:00','10:00')]),
      ('MAT-202','A','D-206',[('Lun','08:00','10:00')]),
      ('MAT-202','B','D-206',[('Vie','12:00','14:00')]),
      ('ELE-301','A','B-103',[('Mar','08:00','10:00')]),
      ('ELE-302','A','Lab-3',[('Vie','08:00','10:00')]),
      ('LIB-301','A','T-101',[('Mie','14:00','16:00')])]
    for code,g,room,blocks in groups:
        course=one(c,'SELECT id FROM courses WHERE code=?',(code,))
        c.execute('INSERT INTO groups(course_id,code,teacher_id,room,capacity,sessions) VALUES(?,?,?,?,?,?)',
           (course['id'],g,teacher,room,25,json.dumps([{'day':day,'start':st,'end':en} for day,st,en in blocks])))
    initial=['DSI-301','DSI-302','DSI-303']
    for code in initial:
        course=one(c,'SELECT id FROM courses WHERE code=?',(code,))
        group=one(c,'SELECT id FROM groups WHERE course_id=? AND code=?',(course['id'],'A'))
        c.execute('INSERT INTO enrollments VALUES(?,?,?,?)',(student,course['id'],group['id'],'2026-2'))
    draft=[r['group_id'] for r in allrows(c,'SELECT group_id FROM enrollments WHERE student_id=?',(student,))]
    c.execute('INSERT INTO drafts VALUES(?,?,?)',(student,json.dumps(draft),utc()))
    for row in allrows(c,'SELECT id FROM groups'):
        for term in (1,2,3):
            for n in range(2):
                c.execute('INSERT INTO evaluations(group_id,term,name,weight) VALUES(?,?,?,?)',
                  (row['id'],term,f'Evaluación {n+1}',50))
    for code,period,grade,attempt in [
      ('DSI-101','2025-1',4.2,1),('DSI-102','2025-1',4.0,1),('MAT-101','2025-1',3.7,1),
      ('DSI-201','2025-2',4.4,1),('DSI-202','2025-2',4.1,1)]:
        course=one(c,'SELECT id,credits FROM courses WHERE code=?',(code,))
        c.execute('INSERT INTO history(student_id,course_id,period,attempt,grade,credits) VALUES(?,?,?,?,?,?)',
          (student,course['id'],period,attempt,grade,course['credits']))
    for code,name,date in [('DSI-301','Entrega del proyecto web','2026-11-08'),
      ('DSI-302','Taller de arquitectura','2026-11-14'),
      ('DSI-303','Informe de bases de datos','2026-11-11')]:
        course=one(c,'SELECT id FROM courses WHERE code=?',(code,))
        c.execute('INSERT INTO activities(course_id,title,due_date) VALUES(?,?,?)',(course['id'],name,date))
    first=one(c,"SELECT id FROM activities WHERE title='Entrega del proyecto web'")
    c.execute('INSERT INTO activity_status VALUES(?,?,1)',(student,first['id']))
    c.execute('INSERT INTO agenda(student_id,title,due_date,due_time,description) VALUES(?,?,?,?,?)',
      (student,'Repasar antes de la exposición','2026-11-13','18:00','Preparar las diapositivas de CRUZA'))
    audit(c,None,'SEED_DEMO','','Datos de demostración; no usar para producción')
