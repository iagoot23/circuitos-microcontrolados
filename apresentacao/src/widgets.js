/* ===================== WIDGETS DE MICROCONTROLADORES ===================== */
const bin8=v=>(v&255).toString(2).padStart(8,'0');
const hex2=v=>'0x'+(v&255).toString(16).toUpperCase().padStart(2,'0');

/* ----- operações bit a bit com dois bytes ----- */
W.bits=el=>{
  let A=0b00101101,B=0b00001111,op='&';
  const OPS={'&':['A & B',(a,b)=>a&b],'|':['A | B',(a,b)=>a|b],'^':['A ^ B',(a,b)=>a^b],'~':['~A',a=>~a&255],'<<':['A << 1',a=>(a<<1)&255],'>>':['A >> 1',a=>a>>1]};
  const head='<span></span>'+[7,6,5,4,3,2,1,0].map(i=>`<span class="bh">bit ${i}</span>`).join('')+'<span></span>';
  const row=(n,cls)=>`<span class="nm">${n}</span>`+[7,6,5,4,3,2,1,0].map(i=>cls==='rb'?`<span class="rb" data-b="${i}"></span>`:`<button type="button" data-r="${n}" data-b="${i}"></button>`).join('')+`<span class="val" data-v="${n}"></span>`;
  el.innerHTML=`<div class="seg">${Object.keys(OPS).map(k=>`<button type="button" data-op="${k}">${OPS[k][0]}</button>`).join('')}</div>
    <div class="bits">${head}${row('A')}${row('B')}<hr>${row('R','rb')}</div><div class="codeline"></div>`;
  const draw=()=>{
    const f=OPS[op][1],R=f(A,B);
    $$(el,'button[data-r]').forEach(b=>{const v=b.dataset.r==='A'?A:B;const on=(v>>b.dataset.b)&1;b.textContent=on;b.classList.toggle('on',!!on);
      b.disabled=b.dataset.r==='B'&&['~','<<','>>'].includes(op);b.style.opacity=b.disabled?.35:1;});
    $$(el,'.rb').forEach(b=>{const on=(R>>b.dataset.b)&1;b.textContent=on;b.classList.toggle('on',!!on);});
    const val=(n,v)=>$(el,`[data-v="${n}"]`).innerHTML=`<b>${v}</b> · ${hex2(v)}`;
    val('A',A);val('B',B);val('R',R);
    $$(el,'[data-op]').forEach(b=>b.classList.toggle('on',b.dataset.op===op));
    $(el,'.codeline').innerHTML=`byte R = ${OPS[op][0]};  <span class="cm">// 0b${bin8(R)} = ${R}</span>`;
  };
  el.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
    if(b.dataset.op){op=b.dataset.op;}else if(b.dataset.r){const m=1<<b.dataset.b;if(b.dataset.r==='A')A^=m;else B^=m;}draw();});
  draw();
};

