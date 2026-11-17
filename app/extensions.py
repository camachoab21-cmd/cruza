"""Gestión académica y de perfiles. Reutiliza permisos, transacciones y auditoría."""
import json,re,sqlite3
from fastapi import APIRouter,Request
from .db import tx,connect,one,allrows,hash_pwd,utc,audit
from .services import settings,validate_sessions,email
from .logic import PERIOD,time_conflicts

router=APIRouter(prefix='/api')

@router.put('/student/profile')
async def profile(request:Request):
    from .main import require,getjson,valid_str
    u=require(request,['student'],mutate=True);v=await getjson(request)
    name=valid_str(v.get('full_name'),2,100);mail=email(v.get('email',''))
    with tx() as c:
        c.execute('UPDATE users SET full_name=?,email=? WHERE id=?',(name,mail,u['id']))
        audit(c,u['id'],'PERFIL_ACTUALIZADO',str(u['id']))
    return {'ok':True,'message':'Perfil actualizado.'}

@router.post('/admin/users')
async def new_user(request:Request):
    from .main import require,getjson,valid_str,fail
    u=require(request,['admin'],mutate=True);v=await getjson(request)
    name=valid_str(v.get('full_name'),2,100);username=valid_str(v.get('username'),4,30).upper()
    role=v.get('role');password=v.get('password','');mail=email(v.get('email',''))
    if role not in ('student','teacher'):fail('Selecciona estudiante o docente.')
    if not re.fullmatch(r'[A-Z0-9._-]+',username):fail('Usuario: letras, números, punto, guion y guion bajo.')
    if not isinstance(password,str) or not 10<=len(password)<=128:fail('Usa una contraseña de 10 a 128 caracteres.')
    with tx() as c:
        if one(c,'SELECT id FROM users WHERE username=?',(username,)):fail('Este usuario ya existe.')
        cur=c.execute('INSERT INTO users(username,full_name,email,password_hash,role,status,created_at) VALUES(?,?,?,?,?,?,?)',
            (username,name,mail,hash_pwd(password),role,'pending',utc()))
        audit(c,u['id'],'USUARIO_CREADO',str(cur.lastrowid),role)
    return {'ok':True,'message':'Cuenta creada. Apruébala desde el directorio de usuarios.'}

@router.put('/admin/settings')
async def configure(request:Request):
    from .main import require,getjson,intid,fail
    u=require(request,['admin'],mutate=True);v=await getjson(request)
    weights=v.get('cut_weights')
    if not isinstance(weights,list) or len(weights)!=3:fail('Indica los tres porcentajes de cortes.')
    weights=[intid(w) for w in weights];maximum=intid(v.get('max_credits'))
    if any(w<=0 for w in weights) or sum(weights)!=100:fail('Los tres cortes deben sumar 100% y ser positivos.')
    if not 1<=maximum<=40:fail('El máximo debe estar entre 1 y 40 créditos.')
    data={'cut_weights':weights,'max_credits':maximum}
    with tx() as c:
        c.execute('INSERT INTO settings VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value',('academic',json.dumps(data)))
        audit(c,u['id'],'CONFIGURACION_ACADEMICA','academic',json.dumps(data))
    return {'ok':True,'message':'Configuración actualizada. Las notas se recalculan con estos porcentajes.'}

