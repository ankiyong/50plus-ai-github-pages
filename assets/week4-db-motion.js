/* This module owns only the DB comparison diagram; the deck owns navigation. */
(() => {
 'use strict';
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const captions=[
  'DB가 어디에 있고, 누가 관리하는지 먼저 구분합니다.',
  '설치형: 앱 서버가 내가 관리하는 VM의 DB에 요청합니다.',
  '관리형: 앱 서버가 별도 DB 서비스에 요청합니다.',
  '둘 다 연결·권한은 설정해야 합니다. 관리 책임의 범위가 다릅니다.'
 ];
 let root=null,handle=0,generation=0,state={step:0,complete:false,playing:false};
 const node=id=>root?.querySelector('#w4db-'+id);
 function pause(){generation++;if(handle)cancelAnimationFrame(handle);handle=0;state.playing=false;}
 function reset(step,complete){
  const current=complete?0:step;
  root.dataset.mode=current===3?'responsibility':current===1?'self':current===2?'managed':'overview';
  root.dataset.step=String(current);
  ['self','managed'].forEach((name,i)=>{
   node(name).style.opacity=current===1||current===2?(current===i+1?'1':'.28'):'1';
   node(name+'-focus').style.opacity=current===i+1?'.9':'0';
   node(name+'-owner').style.opacity=current===1||current===2?'.55':'1';
   ['client','api','db'].forEach(part=>node(name+'-'+part).style.opacity=current===3?'.48':'1');
  });
  node('packet').setAttribute('opacity','0');
  node('caption').textContent=captions[current];
 }
 function apply(step,complete=false,animate=true){
  pause();root=document.querySelector('.db-comparison-diagram');if(!root)return;
  step=Number.isFinite(Number(step))?Math.max(0,Math.min(3,Math.trunc(Number(step)))):0;
  state={step,complete:!!complete,playing:false};reset(step,!!complete);
  if(complete||step===0||step===3||!animate||reduced.matches)return;
  const lane=step===1?'self':'managed';
  const phases=[['request-1',false],['request-2',false],['response-2',true],['response-1',true]];
  const duration=4000,start=performance.now(),token=generation;state.playing=true;
  function frame(now){
   if(token!==generation)return;
   const progress=Math.max(0,Math.min(1,(now-start)/duration)),phase=Math.min(3,Math.floor(progress*4)),local=progress*4-phase;
   const [pathId,response]=phases[phase],path=node(lane+'-'+pathId);
   const travel=Math.max(0,Math.min(1,(local-.08)/.8)),point=path.getPointAtLength(path.getTotalLength()*travel);
   const packet=node('packet');packet.setAttribute('transform',`translate(${point.x} ${point.y})`);packet.querySelector('circle').setAttribute('fill',response?'#129daf':'#7c4abd');packet.setAttribute('opacity',String(Math.min(1,Math.max(0,local/.12),Math.max(0,(1-local)/.12))));
   node('caption').textContent=response?`${step===1?'설치형':'관리형'}: DB의 결과가 앱 서버를 거쳐 웹페이지로 돌아옵니다.`:captions[step];
   if(progress>=1){node('packet').setAttribute('opacity','0');state.playing=false;handle=0;return;}
   handle=requestAnimationFrame(frame);
  }
  handle=requestAnimationFrame(frame);
 }
 reduced.addEventListener('change',()=>{if(reduced.matches)apply(state.step,state.complete,false);});
 window.week4DbMotion=Object.freeze({apply,pause,getState:()=>({...state})});
})();
