(()=>{
'use strict';
const menu=window.WEEK3_DATA?.menu;
const form=document.querySelector('#lunch-form'),budget=document.querySelector('#budget'),cuisine=document.querySelector('#cuisine'),grid=document.querySelector('#result-grid'),status=document.querySelector('#result-status'),results=document.querySelector('#results'),placeholder=document.querySelector('#placeholder'),placeholderTitle=document.querySelector('#placeholder-title'),placeholderCopy=document.querySelector('#placeholder-copy'),change=document.querySelector('#change-conditions'),label=document.querySelector('#recommend-label');
const won=value=>value.toLocaleString('ko-KR')+'원';
function node(tag,className,text){const element=document.createElement(tag);if(className)element.className=className;if(text!==undefined)element.textContent=text;return element;}
function showPlaceholder(title,copy){grid.replaceChildren();placeholder.hidden=false;placeholderTitle.textContent=title;placeholderCopy.textContent=copy;}
function resetResults(pending=false){results.dataset.state=pending?'pending':'initial';showPlaceholder(pending?'조건을 바꿨어요':'내 조건에 맞는 점심을 찾아봐요',pending?'‘추천받기’를 누르면 새 조건으로 메뉴를 찾아드려요.':'예산과 음식 종류를 기준으로 메뉴를 골라드려요.');status.textContent=pending?'새 조건으로 다시 추천받아 주세요.':'조건을 고르고 ‘추천받기’를 눌러 주세요.';change.hidden=true;label.textContent='추천받기';}
function sample(items){const chosen=[...items];for(let i=chosen.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[chosen[i],chosen[j]]=[chosen[j],chosen[i]];}return chosen.slice(0,3);}
if(!Array.isArray(menu)||menu.length===0){status.textContent='메뉴 목록을 불러오지 못했어요. 페이지를 새로고침해 주세요.';document.querySelector('#recommend').disabled=true;return;}
for(const item of menu){const row=node('tr');row.append(node('td','',item.name),node('td','',item.category),node('td','',won(item.price)));document.querySelector('#menu-data').append(row);}
form.addEventListener('change',()=>resetResults(true));
form.addEventListener('reset',()=>resetResults(false));
change.addEventListener('click',()=>budget.focus());
form.addEventListener('submit',event=>{
 event.preventDefault();
 const limit=Number(budget.value),kind=cuisine.value;
 const eligible=menu.filter(item=>item.price<=limit&&(kind==='all'||item.category===kind));
 const condition=won(limit)+' 이하 · '+(kind==='all'?'음식 종류 상관없음':kind);
 grid.replaceChildren();label.textContent='다시 추천받기';
 if(eligible.length===0){
  results.dataset.state='empty';showPlaceholder('조건에 맞는 메뉴가 없어요','예산을 높이거나 음식 종류를 바꾼 뒤 다시 추천받아 보세요.');status.textContent=condition+' 조건에 맞는 예시 메뉴가 없어요.';change.hidden=false;return;
 }
 const choices=eligible.length>3?sample(eligible):eligible;
 results.dataset.state='results';placeholder.hidden=true;change.hidden=true;
 for(const [index,item] of choices.entries()){
  const card=node('article','menu-card');card.dataset.menuId=String(item.id);card.dataset.price=String(item.price);card.dataset.category=item.category;
  const top=node('div','card-top');top.append(node('span','candidate','후보 '+String(index+1).padStart(2,'0')),node('span','',item.category));
  const body=node('div','card-body'),price=node('p','price');price.append(node('small','','예시 가격'),document.createTextNode(won(item.price)));
  const reason=kind==='all'?'선택한 '+won(limit)+' 예산 안에서 먹을 수 있는 '+item.category+' 메뉴예요.':'선택한 '+kind+' 메뉴이고, '+won(limit)+' 예산 안에 들어요.';
  body.append(node('h3','',item.name),price,node('p','reason',reason));card.append(top,body);grid.append(card);
 }
 status.textContent=condition+' · 조건에 맞는 '+eligible.length+'개 중 '+choices.length+'개를 보여드려요.';
});
})();
