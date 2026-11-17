import pytest
import os
os.environ["CRUZA_DEMO_MODE"]="1"
from fastapi.testclient import TestClient
from app.main import app
from app.db import connect,one,hash_pwd

@pytest.fixture
def client(tmp_path,monkeypatch):
    from app import db
    monkeypatch.setattr(db,'DB_PATH',tmp_path/'cruza-test.sqlite3')
    # main's imported `connect` points to the same function, which dereferences db.DB_PATH.
    with TestClient(app) as c:yield c

def logged(c,username,password):
    r=c.post('/api/login',json={'username':username,'password':password})
    assert r.status_code==200,r.text
    return {'X-CSRF-Token':r.json()['csrf']}

def test_roles_routes_and_no_self_register(client):
    c=client
    assert c.get('/api/student').status_code==401
    assert c.post('/api/register',json={}).status_code==404
    h=logged(c,'ESTUDIANTE','CRUZA2026')
    assert c.get('/api/student').status_code==200
    assert c.get('/api/admin').status_code==403
    assert c.get('/api/teacher').status_code==403
    assert c.post('/api/student/draft/discard').status_code==403 # CSRF required
    assert c.post('/api/student/draft/discard',headers=h).status_code==200
    assert c.post('/api/logout',headers=h).status_code==200
    h=logged(c,'DOCENTE','CLASE2026')
    assert c.get('/api/teacher').status_code==200
    assert c.get('/api/student').status_code==403
    assert c.get('/api/admin').status_code==403

def test_four_failures_lock_and_recovery(client):
    c=client
    for n in range(1,5):
        r=c.post('/api/login',json={'username':'ESTUDIANTE','password':'incorrecto'})
        assert r.status_code==401
        with connect() as db:
            u=one(db,"SELECT status,failed FROM users WHERE username='ESTUDIANTE'")
            assert u['failed']==n
            assert u['status']==('locked' if n==4 else 'active')
    assert c.post('/api/login',json={'username':'ESTUDIANTE','password':'CRUZA2026'}).status_code==423
    res=c.post('/api/recovery/request',json={'username':'ESTUDIANTE'})
    assert res.status_code==200
    admin_headers=logged(c,'ADMIN','ADMIN2026')
    req=c.get('/api/admin').json()['recovery'][0]
    assert req['status']=='requested'
    with connect() as db: uid=one(db,"SELECT id FROM users WHERE username='ESTUDIANTE'")['id']
    assert c.put(f'/api/admin/users/{uid}/status',json={'status':'active'},headers=admin_headers).status_code==400
    issue=c.post(f"/api/admin/recovery/{req['id']}/issue",headers=admin_headers)
    assert issue.status_code==200,issue.text
    token=issue.json()['code'];assert token
    assert c.post('/api/recovery/redeem',json={'username':'ESTUDIANTE','code':'false','new_password':'NuevaClave2026!'}).status_code==400
    r=c.post('/api/recovery/redeem',json={'username':'ESTUDIANTE','code':token,'new_password':'NuevaClave2026!'})
    assert r.status_code==200,r.text
    assert c.post('/api/recovery/redeem',json={'username':'ESTUDIANTE','code':token,'new_password':'OtraClave2026!'}).status_code==400
    assert c.post('/api/login',json={'username':'ESTUDIANTE','password':'NuevaClave2026!'}).status_code==423
    assert c.put(f'/api/admin/users/{uid}/status',json={'status':'active'},headers=admin_headers).status_code==200
    assert c.post('/api/login',json={'username':'ESTUDIANTE','password':'NuevaClave2026!'}).status_code==200

def test_enrollment_conflict_and_group_switch(client):
    c=client;h=logged(c,'ESTUDIANTE','CRUZA2026')
    data=c.get('/api/student').json();groups=data['groups'];ids=data['draft']['group_ids']
    matA=next(g for g in groups if g['course_code']=='MAT-202' and g['code']=='A')
    matB=next(g for g in groups if g['course_code']=='MAT-202' and g['code']=='B')
    oneplus=ids+[matA['id']]
    r=c.put('/api/student/draft',json={'group_ids':oneplus},headers=h)
    assert r.status_code==200
    assert r.json()['problems']
    assert c.post('/api/student/enroll/confirm',headers=h).status_code==400
    before=c.get('/api/student').json()['draft']['confirmed']
    assert not any(x['course_id']==matA['course_id'] for x in before)
    r=c.put('/api/student/draft',json={'group_ids':ids+[matB['id']]},headers=h)
    assert not r.json()['problems']
    assert c.post('/api/student/enroll/confirm',headers=h).status_code==200
    after=c.get('/api/student').json()['draft']['confirmed']
    assert any(x['group_id']==matB['id'] for x in after)
    assert c.get('/api/student/schedule.csv').status_code==200

def test_teacher_marks_student_student_sees_it(client):
    c=client;student=logged(c,'ESTUDIANTE','CRUZA2026')
    student_data=c.get('/api/student').json()
    grade=student_data['grades'][0]
    sid=next(x['id'] for x in [student_data['profile']] if False) if False else 3
    c.post('/api/logout',headers=student)
    teacher=logged(c,'DOCENTE','CLASE2026')
    t=c.get('/api/teacher').json()['groups'];g=next(g for g in t if g['students'])
    s=g['students'][0];eval0=s['evaluations'][0]['id']
    r=c.put('/api/teacher/grade',json={'student_id':s['id'],'evaluation_id':eval0,'grade':4.5},headers=teacher)
    assert r.status_code==200,r.text
    r=c.put('/api/teacher/attendance',json={'student_id':s['id'],'group_id':g['id'],'day':'2026-11-10','present':True},headers=teacher)
    assert r.status_code==200,r.text
    c.post('/api/logout',headers=teacher)
    student=logged(c,'ESTUDIANTE','CRUZA2026')
    new=c.get('/api/student').json();a=[e for course in new['grades'] for e in course['evaluations'] if e['id']==eval0]
    assert a and a[0]['grade']==4.5

def test_notes_ownership_and_agenda(client):
    c=client;h=logged(c,'ESTUDIANTE','CRUZA2026')
    wrong=c.put('/api/teacher/grade',json={'student_id':3,'evaluation_id':1,'grade':5},headers=h)
    assert wrong.status_code==403
    a=c.post('/api/student/agenda',json={'title':'Exposición','due_date':'2026-11-14','description':'Presentar CRUZA'},headers=h)
    assert a.status_code==200
    obj=next(x for x in c.get('/api/student').json()['agenda'] if x['title']=='Exposición')
    assert c.patch(f"/api/student/agenda/{obj['id']}",json={'done':True},headers=h).status_code==200
    assert c.get('/api/student').json()['agenda'][-1]['done']==1
    assert c.delete(f"/api/student/agenda/{obj['id']}",headers=h).status_code==200
    assert all(x['id']!=obj['id'] for x in c.get('/api/student').json()['agenda'])
