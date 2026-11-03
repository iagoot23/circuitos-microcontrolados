/* ---------- inicialização dos widgets e ciclo de animação ---------- */
$$(document,'.quiz[data-q]').forEach(el=>{const d=window.QZ[el.dataset.q];if(d)makeQuiz(el,d.qs,d.opts||{});});

$$(document,'[data-w]').forEach(el=>{try{W[el.dataset.w]?.(el);}catch(err){console.error('widget',el.dataset.w,err);}});
let last=performance.now();
function loop(t){
  const dt=Math.min(0.1,(t-last)/1000);last=t;
  const s=slides[cur];const T=Math.max(0,t-enterT);
  s._ticks.forEach(f=>f(t,T,dt));
  requestAnimationFrame(loop);
}
activate(start);
requestAnimationFrame(loop);
