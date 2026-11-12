'use strict';
/* CRUZA 3.0 — interfaz sin dependencias externas. Toda operación académica pasa por la API. */
const root=document.getElementById('app');
const state={user:null,csrf:null,data:null,page:'tablero',busy:false,loginShow:false,
  draftMobile:'materias',filterText:'',filterType:'',filterSemester:'',calendarDate:'2026-11-11',
  agendaDone:false,teacherGroup:null,editReminder:null,courseSim:{},roleNavigation:false,
  ambientTool:'brush',ambientEnabled:true,loginUser:'',loginPass:''};
const roleMenu={student:[['tablero','Mi tablero'],['pensum','Pensum'],['inscripcion','Inscripción'],
 ['horario','Horario'],['calendario','Calendario'],['agenda','Mi agenda'],['notas','Notas'],
 ['asistencia','Asistencia'],['historial','Historial'],['perfil','Perfil']],
 teacher:[['notas','Notas'],['asistencia','Asistencia']],
 admin:[['estudiantes','Estudiantes'],['recuperacion','Recuperación'],['catalogo','Catálogo'],['auditoria','Auditoría']]};
const roleNames={student:'Estudiante',teacher:'Docente',admin:'Administrador'};
const shortDay=['Lun','Mar','Mie','Jue','Vie','Sab'];
const escapeHtml=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const number=v=>v===null||v===undefined?'—':Number(v).toFixed(2).replace('.',',');
const notify=(message,kind='info')=>{
  const el=document.createElement('div');el.className='toast';el.textContent=message;
  document.getElementById('toast-region').append(el);setTimeout(()=>el.remove(),4600);
};
async function api(path,method='GET',body=null){
 const options={method,credentials:'same-origin',headers:{}};
 if(method!=='GET' && state.csrf)options.headers['X-CSRF-Token']=state.csrf;
 if(body!==null){options.headers['Content-Type']='application/json';options.body=JSON.stringify(body)}
 let r;
 try{r=await fetch('/api'+path,options)}catch{throw Error('No hay conexión con el servidor local. Revisa que esté ejecutándose.')}
 let value;
 try{value=await r.json()}catch{throw Error('El servidor respondió con un formato inesperado.')}
 if(!r.ok){if(r.status===401 && state.user){state.user=null;state.data=null;state.csrf=null;renderLogin()}
   throw Error(value.error||'No se pudo completar la acción.');}
 return value;
}
function labelTag(text,variant=''){return `<span class="pill ${variant}">${escapeHtml(text)}</span>`}
function brand(){return `<span class="brand"><span class="brand-mark" aria-hidden="true"><i></i><i></i><i></i><i></i></span><span>cruza.<small class="brand-sub">CAMPUS ACADÉMICO</small></span></span>`}
function head(num,name,description,actions=''){
 return `<div class="page-heading"><div><div class="eyebrow">PISTA ${num} / CAMPUS · ${escapeHtml(state.data?.summary?.period_label||'2026-2')}</div><h1>${name}</h1><p>${description}</p></div>${actions?`<div class="actions">${actions}</div>`:''}</div>`;
}
function stat(name,value,note,variant=''){return `<article class="card stat ${variant}"><span class="eyebrow">${name}</span><strong>${value}</strong><small>${note}</small></article>`}
function btn(title,action,cls='btn-ghost',attrs=''){return `<button type="button" class="${cls}" data-action="${action}" ${attrs}>${title}</button>`}
function tagCat(x){return x==='Obligatoria'?'lime':x==='Optativa'?'purple':'peach'}
function linkRoute(t,r,cls='btn-ghost'){return btn(t,'route',cls,`data-route="${r}"`)}
function sessionForm(){return `<form id="login-form" class="auth-form-card" autocomplete="on">
 <div class="eyebrow">ACCESO 01 · IDENTIDAD Y CONEXIONES</div>
 <h2>Inicia tu <em>recorrido.</em></h2>
 <p class="muted small">Usuario y contraseña en piezas de crucigrama. Tu perfil define los módulos disponibles.</p>
 ${authField('auth-user','Usuario','username','ESTUDIANTE','text')}
 ${authField('auth-pass','Contraseña','current-password','CRUZA2026','password')}
 <div id="auth-error" role="alert" class="auth-error"></div>
 <button class="btn-primary btn-wide" id="login-button" type="submit">Entrar al campus <span aria-hidden="true">↗</span></button>
 <div class="actions between"><button type="button" class="btn-ghost btn-mini" data-action="demo-info">Credenciales de demostración</button>
 <button type="button" class="btn-ghost btn-mini" data-action="recover">Restablecer contraseña</button></div>
 <p class="tiny muted" style="margin-bottom:0">Prototipo académico independiente · Datos ficticios · No oficial</p>
 </form>`;
}
function authField(id,title,autocomplete,placeholder,type){
 let extra=type==='password'?btn('◉ Mostrar','password-visibility','btn-mini',`id="toggle-pass"`):'';
 return `<div class="auth-field"><div class="between"><label for="${id}">${title}</label>${extra}</div>
 <div class="tile-container" data-hint="${title}: escribe normalmente; las piezas acompañan cada carácter.">
 <div class="auth-tiles" data-tiles="${id}" aria-hidden="true">${Array.from({length:10},(_,i)=>`<span class="auth-tile" style="--i:${i}"></span>`).join('')}</div>
 <input id="${id}" class="tile-input" type="${type}" name="${id}" autocomplete="${autocomplete}" aria-label="${title}" autocapitalize="${type==='text'?'characters':'off'}" maxlength="${type==='password'?128:60}" spellcheck="false" required placeholder="${placeholder}">
 </div></div>`;
}
function particles(){return `<div class="auth-stars" aria-hidden="true">${Array.from({length:14},(_,i)=>`<i style="--i:${i};--x:${(i*29+11)%100}%;--y:${(i*17+7)%94}%"></i>`).join('')}</div>`}
function renderLogin(){state.page='login';document.body.classList.remove('sidebar-open');
 root.innerHTML=`<div class="auth-scene">${particles()}<div class="auth-star"></div>
 <section class="auth-art canvas-grid">${brand()}<div class="auth-copy"><div class="eyebrow">PROYECTO ACADÉMICO · UTS</div><h1>CRUZA<span style="color:var(--lime)">.</span></h1>
 <p>Cada materia, una palabra. Cada semestre, una nueva conexión.</p>
 <div class="auth-hero-tiles"><div class="stair-grid">${'CRUZA'.split('').map((s,i)=>`<span style="--i:${i}">${s}</span>`).join('')}</div></div></div>
 <div class="eyebrow">ESTUDIAR · CONECTAR · DESCUBRIR</div></section>
 <section class="auth-form-area">${sessionForm()}</section></div>`;
 for(const id of ['auth-user','auth-pass']){
   const e=document.getElementById(id);e.addEventListener('input',()=>tileRefresh(id));e.addEventListener('focus',()=>tileRefresh(id));
   e.addEventListener('blur',()=>tileRefresh(id));e.addEventListener('click',()=>tileRefresh(id));
   e.addEventListener('keyup',()=>tileRefresh(id));tileRefresh(id);
 }
 document.getElementById('login-form').addEventListener('submit',loginSubmit);
}
function tileRefresh(id){const input=document.getElementById(id),tileRoot=document.querySelector(`[data-tiles="${id}"]`);
 if(!input||!tileRoot)return;const text=input.value;
 // El campo real acepta claves largas, mientras las piezas muestran una ventana desplazable.
 const n=Math.max(10,Math.min(20,text.length+1));const offset=text.length>n?text.length-(n-1):0;
 if(tileRoot.children.length!==n)tileRoot.innerHTML=Array.from({length:n},(_,i)=>`<span class="auth-tile" style="--i:${Math.min(i,8)}"></span>`).join('');
 for(let i=0;i<n;i++){
  const tile=tileRoot.children[i],index=offset?offset+i-1:i,ellipsis=offset>0&&i===0;
  tile.textContent=ellipsis?'…':index<text.length?(id==='auth-pass'&&input.type==='password'?'●':text[index].toUpperCase()):'';
  tile.classList.toggle('filled',ellipsis||index<text.length);
  const caret=input.selectionStart??text.length;
  tile.classList.toggle('focused',document.activeElement===input&&(ellipsis?caret<offset:Math.min(caret,text.length)===index));
 }
}
async function loginSubmit(e){e.preventDefault();if(state.busy)return;
 const username=document.getElementById('auth-user').value,password=document.getElementById('auth-pass').value;
 if(!username||!password)return;
 state.busy=true;const b=document.getElementById('login-button');b.disabled=true;b.textContent='Verificando las conexiones…';
 try{const result=await api('/login','POST',{username,password});
   state.user=result.user;state.csrf=result.csrf;document.querySelector('.auth-scene').classList.add('success');
   document.querySelectorAll('.auth-tile.filled').forEach((t,i)=>{t.classList.add('pop');t.style.animationDelay=(i*30)+'ms'});
   // short success animation; prevent arbitrary timeout failures if reduced motion.
   if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches)await new Promise(r=>setTimeout(r,520));
   state.page=roleMenu[state.user.role][0][0];await reloadData();notify('Bienvenido a CRUZA. Tu sesión está activa.');
 }catch(err){const el=document.getElementById('auth-error');if(el)el.textContent=err.message;
   document.querySelectorAll('.auth-tile.filled').forEach(t=>t.classList.add('fail'));
 }finally{state.busy=false;const button=document.getElementById('login-button');if(button){button.disabled=false;button.textContent='Entrar al campus ↗'}}
}
async function boot(){try{const data=await api('/session');state.user=data.user;state.csrf=data.csrf;
  if(state.user){state.page=roleMenu[state.user.role][0][0];await reloadData()}else renderLogin();
 }catch(err){root.innerHTML=`<div class="card" style="margin:12vh auto;max-width:600px"><h1>Sin conexión</h1><p>${escapeHtml(err.message)}</p>
 <button onclick="location.reload()">Reintentar</button></div>`}}
