/* ===================== FLUXOGRAMAS (window.FC) e DIAGRAMAS DE MONTAGEM (window.WR) ===================== */
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

/* ---------- fluxograma ----------
   FC.id={w,h,n:[[id,tipo,x,y,'texto|linha 2',largura?]],e:[[de,para,[rota],'rótulo']]}
   tipo: term | proc | io | dec | sub ; de/para aceitam 'id.lado' (t, b, l, r)
   rota: 'h:X' anda na horizontal até X, 'v:Y' anda na vertical até Y */
const FSZ={term:[240,62],proc:[330,74],io:[340,74],dec:[330,128],sub:[330,74]};
function fcNode(n){
  const [id,t,x,y,txt,w0]=n;const w=w0||FSZ[t][0],h=FSZ[t][1]+(txt.split('|').length>2?24:0);
  let shape;
  if(t==='term')shape=`<rect class="nd term" x="${x-w/2}" y="${y-h/2}" width="${w}" height="${h}" rx="${h/2}"/>`;
  else if(t==='dec')shape=`<polygon class="nd dec" points="${x},${y-h/2} ${x+w/2},${y} ${x},${y+h/2} ${x-w/2},${y}"/>`;
  else if(t==='io'){const k=18;shape=`<polygon class="nd io" points="${x-w/2+k},${y-h/2} ${x+w/2+k},${y-h/2} ${x+w/2-k},${y+h/2} ${x-w/2-k},${y+h/2}"/>`;}
  else if(t==='sub')shape=`<rect class="nd sub" x="${x-w/2}" y="${y-h/2}" width="${w}" height="${h}" rx="6"/><line class="nd sub" x1="${x-w/2+16}" y1="${y-h/2}" x2="${x-w/2+16}" y2="${y+h/2}"/><line class="nd sub" x1="${x+w/2-16}" y1="${y-h/2}" x2="${x+w/2-16}" y2="${y+h/2}"/>`;
  else shape=`<rect class="nd proc" x="${x-w/2}" y="${y-h/2}" width="${w}" height="${h}" rx="6"/>`;
  const ls=txt.split('|'),lh=25;
  const tx=ls.map((l,i)=>`<text class="tx${t==='term'?' w':''}" x="${x}" y="${y+(i-(ls.length-1)/2)*lh}">${esc(l)}</text>`).join('');
  return {svg:shape+tx,w,h,x,y,t};
}
function fcPort(N,ref,def){
  const [id,side0]=ref.split('.');const n=N[id];const s=side0||def;
  const hw=n.w/2,hh=n.h/2;
  return {s,p:s==='t'?[n.x,n.y-hh]:s==='b'?[n.x,n.y+hh]:s==='l'?[n.x-hw-(n.t==='io'?9:0),n.y]:[n.x+hw+(n.t==='io'?9:0),n.y]};
}
function drawFlow(el,F){
  const N={};let body='';
  F.n.forEach(n=>{const r=fcNode(n);N[n[0]]=r;body+=r.svg;});
  let edges='',labels='';
  (F.e||[]).forEach(([a,b,route=[],lab])=>{
    const A=fcPort(N,a,'b'),B=fcPort(N,b,'t');
    const pts=[A.p.slice()];let [cx,cy]=A.p;
    route.forEach(r=>{const [k,v]=r.split(':');if(k==='h')cx=+v;else cy=+v;pts.push([cx,cy]);});
    const [tx,ty]=B.p;
    if(B.s==='t'||B.s==='b'){if(cx!==tx){pts.push([tx,cy]);}}
    else{if(cy!==ty){pts.push([cx,ty]);}}
    pts.push([tx,ty]);
    edges+=`<polyline class="ed" points="${pts.map(p=>p.join(',')).join(' ')}" marker-end="url(#ah-${el._fid})"/>`;
    if(lab){const [x0,y0]=A.p;const dx=A.s==='r'?14:A.s==='l'?-14:12,dy=A.s==='b'?28:-12;
      labels+=`<text class="el" x="${x0+dx}" y="${y0+dy}" text-anchor="${A.s==='l'?'end':'start'}">${esc(lab)}</text>`;}
  });
  el.innerHTML=`<svg class="fc" viewBox="0 0 ${F.w} ${F.h}" role="img" aria-label="${esc(F.label||'Fluxograma')}">
    <defs><marker id="ah-${el._fid}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="#525B70"/></marker></defs>
    ${edges}${body}${labels}${(F.t||[]).map(([x,y,t,a])=>`<text class="el" style="fill:#8A92A6" x="${x}" y="${y}" text-anchor="${a||'middle'}">${esc(t)}</text>`).join('')}</svg>`;
}

