(() => {
  'use strict';
  const originals = Object.freeze({
    questions: '웹페이지 prd 문서 작성에 필요한 필수 항목 질문해줘',
    document: 'Prd 문서로 만들어서 코드블럭에 정리해줘.'
  });
  const STORE = '50plus-week4-practice-prd-v1';
  const activities = [...document.querySelectorAll('.activity')];
  const count = activities.length;
  const state = {prompts: {...originals}, notes: {}, complete: {}, prd: ''};
  const $ = selector => document.querySelector(selector);
  let storageOK = true, toastTimer, copyOpener;

  function storageFailed() { storageOK = false; $('#storage-warning').hidden = false; }
  try {
    const saved = JSON.parse(localStorage.getItem(STORE) || 'null');
    if (saved && typeof saved === 'object') {
      for (const key of Object.keys(originals)) if (typeof saved.prompts?.[key] === 'string') state.prompts[key] = saved.prompts[key];
      for (let i = 1; i <= count; i++) {
        if (typeof saved.notes?.[i] === 'string') state.notes[i] = saved.notes[i];
        state.complete[i] = saved.complete?.[i] === true;
      }
      if (typeof saved.prd === 'string') state.prd = saved.prd;
    }
  } catch { storageFailed(); }

  function save() {
    if (!storageOK) return;
    try { localStorage.setItem(STORE, JSON.stringify(state)); } catch { storageFailed(); }
  }
  function toast(message) {
    $('#toast').textContent = message; $('#toast').hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(() => { $('#toast').hidden = true; }, 2800);
  }
  function update() {
    let completed = 0;
    for (let i = 1; i <= count; i++) {
      const done = !!state.complete[i]; if (done) completed++;
      $(`[data-nav="${i}"] .nav-check`).hidden = !done;
    }
    $('#progress-text').textContent = `${completed} / ${count}`;
    $('#progress-fill').style.width = `${completed / count * 100}%`;
    $('[role="progressbar"]').setAttribute('aria-valuenow', String(completed));
    $('#saved-questions').textContent = state.notes[1]?.trim() ? state.notes[1] : '1단계에서 질문을 기록하면 이곳에서도 볼 수 있어요.';
    $('[data-copy-answer]').disabled = !(state.notes[2] || '').trim();
    $('[data-copy-prd]').disabled = !state.prd.trim();
    $('[data-download-prd]').disabled = !state.prd.trim();
  }
  function showActivity(focus = false) {
    const match = location.hash.match(/^#activity-(\d+)$/);
    const requested = match ? Number(match[1]) : 1;
    const index = requested >= 1 && requested <= count ? requested : 1;
    activities.forEach((section, i) => { section.hidden = i + 1 !== index; });
    document.querySelectorAll('[data-nav]').forEach(link => {
      if (Number(link.dataset.nav) === index) link.setAttribute('aria-current', 'step');
      else link.removeAttribute('aria-current');
    });
    if (focus) {
      $(`#title-${index}`).focus({preventScroll: true});
      $(`#activity-${index}`).scrollIntoView({block: 'start', behavior: 'instant'});
    }
  }
  async function copy(text, message) {
    if (!text.trim()) return;
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(text); toast(message);
    } catch {
      copyOpener = document.activeElement;
      $('#copy-text').value = text; $('#copy-dialog').showModal();
      $('#copy-text').focus(); $('#copy-text').select();
    }
  }
  function download(name, text) {
    const url = URL.createObjectURL(new Blob([text], {type: 'text/plain;charset=utf-8'}));
    const a = document.createElement('a'); a.href = url; a.download = name;
    document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function record() {
    const lines = ['50플러스 AI 교실 · 4주차 PRD 실습 기록', '저장 시각: ' + new Date().toLocaleString('ko-KR'), ''];
    for (let i = 1; i <= count; i++) {
      lines.push(`[${i}. ${$(`#title-${i}`).textContent}]`, '완료: ' + (state.complete[i] ? '예' : '아니오'));
      if (i < 3) lines.push(state.notes[i] || '(기록 없음)');
      lines.push('');
    }
    lines.push('[필수 항목 질문 프롬프트]', state.prompts.questions, '', '[PRD 정리 프롬프트]', state.prompts.document, '', '[내 PRD]', state.prd || '(PRD 기록 없음)');
    return lines.join('\n');
  }

  document.querySelectorAll('[data-prompt]').forEach(el => { el.value = state.prompts[el.dataset.prompt]; });
  document.querySelectorAll('[data-note]').forEach(el => { el.value = state.notes[el.dataset.note] || ''; });
  document.querySelectorAll('[data-complete]').forEach(el => { el.checked = !!state.complete[el.dataset.complete]; });
  $('[data-prd]').value = state.prd;
  document.addEventListener('input', event => {
    const el = event.target;
    if (el.matches('[data-prompt]')) state.prompts[el.dataset.prompt] = el.value;
    else if (el.matches('[data-note]')) state.notes[el.dataset.note] = el.value;
    else if (el.matches('[data-prd]')) state.prd = el.value;
    else return;
    save(); update();
  });
  document.addEventListener('change', event => {
    const el = event.target;
    if (el.matches('[data-complete]')) { state.complete[el.dataset.complete] = el.checked; save(); update(); }
  });
  document.addEventListener('click', event => {
    const button = event.target.closest('button'); if (!button) return;
    if (button.dataset.copyPrompt) copy(state.prompts[button.dataset.copyPrompt], '프롬프트를 복사했어요. AI 대화에 붙여넣으세요.');
    else if (button.dataset.reset) {
      const key = button.dataset.reset; state.prompts[key] = originals[key];
      $(`[data-prompt="${key}"]`).value = originals[key]; save(); toast('이 프롬프트를 원문으로 되돌렸어요.');
    } else if (button.hasAttribute('data-copy-answer')) copy(state.notes[2] || '', '답변을 복사했어요. 질문받은 AI 대화에 보내세요.');
    else if (button.hasAttribute('data-copy-prd')) copy(state.prd, '내 PRD를 복사했어요.');
    else if (button.hasAttribute('data-download-prd') && state.prd.trim()) download('내_웹페이지_PRD.md', state.prd);
    else if (button.hasAttribute('data-download-record')) download('50플러스_4주차_PRD_실습기록.txt', record());
    else if (button.hasAttribute('data-close-copy')) $('#copy-dialog').close();
  });
  $('#copy-dialog').addEventListener('close', () => copyOpener?.focus());
  window.addEventListener('hashchange', () => showActivity(true));
  showActivity(); update();
})();