async function reloadData(){if(!state.user){renderLogin();return;}
 state.data=await api(state.user.role==='student'?'/student':state.user.role==='teacher'?'/teacher':'/admin');render();}
function sideBar(){const menu=roleMenu[state.user.role];return `<aside class="sidebar" id="sidebar">${brand()}<div>
 <div class="eyebrow" style="margin:0 0 14px">${escapeHtml(roleNames[state.user.role])} / SECCIONES</div><nav aria-label="Secciones del campus">
 ${menu.map(([key,text],i)=>`<button class="navbtn ${state.page===key?'active':''}" data-action="route" data-route="${key}" aria-current="${state.page===key?'page':'false'}">
 <span class="mon">${String(i+1).padStart(2,'0')}</span><span>${text}</span></button>`).join('')}</nav></div>
 <div class="sidebar-foot"><div class="eyebrow">TU IDENTIDAD</div><strong>${escapeHtml(state.user.full_name)}</strong>
 <div class="tiny muted">${escapeHtml(state.user.username)} · Datos ficticios</div>
 ${btn('Cerrar sesión','logout','btn-mini btn-wide','style="margin-top:13px"')}</div></aside>`}
function shell(){const title=roleMenu[state.user.role].find(([id])=>id===state.page)?.[1]||'Mi tablero';
 return `<div class="shell">${sideBar()}<main class="workspace"><header class="topbar">
 <div class="row-left">${btn('☰ Menú','menu','btn-mini mobile-menu', 'aria-expanded="false" aria-controls="sidebar"')}
 <strong class="name">${escapeHtml(title)}</strong><span class="pill">PERÍODO 2026-2</span></div>
 <div class="controls">${btn('☀ / ☾','theme','btn-mini','aria-label="Alternar modo día y noche"')}
 ${btn('✎ / 🖌','tool','btn-mini','title="Alternar lápiz y pincel"')}
 ${btn('Pistas','toggle-hints','btn-mini')}
 </div></header><div id="content" class="page">${pageContent()}</div>
 <footer class="small muted" style="margin-top:42px;border-top:1px solid var(--line);padding-top:18px">CRUZA · Prototipo independiente, no oficial · Datos ficticios · ${escapeHtml(roleNames[state.user.role])}</footer>
 </main></div>`}
function pageContent(){switch(state.user.role){
 case 'student':return ({tablero:dashboard,pensum:curriculum,inscripcion:enrollment,horario:schedule,calendario:calendar,
     agenda:agendaPage,notas:gradesPage,asistencia:studentAttendance,historial:historyPage,perfil:profilePage})[state.page]?.()||dashboard();
 case 'teacher':return state.page==='asistencia'?attendancePage():teacherNotes();
 case 'admin':return ({estudiantes:adminUsers,recuperacion:adminRecovery,catalogo:adminCatalogue,auditoria:adminAudit})[state.page]?.()||adminUsers();
 }}
function render(){if(!state.user){renderLogin();return;}
 if(!roleMenu[state.user.role].some(([r])=>r===state.page))state.page=roleMenu[state.user.role][0][0];
 root.innerHTML=shell();
 const hint=document.getElementById('hint');hint.textContent=hintFor(state.page);
 if(state.page==='tablero')requestAnimationFrame(mountPowder);
 if(state.page==='inscripcion')requestAnimationFrame(mountPowder);
}
function navigate(to){if(!state.user)return;if(!roleMenu[state.user.role].some(([r])=>r===to)){notify('No tienes permisos para entrar en este módulo.');return;}
 state.page=to;state.roleNavigation=false;render();window.scrollTo({top:0,behavior:'instant'});
}
const hints={tablero:'Tablero: cada palabra es una ruta de tu vida académica.',pensum:'Pensum: identifica las materias obligatorias, optativas y de libre elección.',
 inscripcion:'Inscripción: compara tu borrador con el horario vigente antes de confirmar.',horario:'Horario: consulta las clases que ya están confirmadas.',
 calendario:'Calendario: rojo es atrasado, naranja pendiente y verde entregado.',agenda:'Mi agenda: tus recordatorios personales no alteran las entregas académicas.',
 notas:'Notas: las calificaciones pendientes no cuentan como cero.',historial:'Historial: para el promedio acumulado se toma el último intento de cada materia.',
 perfil:'Perfil: tus datos académicos y tu identidad.',asistencia:'Asistencia: consulta tus registros o registra asistencia en los grupos autorizados.',
 estudiantes:'Estudiantes: el administrador crea, aprueba y desactiva cuentas.',recuperacion:'Recuperación: restablecer no desbloquea una cuenta automáticamente.',
 catalogo:'Catálogo: cada materia define créditos enteros y sus grupos ofrecidos.',auditoria:'Auditoría: registro de cambios importantes en la aplicación.'};
function hintFor(page){return hints[page]||'Pista: selecciona un módulo.'}
function crossword(){const grid=new Map(),words=[
 {name:'MATRICULA',row:4,col:0,vertical:false,route:'inscripcion'},
 {name:'HORARIO',row:1,col:1,vertical:true,route:'horario'},
 {name:'NOTAS',row:2,col:0,vertical:false,route:'notas'},
 {name:'PENSUM',row:0,col:6,vertical:true,route:'pensum'}];
 for(const w of words)for(let i=0;i<w.name.length;i++){
   const row=w.row+(w.vertical?i:0),col=w.col+(w.vertical?0:i),key=`${row}-${col}`;
   let cell=grid.get(key)||{letter:w.name[i],routes:[]};cell.routes.push(w.route);grid.set(key,cell)}
 return `<section class="card board canvas-grid"><div><div class="eyebrow">CRUCIGRAMA / RUTAS ACADÉMICAS</div>
 <h2>Todo <em>conecta.</em></h2><p class="small muted">Selecciona una palabra para revelar su módulo. En las intersecciones puedes elegir el camino.</p>
 <div class="board-tiles" role="group" aria-label="Crucigrama de navegación">
 ${Array.from({length:81},(_,i)=>{const r=Math.floor(i/9),c=i%9,cell=grid.get(`${r}-${c}`);
  return cell?`<button type="button" class="board-tile" data-action="word" data-path="${cell.routes.join('|')}" data-hint="Casilla ${cell.letter}: ${cell.routes.join(', ')}" aria-label="Letra ${cell.letter}; ${cell.routes.join(' o ')}">${cell.letter}</button>`:'<span class="board-tile void" aria-hidden="true"></span>'}).join('')}</div></div>
 <div class="board-clues"><span class="eyebrow">PALABRAS</span>${words.map((w,i)=>linkRoute(`${String(i+1).padStart(2,'0')} ${w.name}`,w.route,'btn-mini')).join('')}</div><canvas id="powder" aria-hidden="true" style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:0"></canvas></section>`}
function dashboard(){const d=state.data;const courses=d.draft.confirmed;const next=courses[0];
 return head('01','Tu semestre. <em>Todas las piezas.</em>',`Hola, ${escapeHtml(state.user.full_name)}. Cruza cada palabra para encontrar el siguiente paso.`,linkRoute('Inscribir materias ↗','inscripcion','btn-primary'))+
 `<div class="grid-2"><div>${crossword()}</div><section class="card" data-hint="Tus datos se actualizan al confirmar cambios reales.">
 <div class="eyebrow">ESTADO ACTUAL</div><h2>Una palabra a la vez.</h2>
 <p class="muted">Las conexiones también se construyen con pequeños avances.</p>
 <div class="list"><div class="item"><strong>Próxima clase</strong><span>${next?escapeHtml(next.name):'Sin materias'}</span></div>
 <div class="item"><strong>Materias vigentes</strong><span>${courses.length}</span></div>
 <div class="item"><strong>Agenda</strong><span>${d.agenda.filter(x=>!x.done).length} pendientes</span></div></div>
 <div class="actions">${linkRoute('Abrir horario ↗','horario','btn-lime')}${linkRoute('Ver agenda','agenda')}</div></section></div>
 <div class="stats">${stat('CRÉDITOS INSCRITOS',d.summary.credits_current,'Créditos enteros')}
 ${stat('PAPA (ACUMULADO)',number(d.summary.papa),'Promedio ponderado acumulado','purple')}
 ${stat('PAPI (PERÍODO)',number(d.summary.papi),'Solo notas definitivas disponibles','peach')}</div>`;
}
function curriculum(){const d=state.data;const offered=new Set(d.groups.map(x=>x.course_id));const sems=[...new Set(d.courses.map(x=>x.semester))];
 return head('02','El plan de <em>tus piezas.</em>','Pensum ficticio del programa de Desarrollo de Software. Los créditos son enteros.',linkRoute('Ir a Inscripción →','inscripcion','btn-primary'))+
 `<div class="semester-grid">${sems.map(s=>`<section class="card"><div class="eyebrow">SEMESTRE ${String(s).padStart(2,'0')}</div>
 <h2>Ruta <em>${s}.</em></h2><div class="list">${d.courses.filter(c=>c.semester===s).map(c=>`<div class="item"><div>
 <div class="mon muted">${escapeHtml(c.code)} · ${c.credits} créditos</div><strong>${escapeHtml(c.name)}</strong>
 <div class="actions">${labelTag(c.category,tagCat(c.category))}${!offered.has(c.id)?labelTag('Sin grupos en 2026-2','pill-muted'):''}</div></div>
 ${offered.has(c.id)?btn('Localizar ↗','find-course','btn-mini',`data-course-id="${c.id}"`):''}</div>`).join('')}</div></section>`).join('')}</div>`;
}
function conflictsFor(groups){const out=[];for(let i=0;i<groups.length;i++)for(let j=i+1;j<groups.length;j++)for(const a of groups[i].sessions)for(const b of groups[j].sessions){
 if(a.day===b.day&&a.start<b.end&&b.start<a.end)out.push({a:groups[i].id,b:groups[j].id,day:a.day,start:a.start>b.start?a.start:b.start});}return out;}
