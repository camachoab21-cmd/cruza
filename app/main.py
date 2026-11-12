"""CRUZA: API local con SQLite, permisos por registro, sesiones HTTP-only y auditoría."""
import csv, io, json, os, secrets, hashlib, sqlite3, re
from datetime import date,datetime,timezone
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI,Request,HTTPException,Depends
from fastapi.responses import HTMLResponse,JSONResponse,FileResponse,Response
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from .db import ROOT,connect,tx,one,allrows,utc,expire,audit,hash_pwd,verify_pwd,DUMMY_HASH,init_db
from .logic import PERIOD,MAX_CREDITS,time_conflicts,grade_summary,period_average,cumulative_average,weighted,CUT_WEIGHTS

COOKIE='cruza_session';SESSION_HOURS=12;DEMO=os.environ.get('CRUZA_DEMO_MODE','0')=='1'
@asynccontextmanager
async def lifecycle(app):
    init_db(seed=DEMO)
    yield
app=FastAPI(title='CRUZA · Campus académico',version='3.0',lifespan=lifecycle)
app.mount('/static',StaticFiles(directory=ROOT/'app'/'static'),name='static')
templates=Jinja2Templates(directory=str(ROOT/'app'/'templates'))

@app.exception_handler(HTTPException)
async def errors(_,exc):
    return JSONResponse({'error':str(exc.detail)},status_code=exc.status_code)

def fail(message,status=400):raise HTTPException(status,message)
def valid_str(x,minlen=1,maxlen=120):
    if not isinstance(x,str) or not(minlen<=len(x.strip())<=maxlen):fail(f'El texto debe tener entre {minlen} y {maxlen} caracteres.')
    return x.strip()
def intid(value):
    # Evita convertir silenciosamente un crédito 2.5 en 2.
    if isinstance(value,(bool,float)):
        fail('Se requiere un número entero, sin decimales.')
    if isinstance(value,str) and not re.fullmatch(r'[+-]?\d+',value.strip()):
        fail('Se requiere un número entero, sin decimales.')
    try:return int(value)
    except (TypeError,ValueError,OverflowError):fail('Se requiere un número entero válido.')
def get_role(req,roles=None):
    token=req.cookies.get(COOKIE,'')
    if not token:return None
    digest=hashlib.sha256(token.encode()).hexdigest()
    with connect() as c:
        user=one(c,'''SELECT u.*,s.csrf,s.expires_at FROM sessions s
            JOIN users u ON u.id=s.user_id WHERE s.token_hash=?''',(digest,))
    if not user or user['expires_at']<=utc() or user['status']!='active':return None
    if roles and user['role'] not in roles:return None
    return user

def require(request:Request,roles=None,mutate=False):
    user=get_role(request)
    if not user:fail('Sesión vencida o acceso no autorizado. Inicia sesión.',401)
    if roles and user['role'] not in roles:fail('No tienes permisos para esta función.',403)
    if mutate and request.headers.get('x-csrf-token')!=user['csrf']:
        fail('La sesión de seguridad cambió. Actualiza la página.',403)
    return user

@app.middleware('http')
async def origin_guard(req,call_next):
    if req.method not in ('GET','HEAD','OPTIONS'):
        origin=req.headers.get('origin')
        if origin:
            from urllib.parse import urlparse
            u=urlparse(origin)
            host=req.headers.get('host','')
            if u.netloc!=host or u.scheme not in ('http','https'):
                return JSONResponse({'error':'Origen no autorizado.'},status_code=403)
    res=await call_next(req)
    res.headers['X-Content-Type-Options']='nosniff'
    res.headers['Referrer-Policy']='same-origin'
    res.headers['X-Frame-Options']='DENY'
    res.headers['Permissions-Policy']='camera=(), microphone=(), geolocation=()'
    res.headers['Content-Security-Policy']="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'self'"
    return res

@app.get('/',response_class=HTMLResponse)
def index(request:Request):return templates.TemplateResponse('index.html',{'request':request,'is_demo':DEMO})
@app.get('/demo-anterior')
def legacy():
    if not DEMO:fail('No disponible fuera del entorno de demostración.',404)
    return FileResponse(ROOT/'respaldo'/'CRUZA-HTML-DEMO-2026.html',media_type='text/html')