/* ----- potenciômetro → ADC → map → PWM → LED ----- */
W.adc=el=>{
  el.innerHTML=`<div class="two mid" style="grid-template-columns:1fr 1fr;gap:40px">
    <div><svg viewBox="0 0 760 420" class="pwmsvg">
      <text x="10" y="34" font-size="24" font-weight="700" fill="#1A2366">Saída no pino ~9 (PWM, ≈ 490 Hz)</text>
      <line x1="60" y1="300" x2="740" y2="300" stroke="#D3D8E3" stroke-width="3"/><line x1="60" y1="90" x2="740" y2="90" stroke="#D3D8E3" stroke-width="3" stroke-dasharray="8 8"/>
      <text x="50" y="96" font-size="20" fill="#525B70" text-anchor="end">5 V</text><text x="50" y="306" font-size="20" fill="#525B70" text-anchor="end">0 V</text>
      <polyline class="wave" fill="none" stroke="#E8490F" stroke-width="6" stroke-linejoin="round"/>
      <line class="avg" x1="60" x2="740" stroke="#27348B" stroke-width="4" stroke-dasharray="14 10"/>
      <text class="avgt" x="740" font-size="20" font-weight="700" fill="#27348B" text-anchor="end"></text>
      <g transform="translate(150 370)"><circle class="glow" r="40" fill="#E8490F"/><circle r="22" fill="#fff" stroke="#E8490F" stroke-width="4" class="ledc"/></g>
      <text x="210" y="378" font-size="22" fill="#525B70">brilho do LED de carga</text>
    </svg></div>
    <div class="wpanel">
      <div class="ctrl"><label>Potenciômetro (entrada A0) <span class="vv"></span></label><input type="range" min="0" max="1023" value="512" aria-label="Posição do potenciômetro"></div>
      <div class="ro" style="--c:2">
        <div><b class="r1"></b><span>analogRead(A0)</span></div>
        <div><b class="r2"></b><span>map(…, 0, 255)</span></div>
        <div><b class="o r3"></b><span>ciclo de trabalho</span></div>
        <div><b class="r4"></b><span>tensão média na saída</span></div>
      </div>
      <p class="wtext"></p>
    </div></div>`;
  const s=$(el,'input');
  const up=()=>{
    const a=+s.value,v=a*5/1023,p=Math.round(a*255/1023),d=p/255;
    $(el,'.vv').textContent=v.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})+' V';
    $(el,'.r1').textContent=a;$(el,'.r2').textContent=p;$(el,'.r3').textContent=Math.round(d*100)+' %';$(el,'.r4').textContent=fmt(d*5,2)+' V';
    const T=680/4;let pts=[];for(let i=0;i<4;i++){const x0=60+i*T,x1=x0+T*d;
      if(d<=0)pts.push([x0,300],[x0+T,300]);else if(d>=1)pts.push([x0,90],[x0+T,90]);
      else pts.push([x0,300],[x0,90],[x1,90],[x1,300],[x0+T,300]);}
    $(el,'.wave').setAttribute('points',pts.map(p=>p.join(',')).join(' '));
    const y=300-210*d;$(el,'.avg').setAttribute('y1',y);$(el,'.avg').setAttribute('y2',y);
    $(el,'.avgt').setAttribute('y',y-12);$(el,'.avgt').textContent='média ≈ '+fmt(d*5,2)+' V';
    $(el,'.glow').setAttribute('opacity',.08+.9*d);$(el,'.ledc').setAttribute('fill',d>0.02?`rgba(232,73,15,${.25+.75*d})`:'#fff');
    $(el,'.wtext').innerHTML=`O LED fica ligado <b>${Math.round(d*100)} %</b> do tempo. Como a troca é muito rápida, o olho percebe a <b>média</b>: brilho ${d<.15?'fraco':d<.6?'médio':'forte'}.`;
  };
  s.addEventListener('input',up);up();
};

