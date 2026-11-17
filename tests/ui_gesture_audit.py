"""Comprueba los gestos de triángulo reales en una zona libre y el control accesible."""
from pathlib import Path
import re,shutil
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
html=(ROOT/'app/templates/index.html').read_text('utf8')
css=(ROOT/'app/static/app.css').read_text('utf8')
html,n=re.subn(r'<link\s+rel="stylesheet"\s+href="/static/app\.css[^"]*"\s*/?>',lambda _:'<style>'+css+'</style>',html);assert n==1
html,n=re.subn(r'<script\s+defer\s+src="/static/app\.js[^"]*"\s*>\s*</script>','',html);assert n==1
script=(ROOT/'app/static/app.js').read_text('utf8')
shim='''<script>const store={};Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem(k){return store[k]??null},setItem(k,v){store[k]=String(v)}}});window.fetch=async()=>new Response(JSON.stringify({user:null,csrf:null,period:'2026-2',demo:true}),{status:200,headers:{'Content-Type':'application/json'}});</script>'''
html=html.replace('</body>',shim+'<script>'+script+'</script></body>')
with sync_playwright() as pw:
 opts={'headless':True,'args':['--no-sandbox','--disable-dev-shm-usage']}
 if shutil.which('chromium'):opts['executable_path']=shutil.which('chromium')
 browser=pw.chromium.launch(**opts);page=browser.new_page(viewport={'width':1440,'height':900},reduced_motion='no-preference')
 errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.set_content(html);page.wait_for_selector('#auth-user')
 assert page.evaluate('state.ambientTool')=='brush'
 path=[(140+i*8,470) for i in range(21)]+[(300-i*4,470-i*8) for i in range(21)]+[(220-i*4,310+i*8) for i in range(21)]
 # exact last point should equal the first within tolerance
 path[-1]=(140,470)
 def draw():
  page.mouse.move(*path[0]);page.mouse.down()
  for x,y in path[1:]:page.mouse.move(x,y,steps=1)
  page.mouse.up()
 draw();state=page.evaluate('state.ambientTool')
 print('primer gesto',state)
 assert state=='pencil',state
 draw();state=page.evaluate('state.ambientTool')
 print('segundo gesto',state)
 assert state=='brush',state
 assert not errors,errors
 browser.close()
print('OK: pincel -> lápiz -> pincel mediante triángulos reales en área libre')