@app.get('/api/session')
def session_info(request:Request):
    u=get_role(request)
    return {'user':{'id':u['id'],'username':u['username'],'full_name':u['full_name'],'role':u['role']} if u else None,
      'csrf':u['csrf'] if u else None,'period':PERIOD,'demo':DEMO}

async def getjson(request):
    try:
        val=await request.json()
        if not isinstance(val,dict):fail('Se esperaba un objeto válido.')
        return val
    except HTTPException:raise
    except Exception:fail('Los datos enviados no tienen un formato válido.')

def rate_guard(c,key,limit=20,seconds=600):
    now=utc();r=one(c,'SELECT * FROM abuse WHERE key=?',(key,))
    if r and (datetime.fromisoformat(now)-datetime.fromisoformat(r['window_at'])).total_seconds()<seconds:
        if r['count']>=limit:fail('Demasiadas solicitudes. Intenta más tarde.',429)
        c.execute('UPDATE abuse SET count=count+1 WHERE key=?',(key,))
    else:c.execute('INSERT OR REPLACE INTO abuse VALUES(?,?,?)',(key,1,now))

@app.post('/api/login')
async def login(request:Request):
    v=await getjson(request)
    username=str(v.get('username','')).strip().upper()[:60]
    password=str(v.get('password',''))
    if not username or not password:fail('Escribe usuario y contraseña.')
    # never use asserted X-Forwarded-For: app expected behind trusted reverse proxy.
    addr=request.client.host if request.client else 'local'
    issued=None;user=None;problem=None
    with tx() as c:
        rate_guard(c,'login-ip:'+addr,limit=80)
        user=one(c,'SELECT * FROM users WHERE username=?',(username,))
        good=verify_pwd(password,user['password_hash'] if user else DUMMY_HASH)
        if not user:
            problem=('Usuario o contraseña incorrectos.',401)
        elif user['status']=='locked' or user['status']=='reset_pending':
            # Don't disclose account state until password is demonstrated.
            problem=('Cuenta no habilitada. Sigue el proceso de recuperación y habilitación.',423) if good else ('Usuario o contraseña incorrectos.',401)
        elif not good:
            if user['status']=='active':
                failed=user['failed']+1
                c.execute('UPDATE users SET failed=?,status=? WHERE id=?',
                         (failed,'locked' if failed>=4 else 'active',user['id']))
                if failed>=4:
                    audit(c,user['id'],'CUENTA_BLOQUEADA',str(user['id']),'Cuarto intento fallido')
            problem=('Usuario o contraseña incorrectos.',401)
        elif user['status']!='active':
            problem=('Cuenta pendiente de aprobación o desactivada.',403)
        else:
            c.execute('UPDATE users SET failed=0 WHERE id=?',(user['id'],))
            token=secrets.token_urlsafe(42);csrf=secrets.token_urlsafe(28)
            c.execute('INSERT INTO sessions VALUES(?,?,?,?)',
                (hashlib.sha256(token.encode()).hexdigest(),user['id'],csrf,expire(SESSION_HOURS)))
            audit(c,user['id'],'LOGIN',str(user['id']))
            issued=(token,csrf)
    if problem:fail(*problem)
    res=JSONResponse({'user':{'id':user['id'],'username':user['username'],'full_name':user['full_name'],'role':user['role']},'csrf':issued[1]})
    res.set_cookie(COOKIE,issued[0],httponly=True,samesite='lax',secure=os.environ.get('CRUZA_HTTPS','0')=='1',max_age=SESSION_HOURS*3600,path='/')
    return res

@app.post('/api/logout')
def logout(request:Request):
    u=require(request,mutate=True)
    with tx() as c:
        tok=request.cookies.get(COOKIE,'')
        c.execute('DELETE FROM sessions WHERE token_hash=?',(hashlib.sha256(tok.encode()).hexdigest(),))
        audit(c,u['id'],'LOGOUT',str(u['id']))
    r=JSONResponse({'ok':True});r.delete_cookie(COOKIE);return r