/* ----- LDR em divisor de tensão com histerese ----- */
W.ldr=el=>{
  const LIM=300,H=30;let aceso=false;
  el.innerHTML=`<div class="two mid" style="grid-template-columns:1fr 1fr;gap:40px">
    <svg viewBox="0 0 760 420">
      <rect class="sky" x="0" y="0" width="760" height="420" rx="16"/>
      <circle class="sun" cx="640" cy="90" r="46" fill="#F7D26A"/>
      <text x="30" y="50" font-size="24" font-weight="700" class="skyt">Leitura em A0 (0 a 1023)</text>
      <rect x="30" y="80" width="520" height="40" rx="8" fill="#fff" stroke="#D3D8E3" stroke-width="3"/>
      <rect class="bar" x="30" y="80" height="40" rx="8" fill="#27348B"/>
      <rect x="${30+520*(LIM-H)/1023}" y="72" width="${520*2*H/1023}" height="56" fill="#E8490F" opacity=".35"/>
      <line x1="${30+520*LIM/1023}" y1="66" x2="${30+520*LIM/1023}" y2="134" stroke="#E8490F" stroke-width="4"/>
      <text x="${30+520*LIM/1023}" y="160" font-size="19" fill="#B8380A" text-anchor="middle" font-weight="700">limiar 300 ± 30</text>
      <g transform="translate(200 290)"><circle class="glow" r="70" fill="#F7D26A" opacity="0"/><path d="M-26 30 V-4 a26 26 0 0 1 52 0 V30 Z" class="bulb" fill="#fff" stroke="#D9A400" stroke-width="5"/>
      <path d="M-14 30 V64 M14 30 V56" stroke="#8A92A6" stroke-width="5"/></g>
      <text class="skyt st" x="290" y="300" font-size="30" font-weight="700"></text>
    </svg>
    <div class="wpanel">
      <div class="ctrl"><label>Luz no ambiente <span class="lv"></span></label><input type="range" min="0" max="100" value="70" aria-label="Luz no ambiente"></div>
      <div class="ro" style="--c:2">
        <div><b class="r1"></b><span>resistência do LDR</span></div>
        <div><b class="r2"></b><span>tensão em A0</span></div>
        <div><b class="o r3"></b><span>analogRead(A0)</span></div>
        <div><b class="r4"></b><span>LED (pino 8)</span></div>
      </div>
      <p class="wtext"></p>
    </div></div>`;
  const s=$(el,'input');
  const up=()=>{
    const L=+s.value/100,R=100000*Math.pow(0.01,L)+400,V=5*10000/(R+10000),a=Math.round(V*1023/5);
    if(!aceso&&a<LIM-H)aceso=true;else if(aceso&&a>LIM+H)aceso=false;
    $(el,'.lv').textContent=Math.round(L*100)+' %';
    $(el,'.r1').textContent=R>=1000?fmt(R/1000,1)+' kΩ':Math.round(R)+' Ω';$(el,'.r2').textContent=fmt(V,2)+' V';$(el,'.r3').textContent=a;
    $(el,'.r4').textContent=aceso?'ACESO':'apagado';
    $(el,'.bar').setAttribute('width',Math.max(8,520*a/1023));
    const sky=`rgb(${Math.round(20+215*L)},${Math.round(25+220*L)},${Math.round(70+180*L)})`;$(el,'.sky').setAttribute('fill',sky);
    $(el,'.sun').setAttribute('opacity',L);$$(el,'.skyt').forEach(t=>t.setAttribute('fill',L>.45?'#1A2366':'#fff'));
    $(el,'.glow').setAttribute('opacity',aceso?.5:0);$(el,'.bulb').setAttribute('fill',aceso?'#F7D26A':'#fff');
    $(el,'.st').textContent=aceso?'Escuro: LED aceso':'Claro: LED apagado';
    $(el,'.wtext').innerHTML=a>=LIM-H&&a<=LIM+H?'<b>Faixa de histerese:</b> o LED mantém o estado anterior, sem piscar.':aceso?'Pouca luz → LDR com resistência <b>alta</b> → tensão em A0 <b>baixa</b>.':'Muita luz → LDR com resistência <b>baixa</b> → tensão em A0 <b>alta</b>.';
  };
  s.addEventListener('input',up);up();
};

