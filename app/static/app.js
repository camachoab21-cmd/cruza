'use strict';
/* CRUZA 3.0 — interfaz sin dependencias externas. Toda operación académica pasa por la API. */
const root=document.getElementById('app');
const state={user:null,csrf:null,data:null,page:'tablero',busy:false,loginShow:false,
  draftMobile:'materias',filterText:'',filterType:'',filterSemester:'',calendarDate:'2026-11-11',
  agendaDone:false,teacherGroup:null,editReminder:null,courseSim:{},roleNavigation:false,
  ambientTool:'pencil',ambientEnabled:true,loginUser:'',loginPass:''};
const roleMenu={student:[['tablero','Mi tablero'],['pensum','Pensum'],['inscripcion','Matrícula'],
 ['horario','Horario'],['calendario','Calendario'],['agenda','Mi agenda'],['notas','Notas'],
 ['asistencia','Asistencia'],['historial','Historial'],['perfil','Perfil']],
 teacher:[['notas','Notas'],['asistencia','Asistencia']],
 admin:[['estudiantes','Estudiantes'],['recuperacion','Recuperación'],['catalogo','Catálogo'],['auditoria','Auditoría']]};
const roleNames={student:'Estudiante',teacher:'Docente',admin:'Administrador'};
const shortDay=['Lun','Mar','Mie','Jue','Vie','Sab'];
const escapeHtml=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const number=v=>v===null||v===undefined?'—':Number(v).toFixed(2).replace('.',',');
const notify=(message,kind='info')=>{
  const region=document.getElementById('toast-region');if(!region)return;
  region.replaceChildren(); // Avoid stacking notices over academic data on small screens.
  const el=document.createElement('div');el.className='toast';el.textContent=message;
  region.append(el);setTimeout(()=>{if(el.isConnected)el.remove();},3000);
};
async function api(path,method='GET',body=null){
 const options={method,credentials:'same-origin',headers:{}};
 if(method!=='GET' && state.csrf)options.headers['X-CSRF-Token']=state.csrf;
 if(body!==null){options.headers['Content-Type']='application/json';options.body=JSON.stringify(body)}
 let r;
 try{r=await fetch('/api'+path,options)}catch{window.dispatchEvent(new Event('cruza:connection-lost'));throw Error('No hay conexión con el servidor local. Revisa que esté ejecutándose.')}
 window.dispatchEvent(new Event('cruza:connection-restored'));
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
 <p class="muted small">Usuario y contraseña en piezas dinámicas de crucigrama.</p>
 ${authField('auth-user','Usuario','username','ESTUDIANTE','text')}
 ${authField('auth-pass','Contraseña','current-password','CRUZA2026','password')}
 <div id="auth-error" role="alert" class="auth-error"></div>
 <button class="btn-primary btn-wide" id="login-button" type="submit">Entrar al campus <span aria-hidden="true">↗</span></button>
 <div class="actions between"><button type="button" class="btn-ghost btn-mini" data-action="demo-info">Credenciales</button>
 <button type="button" class="btn-ghost btn-mini" data-action="recover">Restablecer contraseña</button></div>
 </form>`;
}
function authField(id,title,autocomplete,placeholder,type){
 let extra=type==='password'?btn('◉ Mostrar','password-visibility','btn-mini',`id="toggle-pass"`):'';
 return `<div class="auth-field"><div class="between"><label for="${id}">${title}</label>${extra}</div>
 <div class="tile-container">
 <div class="auth-tiles" data-tiles="${id}" aria-hidden="true"><span class="auth-tile is-empty" style="--i:0"><span class="tile-num">1</span></span></div>
 <input id="${id}" class="tile-input" type="${type}" name="${id}" autocomplete="${autocomplete}" aria-label="${title}" autocapitalize="${type==='text'?'characters':'off'}" maxlength="${type==='password'?128:60}" spellcheck="false" required placeholder="${placeholder}">
 </div></div>`;
}
function particles(){return `<div class="auth-stars" aria-hidden="true">${Array.from({length:14},(_,i)=>`<i style="--i:${i};--x:${(i*29+11)%100}%;--y:${(i*17+7)%94}%"></i>`).join('')}</div>`}
function renderLogin(){state.page='login';document.body.dataset.module='login';document.body.classList.remove('sidebar-open');document.getElementById('toast-region')?.replaceChildren();
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
function tileRefresh(id){
 const input=document.getElementById(id),tileRoot=document.querySelector(`[data-tiles="${id}"]`);
 if(!input||!tileRoot)return;
 const text=input.value,limit=14,overflow=text.length>=limit;
 const start=overflow?text.length-(limit-1):0;
 const count=overflow?limit:Math.max(1,Math.min(limit,text.length));
 const focused=document.activeElement===input,caret=input.selectionStart??text.length;
 const secret=id==='auth-pass'&&input.type==='password';
 let html='';
 for(let i=0;i<count;i++){
  const ellipsis=overflow&&i===0;
  const index=overflow?start+i-1:i;
  const filled=ellipsis||index<text.length;
  const value=ellipsis?'…':filled?(secret?'●':text[index].toUpperCase()):'';
  const active=focused&&(ellipsis?caret<=start:caret===index||(index===text.length-1&&caret>=text.length));
  html+=`<span class="auth-tile ${filled?'filled':'is-empty'} ${active?'focused':''}" style="--i:${Math.min(i,8)}"><span class="tile-num">${ellipsis?'…':index+1}</span>${escapeHtml(value)}</span>`;
 }
 tileRoot.innerHTML=html;
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
 <a class="btn-ghost" href="/">Reintentar</a></div>`}}
async function reloadData(){if(!state.user){renderLogin();return;}
 state.data=await api(state.user.role==='student'?'/student':state.user.role==='teacher'?'/teacher':'/admin');render();}