@app.post('/api/recovery/request')
async def request_reset(request:Request):
    v=await getjson(request)
    username=str(v.get('username','')).strip().upper()[:60]
    addr=request.client.host if request.client else 'local'
    with tx() as c:
        rate_guard(c,'recovery-ip:'+addr,limit=16)
        u=one(c,'SELECT * FROM users WHERE username=?',(username,))
        if u and u['status'] in ('locked','active','reset_pending'):
            c.execute("UPDATE recovery SET status='expired' WHERE user_id=? AND status='issued' AND expires_at<=?",(u['id'],utc()))
            previous=one(c,"SELECT id FROM recovery WHERE user_id=? AND status IN ('requested','issued') ORDER BY id DESC LIMIT 1",(u['id'],))
            if not previous:
                c.execute('INSERT INTO recovery(user_id,status,created_at) VALUES(?,?,?)',(u['id'],'requested',utc()))
                audit(c,u['id'],'RECOVERY_SOLICITADA',str(u['id']))
    return {'ok':True,'message':'Si corresponde, se registró la solicitud. Contacta a Administración para verificar tu identidad.'}

@app.post('/api/recovery/redeem')
async def redeem(request:Request):
    v=await getjson(request)
    username=str(v.get('username','')).strip().upper()[:60]
    token=str(v.get('code','')).strip()
    password=str(v.get('new_password',''))
    if len(password)<10 or len(password)>128:fail('Utiliza una contraseña de 10 a 128 caracteres.')
    with tx() as c:
        rate_guard(c,'recovery-redeem:'+username,limit=12)
        u=one(c,'SELECT * FROM users WHERE username=?',(username,))
        r=one(c,"SELECT * FROM recovery WHERE user_id=? AND status='issued' ORDER BY id DESC LIMIT 1",(u['id'],)) if u else None
        digest=hashlib.sha256(token.encode()).hexdigest()
        if not r or not r['token_hash'] or r['expires_at']<=utc() or not secrets.compare_digest(digest,r['token_hash']):
            fail('Código inválido o vencido. Solicita uno nuevo.',400)
        c.execute("UPDATE recovery SET status='used',used_at=? WHERE id=?",(utc(),r['id']))
        c.execute('UPDATE users SET password_hash=?,status=?,failed=? WHERE id=?',
                  (hash_pwd(password),'reset_pending',4,u['id']))
        c.execute('DELETE FROM sessions WHERE user_id=?',(u['id'],))
        audit(c,u['id'],'PASSWORD_RESTABLECIDA',str(u['id']),'Pendiente de habilitación administrativa')
    return {'ok':True,'message':'Contraseña restablecida. Administración debe habilitar tu cuenta.'}

def groups_list(c):
    courses=allrows(c,'SELECT * FROM courses ORDER BY semester,code')
    groups=allrows(c,'''SELECT g.*,c.code course_code,c.name,c.credits,c.category,c.semester,
        t.full_name teacher FROM groups g JOIN courses c ON c.id=g.course_id
        LEFT JOIN users t ON t.id=g.teacher_id ORDER BY c.semester,c.code,g.code''')
    for g in groups:g['sessions']=json.loads(g['sessions'])
    return courses,groups

def report_courses(c,student_id):
    rows=allrows(c,'''SELECT e.*,c.name,c.code,c.credits,g.code as group_code,
        g.room,g.sessions,t.full_name teacher FROM enrollments e
        JOIN courses c ON c.id=e.course_id JOIN groups g ON g.id=e.group_id
        LEFT JOIN users t ON t.id=g.teacher_id WHERE e.student_id=? AND e.period=? ORDER BY c.code''',(student_id,PERIOD))
    for x in rows:x['sessions']=json.loads(x['sessions'])
    return rows

def grade_records(c,student_id):
    enr=report_courses(c,student_id);out=[]
    for r in enr:
        es=allrows(c,'''SELECT e.id,e.term,e.name,e.weight,g.grade FROM evaluations e
            LEFT JOIN grades g ON g.evaluation_id=e.id AND g.student_id=? WHERE e.group_id=?
            ORDER BY term,e.id''',(student_id,r['group_id']))
        out.append({**r,'evaluations':es,'summary':grade_summary(es)})
    return out

