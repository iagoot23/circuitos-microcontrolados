if(location.search.includes("shot"))document.documentElement.classList.add("shot");
/* ---------- blocos de código: <script type="text/x-arduino" data-t="título"> vira um quadro com destaque e botão Copiar ---------- */
const KW='if|else|for|while|do|switch|case|break|continue|default|return|const|volatile|static|true|false|HIGH|LOW|INPUT|OUTPUT|INPUT_PULLUP|LED_BUILTIN|BIN|HEX|DEC|CHANGE|RISING|FALLING';
const TY='void|bool|boolean|byte|char|int|long|unsigned|float|double|String|word|uint8_t|uint16_t|int16_t|uint32_t';
const TOK=new RegExp(`(\\/\\/[^\\n]*|\\/\\*[\\s\\S]*?\\*\\/)|(#[^\\n]*)|("(?:[^"\\\\\\n]|\\\\.)*"|'(?:[^'\\\\\\n]|\\\\.)*')|\\b(0x[0-9A-Fa-f]+|0b[01]+|\\d+(?:\\.\\d+)?)\\b|\\b(${TY})\\b|\\b(${KW})\\b|\\b([A-Za-z_]\\w*)(?=\\s*\\()`,'g');
const escH=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
function highlight(src){
  let out='',last=0;src.replace(TOK,(m,cm,pp,st,nu,ty,kw,fn,i)=>{
    out+=escH(src.slice(last,i));last=i+m.length;
    const c=cm?'cm':pp?'pp':st?'st':nu?'nu':ty?'ty':kw?'kw':'fn';
    out+=`<span class="${c}">${escH(m)}</span>`;return m;});
  return out+escH(src.slice(last));
}
document.querySelectorAll('script[type="text/x-arduino"]').forEach(s=>{
  const lines=s.textContent.replace(/^\n+|\s+$/g,'').split('\n');
  const ind=Math.min(...lines.filter(l=>l.trim()).map(l=>l.match(/^ */)[0].length));
  const code=lines.map(l=>l.slice(ind)).join('\n');
  const box=document.createElement('div');
  box.className='codebox '+(s.className||'');
  if(s.dataset.h)box.style.maxHeight=s.dataset.h+'px';
  box.innerHTML=`<div class="code-head"><span>${s.dataset.t||'Código'}</span><button type="button">Copiar código</button></div><pre>${highlight(code)}</pre>`;
  if(s.dataset.h)box.querySelector('pre').style.maxHeight=(s.dataset.h-52)+'px';
  const b=box.querySelector('button');
  b.addEventListener('click',()=>{
    const done=()=>{b.textContent='Copiado';b.classList.add('ok');setTimeout(()=>{b.textContent='Copiar código';b.classList.remove('ok');},1600);};
    if(navigator.clipboard?.writeText)navigator.clipboard.writeText(code).then(done,fallback);else fallback();
    function fallback(){const t=document.createElement('textarea');t.value=code;document.body.appendChild(t);t.select();try{document.execCommand('copy');done();}catch(e){}t.remove();}
  });
  s.replaceWith(box);
});