@router.put('/teacher/groups/{gid}/evaluations')
async def evaluations(gid:int,request:Request):
    from .main import require,getjson,intid,valid_str,fail
    u=require(request,['teacher'],mutate=True);v=await getjson(request)
    with tx() as c:
        if not one(c,'SELECT id FROM groups WHERE id=? AND teacher_id=?',(gid,u['id'])):fail('Grupo no autorizado.',403)
        term=intid(v.get('term'));items=v.get('items')
        if term not in (1,2,3) or not isinstance(items,list) or not 1<=len(items)<=10:fail('Selecciona un corte y entre 1 y 10 evaluaciones.')
        normalized=[]
        for it in items:
            if not isinstance(it,dict):fail('Evaluación inválida.')
            weight=intid(it.get('weight'))
            if not 1<=weight<=100:fail('Cada porcentaje debe estar entre 1 y 100.')
            normalized.append({'id':intid(it['id']) if it.get('id') else None,'name':valid_str(it.get('name'),1,80),'weight':weight})
        if sum(it['weight'] for it in normalized)!=100:fail('Los porcentajes del corte deben sumar 100%.')
        current=allrows(c,'SELECT id FROM evaluations WHERE group_id=? AND term=?',(gid,term));owned={e['id'] for e in current}
        ids=[it['id'] for it in normalized if it['id']]
        if len(ids)!=len(set(ids)) or not set(ids)<=owned:fail('Evaluaciones duplicadas o de otro grupo.',403)
        for eid in owned-set(ids):
            if one(c,'SELECT evaluation_id FROM grades WHERE evaluation_id=? AND grade IS NOT NULL LIMIT 1',(eid,)):fail('No puedes eliminar una evaluación con notas registradas.')
            c.execute('DELETE FROM grades WHERE evaluation_id=?',(eid,));c.execute('DELETE FROM evaluations WHERE id=?',(eid,))
        for it in normalized:
            if it['id']:c.execute('UPDATE evaluations SET name=?,weight=? WHERE id=?',(it['name'],it['weight'],it['id']))
            else:c.execute('INSERT INTO evaluations(group_id,term,name,weight) VALUES(?,?,?,?)',(gid,term,it['name'],it['weight']))
        audit(c,u['id'],'EVALUACIONES_ACTUALIZADAS',str(gid),f'Corte {term}; {len(items)} evaluaciones; suma 100%')
    return {'ok':True}

@router.put('/admin/courses/{cid}')
async def update_course(cid:int,request:Request):
    from .main import require,getjson,intid,valid_str,fail
    u=require(request,['admin'],mutate=True);v=await getjson(request)
    code=valid_str(v.get('code'),3,24).upper();name=valid_str(v.get('name'),3,100)
    credits=intid(v.get('credits'));semester=intid(v.get('semester'));cat=v.get('category')
    if not 1<=credits<=8 or not 1<=semester<=14 or cat not in ('Obligatoria','Optativa','Libre elección'):fail('Revisa semestre, créditos y categoría.')
    with tx() as c:
        if not one(c,'SELECT id FROM courses WHERE id=?',(cid,)):fail('Materia inexistente.',404)
        try:c.execute('UPDATE courses SET code=?,name=?,credits=?,semester=?,category=? WHERE id=?',(code,name,credits,semester,cat,cid))
        except sqlite3.IntegrityError:fail('El código ya pertenece a otra materia.')
        audit(c,u['id'],'CURSO_ACTUALIZADO',str(cid),f'{code}; {credits} créditos')
    return {'ok':True}

@router.put('/admin/groups/{gid}')
async def update_group(gid:int,request:Request):
    from .main import require,getjson,intid,valid_str,fail,groups_list
    u=require(request,['admin'],mutate=True);v=await getjson(request)
    spans=validate_sessions(v.get('sessions'));capacity=intid(v.get('capacity'));teacher=intid(v['teacher_id']) if v.get('teacher_id') else None
    code=valid_str(v.get('code'),1,5).upper();room=valid_str(v.get('room'),1,40)
    if not 1<=capacity<=250:fail('Cupos entre 1 y 250.')
    with tx() as c:
        original=one(c,'SELECT * FROM groups WHERE id=?',(gid,))
        if not original:fail('Grupo inexistente.',404)
        if teacher and not one(c,"SELECT id FROM users WHERE id=? AND role='teacher'",(teacher,)):fail('Selecciona un docente válido.')
        students=allrows(c,'SELECT student_id FROM enrollments WHERE group_id=? AND period=?',(gid,PERIOD))
        if capacity<len(students):fail('Los cupos no pueden ser inferiores a las matrículas vigentes.')
        _,groups=groups_list(c);candidate=next(g for g in groups if g['id']==gid);candidate={**candidate,'sessions':spans}
        for st in students:
            ids={e['group_id'] for e in allrows(c,'SELECT group_id FROM enrollments WHERE student_id=? AND period=?',(st['student_id'],PERIOD))}
            if time_conflicts([candidate]+[g for g in groups if g['id'] in ids and g['id']!=gid]):fail('El cambio generaría un cruce para estudiantes ya matriculados.')
        try:c.execute('UPDATE groups SET code=?,teacher_id=?,room=?,capacity=?,sessions=? WHERE id=?',(code,teacher,room,capacity,json.dumps(spans),gid))
        except sqlite3.IntegrityError:fail('Ya existe un grupo con ese código para esta materia.')
        audit(c,u['id'],'GRUPO_ACTUALIZADO',str(gid),code)
    return {'ok':True}
