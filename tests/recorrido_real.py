"""Recorrido HTTP real con Chromium headless. Usa una BD temporal, nunca la del usuario."""
import json, os, socket, subprocess, sys, tempfile, time, urllib.request
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'docs'/'evidencias'
OUT.mkdir(parents=True,exist_ok=True)
errors=[]; checks=[]

def check(name,condition=True):
    assert condition,name
    checks.append(name)
    print('OK:',name,flush=True)

def login(page,user,password):
    page.locator('#auth-user').fill(user)
    page.locator('#auth-pass').fill(password)
    page.locator('#login-button').click()
    expect(page.locator('.sidebar')).to_be_visible()

def route(page,name):
    page.locator(f'.sidebar [data-route="{name}"]').click()
    expect(page.locator('#content')).to_be_visible()

def data(page,path):
    response=page.request.get('/api/'+path)
    assert response.ok,response.text()
    return response.json()

def save(page,form):
    with page.expect_response(lambda r:'/api/' in r.url and r.request.method in ('POST','PUT','PATCH')) as result:
        page.locator(form).locator('button[type="submit"],button:not([type])').first.click()
    assert result.value.ok,result.value.text()
    page.wait_for_timeout(180)

def screenshot(page,name):
    page.screenshot(path=str(OUT/(name+'.png')),full_page=True,animations='disabled')

def layout(page,name):
    overflow=page.evaluate('document.documentElement.scrollWidth>innerWidth+2')
    check('Sin desbordamiento: '+name,not overflow)

