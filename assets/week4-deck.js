(() => {
'use strict';
const meta=window.WEEK4_META,slides=[...document.querySelectorAll('.week4-slide')],$=s=>document.querySelector(s);
const states=slides.map(()=>0),openers=new WeakMap();
let index=0,overview=false,printing=false,toastTimer,rendered=-1;
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
function notify(message){$('#toast').textContent=message;$('#toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').hidden=true,3000);}
function fit(){
 if(printing)return;
 const width=Math.max(160,document.documentElement.clientWidth-(innerWidth<=700?26:58));
 const available=Math.max(90,innerHeight-$('.toolbar').getBoundingClientRect().height-$('.footer').getBoundingClientRect().height-(innerWidth<=700?30:42));
 const scale=Math.min(width/1600,overview?1:available/900,1.4);
 const root=document.documentElement.style;
 root.setProperty('--slide-scale',String(scale));root.setProperty('--slide-width',1600*scale+'px');root.setProperty('--slide-height',900*scale+'px');
}
function applyFocus(slide,item,n,complete,animate){
 if(!item.focus)return;
 let ring=slide.querySelector('.focus-frame');
 if(!ring){ring=document.createElement('div');ring.className='focus-frame';ring.setAttribute('aria-hidden','true');slide.querySelector('.slide-canvas').append(ring);}
 const region=!complete&&n>0?item.focus[n-1]:null;
 ring.style.transition=animate&&!reduced.matches?'':'none';
 ring.style.opacity=region?'1':'0';
 if(region){const [x,y,w,h]=region;ring.style.transform=`translate(${x-5}px,${y-5}px)`;ring.style.width=w+10+'px';ring.style.height=h+10+'px';}
 slide.querySelectorAll('.ppt-shape,.ppt-text,.ppt-picture').forEach(el=>{
  const x=parseFloat(el.style.left)+parseFloat(el.style.width)/2,y=parseFloat(el.style.top)+parseFloat(el.style.height)/2;
  const inside=r=>x>=r[0]&&x<=r[0]+r[2]&&y>=r[1]&&y<=r[1]+r[3];
  const dim=!!region&&item.focus.some(inside)&&!inside(region);
  el.classList.toggle('week4-dim',dim);
 });
}
function applyStep(i,complete=false,animate=true){
 const slide=slides[i],item=meta[i],n=states[i];slide.dataset.step=String(n);
 if(item.morph)window.week4ShotMorph?.apply(slide,n,complete,animate);
 if(i===8)window.week4Motion?.apply(n,complete,animate);
 applyFocus(slide,item,n,complete,animate);
}
function pause(){window.week4Motion?.pause();window.week4ShotMorph?.pause();}
function update(){
 const changed=rendered!==index;
 if(changed||overview||printing)pause();
 slides.forEach((slide,i)=>{const visible=i===index||overview||printing;slide.classList.toggle('active',i===index);slide.setAttribute('aria-hidden',String(!visible));slide.inert=!visible;
  if(visible){slide.querySelectorAll('img[loading=lazy]').forEach(img=>img.loading='eager');applyStep(i,overview||printing,!changed&&!overview&&!printing);}
 });
 rendered=index;
 const item=meta[index],current=states[index],maximum=item.steps;
 $('#count').textContent=String(index+1).padStart(2,'0')+' / '+slides.length;
 $('#progressFill').style.width=(index+1)/slides.length*100+'%';
 $('#stepCount').textContent=item.stepLabels[current];
 $('#prev').disabled=index===0&&current===0;$('#next').disabled=index===slides.length-1&&current===maximum;
 $('#prev').textContent=current?'← 이전 설명':'← 이전 장표';$('#next').textContent=current<maximum?'다음 설명 →':index===slides.length-1?'마지막 장표':'다음 장표 →';
 $('#restart').hidden=maximum===0;$('#restart').disabled=current===0;
 document.querySelectorAll('[data-stage]').forEach(el=>{if(Number(el.dataset.stage)===item.stage)el.setAttribute('aria-current','step');else el.removeAttribute('aria-current');});
 $('#teacherNoteText').textContent=item.note;
 $('#announce').textContent=(index+1)+'장. '+item.title+' · '+item.stepLabels[current];
 try{history.replaceState(null,'','#slide-'+(index+1)+(current?'-step-'+current:''));}catch{}
 fit();
}
function go(n,step=0){index=Math.max(0,Math.min(slides.length-1,n));states[index]=Math.max(0,Math.min(meta[index].steps,step));update();if(overview)slides[index].scrollIntoView({block:'start'});else window.scrollTo(0,0);}
function next(){if(states[index]<meta[index].steps){states[index]++;update();}else if(index<slides.length-1)go(index+1);}
function previous(){if(states[index]>0){states[index]--;update();}else if(index>0)go(index-1,meta[index-1].steps);}
function readHash(){const m=location.hash.match(/^#slide-(\d+)(?:-step-(\d+))?$/);go(m?Number(m[1])-1:0,m?Number(m[2]||0):0);}
function showDialog(dialog){openers.set(dialog,document.activeElement);dialog.showModal();}
function openToc(){const grid=$('#tocGrid');grid.replaceChildren();meta.forEach((item,i)=>{const b=document.createElement('button');b.className='toc-item';b.dataset.goto=String(i);b.setAttribute('aria-current',String(i===index));const num=document.createElement('b');num.textContent=String(i+1).padStart(2,'0');const span=document.createElement('span'),small=document.createElement('small');small.textContent=item.chapter;span.append(small,document.createTextNode(item.title));b.append(num,span);grid.append(b);});showDialog($('#tocModal'));}
$('#next').addEventListener('click',next);$('#prev').addEventListener('click',previous);$('#restart').addEventListener('click',()=>{states[index]=0;update();});
$('#tocButton').addEventListener('click',openToc);
$('#overviewButton').addEventListener('click',()=>{overview=!overview;document.body.classList.toggle('overview',overview);$('#overviewButton').setAttribute('aria-pressed',String(overview));$('#overviewButton').textContent=overview?'발표 보기':'전체 보기';update();if(overview)slides[index].scrollIntoView({block:'start'});else window.scrollTo(0,0);});
$('#notesButton').addEventListener('click',()=>{const active=document.body.classList.toggle('notes-visible');$('#notesButton').setAttribute('aria-pressed',String(active));});
$('#noteClose').addEventListener('click',()=>{document.body.classList.remove('notes-visible');$('#notesButton').setAttribute('aria-pressed','false');$('#notesButton').focus();});
$('#fullscreenButton').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{notify('브라우저 메뉴에서 전체화면을 선택해 주세요.');}});
$('#printButton').addEventListener('click',()=>window.print());$('#sourcesButton').addEventListener('click',()=>showDialog($('#sourcesModal')));
document.querySelectorAll('dialog').forEach(dialog=>dialog.addEventListener('close',()=>{const opener=openers.get(dialog);if(opener instanceof HTMLElement&&opener.isConnected&&!opener.closest('[inert]'))opener.focus();}));
document.addEventListener('click',event=>{const target=event.target.closest('button');if(!target)return;if(target.hasAttribute('data-close'))target.closest('dialog').close();if(target.dataset.goto!==undefined){$('#tocModal').close();go(Number(target.dataset.goto));}if(target.dataset.first)go(Number(target.dataset.first)-1);});
window.addEventListener('hashchange',readHash);window.addEventListener('resize',fit);document.addEventListener('fullscreenchange',fit);
new ResizeObserver(fit).observe($('.toolbar'));new ResizeObserver(fit).observe($('.footer'));
window.addEventListener('beforeprint',()=>{printing=true;update();});window.addEventListener('afterprint',()=>{printing=false;update();});
document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();else update();});
reduced.addEventListener('change',()=>{pause();applyStep(index,overview||printing,false);});
readHash();document.body.dataset.ready='true';
window.week4Deck={go,next,previous,setStep:n=>{states[index]=Math.max(0,Math.min(meta[index].steps,n));update();},getState:()=>({index,step:states[index],maximum:meta[index].steps,overview,total:slides.length})};
/* One input path supports a presentation remote, keyboard, mouse and touch. */
(() => {
 const editable='input,textarea,select,[contenteditable]:not([contenteditable="false"]),[role="textbox"],[role="slider"],[role="spinbutton"],[role="combobox"]';
 const interactive='button,a,input,textarea,select,summary,[contenteditable]:not([contenteditable="false"]),[role="button"],[role="textbox"],[role="slider"],[role="spinbutton"],[role="combobox"],label';
 let start=null,dragged=false;
 const active=()=>!overview&&!printing&&!document.querySelector('dialog[open]');
 const selected=()=>{const s=window.getSelection();return !!(s&&!s.isCollapsed&&s.toString().length);};
 document.addEventListener('keydown',event=>{
  if(event.defaultPrevented||event.altKey||event.ctrlKey||event.metaKey||!active()||selected())return;
  const target=event.target,key=event.key.toLowerCase(),space=key===' '||event.code==='Space';
  if(target instanceof Element&&target.closest(editable))return;
  if(target instanceof Element&&target.closest('button,a,summary,[role="button"]')&&(key==='enter'||space)){if(event.repeat)event.preventDefault();return;}
  let action=null;
  if(['arrowright','arrowdown','pagedown','enter','n'].includes(key)||space&&!event.shiftKey)action=next;
  else if(['arrowleft','arrowup','pageup','backspace','p'].includes(key)||space&&event.shiftKey)action=previous;
  else if(key==='home')action=()=>go(0);else if(key==='end')action=()=>go(slides.length-1);else if(key==='m')action=openToc;
  if(action){event.preventDefault();if(!event.repeat)action();}
 });
 document.addEventListener('pointerdown',event=>{start={id:event.pointerId,x:event.clientX,y:event.clientY};dragged=false;},{passive:true});
 document.addEventListener('pointermove',event=>{if(start&&start.id===event.pointerId&&Math.hypot(event.clientX-start.x,event.clientY-start.y)>7)dragged=true;},{passive:true});
 document.addEventListener('pointercancel',()=>{start=null;dragged=true;},{passive:true});
 const owns=event=>!(event.target instanceof Element)||!slides[index].contains(event.target)||!!event.target.closest(interactive)||selected()||dragged;
 document.addEventListener('click',event=>{if(!event.defaultPrevented&&event.button===0&&active()&&!owns(event))next();});
 document.addEventListener('contextmenu',event=>{if(!event.defaultPrevented&&active()&&!owns(event)){event.preventDefault();previous();}});
})();
})();