function timeGrid(groups,confirmed=[],compact=false){const all=[...groups,...confirmed.filter(x=>!groups.some(g=>g.course_id===x.course_id))];
 const issues=conflictsFor(groups);const conflictIds=new Set(issues.flatMap(x=>[x.a,x.b]));const currentIds=new Set(confirmed.map(x=>x.group_id||x.id));
 const rows=['08:00','10:00','12:00','14:00','16:00','18:00'];
 let html='<div class="table-scroll"><table class="schedule-table"><thead><tr><th>HORA</th>'+
 shortDay.slice(0,5).map(day=>`<th>${day}</th>`).join('')+'</tr></thead><tbody>';
 for(const hour of rows){html+=`<tr><th>${hour}</th>`;for(const day of shortDay.slice(0,5)){
 const events=all.filter(g=>g.sessions.some(s=>s.day===day&&s.start<=hour&&s.end>hour));
 html+=`<td>${events.map(g=>{
  const inNew=groups.includes(g),old=confirmed.some(x=>x.course_id===g.course_id&&(x.group_id||x.id)===g.id);
  const type=inNew?(old?'':'add'):'remove';
  return `<div class="class-block ${type} ${inNew&&conflictIds.has(g.id)?'conflict':''}">
   <strong>${escapeHtml(g.name)}</strong><span>${escapeHtml(g.code)} · ${escapeHtml(g.room)}</span>
   <span>${escapeHtml(g.sessions.find(s=>s.day===day&&s.start<=hour&&s.end>hour)?.start||'')}</span></div>`}).join('')}</td>`}
 html+='</tr>'}
 html+='</tbody></table></div>';return html;
}
function enrollment(){const d=state.data,selected=d.draft.selected;let courses=d.courses;
 const filtered=courses.filter(c=>[c.name,c.code].some(t=>t.toLowerCase().includes(state.filterText.toLowerCase()))
 &&(!state.filterType||c.category===state.filterType)&&(!state.filterSemester||String(c.semester)===state.filterSemester));
 const current=new Set(d.draft.group_ids);
 const badges=`${labelTag('BORRADOR','purple')} ${labelTag(`${d.draft.credits} / 18 créditos`,'lime')}`;
 const errors=d.draft.problems.map(p=>`<div class="notice danger">${escapeHtml(p.reason)}${p.day?' · '+p.day+' '+p.start:''}</div>`).join('');
 const menu=`<div class="card" style="margin-bottom:16px"><div class="form-grid"><div class="field"><label for="course-search">Buscar materias</label>
 <input id="course-search" value="${escapeHtml(state.filterText)}" placeholder="Nombre o código" data-hint="Busca en el catálogo del período."></div>
 <div class="field"><label for="course-filter">Tipo de materia</label><select id="course-filter"><option value="">Todas</option>
 ${['Obligatoria','Optativa','Libre elección'].map(t=>`<option ${state.filterType===t?'selected':''}>${t}</option>`).join('')}</select></div>
 <div class="field"><label for="semester-filter">Semestre</label><select id="semester-filter"><option value="">Todos</option>
 ${[1,2,3,4].map(t=>`<option value="${t}" ${state.filterSemester==t?'selected':''}>${t}</option>`).join('')}</select></div></div></div>`;
 const cards=filtered.map(c=>{
 const gs=d.groups.filter(x=>x.course_id===c.id);const chosen=gs.find(g=>current.has(g.id));
 return `<article class="card course-card" id="course-${c.id}"><div class="course-head"><div><div class="eyebrow">${escapeHtml(c.code)} / SEMESTRE ${c.semester}</div>
 <h3>${escapeHtml(c.name)}</h3></div>${labelTag(`${c.credits} créditos`,'lime')}</div>
 <div class="row-left">${labelTag(c.category,tagCat(c.category))}${chosen?labelTag('En borrador','ok'):''}</div>
 ${gs.length?`<div class="field"><label for="grp-${c.id}">Grupo, docente y franjas</label><select id="grp-${c.id}" data-course-id="${c.id}">
 ${gs.map(g=>`<option value="${g.id}" ${chosen?.id===g.id?'selected':''}>${g.code} · ${g.teacher||'Sin docente'} · ${g.sessions.map(s=>`${s.day} ${s.start}-${s.end}`).join(' / ')}</option>`).join('')}</select></div>
 <div class="small muted">${escapeHtml(gs.map(g=>g.room).join(', '))} · Cupos sujetos a confirmación</div>
 <div class="actions">${chosen?btn('Retirar del borrador','toggle-course','btn-mini btn-danger',`data-course-id="${c.id}"`):
 btn('Añadir al borrador +','toggle-course','btn-lime btn-mini',`data-course-id="${c.id}"`)}</div>`:
 `<div class="notice">No se ofrecen grupos para esta materia durante 2026-2.</div>`}</article>`}).join('');
 const old=d.draft.confirmed.map(x=>({...x,id:x.group_id,code:x.group_code}));
 return head('03','Inscripción. <em>Las piezas encajan.</em>','El borrador se actualiza al elegir o cambiar grupos. El horario vigente no cambia hasta confirmar.',
 linkRoute('Ver Pensum ↗','pensum'))+
 `<div class="between" style="margin-bottom:15px"><div class="row-left">${badges}</div><div class="actions">${btn('Descartar borrador','discard','btn-mini')}${btn('Confirmar matrícula ↗','confirm-enroll','btn-primary',`${d.draft.problems.length?'disabled title="Resuelve los conflictos"':''}`)}</div></div>
 ${errors?`<div class="list" style="margin-bottom:18px">${errors}</div>`:''}
 <div class="actions" style="margin-bottom:13px">${btn('Materias','mobile-draft-tab','btn-mini',`data-draft-tab="materias"`)}
 ${btn('Vista previa','mobile-draft-tab','btn-mini',`data-draft-tab="vista"`)}</div>
 <div class="enrollment-layout"><section id="draft-materias">${menu}<div class="courses">${cards||'<div class="notice">No se encontraron materias.</div>'}</div></section>
 <aside class="card preview" id="draft-vista"><div class="card-head"><div><div class="eyebrow">CUADRÍCULA PROVISIONAL</div><h2>Vista <em>previa.</em></h2></div>${labelTag('Borrador','purple')}</div>
 ${timeGrid(selected,old,true)}<p class="small muted">Lavanda: vigente · Lima: agregado · Albaricoque: retiro · Borde rojo: choque.</p>
 <div class="notice">${selected.length} materias · ${d.draft.credits} créditos enteros · El servidor vuelve a validar al confirmar.</div></aside></div>`;
}
function schedule(){const arr=state.data.draft.confirmed.map(x=>({...x,id:x.group_id,code:x.group_code}));
 return head('04','Tu semana, <em>resuelta.</em>','Este horario contiene solamente asignaturas confirmadas.',
 `<a href="/api/student/schedule.csv" class="btn btn-primary">Descargar CSV ↧</a>`)+
 `<div class="card"><div class="eyebrow">HORARIO VIGENTE / ${escapeHtml(state.data.summary.period_label)}</div>
 ${arr.length?timeGrid(arr):'<div class="notice">No tienes matrícula confirmada.</div>'}</div>`;
}
function calendar(){const acts=state.data.activities;const today=state.calendarDate||'2026-11-11';
 const yr=Number(today.slice(0,4)),month=Number(today.slice(5,7));const first=new Date(yr,month-1,1),days=new Date(yr,month,0).getDate();
 const lead=(first.getDay()+6)%7;
 const fmt=n=>`${yr}-${String(month).padStart(2,'0')}-${String(n).padStart(2,'0')}`;
 let cells=shortDay.slice(0,5).concat(['Sab','Dom']).map(day=>`<div class="eyebrow" style="text-align:center">${day}</div>`).join('');
 for(let i=0;i<lead;i++)cells+='<span></span>';
 for(let n=1;n<=days;n++){
 const iso=fmt(n),items=acts.filter(a=>a.due_date===iso);const statuses=items.map(x=>x.state);
 const status=statuses.includes('atrasada')?'overdue':statuses.includes('pendiente')?'pending':statuses.includes('entregada')?'done':'';
 cells+=`<button type="button" class="cal-day ${status?'corner-'+status:''} ${today===iso?'selected':''}" data-action="calendar-day" data-day="${iso}" aria-label="${iso}; ${status||'sin actividades'}">${n}
 ${items.length?`<span class="cal-label">${items.length} act.</span>`:''}</button>`;
 }
 const list=acts.filter(a=>a.due_date===today);
 return head('05','Calendario. <em>Cada fecha importa.</em>','Diagonal roja: atrasada; naranja: pendiente; verde: todas entregadas.',linkRoute('Abrir Mi agenda →','agenda'))+
 `<div class="grid-2"><section class="card"><div class="between"><h2>${first.toLocaleDateString('es-CO',{month:'long',year:'numeric'})}</h2>${btn('Mes de noviembre 2026','demo-month','btn-mini')}</div>
 <div class="calendar">${cells}</div><div class="notice" style="margin-top:15px">Fecha de referencia real: ${new Date().toLocaleDateString('es-CO')}. Datos académicos de demostración.</div></section>
 <section class="card"><div class="eyebrow">ACTIVIDADES DEL DÍA</div><h2>${escapeHtml(today)}</h2>
 ${list.length?list.map(a=>`<div class="item"><div><strong>${escapeHtml(a.title)}</strong><div class="small muted">${escapeHtml(a.course)} · ${escapeHtml(a.state)}</div></div>
 <div class="actions">${btn(a.completed?'Marcar pendiente':'Marcar entregada','activity-toggle','btn-mini',`data-activity-id="${a.id}" data-done="${a.completed?'false':'true'}"`)}</div></div>`).join(''):'<div class="notice">No hay entregas registradas para este día.</div>'}
 ${btn('Añadir a Mi agenda +','agenda-preset','btn-lime btn-mini',`data-day="${today}"`)}</section></div>`;
}
function agendaPage(){const all=state.data.agenda;const list=all.filter(x=>state.agendaDone?x.done:!x.done);
 return head('06','Mi agenda. <em>Tu propia ruta.</em>','Los recordatorios personales no modifican las entregas académicas.',btn('Nueva tarea o recordatorio +','agenda-new','btn-primary'))+
 `<div class="card"><div class="actions" style="margin-top:0;margin-bottom:12px">${btn('Próximos','agenda-toggle-done','btn-mini',`data-done="false"`)}
 ${btn('Completados','agenda-toggle-done','btn-mini',`data-done="true"`)}</div>
 ${list.length?list.map(x=>`<div class="agenda-entry ${x.done?'done':''}"><div><div class="mon">${escapeHtml(x.due_date)} ${escapeHtml(x.due_time||'')}</div>
 <h3>${escapeHtml(x.title)}</h3><p class="small muted" style="margin:0">${escapeHtml(x.description||'')} · ${x.source==='personal'?'Personal':'Académica'}</p></div>
 <div class="actions">${btn('Editar','agenda-edit','btn-mini',`data-agenda-id="${x.id}"`)}
 ${btn(x.done?'Reabrir':'Completar','agenda-complete','btn-mini',`data-agenda-id="${x.id}" data-done="${x.done?'false':'true'}"`)}
 ${btn('Eliminar','agenda-delete','btn-mini btn-danger',`data-agenda-id="${x.id}"`)}</div></div>`).join(''):
 '<div class="notice">Aquí todavía no hay recordatorios. Crea uno desde el botón superior.</div>'}</div>`;
}
function gradesPage(){const d=state.data;const all=d.grades;
 return head('07','Notas. <em>El esfuerzo toma forma.</em>','Promedios por corte, por materia y ponderados por créditos; nunca convertir una nota pendiente en cero.')+
 `<div class="stats">${stat('PAPA · ACUMULADO',number(d.summary.papa),'Histórico + finales del período')}
 ${stat('PAPI · PERÍODO',number(d.summary.papi),'Solo materias con nota definitiva','purple')}
 ${stat('CRÉDITOS CURSADOS',d.summary.credits_hist,'Créditos de historial','peach')}</div>
 <div class="courses">${all.map(c=>`<article class="card"><div class="eyebrow">${escapeHtml(c.code)} · ${c.credits} CRÉDITOS</div><h2>${escapeHtml(c.name)}</h2>
 ${[1,2,3].map(t=>`<div class="item"><div><strong>Corte ${t}</strong><div class="small muted">${c.evaluations.filter(e=>e.term===t).map(e=>`${escapeHtml(e.name)}: ${e.grade===null?'Pendiente':number(e.grade)}`).join(' · ')}</div></div>
 ${labelTag(c.summary.cuts[t].complete?number(c.summary.cuts[t].grade):'Pendiente',c.summary.cuts[t].complete?'lime':'pill-muted')}</div>`).join('')}
 <div class="between" style="margin-top:15px"><span class="eyebrow">DEFINITIVA</span><span class="grade-val">${number(c.summary.final)}</span></div></article>`).join('')}</div>
 <section class="card" style="margin-top:20px"><h2>Simulador <em>de notas.</em></h2><p class="muted small">Calcula una estimación de un corte sin modificar las notas del docente.</p>
 <div class="form-grid"><div><label for="simulate-course">Materia</label><select id="simulate-course">${all.map(c=>`<option value="${c.course_id}">${escapeHtml(c.name)}</option>`).join('')}</select></div>
 <div><label for="simulate-grade">Nota hipotética de un corte (0–5)</label><input type="number" min="0" max="5" step=".1" id="simulate-grade" value="4.5"></div></div>
 <div class="notice" style="margin-top:12px" id="simulate-result">La simulación es una estimación, nunca un cambio oficial.</div>
 ${btn('Calcular estimación','simulate','btn-lime btn-mini')}</section>
 <div class="notice" style="margin-top:16px">PAPI = ∑(nota definitiva × créditos) / ∑créditos del período con nota definitiva. PAPA = acumulado usando el último intento de cada materia. Si faltan definitivas, el resultado es provisional o no disponible.</div>`;
}
function studentAttendance(){const rows=state.data.attendance||[];
 return head('08','Asistencia. <em>Presente en cada clase.</em>','Consulta los registros que el docente ha guardado; aquí no se pueden modificar.')+
 `<section class="card"><div class="eyebrow">HISTORIAL DE ASISTENCIA</div><h2>Tu registro <em>académico.</em></h2>
 ${rows.length?`<div class="table-scroll"><table class="table"><thead><tr><th>Fecha</th><th>Materia y grupo</th><th>Estado</th></tr></thead><tbody>
 ${rows.map(x=>`<tr><td>${escapeHtml(x.day)}</td><td><strong>${escapeHtml(x.course)}</strong> · ${escapeHtml(x.group_code)}</td>
 <td>${labelTag(x.present?'Presente':'Ausente',x.present?'ok':'danger')}</td></tr>`).join('')}</tbody></table></div>`:
 '<div class="notice">Todavía no hay registros de asistencia para tus materias.</div>'}</section>`;
}
function historyPage(){const d=state.data,rows=d.summary.history;
 return head('08','Historial. <em>Lo aprendido permanece.</em>','Conservamos los créditos y calificaciones ya cursados. Repetir una materia solo deja el último intento en el promedio acumulado.')+
 `<div class="stats">${stat('PAPA',number(d.summary.papa),'Acumulado ponderado por créditos','purple')}
 ${stat('CRÉDITOS APROBADOS',d.summary.credits_approved,'Historial + definitivas aprobadas','lime')}
 ${stat('PUNTOS PONDERADOS',number(d.summary.weighted_points),'Suma nota × créditos')}</div>
 <div class="card"><div class="table-scroll"><table class="table"><thead><tr><th>Período</th><th>Materia</th><th>Créditos</th><th>Definitiva</th></tr></thead><tbody>
 ${rows.map(r=>`<tr><td>${escapeHtml(r.period)}</td><td>${escapeHtml(r.name)}<div class="tiny muted">${escapeHtml(r.code)}</div></td>
 <td>${r.credits}</td><td><span class="grade-val">${number(r.grade)}</span></td></tr>`).join('')}</tbody></table></div></div>`;
}
function profilePage(){const u=state.data.profile;
 return head('09','Perfil. <em>Tu identidad académica.</em>','Información ficticia de demostración; el estudiante no puede crear cuentas nuevas.')+
 `<div class="grid-2"><section class="card"><div class="eyebrow">CARNÉ ACADÉMICO</div><h2>${escapeHtml(u.full_name)}</h2>
 <div class="stair-grid" aria-hidden="true">${'CRUZA'.split('').map(c=>`<span>${c}</span>`).join('')}</div>
 <div class="item"><strong>Usuario</strong><span>${escapeHtml(u.username)}</span></div><div class="item"><strong>Correo ficticio</strong><span>${escapeHtml(u.email)}</span></div>
 <div class="item"><strong>Rol</strong><span>Estudiante</span></div></section>
 <section class="card"><h2>Tu acceso <em>es personal.</em></h2><p>La administración crea, aprueba, habilita y desactiva cuentas. El estudiante puede solicitar el restablecimiento de su contraseña.</p>
 <div class="notice">Nunca compartas contraseñas reales. Las credenciales de demostración deben cambiarse antes de un despliegue público.</div></section></div>`;
}
function teacherNotes(){const gs=state.data.groups;const choice=state.teacherGroup||gs[0]?.id;
 state.teacherGroup=choice;
 const group=gs.find(x=>x.id===choice);
 return head('D1','Calificaciones. <em>Una evaluación a la vez.</em>','Docencia: solo se muestran tus grupos y tus estudiantes matriculados.')+
 `<section class="card"><div class="between"><div><div class="eyebrow">MIS GRUPOS</div><h2>Control <em>de notas.</em></h2></div>
 <div class="field"><label for="teacher-group">Selecciona grupo</label><select id="teacher-group" data-hint="Selecciona uno de tus grupos asignados.">
 ${gs.map(g=>`<option value="${g.id}" ${choice===g.id?'selected':''}>${escapeHtml(g.name)} · ${escapeHtml(g.code)}</option>`).join('')}</select></div></div>
 ${group?`<div class="notice">${escapeHtml(group.name)} · ${escapeHtml(group.room)} · ${group.students.length} estudiantes</div>
 ${group.students.length?group.students.map(student=>`<div class="teach-student"><div class="between"><div><strong>${escapeHtml(student.full_name)}</strong><div class="mon muted">${escapeHtml(student.username)}</div></div>
 ${labelTag(student.summary.complete?`Definitiva ${number(student.summary.final)}`:'Evaluaciones pendientes',student.summary.complete?'lime':'pill-muted')}</div>
 <div class="field" style="margin-top:12px"><label for="reason-${student.id}">Motivo si corriges una nota publicada</label>
 <input id="reason-${student.id}" placeholder="Ej.: ajuste tras revisión de evaluación" maxlength="130" data-hint="Motivo obligatorio cuando cambias una nota que ya estaba guardada."></div>
 <div class="grade-editor" style="margin-top:12px">${student.evaluations.map(x=>`<div class="grade-edit"><div class="mon">CORTE ${x.term} · ${escapeHtml(x.name)}</div>
 <div class="between"><input id="grade-${student.id}-${x.id}" aria-label="Nota para ${escapeHtml(student.full_name)} - ${escapeHtml(x.name)} corte ${x.term}" type="number" min="0" max="5" step=".1" value="${x.grade===null?'':x.grade}" placeholder="Pendiente">
 ${btn('Guardar','save-grade','btn-mini btn-lime',`data-student-id="${student.id}" data-eval-id="${x.id}"`)}</div></div>`).join('')}</div></div>`).join(''):'<div class="notice">Este grupo no tiene estudiantes matriculados.</div>'}`:'<div class="notice">No tienes grupos asignados.</div>'}</section>`;
}
function attendancePage(){const gs=state.data.groups,choice=state.teacherGroup||gs[0]?.id;state.teacherGroup=choice;
 const group=gs.find(g=>g.id===choice);
 const today=new Date().toISOString().slice(0,10);
 return head('D2','Asistencia. <em>Presente en cada clase.</em>','Registra asistencias exclusivamente en tus grupos y con fecha específica.')+
 `<section class="card"><div class="form-grid"><div class="field"><label for="attendance-group">Grupo asignado</label><select id="attendance-group">
 ${gs.map(g=>`<option value="${g.id}" ${choice===g.id?'selected':''}>${escapeHtml(g.name)} · ${escapeHtml(g.code)}</option>`).join('')}</select></div>
 <div class="field"><label for="attendance-date">Fecha de clase</label><input id="attendance-date" type="date" value="${today}"></div></div>
 ${group?group.students.map(s=>`<div class="item"><div><strong>${escapeHtml(s.full_name)}</strong><div class="small muted">${escapeHtml(s.username)}</div>
 <div class="tiny muted">Últimas: ${s.attendance.slice(0,3).map(a=>`${a.day} ${a.present?'✓':'✕'}`).join(' / ')||'Sin registros'}</div></div>
 <div class="row-left">${btn('Presente ✓','attendance','btn-mini btn-lime',`data-student-id="${s.id}" data-present="true"`)}
 ${btn('Ausente ✕','attendance','btn-mini btn-danger',`data-student-id="${s.id}" data-present="false"`)}</div></div>`).join(''):'<div class="notice">No tienes grupo seleccionado.</div>'}
 </section>`;
}
function adminUsers(){const d=state.data;
 return head('A1','Administración. <em>Las personas detrás de las piezas.</em>','Las cuentas de estudiantes son creadas internamente y necesitan aprobación.',btn('Crear estudiante +','student-new','btn-primary'))+
 `<div class="stats">${stat('ESTUDIANTES ACTIVOS',d.users.filter(u=>u.role==='student'&&u.status==='active').length,'Cuentas habilitadas','lime')}
 ${stat('PENDIENTES',d.users.filter(u=>u.role==='student'&&u.status==='pending').length,'Por aprobar','purple')}
 ${stat('BLOQUEADOS',d.users.filter(u=>u.status==='locked').length,'Requieren recuperación','peach')}</div>
 <section class="card"><h2>Directorio <em>de acceso.</em></h2><div class="table-scroll"><table class="table"><thead>
 <tr><th>Usuario</th><th>Rol</th><th>Estado</th><th>Intentos</th><th>Acciones</th></tr></thead><tbody>
 ${d.users.map(u=>`<tr><td><strong>${escapeHtml(u.full_name)}</strong><div class="mon muted">${escapeHtml(u.username)}</div></td>
 <td>${escapeHtml(roleNames[u.role])}</td><td>${labelTag(u.status,u.status==='active'?'ok':u.status==='locked'?'danger':'pill-muted')}</td>
 <td>${u.failed}</td><td><div class="row-left">
 ${u.status==='pending'?btn('Aprobar','user-status','btn-mini btn-lime',`data-id="${u.id}" data-status="active"`):''}
 ${u.status==='reset_pending'?btn('Habilitar','user-status','btn-mini btn-lime',`data-id="${u.id}" data-status="active"`):''}
 ${u.status==='active'&&u.role!=='admin'?btn('Desactivar','user-status','btn-mini btn-danger',`data-id="${u.id}" data-status="disabled"`):''}
 ${u.status==='disabled'?btn('Reactivar','user-status','btn-mini',`data-id="${u.id}" data-status="active"`):''}
 ${u.status==='locked'?'<span class="tiny muted">Solicitar recuperación</span>':''}
 </div></td></tr>`).join('')}</tbody></table></div></section>`;
}
function adminRecovery(){const requests=state.data.recovery;
 return head('A2','Recuperación. <em>La seguridad también cuenta.</em>','El cuarto intento bloquea la cuenta. Recuperar la contraseña no la habilita automáticamente.')+
 `<section class="card"><h2>Solicitudes <em>de recuperación.</em></h2>
 <div class="notice">Antes de emitir un código, verifica la identidad por un procedimiento externo. No se envían correos desde esta demo.</div>
 ${requests.length?requests.map(r=>`<div class="item"><div><strong>${escapeHtml(r.full_name)}</strong>
 <div class="mon muted">${escapeHtml(r.username)} · ${escapeHtml(r.created_at)}</div>
 ${labelTag(r.status,r.status==='requested'?'peach':r.status==='used'?'lime':'pill-muted')}
 </div>${r.status==='requested'?btn('Emitir código una vez','issue-recovery','btn-mini btn-lime',`data-id="${r.id}"`):''}</div>`).join(''):
 '<div class="notice">Aún no hay solicitudes de recuperación.</div>'}</section>`;
}
function adminCatalogue(){const d=state.data;
 return head('A3','Catálogo. <em>Construye el mapa.</em>','Gestiona materias, créditos enteros, grupos y franjas.',
 btn('Nueva materia +','course-new','btn-primary')+btn('Nuevo grupo +','group-new','btn-lime'))+
 `<div class="grid-2"><section class="card"><h2>Materias <em>del plan.</em></h2>
 <div class="list">${d.courses.map(c=>`<div class="item"><div><div class="mon muted">${escapeHtml(c.code)} · Sem ${c.semester}</div>
 <strong>${escapeHtml(c.name)}</strong></div><div class="row-left">${labelTag(`${c.credits} créditos`,'lime')}${labelTag(c.category,tagCat(c.category))}</div></div>`).join('')}</div></section>
 <section class="card"><h2>Grupos <em>ofertados.</em></h2><div class="list">${d.groups.map(g=>`<div class="item"><div><div class="mon muted">${escapeHtml(g.course_code)} / GRUPO ${escapeHtml(g.code)}</div><strong>${escapeHtml(g.name)}</strong>
 <div class="small muted">${escapeHtml(g.teacher||'Sin docente')} · ${escapeHtml(g.room)} · ${g.capacity} cupos</div>
 <div class="tiny">${g.sessions.map(s=>`${s.day} ${s.start}–${s.end}`).join(' · ')}</div></div></div>`).join('')}</div></section></div>`;
}
function adminAudit(){const rows=state.data.audit;
 return head('A4','Auditoría. <em>Cada cambio deja una pista.</em>','Historial de eventos sensibles, sin registrar contraseñas ni códigos de recuperación.')+
 `<div class="card"><div class="table-scroll"><table class="table"><thead><tr><th>Momento UTC</th><th>Responsable</th><th>Acción</th><th>Detalle</th></tr></thead><tbody>
 ${rows.map(a=>`<tr><td>${escapeHtml(a.when_at)}</td><td>${escapeHtml(a.actor||'Sistema')}</td><td>${escapeHtml(a.event)}</td><td class="tiny">${escapeHtml(a.details)}</td></tr>`).join('')}</tbody></table></div></div>`;
}
// Modals and safe escaping. All data from users appears only via textContent or escapeHtml.
let lastFocus=null;
function modal(title,html){lastFocus=document.activeElement;
 document.querySelector('.overlay')?.remove();
 const overlay=document.createElement('div');overlay.className='overlay';
 overlay.innerHTML=`<section class="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
 <div class="between"><h2 id="dialog-title">${escapeHtml(title)}</h2>${btn('✕','modal-close','btn-mini','aria-label="Cerrar ventana"')}</div>${html}</section>`;
 document.body.append(overlay);overlay.querySelector('input,button,select,textarea')?.focus();
}
function modalClose(){document.querySelector('.overlay')?.remove();if(lastFocus?.isConnected)lastFocus.focus();}
function modalConfirm(text,onConfirm){modal('Confirmar la acción',`<p>${escapeHtml(text)}</p>
 <div class="actions">${btn('Cancelar','modal-close','btn-ghost')}${btn('Sí, continuar','modal-confirm','btn-danger')}</div>`);
 state.pendingConfirm=onConfirm;
}
function infoDemo(){modal('Credenciales de demostración',`<p>Esta aplicación funciona con usuarios ficticios. Ninguno es una cuenta real de UTS.</p>
 <div class="item"><strong>Estudiante</strong><span class="mon">ESTUDIANTE / CRUZA2026</span></div>
 <div class="item"><strong>Docente</strong><span class="mon">DOCENTE / CLASE2026</span></div>
 <div class="item"><strong>Administrador</strong><span class="mon">ADMIN / ADMIN2026</span></div>
 <div class="notice">Estudiante PENDIENTE / CRUZA2026: cuenta creada pero sin aprobación. Úsala para demostrar el bloqueo de acceso.</div>
 <p class="small muted">Contraseñas solo válidas para este entorno local de pruebas; nunca usar estos datos en producción.</p>`)}
