"""Prueba de integración: Chromium y frontend auténticos contra FastAPI/SQLite.

Puente HTTP: Chromium del entorno controlado no puede abrir localhost;
las llamadas fetch se canalizan a un servidor HTTP real desde Python.
En el PC del usuario debe probarse también http://127.0.0.1:8765 directamente.

Requiere: pip install playwright; playwright install chromium
Ejecutar: python tests/e2e_navegador_servidor.py
"""
import os,sys,time,socket,tempfile,subprocess,urllib.request,urllib.error,http.cookiejar,shutil
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]

def unused_port():
 with socket.socket() as s:s.bind(('127.0.0.1',0));return s.getsockname()[1]

def main():
 port=unused_port()
 with tempfile.TemporaryDirectory(prefix='cruza-tests-') as td:
  env=dict(os.environ,CRUZA_DEMO_MODE='1',CRUZA_DB_PATH=str(Path(td)/'cruza.sqlite3'))
  proc=subprocess.Popen([sys.executable,'-m','uvicorn','app.main:app','--host','127.0.0.1','--port',str(port),'--log-level','error'],cwd=ROOT,env=env,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
  try:
   base=f'http://127.0.0.1:{port}'
   for _ in range(50):
    try:
     if urllib.request.urlopen(base+'/api/session',timeout=.5).status==200:break
    except Exception:time.sleep(.1)
   else:raise RuntimeError('El servidor de prueba no inició.')
   html=(ROOT/'app/templates/index.html').read_text(encoding='utf8')
   html=html.replace('<link rel="stylesheet" href="/static/app.css">','<style>'+(ROOT/'app/static/app.css').read_text(encoding='utf8')+'</style>')
   html=html.replace('<script defer src="/static/app.js"></script>','')
   shim='''<script>
   const store={};Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem(k){return store[k]??null},setItem(k,v){store[k]=String(v)}}});
   window.fetch=async(url,options={})=>{const r=await window.cruzaBridge({url:String(url),method:options.method||'GET',headers:options.headers||{},body:options.body||null});return new Response(r.body,{status:r.status,headers:{'Content-Type':'application/json'}})};
   </script>'''
   html=html.replace('</body>',shim+'<script>'+(ROOT/'app/static/app.js').read_text(encoding='utf8')+'</script></body>')
   opener=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
   errors=[];api_calls=[]
   def bridge(arg):
    body=arg.get('body');headers=arg.get('headers',{});
    req=urllib.request.Request(base+arg['url'],data=body.encode() if body is not None else None,headers=headers,method=arg['method'])
    try:
     with opener.open(req,timeout=10) as r:status,data=r.status,r.read().decode()
    except urllib.error.HTTPError as e:status,data=e.code,e.read().decode()
    api_calls.append((arg['method'],arg['url'],status))
    return {'status':status,'body':data}
   with sync_playwright() as p:
    opts={'headless':True,'args':['--no-sandbox','--disable-dev-shm-usage']}
    chrome=shutil.which('chromium') or shutil.which('chromium-browser')
    if chrome:opts['executable_path']=chrome
    browser=p.chromium.launch(**opts)
    context=browser.new_context(viewport={'width':1440,'height':900},reduced_motion='reduce')
    page=context.new_page();page.expose_function('cruzaBridge',bridge);page.on('pageerror',lambda e:errors.append(str(e)))
    page.set_content(html);page.wait_for_selector('#auth-user')
    def login(name,pwd):
     page.locator('#auth-user').fill(name);page.locator('#auth-pass').fill(pwd);page.locator('#login-button').click();page.wait_for_selector('.sidebar',timeout=14000)
    def route(key):page.locator(f'.sidebar [data-route="{key}"]').click()
    def logout():page.locator('.sidebar [data-action="logout"]').click();page.wait_for_selector('#auth-user')
    login('ESTUDIANTE','CRUZA2026');route('pensum');assert page.locator('.page-heading').is_visible()
    route('inscripcion');g=page.evaluate("state.data.groups.filter(g=>g.course_code==='MAT-202')")
    page.locator(f'[data-action="toggle-course"][data-course-id="{g[0]["course_id"]}"]').click()
    page.wait_for_function("state.data.draft.problems.some(p=>p.reason.includes('Cruce'))")
    assert not page.locator('[data-action="confirm-enroll"]').is_enabled()
    page.locator(f'#grp-{g[0]["course_id"]}').select_option(str(g[1]['id']))
    page.wait_for_function('state.data.draft.problems.length===0')
    page.locator('[data-action="confirm-enroll"]').click();page.locator('[data-action="modal-confirm"]').click()
    page.wait_for_function("state.data.draft.confirmed.some(x=>x.code==='MAT-202')")
    route('agenda');page.locator('[data-action="agenda-new"]').click();page.locator('#ag-title').fill('Comprobar CRUZA')
    page.locator('#ag-date').fill('2026-11-13');page.locator('#agenda-form button[type="submit"]').click()
    page.wait_for_function("state.data.agenda.some(x=>x.title==='Comprobar CRUZA')")
    logout();login('DOCENTE','CLASE2026')
    teacher=page.evaluate('state.data.groups.find(g=>g.students.length)')
    st=teacher['students'][0];ev=st['evaluations'][0]
    page.locator('#teacher-group').select_option(str(teacher['id']))
    page.locator(f'#grade-{st["id"]}-{ev["id"]}').fill('4.7');page.locator(f'#reason-{st["id"]}').fill('Comprobación de evaluación')
    page.locator(f'[data-action="save-grade"][data-eval-id="{ev["id"]}"]').click()
    page.wait_for_function('(id)=>state.data.groups.some(g=>g.students.some(s=>s.evaluations.some(e=>e.id===id&&e.grade===4.7)))',arg=ev['id'])
    logout();login('ADMIN','ADMIN2026')
    page.locator('[data-action="student-new"]').click()
    form=page.locator('#create-student-form');form.locator('[name="full_name"]').fill('Prueba de aprobación')
    form.locator('[name="username"]').fill('PRUEBAWEB')
    form.locator('[name="password"]').fill('ClaveLargaCorrecta2026PorSeguridad')
    form.locator('button[type="submit"]').click()
    page.wait_for_function('state.data.users.some(u=>u.username==="PRUEBAWEB"&&u.status==="pending")')
    uid=page.evaluate('state.data.users.find(u=>u.username==="PRUEBAWEB").id')
    page.locator(f'[data-action="user-status"][data-id="{uid}"][data-status="active"]').click()
    page.locator('[data-action="modal-confirm"]').click()
    page.wait_for_function('state.data.users.some(u=>u.username==="PRUEBAWEB"&&u.status==="active")')
    logout();login('PRUEBAWEB','ClaveLargaCorrecta2026PorSeguridad')
    assert page.locator('.sidebar').is_visible()
    assert not errors,errors
    assert not any(status>=500 for method,url,status in api_calls)
    context.close();browser.close()
   print(f'OK: recorrido Chromium/API real, {len(api_calls)} solicitudes, sin errores JS ni HTTP 5xx.')
  finally:
   proc.terminate()
   try:proc.wait(timeout=5)
   except subprocess.TimeoutExpired:proc.kill()

if __name__=='__main__':main()
