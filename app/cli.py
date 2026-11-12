"""Operaciones locales de emergencia. Ejecutar en consola con acceso al servidor."""
import argparse,getpass,secrets
from .db import init_db,tx,one,hash_pwd,utc,audit

def main():
    p=argparse.ArgumentParser(description='Operaciones locales de administración CRUZA')
    sub=p.add_subparsers(dest='command',required=True)
    a=sub.add_parser('init-admin',help='Crear el primer administrador, sin valores por defecto')
    a.add_argument('--username',default='ADMIN')
    r=sub.add_parser('recover-admin',help='Recuperación de emergencia del administrador por operador del servidor')
    r.add_argument('--username',default='ADMIN')
    args=p.parse_args();init_db(seed=False)
    if args.command=='init-admin':
        with tx() as c:
            if one(c,"SELECT id FROM users WHERE role='admin' LIMIT 1"):
                raise SystemExit('Ya existe un administrador. No se creó otra cuenta.')
        name=input('Nombre del responsable: ').strip() or 'Administración'
        password=getpass.getpass('Contraseña segura (mínimo 12 caracteres): ')
        if len(password)<12:raise SystemExit('La contraseña debe tener al menos 12 caracteres.')
        with tx() as c:
            c.execute('INSERT INTO users(username,full_name,email,password_hash,role,status,created_at) VALUES(?,?,?,?,?,?,?)',
                (args.username.upper(),name,'',hash_pwd(password),'admin','active',utc()))
            audit(c,None,'ADMIN_INICIAL_CREADO',args.username.upper(),'Operación local')
        print('Administrador inicial creado.')
    if args.command=='recover-admin':
        print('AVISO: use esto solo como operador con control físico o administrativo del servidor.')
        confirm=input('Escriba RECUPERAR para continuar: ')
        if confirm!='RECUPERAR':raise SystemExit('Cancelado.')
        secret=secrets.token_urlsafe(24)
        with tx() as c:
            admin=one(c,"SELECT * FROM users WHERE username=? AND role='admin'",(args.username.upper(),))
            if not admin:raise SystemExit('Administrador no encontrado.')
            c.execute('UPDATE users SET password_hash=?,status=?,failed=0 WHERE id=?',(hash_pwd(secret),'active',admin['id']))
            c.execute('DELETE FROM sessions WHERE user_id=?',(admin['id'],))
            audit(c,None,'ADMIN_RECUPERADO_POR_OPERADOR',str(admin['id']),'Operación CLI; contraseña no registrada')
        print('Contraseña temporal de un solo reporte (guárdela y cámbiela tras entrar):')
        print(secret)

if __name__=='__main__':main()
