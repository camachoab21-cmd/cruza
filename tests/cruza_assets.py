"""Inyecta CSS y JS en las auditorías Playwright sin depender de URLs externas."""
from pathlib import Path
import re


def inline_tools(html: str, root: Path) -> str:
    for name in ('cruza-tools', 'cruza-ux'):
        css=(root/'app/static'/f'{name}.css').read_text(encoding='utf8')
        html,n_css=re.subn(
            rf'<link\s+rel="stylesheet"\s+href="/static/{name}\.css[^"]*"\s*/?>',
            lambda _:'<style>'+css+'</style>',html,count=1
        )
        assert n_css==1,f'Falta CSS {name} en la plantilla'

    for name in ('cruza-tools','cruza-ux'):
        html,n_js=re.subn(
            rf'<script\s+defer\s+src="/static/{name}\.js[^"]*"\s*>\s*</script>',
            '',html,count=1
        )
        assert n_js==1,f'Falta JS {name} en la plantilla'

    tools=(root/'app/static/cruza-tools.js').read_text(encoding='utf8')
    ux=(root/'app/static/cruza-ux.js').read_text(encoding='utf8')
    # El frontend principal se inyecta después de este bloque en las pruebas;
    # el código UX espera DOMContentLoaded para ejecutar después de app.js.
    return html.replace('</body>',
        '<script>'+tools+'</script>'+
        '<script>document.addEventListener("DOMContentLoaded",function(){'+ux+'});</script></body>')