/* ---------- diagrama de montagem ----------
   WR.id={w,h,p:[[tipo,nome,x,y,{opções}]],f:[[cor,'A.pino','v:Y','h:X',[x,y],'B.pino']],t:[[x,y,'texto',classe]]}
   cada peça devolve o desenho e as coordenadas dos pinos; os fios são desenhados entre as peças e os pontos de pino */
const COR={r:'#D62828',k:'#222',o:'#E8490F',b:'#2B6CD9',g:'#2F9E44',y:'#D9A400',p:'#8E44AD',c:'#0E9AA7',w:'#8A92A6'};
const P={};
const lbl=(x,y,t,a='middle',c='lbl')=>`<text class="${c}" x="${x}" y="${y}" text-anchor="${a}">${esc(t)}</text>`;
P.uno=(x,y)=>{
  const W=640,H=420,pins={};let s='';
  s+=`<rect x="${x-34}" y="${y+40}" width="92" height="82" rx="6" fill="#B8BEC9" stroke="#8A92A6" stroke-width="3"/>`;
  s+=`<rect x="${x-22}" y="${y+300}" width="70" height="66" rx="8" fill="#2B2B2B"/>`;
  s+=`<rect x="${x}" y="${y}" width="${W}" height="${H}" rx="16" fill="#00878F" stroke="#00666C" stroke-width="4"/>`;
  s+=`<rect x="${x+300}" y="${y+210}" width="230" height="64" rx="4" fill="#1E1E1E"/>`+lbl(x+415,y+250,'ATmega328P','middle','sm').replace('class="sm"','class="sm" fill="#ddd" style="fill:#C9CED9"');
  s+=`<text x="${x+150}" y="${y+232}" font-size="34" font-weight="700" fill="#fff" font-style="italic">UNO</text><text x="${x+150}" y="${y+262}" font-size="20" fill="#E6FAFB">ARDUINO</text>`;
  s+=`<circle cx="${x+580}" cy="${y+40}" r="8" fill="#F7D26A"/><text x="${x+596}" y="${y+46}" font-size="16" fill="#fff">L</text>`;
  const top=['AREF','GND','13','12','~11','~10','~9','8','','7','~6','~5','4','~3','2','1','0'];
  const bot=['IOREF','RESET','3.3V','5V','GND','GND','VIN','','A0','A1','A2','A3','A4','A5'];
  const hdr=(arr,x0,py,up)=>{let k=0,g=0;
    s+=`<rect x="${x0-16}" y="${py-14}" width="${arr.filter(a=>a).length*27+14+6}" height="28" fill="#1E1E1E" rx="3"/>`;
    arr.forEach(a=>{if(!a){g+=14;return;}const px=x0+k*27+g;k++;
      let key=a.replace('~','').replace('.','V').replace('3VV','3V3');if(key==='3V3V')key='3V3';
      if(pins[key])key=key+'b';if(pins[key])key=key.slice(0,-1)+'c';
      pins[key]=[px,py];
      const t=a.replace('~','');
      if(a[0]==='~')s+=`<text x="${px}" y="${py+30}" font-size="18" font-weight="700" fill="#F7D26A" text-anchor="middle">~</text>`;
      s+=`<text x="${px}" y="${up?py+40:py-22}" font-size="15" font-weight="700" fill="#fff" transform="rotate(-90 ${px} ${up?py+40:py-22})" text-anchor="${up?'end':'start'}" dominant-baseline="central">${t}</text>`;});
  };
  hdr(top,x+150,y+26,true);hdr(bot,x+228,y+H-26,false);
  return {s,pins};
};
P.led=(x,y,o={})=>{const c=o.c||'#E8490F';
  const s=`<path d="M${x-10} ${y+64} V${y+30} M${x+10} ${y+56} V${y+30}" stroke="#8A92A6" stroke-width="4"/>
  <path d="M${x-20} ${y+30} V${y} a20 20 0 0 1 40 0 V${y+30} Z" fill="${c}" stroke="#00000033" stroke-width="3"/>
  <rect x="${x-24}" y="${y+26}" width="48" height="8" rx="2" fill="${c}"/>`+lbl(x-10,y+88,'+','middle','sm')+(o.l?lbl(x,y-30,o.l):'');
  return {s,pins:{a:[x-10,y+64],k:[x+10,y+56]}};};