function modalRecovery(){modal('Recuperar acceso',`<p>Si tu cuenta está bloqueada, solicita un código. Administración verifica tu identidad, entrega un código temporal y finalmente habilita la cuenta después del cambio de contraseña.</p>
 <form id="request-recovery-form"><div class="field"><label for="recover-user">Usuario</label><input id="recover-user" name="username" required maxlength="40" autocomplete="username"></div>
 <div class="actions"><button class="btn-primary" type="submit">Solicitar recuperación</button></div></form>
 <hr class="divider"><form id="redeem-form"><div class="form-grid"><div class="field"><label for="redeem-user">Usuario</label><input id="redeem-user" name="username" required></div>
 <div class="field"><label for="redeem-code">Código temporal</label><input id="redeem-code" name="code" required autocomplete="off"></div>
 <div class="field full"><label for="redeem-pass">Nueva contraseña (10 caracteres mínimo)</label><input id="redeem-pass" name="new_password" type="password" minlength="10" required autocomplete="new-password"></div></div>
 <div class="actions"><button class="btn-lime" type="submit">Restablecer contraseña</button></div></form>`)}
function modalAgenda(id=null,preset=null){const x=id!==null?state.data.agenda.find(y=>y.id===Number(id)):null;
 state.editReminder=x?.id??null;
 const init=x||{title:preset?.title||'',due_date:preset?.due_date||new Date().toISOString().slice(0,10),due_time:'',description:preset?.description||'',course_id:null};
 modal(x?'Editar recordatorio':'Nueva tarea o recordatorio',`<form id="agenda-form"><div class="form-grid">
 <div class="field full"><label for="ag-title">Título</label><input id="ag-title" name="title" required maxlength="100" value="${escapeHtml(init.title)}"></div>
 <div class="field"><label for="ag-date">Fecha</label><input id="ag-date" name="due_date" type="date" required value="${escapeHtml(init.due_date)}"></div>
 <div class="field"><label for="ag-time">Hora opcional</label><input id="ag-time" name="due_time" type="time" value="${escapeHtml(init.due_time)}"></div>
 <div class="field full"><label for="ag-course">Materia opcional</label><select id="ag-course" name="course_id"><option value="">Personal</option>
 ${state.data.courses.map(c=>`<option value="${c.id}" ${init.course_id===c.id?'selected':''}>${escapeHtml(c.name)}</option>`).join('')}</select></div>
 <div class="field full"><label for="ag-desc">Descripción</label><textarea id="ag-desc" name="description" maxlength="500">${escapeHtml(init.description)}</textarea></div></div>
 <div class="actions"><button type="submit" class="btn-primary">Guardar recordatorio</button>${btn('Cancelar','modal-close')}</div></form>`)}