def build_summary(c,student_id,grades):
    hist=allrows(c,'''SELECT h.*,co.name,co.code,co.category FROM history h
     JOIN courses co ON co.id=h.course_id WHERE student_id=? ORDER BY period,course_id''',(student_id,))
    finalized=[{'course_id':x['course_id'],'credits':x['credits'],'period':PERIOD,
                'grade':x['summary']['final']} for x in grades if x['summary']['final'] is not None]
    attempts=hist+finalized
    papi=period_average(finalized)
    papa=cumulative_average(attempts)
    last_by_course={}
    for v in sorted(attempts,key=lambda z:(z['period'],z.get('attempt',0))):
        if v.get('grade') is not None:last_by_course[v['course_id']]=v
    last=list(last_by_course.values())
    approved=sum(v['credits'] for v in last if v['grade']>=3.0)
    return {'papi':papi,'papa':papa,'period_label':PERIOD,'history':hist,
        'credits_current':sum(x['credits'] for x in grades),
        'credits_approved':approved,'credits_hist':sum(x['credits'] for x in hist),
        'weighted_points':sum(float(v['grade'])*v['credits'] for v in last)}

def activity_list(c,student_id):
    rows=allrows(c,'''SELECT a.*,co.name course,co.code,COALESCE(s.completed,0) completed
        FROM activities a JOIN courses co ON co.id=a.course_id
        LEFT JOIN activity_status s ON s.activity_id=a.id AND s.student_id=?
        WHERE a.course_id IN (SELECT course_id FROM enrollments WHERE student_id=? AND period=?)
        ORDER BY due_date,a.id''',(student_id,student_id,PERIOD))
    now=date.today().isoformat()
    for row in rows:row['state']='entregada' if row['completed'] else ('atrasada' if row['due_date']<now else 'pendiente')
    return rows

def draft_status(c,student_id,courses,groups):
    d=one(c,'SELECT * FROM drafts WHERE student_id=?',(student_id,))
    current=report_courses(c,student_id)
    ids=json.loads(d['group_ids']) if d else [x['group_id'] for x in current]
    gmap={x['id']:x for x in groups}
    selected=[gmap[x] for x in ids if x in gmap]
    problems=time_conflicts(selected)
    credits=sum(x['credits'] for x in selected)
    if credits>MAX_CREDITS:problems.append({'reason':f'El borrador tiene {credits} créditos; máximo {MAX_CREDITS}.'})
    if not selected:problems.append({'reason':'Selecciona al menos una materia.'})
    return {'group_ids':ids,'selected':selected,'credits':credits,'problems':problems,'confirmed':current,
      'updated_at':d['updated_at'] if d else None}

@app.get('/api/student')
def student_data(request:Request):
    u=require(request,['student']);
    with connect() as c:
        courses,groups=groups_list(c)
        grades=grade_records(c,u['id'])
        return {'courses':courses,'groups':groups,'draft':draft_status(c,u['id'],courses,groups),
          'grades':grades,'summary':build_summary(c,u['id'],grades),
          'activities':activity_list(c,u['id']),
          'agenda':allrows(c,'SELECT * FROM agenda WHERE student_id=? ORDER BY due_date,due_time',(u['id'],)),
          'attendance':allrows(c,'''SELECT a.day,a.present,co.name course,g.code group_code,g.room
             FROM attendance a JOIN groups g ON g.id=a.group_id JOIN courses co ON co.id=g.course_id
             WHERE a.student_id=? ORDER BY a.day DESC LIMIT 100''',(u['id'],)),
          'profile':{'username':u['username'],'full_name':u['full_name'],'email':u['email']}}

@app.put('/api/student/draft')
async def set_draft(request:Request):
    u=require(request,['student'],mutate=True);v=await getjson(request)
    if not isinstance(v.get('group_ids'),list) or len(v['group_ids'])>30:fail('Selección no válida.')
    ids=[intid(x) for x in v['group_ids']]
    if len(set(ids))!=len(ids):fail('El borrador tiene grupos duplicados.')
    with tx() as c:
        courses,groups=groups_list(c)
        allowed={g['id'] for g in groups}
        if not set(ids)<=allowed:fail('Un grupo seleccionado no existe.')
        for x in set(ids):
            g=next(g for g in groups if g['id']==x)
            if sum(gg['course_id']==g['course_id'] for gg in groups if gg['id'] in ids)>1:
                fail('No puedes elegir dos grupos de la misma materia.')
        c.execute('INSERT INTO drafts VALUES(?,?,?) ON CONFLICT(student_id) DO UPDATE SET group_ids=excluded.group_ids,updated_at=excluded.updated_at',
           (u['id'],json.dumps(ids),utc()))
        return draft_status(c,u['id'],courses,groups)

