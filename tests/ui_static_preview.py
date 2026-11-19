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
        paint=page.evaluate('window.__cruzaPencilCheck()')
        assert paint['strokes']>0 and paint['grains']>0,paint
        page.locator('#preview-tool').click()
        assert page.evaluate('window.__cruzaPencilCheck().mode')=='brush'
        page.locator('#preview-tool').click()
        assert page.evaluate('window.__cruzaPencilCheck().mode')=='pencil'
        page.locator('#preview-theme').click()
        assert page.evaluate('document.documentElement.dataset.theme')=='dark'
        assert not errors,errors
        if width==1440:
            page.locator('#preview-theme').click()
            page.screenshot(path=str(OUTPUT/'cruza3-preview-escritorio.png'),full_page=True)
        if width==390:
            page.screenshot(path=str(OUTPUT/'cruza3-preview-movil.png'),full_page=True)
        page.close()
    browser.close()
print('OK: demo pública CRUZA 3, crucigrama, rutas, colores y 4 resoluciones.')