function modalStudent(){modal('Crear estudiante',`<p>Solo Administración puede crear cuentas. La cuenta comienza pendiente hasta su aprobación.</p>
 <form id="create-student-form"><div class="form-grid">
 <div class="field"><label>Nombre completo</label><input name="full_name" required minlength="2"></div>
 <div class="field"><label>Usuario institucional ficticio</label><input name="username" required minlength="4" autocomplete="off"></div>
 <div class="field"><label>Correo de ejemplo (opcional)</label><input name="email" type="email"></div>
 <div class="field"><label>Contraseña temporal</label><input name="password" type="password" minlength="10" required autocomplete="new-password"></div></div>
 <div class="actions"><button class="btn-primary" type="submit">Crear cuenta pendiente</button></div></form>`)}
function modalCourse(){modal('Nueva materia',`<form id="create-course-form"><div class="form-grid">
 <div class="field"><label>Código</label><input name="code" placeholder="DSI-501" required></div>
 <div class="field"><label>Nombre</label><input name="name" required></div>
 <div class="field"><label>Semestre</label><input name="semester" type="number" min="1" max="14" value="3" required></div>
 <div class="field"><label>Créditos enteros</label><input name="credits" type="number" min="1" max="8" step="1" value="3" required></div>
 <div class="field full"><label>Tipo</label><select name="category"><option>Obligatoria</option><option>Optativa</option><option>Libre elección</option></select></div></div>
 <div class="actions"><button class="btn-primary" type="submit">Guardar materia</button></div></form>`)}