@app.post('/api/student/draft/discard')
def discard(request:Request):
    u=require(request,['student'],mutate=True)
    with tx() as c:
        ids=[r['group_id'] for r in report_courses(c,u['id'])]
        c.execute('INSERT INTO drafts VALUES(?,?,?) ON CONFLICT(student_id) DO UPDATE SET group_ids=excluded.group_ids,updated_at=excluded.updated_at',
            (u['id'],json.dumps(ids),utc()))
    return {'ok':True}

@app.post('/api/student/enroll/confirm')
def confirm(request:Request):
    u=require(request,['student'],mutate=True)
    with tx() as c:
        courses,groups=groups_list(c)
        draft=draft_status(c,u['id'],courses,groups)
        if draft['problems']:fail('No se puede confirmar: '+'; '.join(p['reason'] for p in draft['problems']))
        for g in draft['selected']:
            occupied=one(c,'SELECT COUNT(*) n FROM enrollments WHERE group_id=? AND period=?',(g['id'],PERIOD))['n']
            mine=one(c,'SELECT id FROM groups WHERE id=?',(g['id'],)) is not None and any(r['group_id']==g['id'] for r in draft['confirmed'])
            if occupied-(1 if mine else 0)>=g['capacity']:fail(f'El grupo {g["name"]} {g["code"]} no tiene cupos.')
        c.execute('DELETE FROM enrollments WHERE student_id=? AND period=?',(u['id'],PERIOD))
        for g in draft['selected']:
            c.execute('INSERT INTO enrollments VALUES(?,?,?,?)',(u['id'],g['course_id'],g['id'],PERIOD))
        audit(c,u['id'],'MATRICULA_CONFIRMADA',str(u['id']),','.join(str(g['id']) for g in draft['selected']))
    return {'ok':True,'message':'Matrícula confirmada. Tu horario vigente fue actualizado.'}

@app.get('/api/student/schedule.csv')
def export_schedule(request:Request):
    u=require(request,['student'])
    with connect() as c:rows=report_courses(c,u['id'])
    f=io.StringIO();w=csv.writer(f);w.writerow(['Curso','Grupo','Docente','Dia','Inicio','Fin','Aula','Creditos'])
    for r in rows:
        for s in r['sessions']:w.writerow([r['name'],r['group_code'],r['teacher'],s['day'],s['start'],s['end'],r['room'],r['credits']])
    return Response('\ufeff'+f.getvalue(),media_type='text/csv; charset=utf-8',headers={'Content-Disposition':'attachment; filename="cruza-horario.csv"'})

@app.post('/api/student/agenda')
async def add_agenda(request:Request):
    u=require(request,['student'],mutate=True);v=await getjson(request)
    title=valid_str(v.get('title'),1,100);due=valid_str(v.get('due_date'),10,10)
    try:date.fromisoformat(due)
    except:fail('La fecha debe tener formato AAAA-MM-DD.')
    hour=str(v.get('due_time') or '')[:5]
    if hour and not re.fullmatch(r'([01][0-9]|2[0-3]):[0-5][0-9]',hour):fail('Hora no válida.')
    desc=str(v.get('description',''))[:500]
    cid=intid(v['course_id']) if v.get('course_id') else None
    with tx() as c:
        if cid and not one(c,'SELECT id FROM courses WHERE id=?',(cid,)):fail('Materia no válida.')
        cur=c.execute('INSERT INTO agenda(student_id,title,due_date,due_time,description,course_id) VALUES(?,?,?,?,?,?)',
              (u['id'],title,due,hour,desc,cid));audit(c,u['id'],'AGENDA_CREADA',str(cur.lastrowid))
    return {'ok':True}

@app.patch('/api/student/agenda/{aid}')
async def change_agenda(aid:int,request:Request):
    u=require(request,['student'],mutate=True);v=await getjson(request)
    with tx() as c:
        current=one(c,'SELECT * FROM agenda WHERE id=? AND student_id=?',(aid,u['id']))
        if not current:fail('Recordatorio inexistente.',404)
        title=valid_str(v.get('title',current['title']),1,100)
        due=str(v.get('due_date',current['due_date']))
        try:date.fromisoformat(due)
        except:fail('Fecha incorrecta.')
        done=1 if v.get('done',bool(current['done'])) else 0
        hour=str(v.get('due_time',current['due_time']))[:5]
        if hour and not re.fullmatch(r'([01][0-9]|2[0-3]):[0-5][0-9]',hour):fail('Hora incorrecta.')
        c.execute('UPDATE agenda SET title=?,due_date=?,due_time=?,description=?,done=? WHERE id=? AND student_id=?',
           (title,due,hour,str(v.get('description',current['description']))[:500],done,aid,u['id']))
    return {'ok':True}

