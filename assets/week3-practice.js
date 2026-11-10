(()=>{'use strict';
const data=window.WEEK3_DATA,warning=document.querySelector('#storage-warning');
if(!data?.prompts){warning.hidden=false;warning.textContent='실습 요청문을 불러오지 못했어요. 페이지를 새로고침해 주세요.';return;}
const STORE='50plus-week3-practice-v2',OLD_STORE='50plus-week3-practice-v1',prompts=data.prompts;
const state={prompts:{},notes:{},complete:{},checks:{}};let toastTimer,lastCopyFocus,storageOK=true;
function storageFailed(){storageOK=false;warning.hidden=false;}
try{let saved=JSON.parse(localStorage.getItem(STORE)||'null');
if(!saved){const old=JSON.parse(localStorage.getItem(OLD_STORE)||'{}');saved={...old,notes:{},complete:{}};/* v1 had 8 activities; activity 2 was removed, so old 3-8 become 2-7 */for(let i=1;i<=7;i++){const from=i===1?1:i+1;saved.notes[i]=old.notes?.[from];saved.complete[i]=old.complete?.[from];}}

for(const key of Object.keys(prompts))if(typeof saved.prompts?.[key]==='string')state.prompts[key]=saved.prompts[key];
for(let i=1;i<=7;i++){if(typeof saved.notes?.[i]==='string')state.notes[i]=saved.notes[i];state.complete[i]=saved.complete?.[i]===true;}
for(const key of ['normal','empty','mobile'])if(['','통과','수정 필요','미확인'].includes(saved.checks?.[key]))state.checks[key]=saved.checks[key];
}catch{storageFailed();}
function save(){if(!storageOK)return;try{localStorage.setItem(STORE,JSON.stringify(state));}catch{storageFailed();}}
function toast(text){const el=document.querySelector('#toast');el.textContent=text;el.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>{el.hidden=true;},2800);}
function value(key){return Object.prototype.hasOwnProperty.call(state.prompts,key)?state.prompts[key]:prompts[key];}
for(const slot of document.querySelectorAll('[data-prompt-slot]')){
const key=slot.dataset.promptSlot,title=slot.dataset.promptTitle;if(!Object.prototype.hasOwnProperty.call(prompts,key))continue;
slot.classList.add('panel','prompt-panel');
const top=document.createElement('div');top.className='panel-top';const heading=document.createElement('h3');heading.textContent=title;top.append(heading);
const copy=document.createElement('button');copy.type='button';copy.className='button';copy.dataset.copy=key;copy.textContent='프롬프트 복사';copy.setAttribute('aria-label',title+' 복사');top.append(copy);slot.append(top);
const label=document.createElement('label');label.className='prompt-label';label.htmlFor='prompt-'+key;label.textContent='내 사이트에 맞게 고친 뒤 복사해도 좋아요.';slot.append(label);
const reset=document.createElement('button');reset.type='button';reset.className='button secondary small reset-prompt';reset.dataset.reset=key;reset.textContent='예시로 되돌리기';reset.setAttribute('aria-label',title+' 예시로 되돌리기');slot.append(reset);
const area=document.createElement('textarea');area.id='prompt-'+key;area.dataset.prompt=key;area.className='prompt-edit'+(['needs','prdRequest'].includes(key)?' short':key==='prd'?' long':'');area.value=value(key);area.spellcheck=false;slot.append(area);
const footer=document.createElement('p');footer.className='prompt-footer';footer.textContent=key==='prd'?'내 확정 PRD를 디자인·구현 단계에 함께 전달해요.':'필요한 자료를 함께 전달하고, 사용 중인 AI에서 실행하세요.';slot.append(footer);
}
for(const area of document.querySelectorAll('[data-note]'))area.value=state.notes[area.dataset.note]||'';
for(const box of document.querySelectorAll('[data-complete]'))box.checked=Boolean(state.complete[box.dataset.complete]);
for(const select of document.querySelectorAll('[data-check]'))select.value=state.checks[select.dataset.check]||'';
function progress(){let count=0;for(let i=1;i<=7;i++){const done=Boolean(state.complete[i]);if(done)count++;document.querySelector('[data-nav="'+i+'"] .nav-check').hidden=!done;}document.querySelector('#progress-text').textContent=count+' / 7';document.querySelector('#progress-fill').style.width=(count/7*100)+'%';document.querySelector('[role="progressbar"]').setAttribute('aria-valuenow',String(count));}
function showActivity(focus=false){const match=location.hash.match(/^#activity-([1-7])$/);const index=match?Number(match[1]):1;for(const section of document.querySelectorAll('.activity'))section.hidden=section.id!=='activity-'+index;for(const link of document.querySelectorAll('[data-nav]')){if(Number(link.dataset.nav)===index)link.setAttribute('aria-current','step');else link.removeAttribute('aria-current');}if(focus){document.querySelector('#title-'+index).focus({preventScroll:true});document.querySelector('#activity-'+index).scrollIntoView({block:'start',behavior:'instant'});}}
window.addEventListener('hashchange',()=>showActivity(true));
document.addEventListener('input',e=>{const el=e.target;if(el.matches('[data-prompt]')){state.prompts[el.dataset.prompt]=el.value;save();}if(el.matches('[data-note]')){state.notes[el.dataset.note]=el.value;save();}});
document.addEventListener('change',e=>{const el=e.target;if(el.matches('[data-complete]')){state.complete[el.dataset.complete]=el.checked;save();progress();}if(el.matches('[data-check]')){state.checks[el.dataset.check]=el.value;save();}});
async function copy(key){const text=value(key);try{if(!navigator.clipboard?.writeText)throw Error('clipboard unavailable');await navigator.clipboard.writeText(text);toast('요청문을 복사했어요.');}catch{lastCopyFocus=document.activeElement;const d=document.querySelector('#copy-dialog'),field=document.querySelector('#copy-text');field.value=text;d.showModal();field.focus();field.select();}}
function download(name,text){const url=URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function record(){const lines=['50플러스 AI 교실 · 3주차 실습 기록','저장 시각: '+new Date().toLocaleString('ko-KR'), ''];for(let i=1;i<=7;i++){lines.push('['+i+'. '+document.querySelector('#title-'+i).textContent+']', '완료: '+(state.complete[i]?'예':'아니오'),state.notes[i]||'(기록 없음)','');}lines.push('[점심 메뉴 기능 확인]');for(const [key,label] of [['normal','정상 추천'],['empty','결과 없음'],['mobile','조건 변경·모바일']])lines.push(label+': '+(state.checks[key]||'미선택'));lines.push('','[내가 편집한 요청문과 PRD]');for(const slot of document.querySelectorAll('[data-prompt-slot]'))lines.push('\n## '+slot.dataset.promptTitle,value(slot.dataset.promptSlot));return lines.join('\n');}
document.addEventListener('click',e=>{const button=e.target.closest('button');if(!button)return;if(button.dataset.copy)copy(button.dataset.copy);if(button.dataset.reset){const key=button.dataset.reset;delete state.prompts[key];document.querySelector('[data-prompt="'+key+'"]').value=prompts[key];save();toast('이 요청문을 원래 예시로 되돌렸어요.');}if(button.hasAttribute('data-download-prd'))download('내_PRD.md',value('prd'));if(button.hasAttribute('data-download-record'))download('50플러스_3주차_실습기록.txt',record());if(button.hasAttribute('data-close-copy'))document.querySelector('#copy-dialog').close();});
document.querySelector('#copy-dialog').addEventListener('close',()=>lastCopyFocus?.focus());
showActivity();progress();
})();
