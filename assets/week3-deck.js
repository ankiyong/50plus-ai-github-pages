(() => {
'use strict';
const data=window.WEEK3_DATA,meta=JSON.parse(document.getElementById('slide-meta').textContent),slides=[...document.querySelectorAll('.slide')];
const $=selector=>document.querySelector(selector);
const states=slides.map(()=>0);let index=0,overview=false,printing=false,activePrompt=null,toastTimer;
// Each dialog remembers its opener so nested PRD views restore focus correctly.
const dialogOpeners=new WeakMap();
function notify(text){$('#toast').textContent=text;$('#toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').hidden=true,2600);}
function applyStep(slide,n,complete=false){
 slide.dataset.step=String(n);
 if(slide.classList.contains('planning-motion'))slide.dataset.motionComplete=String(complete);
 slide.querySelectorAll('.reveal[data-reveal-step]').forEach(el=>{const visible=complete||n>=Number(el.dataset.revealStep);el.classList.toggle('is-visible',visible);el.setAttribute('aria-hidden',String(!visible));el.inert=!visible;});
}
function update(){
 slides.forEach((slide,i)=>{const active=i===index;slide.classList.toggle('active',active);slide.setAttribute('aria-hidden',String(!active&&!overview&&!printing));slide.inert=!active&&!overview&&!printing;applyStep(slide,states[i],overview||printing);});
 const item=meta[index],maximum=item.steps||0,current=states[index];
 $('#count').textContent=String(index+1).padStart(2,'0')+' / '+slides.length;
 $('#progressFill').style.width=((index+1)/slides.length*100)+'%';
 $('#stepCount').textContent=item.stepLabels?.[current]||(maximum?'설명 '+current+' / '+maximum:'전체 설명');
 $('#prev').disabled=index===0&&current===0;$('#next').disabled=index===slides.length-1&&current===maximum;
 $('#prev').textContent=current>0?(item.stepLabels?'← '+current+'단계':'← 이전 설명'):'← 이전 장표';$('#next').textContent=current<maximum?(item.stepLabels?(current+2)+'단계 보기 →':'다음 설명 →'):index===slides.length-1?'마지막 장표':'다음 장표 →';
 $('#restart').hidden=maximum===0;$('#restart').disabled=current===0;
 document.querySelectorAll('[data-stage]').forEach(el=>{if(Number(el.dataset.stage)===item.stage)el.setAttribute('aria-current','step');else el.removeAttribute('aria-current');});
 $('#teacherNoteText').textContent=item.note;
 $('#announce').textContent=(index+1)+'장. '+item.title+(item.stepLabels?' · '+item.stepLabels[current]:maximum?' · 설명 '+current+' / '+maximum:'');
 try{history.replaceState(null,'','#slide-'+(index+1)+(current?'-step-'+current:''));}catch{}
}
function go(n,step=0){index=Math.max(0,Math.min(slides.length-1,n));states[index]=Math.max(0,Math.min(meta[index].steps||0,step));update();if(overview)slides[index].scrollIntoView({block:'start'});else window.scrollTo(0,0);}
function next(){if(states[index]<(meta[index].steps||0)){states[index]++;update();}else if(index<slides.length-1)go(index+1);}
function previous(){if(states[index]>0){states[index]--;update();}else if(index>0)go(index-1,meta[index-1].steps||0);}
function readHash(){const m=location.hash.match(/^#slide-(\d+)(?:-step-(\d+))?$/);go(m?Number(m[1])-1:0,m?Number(m[2]||0):0);}
function showDialog(dialog){dialogOpeners.set(dialog,document.activeElement);dialog.showModal();}
function closeDialog(dialog){dialog.close();}
function openToc(){const grid=$('#tocGrid');grid.replaceChildren();meta.forEach((item,i)=>{const button=document.createElement('button');button.type='button';button.className='tocitem';button.dataset.goto=i;button.setAttribute('aria-current',String(i===index));const n=document.createElement('b');n.textContent=String(i+1).padStart(2,'0');const span=document.createElement('span');const small=document.createElement('small');small.textContent=item.chapter;span.append(small,document.createTextNode(item.title));button.append(n,span);grid.append(button);});showDialog($('#tocModal'));}
function showPrompt(key){if(!Object.hasOwn(data.prompts,key))return;activePrompt=key;$('#modalTitle').textContent=key==='prd'?'점심 메뉴 추천 PRD':'요청문 크게 보기';$('#modalPrompt').textContent=data.prompts[key];showDialog($('#promptModal'));}
async function copyPrompt(key){if(!Object.hasOwn(data.prompts,key))return;const text=data.prompts[key];try{await navigator.clipboard.writeText(text);notify('복사했어요. AI의 입력창에 붙여넣으세요.');}catch{
 $('#copyText').value=text;showDialog($('#copyModal'));$('#copyText').focus();$('#copyText').select();
}}
function hydratePrompts(){document.querySelectorAll('[data-prompt-card]').forEach(card=>{const key=card.dataset.promptCard;if(!Object.hasOwn(data.prompts,key))throw new Error('Missing prompt '+key);card.classList.add('prompt');const head=document.createElement('div');head.className='prompthead';const label=document.createElement('strong');label.textContent=key==='prd'?'PRD 예시':'실습 프롬프트';const actions=document.createElement('div');for(const [attribute,title] of [['expand','크게 보기'],['copy','복사']]){const b=document.createElement('button');b.type='button';b.className='smallbtn'+(attribute==='copy'?' yellow':'');b.dataset[attribute]=key;b.textContent=title;actions.append(b);}head.append(label,actions);const pre=document.createElement('pre');pre.textContent=data.prompts[key];pre.tabIndex=0;pre.setAttribute('aria-label',label.textContent+' 전문');card.replaceChildren(head,pre);});}
$('#next').addEventListener('click',next);$('#prev').addEventListener('click',previous);$('#restart').addEventListener('click',()=>{states[index]=0;update();});
$('#tocButton').addEventListener('click',openToc);
$('#overviewButton').addEventListener('click',()=>{overview=!overview;document.body.classList.toggle('overview',overview);$('#overviewButton').setAttribute('aria-pressed',String(overview));$('#overviewButton').textContent=overview?'발표 보기':'전체 보기';update();if(overview)slides[index].scrollIntoView({block:'start'});else window.scrollTo(0,0);});
$('#notesButton').addEventListener('click',()=>{const active=document.body.classList.toggle('notes-visible');$('#notesButton').setAttribute('aria-pressed',String(active));});
$('#noteClose').addEventListener('click',()=>{document.body.classList.remove('notes-visible');$('#notesButton').setAttribute('aria-pressed','false');$('#notesButton').focus();});
$('#fullscreenButton').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{notify('브라우저 메뉴에서 전체화면을 선택해 주세요.');}});
$('#printButton').addEventListener('click',()=>window.print());$('#sourcesButton').addEventListener('click',()=>showDialog($('#sourcesModal')));
$('#copyModalPrompt').addEventListener('click',()=>copyPrompt(activePrompt));
for(const dialog of document.querySelectorAll('dialog'))dialog.addEventListener('close',()=>{const opener=dialogOpeners.get(dialog);if(opener instanceof HTMLElement&&opener.isConnected&&!opener.closest('[inert]'))opener.focus();});
document.addEventListener('click',event=>{const target=event.target.closest('button');if(!target)return;if(target.dataset.copy)copyPrompt(target.dataset.copy);if(target.dataset.expand)showPrompt(target.dataset.expand);if(target.hasAttribute('data-prd-image'))showDialog($('#prdImageModal'));if(target.hasAttribute('data-close'))closeDialog(target.closest('dialog'));if(target.dataset.goto!==undefined){closeDialog($('#tocModal'));go(Number(target.dataset.goto));} });
window.addEventListener('hashchange',readHash);
window.addEventListener('beforeprint',()=>{printing=true;update();});window.addEventListener('afterprint',()=>{printing=false;update();});
hydratePrompts();readHash();document.body.dataset.ready='true';
window.week3Deck={go,next,previous,setStep:n=>{states[index]=Math.max(0,Math.min(meta[index].steps||0,n));update();},getState:()=>({index,step:states[index],maximum:meta[index].steps||0,overview,total:slides.length})};
/* One input path for presentation remotes, mouse clicks, and pen/touch taps. */
(() => {
  const options = {isActive:()=>!overview&&!printing,root:()=>slides[index],next,previous,first:()=>go(0),last:()=>go(slides.length-1),toc:openToc};
  const editable = 'input,textarea,select,[contenteditable]:not([contenteditable="false"]),[role="textbox"],[role="slider"],[role="spinbutton"],[role="combobox"]';
  const interactive = 'button,a,input,textarea,select,summary,[contenteditable]:not([contenteditable="false"]),[role="button"],[role="textbox"],[role="slider"],[role="spinbutton"],[role="combobox"],label';
  let start = null;
  let dragged = false;

  function active() {
    return options.isActive() && !document.querySelector('dialog[open]');
  }

  function selectedText() {
    const selection = window.getSelection();
    return Boolean(selection && !selection.isCollapsed && selection.toString().length);
  }

  function keyAction(event) {
    const key = event.key.toLowerCase();
    const space = key === ' ' || event.code === 'Space';
    if (['arrowright','arrowdown','pagedown','enter','n'].includes(key) || space && !event.shiftKey) return 'next';
    if (['arrowleft','arrowup','pageup','backspace','p'].includes(key) || space && event.shiftKey) return 'previous';
    if (key === 'home') return 'first';
    if (key === 'end') return 'last';
    if (key === 'm') return 'toc';
    return null;
  }

  function ownsKey(event) {
    const target = event.target;
    if (!(target instanceof Element)) return false;
    if (target.closest(editable)) return true;
    // Enter/Space still activate the focused control. Remote page/arrow keys do not
    // become stuck merely because the presenter last clicked a navigation button.
    return Boolean(target.closest('button,a,summary,[role="button"]') &&
      (event.key === 'Enter' || event.key === ' ' || event.code === 'Space'));
  }

  document.addEventListener('keydown', event => {
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey ||
        !active() || selectedText()) return;
    // Browser buttons can emit a native click for every repeated Enter keydown.
    // Keep the first activation while preventing a held remote button from
    // advancing through several slides or toggling playback repeatedly.
    if (event.repeat && event.target instanceof Element && !event.target.closest(editable) &&
        event.target.closest('button,a,summary,[role="button"]') &&
        (event.key === 'Enter' || event.key === ' ' || event.code === 'Space')) {
      event.preventDefault();
      return;
    }
    if (ownsKey(event)) return;
    const action = keyAction(event);
    if (!action) return;
    event.preventDefault();
    if (event.repeat) return;
    options[action]();
  });

  document.addEventListener('pointerdown', event => {
    start = {id:event.pointerId, x:event.clientX, y:event.clientY};
    dragged = false;
  }, {passive:true});
  document.addEventListener('pointermove', event => {
    if (start && start.id === event.pointerId && Math.hypot(event.clientX-start.x,event.clientY-start.y)>7) dragged=true;
  }, {passive:true});
  document.addEventListener('pointercancel', () => {
    start = null;
    dragged = true;
  }, {passive:true});

  function ownsPointer(event) {
    const target=event.target, root=options.root();
    return !(target instanceof Element) || !root || !root.contains(target) ||
      Boolean(target.closest(interactive)) || selectedText() || dragged;
  }
  document.addEventListener('click', event => {
    if (event.defaultPrevented || event.button !== 0 || !active() || ownsPointer(event)) return;
    options.next();
  });
  document.addEventListener('contextmenu', event => {
    if (event.defaultPrevented || !active() || ownsPointer(event)) return;
    event.preventDefault();
    options.previous();
  });
})();

})();
