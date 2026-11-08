/* Pan and zoom the same screenshot, like a presentation morph transition. */
(() => {
 'use strict';
 const records = new WeakMap();
 const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
 const duration = 850;
 const namespace = 'http://www.w3.org/2000/svg';
 const box = svg => svg.getAttribute('viewBox').trim().split(/[\s,]+/).map(Number);

 function prepare(slide) {
  if (records.has(slide)) return records.get(slide);
  const svg = slide.querySelector('.shot-full svg');
  const details = [...slide.querySelectorAll('.shot-zoom[data-reveal-step]')];
  if (!svg || !details.length) return null;
  const full = {box:box(svg), label:svg.getAttribute('aria-label')};
  const targets = new Map(details.map(figure => {
   const detail = figure.querySelector('svg');
   return [Number(figure.dataset.revealStep), {box:box(detail), label:detail.getAttribute('aria-label')}];
  }));
  const defs = document.createElementNS(namespace, 'defs');
  const clip = document.createElementNS(namespace, 'clipPath');
  const rect = document.createElementNS(namespace, 'rect');
  clip.id = 'shot-morph-clip-' + slide.id;
  clip.append(rect); defs.append(clip);
  const group = document.createElementNS(namespace, 'g');
  group.setAttribute('clip-path', 'url(#' + clip.id + ')');
  while (svg.firstChild) group.append(svg.firstChild);
  svg.append(defs, group);
  const record = {svg, rect, full, targets, current:full.box, target:null, frame:0, complete:false};
  records.set(slide, record);
  return record;
 }

 function draw(record, value) {
  record.current = value;
  record.svg.setAttribute('viewBox', value.join(' '));
  ['x', 'y', 'width', 'height'].forEach((name, i) => record.rect.setAttribute(name, value[i]));
 }

 function apply(slide, step, complete, animate) {
  const record = prepare(slide);
  if (!record) return;
  const target = complete ? record.full : record.targets.get(step) || record.full;
  record.svg.setAttribute('aria-label', target.label);
  // Repeated updates must not restart an in-flight camera move.
  if (record.target === target && record.complete === complete && (animate || !record.frame)) return;
  cancelAnimationFrame(record.frame);
  record.frame = 0;
  const canAnimate = animate && !complete && !record.complete && !reducedMotion.matches;
  record.target = target;
  record.complete = complete;
  if (!canAnimate) { draw(record, target.box); return; }
  // Start at the current camera position so a quick reverse never jumps.
  const start = [...record.current], began = performance.now();
  function tick(now) {
   const progress = Math.min(1, (now - began) / duration);
   const eased = progress < .5 ? 4 * progress ** 3 : 1 - (-2 * progress + 2) ** 3 / 2;
   if (reducedMotion.matches || progress === 1) {
    draw(record, target.box); record.frame = 0; return;
   }
   draw(record, start.map((value, i) => value + (target.box[i] - value) * eased));
   record.frame = requestAnimationFrame(tick);
  }
  record.frame = requestAnimationFrame(tick);
 }
 window.week3ShotMorph = {apply};
})();