P.res=(x,y,o={})=>{const v=o.v;const L=110;const ex=v?x:x+L,ey=v?y+L:y;
  const bx=v?x-11:x+25,by=v?y+25:y-11,bw=v?22:60,bh=v?60:22;
  const bands=(o.bands||['#8B4513','#222','#8B4513']).map((c,i)=>v?`<rect x="${x-11}" y="${y+33+i*13}" width="22" height="6" fill="${c}"/>`:`<rect x="${x+33+i*13}" y="${y-11}" width="6" height="22" fill="${c}"/>`).join('');
  const s=`<line x1="${x}" y1="${y}" x2="${ex}" y2="${ey}" stroke="#8A92A6" stroke-width="4"/><rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="10" fill="#E8D2A6" stroke="#B89B66" stroke-width="2"/>${bands}`+
    (o.l?(v?lbl(x+22,y+L/2+6,o.l,'start'):lbl(x+L/2,y-22,o.l)):'');
  return {s,pins:{a:[x,y],b:[ex,ey]}};};
P.btn=(x,y,o={})=>{const s=`<path d="M${x-18} ${y+30} V${y+46} M${x+18} ${y+30} V${y+46}" stroke="#8A92A6" stroke-width="4"/>
  <rect x="${x-32}" y="${y-30}" width="64" height="62" rx="6" fill="#2B2B2B"/><circle cx="${x}" cy="${y}" r="19" fill="${o.c||'#C9CED9'}" stroke="#111" stroke-width="2"/>`+(o.l?lbl(x,y-44,o.l):'');
  return {s,pins:{a:[x-18,y+46],b:[x+18,y+46]}};};
P.pot=(x,y,o={})=>{const s=`<path d="M${x-26} ${y+30} V${y+64} M${x} ${y+30} V${y+64} M${x+26} ${y+30} V${y+64}" stroke="#8A92A6" stroke-width="4"/>
  <rect x="${x-42}" y="${y-30}" width="84" height="62" rx="8" fill="#2B6CD9"/><circle cx="${x}" cy="${y}" r="22" fill="#E6E9F5" stroke="#1A2366" stroke-width="3"/><line x1="${x}" y1="${y}" x2="${x+12}" y2="${y-16}" stroke="#1A2366" stroke-width="5" stroke-linecap="round"/>`+
  lbl(x-26,y+86,'1','middle','sm')+lbl(x,y+86,'S','middle','sm')+lbl(x+26,y+86,'3','middle','sm')+(o.l?lbl(x,y-44,o.l):'');
  return {s,pins:{p1:[x-26,y+64],w:[x,y+64],p3:[x+26,y+64]}};};
P.ldr=(x,y,o={})=>{const s=`<path d="M${x-10} ${y+20} V${y+60} M${x+10} ${y+20} V${y+60}" stroke="#8A92A6" stroke-width="4"/>
  <circle cx="${x}" cy="${y}" r="24" fill="#F3E3C3" stroke="#B89B66" stroke-width="3"/><path d="M${x-14} ${y-8} h8 v8 h8 v8 h8 v-8 h4" fill="none" stroke="#C0392B" stroke-width="3"/>
  <path d="M${x-50} ${y-44} l18 18 M${x-38} ${y-52} l18 18" stroke="#E8490F" stroke-width="3" marker-end=""/>`+(o.l?lbl(x+34,y-30,o.l,'start'):'');
  return {s,pins:{a:[x-10,y+60],b:[x+10,y+60]}};};