with tempfile.TemporaryDirectory(prefix='cruza-e2e-') as tmp:
    with socket.socket() as sock:
        sock.bind(('127.0.0.1',0));port=sock.getsockname()[1]
    base=f'http://127.0.0.1:{port}'
    env={**os.environ,'CRUZA_DEMO_MODE':'1','CRUZA_DB_PATH':str(Path(tmp)/'demo.sqlite3'),'CRUZA_HTTPS':'0'}
    log=open(OUT/'servidor-prueba.log','w',encoding='utf8')
    process=subprocess.Popen([sys.executable,'-m','uvicorn','app.main:app','--host','127.0.0.1','--port',str(port)],cwd=ROOT,env=env,stdout=log,stderr=log,creationflags=getattr(subprocess,'CREATE_NO_WINDOW',0))
    try:
        for _ in range(120):
            try:
                urllib.request.urlopen(base+'/api/session',timeout=1).read();break
            except Exception:time.sleep(.25)
        else:raise RuntimeError('El servidor no inició. Ver servidor-prueba.log')
        with sync_playwright() as p:
            browser=p.chromium.launch(headless=True)
            student_ctx=browser.new_context(base_url=base,viewport={'width':1440,'height':1000},record_video_dir=str(OUT/'video'),record_video_size={'width':1440,'height':1000},reduced_motion='reduce')
            student=student_ctx.new_page();student.on('pageerror',lambda e:errors.append(str(e)))
            student.goto(base);expect(student.locator('#login-button')).to_be_visible();screenshot(student,'01-acceso')
            login(student,'ESTUDIANTE','CRUZA2026');check('Ingreso de estudiante con sesión real')
            for page_name in ['tablero','pensum','inscripcion','horario','calendario','agenda','notas','asistencia','historial','perfil']:
                route(student,page_name);layout(student,'escritorio '+page_name)
                screenshot(student,'estudiante-'+page_name)
            route(student,'perfil')
            student.locator('#profile-edit-form [name="full_name"]').fill('Alex Rivera Demo')
            save(student,'#profile-edit-form')
            student.reload();expect(student.locator('.sidebar')).to_be_visible()
            check('Perfil persiste al recargar',data(student,'student')['profile']['full_name']=='Alex Rivera Demo')
            check('Estudiante no puede consultar administración',student.request.get('/api/admin').status==403)
            cookie=next(x for x in student_ctx.cookies() if x['name']=='cruza_session')
            check('Cookie de sesión HttpOnly y SameSite Lax',cookie['httpOnly'] and cookie['sameSite']=='Lax')
            route(student,'inscripcion')
            student.locator('[data-action="toggle-course"][data-course-id="6"]').click()
            expect(student.locator('[data-action="confirm-enroll"]')).to_be_disabled()
            check('Choque entre Álgebra A y Desarrollo web impide matrícula')
            screenshot(student,'02-conflicto-horario')
            student.locator('#grp-6').select_option('5')
            expect(student.locator('[data-action="confirm-enroll"]')).to_be_enabled()
            student.locator('[data-action="confirm-enroll"]').click();student.locator('[data-action="modal-confirm"]').click()
            expect(student.locator('.overlay')).to_have_count(0)
            check('Matrícula alternativa sin cruce guardada',len(data(student,'student')['draft']['confirmed'])==4)
            check('Exportación real de horario CSV',student.request.get('/api/student/schedule.csv').ok)
            route(student,'agenda');student.locator('[data-action="agenda-new"]').click()
            student.locator('#ag-title').fill('Presentar CRUZA');student.locator('#ag-date').fill('2026-11-18')
            save(student,'#agenda-form');check('Recordatorio guardado',any(x['title']=='Presentar CRUZA' for x in data(student,'student')['agenda']))
            teacher_ctx=browser.new_context(base_url=base,viewport={'width':1440,'height':1000},reduced_motion='reduce')
            teacher=teacher_ctx.new_page();teacher.on('pageerror',lambda e:errors.append(str(e)));teacher.goto(base)
            login(teacher,'DOCENTE','CLASE2026');check('Ingreso de docente')
            teacher.locator('#teacher-group').select_option('1')
            teacher.locator('[data-action="evaluations-edit"]').click()
            teacher.locator('.evaluation-row [name="weight"]').first.fill('60')
            teacher.locator('#evaluations-form button[type="submit"]').click()
            expect(teacher.locator('.form-error')).to_contain_text('100')
            teacher.locator('.evaluation-row [name="weight"]').first.fill('50');save(teacher,'#evaluations-form')
            check('Validación y edición de pesos de evaluación')
            for eid,grade in enumerate([4,4,3,3,5,5],1):
                teacher.locator(f'#grade-3-{eid}').fill(str(grade))
                with teacher.expect_response(lambda r:r.url.endswith('/api/teacher/grade') and r.request.method=='PUT') as response:
                    teacher.locator(f'[data-action="save-grade"][data-eval-id="{eid}"]').click()
                assert response.value.ok,response.value.text()
                teacher.wait_for_timeout(150)
            screenshot(teacher,'03-docente-notas');layout(teacher,'docente notas')
            route(teacher,'asistencia');teacher.locator('#attendance-date').fill('2026-11-16')
            teacher.locator('[data-action="attendance"][data-present="true"]').first.click()
            teacher.wait_for_timeout(250);check('Asistencia registrada',len(data(student,'student')['attendance'])==1)
            screenshot(teacher,'04-docente-asistencia')
            student.reload();expect(student.locator('.sidebar')).to_be_visible();route(student,'notas')
            d=data(student,'student');check('Cortes y definitiva ponderada',next(g for g in d['grades'] if g['course_id']==7)['summary']['final']==4.1 and d['summary']['papi']==4.1)
            student.locator('#simulate-course').select_option('6')
            expect(student.locator('#simulation-result')).to_contain_text('No se presuponen')
            for term,grade in enumerate([4,3,5],1):student.locator(f'.sim-cut[data-cut="{term}"]').fill(str(grade))
            expect(student.locator('#simulation-result')).to_contain_text('4,10');check('Simulador sin notas inventadas')
            screenshot(student,'05-promedios-y-simulador')
            admin_ctx=browser.new_context(base_url=base,viewport={'width':1440,'height':1000},reduced_motion='reduce')
            admin=admin_ctx.new_page();admin.on('pageerror',lambda e:errors.append(str(e)));admin.goto(base)
            login(admin,'ADMIN','ADMIN2026');admin.locator('[data-action="user-new"]').click()
            form=admin.locator('#user-create-form')
            for key,val in {'full_name':'Fidel Docente Demo','username':'FIDELDEMO','password':'ClaseSegura2026'}.items():form.locator(f'[name="{key}"]').fill(val)
            form.locator('[name="role"]').select_option('teacher');save(admin,'#user-create-form')
            user=next(x for x in data(admin,'admin')['users'] if x['username']=='FIDELDEMO')
            admin.locator(f'[data-action="user-status"][data-id="{user["id"]}"]').click();admin.locator('[data-action="modal-confirm"]').click();expect(admin.locator('.overlay')).to_have_count(0)
            check('Creación y aprobación de docente',next(x for x in data(admin,'admin')['users'] if x['id']==user['id'])['status']=='active')
            route(admin,'catalogo');admin.locator('[data-action="course-edit"]').first.click()
            admin.locator('#course-edit-form [name="name"]').fill('Lógica y pensamiento computacional')
            save(admin,'#course-edit-form');check('Edición de materia')
            admin.locator('[data-action="group-new-complete"]').click();form=admin.locator('#group-save-form')
            form.locator('[name="code"]').fill('S');form.locator('[name="room"]').fill('Aula creativa')
            form.locator('[name="teacher_id"]').select_option(str(user['id']))
            form.locator('[data-session="day"]').select_option('Sab');form.locator('[data-session="start"]').fill('09:30');form.locator('[data-session="end"]').fill('11:30')
            save(admin,'#group-save-form');check('Nuevo grupo con horario y docente')
            for i,val in enumerate([33,33,34],1):admin.locator(f'#academic-settings-form [name="cut{i}"]').fill(str(val))
            save(admin,'#academic-settings-form');check('Porcentajes configurables aplicados al cálculo',next(g for g in data(student,'student')['grades'] if g['course_id']==7)['summary']['final']==4.01)
            for page_name in ['estudiantes','recuperacion','catalogo','auditoria']:
                route(admin,page_name);layout(admin,'administrador '+page_name);screenshot(admin,'admin-'+page_name)
            # Four wrong passwords; then assisted reset and separate administrator enablement.
            student.locator('[data-action="logout"]').click();expect(student.locator('#login-button')).to_be_visible()
            for _ in range(4):
                student.locator('#auth-user').fill('ESTUDIANTE');student.locator('#auth-pass').fill('incorrecta')
                with student.expect_response(lambda r:r.url.endswith('/api/login')):student.locator('#login-button').click()
                expect(student.locator('#login-button')).to_be_enabled()
            check('Bloqueo después de cuatro intentos',next(x for x in data(admin,'admin')['users'] if x['username']=='ESTUDIANTE')['status']=='locked')
            student.locator('[data-action="recover"]').click();student.locator('#recover-user').fill('ESTUDIANTE');save(student,'#request-recovery-form')
            student.locator('[data-action="modal-close"]').last.click()
            admin.reload();expect(admin.locator('.sidebar')).to_be_visible();route(admin,'recuperacion')
            admin.locator('[data-action="issue-recovery"]').first.click();admin.locator('[data-action="modal-confirm"]').click()
            expect(admin.locator('#issued-code')).to_be_visible();code=admin.locator('#issued-code').inner_text();admin.locator('[data-action="modal-close"]').last.click()
            student.locator('[data-action="recover"]').click()
            student.locator('#redeem-user').fill('ESTUDIANTE');student.locator('#redeem-code').fill(code);student.locator('#redeem-pass').fill('NuevaClave2026')
            save(student,'#redeem-form')
            check('Restablecer requiere habilitación separada',next(x for x in data(admin,'admin')['users'] if x['username']=='ESTUDIANTE')['status']=='reset_pending')
            admin.reload();expect(admin.locator('.sidebar')).to_be_visible()
            admin.locator('[data-action="user-status"][data-id="3"][data-status="active"]').click();admin.locator('[data-action="modal-confirm"]').click();expect(admin.locator('.overlay')).to_have_count(0)
            login(student,'ESTUDIANTE','NuevaClave2026');check('Acceso restaurado después de habilitación administrativa')
            student.locator('.experience-tools [data-action="theme"]').click();screenshot(student,'06-modo-noche')
            for width,label in [(768,'tableta'),(390,'movil')]:
                student.set_viewport_size({'width':width,'height':900})
                for page_name in ['tablero','pensum','inscripcion','horario','calendario','agenda','notas','asistencia','historial','perfil']:
                    student.evaluate('(name)=>navigate(name)',page_name);layout(student,label+' '+page_name)
                    if page_name in ('tablero','notas','inscripcion'):screenshot(student,label+'-'+page_name)
            for page in [admin,teacher]:
                page.set_viewport_size({'width':390,'height':900})
                for name in (['estudiantes','catalogo','recuperacion','auditoria'] if page==admin else ['notas','asistencia']):
                    page.evaluate('(name)=>navigate(name)',name);layout(page,'móvil '+name)
            student.set_viewport_size({'width':1440,'height':1000});student.evaluate("navigate('tablero')")
            gesture=student.evaluate('''()=>{const sample=vertices=>vertices.flatMap((a,i)=>{const b=vertices[(i+1)%vertices.length];return Array.from({length:30},(_,j)=>[a[0]+(b[0]-a[0])*j/29,a[1]+(b[1]-a[1])*j/29])});return [triangleGesture(sample([[0,150],[100,0],[200,150]])),triangleGesture(sample([[0,0],[200,0],[200,200],[0,200]])),triangleGesture(Array.from({length:100},(_,i)=>[100+100*Math.cos(i/99*2*Math.PI),100+100*Math.sin(i/99*2*Math.PI)]))]}''')
            check('Triángulo reconocido; círculo y cuadrado rechazados',gesture==[True,False,False])
            before=student.locator('html').get_attribute('data-tool');student.locator('.experience-tools [data-action="tool"]').click()
            check('Alternancia real del cursor',student.locator('html').get_attribute('data-tool')!=before)
            student.locator('.experience-tools [data-action="effects"]').click();check('Efectos se pueden desactivar',student.locator('html').get_attribute('data-tool')=='off')
            student.locator('.sidebar [data-route="notas"]').focus();expect(student.locator('#hint')).to_contain_text('Notas')
            check('Pistas contextuales con teclado')
            student.evaluate("document.body.style.zoom='2'");layout(student,'zoom 200%');student.evaluate("document.body.style.zoom='1'")
            check('Sin errores de JavaScript',not errors)
            video=student.video;student_ctx.close();video.save_as(str(OUT/'recorrido-cruza.webm'));admin_ctx.close();teacher_ctx.close();browser.close()
        (OUT/'resultado.json').write_text(json.dumps({'passed':len(checks),'checks':checks,'javascript_errors':errors,'transport':'HTTP real; Chromium headless; SQLite temporal'},ensure_ascii=False,indent=2),encoding='utf8')
        print(f'COMPLETADO: {len(checks)} verificaciones',flush=True)
    finally:
        process.terminate();process.wait(timeout=15);log.close()
