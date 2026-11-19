"""Smoke test of public CRUZA 3 visual preview. No backend or user data involved."""
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
OUTPUT=ROOT/'docs'/'auditoria'
OUTPUT.mkdir(parents=True,exist_ok=True)
uri=(ROOT/'index.html').resolve().as_uri()

with sync_playwright() as playwright:
    browser=playwright.chromium.launch(headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
    for width,height in [(1440,900),(768,1024),(390,844),(360,800)]:
        page=browser.new_page(viewport={'width':width,'height':height},reduced_motion='no-preference')
        errors=[]
        page.on('pageerror',lambda e:errors.append(str(e)))
        page.goto(uri,wait_until='load')
        assert 'CRUZA 3' in page.title()
        board=page.locator('#preview-board')
        assert board.locator('button.board-tile[data-path]').count()==23
        assert page.locator('.map-kicker').inner_text().strip()=='MAPA INTERACTIVO'
        assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+2'),f"Overflow horizontal a {width}px"
        page.get_by_role('button',name='MATRÍCULA').click()
        assert page.locator('#preview-title').inner_text()=='Las piezas encajan.'
        tile=board.locator('.board-tile[data-path]').first
        tile.hover()
        assert board.locator('.is-path').count()>0
        assert board.locator('.is-floor').count()>0
        # Verificar movimiento geométrico REAL, no solo las clases CSS.
        page.wait_for_timeout(1050)
        active=board.locator('.board-tile.is-path').first
        floor=board.locator('.board-tile.is-floor').first
        assert active.locator('.tile-face').count()==1
        assert page.locator('.map-pencil svg').count()==1, 'Falta el lápiz visible'
        ar=active.bounding_box();af=active.locator('.tile-face').bounding_box()
        fr=floor.bounding_box();ff=floor.locator('.tile-face').bounding_box()
        assert af['y']<ar['y']-4,(ar,af,'La ruta activa no se eleva')
        assert ff['y']>fr['y']+8,(fr,ff,'Las demás casillas no descienden')
        # El fondo debe generar trazos reales al mover el ratón sobre papel libre.
        stage=page.locator('.map-stage').bounding_box()
        y=stage['y']+stage['height']-28
        page.mouse.move(stage['x']+24,y)
        page.mouse.move(stage['x']+120,y-9,steps=20)
        page.wait_for_timeout(90)
        paint=page.evaluate('window.CruzaTools.debug()')
        assert paint['segments']>0 and paint['particles']>0,paint
        assert paint['insideMap'] and paint['width']>=65,paint
        assert paint['pencilHidden'] is True
        assert len(set(tuple(rgb) for rgb in paint['colors']))>1, 'El trazo sigue siendo de un solo color'
        tip=page.evaluate("""() => {
          const c=document.getElementById('cruza-art-cursor'),r=c.getBoundingClientRect(),p=CruzaTools.debug();
          return {dx:Math.abs(r.left+r.width/2-p.x),dy:Math.abs(r.top+r.height*.95-p.y)}
        }""")
        assert tip['dx']<2 and tip['dy']<2,tip
        page.locator('#preview-tool').click()
        assert page.evaluate('window.CruzaTools.getMode()')=='crayon'
        page.mouse.move(stage['x']+24,y)
        page.mouse.move(stage['x']+122,y-11,steps=25)
        if width==1440:
            page.wait_for_timeout(110)
            page.screenshot(path=str(OUTPUT/'cruza3-crayon-en-uso.png'),full_page=True)
        page.locator('#preview-tool').click()
        assert page.evaluate('window.CruzaTools.getMode()')=='pencil'
        page.mouse.move(3,3)
        page.wait_for_timeout(350)  # Espera a que termine la transición de escala de 240 ms
        outside=page.evaluate('window.CruzaTools.debug()')
        assert outside['width']<50 and outside['insideMap'] is False,outside
        # A shared crossword intersection must offer both routes on repeat clicks.
        crossing=board.locator('.board-tile[data-path*="|"]').first
        crossing.click()
        first=page.locator('#preview-title').inner_text()
        crossing.click()
        second=page.locator('#preview-title').inner_text()
        assert first!=second,(first,second,'Intersección sin alternativas')
        page.locator('#preview-theme').click()
        assert page.evaluate('document.documentElement.dataset.theme')=='dark'
        assert not errors,errors
        if width==1440:
            page.locator('#preview-theme').click()
            page.screenshot(path=str(OUTPUT/'cruza3-preview-escritorio.png'),full_page=True)
        if width==390:
            page.screenshot(path=str(OUTPUT/'cruza3-preview-movil.png'),full_page=True)
        page.close()
    reduced=browser.new_page(viewport={'width':1440,'height':900},reduced_motion='reduce')
    reduced.goto(uri,wait_until='load')
    rect=reduced.locator('.map-stage').bounding_box()
    reduced.mouse.move(rect['x']+28,rect['y']+rect['height']-45)
    assert reduced.evaluate('window.CruzaTools.debug().visible') is False
    reduced.close()
    browser.close()
print('OK: vista pública, pigmento multicolor, puntero alineado, crayón/lápiz, accesibilidad y móvil.')