function sideBar(){const menu=roleMenu[state.user.role];return `<aside class="sidebar" id="sidebar">${brand()}<div>
 <div class="eyebrow" style="margin:0 0 14px">${escapeHtml(roleNames[state.user.role])} / SECCIONES</div><nav aria-label="Secciones del campus">
 ${menu.map(([key,text],i)=>`<button class="navbtn ${state.page===key?'active':''}" data-action="route" data-route="${key}" aria-label="${escapeHtml(text)}" aria-current="${state.page===key?'page':'false'}">
 <span class="mon">${String(i+1).padStart(2,'0')}</span><span>${text}</span></button>`).join('')}</nav></div>
 <div class="sidebar-foot"><div class="eyebrow">TU IDENTIDAD</div><strong>${escapeHtml(state.user.full_name)}</strong>
 <div class="tiny muted">${escapeHtml(state.user.username)}</div>
 ${btn('Cerrar sesión','logout','btn-mini btn-wide','style="margin-top:13px"')}</div></aside>`}
function shell(){const title=roleMenu[state.user.role].find(([id])=>id===state.page)?.[1]||'Mi tablero';
 return `<div class="shell">${sideBar()}<main class="workspace"><header class="topbar">
 <div class="row-left">${btn('☰ Menú','menu','btn-mini mobile-menu', 'aria-expanded="false" aria-controls="sidebar"')}
 <strong class="name">${escapeHtml(title)}</strong><span class="pill">PERÍODO 2026-2</span><span class="pill cruza-version" title="Versión de exposición 24 de noviembre">CRUZA · EXPO 24.11</span></div>
 <div class="controls">${btn('☀ / ☾','theme','btn-mini','aria-label="Alternar modo día y noche"')}
 ${btn('✎ Lápiz','tool','btn-mini','title="Alternar lápiz y crayón" aria-pressed="false"')}
 ${btn('Ayuda','toggle-hints','btn-mini','aria-pressed="true" aria-label="Mostrar u ocultar la ayuda contextual"')}
 </div></header><aside id="hint" class="hint-bar" role="status" aria-live="polite" aria-label="Ayuda contextual"></aside><div id="content" class="page">${pageContent()}</div>
 <footer class="small muted" style="margin-top:42px;border-top:1px solid var(--line);padding-top:18px">CRUZA · Campus Académico · ${escapeHtml(roleNames[state.user.role])}<span class="cruza-release" aria-label="CRUZA: versión de exposición">Expo 24.11</span></footer>
 </main></div>`}
function pageContent(){switch(state.user.role){
 case 'student':return ({tablero:dashboard,pensum:curriculum,inscripcion:enrollment,horario:schedule,calendario:calendar,
     agenda:agendaPage,notas:gradesPage,asistencia:studentAttendance,historial:historyPage,perfil:profilePage})[state.page]?.()||dashboard();
 case 'teacher':return state.page==='asistencia'?attendancePage():teacherNotes();
 case 'admin':return ({estudiantes:adminUsers,recuperacion:adminRecovery,catalogo:adminCatalogue,auditoria:adminAudit})[state.page]?.()||adminUsers();
 }}
function render(){if(!state.user){renderLogin();return;}
 if(!roleMenu[state.user.role].some(([r])=>r===state.page))state.page=roleMenu[state.user.role][0][0];
 document.body.dataset.module=state.page;
 root.innerHTML=shell();
 window.CruzaTools?.setMode(state.ambientTool);
 document.getElementById('toast-region')?.replaceChildren();
 const hintsDisabled=localStorage.getItem('cruza-hints')==='0';
 const ribbon=document.getElementById('hint');if(ribbon)ribbon.hidden=hintsDisabled;
 document.querySelector('[data-action="toggle-hints"]')?.setAttribute('aria-pressed',String(!hintsDisabled));
 if(state.page==='tablero')requestAnimationFrame(mountPowder);
 if(state.page==='inscripcion')requestAnimationFrame(mountPowder);
}
function navigate(to){if(!state.user)return;if(!roleMenu[state.user.role].some(([r])=>r===to)){notify('No tienes permisos para entrar en este módulo.');return;}
 state.page=to;state.roleNavigation=false;render();window.scrollTo({top:0,behavior:'instant'});
}
// Las ayudas de cada elemento se administran únicamente en cruza-ux.js.
// Raise the pointed crossword word; other keys settle down without obstructing content.
function highlightCrosswordPath(target){
  const el=target?.closest?.('.board-tile[data-path], .board-clues [data-route]');
  const board=el?.closest('.board');if(!board)return;
  const route=el.dataset.route||(el.dataset.path||'').split('|')[0];
  if(!route)return;
  board.querySelectorAll('.board-tile[data-path]').forEach(cell=>{
    const active=(cell.dataset.path||'').split('|').includes(route);
    cell.classList.toggle('is-path',active);
    cell.classList.toggle('is-floor',!active);
  });
  board.querySelectorAll('.board-clues [data-route]').forEach(clue=>clue.classList.toggle('is-path',clue.dataset.route===route));
}
function clearCrosswordPath(board){
  if(!board)return;
  board.querySelectorAll('.board-tile.is-path,.board-tile.is-floor,.board-clues .is-path').forEach(el=>el.classList.remove('is-path','is-floor'));
}
document.addEventListener('pointerover',e=>highlightCrosswordPath(e.target));
document.addEventListener('pointerout',e=>{
  const board=e.target?.closest?.('.board');
  if(board&&(!e.relatedTarget||!board.contains(e.relatedTarget)))clearCrosswordPath(board);
});
document.addEventListener('focusin',e=>highlightCrosswordPath(e.target));
document.addEventListener('focusout',e=>{
  const board=e.target?.closest?.('.board');
  if(board&&(!e.relatedTarget||!board.contains(e.relatedTarget)))clearCrosswordPath(board);
});