/* ----- bancada virtual da prática 1: relé, botões e ultrassônico ----- */
W.sonar=el=>{
  let lim=20,rele=false,perto=false,pertoAnt=false,liga=false,desl=false,acc=0;const log=[];
  el.innerHTML=`<div class="two" style="grid-template-columns:1.05fr 1fr;gap:34px">
    <div><svg viewBox="0 0 820 330">
      <rect x="0" y="0" width="820" height="330" rx="16" fill="#F5F6F9"/>
      <rect x="20" y="110" width="70" height="110" rx="8" fill="#1F4EA8"/><circle cx="55" cy="140" r="22" fill="#C9CED9"/><circle cx="55" cy="192" r="22" fill="#C9CED9"/>
      <g class="waves" fill="none" stroke="#E8490F" stroke-width="4"></g>
      <rect class="zone" x="100" y="70" height="190" fill="#E8490F" opacity=".08"/>
      <line class="limL" y1="60" y2="270" stroke="#E8490F" stroke-width="4" stroke-dasharray="10 8"/>
      <text class="limT" y="54" font-size="19" font-weight="700" fill="#B8380A" text-anchor="middle"></text>
      <rect class="obj" y="120" width="60" height="90" rx="6" fill="#27348B"/>
      <line x1="100" y1="300" x2="800" y2="300" stroke="#8A92A6" stroke-width="3"/>
      <text class="dT" y="292" font-size="20" fill="#1A2366" text-anchor="middle" font-weight="700"></text>
    </svg>
    <div class="ctrl"><label>Distância do objeto <span class="dv"></span></label><input type="range" class="sd" min="2" max="200" value="80" aria-label="Distância do objeto"></div></div>
    <div>
      <div class="wrow" style="margin-bottom:12px"><span style="font-size:24px">Limiar (cm):</span><input type="number" min="2" max="400" value="20" class="li" aria-label="Limiar em centímetros"><button type="button" class="btn sm ghost env">Enviar pelo serial</button></div>
      <div class="wrow" style="margin-bottom:12px"><button type="button" class="btn sm push bliga">Botão LIGA (D2)</button><button type="button" class="btn sm push bdes">Botão DESLIGA (D3)</button></div>
      <div class="wrow" style="gap:26px;margin-bottom:12px"><svg viewBox="0 0 120 120" style="width:110px;height:110px;flex:none"><circle class="lg" cx="60" cy="56" r="52" fill="#F7D26A" opacity="0"/><circle class="lb" cx="60" cy="52" r="34" fill="#fff" stroke="#D9A400" stroke-width="5"/><rect x="44" y="84" width="32" height="20" rx="3" fill="#B8BEC9"/></svg>
        <div><p class="readout st" style="font-size:34px"></p><p class="note md" style="margin:0;font-size:22px"></p></div></div>
      <div class="serial"></div>
    </div></div>`;
  const sd=$(el,'.sd'),X=d=>100+d*3.4;
  const draw=d=>{
    $(el,'.dv').textContent=d+' cm';$(el,'.obj').setAttribute('x',X(d));$(el,'.dT').setAttribute('x',X(d)+30);$(el,'.dT').textContent=d+' cm';
    $(el,'.limL').setAttribute('x1',X(lim));$(el,'.limL').setAttribute('x2',X(lim));$(el,'.limT').setAttribute('x',X(lim));$(el,'.limT').textContent='limiar '+lim+' cm';
    $(el,'.zone').setAttribute('width',Math.max(0,X(lim)-100));
    $(el,'.lg').setAttribute('opacity',rele?.55:0);$(el,'.lb').setAttribute('fill',rele?'#F7D26A':'#fff');
    $(el,'.st').innerHTML=rele?'<span class="hl">Relé ligado</span>':'Relé desligado';
    $(el,'.md').innerHTML=perto?'Objeto na zona: <b>os dois botões desligam</b>.':'Operação normal: LIGA liga, DESLIGA desliga.';
    $(el,'.serial').textContent=log.join('\n');
  };
  const print=t=>{log.push(t);while(log.length>5)log.shift();};
  holdBtn($(el,'.bliga'),v=>liga=v);holdBtn($(el,'.bdes'),v=>desl=v);
  $(el,'.env').addEventListener('click',()=>{const v=parseInt($(el,'.li').value,10);if(v>=2&&v<=400){lim=v;print('Novo limiar: '+lim+' cm');}else print('Valor invalido (2 a 400)');draw(+sd.value);});
  sd.addEventListener('input',()=>draw(+sd.value));
  reg(el,(t,T,dt)=>{
    const d=+sd.value;acc+=dt;
    if(acc>=0.2){acc=0;perto=d<lim;print(`Distancia: ${d.toFixed(1)} cm | limiar: ${lim}`);}
    if(perto&&!pertoAnt)rele=true;pertoAnt=perto;
    if(perto){if(liga||desl)rele=false;}else{if(desl)rele=false;else if(liga)rele=true;}
    const w=$(el,'.waves');const ph=(t/600)%1;
    w.innerHTML=[0,1,2].map(i=>{const r=((ph+i/3)%1)*(X(d)-90);return `<path d="M${90+r} 110 a${r*0.25+10} 60 0 0 1 0 110" opacity="${1-((ph+i/3)%1)}"/>`;}).join('');
    draw(d);
  });
  draw(+sd.value);
};