function modalGroup(){const d=state.data,teachers=d.users.filter(x=>x.role==='teacher');
 modal('Nuevo grupo',`<p>Las franjas se ingresan como día, hora de inicio y fin. Los estudiantes verán el bloque al elegir el grupo.</p>
 <form id="create-group-form"><div class="form-grid">
 <div class="field"><label>Materia</label><select name="course_id">${d.courses.map(c=>`<option value="${c.id}">${escapeHtml(c.code)} · ${escapeHtml(c.name)}</option>`).join('')}</select></div>
 <div class="field"><label>Grupo</label><input name="code" maxlength="5" placeholder="C" required></div>
 <div class="field"><label>Docente</label><select name="teacher_id"><option value="">Sin docente</option>${teachers.map(t=>`<option value="${t.id}">${escapeHtml(t.full_name)}</option>`).join('')}</select></div>
 <div class="field"><label>Aula</label><input name="room" required placeholder="B-301"></div>
 <div class="field"><label>Cupos</label><input name="capacity" type="number" min="1" value="25" required></div>
 <div class="field"><label>Día de clase</label><select name="day">${shortDay.map(d=>`<option value="${d}">${d}</option>`).join('')}</select></div>
 <div class="field"><label>Inicio</label><input name="start" type="time" value="08:00"></div>
 <div class="field"><label>Fin</label><input name="end" type="time" value="10:00"></div></div>
 <div class="actions"><button class="btn-primary" type="submit">Crear grupo</button></div></form>`)}
