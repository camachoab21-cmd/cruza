"""Reglas académicas compartidas entre la API y las pruebas."""
from decimal import Decimal, ROUND_HALF_UP

CUT_WEIGHTS = {1: Decimal('0.30'), 2: Decimal('0.30'), 3: Decimal('0.40')}
PERIOD = '2026-2'
MAX_CREDITS = 18

def d(value):
    return Decimal(str(value))

def r2(value):
    return float(d(value).quantize(Decimal('.01'), rounding=ROUND_HALF_UP))

def weighted(values):
    """values: iterable (grade,weight); missing grade omitted; None if empty."""
    pairs = [(d(grade),d(weight)) for grade,weight in values if grade is not None]
    den = sum((w for _,w in pairs),Decimal(0))
    return r2(sum((x*w for x,w in pairs),Decimal(0))/den) if den else None

def time_conflicts(groups):
    """groups: {id,course_name, sessions:[{day,start,end}]}. End=start is not overlap."""
    issues=[]
    for i,g in enumerate(groups):
        for h in groups[i+1:]:
            if g['course_id']==h['course_id']:
                issues.append({'a':g['id'],'b':h['id'],'reason':'Materia duplicada'})
                continue
            for sa in g['sessions']:
                for sb in h['sessions']:
                    if sa['day']==sb['day'] and sa['start'] < sb['end'] and sb['start'] < sa['end']:
                        issues.append({'a':g['id'],'b':h['id'],'day':sa['day'],
                            'start':max(sa['start'],sb['start']),'end':min(sa['end'],sb['end']),
                            'reason':f"Cruce: {g['name']} y {h['name']}"})
    return issues

def grade_summary(evaluations):
    """List dicts {term,weight,grade}; null grades stay null, not zero."""
    byterm={}
    for t in CUT_WEIGHTS:
        subset=[e for e in evaluations if int(e['term'])==t]
        done=bool(subset) and all(e.get('grade') is not None for e in subset)
        provisional=weighted([(e.get('grade'),e['weight']) for e in subset])
        byterm[t]={'grade':provisional if done else None,'provisional':provisional,'complete':done}
    final=weighted([(byterm[t]['grade'],CUT_WEIGHTS[t]) for t in CUT_WEIGHTS]) if all(v['complete'] for v in byterm.values()) else None
    return {'cuts':byterm,'final':final,'complete':final is not None}

def period_average(attempts):
    """Only definitive scores; historical/period records can contain repeated course ids."""
    return weighted([(x['grade'],x['credits']) for x in attempts if x.get('grade') is not None])

def cumulative_average(attempts):
    """UTS reglamento 2021 Art 80: last attempt per course for accumulated average."""
    bycourse={}
    for item in sorted(attempts,key=lambda x:(x['period'],x.get('attempt',0))):
        if item.get('grade') is not None:
            bycourse[item['course_id']]=item
    return period_average(bycourse.values())
