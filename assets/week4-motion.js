/* Slide 9 only. Navigation and keyboard input belong to the presentation host. */
(() => {
  'use strict';
  const groups = ['developer', 'files', 'server', 'users', 'internet', 'make-link', 'deploy-link', 'request-links', 'response-links'];
  const selected = [groups, ['developer', 'files', 'make-link'], ['files', 'server', 'deploy-link'], ['users', 'internet', 'server', 'request-links'], ['users', 'internet', 'server', 'response-links']];
  const lit = ['make-lit', 'deploy-lit', 'req-left-lit', 'req-right-lit', 'res-left-lit', 'res-right-lit'];
  const activeLit = [lit, ['make-lit'], ['deploy-lit'], ['req-left-lit', 'req-right-lit'], ['res-left-lit', 'res-right-lit']];
  const captions = [
    '배포 = 파일을 서버에 올려, 다른 사람이 주소로 접속할 수 있게 만드는 과정',
    '01 제작 · 개발자가 화면과 기능을 만들고, 코드·이미지 파일을 준비합니다.',
    '02 배포 · 준비한 파일을 서버·호스팅에 올리고, 접속할 수 있는 주소를 만듭니다.',
    '03 접속 · 사용자가 주소를 입력하면, 인터넷을 통해 서버에 요청이 전달됩니다.',
    '04 전달 · 서버가 필요한 파일과 결과를 보내면, 사용자의 브라우저에 화면이 나타납니다.'
  ];
  const durations = [0, 3000, 4000, 4500, 5000];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let root = null;
  let handle = 0;
  let generation = 0;
  let state = {step: 0, complete: false, playing: false};
  const clamp = value => Math.max(0, Math.min(1, value));
  const ease = value => value * value * (3 - 2 * value);
  const node = id => root.querySelector('#w4d-' + id);
  const show = (id, value) => node(id).setAttribute('opacity', String(value));

  function pause() {
    generation += 1;
    if (handle) window.cancelAnimationFrame(handle);
    handle = 0;
    state.playing = false;
  }

  function position(id, pathId, progress) {
    const path = node(pathId);
    const point = path.getPointAtLength(path.getTotalLength() * clamp(progress));
    node(id).setAttribute('transform', `translate(${point.x} ${point.y})`);
  }

  function segment(id, paths, progress) {
    // The globe separates the two arrows: the packet enters and then leaves it.
    const fraction = clamp(progress) * paths.length;
    const index = Math.min(paths.length - 1, Math.floor(fraction));
    position(id, paths[index], fraction - index);
  }

  function reset(step, complete) {
    const visibleStep = complete ? 0 : step;
    groups.forEach(id => show(id, selected[visibleStep].includes(id) ? 1 : .2));
    lit.forEach(id => show(id, activeLit[visibleStep].includes(id) ? 1 : 0));
    ['moving-code', 'moving-request', 'moving-screen', 'server-pulse', 'success'].forEach(id => show(id, 0));
    const bounds = visibleStep === 1 ? [64, 188, 875, 325] : [529, 188, 985, 325];
    const focus = node('focus-box');
    ['x', 'y', 'width', 'height'].forEach((key, index) => focus.setAttribute(key, bounds[index]));
    focus.style.opacity = visibleStep === 1 || visibleStep === 2 ? '.65' : '0';
    node('caption').textContent = captions[visibleStep];
    root.dataset.step = String(visibleStep);
    root.dataset.complete = String(complete);
  }

  function finish(step) {
    ['moving-code', 'moving-request', 'moving-screen', 'server-pulse'].forEach(id => show(id, 0));
    show('success', step === 4 ? 1 : 0);
    handle = 0;
    state.playing = false;
  }

  function render(step, progress) {
    const travel = clamp(progress / .88);
    const opacity = Math.min(1, travel * 10, (1 - travel) * 10);
    if (step === 1 || step === 2) {
      position('moving-code', step === 1 ? 'make-path' : 'deploy-path', ease(travel));
      show('moving-code', opacity);
      if (step === 2) {
        const pulse = clamp((progress - .68) / .32);
        show('server-pulse', Math.sin(pulse * Math.PI));
        node('server-pulse').setAttribute('r', String(16 + pulse * 15));
      }
    } else if (step === 3) {
      segment('moving-request', ['req-left', 'req-right'], travel);
      show('moving-request', opacity);
    } else if (step === 4) {
      segment('moving-screen', ['res-right', 'res-left'], ease(travel));
      show('moving-screen', opacity);
      show('success', clamp((progress - .72) / .2));
    }
  }

  function apply(step, complete = false, animate = true) {
    pause();
    root = document.querySelector('#slide-9 .deployment-diagram');
    if (!root) return;
    const number = Number(step);
    step = Number.isFinite(number) ? Math.max(0, Math.min(4, Math.trunc(number))) : 0;
    complete = Boolean(complete);
    state = {step, complete, playing: false};
    reset(step, complete);
    if (complete || step === 0) return;
    if (!animate || reducedMotion.matches) {
      finish(step);
      return;
    }
    const token = generation;
    const start = performance.now();
    state.playing = true;
    render(step, 0);
    function frame(now) {
      if (token !== generation) return;
      const progress = clamp((now - start) / durations[step]);
      render(step, progress);
      if (progress >= 1) finish(step);
      else handle = window.requestAnimationFrame(frame);
    }
    handle = window.requestAnimationFrame(frame);
  }

  reducedMotion.addEventListener('change', event => {
    if (event.matches && state.playing) apply(state.step, state.complete, false);
  });
  window.week4Motion = Object.freeze({apply, pause, getState: () => ({...state})});
})();
