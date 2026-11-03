"use strict";
const NS='http://www.w3.org/2000/svg';
const stage=document.getElementById('stage');
function fit(){const s=Math.min(innerWidth/1920,innerHeight/1080);stage.style.transform=`translate(-50%,-50%) scale(${s})`;}
addEventListener('resize',fit);fit();
const $=(r,q)=>r.querySelector(q),$$=(r,q)=>[...r.querySelectorAll(q)];
const fmt=(v,d=1)=>v.toLocaleString('pt-BR',{minimumFractionDigits:d,maximumFractionDigits:d});
const svgEl=(tag,attrs,parent)=>{const e=document.createElementNS(NS,tag);for(const k in attrs)e.setAttribute(k,attrs[k]);if(parent)parent.appendChild(e);return e;};

/* ---------- elementos temáticos ---------- */
function gearPath(cx,cy,R,n,h,hole){
  const st=2*Math.PI/n;let d='';
  for(let i=0;i<n;i++){const a=i*st;
    const p=[[R,a],[R+h,a+st*.15],[R+h,a+st*.45],[R,a+st*.6]];
    p.forEach(([r,t],j)=>{d+=(i===0&&j===0?'M':'L')+(cx+r*Math.cos(t)).toFixed(1)+' '+(cy+r*Math.sin(t)).toFixed(1)+' ';});}
  d+='Z ';
  d+=`M${cx+hole} ${cy} A${hole} ${hole} 0 1 0 ${cx-hole} ${cy} A${hole} ${hole} 0 1 0 ${cx+hole} ${cy} Z`;
  return d;
}
const DECO=`<svg class="deco" viewBox="0 0 1920 960" aria-hidden="true">
  <g class="g1"><g class="gin" style="transform-origin:1835px 70px"><g class="s1" style="transform-origin:1835px 70px"><path class="gear" d="${gearPath(1835,70,92,16,20,30)}"/></g></g></g>
  <g class="g2"><g class="gin" style="transform-origin:1698px 190px"><g class="s2" style="transform-origin:1698px 190px"><path class="gear" d="${gearPath(1698,190,46,9,16,14)}"/></g></g></g>
  <g class="gin" style="transform-origin:1880px 252px"><polygon class="bolt" points="1880,232 1898,242 1898,262 1880,272 1862,262 1862,242"/><circle class="bolt" cx="1880" cy="252" r="8"/></g>
  <path class="trace" d="M0 880 H150 L200 830 H330"/>
  <path class="trace" d="M0 916 H240 L272 884 H430"/>
  <path class="trace" d="M0 846 H70 L110 806 H180"/>
  <circle class="node" cx="330" cy="830" r="10"/><circle class="node" cx="430" cy="884" r="10"/><circle class="node" cx="180" cy="806" r="8"/>
  <path class="sig" d="M445 862 a26 26 0 0 1 0 44"/><path class="sig b" d="M458 848 a44 44 0 0 1 0 72"/>
  <path class="sig" d="M345 808 a26 26 0 0 1 0 44"/><path class="sig b" d="M358 794 a44 44 0 0 1 0 72"/>
</svg>`;

const slides=[...document.querySelectorAll('.slide')];
const N=slides.length;
slides.forEach(s=>{
  s.insertAdjacentHTML('afterbegin',DECO);
  s.querySelectorAll('.anim').forEach((el,i)=>el.style.setProperty('--i',Math.min(i,10)));
  s._ticks=[];s._enter=[];
});

/* ---------- navegação + menu de dias ---------- */
const prevB=document.getElementById('prev'),nextB=document.getElementById('next');
const themeLabel=document.getElementById('themeLabel'),counter=document.getElementById('counter');
const menu=document.getElementById('menu');
let cur=0,busy=false,enterT=performance.now();
function updateFooter(){
  const th=slides[cur].dataset.theme;
  if(themeLabel.textContent!==th){themeLabel.textContent=th;themeLabel.classList.remove('swap');void themeLabel.offsetWidth;themeLabel.classList.add('swap');}
  counter.textContent=(cur+1)+' / '+N;
  prevB.disabled=cur===0;nextB.disabled=cur===N-1;
}
function loadEmbeds(s){
  $$(s,'.embed[data-src],.embed[data-srcdoc]').forEach(e=>{
    if(e.querySelector('iframe'))return;
    const f=document.createElement('iframe');f.title=e.dataset.title||'Simulador';
    if(e.dataset.srcdoc)f.srcdoc=e.dataset.srcdoc;else f.src=e.dataset.src;
    f.setAttribute('allow','fullscreen; xr-spatial-tracking; gyroscope; accelerometer');f.setAttribute('allowfullscreen','');
    f.addEventListener('load',()=>{const ph=e.querySelector('.ph');if(ph)ph.remove();});
    e.appendChild(f);
  });
}
function activate(n){
  cur=n;const s=slides[n];s.classList.add('is-active');enterT=performance.now();
  updateFooter();loadEmbeds(s);s._enter.forEach(f=>f());
  history.replaceState(null,'','#'+(n+1));
}
function go(n){
  if(busy||n<0||n>=N||n===cur)return;
  busy=true;const old=slides[cur];
  old.classList.add('is-leaving');old.classList.remove('is-active');
  setTimeout(()=>{old.classList.remove('is-leaving');activate(n);busy=false;},420);
}
function jumpDay(d){const i=slides.findIndex(s=>s.dataset.day==String(d));if(i>=0){closeMenu();go(i);}}
function openMenu(){menu.classList.add('open');}
function closeMenu(){menu.classList.remove('open');}
// constrói o mapa de dias a partir das capas
const dayCards=slides.filter(s=>s.dataset.day).map(s=>{
  const d=s.dataset;const cls=d.kind==='av'?' av':d.kind==='pr'?' pr':'';
  return `<button class="daycard${cls}" data-go="${d.day}"><span class="n">Dia ${d.day}</span><span class="d">${d.date}</span><span class="t">${d.title}</span>${d.badge?`<span class="k">${d.badge}</span>`:''}</button>`;}).join('');
