import os
os.environ['CRUZA_DEMO_MODE']='1'
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.db import connect,one

@pytest.fixture
def c(tmp_path,monkeypatch):
    from app import db
    monkeypatch.setattr(db,'DB_PATH',tmp_path/'cruza-more.sqlite3')
    with TestClient(app) as client:yield client

def auth(c,username='ADMIN',password='ADMIN2026'):
    r=c.post('/api/login',json={'username':username,'password':password})
    assert r.status_code==200,r.text
    return {'X-CSRF-Token':r.json()['csrf']}

def test_pending_student_created_by_admin_only(c):
    student=auth(c,'ESTUDIANTE','CRUZA2026')
    denied=c.post('/api/admin/students',json={'username':'ALUMNO2','full_name':'Un Alumno',
        'password':'UnPassword2026'},headers=student)
    assert denied.status_code==403
    c.post('/api/logout',headers=student)
    admin=auth(c)
    p={'username':'ALUMNO2','full_name':'Un Alumno','password':'UnPassword2026'}
    assert c.post('/api/admin/students',json=p,headers=admin).status_code==200
    assert c.post('/api/login',json={'username':'ALUMNO2','password':'UnPassword2026'}).status_code==403
    uid=next(x['id'] for x in c.get('/api/admin').json()['users'] if x['username']=='ALUMNO2')
    assert c.put(f'/api/admin/users/{uid}/status',json={'status':'active'},headers=admin).status_code==200
    assert c.post('/api/login',json={'username':'ALUMNO2','password':'UnPassword2026'}).status_code==200

def test_successful_access_resets_fail_count(c):
    for _ in range(3):
        assert c.post('/api/login',json={'username':'ESTUDIANTE','password':'incorrecto'}).status_code==401
    assert c.post('/api/login',json={'username':'ESTUDIANTE','password':'CRUZA2026'}).status_code==200
    with connect() as db:
        row=one(db,"SELECT failed,status FROM users WHERE username='ESTUDIANTE'")
        assert row['failed']==0 and row['status']=='active'

def test_teacher_correction_needs_reason(c):
    headers=auth(c,'DOCENTE','CLASE2026')
    group=next(g for g in c.get('/api/teacher').json()['groups'] if g['students'])
    st=group['students'][0]
    eid=st['evaluations'][0]['id']
    r=c.put('/api/teacher/grade',json={'evaluation_id':eid,'student_id':st['id'],'grade':3.7},headers=headers)
    assert r.status_code==200
    r=c.put('/api/teacher/grade',json={'evaluation_id':eid,'student_id':st['id'],'grade':4.5},headers=headers)
    assert r.status_code==400
    assert 'motivo' in r.json()['error'].lower()
    r=c.put('/api/teacher/grade',json={'evaluation_id':eid,'student_id':st['id'],
        'grade':4.5,'reason':'Revisión sustentada del examen'},headers=headers)
    assert r.status_code==200
    with connect() as db:
        audit=one(db,"SELECT * FROM audit WHERE event='NOTA_EDITADA' ORDER BY id DESC LIMIT 1")
        assert 'Revisión sustentada' in audit['details']

def test_credit_limit_duplicate_course_and_no_blank_enroll(c):
    h=auth(c,'ESTUDIANTE','CRUZA2026')
    data=c.get('/api/student').json();gs=data['groups'];ids=data['draft']['group_ids']
    assert c.put('/api/student/draft',json={'group_ids':[]},headers=h).status_code==200
    assert c.post('/api/student/enroll/confirm',headers=h).status_code==400
    alge=[g for g in gs if g['course_code']=='MAT-202']
    assert len(alge)==2
    assert c.put('/api/student/draft',json={'group_ids':ids+[x['id'] for x in alge]},headers=h).status_code==400
    assert c.put('/api/student/draft',json={'group_ids':ids+[ids[0]]},headers=h).status_code==400

def test_known_and_unknown_username_recovery_generic(c):
    r1=c.post('/api/recovery/request',json={'username':'ESTUDIANTE'})
    r2=c.post('/api/recovery/request',json={'username':'USUARIO_INEXISTENTE'})
    assert r1.status_code==r2.status_code==200
    assert r1.json()['message']==r2.json()['message']

def test_admin_cannot_unlock_blocked_early_and_session_invalidates(c):
    student=auth(c,'ESTUDIANTE','CRUZA2026')
    for _ in range(4): c.post('/api/login',json={'username':'ESTUDIANTE','password':'incorrecto'})
    # Existing session cannot access anymore after the lock status changes.
    assert c.get('/api/student').status_code==401
    admin=auth(c,'ADMIN','ADMIN2026')
    users=c.get('/api/admin').json()['users'];sid=next(u['id'] for u in users if u['username']=='ESTUDIANTE')
    assert c.put(f'/api/admin/users/{sid}/status',json={'status':'active'},headers=admin).status_code==400

def test_admin_creates_course_and_group(c):
    h=auth(c)
    result=c.post('/api/admin/courses',headers=h,json={'code':'NUE-501','name':'Laboratorio de creatividad',
        'semester':5,'credits':3,'category':'Optativa'})
    assert result.status_code==200,result.text
    admin_data=c.get('/api/admin').json()
    co=next(x for x in admin_data['courses'] if x['code']=='NUE-501')
    teacher=next(u for u in admin_data['users'] if u['role']=='teacher')
    body={'course_id':co['id'],'code':'A','teacher_id':teacher['id'],'capacity':20,'room':'A-10',
        'sessions':[{'day':'Vie','start':'14:00','end':'16:00'}]}
    r=c.post('/api/admin/groups',headers=h,json=body)
    assert r.status_code==200,r.text
    groups=c.get('/api/admin').json()['groups']
    assert any(g['course_id']==co['id'] for g in groups)

def test_student_cannot_update_other_agenda(c):
    h=auth(c,'ESTUDIANTE','CRUZA2026')
    assert c.patch('/api/student/agenda/999999',headers=h,json={'done':True}).status_code==404
    assert c.delete('/api/student/agenda/999999',headers=h).status_code==404


def test_creditos_deben_ser_enteros_no_decimales(c):
    admin=auth(c)
    base={'code':'NUE-900','name':'Laboratorio de prueba','semester':3,'category':'Optativa'}
    for value in (2.5,2.0,'2.5',True):
        r=c.post('/api/admin/courses',headers=admin,json={**base,'credits':value})
        assert r.status_code==400,(value,r.text)
    accepted=c.post('/api/admin/courses',headers=admin,json={**base,'credits':2})
    assert accepted.status_code==200,accepted.text
