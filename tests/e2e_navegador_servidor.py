"""Prueba de integración: Chromium y frontend auténticos contra FastAPI/SQLite.

Chromium se conecta directamente al servidor local.

Requiere: pip install playwright; playwright install chromium
Ejecutar: python tests/e2e_navegador_servidor.py
"""
import os,sys,time,socket,tempfile,subprocess,urllib.request,shutil
from pathlib import Path
from playwright.sync_api import sync_playwright
from browser_checks import stop_server, wait_for_state

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
   errors=[];api_calls=[]
   with sync_playwright() as p:
    opts={'headless':True,'args':['--no-sandbox','--disable-dev-shm-usage']}
    chrome=shutil.which('chromium') or shutil.which('chromium-browser')
    if chrome:opts['executable_path']=chrome
    browser=p.chromium.launch(**opts)
    context=browser.new_context(viewport={'width':1440,'height':900},reduced_motion='reduce')
    page=context.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
    page.on('response', lambda r: api_calls.append((r.request.method,r.url,r.status)) if r.url.startswith(base+'/api/') else None)
    page.goto(base);page.wait_for_selector('#auth-user')
    page.locator('[data-font-trigger]').click()
    page.locator('[data-font-choice="1.25"]').click()
    assert page.locator('html').get_attribute('data-font-scale') == '1.25'
    page.reload()
    page.locator('#auth-user').wait_for(state='visible')
    assert page.locator('html').get_attribute('data-font-scale') == '1.25'
    page.locator('[data-font-trigger]').click()
    page.locator('[data-font-choice="1"]').click()
    def login(name,pwd):
     page.locator('#auth-user').fill(name);page.locator('#auth-pass').fill(pwd);page.locator('#login-button').click();page.wait_for_selector('.sidebar',timeout=14000)
    def route(key):page.locator(f'.sidebar [data-route="{key}"]').click()
    def logout():
     with page.expect_response(lambda r: r.url == base+'/api/logout' and r.request.method == 'POST') as response:
      page.locator('.sidebar [data-action="logout"]').click()
     assert response.value.ok
     page.locator('#auth-user').wait_for(state='visible')
     assert page.request.get(base+'/api/session').json()['user'] is None
    login('ESTUDIANTE','CRUZA2026');route('pensum');assert page.locator('.page-heading').is_visible()
    page.set_viewport_size({'width':390,'height':844})
    page.locator('[data-font-trigger]').click()
    page.locator('[data-font-choice="1.25"]').click()
    assert page.locator('[data-font-trigger]').evaluate("""element => {
      const button = element.getBoundingClientRect();
      const bar = element.closest('.topbar').getBoundingClientRect();
      return button.left >= bar.left && button.right <= bar.right;
    }""")
    page.set_viewport_size({'width':1440,'height':900})
    page.locator('[data-font-trigger]').click()
    page.locator('[data-font-choice="1"]').click()
    route('inscripcion');g=page.evaluate("state.data.groups.filter(g=>g.course_code==='MAT-202')")
    page.locator(f'[data-action="toggle-course"][data-course-id="{g[0]["course_id"]}"]').click()
    wait_for_state(page, "state.data.draft.problems.some(p=>p.reason.includes('Cruce'))")
    assert not page.locator('[data-action="confirm-enroll"]').is_enabled()
    page.locator(f'#grp-{g[0]["course_id"]}').select_option(str(g[1]['id']))
    wait_for_state(page, 'state.data.draft.problems.length===0')
    page.locator('[data-action="confirm-enroll"]').click();page.locator('[data-action="modal-confirm"]').click()
    wait_for_state(page, "state.data.draft.confirmed.some(x=>x.code==='MAT-202')")
    route('agenda');page.locator('[data-action="agenda-new"]').click();page.locator('#ag-title').fill('Comprobar CRUZA')
    page.locator('#ag-date').fill('2026-11-13');page.locator('#agenda-form button[type="submit"]').click()
    wait_for_state(page, "state.data.agenda.some(x=>x.title==='Comprobar CRUZA')")
    logout();login('DOCENTE','CLASE2026')
    teacher=page.evaluate('state.data.groups.find(g=>g.students.length)')
    st=teacher['students'][0];ev=st['evaluations'][0]
    page.locator('#teacher-group').select_option(str(teacher['id']))
    page.locator(f'#grade-{st["id"]}-{ev["id"]}').fill('4.7');page.locator(f'#reason-{st["id"]}').fill('Comprobación de evaluación')
    page.locator(f'[data-action="save-grade"][data-eval-id="{ev["id"]}"]').click()
    wait_for_state(page, '(id)=>state.data.groups.some(g=>g.students.some(s=>s.evaluations.some(e=>e.id===id&&e.grade===4.7)))',arg=ev['id'])
    logout();login('ADMIN','ADMIN2026')
    page.locator('[data-action="student-new"]').click()
    form=page.locator('#create-student-form');form.locator('[name="full_name"]').fill('Prueba de aprobación')
    form.locator('[name="username"]').fill('PRUEBAWEB')
    form.locator('[name="password"]').fill('ClaveLargaCorrecta2026PorSeguridad')
    form.locator('button[type="submit"]').click()
    wait_for_state(page, 'state.data.users.some(u=>u.username==="PRUEBAWEB"&&u.status==="pending")')
    uid=page.evaluate('state.data.users.find(u=>u.username==="PRUEBAWEB").id')
    page.locator(f'[data-action="user-status"][data-id="{uid}"][data-status="active"]').click()
    page.locator('[data-action="modal-confirm"]').click()
    wait_for_state(page, 'state.data.users.some(u=>u.username==="PRUEBAWEB"&&u.status==="active")')
    logout();login('PRUEBAWEB','ClaveLargaCorrecta2026PorSeguridad')
    assert page.locator('.sidebar').is_visible()
    logout()
    assert not errors,errors
    wait_for_state(page, 'Boolean(navigator.serviceWorker.controller)')
    assert page.evaluate("""async () => {
      const keys = await caches.keys();
      const cache = await caches.open(keys.find(key => key.startsWith('cruza-public-game-')));
      return (await cache.keys()).every(request => request.url.includes('/static/cruza-crucigrama.'));
    }""")
    context.set_offline(True)
    page.get_by_role('link', name='Jugar al crucigrama').wait_for()
    page.reload()
    page.get_by_role('heading', name='Crucigrama del campus').wait_for()
    page.locator('#cell-1').fill('X')
    page.get_by_role('button', name='Comprobar').click()
    assert page.locator('#cell-1').get_attribute('aria-invalid') == 'true'
    page.get_by_role('button', name='Reiniciar').click()
    assert page.locator('#cell-1').input_value() == ''
    for position, letter in {1:'C', 6:'U', 10:'C', 11:'R', 12:'U', 13:'Z',
                             14:'A', 16:'S', 19:'U', 21:'O', 24:'L', 29:'A'}.items():
     page.locator(f'#cell-{position}').fill(letter)
    page.get_by_role('button', name='Comprobar').click()
    assert page.locator('#result').inner_text() == '¡Crucigrama resuelto!'
    context.set_offline(False)
    page.get_by_role('link', name='Volver al campus').click()
    page.locator('#auth-user').wait_for(state='visible')
    assert not errors,errors
    assert not any(status>=500 for method,url,status in api_calls)
    context.close();browser.close()
   print(f'OK: recorrido Chromium/API real, {len(api_calls)} solicitudes, sin errores JS ni HTTP 5xx.')
  finally:
   stop_server(proc)

if __name__=='__main__':main()