@app.delete('/api/student/agenda/{aid}')
def delete_agenda(aid:int,request:Request):
    u=require(request,['student'],mutate=True)
    with tx() as c:
        cur=c.execute('DELETE FROM agenda WHERE id=? AND student_id=?',(aid,u['id']))
        if not cur.rowcount:fail('Recordatorio inexistente.',404)
        audit(c,u['id'],'AGENDA_ELIMINADA',str(aid))
    return {'ok':True}

@app.put('/api/student/activities/{aid}')
async def set_activity(aid:int,request:Request):
    u=require(request,['student'],mutate=True);v=await getjson(request)
    if type(v.get('completed')) is not bool:fail('Estado inválido.')
    with tx() as c:
        item=one(c,'''SELECT a.id FROM activities a JOIN enrollments e ON e.course_id=a.course_id
                    WHERE a.id=? AND e.student_id=? AND e.period=?''',(aid,u['id'],PERIOD))
        if not item:fail('Actividad no autorizada.',403)
        c.execute('INSERT INTO activity_status VALUES(?,?,?) ON CONFLICT(student_id,activity_id) DO UPDATE SET completed=excluded.completed',
           (u['id'],aid,1 if v['completed'] else 0))
    return {'ok':True}

@app.get('/api/teacher')
def teacher_data(request:Request):
    u=require(request,['teacher'])
    with connect() as c:
        groups=allrows(c,'''SELECT g.*,co.name,co.code course_code,co.credits FROM groups g
            JOIN courses co ON co.id=g.course_id WHERE g.teacher_id=? ORDER BY co.code,g.code''',(u['id'],))
        for g in groups:
            g['sessions']=json.loads(g['sessions'])
            students=allrows(c,'''SELECT x.id,x.username,x.full_name FROM enrollments e
                JOIN users x ON x.id=e.student_id WHERE e.group_id=? AND e.period=? AND x.status='active' ORDER BY x.full_name''',(g['id'],PERIOD))
            for s in students:
                s['evaluations']=allrows(c,'''SELECT e.id,e.name,e.term,e.weight,a.grade FROM evaluations e
                    LEFT JOIN grades a ON a.evaluation_id=e.id AND a.student_id=? WHERE e.group_id=? ORDER BY e.term,e.id''',(s['id'],g['id']))
                s['summary']=grade_summary(s['evaluations'])
                s['attendance']=allrows(c,'SELECT day,present FROM attendance WHERE student_id=? AND group_id=? ORDER BY day DESC LIMIT 20',(s['id'],g['id']))
            g['students']=students
        return {'groups':groups}

@app.put('/api/teacher/grade')
async def save_grade(request:Request):
    u=require(request,['teacher'],mutate=True);v=await getjson(request)
    sid=intid(v.get('student_id'));eid=intid(v.get('evaluation_id'))
    value=v.get('grade')
    if value is not None:
        try:value=float(value)
        except:fail('Nota inválida.')
        if not 0<=value<=5:fail('Nota fuera de la escala 0 a 5.')
    with tx() as c:
        owned=one(c,'''SELECT e.group_id FROM evaluations e JOIN groups g ON g.id=e.group_id
            JOIN enrollments r ON r.group_id=e.group_id WHERE e.id=? AND g.teacher_id=?
            AND r.student_id=? AND r.period=?''',(eid,u['id'],sid,PERIOD))
        if not owned:fail('No puedes modificar notas de este estudiante o grupo.',403)
        old=one(c,'SELECT grade FROM grades WHERE student_id=? AND evaluation_id=?',(sid,eid))
        reason=str(v.get('reason','')).strip()
        if old is not None and old['grade']!=value and len(reason)<5:
            fail('Al corregir una nota publicada debes escribir un motivo de al menos 5 caracteres.')
        c.execute('INSERT INTO grades VALUES(?,?,?,?,?) ON CONFLICT(student_id,evaluation_id) DO UPDATE SET grade=excluded.grade,actor_id=excluded.actor_id,updated_at=excluded.updated_at',
            (sid,eid,value,u['id'],utc()))
        audit(c,u['id'],'NOTA_EDITADA',f'{sid}:{eid}',f"Anterior={old['grade'] if old else 'sin nota'}; nueva={value}; motivo={reason[:130]}")
    return {'ok':True}