P.rele=(x,y,o={})=>{const s=`<rect x="${x}" y="${y}" width="250" height="160" rx="10" fill="#1F4EA8" stroke="#163A80" stroke-width="3"/>
  <rect x="${x+60}" y="${y+20}" width="110" height="90" rx="6" fill="#2F6FE0" stroke="#0F2E70" stroke-width="3"/>${lbl(x+115,y+60,'RELÉ','middle','sm').replace('class="sm"','class="sm" style="fill:#fff;font-weight:700"')}${lbl(x+115,y+82,'5 V · 10 A','middle','sm').replace('class="sm"','class="sm" style="fill:#DDE6FF"')}
  <circle cx="${x+40}" cy="${y+135}" r="8" fill="${o.on?'#FF4136':'#7A1E1E'}"/>
  <rect x="${x+196}" y="${y+14}" width="44" height="132" rx="4" fill="#2F9E44"/>
  ${['VCC','GND','IN'].map((t,i)=>`<text x="${x+12}" y="${y+46+i*36}" font-size="16" font-weight="700" fill="#fff">${t}</text>`).join('')}
  ${['NA','COM','NF'].map((t,i)=>`<text x="${x+190}" y="${y+46+i*36}" font-size="16" font-weight="700" fill="#fff" text-anchor="end">${t}</text>`).join('')}`+(o.l?lbl(x+125,y-16,o.l):'');
  return {s,pins:{VCC:[x,y+40],GND:[x,y+76],IN:[x,y+112],NA:[x+250,y+40],COM:[x+250,y+76],NF:[x+250,y+112]}};};
P.sonar=(x,y,o={})=>{const s=`<rect x="${x}" y="${y}" width="250" height="110" rx="8" fill="#1F4EA8" stroke="#163A80" stroke-width="3"/>
  ${[x+62,x+188].map(c=>`<circle cx="${c}" cy="${y+48}" r="38" fill="#C9CED9" stroke="#8A92A6" stroke-width="4"/><circle cx="${c}" cy="${y+48}" r="24" fill="#3A3F4F"/>`).join('')}
  ${['VCC','TRIG','ECHO','GND'].map((t,i)=>`<text x="${x+65+i*40}" y="${y+102}" font-size="11" font-weight="700" fill="#fff" text-anchor="middle">${t}</text><path d="M${x+65+i*40} ${y+110} V${y+130}" stroke="#8A92A6" stroke-width="4"/>`).join('')}`+(o.l?lbl(x+125,y-16,o.l):'');
  return {s,pins:{VCC:[x+65,y+130],TRIG:[x+105,y+130],ECHO:[x+145,y+130],GND:[x+185,y+130]}};};
P.lamp=(x,y,o={})=>{const s=`<path d="M${x-14} ${y+64} V${y+86} M${x+14} ${y+64} V${y+86}" stroke="#8A92A6" stroke-width="4"/>
  <circle cx="${x}" cy="${y}" r="42" fill="#FFF3B0" stroke="#D9A400" stroke-width="4"/><path d="M${x-12} ${y+10} q12 -30 24 0" fill="none" stroke="#8A6D00" stroke-width="3"/>
  <rect x="${x-24}" y="${y+36}" width="48" height="30" rx="4" fill="#B8BEC9" stroke="#8A92A6" stroke-width="3"/>`+(o.l?lbl(x,y-56,o.l):'');
  return {s,pins:{a:[x-14,y+86],b:[x+14,y+86]}};};
P.rede=(x,y,o={})=>{const s=`<rect x="${x}" y="${y}" width="150" height="120" rx="12" fill="#FDE7DD" stroke="#E8490F" stroke-width="4"/>
  <circle cx="${x+50}" cy="${y+52}" r="9" fill="#1A2366"/><circle cx="${x+100}" cy="${y+52}" r="9" fill="#1A2366"/>
  ${lbl(x+75,y+96,o.t||'127 V~','middle','lbl')}${lbl(x+40,y+26,'F','middle','sm')}${lbl(x+110,y+26,'N','middle','sm')}`+(o.l?lbl(x+75,y-16,o.l):'');
  return {s,pins:{F:[x+150,y+34],N:[x+150,y+86]}};};
