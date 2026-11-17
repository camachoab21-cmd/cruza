import os
os.environ['CRUZA_DEMO_MODE']='1'
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.db import connect,one
from app.logic import grade_summary

@pytest.fixture
def c(tmp_path,monkeypatch):
    from app import db
    monkeypatch.setattr(db,'DB_PATH',tmp_path/'completion.sqlite3')
    with TestClient(app) as client: yield client

def auth(c,user='ADMIN',password='ADMIN2026'):
    r=c.post('/api/login',json={'username':user,'password':password})
    assert r.status_code==200,r.text
    return {'X-CSRF-Token':r.json()['csrf']}

def test_invalid_recovery_attempts_are_counted(c):
    for _ in range(12):
        assert c.post('/api/recovery/redeem',json={'username':'NOEXISTE','code':'bad','new_password':'PasswordValida2026'}).status_code==400
    assert c.post('/api/recovery/redeem',json={'username':'NOEXISTE','code':'bad','new_password':'PasswordValida2026'}).status_code==429

def test_disabled_account_cannot_redeem_old_code(c):
    c.post('/api/recovery/request',json={'username':'ESTUDIANTE'})
    h=auth(c); d=c.get('/api/admin').json(); uid=next(x['id'] for x in d['users'] if x['username']=='ESTUDIANTE')
    rid=d['recovery'][0]['id']; code=c.post(f'/api/admin/recovery/{rid}/issue',headers=h).json()['code']
    assert c.put(f'/api/admin/users/{uid}/status',headers=h,json={'status':'disabled'}).status_code==200
    assert c.post('/api/recovery/redeem',json={'username':'ESTUDIANTE','code':code,'new_password':'PasswordValida2026'}).status_code==400

def test_invalid_clock_and_internal_overlap(c):
    h=auth(c); d=c.get('/api/admin').json(); co=d['courses'][0]['id']
    base={'course_id':co,'code':'Z','capacity':20,'room':'Aula'}
    for spans in [[{'day':'Lun','start':'25:00','end':'26:00'}],[{'day':'Lun','start':'08:00','end':'10:00'},{'day':'Lun','start':'09:00','end':'11:00'}]]:
        assert c.post('/api/admin/groups',headers=h,json={**base,'sessions':spans}).status_code==400

def test_profile_persists_and_role_cannot_be_changed(c):
    h=auth(c,'ESTUDIANTE','CRUZA2026')
    assert c.put('/api/student/profile',headers=h,json={'full_name':'Alex Presentación','email':'alex@example.com','role':'admin'}).status_code==200
    d=c.get('/api/student').json();assert d['profile']['full_name']=='Alex Presentación'
    assert c.get('/api/admin').status_code==403

def test_administrator_creates_teacher_and_assigns_group(c):
    h=auth(c)
    r=c.post('/api/admin/users',headers=h,json={'username':'PROFE2','full_name':'Otra docente','password':'PasswordValida2026','role':'teacher','email':''})
    assert r.status_code==200,r.text
    d=c.get('/api/admin').json(); uid=next(u['id'] for u in d['users'] if u['username']=='PROFE2')
    assert c.put(f'/api/admin/users/{uid}/status',headers=h,json={'status':'active'}).status_code==200
    group=d['groups'][0]
    r=c.put(f"/api/admin/groups/{group['id']}",headers=h,json={**group,'teacher_id':uid})
    assert r.status_code==200,r.text
    auth(c,'PROFE2','PasswordValida2026')
    assert group['id'] in [g['id'] for g in c.get('/api/teacher').json()['groups']]

def test_teacher_evaluations_validate_weights_and_ownership(c):
    h=auth(c,'DOCENTE','CLASE2026'); d=c.get('/api/teacher').json(); g=next(g for g in d['groups'] if g['students'])
    es=[e for e in g['students'][0]['evaluations'] if e['term']==1]
    values=[{'id':e['id'],'name':e['name'],'weight':50} for e in es]
    r=c.put(f"/api/teacher/groups/{g['id']}/evaluations",headers=h,json={'term':1,'items':values})
    assert r.status_code==200,r.text
    values[0]['weight']=60
    assert c.put(f"/api/teacher/groups/{g['id']}/evaluations",headers=h,json={'term':1,'items':values}).status_code==400
    assert c.put('/api/teacher/groups/99999/evaluations',headers=h,json={'term':1,'items':values}).status_code==403

def test_settings_and_summary_share_weights(c):
    h=auth(c)
    assert c.put('/api/admin/settings',headers=h,json={'cut_weights':[33,33,33],'max_credits':18}).status_code==400
    assert c.put('/api/admin/settings',headers=h,json={'cut_weights':[33,33,34],'max_credits':20}).status_code==200
    auth(c,'ESTUDIANTE','CRUZA2026');d=c.get('/api/student').json()
    assert d['settings']['cut_weights']==[33,33,34]
    assert 'weighted_credits' in d['summary'] and 'cut_averages' in d['summary']

def test_incomplete_weights_do_not_become_final():
    es=[{'term':t,'weight':40,'grade':5} for t in (1,2,3)]
    assert grade_summary(es)['final'] is None

def test_request_size_limit(c):
    assert c.post('/api/login',json={'username':'x','password':'x'*100000}).status_code==413
