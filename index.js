// ====== Top Navbar (Part 1) - Drawer ======
(function () {
  const toggleBtn = document.querySelector('.nav__toggle');
  const menu = document.querySelector('#primary-menu');
  const overlay = document.querySelector('[data-nav-overlay]');
  if (!toggleBtn || !menu || !overlay) return;

  function openMenu() {
    menu.classList.add('is-open');
    overlay.classList.add('is-open');
    toggleBtn.setAttribute('aria-expanded', 'true');
    toggleBtn.setAttribute('aria-label', 'Close menu');
    document.documentElement.style.overflow = 'hidden'; // 防止抽屉打开时页面滚动
  }

  function closeMenu() {
    menu.classList.remove('is-open');
    overlay.classList.remove('is-open');
    toggleBtn.setAttribute('aria-expanded', 'false');
    toggleBtn.setAttribute('aria-label', 'Open menu');
    document.documentElement.style.overflow = '';       // 恢复滚动
  }

  function isOpen() {
    return menu.classList.contains('is-open');
  }

  toggleBtn.addEventListener('click', function () {
    isOpen() ? closeMenu() : openMenu();
  });

  overlay.addEventListener('click', closeMenu);

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && isOpen()) closeMenu();
  });

  menu.addEventListener('click', function (e) {
    const target = e.target;
    if (target && target.matches('a.nav__link')) closeMenu();
  });

  window.addEventListener('resize', function () {
    if (window.innerWidth > 720) closeMenu();
  });
})();

// ====== Part 3: Contact Carousel (auto + swipe, no buttons, px-based) ======
(function () {
  const root = document.querySelector('[data-carousel="root"]');
  if (!root) return;

  const track = root.querySelector('[data-carousel="track"]');
  const viewport = root.querySelector('[data-carousel="viewport"]');
  const slides = Array.prototype.slice.call(root.querySelectorAll('[data-carousel="slide"]'));
  const dotsWrap = root.querySelector('[data-carousel="dots"]');

  if (!track || !viewport || slides.length === 0 || !dotsWrap) return;

  let index = 0;
  let timerId = null;

  // swipe state
  let isDragging = false;
  let startX = 0;
  let currentX = 0;
  let startTime = 0;

  function clamp(i) {
    if (i < 0) return slides.length - 1;
    if (i >= slides.length) return 0;
    return i;
  }

  function vw() {
    return viewport.clientWidth || 1;
  }

  function setTransition(on) {
    track.style.transition = on ? 'transform 320ms ease' : 'none';
  }

  function applyTransformPx(x) {
    track.style.transform = 'translate3d(' + x + 'px, 0, 0)';
  }

  function render() {
    // 强制对齐到“整页像素”
    applyTransformPx(-index * vw());

    const dots = Array.prototype.slice.call(dotsWrap.querySelectorAll('.carousel__dot'));
    for (let i = 0; i < dots.length; i++) {
      if (i === index) dots[i].classList.add('is-active');
      else dots[i].classList.remove('is-active');
    }
  }

  function goTo(i) {
    index = clamp(i);
    setTransition(true);
    render();
  }

  function next() { goTo(index + 1); }
  function prev() { goTo(index - 1); }

  function buildDots() {
    dotsWrap.innerHTML = '';
    for (let i = 0; i < slides.length; i++) {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'carousel__dot' + (i === 0 ? ' is-active' : '');
      dot.setAttribute('aria-label', 'Go to slide ' + (i + 1));
      dot.addEventListener('click', function () {
        goTo(i);
        restartAuto();
      });
      dotsWrap.appendChild(dot);
    }
  }

  // Auto play
  function startAuto() {
    stopAuto();
    timerId = window.setInterval(function () {
      next();
    }, 3500);
  }

  function stopAuto() {
    if (timerId !== null) {
      window.clearInterval(timerId);
      timerId = null;
    }
  }

  function restartAuto() {
    startAuto();
  }

  // Desktop: hover pause
  root.addEventListener('mouseenter', stopAuto);
  root.addEventListener('mouseleave', startAuto);

  // ===== Swipe (touch + mouse drag) =====
  function getClientX(e) {
    if (e.touches && e.touches.length) return e.touches[0].clientX;
    if (e.changedTouches && e.changedTouches.length) return e.changedTouches[0].clientX;
    return e.clientX;
  }

  function onDragStart(e) {
    isDragging = true;
    startX = getClientX(e);
    currentX = startX;
    startTime = Date.now();

    stopAuto();
    setTransition(false);

    if (e.type === 'mousedown') e.preventDefault();
  }

  function onDragMove(e) {
    if (!isDragging) return;
    currentX = getClientX(e);

    const dx = currentX - startX;          // 正：向右拖
    const base = -index * vw();            // 当前页的基准位置（px）
    applyTransformPx(base + dx);           // 跟手移动（px）
  }

  function onDragEnd() {
    if (!isDragging) return;
    isDragging = false;

    const dx = currentX - startX;
    const dt = Date.now() - startTime;

    const width = vw();
    const distanceOk = Math.abs(dx) > Math.min(70, width * 0.18);
    const fastSwipe = Math.abs(dx) > 35 && dt < 220;

    setTransition(true);

    if (distanceOk || fastSwipe) {
      if (dx < 0) next();  // 向左滑 => 下一张
      else prev();         // 向右滑 => 上一张
    } else {
      // 回弹到当前页
      render();
    }

    // 再强制一次归位（防止任何残留）
    setTransition(true);
    render();

    restartAuto();
  }

  // touch
  viewport.addEventListener('touchstart', onDragStart, { passive: true });
  viewport.addEventListener('touchmove', onDragMove, { passive: true });
  viewport.addEventListener('touchend', onDragEnd, { passive: true });

  // mouse drag (可选)
  viewport.addEventListener('mousedown', onDragStart);
  window.addEventListener('mousemove', onDragMove);
  window.addEventListener('mouseup', onDragEnd);

  // 窗口变化时重新对齐（手机旋转、缩放时很重要）
  window.addEventListener('resize', function () {
    setTransition(false);
    render();
    setTransition(true);
  });

  // init
  buildDots();
  setTransition(true);
  render();
  startAuto();
})();