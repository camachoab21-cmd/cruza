"""Regresión de accesibilidad, zoom y casillas del login para CRUZA 3."""
from pathlib import Path
from playwright.sync_api import sync_playwright
from cruza_assets import inline_tools
import re, shutil

ROOT=Path(__file__).resolve().parents[1]
OUTPUT=ROOT/'docs'/'auditoria'
OUTPUT.mkdir(parents=True,exist_ok=True)
html=inline_tools((ROOT/'app/templates/index.html').read_text('utf8'),ROOT)
css=(ROOT/'app/static/app.css').read_text('utf8')
html,n=re.subn(r'<link\s+rel="stylesheet"\s+href="/static/app\.css[^"]*"\s*/?>',
                lambda _: '<style>'+css+'</style>',html)
assert n==1
html,n=re.subn(r'<script\s+defer\s+src="/static/app\.js[^"]*"\s*>\s*</script>', '',html)
assert n==1
script=(ROOT/'app/static/app.js').read_text('utf8')
shim='''<script>const store={};Object.defineProperty(window,"localStorage",{configurable:true,value:{
  getItem(k){return store[k]??null},setItem(k,v){store[k]=String(v)}}});
  window.fetch=async()=>new Response(JSON.stringify({user:null,csrf:null,period:"2026-2",demo:true}),
   {status:200,headers:{"Content-Type":"application/json"}});</script>'''
html=html.replace('</body>',shim+'<script>'+script+'</script></body>')
with sync_playwright() as pw:
    opts={'headless':True,'args':['--no-sandbox','--disable-dev-shm-usage']}
    if shutil.which('chromium'):opts['executable_path']=shutil.which('chromium')
    browser=pw.chromium.launch(**opts)
    for width,height in [(1440,900),(390,844)]:
        page=browser.new_page(viewport={'width':width,'height':height},reduced_motion='no-preference')
        errors=[]
        page.on('pageerror',lambda e: errors.append(str(e)))
        page.set_content(html)
        page.wait_for_selector('#auth-user')
        page.wait_for_function("Boolean(window.CruzaUX)")
        user=page.locator('#auth-user')
        user.fill('E')
        page.evaluate("window.firstTile=document.querySelector('[data-tiles=\"auth-user\"] .auth-tile')")
        user.fill('EDWIN')
        assert page.evaluate("firstTile===document.querySelector('[data-tiles=\"auth-user\"] .auth-tile')"),'La casilla se reconstruye al escribir'
        assert page.locator('[data-tiles="auth-user"] .auth-tile').count()==5
        user.fill('X'*120)
        assert page.locator('[data-tiles="auth-user"] .auth-tile').count()==14
        assert page.locator('[data-tiles="auth-user"]').bounding_box()['height']<90
        user.fill('')
        assert page.locator('[data-tiles="auth-user"] .auth-tile').count()==1
        password=page.locator('#auth-pass')
        password.fill('PRUEBA123')
        assert 'PRUEBA123' not in page.locator('[data-tiles="auth-pass"]').inner_text()
        page.locator('[data-action="password-visibility"]').click()
        assert 'P' in page.locator('[data-tiles="auth-pass"]').inner_text()
        # Un shell académico mínimo prueba controles comunes sin alterar datos.
        page.evaluate("""() => {
          state.user={role:'student',username:'ESTUDIANTE',full_name:'Estudiante de prueba'};
          state.page='tablero';state.data={summary:{period_label:'2026-2'}};
          window.pageContent=()=>'<section class="card"><button data-action="route" data-route="inscripcion">Matrícula</button></section>';
          render();
        }""")
        page.wait_for_selector('[data-font-trigger]')
        page.locator('[data-font-trigger]').click()
        assert page.locator('[data-font-menu]').is_visible()
        page.locator('[data-font-choice="1.12"]').click()
        assert abs(page.evaluate('CruzaUX.debug().scale')-1.12)<.001
        page.evaluate('render()')
        page.wait_for_selector('[data-font-trigger]')
        assert abs(page.evaluate('CruzaUX.debug().scale')-1.12)<.001
        page.locator('#content [data-route="inscripcion"]').hover()
        assert 'grupos' in page.locator('#hint').inner_text().lower() or 'matrícula' in page.locator('#hint').inner_text().lower()
        page.mouse.move(0,0)
        assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+3'),f'Desbordamiento a {width}px'
        first_theme=page.evaluate('document.documentElement.dataset.theme')
        if width==1440:
            page.screenshot(path=str(OUTPUT/'cruza3-nueva-interfaz-claro-o-tema-inicial.png'),full_page=True)
        page.locator('[data-action="theme"]').click()
        second_theme=page.evaluate('document.documentElement.dataset.theme')
        assert first_theme!=second_theme,(first_theme,second_theme)
        if width==1440:
            page.screenshot(path=str(OUTPUT/'cruza3-nueva-interfaz-tema-alternativo.png'),full_page=True)
        if width==390:
            page.screenshot(path=str(OUTPUT/'cruza3-nueva-interfaz-movil.png'),full_page=True)
        assert not errors,errors
        page.close()
    browser.close()
print('OK: casillas persistentes, contraseña protegida, A-/A/A+, pista contextual y responsive')
