from cruza_assets import inline_tools
"""Auditoría E2E: visual por rol/pantalla, controles, estado y API real aislada."""
from pathlib import Path
import os,sys,shutil,socket,tempfile,subprocess,time,urllib.request,urllib.error,http.cookiejar,re,json
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'docs'/'auditoria';OUT.mkdir(parents=True,exist_ok=True)

def port_free():
 with socket.socket() as s:s.bind(('127.0.0.1',0));return s.getsockname()[1]

def audit():
 port=port_free();base=f'http://127.0.0.1:{port}'
 with tempfile.TemporaryDirectory(prefix='cruza-auditoria-') as tmp:
  env=dict(os.environ,CRUZA_DEMO_MODE='1',CRUZA_DB_PATH=str(Path(tmp)/'data.sqlite3'))
  p=subprocess.Popen([sys.executable,'-m','uvicorn','app.main:app','--host','127.0.0.1','--port',str(port),'--log-level','error'],cwd=ROOT,env=env,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
  try:
   for _ in range(80):
    try:
     if urllib.request.urlopen(base+'/api/session',timeout=.5).status==200:break
    except Exception:time.sleep(.1)
   else:raise RuntimeError('Servidor no arrancó')
   html=inline_tools((ROOT/'app/templates/index.html').read_text('utf8'),ROOT)
   css=(ROOT/'app/static/app.css').read_text('utf8')
   html,n1=re.subn(r'<link\s+rel="stylesheet"\s+href="/static/app\.css[^"]*"\s*/?>',lambda m:'<style>'+css+'</style>',html)
   html,n2=re.subn(r'<script\s+defer\s+src="/static/app\.js[^"]*"\s*>\s*</script>','',html)
   assert n1==n2==1,(n1,n2)
   javascript=(ROOT/'app/static/app.js').read_text('utf8')
   shim='''<script>const store={};Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem(k){return store[k]??null},setItem(k,v){store[k]=String(v)}}});
   window.fetch=async(url,opts={})=>{const r=await window.cruzaBridge({url:String(url),method:opts.method||'GET',headers:opts.headers||{},body:opts.body||null});return new Response(r.body,{status:r.status,headers:{'Content-Type':'application/json'}})};</script>'''
   html=html.replace('</body>',shim+'<script>'+javascript+'</script></body>')
   cookies=http.cookiejar.CookieJar();opener=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cookies))
   calls=[];js_errors=[];screens=[];issues=[];controls_report=[]
   def bridge(a):
    req=urllib.request.Request(base+a['url'],data=a['body'].encode() if a['body'] is not None else None,headers=a.get('headers',{}),method=a['method'])
    try:
     with opener.open(req,timeout=10) as res:status,data=res.status,res.read().decode()
    except urllib.error.HTTPError as e:status,data=e.code,e.read().decode()
    calls.append((a['method'],a['url'],status))
    return {'status':status,'body':data}
   with sync_playwright() as playwright:
    opt={'headless':True,'args':['--no-sandbox','--disable-dev-shm-usage']}
    if shutil.which('chromium'):opt['executable_path']=shutil.which('chromium')
    browser=playwright.chromium.launch(**opt)
    context=browser.new_context(viewport={'width':1440,'height':900},reduced_motion='reduce')
    page=context.new_page();page.expose_function('cruzaBridge',bridge)
    page.on('pageerror',lambda x:js_errors.append(str(x)))
    page.set_content(html);page.wait_for_selector('#auth-user')
    page.screenshot(path=str(OUT/'00-login-desktop.png'))
    # Long password must not render dozens of vertical rows or be truncated.
    page.locator('#auth-pass').fill('x'*120)
    assert page.locator('#auth-pass').input_value()=='x'*120
    count=page.locator('[data-tiles="auth-pass"] .auth-tile').count()
    box=page.locator('[data-tiles="auth-pass"]').bounding_box()
    assert count<=14 and box['height']<100,(count,box)
    page.locator('#auth-pass').fill('CRUZA2026')
    page.locator('[data-action="password-visibility"]').click()
    assert page.locator('#auth-pass').get_attribute('type')=='text'
    page.locator('[data-action="password-visibility"]').click()
    assert page.locator('#auth-pass').get_attribute('type')=='password'
    def login(user,pwd):
     page.locator('#auth-user').fill(user);page.locator('#auth-pass').fill(pwd)
     page.locator('#login-button').click();page.wait_for_selector('.sidebar',timeout=14000)
    def logout():
     page.locator('.sidebar [data-action="logout"]').click();page.wait_for_selector('#auth-user')
    def check(role,key,width,height,theme):
     page.wait_for_selector('#content .page-heading',timeout=10000)
     data=page.evaluate('''() => { const width=window.innerWidth;return {page:state.page,role:state.user.role,scroll:document.documentElement.scrollWidth,
      width,subtitle:document.querySelector('.page-heading h1')?.innerText,
      missingControls:[...document.querySelectorAll('#content button')].filter(x=>!((x.getAttribute('aria-label')||x.textContent||'').trim())).length,
      badInputLabels:[...document.querySelectorAll('#content input, #content select, #content textarea')].filter(x=>!x.labels?.length&&!x.getAttribute('aria-label')&&!x.getAttribute('title')).map(x=>x.id||x.outerHTML.slice(0,90)),
      emptyButtons:[...document.querySelectorAll('button')].filter(x=>!((x.getAttribute('aria-label')||x.textContent||'').trim())).map(x=>x.outerHTML.slice(0,120))}}''')
     if data['scroll']>data['width']+3:
      offenders=page.evaluate("""() => [...document.querySelectorAll('*')].filter(el=>{
       const r=el.getBoundingClientRect();
       return r.right>innerWidth+2 && r.width>0 && getComputedStyle(el).visibility!=='hidden';
      }).slice(0,14).map(el=>({tag:el.tagName,cls:String(el.className||'').slice(0,75),
         right:Math.round(el.getBoundingClientRect().right),width:Math.round(el.getBoundingClientRect().width)}))""")
      issues.append({'type':'horizontal_overflow','role':role,'page':key,'width':width,
                     'extra':data['scroll']-data['width'],'elements':offenders})
     if data['badInputLabels']:issues.append({'type':'input_labels','role':role,'page':key,'inputs':data['badInputLabels'][:10]})
     if data['emptyButtons']:issues.append({'type':'empty_buttons','role':role,'page':key,'buttons':data['emptyButtons'][:10]})
     if not data['subtitle']:issues.append({'type':'empty_page','role':role,'page':key})
     controls_report.append({'role':role,'page':key,'viewport':f'{width}x{height}','theme':theme,'buttons':page.locator('#content button').count(),'inputs':page.locator('#content input').count(),'selects':page.locator('#content select').count(),'textareas':page.locator('#content textarea').count()})
     screenshot=f'{role}-{key}-{width}-{theme}.png';page.screenshot(path=str(OUT/screenshot),full_page=True)
     screens.append(screenshot);print('AUDIT',role,key,width,theme,flush=True)
    def route(key,width):
     if width<900:
      page.locator('[data-action="menu"]').click()
      assert page.locator('#sidebar').evaluate('(e)=>e.classList.contains("open")')
     page.locator(f'.sidebar [data-route="{key}"]').click()
     page.wait_for_function('key=>state.page===key',arg=key)
    for width,height,theme in [(1440,900,'light'),(390,844,'dark'),(768,1024,'light'),(1920,1080,'dark'),(1366,768,'light'),(1024,768,'dark'),(360,800,'light')]:
     page.set_viewport_size({'width':width,'height':height})
     if width==1440:
      login('ESTUDIANTE','CRUZA2026')
      # Hint toggle should be persistent and not overlay controls.
      assert page.locator('#hint').is_visible()
      page.locator('[data-action="toggle-hints"]').click();assert page.locator('#hint').is_hidden()
      page.locator('[data-action="toggle-hints"]').click();assert page.locator('#hint').is_visible()
     else:
      if page.evaluate('document.documentElement.dataset.theme')!=theme:
       page.locator('[data-action="theme"]').click()
      assert page.evaluate('document.documentElement.dataset.theme')==theme
     keys=[x[0] for x in page.evaluate('roleMenu.student')]
     for key in keys:
      route(key,width);check('student',key,width,height,theme)
      if key=='notas' and width==1440:
       page.locator('#simulate-cut-1').fill('4.5')
       page.locator('#simulate-cut-2').fill('3.0')
       page.locator('#simulate-grade').fill('5.0')
       assert page.locator('#simulate-result').inner_text()=='4,25',page.locator('#simulate-result').inner_text()
       page.locator('#simulate-cut-1').fill('')
       assert page.locator('#simulate-result').inner_text()=='—'
       page.locator('#simulate-cut-1').fill('4.5')
       page.locator('[data-action="sim-quick"][data-grade="4.5"]').click()
       assert page.locator('#simulate-result').inner_text()=='4,05'
      if key=='calendario' and width==1440:
       before=page.evaluate('state.calendarDate')
       page.locator('[data-action="cal-next-month"]').click()
       assert page.evaluate('state.calendarDate')!=before
       page.locator('[data-action="cal-prev-month"]').click()
     if width==360:
      page.set_viewport_size({'width':1440,'height':900});logout()
    # Teacher + admin in desktop and mobile. Each module is traversed and captured.
    for role,user,pwd in [('teacher','DOCENTE','CLASE2026'),('admin','ADMIN','ADMIN2026')]:
     page.set_viewport_size({'width':1440,'height':900});login(user,pwd)
     for width,height in [(1440,900),(390,844)]:
      page.set_viewport_size({'width':width,'height':height})
      for key in [x[0] for x in page.evaluate(f'roleMenu.{role}')]:
       route(key,width);check(role,key,width,height,page.evaluate('document.documentElement.dataset.theme'))
      if width==390:
       page.locator('[data-action="menu"]').click()
       page.keyboard.press('Escape')
       assert not page.locator('#sidebar').evaluate('(e)=>e.classList.contains("open")')
     page.set_viewport_size({'width':1440,'height':900});logout()
    assert not js_errors,js_errors
    assert not any(st>=500 for _,_,st in calls),[x for x in calls if x[2]>=500]
    (OUT/'reporte.json').write_text(json.dumps({'screens':screens,'issues':issues,'controls':controls_report,'requests':len(calls),'js_errors':js_errors},indent=2,ensure_ascii=False),encoding='utf8')
    browser.close()
   print('DONE',len(screens),'screens','issues',len(issues),'requests',len(calls),'JS errors',len(js_errors))
   for issue in issues:print('ISSUE',issue)
   return len(issues)
  finally:
   p.terminate()
   try:p.wait(timeout=5)
   except subprocess.TimeoutExpired:p.kill()
if __name__=='__main__':sys.exit(1 if audit() else 0)