function crossword(){const grid=new Map(),words=[
 {name:'MATRICULA',row:2,col:0,vertical:false,route:'inscripcion',number:1,tone:'lime'},
  {name:'HORARIO',row:0,col:3,vertical:true,route:'horario',number:2,tone:'lavender'},
  {name:'NOTAS',row:6,col:2,vertical:false,route:'notas',number:3,tone:'peach'},
  {name:'CRUZA',row:4,col:2,vertical:false,route:'tablero',number:4,tone:'cream'}];
 for(const w of words)for(let i=0;i<w.name.length;i++){
   const row=w.row+(w.vertical?i:0),col=w.col+(w.vertical?0:i),key=`${row}-${col}`;
   let cell=grid.get(key)||{letter:w.name[i],routes:[],number:i===0?w.number:null,tone:w.tone};
    if(cell.letter!==w.name[i])throw Error('Intersección incorrecta: '+key);
    cell.routes.push(w.route);if(w.vertical)cell.tone='lavender';grid.set(key,cell)}
 return `<section class="card board board-map" aria-label="Mapa interactivo de rutas académicas"><header class="map-head"><span class="map-kicker"><span class="map-dot" aria-hidden="true"></span> MAPA INTERACTIVO</span><span class="map-count">03 RUTAS / 01 SEMESTRE</span></header><div class="map-stage">
 <div class="board-tiles" role="group" aria-label="Crucigrama de navegación">
 ${Array.from({length:63},(_,i)=>{const r=Math.floor(i/9),c=i%9,cell=grid.get(`${r}-${c}`);
  return cell?`<button type="button" class="board-tile tone-${cell.tone}" data-number="${cell.number??''}" style="--tile-i:${i}" data-action="word" data-path="${cell.routes.join('|')}" data-hint="Casilla ${cell.letter}: ${cell.routes.join(', ')}" aria-label="Letra ${cell.letter}; ${cell.routes.join(' o ')}"><span class="tile-face">${cell.number!==null?`<span class="tile-number" aria-hidden="true">${cell.number}</span>`:'' }${cell.letter}</span></button>`:'<span class="board-tile void" aria-hidden="true"></span>'}).join('')}</div><div class="map-pencil" aria-hidden="true"><svg viewBox="0 0 94 136" xmlns="http://www.w3.org/2000/svg"><g transform="rotate(28 48 68)"><path d="M31 20 Q31 12 39 12 L57 12 Q64 12 64 20 L64 94 L48 126 L31 94 Z" fill="#f1a95e" stroke="#746b4b" stroke-width="2"/><path d="M39 12 L39 98 L48 126 L31 94 L31 20 Q31 12 39 12" fill="#f6d280"/><path d="M56 12 L56 98 L48 126 L64 94 L64 20 Q64 12 56 12" fill="#da9a62"/><path d="M31 92 L48 126 L64 92" fill="#e9cc9f" stroke="#92785b" stroke-width="2"/><path d="M43 116 L48 126 L53 116" fill="#343f37"/><rect x="31" y="12" width="33" height="15" rx="5" fill="#d8b5ef" stroke="#9980b2" stroke-width="2"/><path d="M31 29 H64" stroke="#ba915b" stroke-width="2"/></g></svg></div></div>
 <footer class="map-footer"><span>Explora una palabra para ver su ruta</span><span class="map-arrow" aria-hidden="true">↗</span></footer><canvas id="powder" aria-hidden="true" style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:0"></canvas></section>`}
function dashboard(){const d=state.data;const courses=d.draft.confirmed;const next=courses[0];
 return head('01 · HORIZONTAL','Tu semestre. <em>Todas las piezas.</em>',`Hola, ${escapeHtml(state.user.full_name)}. Cada palabra te guía al siguiente paso en el tablero.`,linkRoute('Matricular materias ↗','inscripcion','btn-primary'))+
 `${crossword()}<section class="card dashboard-status">
 <div class="eyebrow">ESTADO ACTUAL</div><h2>Una palabra a la vez.</h2>
 <p class="muted">Las conexiones también se construyen con pequeños avances.</p>
 <div class="list"><div class="item"><strong>Próxima clase</strong><span>${next?escapeHtml(next.name):'Sin materias'}</span></div>
 <div class="item"><strong>Materias vigentes</strong><span>${courses.length}</span></div>
 <div class="item"><strong>Agenda</strong><span>${d.agenda.filter(x=>!x.done).length} pendientes</span></div></div>
 <div class="actions">${linkRoute('Abrir horario ↗','horario','btn-lime')}${linkRoute('Ver agenda','agenda')}</div></section>
 <div class="stats">${stat('CRÉDITOS INSCRITOS',d.summary.credits_current,'Créditos enteros')}
 ${stat('PROMEDIO ACUMULADO',number(d.summary.papa),'Promedio ponderado acumulado','purple')}
 ${stat('PROMEDIO DEL PERÍODO',number(d.summary.papi),'Solo notas definitivas disponibles','peach')}</div>`;
}
function curriculum(){const d=state.data;const offered=new Set(d.groups.map(x=>x.course_id));const sems=[...new Set(d.courses.map(x=>x.semester))];
 return head('02 · VERTICAL','El plan de <em>tus piezas.</em>','Rutas académicas y asignaturas por semestre.',linkRoute('Ir a Matrícula →','inscripcion','btn-primary'))+
 `<div class="semester-grid">${sems.map(s=>`<section class="card"><div class="eyebrow">SEMESTRE ${String(s).padStart(2,'0')}</div>
 <h2>Semestre <em>${s}.</em></h2><div class="list">${d.courses.filter(c=>c.semester===s).map(c=>`<div class="item"><div>
 <div class="mon muted">${escapeHtml(c.code)} · ${c.credits} créditos</div><strong>${escapeHtml(c.name)}</strong>
 <div class="actions">${labelTag(c.category,tagCat(c.category))}${!offered.has(c.id)?labelTag('Sin grupos en 2026-2','pill-muted'):''}</div></div>
 ${offered.has(c.id)?btn('Localizar ↗','find-course','btn-mini',`data-course-id="${c.id}"`):''}</div>`).join('')}</div></section>`).join('')}</div>`;
}
function conflictsFor(groups){const out=[];for(let i=0;i<groups.length;i++)for(let j=i+1;j<groups.length;j++)for(const a of groups[i].sessions)for(const b of groups[j].sessions){
 if(a.day===b.day&&a.start<b.end&&b.start<a.end)out.push({a:groups[i].id,b:groups[j].id,day:a.day,start:a.start>b.start?a.start:b.start});}return out;}