async function changeServer(path,method,body=null,message='Cambios guardados.'){
 try{const res=await api(path,method,body);if(res.message)notify(res.message);else notify(message);modalClose();await reloadData();return res}
 catch(e){notify(e.message,'error');return null}
}
const formData=f=>Object.fromEntries(new FormData(f).entries());
document.addEventListener('submit',async e=>{
 const form=e.target;if(!form.id||form.id==='login-form')return;
 e.preventDefault();
 if(form.id==='request-recovery-form'){
  const r=await changeServer('/recovery/request','POST',formData(form));if(r)modal('Solicitud registrada',`<p>${escapeHtml(r.message)}</p>${btn('Entendido','modal-close','btn-primary')}`);return;
 }
 if(form.id==='redeem-form'){await changeServer('/recovery/redeem','POST',formData(form),'Contraseña restablecida. Espera la habilitación.');return}
 if(form.id==='agenda-form'){
  let v=formData(form);v.course_id=v.course_id||null;
  await changeServer(state.editReminder!==null?`/student/agenda/${state.editReminder}`:'/student/agenda',state.editReminder!==null?'PATCH':'POST',v);
  return;
 }
 if(form.id==='create-student-form')return await changeServer('/admin/students','POST',formData(form));
 if(form.id==='create-course-form')return await changeServer('/admin/courses','POST',formData(form));
 if(form.id==='create-group-form'){
  const v=formData(form);v.sessions=[{day:v.day,start:v.start,end:v.end}];delete v.day;delete v.start;delete v.end;
  await changeServer('/admin/groups','POST',v);return;
 }
});
// Main actions; permission checks are repeated on server, not inferred from visible buttons.
document.addEventListener('click',async e=>{
 const b=e.target.closest('[data-action]');if(!b)return;
 const action=b.dataset.action;
 if(action==='modal-close'){modalClose();return}
 if(action==='modal-confirm'){
   const fn=state.pendingConfirm;state.pendingConfirm=null;modalClose();if(fn)await fn();return;
 }
 if(action==='demo-info')return infoDemo();
 if(action==='recover')return modalRecovery();
 if(action==='password-visibility'){
  const p=document.getElementById('auth-pass');if(!p)return;
  p.type=p.type==='password'?'text':'password';b.textContent=p.type==='password'?'◉ Mostrar':'◌ Ocultar';tileRefresh('auth-pass');return;
 }
 if(action==='route')return navigate(b.dataset.route);
 if(action==='menu'){
  const side=document.querySelector('.sidebar');side?.classList.toggle('open');b.setAttribute('aria-expanded',side?.classList.contains('open')?'true':'false');return;
 }
 if(action==='word'){const paths=b.dataset.path.split('|');
   if(paths.length===1)return navigate(paths[0]);
   return modal('Intersección de palabras',`<p>Esta casilla pertenece a varias rutas. Elige cuál quieres descubrir.</p>
   <div class="actions">${paths.map(p=>linkRoute(p.toUpperCase(),p,'btn-lime')).join('')}</div>`);
 }
 if(action==='theme')return toggleTheme();
 if(action==='tool')return toggleTool();
 if(action==='toggle-hints'){
   const el=document.getElementById('hint');el.hidden=!el.hidden;localStorage.setItem('cruza-hints',el.hidden?'0':'1');return;
 }
 if(action==='logout'){
   try{await api('/logout','POST');state.user=null;state.csrf=null;state.data=null;renderLogin();notify('Sesión cerrada.')}catch(err){notify(err.message)}return;
 }
 if(action==='find-course'){
  state.filterText=state.data.courses.find(x=>x.id==Number(b.dataset.courseId))?.code||'';
  navigate('inscripcion');return;
 }
 if(action==='mobile-draft-tab'){
  const id=b.dataset.draftTab==='vista'?'draft-vista':'draft-materias';document.getElementById(id)?.scrollIntoView({behavior:'smooth'});return;
 }
 if(action==='toggle-course'){
  const cid=Number(b.dataset.courseId),ids=[...state.data.draft.group_ids];const gs=state.data.groups;
  const ix=ids.findIndex(id=>gs.find(g=>g.id===id)?.course_id===cid);
  if(ix>=0)ids.splice(ix,1);
  else{const field=document.getElementById(`grp-${cid}`);if(!field)return;ids.push(Number(field.value))}
  await changeServer('/student/draft','PUT',{group_ids:ids},'Borrador actualizado.');return;
 }
 if(action==='discard')return modalConfirm('Se restaurará el borrador desde la matrícula vigente. ¿Descartar los cambios?',()=>changeServer('/student/draft/discard','POST'));
 if(action==='confirm-enroll')return modalConfirm('Confirmar matrícula: los grupos elegidos se guardarán y el horario vigente será actualizado. ¿Continuar?',()=>changeServer('/student/enroll/confirm','POST'));
 if(action==='calendar-day'){state.calendarDate=b.dataset.day;render();return}
 if(action==='demo-month'){state.calendarDate='2026-11-11';render();return}
 if(action==='activity-toggle')return changeServer(`/student/activities/${b.dataset.activityId}`,'PUT',{completed:b.dataset.done==='true'},'Estado de entrega actualizado.');
 if(action==='agenda-new')return modalAgenda();
 if(action==='agenda-preset')return modalAgenda(null,{title:'Recordatorio del día',due_date:b.dataset.day});
 if(action==='agenda-toggle-done'){state.agendaDone=b.dataset.done==='true';render();return}
 if(action==='agenda-edit')return modalAgenda(Number(b.dataset.agendaId));
 if(action==='agenda-complete'){const x=state.data.agenda.find(a=>a.id==Number(b.dataset.agendaId));
  return changeServer(`/student/agenda/${x.id}`,'PATCH',{done:b.dataset.done==='true'});}
 if(action==='agenda-delete')return modalConfirm('¿Eliminar definitivamente este recordatorio personal?',()=>changeServer(`/student/agenda/${b.dataset.agendaId}`,'DELETE'));
 if(action==='simulate'){
  const id=Number(document.getElementById('simulate-course')?.value),score=Number(document.getElementById('simulate-grade')?.value);
  if(!Number.isFinite(score)||score<0||score>5)return notify('La nota hipotética debe estar entre 0 y 5.');
  const c=state.data.grades.find(c=>c.course_id===id);
  const simulated=.3*score+.3*score+.4*score;
  document.getElementById('simulate-result').textContent=`Si los tres cortes obtuvieran ${number(score)}, la definitiva estimada de ${c.name} sería ${number(simulated)}. No se guardó ninguna nota oficial.`;return;
 }
 if(action==='save-grade'){
  const sid=Number(b.dataset.studentId),eid=Number(b.dataset.evalId);const val=document.getElementById(`grade-${sid}-${eid}`).value;
  if(val!==''&&(!Number.isFinite(Number(val))||Number(val)<0||Number(val)>5))return notify('Nota fuera de la escala 0–5.');
  await changeServer('/teacher/grade','PUT',{student_id:sid,evaluation_id:eid,grade:val===''?null:Number(val),reason:document.getElementById(`reason-${sid}`)?.value||''});return;
 }
 if(action==='attendance'){
  const day=document.getElementById('attendance-date')?.value;
  if(!day)return notify('Selecciona una fecha de clase.');
  return changeServer('/teacher/attendance','PUT',{student_id:Number(b.dataset.studentId),group_id:state.teacherGroup,day,present:b.dataset.present==='true'});
 }
 if(action==='student-new')return modalStudent();
 if(action==='user-status'){
  const status=b.dataset.status;
  return modalConfirm(`¿Confirmas cambiar esta cuenta al estado ${status}?`,()=>changeServer(`/admin/users/${b.dataset.id}/status`,'PUT',{status}));
 }
 if(action==='issue-recovery'){
  return modalConfirm('Confirma que la identidad del solicitante fue verificada FUERA de la aplicación antes de emitir un código temporal.',async()=>{
    const r=await changeServer(`/admin/recovery/${b.dataset.id}/issue`,'POST');
    if(r)modal('Código de un solo uso',`<p>Comparte este código únicamente con el estudiante cuya identidad verificaste. Expira en 30 minutos.</p>
    <div class="notice"><span id="issued-code" class="mon">${escapeHtml(r.code)}</span></div>
    ${btn('Copiar código','copy-code','btn-primary')} ${btn('Cerrar','modal-close')}
    <p class="small danger-text">Este código no volverá a mostrarse después de cerrar esta ventana.</p>`);
  });
 }
 if(action==='copy-code'){
  const code=document.getElementById('issued-code')?.textContent;
  if(code)try{await navigator.clipboard.writeText(code);notify('Código copiado. Entregar de forma segura.')}catch{notify('Selecciona y copia el código manualmente.')}
  return;
 }
 if(action==='course-new')return modalCourse();
 if(action==='group-new')return modalGroup();
});
document.addEventListener('change',async e=>{
 const el=e.target;
 if(el.id==='teacher-group'||el.id==='attendance-group'){state.teacherGroup=Number(el.value);render();return}
 if(el.id==='course-filter'){state.filterType=el.value;render();return}
 if(el.id==='semester-filter'){state.filterSemester=el.value;render();return}
 if(el.matches('select[id^="grp-"]')){
   const cid=Number(el.dataset.courseId),ids=[...state.data.draft.group_ids];const gs=state.data.groups;
   const i=ids.findIndex(x=>gs.find(g=>g.id===x)?.course_id===cid);
   if(i>=0){ids[i]=Number(el.value);await changeServer('/student/draft','PUT',{group_ids:ids},'Grupo actualizado en el borrador.');}
   return;
 }
});
document.addEventListener('input',e=>{
 if(e.target.id==='course-search'){state.filterText=e.target.value;
  // Keep focus and caret by replacing only cards (avoid rerendering the whole form).
  const list=document.querySelector('.courses');if(list){
   const val=state.filterText.toLowerCase();for(const card of list.children){const show=card.textContent.toLowerCase().includes(val);
    card.hidden=!show;}}
 }
});
document.addEventListener('keydown',e=>{
 if(e.key==='Escape'&&document.querySelector('.overlay')){modalClose();return}
 if(e.key==='Escape'&&document.querySelector('.sidebar.open')){document.querySelector('.sidebar').classList.remove('open');document.querySelector('[data-action="menu"]')?.focus();return}
 if(e.key==='Tab'){
  const dialog=document.querySelector('.dialog');if(!dialog)return;
  const f=[...dialog.querySelectorAll('button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled)')];
  if(!f.length)return;
  if(e.shiftKey&&document.activeElement===f[0]){e.preventDefault();f.at(-1).focus()}
  else if(!e.shiftKey&&document.activeElement===f.at(-1)){e.preventDefault();f[0].focus()}
 }
});
// Context hints on pointer, keyboard and touch.
document.addEventListener('pointerover',e=>{
 const tip=e.target.closest('[data-hint],button,label,input,select');const text=tip?.dataset?.hint||tip?.getAttribute('aria-label')||tip?.textContent?.trim().slice(0,85);
 if(text&&document.getElementById('hint')&&!document.getElementById('hint').hidden)
  document.getElementById('hint').textContent=`Pista: ${text}`;
});
document.addEventListener('focusin',e=>{
 const tip=e.target.closest('[data-hint],button,input,select');const text=tip?.dataset?.hint||tip?.getAttribute('aria-label')||tip?.textContent?.trim().slice(0,80);
 if(text&&document.getElementById('hint')&&!document.getElementById('hint').hidden)
 document.getElementById('hint').textContent=`Pista: ${text}`;
});
document.addEventListener('pointermove',e=>{
 const card=e.target.closest('.card');if(!card||e.pointerType!=='mouse')return;
 const r=card.getBoundingClientRect();card.style.setProperty('--mx',`${(e.clientX-r.left)/r.width*100}%`);card.style.setProperty('--my',`${(e.clientY-r.top)/r.height*100}%`);
},{passive:true});
// Day/night preference: entirely local and not a security-sensitive setting.
function toggleTheme(){const next=document.documentElement.dataset.theme==='dark'?'light':'dark';
 document.documentElement.dataset.theme=next;localStorage.setItem('cruza-theme',next);notify(next==='dark'?'Modo noche activado':'Modo día activado');}
