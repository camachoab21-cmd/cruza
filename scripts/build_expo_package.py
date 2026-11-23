"""Construye un ZIP portátil de CRUZA 3 para exposición, sin datos privados.

Uso: python scripts/build_expo_package.py
El paquete contiene el servidor FastAPI/SQLite, frontend y lanzadores de Windows.
No contiene bases SQLite, contraseñas de usuarios reales ni entornos virtuales.
"""
from __future__ import annotations

import os
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / "dist"
OUTPUT = DIST / "CRUZA3-EXPOSICION-24NOV.zip"
PREFIX = "CRUZA3-EXPOSICION"
ROOT_FILES = (
    "ABRIR-CRUZA.bat",
    "INICIAR-CRUZA.bat",
    "INSTALAR.bat",
    "requirements.txt",
    "README.md",
    "PRESENTAR-AHORA.md",
    "VER-RECORRIDO.html",
    "ARQUITECTURA.md",
    "REGLAS_NEGOCIO.md",
    "VERIFICACION.md",
)
INCLUDE_DIRECTORIES = ("app", "tests", "scripts")
DOCS = (
    "docs/EXPOSICION-24NOV-2026.md",
    "docs/DOMINIO-TK-DESPLIEGUE.md",
    "docs/CRUZA3-VISITA-GUIADA.mp4",
)
AUDIT_CAPTURES = (
    "00-login-desktop.png",
    "student-pensum-1440-light.png",
    "student-pensum-1920-dark.png",
    "admin-estudiantes-1440-light.png",
    "cruza3-nueva-interfaz-movil.png",
)
SKIP_DIRS = {
    ".git", ".venv", "__pycache__", ".pytest_cache", ".mypy_cache",
    "node_modules", "data", "dist", "respaldo", "auditoria",
}
SKIP_EXTENSIONS = {".sqlite", ".sqlite3", ".db", ".pyc", ".pyo", ".env"}
SKIP_NAMES = {".env", ".env.local", ".env.production", "secrets.json", "credentials.json"}
INSTRUCTIONS = """CRUZA 3 - RESPALDO PARA EXPOSICION
==================================
VERSION: EXPO 24.11 (FastAPI + SQLite)

1. Extraer el ZIP por completo en una NUEVA carpeta.
   No copiarlo encima de CRUZA-PUBLICACION sin hacer un respaldo.
2. Ejecutar ABRIR-CRUZA.bat con doble clic.
3. La primera ejecucion necesita Python 3.10+ e internet para dependencias.
4. Mantener la ventana abierta durante la exposicion.
5. Abrir http://127.0.0.1:8765/ si el navegador no se abre solo.
6. Si el puerto 8765 esta ocupado, detener la ventana anterior con Ctrl+C.
7. Leer docs/EXPOSICION-24NOV-2026.md para el recorrido y usuarios ficticios.

IMPORTANTE: Esta copia NO incluye la base de datos de tu instalacion anterior.
Al iniciar en modo demostracion con una base nueva se crean datos ficticios.
Tu base local original permanece intacta en la otra carpeta.

Si falla internet tras haber instalado las dependencias, CRUZA funciona
localmente. VER-RECORRIDO.html y docs/CRUZA3-VISITA-GUIADA.mp4 son
solo material de apoyo visual y no sustituyen las funciones reales.

Para uso publico en internet hay que desactivar el modo demostracion,
configurar HTTPS y alojamiento persistente. No publicar cuentas de prueba.
"""


def package_candidates():
    for relative in ROOT_FILES + DOCS:
        file = ROOT / relative
        if not file.is_file():
            raise FileNotFoundError(f"Requerido para exposición: {relative}")
        yield file, Path(relative)

    for dirname in INCLUDE_DIRECTORIES:
        folder = ROOT / dirname
        if not folder.is_dir():
            raise FileNotFoundError(f"Carpeta requerida: {dirname}")
        for file in sorted(folder.rglob("*")):
            if not file.is_file():
                continue
            relative = file.relative_to(ROOT)
            if set(relative.parts) & SKIP_DIRS:
                continue
            if file.name in SKIP_NAMES or file.suffix.lower() in SKIP_EXTENSIONS:
                continue
            yield file, relative

    for name in AUDIT_CAPTURES:
        image = ROOT / "docs" / "auditoria" / name
        if image.is_file():
            yield image, Path("EVIDENCIAS") / name


def main():
    DIST.mkdir(parents=True, exist_ok=True)
    entries = sorted({arc.as_posix(): file for file, arc in package_candidates()}.items())
    assert all(not path.lower().endswith((".sqlite", ".sqlite3", ".db", ".env")) for path, _ in entries)
    with ZipFile(OUTPUT, "w", compression=ZIP_DEFLATED, compresslevel=7) as out:
        out.writestr(PREFIX + "/LEER-PRIMERO.txt", INSTRUCTIONS)
        version = os.environ.get("GITHUB_SHA", "copia-local")
        out.writestr(PREFIX + "/VERSION-COMMIT.txt", version + "\n")
        for target, file in entries:
            out.write(file, f"{PREFIX}/{target}")
    print(f"Paquete listo: {OUTPUT} ({OUTPUT.stat().st_size:,} bytes, {len(entries)} archivos)")


if __name__ == "__main__":
    main()
