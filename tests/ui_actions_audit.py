"""Prueba manual automatizada de acciones y formularios con HTTP/SQLite reales aislados.
Ejecutar: python tests/ui_actions_audit.py (requiere playwright, chromium, httpx).
"""
from pathlib import Path
import os,sys,shutil,socket,tempfile,subprocess,time,urllib.request,urllib.error,http.cookiejar,re,json
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]

def port_free():
 with socket.socket() as s:s.bind(('127.0.0.1',0));return s.getsockname()[1]

def main():
 with tempfile.TemporaryDirectory(prefix='cruza-actions-') as td:
  port=port_free();base=f'http://127.0.0.1:{port}'
  env=dict(os.environ,CRUZA_DEMO_MODE='1',CRUZA_DB_PATH=str(Path(td)/'data.sqlite3'))
  proc=subprocess.Popen([sys.executable,'-m','uvicorn','app.main:app','--host','127.0.0.1','--port',str(port),'--log-level','error'],cwd=ROOT,env=env,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
  try:
   for _ in range(80):
    try:
     if urllib.request.urlopen(base+'/api/session',timeout=.5).status==200:break
    except Exception:time.sleep(.1)
   else:raise RuntimeError('Servidor no arrancó')
   html=(ROOT/'app/templates/index.html').read_text('utf8');css=(ROOT/'app/static/app.css').read_text('utf8')
   html,n=re.subn(r'<link\s+rel="stylesheet"\s+href="/static/app\.css[^"]*"\s*/?>',lambda _:'<style>'+css+'</style>',html)
   assert n==1
   html,n=re.subn(r'<script\s+defer\s+src="/static/app\.js[^"]*"\s*>\s*</script>','',html)
   assert n==1
   js=(ROOT/'app/static/app.js').read_text('utf8')
   shim="""<script>const store={};Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem(k){return store[k]??null},setItem(k,v){store[k]=String(v)}}});
   window.fetch=async(url,o={})=>{const r=await window.cruzaBridge({url:String(url),method:o.method||'GET',headers:o.headers||{},body:o.body||null});return new Response(r.body,{status:r.status,headers:{'Content-Type':'application/json'}})};</script>"""
   html=html.replace('</body>',shim+'<script>'+js+'</script></body>')
   jar=http.cookiejar.CookieJar();opener=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))
   calls=[];errors=[];actions=[]
   def bridge(a):
    req=urllib.request.Request(base+a['url'],data=a['body'].encode() if a['body'] is not None else None,headers=a['headers'],method=a['method'])
    try:
     with opener.open(req,timeout=12) as res:status,data=res.status,res.read().decode()
    except urllib.error.HTTPError as e:status,data=e.code,e.read().decode()
    calls.append({'method':a['method'],'url':a['url'],'status':status})
    return {'status':status,'body':data}
   with sync_playwright() as playwright:
    args={'headless':True,'args':['--no-sandbox','--disable-dev-shm-usage']}
    if shutil.which('chromium'):args['executable_path']=shutil.which('chromium')
    browser=playwright.chromium.launch(**args)
    ctx=browser.new_context(viewport={'width':1440,'height':900},reduced_motion='reduce')
    page=ctx.new_page();page.on('pageerror',lambda e:errors.append(str(e)));page.expose_function('cruzaBridge',bridge)
    page.set_content(html);page.wait_for_selector('#auth-user')
    def click(sel,action=None):
     page.locator(sel).first.click(timeout=12000)
     if action:actions.append(action)
    def route(key):
     click(f'.sidebar [data-route="{key}"]','route '+key)
     page.wait_for_function('(v)=>state.page===v',arg=key)
    def login(u,p):
     page.locator('#auth-user').fill(u);page.locator('#auth-pass').fill(p)
     click('#login-button','login '+u);page.wait_for_selector('.sidebar',timeout=14000)
    def logout():click('.sidebar [data-action="logout"]','logout');page.wait_for_selector('#auth-user')
    def confirm():
     assert page.locator('[role="dialog"]').is_visible()
     click('[data-action="modal-confirm"]','confirm dialog')
     page.wait_for_selector('[role="dialog"]',state='detached')
    def modal_labels():
     missing=page.locator('[role="dialog"] input:not([type="hidden"]),[role="dialog"] select,[role="dialog"] textarea').evaluate_all('els=>els.filter(x=>!x.labels?.length&&!x.getAttribute("aria-label")).map(x=>x.outerHTML)')
     assert not missing,missing
    # Public login controls, extra instructions and recovery dialog.
    click('[data-action="demo-info"]','demo-info');assert page.get_by_text('ESTUDIANTE / CRUZA2026').is_visible();click('[data-action="modal-close"]','close dialog')
    click('[data-action="recover"]','recover open');modal_labels();click('[data-action="modal-close"]','close recovery')
    login('ESTUDIANTE','CRUZA2026')
    # Sidebar and crossword, hint ribbon, light/dark and mouse tool.
    click('[data-action="theme"]','theme');assert page.evaluate('document.documentElement.dataset.theme')=='dark'
    click('[data-action="theme"]','theme');assert page.evaluate('document.documentElement.dataset.theme')=='light'
    click('[data-action="tool"]','tool')
    click('[data-action="toggle-hints"]','hide hints');assert page.locator('#hint').is_hidden()
    click('[data-action="toggle-hints"]','show hints');assert page.locator('#hint').is_visible()
    # Route via crossword button, including intersections where available.
    word=page.locator('.board-tile[data-path]').first
    word.click();actions.append('crossword navigation');
    if page.locator('[role="dialog"]').count():
     click('[role="dialog"] [data-route]','crossword intersection')
    # Pensum -> enroll route using a real course finder.
    route('pensum');btn=page.locator('[data-action="find-course"]').first
    if btn.count():btn.click();actions.append('course finder');page.wait_for_function('state.page==="inscripcion"')
    else:route('inscripcion')
    # Form filtering, group selection, conflict prevention and discard.
    page.locator('#course-search').fill('Mat');actions.append('course search');assert page.locator('.course-card:visible').count()>=1
    page.locator('#course-search').fill('')
    page.locator('#course-filter').select_option(label='Obligatoria');actions.append('course category')
    page.locator('#course-filter').select_option(label='Todas')
    page.locator('#semester-filter').select_option('2');actions.append('semester filter')
    page.locator('#semester-filter').select_option('')
    click('[data-action="mobile-draft-tab"][data-draft-tab="vista"]','draft preview')
    click('[data-action="mobile-draft-tab"][data-draft-tab="materias"]','draft courses')
    # Add course whose group conflicts with existing class, then solve it.
    group=page.evaluate("state.data.groups.filter(g=>g.course_code==='MAT-202')")
    if group:
     cid=group[0]['course_id']
     click(f'[data-action="toggle-course"][data-course-id="{cid}"]','add course')
     page.wait_for_function('state.data.draft.problems.length>0')
     assert not page.locator('[data-action="confirm-enroll"]').is_enabled()
     page.locator(f'#grp-{cid}').select_option(str(group[-1]['id']));actions.append('switch course group')
     page.wait_for_function('state.data.draft.problems.length===0')
     click('[data-action="discard"]','discard draft');confirm()
     page.wait_for_function('state.data.draft.problems.length===0')
     click(f'[data-action="toggle-course"][data-course-id="{cid}"]','add course again')
     page.wait_for_function('state.data.draft.problems.length>0')
     page.locator(f'#grp-{cid}').select_option(str(group[-1]['id']))
     page.wait_for_function('state.data.draft.problems.length===0')
     click('[data-action="confirm-enroll"]','confirm enrollment');confirm()
     page.wait_for_function('state.data.draft.confirmed.some(x=>x.code==="MAT-202")')
    route('horario')
    assert page.locator('a[href="/api/student/schedule.csv"]').count()==1;actions.append('CSV export affordance')
    route('calendario')
    before=page.evaluate('state.calendarDate')
    click('[data-action="cal-next-month"]','next month');assert page.evaluate('state.calendarDate')!=before
    click('[data-action="cal-prev-month"]','previous month')
    click('[data-action="calendar-day"]','select calendar day')
    click('[data-action="agenda-preset"]','agenda from calendar');modal_labels()
    page.locator('#ag-title').fill('Recordatorio desde calendario')
    click('#agenda-form button[type="submit"]','create from calendar');page.wait_for_function('state.data.agenda.some(a=>a.title==="Recordatorio desde calendario")')
    route('agenda')
    click('[data-action="agenda-new"]','new agenda');modal_labels()
    page.locator('#ag-title').fill('Tarea de prueba rigurosa');page.locator('#ag-date').fill('2026-11-19')
    page.locator('#ag-desc').fill('Validación de campo de texto')
    click('#agenda-form button[type="submit"]','save agenda');page.wait_for_function('state.data.agenda.some(a=>a.title==="Tarea de prueba rigurosa")')
    id=page.evaluate('state.data.agenda.find(a=>a.title==="Tarea de prueba rigurosa").id')
    click(f'[data-action="agenda-edit"][data-agenda-id="{id}"]','edit agenda');modal_labels()
    page.locator('#ag-title').fill('Tarea modificada');click('#agenda-form button[type="submit"]','save edited agenda')
    page.wait_for_function('(id)=>state.data.agenda.some(a=>a.id===id&&a.title==="Tarea modificada")',arg=id)
    click(f'[data-action="agenda-complete"][data-agenda-id="{id}"]','complete agenda')
    page.wait_for_function('(id)=>state.data.agenda.some(a=>a.id===id&&a.done)',arg=id)
    click('[data-action="agenda-toggle-done"][data-done="true"]','filter completed')
    assert page.get_by_text('Tarea modificada').is_visible()
    click(f'[data-action="agenda-delete"][data-agenda-id="{id}"]','delete agenda');confirm()
    page.wait_for_function('(id)=>!state.data.agenda.some(a=>a.id===id)',arg=id)
    route('notas')
    page.locator('#simulate-cut-1').fill('4.5');page.locator('#simulate-cut-2').fill('3');page.locator('#simulate-grade').fill('5')
    assert page.locator('#simulate-result').inner_text()=='4,25'
    click('[data-action="sim-quick"][data-grade="4"]','quick grade')
    assert page.locator('#simulate-result').inner_text()=='3,85'
    page.locator('#simulate-course').select_option(index=1);actions.append('switch simulation course')
    route('asistencia');route('historial');route('perfil');logout()
    # Teacher inputs and both statuses of attendance.
    login('DOCENTE','CLASE2026');route('notas')
    grp=page.evaluate('state.data.groups.find(g=>g.students?.length)')
    page.locator('#teacher-group').select_option(str(grp['id']));actions.append('teacher group')
    st=grp['students'][0];ev=st['evaluations'][0]
    page.locator(f'#grade-{st["id"]}-{ev["id"]}').fill('4.6');page.locator(f'#reason-{st["id"]}').fill('Corrección de prueba')
    click(f'[data-action="save-grade"][data-student-id="{st["id"]}"][data-eval-id="{ev["id"]}"]','save grade')
    page.wait_for_function('(id)=>state.data.groups.some(g=>g.students.some(s=>s.evaluations.some(e=>e.id===id&&e.grade===4.6)))',arg=ev['id'])
    route('asistencia');page.locator('#attendance-group').select_option(str(grp['id']))
    page.locator('#attendance-date').fill('2026-11-17')
    click(f'[data-action="attendance"][data-student-id="{st["id"]}"][data-present="true"]','attendance present')
    click(f'[data-action="attendance"][data-student-id="{st["id"]}"][data-present="false"]','attendance absent')
    logout()
    # Admin create course/group, create/approve/disable user, audit and recovery flow.
    login('ADMIN','ADMIN2026')
    route('catalogo');click('[data-action="course-new"]','new course');modal_labels()
    form=page.locator('#create-course-form');form.locator('[name="code"]').fill('REV-777');form.locator('[name="name"]').fill('Materia de verificación');form.locator('[name="credits"]').fill('2')
    form.locator('button[type="submit"]').click();actions.append('save course');page.wait_for_function('state.data.courses.some(c=>c.code==="REV-777")')
    click('[data-action="group-new"]','new group');modal_labels()
    form=page.locator('#create-group-form');cid=page.evaluate('state.data.courses.find(c=>c.code==="REV-777").id')
    form.locator('[name="course_id"]').select_option(str(cid));form.locator('[name="code"]').fill('Z');form.locator('[name="room"]').fill('A-101')
    form.locator('button[type="submit"]').click();actions.append('save group');page.wait_for_function('state.data.groups.some(g=>g.course_code==="REV-777")')
    route('estudiantes');click('[data-action="student-new"]','new student');modal_labels()
    form=page.locator('#create-student-form');form.locator('[name="full_name"]').fill('Estudiante para auditoría')
    form.locator('[name="username"]').fill('FUSIONTEST');form.locator('[name="password"]').fill('Prueba2026_segura')
    form.locator('button[type="submit"]').click();actions.append('create student');page.wait_for_function('state.data.users.some(u=>u.username==="FUSIONTEST"&&u.status==="pending")')
    uid=page.evaluate('state.data.users.find(u=>u.username==="FUSIONTEST").id')
    click(f'[data-action="user-status"][data-id="{uid}"][data-status="active"]','approve student');confirm()
    page.wait_for_function('(id)=>state.data.users.some(u=>u.id===id&&u.status==="active")',arg=uid)
    click(f'[data-action="user-status"][data-id="{uid}"][data-status="disabled"]','disable student');confirm()
    page.wait_for_function('(id)=>state.data.users.some(u=>u.id===id&&u.status==="disabled")',arg=uid)
    click(f'[data-action="user-status"][data-id="{uid}"][data-status="active"]','reactivate student');confirm()
    page.wait_for_function('(id)=>state.data.users.some(u=>u.id===id&&u.status==="active")',arg=uid)
    route('auditoria');assert page.locator('.page-heading').is_visible()
    route('recuperacion');logout()
    # Wrong passwords 4x -> blocked. Request recovery from login.
    for i in range(4):
     page.locator('#auth-user').fill('FUSIONTEST');page.locator('#auth-pass').fill('malaclave')
     click('#login-button','failed login');page.wait_for_selector('#auth-error:not(:empty)',timeout=8000)
    click('[data-action="recover"]','request account recovery');modal_labels()
    page.locator('#recover-user').fill('FUSIONTEST')
    click('#request-recovery-form button[type="submit"]','submit recovery')
    page.get_by_text('Solicitud registrada').wait_for(state='visible',timeout=15000)
    click('[data-action="modal-close"]','close recovery')
    login('ADMIN','ADMIN2026');route('recuperacion')
    req=page.evaluate('state.data.recovery.find(x=>x.username==="FUSIONTEST")')
    click(f'[data-action="issue-recovery"][data-id="{req["id"]}"]','issue recovery');confirm()
    page.wait_for_selector('#issued-code');code=page.locator('#issued-code').inner_text();assert code
    click('[data-action="modal-close"]','close code');logout()
    click('[data-action="recover"]','redeem recovery');modal_labels()
    page.locator('#redeem-user').fill('FUSIONTEST');page.locator('#redeem-code').fill(code);page.locator('#redeem-pass').fill('Restablecida2026!')
    click('#redeem-form button[type="submit"]','redeem code')
    page.wait_for_selector('#auth-user',timeout=15000)
    login('ADMIN','ADMIN2026');route('estudiantes')
    click(f'[data-action="user-status"][data-id="{uid}"][data-status="active"]','unlock account');confirm()
    page.wait_for_function('(id)=>state.data.users.some(u=>u.id===id&&u.status==="active")',arg=uid)
    logout();login('FUSIONTEST','Restablecida2026!')
    assert page.locator('.sidebar').is_visible()
    assert not errors,errors
    assert not any(call['status']>=500 for call in calls),[x for x in calls if x['status']>=500]
    report={'actions_count':len(actions),'action_names':actions,'http_requests':len(calls),'http_errors':[x for x in calls if x['status']>=400],'js_errors':errors}
    (ROOT/'docs'/'auditoria'/'acciones.json').write_text(json.dumps(report,indent=2,ensure_ascii=False),encoding='utf8')
    print(f"AUDITORIA OK: {len(actions)} interacciones, {len(calls)} solicitudes HTTP, 0 errores 5xx o JavaScript")
    browser.close()
  finally:
   proc.terminate()
   try:proc.wait(timeout=5)
   except subprocess.TimeoutExpired:proc.kill()
if __name__=='__main__':main()