function applyTheme(){const saved=localStorage.getItem('cruza-theme');document.documentElement.dataset.theme=
  saved||(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');}
function toggleTool(){state.ambientTool=state.ambientTool==='brush'?'pencil':'brush';
 notify(state.ambientTool==='brush'?'Pincel de tinta activado':'Lápiz de crucigrama activado');}
/* Canvas pigment: only on the free background. Triangle gesture swaps brush/pencil;
   no pointer events intercepted and no trailing animation when pigment settles. */
const backgroundCanvas=document.getElementById('ambient-canvas');const ctx=backgroundCanvas.getContext('2d');
let lines=[],lastPointer=null,canvasAnimation=0,gesture=[];const prefersReduced=()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches;
function resizeCanvas(){backgroundCanvas.width=window.innerWidth*Math.min(devicePixelRatio||1,2);
 backgroundCanvas.height=window.innerHeight*Math.min(devicePixelRatio||1,2);
 backgroundCanvas.style.width=innerWidth+'px';backgroundCanvas.style.height=innerHeight+'px';ctx.setTransform(backgroundCanvas.width/innerWidth,0,0,backgroundCanvas.height/innerHeight,0,0)}
resizeCanvas();addEventListener('resize',resizeCanvas,{passive:true});
function drawAmbient(){canvasAnimation=0;ctx.clearRect(0,0,innerWidth,innerHeight);const now=performance.now();
 lines=lines.filter(x=>now-x.at<3200);for(const seg of lines){ctx.beginPath();ctx.moveTo(seg.a[0],seg.a[1]);ctx.lineTo(seg.b[0],seg.b[1]);
 ctx.strokeStyle=`rgba(${seg.rgb},${Math.max(0,(3200-(now-seg.at))/3200)*.33})`;ctx.lineWidth=seg.pencil?1.5:3.3;ctx.lineCap='round';ctx.stroke()}
 if(lines.length)canvasAnimation=requestAnimationFrame(drawAmbient);
}
function isFree(target){if(!target||target.closest('button,input,textarea,select,a,.card,.auth-form-card,.sidebar,.topbar,.hint-bar,.overlay'))return false;
 return !!target.closest('body,.auth-art,.workspace,.auth-scene,.page,.auth-copy');}
let drawing=false;document.addEventListener('pointerdown',e=>{
 if(e.pointerType!=='mouse'||prefersReduced()||!isFree(e.target))return;drawing=true;gesture=[[e.clientX,e.clientY]];lastPointer=[e.clientX,e.clientY];
},{passive:true});
document.addEventListener('pointermove',e=>{
 if(e.pointerType!=='mouse'||prefersReduced()||!isFree(e.target)){lastPointer=null;return;}
 const p=[e.clientX,e.clientY];if(drawing)gesture.push(p);
 if(lastPointer&&Math.hypot(p[0]-lastPointer[0],p[1]-lastPointer[1])>1){
 const old=lastPointer,rgb=state.ambientTool==='pencil'?'95,114,65':'116,101,167';
 lines.push({a:old,b:p,at:performance.now(),rgb,pencil:state.ambientTool==='pencil'});
 if(lines.length>180)lines.splice(0,lines.length-180);
 if(!canvasAnimation)canvasAnimation=requestAnimationFrame(drawAmbient);
 }
 lastPointer=p;
},{passive:true});
function triangleGesture(points){if(points.length<30)return false;
 const f=points[0],l=points.at(-1),minX=Math.min(...points.map(p=>p[0])),maxX=Math.max(...points.map(p=>p[0])),minY=Math.min(...points.map(p=>p[1])),maxY=Math.max(...points.map(p=>p[1]));
 const dx=maxX-minX,dy=maxY-minY;if(dx<65||dy<65||Math.hypot(f[0]-l[0],f[1]-l[1])>Math.max(dx,dy)*.26)return false;
 // Approximate triangle: three extremal corners and three line segments.
 let far=points.reduce((a,p)=>Math.hypot(p[0]-f[0],p[1]-f[1])>Math.hypot(a[0]-f[0],a[1]-f[1])?p:a,points[0]);
 let third=points.reduce((a,p)=>Math.abs((far[0]-f[0])*(p[1]-f[1])-(far[1]-f[1])*(p[0]-f[0]))>
 Math.abs((far[0]-f[0])*(a[1]-f[1])-(far[1]-f[1])*(a[0]-f[0]))?p:a,points[0]);
 const area=Math.abs((far[0]-f[0])*(third[1]-f[1])-(far[1]-f[1])*(third[0]-f[0]))/2;
 return area>dx*dy*.18;
}
document.addEventListener('pointerup',e=>{if(!drawing)return;drawing=false;
 if(triangleGesture(gesture))toggleTool();gesture=[];lastPointer=null;},{passive:true});
document.addEventListener('pointercancel',()=>{drawing=false;gesture=[];lastPointer=null},{passive:true});
/* Dust in the crossword surface: separate from pencil strokes; no solid lines. */
let dustFrame=0;
function mountPowder(){let canvas=document.getElementById('powder');if(!canvas||prefersReduced())return;
 const parent=canvas.closest('.board');if(!parent)return;const context=canvas.getContext('2d'),rect=parent.getBoundingClientRect();
 canvas.width=Math.min(1200,Math.round(rect.width));canvas.height=Math.min(700,Math.round(rect.height));
 const particles=Array.from({length:50},()=>({x:Math.random()*canvas.width,y:Math.random()*canvas.height,vx:0,vy:0}));
 let pointer=null,lastTime=performance.now(),movingUntil=performance.now()+800,active=true;
 function frame(now){dustFrame=0;if(!parent.isConnected){active=false;return}
   const age=Math.min(40,(now-lastTime));lastTime=now;
   context.clearRect(0,0,canvas.width,canvas.height);let activity=0;
   for(const p of particles){if(pointer){let dx=p.x-pointer.x,dy=p.y-pointer.y,d2=dx*dx+dy*dy;
     if(d2<10000&&d2>1){const push=(10000-d2)/10000*.7;p.vx+=dx/Math.sqrt(d2)*push;p.vy+=dy/Math.sqrt(d2)*push;}}
    p.x+=p.vx*age/16;p.y+=p.vy*age/16;p.vx*=.89;p.vy*=.89;activity+=Math.abs(p.vx)+Math.abs(p.vy);
    if(p.x<0||p.x>canvas.width)p.vx*=-.5;if(p.y<0||p.y>canvas.height)p.vy*=-.5;
    context.beginPath();context.fillStyle='rgba(129,150,99,.20)';context.arc(p.x,p.y,1.6,0,Math.PI*2);context.fill();}
   if(activity>.12||now<movingUntil){dustFrame=requestAnimationFrame(frame)}else{active=false;pointer=null;}
 }
 function move(e){if(e.pointerType==='touch')return;const r=canvas.getBoundingClientRect();pointer={x:e.clientX-r.left,y:e.clientY-r.top};movingUntil=performance.now()+450;
 if(!active){active=true;dustFrame=requestAnimationFrame(frame)}}
 parent.addEventListener('pointermove',move,{passive:true});parent.addEventListener('pointerleave',()=>{pointer=null},{passive:true});
 dustFrame=requestAnimationFrame(frame);
}
applyTheme();boot();
