/* Keep the original screenshot intact and move a camera over that same image. */
(() => {
  'use strict';

  const DURATION = 850;
  const states = new Map();
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const matrix = (sx, sy, x, y) => `matrix(${sx}, 0, 0, ${sy}, ${x}, ${y})`;

  function resolveSlide(slide) {
    if (slide && slide.nodeType === 1) return slide;
    const number = Number(String(slide).replace(/^#?slide-/, ''));
    return Number.isFinite(number) ? document.getElementById(`slide-${number}`) : null;
  }

  function metadata(slide) {
    const number = Number(slide.dataset.slide);
    return (window.WEEK4_META || []).find(item => Number(item.number) === number);
  }

  function baseline(picture) {
    const crop = picture.crop || [0, 0, 0, 0];
    const [left, top, right, bottom] = crop;
    const sx = picture.w / (picture.width * (1 - left - right));
    const sy = picture.h / (picture.height * (1 - top - bottom));
    return matrix(sx, sy, -left * picture.width * sx, -top * picture.height * sy);
  }

  function targetTransform(picture, region) {
    if (!Array.isArray(region) || region.length !== 4) return baseline(picture);
    const [left, top, right, bottom] = region.map(value => clamp(Number(value), 0, 1));
    if (![left, top, right, bottom].every(Number.isFinite) || right <= left || bottom <= top) {
      return baseline(picture);
    }
    // Aspect-fit the requested source rectangle, without stretching the image.
    const scale = Math.min(
      picture.w / ((right - left) * picture.width),
      picture.h / ((bottom - top) * picture.height)
    );
    const width = picture.width * scale;
    const height = picture.height * scale;
    let x = picture.w / 2 - (left + right) / 2 * width;
    let y = picture.h / 2 - (top + bottom) / 2 * height;
    // Near image edges, retain the screenshot background rather than exposing a gap.
    x = width >= picture.w ? clamp(x, picture.w - width, 0) : (picture.w - width) / 2;
    y = height >= picture.h ? clamp(y, picture.h - height, 0) : (picture.h - height) / 2;
    return matrix(scale, scale, x, y);
  }

  function makeState(slide, config) {
    const canvas = slide.querySelector('.slide-canvas');
    const picture = config.picture;
    if (!canvas || !picture || !picture.src ||
        ![picture.width, picture.height, picture.w, picture.h].every(value => Number(value) > 0)) {
      return null;
    }
    const overlay = document.createElement('div');
    overlay.className = 'week4-shot-morph';
    overlay.setAttribute('aria-hidden', 'true');
    overlay.dataset.sourceShapeId = String(picture.shape_id || '');
    overlay.style.left = `${picture.x}px`;
    overlay.style.top = `${picture.y}px`;
    overlay.style.width = `${picture.w}px`;
    overlay.style.height = `${picture.h}px`;
    overlay.hidden = true;

    const image = document.createElement('img');
    image.className = 'week4-shot-morph__image';
    image.src = picture.src;
    image.alt = '';
    image.width = picture.width;
    image.height = picture.height;
    image.draggable = false;
    image.decoding = 'async';
    image.style.width = `${picture.width}px`;
    image.style.height = `${picture.height}px`;
    image.style.transform = baseline(picture);
    overlay.append(image);
    canvas.append(overlay);
    const state = {slide, config, picture, overlay, image, animation: null,
      target: baseline(picture), step: 0};
    states.set(slide, state);
    return state;
  }

  function stop(state) {
    // Capture the interpolated matrix before cancelling, so a quick second click
    // continues from the current camera position instead of jumping backwards.
    const current = getComputedStyle(state.image).transform;
    if (state.animation) {
      state.animation.cancel();
      state.animation = null;
    }
    if (current && current !== 'none') state.image.style.transform = current;
    return current && current !== 'none' ? current : state.image.style.transform;
  }

  function settle(state) {
    if (state.animation) state.animation.cancel();
    state.animation = null;
    state.image.style.transform = state.target;
    state.overlay.hidden = state.step === 0;
  }

  function apply(slide, n, complete = false, animate = true) {
    const element = resolveSlide(slide);
    if (!element) return;
    const config = metadata(element)?.morph;
    if (!config) return;
    const state = states.get(element) || makeState(element, config);
    if (!state) return;
    const regions = config.regions || [];
    const step = complete ? 0 : clamp(Math.floor(Number(n) || 0), 0, regions.length);
    const from = stop(state);
    state.step = step;
    state.target = step === 0 ? baseline(state.picture) : targetTransform(state.picture, regions[step - 1]);
    state.overlay.dataset.step = String(step);

    if (complete || !animate || motion.matches || typeof state.image.animate !== 'function') {
      settle(state);
      return;
    }
    // Step 0 at rest is the original PPT image. During reverse navigation the
    // camera returns to the original view before its overlay is hidden.
    if (step === 0 && state.overlay.hidden) {
      settle(state);
      return;
    }
    state.overlay.hidden = false;
    state.image.style.transform = state.target;
    if (from === state.target) {
      settle(state);
      return;
    }
    const animation = state.image.animate(
      [{transform: from}, {transform: state.target}],
      {duration: DURATION, easing: 'ease-in-out', fill: 'none'}
    );
    state.animation = animation;
    animation.onfinish = () => {
      if (state.animation !== animation) return;
      state.animation = null;
      state.overlay.hidden = state.step === 0;
    };
  }

  function pause() {
    states.forEach(state => stop(state));
  }

  const onMotionChange = () => {
    if (motion.matches) states.forEach(settle);
  };
  if (motion.addEventListener) motion.addEventListener('change', onMotionChange);
  else if (motion.addListener) motion.addListener(onMotionChange);

  window.week4ShotMorph = Object.freeze({apply, pause});
})();