/* ----- polling x interrupção ----- */
W.isr=el=>{
  const SPAN=4;let presses=[],nP=0,nI=0,nT=0,lastLoop=0;
  el.innerHTML=`<svg viewBox="0 0 1660 330">
      <text x="0" y="40" font-size="26" font-weight="700" fill="#1A2366">Polling: o loop lê o botão uma vez e depois executa delay(1000)</text>
      <rect x="0" y="60" width="1660" height="70" rx="10" fill="#F5F6F9"/><g class="pl"></g>
      <text x="0" y="200" font-size="26" font-weight="700" fill="#1A2366">Interrupção: o hardware avisa no instante em que o pino muda</text>
      <rect x="0" y="220" width="1660" height="70" rx="10" fill="#F5F6F9"/><g class="il"></g>
      <line class="cur" y1="50" y2="300" stroke="#1A2366" stroke-width="4"/>
    </svg>
    <div class="wrow" style="margin-top:16px;gap:30px"><button type="button" class="btn hot pr">Apertar o botão (toque rápido)</button>
      <div class="ro" style="--c:3;margin:0;flex:1"><div><b class="nT">0</b><span>toques</span></div><div><b class="nP">0</b><span>vistos pelo polling</span></div><div><b class="o nI">0</b><span>vistos pela interrupção</span></div></div></div>`;
  const xs=t=>(t%SPAN)/SPAN*1660;
  $(el,'.pr').addEventListener('click',()=>{const now=performance.now()/1000;presses.push({t:now,seen:false});nT++;nI++;});
  reg(el,()=>{
    const now=performance.now()/1000;
    // o polling lê o pino a cada 1 s; um toque dura 0,15 s
    if(now-lastLoop>=1){lastLoop=now;presses.forEach(p=>{if(!p.seen&&now-p.t<=0.15){p.seen=true;nP++;}});}
    presses=presses.filter(p=>now-p.t<SPAN-0.05);
    const base=now-(now%SPAN);
    let pl='',il='';
    for(let i=0;i<=SPAN;i++){const tt=lastLoop-i;if(tt>=base)pl+=`<rect x="${xs(tt)-4}" y="64" width="8" height="62" fill="#27348B"/>`;}
    presses.forEach(p=>{if(p.t<base)return;const x=xs(p.t),w=0.15/SPAN*1660;
      pl+=`<rect x="${x}" y="78" width="${w}" height="34" rx="6" fill="${p.seen?'#2F9E44':'#E8490F'}" opacity=".85"/>`;
      il+=`<rect x="${x}" y="238" width="${w}" height="34" rx="6" fill="#2F9E44" opacity=".85"/><text x="${x+w/2}" y="320" font-size="18" text-anchor="middle" fill="#2F7D4F" font-weight="700">ISR</text>`;});
    $(el,'.pl').innerHTML=pl;$(el,'.il').innerHTML=il;
    const c=xs(now);$(el,'.cur').setAttribute('x1',c);$(el,'.cur').setAttribute('x2',c);
    $(el,'.nT').textContent=nT;$(el,'.nP').textContent=nP;$(el,'.nI').textContent=nI;
  });
};