$$(document,'.daymap').forEach(m=>m.innerHTML=dayCards);
document.addEventListener('click',e=>{const b=e.target.closest('[data-go]');if(b)jumpDay(b.dataset.go);});
document.getElementById('menuBtn').addEventListener('click',()=>menu.classList.contains('open')?closeMenu():openMenu());
$(menu,'.close').addEventListener('click',closeMenu);
prevB.addEventListener('click',()=>go(cur-1));
nextB.addEventListener('click',()=>go(cur+1));
document.addEventListener('keydown',e=>{
  if(!e.target.matches)return;
  if(e.target.matches('input[type=range]')&&(e.key.startsWith('Arrow')))return;
  if(e.target.matches('input[type=number],input[type=text]'))return;
  if(e.key==='Escape'){closeMenu();return;}
  if(['ArrowRight','PageDown'].includes(e.key)){e.preventDefault();go(cur+1);}
  else if(['ArrowLeft','PageUp'].includes(e.key)){e.preventDefault();go(cur-1);}
  else if(e.key==='Home')go(0);
  else if(e.key==='End')go(N-1);
  else if(e.key==='m'||e.key==='M'){menu.classList.contains('open')?closeMenu():openMenu();}
  else if(e.key==='f'||e.key==='F'){if(!document.fullscreenElement)document.documentElement.requestFullscreen?.();else document.exitFullscreen?.();}
});
document.addEventListener('pointerup',e=>{
  if(e.pointerType!=='touch')return;
  if(e.target.closest('button,input,a,label,iframe,.embed,.w'))return;
  const r=stage.getBoundingClientRect();const x=(e.clientX-r.left)/r.width;
  if(x<0.18)go(cur-1);else if(x>0.82)go(cur+1);
});
document.addEventListener('click',e=>{const b=e.target.closest('[data-fs]');if(!b)return;
  const f=b.closest('.slide').querySelector('.embed:not([hidden]) iframe');if(f)f.requestFullscreen?.();});
const start=Math.min(Math.max(parseInt(location.hash.slice(1),10)||1,1),N)-1;

/* ---------- quiz genérico ---------- */
function makeQuiz(root,qs,opts){
  let i=0,score=0;
  function render(){
    if(i>=qs.length){
      root.innerHTML=`<p class="q-meta">Resultado</p><p class="q-text">${score} de ${qs.length} respostas corretas.</p>
      <div class="q-foot"><p class="q-feedback">${opts.end||''}</p><button class="btn ghost" data-r>Recomeçar</button></div>`;
      root.querySelector('[data-r]').onclick=()=>{i=0;score=0;render();};return;}
    const q=qs[i];const o=q.o||opts.options;const letters='ABCD';
    root.innerHTML=`<p class="q-meta">${opts.label||'Pergunta'} ${i+1} de ${qs.length}</p><p class="q-text">${q.q}</p>
      <div class="q-opts">${o.map((t,k)=>`<button class="q-opt" data-k="${k}">${opts.options?'':`<span class="k">${letters[k]}</span>`}<span>${t}</span></button>`).join('')}</div>
      <div class="q-foot"><p class="q-feedback" aria-live="polite"></p><button class="btn" data-n hidden>${i<qs.length-1?(opts.next||'Próxima pergunta'):'Ver resultado'}</button></div>`;
    const btns=[...root.querySelectorAll('.q-opt')],fb=root.querySelector('.q-feedback'),nx=root.querySelector('[data-n]');
    btns.forEach(b=>b.onclick=()=>{
      const k=+b.dataset.k;btns.forEach(x=>x.disabled=true);
      btns[q.a].classList.add('correct');
      if(k===q.a){score++;fb.innerHTML=`<b>Correto.</b>${q.e}`;}
      else{b.classList.add('wrong');fb.innerHTML=`<b>Incorreto.</b>${q.e}`;}
      nx.hidden=false;nx.focus({preventScroll:true});
    });
    nx.onclick=()=>{i++;render();};

  }
  render();
}

/* ===================== WIDGETS ===================== */
const W={};
const reg=(el,fn)=>el.closest('.slide')._ticks.push(fn);
const onEnter=(el,fn)=>el.closest('.slide')._enter.push(fn);
function holdBtn(b,set){
  const dn=e=>{e.preventDefault();b.setPointerCapture?.(e.pointerId);b.classList.add('down');set(true);};
  const up=()=>{b.classList.remove('down');set(false);};
  b.addEventListener('pointerdown',dn);b.addEventListener('pointerup',up);b.addEventListener('pointercancel',up);b.addEventListener('lostpointercapture',up);
  b.addEventListener('keydown',e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();b.classList.add('down');set(true);}});
  b.addEventListener('keyup',e=>{if(e.key===' '||e.key==='Enter'){up();}});
}

