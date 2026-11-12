from app.logic import weighted,grade_summary,period_average,cumulative_average,time_conflicts

def test_weights_and_empty():
    assert weighted([(4.0,3),(5.0,2)])==4.4
    assert weighted([(None,2)]) is None
    assert weighted([]) is None

def test_cut_partial_is_not_zero():
    e=[{'term':1,'weight':50,'grade':4.5},{'term':1,'weight':50,'grade':None},
       {'term':2,'weight':100,'grade':4.0},{'term':3,'weight':100,'grade':4.2}]
    result=grade_summary(e)
    assert result['cuts'][1]['grade'] is None
    assert result['cuts'][1]['provisional']==4.5
    assert result['final'] is None

def test_final_grade():
    e=[{'term':1,'weight':100,'grade':4.5},{'term':2,'weight':100,'grade':4},
       {'term':3,'weight':100,'grade':4.1}]
    assert grade_summary(e)['final']==4.19

def test_papa_last_attempt():
    a=[{'course_id':1,'period':'2025-1','grade':2.0,'credits':3,'attempt':1},
       {'course_id':1,'period':'2025-2','grade':4.0,'credits':3,'attempt':2},
       {'course_id':2,'period':'2025-2','grade':5.0,'credits':2,'attempt':1}]
    assert period_average(a)==3.5
    assert cumulative_average(a)==4.4

def test_time_overlap_and_adjacent():
    g=[{'id':1,'course_id':1,'name':'Web','sessions':[{'day':'Lun','start':'08:00','end':'10:00'}]},
       {'id':2,'course_id':2,'name':'Matemáticas','sessions':[{'day':'Lun','start':'10:00','end':'12:00'}]}]
    assert not time_conflicts(g)
    g[1]['sessions'][0]['start']='09:00'
    assert len(time_conflicts(g))==1