P.tmp36=(x,y,o={})=>{const s=`<path d="M${x-20} ${y+30} V${y+70} M${x} ${y+30} V${y+70} M${x+20} ${y+30} V${y+70}" stroke="#8A92A6" stroke-width="4"/>
  <path d="M${x-32} ${y+30} V${y-6} a32 32 0 0 1 64 0 V${y+30} Z" fill="#2B2B2B"/>${lbl(x,y+14,'TMP36','middle','sm').replace('class="sm"','class="sm" style="fill:#fff;font-size:12px"')}
  ${lbl(x-20,y+90,'+Vs','middle','sm')}${lbl(x+2,y+90,'Vo','middle','sm')}${lbl(x+24,y+90,'GND','start','sm')}`+(o.l?lbl(x,y-46,o.l):'');
  return {s,pins:{vs:[x-20,y+70],out:[x,y+70],gnd:[x+20,y+70]}};};
P.npn=(x,y,o={})=>{const s=`<circle cx="${x}" cy="${y}" r="38" fill="#fff" stroke="#1A2366" stroke-width="4"/>
  <line x1="${x-14}" y1="${y-24}" x2="${x-14}" y2="${y+24}" stroke="#1A2366" stroke-width="6"/><line x1="${x-60}" y1="${y}" x2="${x-14}" y2="${y}" stroke="#1A2366" stroke-width="4"/>
  <path d="M${x-14} ${y-10} L${x+16} ${y-30} V${y-60} M${x-14} ${y+10} L${x+16} ${y+30} V${y+60}" fill="none" stroke="#1A2366" stroke-width="4"/>
  <path d="M${x+16} ${y+30} l-16 -2 l7 -12 z" fill="#1A2366"/>`+lbl(x+30,y-40,'C','start','sm')+lbl(x-56,y-10,'B','start','sm')+lbl(x+30,y+50,'E','start','sm')+(o.l?lbl(x+46,y+6,o.l,'start'):'');
  return {s,pins:{B:[x-60,y],C:[x+16,y-60],E:[x+16,y+60]}};};
P.diodo=(x,y,o={})=>{const s=`<line x1="${x}" y1="${y}" x2="${x}" y2="${y+100}" stroke="#1A2366" stroke-width="4"/><path d="M${x-20} ${y+64} H${x+20} L${x} ${y+36} Z" fill="#1A2366"/><line x1="${x-20}" y1="${y+34}" x2="${x+20}" y2="${y+34}" stroke="#1A2366" stroke-width="5"/>`+(o.l?lbl(x+28,y+56,o.l,'start'):'');
  return {s,pins:{k:[x,y],a:[x,y+100]}};};
P.motor=(x,y,o={})=>{const s=`<path d="M${x-14} ${y+40} V${y+70} M${x+14} ${y+40} V${y+70}" stroke="#8A92A6" stroke-width="4"/>
  <circle cx="${x}" cy="${y}" r="44" fill="#E6E9F5" stroke="#525B70" stroke-width="4"/><text x="${x}" y="${y+12}" font-size="34" font-weight="700" fill="#1A2366" text-anchor="middle">M</text>`+(o.l?lbl(x,y-58,o.l):'');
  return {s,pins:{a:[x-14,y+70],b:[x+14,y+70]}};};
