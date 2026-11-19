"""Regresiones visuales críticas de CRUZA para la exposición.

No toca la base de datos; inspecciona CSS y JavaScript reales en Chromium.
"""
from pathlib import Path
import re
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
html = (ROOT / 'app/templates/index.html').read_text(encoding='utf8')
css = (ROOT / 'app/static/app.css').read_text(encoding='utf8')
javascript = (ROOT / 'app/static/app.js').read_text(encoding='utf8')
html, css_count = re.subn(r'<link\s+rel="stylesheet"\s+href="/static/app\.css[^"]*"\s*/?>', lambda _: '<style>' + css + '</style>', html)
html, js_count = re.subn(r'<script\s+defer\s+src="/static/app\.js[^"]*"\s*>\s*</script>', '', html)
assert css_count == js_count == 1, (css_count, js_count)
shim = """<script>
const storage={};
Object.defineProperty(window,'localStorage',{configurable:true,value:{
 getItem(k){return storage[k]??null},setItem(k,v){storage[k]=String(v)}
}});
window.fetch=async()=>new Response(JSON.stringify({user:null,csrf:null,demo:true}),{
 status:200,headers:{'Content-Type':'application/json'}
});
</script>"""
html = html.replace('</body>', shim + '<script>' + javascript + '</script></body>')

with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
    page = browser.new_page(viewport={'width':1440,'height':900},reduced_motion='no-preference')
    errors = []
    page.on('pageerror',lambda error:errors.append(str(error)))
    page.set_content(html)
    page.locator('#auth-user').wait_for()
    page.locator('#auth-user').fill('ABC')
    assert page.locator('[data-tiles="auth-user"] .auth-tile').count()==3
    assert page.locator('[data-tiles="auth-user"] .is-empty').count()==0
    page.locator('#auth-pass').fill('abc123')
    assert page.locator('[data-tiles="auth-pass"] .auth-tile').count()==6
    assert page.locator('[data-tiles="auth-pass"] .is-empty').count()==0
    page.locator('#toggle-pass').click()
    assert page.locator('#auth-pass').get_attribute('type')=='text'
    page.locator('#toggle-pass').click()
    assert page.locator('#auth-pass').get_attribute('type')=='password'
    # A flex card with hidden must actually disappear visually.
    assert page.evaluate("""() => {
      const el=document.createElement('article');el.className='card course-card';
      document.body.appendChild(el);el.hidden=true;
      const hidden=getComputedStyle(el).display==='none';el.remove();return hidden;
    }"""), 'La búsqueda deja tarjetas invisibles pero ocupando espacio'
    # Original crossword motion is restored for pointer and keyboard focus.
    page.evaluate("document.getElementById('app').innerHTML=crossword()")
    tile = page.locator('.board-tile[data-path]').first
    tile.hover()
    assert page.locator('.board-tile.is-path').count()>0
    assert page.locator('.board-tile.is-floor').count()>0
    page.mouse.move(1320,870)
    assert page.locator('.board-tile.is-path').count()==0
    tile.focus()
    assert page.locator('.board-tile.is-path').count()>0
    # Long usernames must scroll inside the field, not widen a mobile page.
    page.set_viewport_size({'width':390,'height':844})
    page.evaluate("renderLogin()")
    page.locator('#auth-user').fill('USUARIODELARGAPRUEBA1234567890')
    sizes=page.evaluate("""() => ({
      viewport:innerWidth, scroll:document.documentElement.scrollWidth,
      offenders:[...document.querySelectorAll('*')].filter(el=>el.getBoundingClientRect().right>innerWidth+2)
        .slice(0,12).map(el=>({tag:el.tagName,cls:el.className,scroll:el.scrollWidth,right:Math.round(el.getBoundingClientRect().right)}))
    })""")
    assert sizes['scroll'] <= sizes['viewport']+2, sizes
    assert not errors,errors
    browser.close()
print('OK: acceso sin huecos, animación original, filtros y móvil.')
