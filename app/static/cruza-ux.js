/* CRUZA 3 · Interacciones de lectura, acceso y orientación contextual. */
(function () {
  'use strict';
  const html=document.documentElement;
  const app=document.getElementById('app');
  const levels=[0.9,1,1.12,1.2];
  const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
  function savedScale(){
    try {return Number(localStorage.getItem('cruza-font-scale'))||1;} catch {return 1;}
  }
  function fontScale(next){
    const level=levels.reduce((best,value)=>Math.abs(value-next)<Math.abs(best-next)?value:best,1);
    html.style.setProperty('--cruza-font-scale',String(level));
    html.dataset.fontScale=String(level);
    try {localStorage.setItem('cruza-font-scale',String(level));}catch{}
    const label=document.querySelector('[data-font-trigger]');
    if(label)label.title='Tamaño de letra: '+Math.round(level*100)+' %';
    document.querySelectorAll('[data-font-choice]').forEach(b=>{
      b.setAttribute('aria-pressed',String(Number(b.dataset.fontChoice)===level));
    });
    return level;
  }
  fontScale(savedScale());

  // El formulario conserva la animación de crucigrama, pero ya no reescribe
  // todos los nodos de las casillas después de cada pulsación de tecla.
  function refreshTiles(id){
    const input=document.getElementById(id);
    const holder=document.querySelector('[data-tiles="'+id+'"]');
    if(!input||!holder)return;
    const value=input.value,limit=14,overflow=value.length>=limit;
    const start=overflow?value.length-(limit-1):0;
    const count=overflow?limit:Math.max(1,value.length);
    const focused=document.activeElement===input,caret=input.selectionStart??value.length;
    const hidden=id==='auth-pass'&&input.type==='password';
    const tiles=[...holder.querySelectorAll(':scope > .auth-tile')];
    while(tiles.length>count){
      const tile=tiles.pop();
      if(!reduced()){
        const ghost=document.createElement('span');
        ghost.className='tile-ghost';
        ghost.textContent=tile.querySelector('.tile-letter')?.textContent||'';
        ghost.style.left=tile.offsetLeft+'px';
        ghost.style.top=tile.offsetTop+'px';
        holder.appendChild(ghost);
        setTimeout(()=>ghost.remove(),170);
      }
      tile.remove();
    }
    while(tiles.length<count){
      const tile=document.createElement('span');
      tile.className='auth-tile tile-enter';
      tile.style.setProperty('--i',String(Math.min(tiles.length,8)));
      const number=document.createElement('span');number.className='tile-num';
      const letter=document.createElement('span');letter.className='tile-letter';
      tile.append(number,letter);holder.appendChild(tile);tiles.push(tile);
    }
    for(let i=0;i<count;i++){
      const tile=tiles[i],ell=overflow&&i===0,index=overflow?start+i-1:i;
      const filled=ell||index<value.length;
      const display=ell?'…':filled?(hidden?'●':value[index].toUpperCase()):'';
      const number=ell?'…':String(index+1);
      let letter=tile.querySelector('.tile-letter');
      if(!letter){letter=document.createElement('span');letter.className='tile-letter';tile.appendChild(letter);}
      const num=tile.querySelector('.tile-num');
      if(letter.textContent!==display)letter.textContent=display;
      if(num.textContent!==number)num.textContent=number;
      tile.classList.toggle('filled',filled);
      tile.classList.toggle('is-empty',!filled);
      tile.classList.toggle('focused',focused&&(ell?caret<=start:caret===index||(index===value.length-1&&caret>=value.length)));
    }
    if(focused&&caret===value.length){
      const scroll=holder.closest('.tile-container');
      if(scroll)scroll.scrollLeft=scroll.scrollWidth;
    }
  }
  if(typeof window.tileRefresh==='function')window.tileRefresh=refreshTiles;

  const routeHelp={
    tablero:'Vuelve al mapa interactivo de CRUZA.',
    pensum:'Consulta tus asignaturas, créditos y avances por semestre.',
    inscripcion:'Selecciona grupos, revisa los cruces de horario y confirma tu matrícula.',
    horario:'Consulta las horas y salones de tus clases confirmadas.',
    calendario:'Explora fechas, clases y actividades del periodo académico.',
    agenda:'Organiza recordatorios sin modificar las calificaciones oficiales.',
    notas:'Consulta las notas y simula resultados sin alterar los registros.',
    asistencia:'Revisa o registra la asistencia según los permisos de tu rol.',
    historial:'Consulta el historial académico y los promedios ponderados.',
    perfil:'Consulta tu información académica y datos de cuenta.',
    estudiantes:'Administra las cuentas y aprobaciones de estudiantes.',
    recuperacion:'Gestiona solicitudes de recuperación y habilitación segura.',
    catalogo:'Consulta y administra materias, créditos y grupos.',
    auditoria:'Revisa los registros de cambios importantes.'
  };
  const actionHelp={
    theme:'Alterna los colores y contrastes entre los modos claro y oscuro.',
    tool:'Alterna entre el lápiz fino y el crayón de pigmento artístico.',
    'toggle-hints':'Muestra u oculta esta ayuda contextual.',
    logout:'Cierra tu sesión de forma segura.',
    'confirm-enroll':'Guarda la matrícula después de verificar horarios y cupos.',
    discard:'Descarta los cambios del borrador de inscripción.',
    'password-visibility':'Muestra u oculta la contraseña mientras escribes.',
    'font-size':'Ajusta el tamaño del texto sin ampliar toda la pantalla.',
    word:'Selecciona la palabra del crucigrama para abrir su módulo.',
    menu:'Abre la navegación entre secciones.'
  };
  function hintForElement(el){
    if(!(el instanceof Element))return '';
    const target=el.closest('[data-hint],[data-route],[data-action],[data-font-trigger],[data-font-choice],input,select,textarea,label');
    if(!target)return '';
    if(target.dataset.hint)return target.dataset.hint.slice(0,145);
    if(target.dataset.fontTrigger!==undefined||target.dataset.fontChoice!==undefined)return actionHelp['font-size'];
    if(target.dataset.route)return routeHelp[target.dataset.route]||'';
    if(target.dataset.action)return actionHelp[target.dataset.action]||'';
    if(target.id==='auth-user')return 'Escribe tu usuario para ingresar al campus.';
    if(target.id==='auth-pass')return 'Escribe tu contraseña. Los caracteres permanecen ocultos.';
    if(target.matches('select'))return 'Elige una opción de la lista.';
    return '';
  }
  let pointerHelp='',keyboardHelp='';
  function showHelp(){
    const dock=document.getElementById('hint');
    if(!dock||dock.hidden)return;
    const message=pointerHelp||keyboardHelp||'';
    if(dock.textContent!==message)dock.textContent=message;
    dock.classList.toggle('has-message',!!message);
  }
  document.addEventListener('pointerover',e=>{pointerHelp=hintForElement(e.target);showHelp();});
  document.addEventListener('pointerout',e=>{
    if(e.relatedTarget instanceof Element)pointerHelp=hintForElement(e.relatedTarget);
    else pointerHelp='';
    showHelp();
  });
  document.addEventListener('focusin',e=>{keyboardHelp=hintForElement(e.target);showHelp();});
  document.addEventListener('focusout',e=>{
    keyboardHelp=e.relatedTarget instanceof Element?hintForElement(e.relatedTarget):'';
    showHelp();
  });

  function enhance(){
    const controls=app?.querySelector('.topbar .controls');
    if(!controls)return;
    if(!controls.querySelector('[data-font-trigger]')){
      const wrapper=document.createElement('div');
      wrapper.className='cruza-font-controls';
      wrapper.innerHTML='<button type="button" class="btn-mini cruza-font-trigger" data-font-trigger aria-label="Ajustar tamaño de letra" aria-haspopup="true" aria-expanded="false" title="Tamaño de letra">A<span aria-hidden="true">±</span></button>'+
        '<div class="cruza-font-menu" data-font-menu hidden role="group" aria-label="Tamaño de letra">'+
        '<button type="button" data-font-choice="0.9" aria-label="Disminuir tamaño de letra">A−</button>'+
        '<button type="button" data-font-choice="1" aria-label="Tamaño de letra normal">A</button>'+
        '<button type="button" data-font-choice="1.12" aria-label="Aumentar tamaño de letra">A+</button>'+
        '</div>';
      const theme=controls.querySelector('[data-action="theme"]');
      if(theme)controls.insertBefore(wrapper,theme);else controls.prepend(wrapper);
    }
    const dock=document.getElementById('hint');
    if(dock){
      dock.setAttribute('aria-label','Ayuda contextual');
      dock.setAttribute('role','status');
      dock.textContent='';
      dock.classList.remove('has-message');
      pointerHelp='';keyboardHelp='';
    }
    fontScale(savedScale());
  }
  function closeMenu(){
    const menu=document.querySelector('[data-font-menu]');
    const trigger=document.querySelector('[data-font-trigger]');
    if(menu)menu.hidden=true;
    if(trigger)trigger.setAttribute('aria-expanded','false');
  }
  document.addEventListener('click',e=>{
    const trigger=e.target.closest('[data-font-trigger]');
    if(trigger){
      const menu=document.querySelector('[data-font-menu]');
      if(menu){menu.hidden=!menu.hidden;trigger.setAttribute('aria-expanded',String(!menu.hidden));}
      return;
    }
    const item=e.target.closest('[data-font-choice]');
    if(item){
      const value=Number(item.dataset.fontChoice);
      fontScale(value);closeMenu();document.querySelector('[data-font-trigger]')?.focus();return;
    }
    if(!e.target.closest('.cruza-font-controls'))closeMenu();
  });
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape')closeMenu();
  });
  if(app){
    new MutationObserver(enhance).observe(app,{childList:true});
    enhance();
  }

  // Actualizar el brillo del papel como máximo una vez por fotograma.
  let glowFrame=0,glowTarget=null,glowX=0,glowY=0;
  document.addEventListener('pointermove',e=>{
    if(e.pointerType!=='mouse'||reduced())return;
    const surface=e.target.closest('.workspace,.auth-art');
    if(!surface)return;
    glowTarget=surface;glowX=e.clientX;glowY=e.clientY;
    if(glowFrame)return;
    glowFrame=requestAnimationFrame(()=>{
      glowFrame=0;
      if(!glowTarget||!glowTarget.isConnected)return;
      const rect=glowTarget.getBoundingClientRect();
      glowTarget.style.setProperty('--glow-x',((glowX-rect.left)/rect.width*100).toFixed(1)+'%');
      glowTarget.style.setProperty('--glow-y',((glowY-rect.top)/rect.height*100).toFixed(1)+'%');
    });
  },{passive:true});
  window.CruzaUX={fontScale,refreshTiles,debug:()=>({scale:Number(html.dataset.fontScale||1),help:document.getElementById('hint')?.textContent||'',menuOpen:!document.querySelector('[data-font-menu]')?.hidden})};
})();
