"""Arranque local con comprobación de disponibilidad antes de abrir el navegador."""
import argparse, json, os, subprocess, sys, time, urllib.request, webbrowser
from pathlib import Path

ROOT=Path(__file__).resolve().parent
URL='http://127.0.0.1:8765'

def ready():
    try:
        with urllib.request.urlopen(URL+'/api/health',timeout=1) as response:
            return json.load(response).get('application')=='CRUZA'
    except Exception:return False

def main():
    parser=argparse.ArgumentParser(description='Abrir CRUZA local')
    parser.add_argument('--no-browser',action='store_true')
    parser.add_argument('--check',action='store_true')
    args=parser.parse_args()
    if args.check:
        print('CRUZA disponible' if ready() else 'CRUZA detenido');return 0 if ready() else 1
    if ready():
        print('CRUZA ya está abierto: '+URL)
        if not args.no_browser:webbrowser.open(URL)
        return 0
    env={**os.environ,'CRUZA_DEMO_MODE':'1','CRUZA_DB_PATH':str(ROOT/'data'/'cruza.sqlite3'),'CRUZA_HTTPS':'0'}
    server=subprocess.Popen([sys.executable,'-m','uvicorn','app.main:app','--host','127.0.0.1','--port','8765'],cwd=ROOT,env=env,creationflags=getattr(subprocess,'CREATE_NO_WINDOW',0))
    try:
        for _ in range(100):
            if server.poll() is not None:raise RuntimeError('No se pudo iniciar. Revisa si otra aplicación ocupa el puerto 8765.')
            if ready():break
            time.sleep(.2)
        else:raise RuntimeError('El servidor tardó demasiado en responder.')
        print('\nCRUZA está listo: '+URL+'\nDeja esta ventana abierta durante la presentación. Ctrl+C para cerrar.\n',flush=True)
        if not args.no_browser:webbrowser.open(URL)
        server.wait()
    except KeyboardInterrupt:print('\nCerrando CRUZA…')
    except Exception as exc:print(str(exc));return 1
    finally:
        if server.poll() is None:server.terminate();server.wait(timeout=10)
    return 0

if __name__=='__main__':raise SystemExit(main())
