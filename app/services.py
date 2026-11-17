"""Validaciones y configuración compartidas; sin dependencias de interfaz."""
import json,re
from fastapi import HTTPException
from .db import one

def settings(c):
    row=one(c,"SELECT value FROM settings WHERE key='academic'")
    return json.loads(row['value']) if row else {'cut_weights':[30,30,40],'max_credits':18}

def validate_sessions(sessions):
    def bad():raise HTTPException(400,'Revisa las franjas: días válidos, horas entre 00:00 y 23:59 y sin cruces dentro del grupo.')
    if not isinstance(sessions,list) or not 1<=len(sessions)<=8:bad()
    for s in sessions:
        if not isinstance(s,dict) or s.get('day') not in ('Lun','Mar','Mie','Jue','Vie','Sab'):bad()
        for field in ('start','end'):
            if not isinstance(s.get(field),str) or not re.fullmatch(r'([01]\d|2[0-3]):[0-5]\d',s[field]):bad()
        if s['start']>=s['end']:bad()
    for i,a in enumerate(sessions):
        for b in sessions[i+1:]:
            if a['day']==b['day'] and a['start']<b['end'] and b['start']<a['end']:bad()
    return [{k:s[k] for k in ('day','start','end')} for s in sessions]

def email(value):
    if not isinstance(value,str) or len(value)>120 or (value and not re.fullmatch(r'[^\s@]+@[^\s@]+\.[^\s@]+',value)):
        raise HTTPException(400,'Escribe un correo válido o deja el campo vacío.')
    return value.strip()