P.lcd=(x,y,o={})=>{const s=`<rect x="${x}" y="${y}" width="440" height="160" rx="10" fill="#2F9E44" stroke="#1E7031" stroke-width="3"/>
  <rect x="${x+70}" y="${y+28}" width="340" height="104" rx="6" fill="#1A2366"/>
  <text x="${x+86}" y="${y+70}" font-family="JetBrains Mono, monospace" font-size="26" fill="#C8F0FF">${esc(o.l1||'Distancia:')}</text><text x="${x+86}" y="${y+112}" font-family="JetBrains Mono, monospace" font-size="26" fill="#C8F0FF">${esc(o.l2||'23.5 cm')}</text>
  ${['GND','VCC','SDA','SCL'].map((t,i)=>`<text x="${x+12}" y="${y+36+i*32}" font-size="14" font-weight="700" fill="#fff">${t}</text>`).join('')}`+(o.l?lbl(x+220,y-16,o.l):'');
  return {s,pins:{GND:[x,y+32],VCC:[x,y+64],SDA:[x,y+96],SCL:[x,y+128]}};};
P.trilho=(x,y,o={})=>{const w=o.w||600;const s=`<rect x="${x}" y="${y-22}" width="${w}" height="64" rx="8" fill="#F5F6F9" stroke="#D3D8E3" stroke-width="3"/>
  <line x1="${x+14}" y1="${y}" x2="${x+w-14}" y2="${y}" stroke="#D62828" stroke-width="3" stroke-dasharray="2 10" stroke-linecap="round"/>
  <line x1="${x+14}" y1="${y+22}" x2="${x+w-14}" y2="${y+22}" stroke="#2B6CD9" stroke-width="3" stroke-dasharray="2 10" stroke-linecap="round"/>
  ${lbl(x-12,y+6,'+','end','lbl')}${lbl(x-12,y+30,'−','end','lbl')}`;
  return {s,pins:{}};};
P.zona=(x,y,o={})=>({s:`<rect x="${x}" y="${y}" width="${o.w}" height="${o.h}" rx="14" fill="#FDE7DD" fill-opacity=".45" stroke="#E8490F" stroke-width="3" stroke-dasharray="12 8"/>`+(o.l?`<text x="${x+o.w-12}" y="${y+o.h-12}" font-size="17" font-weight="700" fill="#B8380A" text-anchor="end">${esc(o.l)}</text>`:''),pins:{}});
function drawWiring(el,D){
  const pins={};let parts='',dots='';
  (D.p||[]).forEach(([t,nm,x,y,o])=>{const r=P[t](x,y,o||{});parts+=r.s;for(const k in r.pins){pins[nm+'.'+k]=r.pins[k];dots+=`<circle class="pin" cx="${r.pins[k][0]}" cy="${r.pins[k][1]}" r="6"/>`;}});
  const pt=r=>{if(Array.isArray(r))return r;if(!pins[r])throw new Error('pino '+r);return pins[r];};
  let wires='',jn='';
  (D.f||[]).forEach(f=>{const [c,...seq]=f;const pts=[];let cx,cy;
    seq.forEach((r,i)=>{
      if(typeof r==='string'&&/^[hv]:/.test(r)){const [k,v]=r.split(':');if(k==='h')cx=+v;else cy=+v;pts.push([cx,cy]);return;}
      const p=pt(r);
      if(i>0&&cx!==p[0]&&cy!==p[1])pts.push([p[0],cy]);
      pts.push(p);[cx,cy]=p;
      if(Array.isArray(r)&&(i===0||i===seq.length-1))jn+=`<circle class="jn" cx="${p[0]}" cy="${p[1]}" r="8" fill="${COR[c]||c}"/>`;
    });
    wires+=`<polyline class="wire" stroke="${COR[c]||c}" points="${pts.map(p=>p.join(',')).join(' ')}"/>`;
  });
  const texts=(D.t||[]).map(([x,y,t,c,a])=>lbl(x,y,t,a||'middle',c||'sm')).join('');
  el.innerHTML=`<svg class="wr" viewBox="0 0 ${D.w} ${D.h}" role="img" aria-label="${esc(D.label||'Diagrama de montagem')}">${parts}${wires}${dots}${jn}${texts}</svg>`;
}
let fid=0;
W.flow=el=>{el._fid=++fid;const F=window.FC[el.dataset.f];if(F)drawFlow(el,F);else console.error('fluxograma',el.dataset.f);};
W.wiring=el=>{const D=window.WR[el.dataset.d];if(D)drawWiring(el,D);else console.error('diagrama',el.dataset.d);};