function timeGrid(groups,confirmed=[],compact=false){const all=[...groups,...confirmed.filter(x=>!groups.some(g=>g.course_id===x.course_id))];
 const issues=conflictsFor(groups);const conflictIds=new Set(issues.flatMap(x=>[x.a,x.b]));const currentIds=new Set(confirmed.map(x=>x.group_id||x.id));
 const rows=['08:00','10:00','12:00','14:00','16:00','18:00'];
 let html=`<div class="${compact?'table-fit':'table-scroll'}"><table class="schedule-table ${compact?'compact':''}"><thead><tr><th>HORA</th>`+
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
 ${gs.length?`<div class="field"><label for="grp-${c.id}">Grupo y horario asignado</label><select id="grp-${c.id}" data-course-id="${c.id}">
 ${gs.map(g=>`<option value="${g.id}" ${chosen?.id===g.id?'selected':''}>GRUPO ${g.code} · ${g.sessions.map(s=>`${s.day} ${s.start}-${s.end}`).join(' / ')}</option>`).join('')}</select></div>
 <div class="small muted">${escapeHtml([...new Set(gs.map(g=>g.room))].join(', '))}</div>
 <div class="actions">${chosen?btn('Retirar del borrador','toggle-course','btn-mini btn-danger',`data-course-id="${c.id}"`):
 btn('Añadir al borrador +','toggle-course','btn-lime btn-mini',`data-course-id="${c.id}"`)}</div>`:
 `<div class="notice">No se ofrecen grupos para esta materia durante 2026-2.</div>`}</article>`}).join('');
 const old=d.draft.confirmed.map(x=>({...x,id:x.group_id,code:x.group_code}));
 return head('03 · HORIZONTAL','Matrícula. <em>Las piezas encajan.</em>','Borrador y cruces de horario para el período.',
 linkRoute('Ver Pensum ↗','pensum'))+
 `<div class="between" style="margin-bottom:15px"><div class="row-left">${badges}</div><div class="actions">${btn('Descartar borrador','discard','btn-mini')}${btn('Confirmar matrícula ↗','confirm-enroll','btn-primary',`${d.draft.problems.length?'disabled title="Resuelve los conflictos"':''}`)}</div></div>
 ${errors?`<div class="list" style="margin-bottom:18px">${errors}</div>`:''}
 <div class="actions" style="margin-bottom:13px">${btn('Materias','mobile-draft-tab','btn-mini',`data-draft-tab="materias"`)}
 ${btn('Vista previa','mobile-draft-tab','btn-mini',`data-draft-tab="vista"`)}</div>
 <div class="enrollment-layout"><section id="draft-materias">${menu}<div class="courses">${cards||'<div class="notice">No se encontraron materias.</div>'}</div></section>
 <aside class="card preview" id="draft-vista"><div class="card-head"><div><div class="eyebrow">CUADRÍCULA PROVISIONAL</div><h2>Vista <em>previa.</em></h2></div>${labelTag('Borrador','purple')}</div>
 ${timeGrid(selected,old,true)}<p class="small muted">Lavanda: vigente · Lima: agregado · Albaricoque: retiro · Borde rojo: choque.</p>
 <div class="eyebrow" style="margin-top:12px">${selected.length} materias · ${d.draft.credits} créditos en borrador</div></aside></div>`;
}
function schedule(){const arr=state.data.draft.confirmed.map(x=>({...x,id:x.group_id,code:x.group_code}));
 return head('04 · VERTICAL','Tu semana, <em>resuelta.</em>','Cuadrícula de clases y cruces de horario confirmados.',
 `<div class="row-left">${btn('Imprimir / Guardar PDF 🖨','print-schedule','btn btn-lime')}<a href="/api/student/schedule.csv" class="btn">Descargar CSV ↧</a></div>`)+
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
 cells+=`<button type="button" class="cal-day ${status?'corner-'+status:''} ${today===iso?'selected':''}" data-action="calendar-day" data-day="${iso}" aria-label="${iso}; ${status||'sin actividades'}"><span class="cal-day-num">${n}</span>
 ${items.length?`<span class="cal-label">${items.length} act.</span>`:''}</button>`;
 }
 const list=acts.filter(a=>a.due_date===today);
 return head('06 · VERTICAL','Calendario. <em>Casillas del mes.</em>','Diagonal roja: atrasada; naranja: pendiente; verde: entregada.',linkRoute('Abrir Mi agenda →','agenda'))+
 `<div class="grid-2"><section class="card canvas-grid"><div class="between"><div class="cal-nav"><button type="button" class="btn-mini" data-action="cal-prev-month" aria-label="Mes anterior">←</button><h2 style="margin:0;font-size:1.3rem">${first.toLocaleDateString('es-CO',{month:'long',year:'numeric'}).replace(/^./,ch=>ch.toUpperCase())}</h2><button type="button" class="btn-mini" data-action="cal-next-month" aria-label="Mes siguiente">→</button></div><div class="row-left">${btn('Nov 2026','demo-month','btn-mini')}</div></div>
 <div class="calendar">${cells}</div></section>
 <section class="card"><div class="eyebrow">ACTIVIDADES DEL DÍA</div><h2>${escapeHtml(today)}</h2>
 ${list.length?list.map(a=>`<div class="item"><div><strong>${escapeHtml(a.title)}</strong><div class="small muted">${escapeHtml(a.course)} · ${escapeHtml(a.state)}</div></div>
 <div class="actions">${btn(a.completed?'Marcar pendiente':'Marcar entregada','activity-toggle','btn-mini',`data-activity-id="${a.id}" data-done="${a.completed?'false':'true'}"`)}</div></div>`).join(''):'<div class="notice">No hay entregas registradas para este día.</div>'}
 ${btn('Añadir a Mi agenda +','agenda-preset','btn-lime btn-mini',`data-day="${today}"`)}</section></div>`;
}
function agendaPage(){const all=state.data.agenda;const list=all.filter(x=>state.agendaDone?x.done:!x.done);
 return head('07 · HORIZONTAL','Mi agenda. <em>Pistas pendientes.</em>','Tus tareas y recordatorios organizados por fecha.',btn('Nueva tarea o recordatorio +','agenda-new','btn-primary'))+
 `<div class="card canvas-grid"><div class="between" style="margin-bottom:16px"><div class="eyebrow">PISTAS DEL DÍA A DÍA</div><div class="actions" style="margin-top:0">
 ${btn('Próximos','agenda-toggle-done','btn-mini',`data-done="false"`)}
 ${btn('Completados','agenda-toggle-done','btn-mini',`data-done="true"`)}</div></div>
 ${list.length?list.map((x,i)=>`<div class="agenda-entry ${x.done?'done':''}"><div class="agenda-clue-num">${String(i+1).padStart(2,'0')}</div><div><div class="mon">${escapeHtml(x.due_date)} ${escapeHtml(x.due_time||'')}</div>
 <h3>${escapeHtml(x.title)}</h3><p class="small muted" style="margin:0">${escapeHtml(x.description||'')} · ${x.source==='personal'?'Personal':'Académica'}</p></div>
 <div class="actions">${btn('Editar','agenda-edit','btn-mini',`data-agenda-id="${x.id}"`)}
 ${btn(x.done?'Reabrir':'Completar','agenda-complete','btn-mini',`data-agenda-id="${x.id}" data-done="${x.done?'false':'true'}"`)}
 ${btn('Eliminar','agenda-delete','btn-mini btn-danger',`data-agenda-id="${x.id}"`)}</div></div>`).join(''):
 '<div class="notice">Aquí todavía no hay recordatorios. Crea uno desde el botón superior.</div>'}</div>`;
}
function simCut(course,term){
 const prop=term===1?'cut1':'cut2';
 const manual=state.courseSim?.courseId===course.course_id?state.courseSim[prop]:undefined;
 if(manual!==undefined)return manual;
 const cut=course.summary?.cuts?.[term];
 return cut?.grade??cut?.provisional??null;
}
function validHypothesis(value){
 if(value===null||value===undefined||value==='')return null;
 const n=Number(value);return Number.isFinite(n)&&n>=0&&n<=5?n:null;
}
function predictFinal(c1,c2,c3){
 const grades=[c1,c2,c3].map(validHypothesis);
 if(grades.some(x=>x===null))return null;
 return Math.round((grades[0]*.33+grades[1]*.33+grades[2]*.34+Number.EPSILON)*100)/100;
}
function crosswordCalculator(all){
 if(!all||!all.length)return '';
 const selectedId=state.courseSim?.courseId||all[0].course_id;
 const c=all.find(x=>x.course_id===selectedId)||all[0];
 const c1=simCut(c,1),c2=simCut(c,2);
 const c3=state.courseSim?.grade??4.5;
 const simulated=predictFinal(c1,c2,c3);
 const codeTiles=(c.code||'WEB').toUpperCase().replace(/[^A-Z0-9]/g,'').split('').map(l=>`<span class="word-tile">${l}</span>`).join('');
 return `<section class="crossword-calc" aria-label="Simulador de definitiva académica">
 <div class="between" style="align-items:flex-start"><div><div class="eyebrow">PISTA ESPECIAL · CÁLCULO DE CRUCIGRAMA</div>
 <h2 style="margin:4px 0 8px">Calculadora <em>de Casillas.</em></h2>
 <div class="word-tiles" aria-hidden="true">${codeTiles}</div></div>
 <div class="field" style="margin:0;min-width:min(200px,100%)"><label for="simulate-course" class="small">Materia a calcular</label>
 <select id="simulate-course">${all.map(x=>`<option value="${x.course_id}" ${x.course_id===selectedId?'selected':''}>${escapeHtml(x.name)}</option>`).join('')}</select></div></div>
 <p class="small muted">Simulación: puedes cambiar las tres notas hipotéticas. Los cortes pesan <strong>33 %, 33 % y 34 %</strong>. Escala oficial de 0.0 a 5.0.</p>
 <div class="calc-equation">
 ${[1,2].map((term,i)=>`<label class="calc-tile"><span class="calc-num">0${term}</span><span class="calc-pct">CORTE ${term} · 33 %</span>
 <input class="calc-grade-input" aria-label="Nota del corte ${term} para la simulación" id="simulate-cut-${term}" type="number" min="0" max="5" step="0.1" inputmode="decimal" value="${[c1,c2][i]??''}" placeholder="—"></label><span class="calc-operator" aria-hidden="true">+</span>`).join('')}
 <label class="calc-tile unknown"><span class="calc-num">03 ?</span><span class="calc-pct">CORTE 3 · 34 %</span>
 <input class="calc-grade-input" aria-label="Nota del corte 3 para la simulación" type="number" min="0" max="5" step="0.1" inputmode="decimal" id="simulate-grade" value="${c3}"></label>
 <span class="calc-operator" aria-hidden="true">=</span>
 <div class="calc-tile result" aria-live="polite"><span class="calc-num">DEF</span><span class="calc-pct">DEFINITIVA ESTIMADA</span><span class="calc-val" id="simulate-result">${number(simulated)}</span></div>
 </div>
 <div class="calc-dial"><span class="eyebrow">PRUEBA EL CORTE 3:</span>
 <div class="calc-quick-tiles">${[3,3.5,4,4.5,5].map(v=>`<button type="button" class="calc-quick-tile ${Math.abs(c3-v)<0.05?'active':''}" data-action="sim-quick" data-grade="${v}" aria-label="Simular nota ${v.toFixed(1)} para el corte 3">${v.toFixed(1).replace('.',',')}</button>`).join('')}</div></div>
 <p class="small muted" style="margin:12px 0 0">Si algún corte está pendiente, escribe una nota hipotética para calcular. Resultado orientativo para la demostración.</p>
 </section>`;
}
function updateSimulationFromInputs(){
 const cid=Number(document.getElementById('simulate-course')?.value);
 const in1=document.getElementById('simulate-cut-1'),in2=document.getElementById('simulate-cut-2'),in3=document.getElementById('simulate-grade');
 [in1,in2,in3].forEach(inp=>{
  if(inp&&inp.value!==''){
   let n=parseFloat(inp.value);
   if(n>5){inp.value='5';notify('La nota máxima es 5.0');}
   else if(n<0){inp.value='0';notify('La nota mínima es 0.0');}
  }
 });
 const cut1=in1?.value??'',cut2=in2?.value??'',cut3=in3?.value??'';
 state.courseSim={courseId:cid,cut1,cut2,grade:cut3};
 const output=document.getElementById('simulate-result');if(output)output.textContent=number(predictFinal(cut1,cut2,cut3));
 document.querySelectorAll('.calc-quick-tile').forEach(button=>button.classList.toggle('active',Number(button.dataset.grade)===Number(cut3)));
}

function gradesPage(){const d=state.data;const all=d.grades;const att=d.attendance||[];
 return head('05 · HORIZONTAL','Notas y Calificaciones. <em>Cada avance cuenta.</em>','Cada casilla resuelta completa tu mapa académico del período.')+
 `<div class="stats">${stat('PROMEDIO ACUMULADO',number(d.summary.papa),'Histórico + finales del período')}
 ${stat('PROMEDIO DEL PERÍODO',number(d.summary.papi),'Solo materias con nota definitiva','purple')}
 ${stat('CRÉDITOS CURSADOS',d.summary.credits_hist,'Créditos de historial','peach')}</div>
 <div class="courses">${all.map(c=>{
 const courseFallas=att.filter(x=>(x.course===c.name||x.course_code===c.code)&&!x.present).length;
 return `<article class="course-grades-card"><div class="course-grades-head">
 <div><div class="eyebrow">${escapeHtml(c.code)} · ${c.credits} CRÉDITOS</div><h2 style="margin:5px 0 0">${escapeHtml(c.name)}</h2></div>
 <div class="row-left" style="gap:8px">
   <div class="def-tile" title="Total de fallas en ${escapeHtml(c.name)}" style="min-width:62px;border-color:${courseFallas>0?'var(--danger)':'var(--line)'};background:${courseFallas>0?'color-mix(in srgb,var(--danger) 14%,var(--paper2))':'var(--paper2)'}">
     <span class="def-label" style="color:${courseFallas>0?'var(--danger)':'var(--muted)'}">FALLAS</span>
     <span class="def-val" style="color:${courseFallas>0?'var(--danger)':'var(--ink)'}">${courseFallas}</span>
   </div>
   <div class="def-tile" title="Nota definitiva"><span class="def-label">DEFINITIVA</span><span class="def-val">${number(c.summary.final)}</span></div>
 </div></div>
 <div class="corte-tiles">${[1,2,3].map(t=>{const cut=c.summary.cuts[t],isComplete=cut.complete,pct=t===3?'34%':'33%';
 const tEvals=c.evaluations.filter(e=>e.term===t);
 return `<div class="corte-cell ${isComplete?'complete':'pending'}"><div class="corte-header"><span class="corte-tag">Corte ${t}</span>
 <span class="corte-pct">${pct}</span></div><div class="corte-val">${isComplete?number(cut.grade):'—'}</div>
 ${tEvals.length?`<div class="corte-subevals" style="display:flex;gap:5px;flex-wrap:wrap;justify-content:center;margin-top:6px;font-size:.72rem;color:var(--muted)">${tEvals.map(e=>`<span>${e.weight}%: <strong>${e.grade===null?'—':number(e.grade)}</strong></span>`).join(' · ')}</div>`:''}
 </div>`;}).join('')}</div>
 </article>`;}).join('')}</div>
 ${crosswordCalculator(all)}`;
}
function studentAttendance(){const rows=state.data.attendance||[];
 return head('08 · VERTICAL','Asistencia. <em>Presencia en cada clase.</em>','Registro de asistencias y ausencias del período actual.')+
 `<section class="card"><div class="eyebrow">HISTORIAL DE ASISTENCIA</div><h2>Tu registro <em>académico.</em></h2>
 ${rows.length?`<div class="table-scroll"><table class="table"><thead><tr><th>Fecha</th><th>Materia y grupo</th><th>Estado</th></tr></thead><tbody>
 ${rows.map(x=>`<tr><td>${escapeHtml(x.day)}</td><td><strong>${escapeHtml(x.course)}</strong> · ${escapeHtml(x.group_code)}</td>
 <td><span class="tile-badge ${x.present?'presente':'ausente'}" title="${x.present?'Presente':'Ausente'}">${x.present?'P':'A'}</span> &nbsp;<span class="small">${x.present?'Presente':'Ausente'}</span></td></tr>`).join('')}</tbody></table></div>`:
 '<div class="notice">Todavía no hay registros de asistencia para tus materias.</div>'}</section>`;
}
function historyPage(){const d=state.data,rows=d.summary.history;
 return head('09 · HORIZONTAL','Historial. <em>Lo aprendido permanece.</em>','Historial consolidado de calificaciones y créditos cursados.')+
 `<div class="stats" style="grid-template-columns:repeat(2,minmax(0,1fr))">${stat('PROMEDIO ACUMULADO',number(d.summary.papa),'Acumulado ponderado por créditos','purple')}
 ${stat('CRÉDITOS APROBADOS',d.summary.credits_approved,'Historial + definitivas aprobadas','lime')}</div>
 <div class="card"><div class="table-scroll"><table class="table"><thead><tr><th>Período</th><th>Materia</th><th>Créditos</th><th>Definitiva</th></tr></thead><tbody>
 ${rows.map(r=>`<tr><td>${escapeHtml(r.period)}</td><td>${escapeHtml(r.name)}<div class="tiny muted">${escapeHtml(r.code)}</div></td>
 <td>${r.credits}</td><td><span class="grade-val">${number(r.grade)}</span></td></tr>`).join('')}</tbody></table></div></div>`;
}
function profilePage(){const u=state.data.profile;const s=state.data.summary;
 const nameTiles=(u.full_name||'CRUZA').toUpperCase().replace(/[^A-Z]/g,'').slice(0,8).split('').map((c,i)=>`<span class="word-tile" style="--i:${i}">${c}</span>`).join('');
 return head('10 · VERTICAL','Perfil. <em>Identidad académica.</em>','Carné de estudiante y credenciales en el tablero.')+
 `<div class="stats">${stat('PROMEDIO ACUMULADO',number(s?.papa),'Calificación ponderada histórica','purple')}
 ${stat('SEMESTRE ACTUAL',escapeHtml(s?.period_label||'2026-2'),'Período académico vigente','lime')}
 ${stat('CRÉDITOS APROBADOS',s?.credits_approved||0,'Total créditos del plan','peach')}</div>
 <div class="grid-2"><section class="card canvas-grid"><div class="eyebrow">CARNÉ ACADÉMICO / CASILLAS</div><h2>${escapeHtml(u.full_name)}</h2>
 <div class="word-tiles" style="margin:14px 0" aria-hidden="true">${nameTiles}</div>
 <div class="list"><div class="item"><div><div class="mon muted">01 · USUARIO</div><strong>${escapeHtml(u.username)}</strong></div><span class="pill">Activo</span></div>
 <div class="item"><div><div class="mon muted">02 · CORREO INSTITUCIONAL</div><strong>${escapeHtml(u.email)}</strong></div></div>
 <div class="item"><div><div class="mon muted">03 · SEMESTRE Y PERÍODO</div><strong>${escapeHtml(s?.period_label||'2026-2')}</strong></div><span class="pill lime">Vigente</span></div>
 <div class="item"><div><div class="mon muted">04 · PROMEDIO PONDERADO</div><strong style="font-size:1.3rem;color:var(--ok)">${number(s?.papa)}</strong></div><span class="grade-val">${number(s?.papa)}</span></div>
 <div class="item"><div><div class="mon muted">05 · ROL DEL SISTEMA</div><strong>Estudiante (demostración)</strong></div></div></div></section>
 <section class="card"><h2>Acceso <em>personal.</em></h2><p class="muted">El estudiante puede consultar sus datos académicos y solicitar restablecimiento de contraseña ante administración.</p>
 <div class="crossword-calc" style="margin-top:16px"><div class="eyebrow" style="margin-bottom:8px">FIRMA EN CRUCIGRAMA</div>
 <div class="stair-grid" aria-hidden="true">${'CRUZA'.split('').map(c=>`<span>${c}</span>`).join('')}</div></div>
 </section></div>`;
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
 <section class="card"><h2>Directorio <em>de acceso.</em></h2><div class="table-scroll admin-users-table"><table class="table"><thead>
 <tr><th>Usuario</th><th>Rol</th><th>Estado</th><th>Intentos</th><th>Acciones</th></tr></thead><tbody>
 ${d.users.map(u=>`<tr><td data-label="Usuario"><strong>${escapeHtml(u.full_name)}</strong><div class="mon muted">${escapeHtml(u.username)}</div></td>
 <td data-label="Rol">${escapeHtml(roleNames[u.role])}</td><td data-label="Estado">${labelTag(u.status,u.status==='active'?'ok':u.status==='locked'?'danger':'pill-muted')}</td>
 <td data-label="Intentos">${u.failed}</td><td data-label="Acciones"><div class="row-left">
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
 document.body.append(overlay);
 // Connect labels and controls in dynamically opened forms (mouse, touch and screen readers).
 overlay.querySelectorAll('.field').forEach((field,i)=>{
  const label=field.querySelector('label'),control=field.querySelector('input,select,textarea');
  if(label&&control&&!control.getAttribute('aria-label')){
   if(!control.id)control.id=`modal-field-${i}`;
   if(!label.htmlFor)label.htmlFor=control.id;
  }
 });
 overlay.querySelector('input,button,select,textarea')?.focus();
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
 try{const res=await api(path,method,body);modalClose();await reloadData();notify(res.message||message);return res}
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
   const el=document.getElementById('hint');if(!el)return;el.hidden=!el.hidden;localStorage.setItem('cruza-hints',el.hidden?'0':'1');b.setAttribute('aria-pressed',String(!el.hidden));return;
 }
 if(action==='print-schedule'){window.print();return;}
 if(action==='logout'){
   try{await api('/logout','POST');state.user=null;state.csrf=null;state.data=null;document.documentElement.dataset.theme='light';renderLogin();try{localStorage.removeItem('cruza-theme')}catch{}notify('Sesión cerrada.')}catch(err){notify(err.message)}return;
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
 if(action==='cal-prev-month'){const parts=(state.calendarDate||'2026-11-11').split('-').map(Number);const d=new Date(parts[0],parts[1]-2,1);state.calendarDate=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-01`;render();return}
 if(action==='cal-next-month'){const parts=(state.calendarDate||'2026-11-11').split('-').map(Number);const d=new Date(parts[0],parts[1],1);state.calendarDate=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-01`;render();return}
 if(action==='activity-toggle')return changeServer(`/student/activities/${b.dataset.activityId}`,'PUT',{completed:b.dataset.done==='true'},'Estado de entrega actualizado.');
 if(action==='agenda-new')return modalAgenda();
 if(action==='agenda-preset')return modalAgenda(null,{title:'Recordatorio del día',due_date:b.dataset.day});
 if(action==='agenda-toggle-done'){state.agendaDone=b.dataset.done==='true';render();return}
 if(action==='agenda-edit')return modalAgenda(Number(b.dataset.agendaId));
 if(action==='agenda-complete'){const x=state.data.agenda.find(a=>a.id==Number(b.dataset.agendaId));
  return changeServer(`/student/agenda/${x.id}`,'PATCH',{done:b.dataset.done==='true'});}
 if(action==='agenda-delete')return modalConfirm('¿Eliminar definitivamente este recordatorio personal?',()=>changeServer(`/student/agenda/${b.dataset.agendaId}`,'DELETE'));
 if(action==='sim-quick'){
  const grade=Number(b.dataset.grade);const cid=Number(document.getElementById('simulate-course')?.value);
  updateSimulationFromInputs();state.courseSim.grade=grade;render();return;
 }
 if(action==='simulate'){
  const id=Number(document.getElementById('simulate-course')?.value),score=Number(document.getElementById('simulate-grade')?.value);
  if(!Number.isFinite(score)||score<0||score>5)return notify('La nota hipotética debe estar entre 0 y 5.');
  updateSimulationFromInputs();state.courseSim.grade=score;render();return;
 }
 if(action==='save-grade'){
  const sid=Number(b.dataset.studentId),eid=Number(b.dataset.evalId);const input=document.getElementById(`grade-${sid}-${eid}`);
  const val=input?input.value.trim():'';
  if(val!==''){
    const num=Number(val);
    if(!Number.isFinite(num)||num<0||num>5){
      if(num>5&&input)input.value='5';
      if(num<0&&input)input.value='0';
      return notify('La nota debe estar entre 0.0 y 5.0.');
    }
  }
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
 if(el.id==='simulate-course'){state.courseSim={courseId:Number(el.value),grade:4.5};render();return}
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
 if(['simulate-grade','simulate-cut-1','simulate-cut-2'].includes(e.target.id)){
  if(e.target.value!==''){
   const n=parseFloat(e.target.value);
   if(n>5){e.target.value='5';notify('La nota máxima es 5.0');}
   else if(n<0){e.target.value='0';notify('La nota mínima es 0.0');}
  }
  updateSimulationFromInputs();return;
 }
 if(e.target.id&&e.target.id.startsWith('grade-')){
  if(e.target.value!==''){
   const n=parseFloat(e.target.value);
   if(n>5){e.target.value='5';notify('La nota máxima es 5.0');}
   else if(n<0){e.target.value='0';notify('La nota mínima es 0.0');}
  }
  return;
 }
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
// Un único cálculo por fotograma, sin medir cada tarjeta en cada evento del ratón.
let cardLightFrame=0,cardLightTarget=null,cardLightX=0,cardLightY=0;
document.addEventListener('pointermove',e=>{
 if(e.pointerType!=='mouse'||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 const card=e.target.closest('.card');
 if(!card)return;
 cardLightTarget=card;cardLightX=e.clientX;cardLightY=e.clientY;
 if(cardLightFrame)return;
 cardLightFrame=requestAnimationFrame(()=>{
  cardLightFrame=0;
  if(!cardLightTarget||!cardLightTarget.isConnected)return;
  const r=cardLightTarget.getBoundingClientRect();
  if(!r.width||!r.height)return;
  cardLightTarget.style.setProperty('--mx',((cardLightX-r.left)/r.width*100).toFixed(1)+'%');
  cardLightTarget.style.setProperty('--my',((cardLightY-r.top)/r.height*100).toFixed(1)+'%');
 });
},{passive:true});
// Day/night preference: entirely local and not a security-sensitive setting.
function toggleTheme(){const next=document.documentElement.dataset.theme==='dark'?'light':'dark';
 document.documentElement.dataset.theme=next;localStorage.setItem('cruza-theme',next);notify(next==='dark'?'Modo noche activado':'Modo día activado');}
function applyTheme(){const saved=localStorage.getItem('cruza-theme');document.documentElement.dataset.theme=saved||'light';}
function toggleTool(){
 state.ambientTool=state.ambientTool==='pencil'?'crayon':'pencil';
 window.CruzaTools?.setMode(state.ambientTool);
 notify(state.ambientTool==='crayon'?'Crayón multicolor activado':'Lápiz de crucigrama activado');
}
/* El dibujo multicolor se gestiona en cruza-tools.js. Conservamos el gesto
   original de triángulo para cambiar entre lápiz y crayón en zonas libres. */
const prefersReduced=()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches;
function isFree(target){
 if(!target||target.closest('button,input,textarea,select,a,.card,.auth-form-card,.sidebar,.topbar,.hint-bar,.overlay'))return false;
 return !!target.closest('body,.auth-art,.workspace,.auth-scene,.page,.auth-copy');
}
let drawing=false,gesture=[];
document.addEventListener('pointerdown',e=>{
 if(e.pointerType!=='mouse'||prefersReduced()||!isFree(e.target))return;
 drawing=true;gesture=[[e.clientX,e.clientY]];
},{passive:true});
// Las pistas de cada elemento las administra cruza-ux.js; no duplicar listeners.
document.addEventListener('pointermove',e=>{
 if(!drawing)return;
 if(e.pointerType!=='mouse'||prefersReduced()||!isFree(e.target)){drawing=false;gesture=[];return;}
 gesture.push([e.clientX,e.clientY]);
 if(gesture.length>240)gesture=gesture.slice(-240);
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
 if(triangleGesture(gesture))toggleTool();gesture=[];},{passive:true});
document.addEventListener('pointercancel',()=>{drawing=false;gesture=[]},{passive:true});
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