@app.put('/api/teacher/attendance')
async def save_attendance(request:Request):
    u=require(request,['teacher'],mutate=True);v=await getjson(request)
    sid=intid(v.get('student_id'));gid=intid(v.get('group_id'));day=str(v.get('day',''))
    try:date.fromisoformat(day)
    except:fail('Fecha incorrecta.')
    if type(v.get('present')) is not bool:fail('Estado de asistencia no válido.')
    with tx() as c:
        owned=one(c,'''SELECT r.student_id FROM enrollments r JOIN groups g ON g.id=r.group_id
            WHERE r.group_id=? AND r.student_id=? AND g.teacher_id=? AND r.period=?''',(gid,sid,u['id'],PERIOD))
        if not owned:fail('No puedes gestionar asistencia de este grupo.',403)
        c.execute('INSERT INTO attendance VALUES(?,?,?,?,?) ON CONFLICT(student_id,group_id,day) DO UPDATE SET present=excluded.present,actor_id=excluded.actor_id',
           (sid,gid,day,1 if v['present'] else 0,u['id']))
        audit(c,u['id'],'ASISTENCIA_EDITADA',f'{sid}:{gid}:{day}',f"Presente={v['present']}")
    return {'ok':True}

@app.get('/api/admin')
def admin_data(request:Request):
    u=require(request,['admin'])
    with connect() as c:
        students=allrows(c,"SELECT id,username,full_name,email,role,status,failed,created_at FROM users ORDER BY role,username")
        requests=allrows(c,'''SELECT r.id,r.status,r.created_at,r.expires_at,u.username,u.full_name,u.status account_status
            FROM recovery r JOIN users u ON u.id=r.user_id ORDER BY r.id DESC LIMIT 50''')
        auditrows=allrows(c,'''SELECT a.*,u.username actor FROM audit a LEFT JOIN users u ON u.id=a.actor_id ORDER BY a.id DESC LIMIT 60''')
        courses,groups=groups_list(c)
    return {'users':students,'recovery':requests,'audit':auditrows,'courses':courses,'groups':groups}

@app.post('/api/admin/students')
async def create_student(request:Request):
    u=require(request,['admin'],mutate=True);v=await getjson(request)
    name=valid_str(v.get('full_name'),2,100)
    username=valid_str(v.get('username'),4,30).upper()
    if not re.fullmatch(r'[A-Z0-9._-]+',username):fail('Usuario: únicamente letras, números, punto, guion y guion bajo.')
    password=str(v.get('password',''))
    if len(password)<10:fail('La contraseña temporal debe tener mínimo 10 caracteres.')
    with tx() as c:
        if one(c,'SELECT id FROM users WHERE username=?',(username,)):fail('Este usuario ya existe.')
        cur=c.execute('INSERT INTO users(username,full_name,email,password_hash,role,status,created_at) VALUES(?,?,?,?,?,?,?)',
            (username,name,str(v.get('email',''))[:120],hash_pwd(password),'student','pending',utc()))
        audit(c,u['id'],'ESTUDIANTE_CREADO',str(cur.lastrowid))
    return {'ok':True,'message':'Estudiante creado: pendiente de aprobación.'}

@app.put('/api/admin/users/{uid}/status')
async def user_status(uid:int,request:Request):
    u=require(request,['admin'],mutate=True);v=await getjson(request)
    nextstatus=str(v.get('status',''))
    with tx() as c:
        target=one(c,'SELECT * FROM users WHERE id=?',(uid,))
        if not target or target['role']=='admin':fail('No está permitido cambiar este usuario.',403)
        if target['status']=='pending' and nextstatus=='active':pass
        elif target['status']=='reset_pending' and nextstatus=='active':pass
        elif target['status']=='active' and nextstatus=='disabled':pass
        elif target['status']=='disabled' and nextstatus=='active':pass
        else:fail('Transición de estado no permitida. La cuenta bloqueada requiere restablecimiento previo.')
        c.execute('UPDATE users SET status=?,failed=0 WHERE id=?',(nextstatus,uid))
        if nextstatus!='active':c.execute('DELETE FROM sessions WHERE user_id=?',(uid,))
        audit(c,u['id'],'ESTADO_CUENTA_CAMBIADO',str(uid),target['status']+' → '+nextstatus)
    return {'ok':True}

