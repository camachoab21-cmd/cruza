"""Inyecta los recursos visuales compartidos en tests que usan page.set_content()."""
from pathlib import Path
import re


def inline_tools(html: str, root: Path) -> str:
    css=(root/'app/static/cruza-tools.css').read_text(encoding='utf8')
    js=(root/'app/static/cruza-tools.js').read_text(encoding='utf8')
    html,n_css=re.subn(
        r'<link\s+rel="stylesheet"\s+href="/static/cruza-tools\.css[^"]*"\s*/?>',
        lambda _:'<style>'+css+'</style>',html,count=1
    )
    html,n_js=re.subn(
        r'<script\s+defer\s+src="/static/cruza-tools\.js[^"]*"\s*>\s*</script>',
        '',html,count=1
    )
    assert (n_css,n_js)==(1,1),'Faltan enlaces de lápiz/crayón en la plantilla'
    # Se inserta justo antes de body; las pruebas colocan el frontend principal
    # después, conservando el orden de ejecución de la aplicación real.
    return html.replace('</body>','<script>'+js+'</script></body>')
