/* The host owns slide/step navigation. This module animates diagram relationships. */
(() => {
 'use strict';
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const NS='http://www.w3.org/2000/svg';
 let frame=0,generation=0,active=null,state={step:0,complete:false,playing:false};
 const contains=(value,step)=>String(value||'').split(/[\s,]+/).includes(String(step));
 function pause(){generation++;if(frame)cancelAnimationFrame(frame);frame=0;state.playing=false;document.querySelectorAll('.c-packets').forEach(el=>el.replaceChildren());}
 function apply(slide,step,complete=false,animate=true){
  pause();const root=slide.querySelector('.concept-diagram');if(!root)return;
  active=root;const effective=complete?0:step;state={step,complete,playing:false};
  root.dataset.step=String(effective);root.classList.toggle('motion-immediate',!animate||complete||reduced.matches);
  root.querySelectorAll('[data-focus],[data-show]').forEach(el=>{
   const shown=!el.hasAttribute('data-show')||contains(el.dataset.show,effective);
   const focused=!effective||!el.hasAttribute('data-focus')||contains(el.dataset.focus,effective);
   el.style.opacity=shown?(focused?'1':'.23'):'0';
   el.style.visibility=shown?'visible':'hidden';
   if(el.hasAttribute('data-show'))el.style.transform=shown?'scale(1)':'scale(.88)';
  });
  if(complete||!step||!animate||reduced.matches)return;
  const paths=[...root.querySelectorAll('path[data-flow]')].filter(p=>contains(p.dataset.flow,step)&&!p.closest('[data-show]')?.style.visibility.includes('hidden'));
  if(!paths.length)return;
  const packets=root.querySelector('.c-packets'),token=generation,start=performance.now();
  const tracks=paths.map((path,i)=>{
   const dot=document.createElementNS(NS,'circle');dot.setAttribute('r','10');dot.setAttribute('fill',path.getAttribute('stroke')||'#7c4abd');dot.setAttribute('stroke','#fff9df');dot.setAttribute('stroke-width','3');dot.setAttribute('opacity','0');packets.append(dot);
   return {path,dot,length:path.getTotalLength(),delay:Number(path.dataset.delay||i*180)};
  });
  state.playing=true;const duration=1450,end=duration*2+Math.max(...tracks.map(t=>t.delay));
  function tick(now){
   if(token!==generation)return;
   const elapsed=now-start;
   tracks.forEach(({path,dot,length,delay})=>{
    const local=elapsed-delay;
    if(local<0||local>=duration*2){dot.setAttribute('opacity','0');return;}
    const t=(local%duration)/duration,progress=Math.min(1,Math.max(0,(t-.08)/.84));
    const point=path.getPointAtLength(length*progress);dot.setAttribute('cx',point.x);dot.setAttribute('cy',point.y);
    dot.setAttribute('opacity',String(Math.min(1,t*12,(1-t)*12)));
   });
   if(elapsed>=end){packets.replaceChildren();frame=0;state.playing=false;return;}
   frame=requestAnimationFrame(tick);
  }
  frame=requestAnimationFrame(tick);
 }
 reduced.addEventListener('change',()=>{if(reduced.matches)pause();});
 window.week4ConceptMotion=Object.freeze({apply,pause,getState:()=>({...state,id:active?.id})});
})();