@app.post('/api/admin/recovery/{rid}/issue')
def issue_recovery(rid:int,request:Request):
    u=require(request,['admin'],mutate=True)
    token=secrets.token_urlsafe(24)
    with tx() as c:
        rec=one(c,"SELECT * FROM recovery WHERE id=? AND status='requested'",(rid,))
        if not rec:fail('Solicitud inexistente o ya procesada.',404)
        c.execute("UPDATE recovery SET status='issued',token_hash=?,expires_at=?,issued_by=? WHERE id=?",
          (hashlib.sha256(token.encode()).hexdigest(),expire(.5),u['id'],rid))
        audit(c,u['id'],'RECOVERY_CODIGO_EMITIDO',str(rec['user_id']),'Verificación de identidad realizada fuera de la aplicación')
    # Return code once to administrator only. In demo delivered in person.
    return {'ok':True,'code':token,'expires_minutes':30,'message':'Entregar el código al estudiante tras verificar identidad.'}

@app.post('/api/admin/groups')
async def create_group(request:Request):
    u=require(request,['admin'],mutate=True);v=await getjson(request)
    course_id=intid(v.get('course_id'));code=valid_str(v.get('code'),1,5).upper()
    teacher_id=intid(v.get('teacher_id')) if v.get('teacher_id') else None
    capacity=intid(v.get('capacity',25));room=valid_str(v.get('room'),1,40)
    sessions=v.get('sessions')
    if not isinstance(sessions,list) or not sessions or len(sessions)>8:fail('Agrega entre 1 y 8 sesiones.')
    for s in sessions:
        if not isinstance(s,dict) or s.get('day') not in ('Lun','Mar','Mie','Jue','Vie','Sab'):fail('Día incorrecto.')
        if not re.fullmatch(r'\d\d:\d\d',str(s.get('start',''))) or not re.fullmatch(r'\d\d:\d\d',str(s.get('end',''))) or s['end']<=s['start']:fail('Franja inválida.')
    if not 1<=capacity<=250:fail('Cupos entre 1 y 250.')
    with tx() as c:
        if not one(c,'SELECT id FROM courses WHERE id=?',(course_id,)):fail('Materia inexistente.')
        if teacher_id and not one(c,"SELECT id FROM users WHERE id=? AND role='teacher'",(teacher_id,)):fail('Docente incorrecto.')
        try:
            cur=c.execute('INSERT INTO groups(course_id,code,teacher_id,room,capacity,sessions) VALUES(?,?,?,?,?,?)',
                 (course_id,code,teacher_id,room,capacity,json.dumps(sessions)))
        except sqlite3.IntegrityError:fail('Ya existe ese grupo.')
        gid=cur.lastrowid
        for term in (1,2,3):
            for i in (1,2):c.execute('INSERT INTO evaluations(group_id,term,name,weight) VALUES(?,?,?,?)',(gid,term,f'Evaluación {i}',50))
        audit(c,u['id'],'GRUPO_CREADO',str(gid))
    return {'ok':True}

@app.post('/api/admin/courses')
async def create_course(request:Request):
    u=require(request,['admin'],mutate=True);v=await getjson(request)
    code=valid_str(v.get('code'),3,24).upper();name=valid_str(v.get('name'),3,100)
    semester=intid(v.get('semester'));credits=intid(v.get('credits'));cat=str(v.get('category'))
    if not 1<=semester<=14 or not 1<=credits<=8:fail('Semestre o créditos incorrectos.')
    if cat not in ('Obligatoria','Optativa','Libre elección'):fail('Tipo de materia inválido.')
    with tx() as c:
        try:
            cur=c.execute('INSERT INTO courses(code,name,semester,credits,category) VALUES(?,?,?,?,?)',(code,name,semester,credits,cat))
        except sqlite3.IntegrityError:fail('Código de materia duplicado.')
        audit(c,u['id'],'CURSO_CREADO',str(cur.lastrowid))
    return {'ok':True}
