"""Offline Chromium visual smoke: Chromium in this environment blocks localhost navigation.
This harness exercises the actual CSS/JS using mocked transport populated by the real API.
API integration/security verified separately by pytest.
"""
import json, tempfile, os
os.environ["CRUZA_DEMO_MODE"]="1"
from pathlib import Path
from fastapi.testclient import TestClient
from playwright.sync_api import sync_playwright
from app.main import app

ROOT=Path(__file__).parents[1]
html=(ROOT/'app/templates/index.html').read_text()
css=(ROOT/'app/static/app.css').read_text()
js=(ROOT/'app/static/app.js').read_text()

with TestClient(app) as api:
    users={}
    for role,name,pw,endpoint in [('student','ESTUDIANTE','CRUZA2026','student'),
                                  ('teacher','DOCENTE','CLASE2026','teacher'),
                                  ('admin','ADMIN','ADMIN2026','admin')]:
        rr=api.post('/api/login',json={'username':name,'password':pw})
        assert rr.status_code==200,(role,rr.text)
        data=api.get('/api/'+endpoint)
        assert data.status_code==200,(role,data.text)
        users[role]={'login':rr.json(),'data':data.json()}
        assert api.post('/api/logout',headers={'x-csrf-token':rr.json()['csrf']}).status_code==200

fixture=json.dumps(users,ensure_ascii=False).replace('</','<\\/')
mock="""
Object.defineProperty(window,'localStorage',{configurable:true,value:{
 data:{},getItem(k){return this.data[k]??null},setItem(k,v){this.data[k]=String(v)},removeItem(k){delete this.data[k]}
}});
const __fixtures=REPLACEMENT;
window.fetch=async function(path,opt={}){
 let name=String(path).replace('/api/','');
 let requested='student';let body={};try{body=JSON.parse(opt.body||'{}')}catch{}
 if(name==='session')return {ok:true,json:async()=>({user:null,csrf:null})};
 if(name==='login'){
   const role=body.username==='ESTUDIANTE'?'student':body.username==='DOCENTE'?'teacher':body.username==='ADMIN'?'admin':null;
   if(role&&body.password===({student:'CRUZA2026',teacher:'CLASE2026',admin:'ADMIN2026'})[role]){
      window.__currentRole=role;return {ok:true,json:async()=>__fixtures[role].login};
   }
   return {ok:false,status:401,json:async()=>({error:'Usuario o contraseña incorrectos.'})};
 }
 if(name==='logout')return {ok:true,json:async()=>({ok:true})};
 if(['student','teacher','admin'].includes(name))return {ok:true,json:async()=>__fixtures[name].data};
 return {ok:false,status:400,json:async()=>({error:'Esta acción requiere el servidor real; solo se comprueba la interfaz.'})};
}
""".replace('REPLACEMENT',fixture)
content=html.replace('<link rel="stylesheet" href="/static/app.css">','<style>'+css+'</style>').replace(
    '<script defer src="/static/app.js"></script>',
    '<script>'+mock+'</script>').replace('</body>','<script>'+js+'</script></body>')

with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    for width,height in [(1440,900),(390,844)]:
        for role in ['student','teacher','admin']:
            if role!='student' and width==390:continue
            page=browser.new_page(viewport={'width':width,'height':height},device_scale_factor=1)
            errors=[]
            page.on('pageerror',lambda e,errors=errors:errors.append(str(e)))
            page.set_content(content,wait_until='domcontentloaded')
            page.wait_for_selector('#auth-user',timeout=10000)
            page.screenshot(path=str(ROOT/f'docs/capturas/CRUZA3-login-{width}.png'),full_page=True)
            creds={'student':('ESTUDIANTE','CRUZA2026'),'teacher':('DOCENTE','CLASE2026'),
                   'admin':('ADMIN','ADMIN2026')}[role]
            page.locator('#auth-user').fill(creds[0]);page.locator('#auth-pass').fill(creds[1])
            page.locator('#login-button').click()
            page.wait_for_selector('.sidebar',timeout=20000)
            page.screenshot(path=str(ROOT/f'docs/capturas/CRUZA3-{role}-{width}.png'),full_page=True)
            # Navigation controls should not crash or overflow.
            if role=='student':
                for route in ['pensum','inscripcion','horario','calendario','agenda','notas','historial','perfil']:
                    
                    if width<900:page.locator('[data-action="menu"]').click()
                    page.locator(f'.sidebar [data-route="{route}"]').click()
                    page.locator('.page-heading h1').wait_for()
                    if route in ['inscripcion','notas']:
                        page.screenshot(path=str(ROOT/f'docs/capturas/CRUZA3-{route}-{width}.png'),full_page=True)
            if role=='teacher':
                page.locator('.sidebar [data-route="asistencia"]').click()
                page.locator('.page-heading h1').wait_for()
            if role=='admin':
                for route in ['recuperacion','catalogo','auditoria']:
                    page.locator(f'.sidebar [data-route="{route}"]').click()
                    page.locator('.page-heading h1').wait_for()
            overflow=page.evaluate('document.documentElement.scrollWidth > document.documentElement.clientWidth+2')
            print('UI',role,width,'overflows=',overflow,'page errors=',errors)
            assert not errors,errors
            assert not overflow,(role,width)
            page.close()
    # Video visual de referencia: usa CSS/JS real, pero transporte mockeado.
    video_dir=ROOT/'docs'/'video-temporal'
    video_dir.mkdir(exist_ok=True)
    context=browser.new_context(viewport={'width':1280,'height':720},record_video_dir=str(video_dir),record_video_size={'width':1280,'height':720})
    page=context.new_page()
    page.set_content(content,wait_until='domcontentloaded')
    page.locator('#auth-user').fill('ESTUDIANTE')
    page.locator('#auth-pass').fill('CRUZA2026')
    page.wait_for_timeout(650)
    page.locator('#login-button').click()
    page.wait_for_selector('.sidebar',timeout=20000)
    page.wait_for_timeout(1100)
    for route in ['inscripcion','notas','calendario','agenda']:
        page.locator(f'.sidebar [data-route="{route}"]').click()
        page.wait_for_timeout(850)
    video=page.video
    context.close()
    assert video is not None
    import shutil
    shutil.copyfile(video.path(),ROOT/'docs'/'CRUZA3-RECORRIDO-VISUAL.webm')
    browser.close()
