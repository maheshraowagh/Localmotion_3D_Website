/**
 * LOCAL MOTION - 3D SCROLL ANIMATION & STITCH WEBSITE INTEGRATION
 * Full-screen edge-to-edge canvas + responsive mobile menu + kinetic hero dissolve
 */

(function () {
  'use strict';

  // Environment guard: ensure this script runs strictly in a browser environment
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  const TOTAL_FRAMES = 210;
  const FRAME_PREFIX = 'frames/ezgif-frame-';
  const FRAME_EXT = '.jpg';
  const LERP_FACTOR = 0.15; // Smooth responsive interpolation

  const canvas = document.getElementById('animationCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const scrollTrack = document.getElementById('scrollTrack');
  const heroOverlay = document.getElementById('heroOverlay');

  // Mobile menu elements
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const mobileMenu = document.getElementById('mobileMenu');
  const menuIcon = document.getElementById('menuIcon');
  const closeIcon = document.getElementById('closeIcon');

  const images = [];
  let currentFrame = 0;
  let targetFrame = 0;
  let lastDrawnFrame = -1;

  // --------------------------------------------------------------------------
  // HIGH-DPI CANVAS RESIZING & FULL-SCREEN COVER (ZERO TOP GAP)
  // --------------------------------------------------------------------------
  function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const w = window.innerWidth;
    const h = window.innerHeight;

    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';

    renderCanvasFrame(Math.round(currentFrame));
  }

  window.addEventListener('resize', resizeCanvas);

  function drawImg(img) {
    if (!img) return;
    const cw = canvas.width;
    const ch = canvas.height;
    ctx.clearRect(0, 0, cw, ch);

    const imgW = img.naturalWidth || 1920;
    const imgH = img.naturalHeight || 1080;

    // 100% FULL-SCREEN COVER: fills full viewport width & height edge-to-edge
    const scale = Math.max(cw / imgW, ch / imgH);
    const dw = imgW * scale;
    const dh = imgH * scale;

    // Center horizontally
    const dx = (cw - dw) / 2;

    // Anchor flush to the top (dy = 0) so there is NEVER any line or gap at the top edge
    let dy = 0;
    if (dh < ch) {
      dy = (ch - dh) / 2;
    } else {
      dy = 0;
    }

    ctx.drawImage(img, dx, dy, dw, dh);
  }

  function renderCanvasFrame(frameIdx) {
    const clampedIdx = Math.max(0, Math.min(frameIdx, TOTAL_FRAMES - 1));
    const img = images[clampedIdx];

    if (img && img.complete && img.naturalWidth > 0) {
      drawImg(img);
      lastDrawnFrame = clampedIdx;
      return;
    }

    // Fallback: draw nearest loaded frame so canvas is NEVER blank
    for (let offset = 1; offset < TOTAL_FRAMES; offset++) {
      const prev = images[clampedIdx - offset];
      if (prev && prev.complete && prev.naturalWidth > 0) {
        drawImg(prev);
        lastDrawnFrame = clampedIdx - offset;
        return;
      }
      const next = images[clampedIdx + offset];
      if (next && next.complete && next.naturalWidth > 0) {
        drawImg(next);
        lastDrawnFrame = clampedIdx + offset;
        return;
      }
    }
  }

  // --------------------------------------------------------------------------
  // FRAME PRELOADER WITH AGGRESSIVE RESILIENCE
  // --------------------------------------------------------------------------
  function getFrameUrl(index) {
    const padded = String(index + 1).padStart(3, '0');
    return `${FRAME_PREFIX}${padded}${FRAME_EXT}`;
  }

  function initFrames() {
    for (let i = 0; i < TOTAL_FRAMES; i++) {
      const img = new Image();
      img.src = getFrameUrl(i);

      img.onload = () => {
        // As soon as ANY early frame loads (or the first frame), render immediately
        if (lastDrawnFrame === -1 || (i === 0 && lastDrawnFrame !== 0)) {
          renderCanvasFrame(Math.round(currentFrame));
        }
      };

      img.onerror = () => {
        console.warn(`[3D Can] Frame failed to load: ${img.src}`);
      };

      // If already cached in browser memory, trigger immediate paint
      if (img.complete && img.naturalWidth > 0 && lastDrawnFrame === -1) {
        renderCanvasFrame(0);
      }

      images.push(img);
    }
  }

  // --------------------------------------------------------------------------
  // KINETIC VANISHING HERO OVERLAY ENGINE (BLUR + GLIDE + DISSOLVE)
  // Harmonized with can emergence around scroll progression
  // --------------------------------------------------------------------------
  function updateHeroOverlay(scrollY) {
    if (!heroOverlay) return;
    // Dissolves gracefully across the first 280px of scroll
    const fadeDistance = 280;
    const progress = Math.min(Math.max(scrollY / fadeDistance, 0), 1);
    const opacity = 1 - progress;
    const translateY = -progress * 45; // Gentle upward glide
    const blurPx = (progress * 6).toFixed(1); // Cinematic blur out
    const scale = (1 - progress * 0.04).toFixed(3);

    heroOverlay.style.opacity = opacity.toFixed(3);
    heroOverlay.style.transform = `translate(-50%, calc(-50% + ${translateY.toFixed(1)}px)) scale(${scale})`;
    heroOverlay.style.filter = `blur(${blurPx}px)`;

    if (opacity <= 0.01) {
      heroOverlay.style.visibility = 'hidden';
      heroOverlay.style.pointerEvents = 'none';
    } else {
      heroOverlay.style.visibility = 'visible';
    }
  }

  // --------------------------------------------------------------------------
  // SCROLL PROGRESS HANDLER
  // --------------------------------------------------------------------------
  function onScroll() {
    const scrollY = window.pageYOffset || document.documentElement.scrollTop || 0;
    updateHeroOverlay(scrollY);

    if (!scrollTrack) return;
    const trackHeight = scrollTrack.offsetHeight - window.innerHeight;
    if (trackHeight <= 0) return;

    // Clamped strictly between 0 and 1
    const progress = Math.max(0, Math.min(scrollY / trackHeight, 1));
    targetFrame = progress * (TOTAL_FRAMES - 1);
  }

  window.addEventListener('scroll', onScroll, { passive: true });

  // --------------------------------------------------------------------------
  // SMOOTH NAVBAR SCROLLING & MOBILE MENU ENGINE
  // --------------------------------------------------------------------------
  function initNavigation() {
    // Smooth scrolling on all anchor clicks
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        const targetId = this.getAttribute('href');
        if (!targetId || targetId === '#') return;

        const targetElement = document.querySelector(targetId);
        if (targetElement) {
          e.preventDefault();
          targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });

          // Close mobile menu if open
          if (mobileMenu && !mobileMenu.classList.contains('hidden')) {
            mobileMenu.classList.add('hidden');
            if (menuIcon) menuIcon.classList.remove('hidden');
            if (closeIcon) closeIcon.classList.add('hidden');
          }
        }
      });
    });

    // Mobile Hamburger Menu Toggle
    if (mobileMenuBtn && mobileMenu) {
      mobileMenuBtn.addEventListener('click', () => {
        const isOpen = !mobileMenu.classList.contains('hidden');
        if (isOpen) {
          mobileMenu.classList.add('hidden');
          if (menuIcon) menuIcon.classList.remove('hidden');
          if (closeIcon) closeIcon.classList.add('hidden');
        } else {
          mobileMenu.classList.remove('hidden');
          if (menuIcon) menuIcon.classList.add('hidden');
          if (closeIcon) closeIcon.classList.remove('hidden');
        }
      });
    }
  }

  // --------------------------------------------------------------------------
  // SMOOTH LERP INTERPOLATION LOOP (60FPS / 120FPS)
  // --------------------------------------------------------------------------
  function startAnimationLoop() {
    function animate() {
      const delta = targetFrame - currentFrame;
      currentFrame += delta * LERP_FACTOR;

      const rounded = Math.round(currentFrame);
      if (rounded !== lastDrawnFrame) {
        renderCanvasFrame(rounded);
      }

      requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
  }

  // BOOTSTRAP
  resizeCanvas();
  initFrames();
  initNavigation();
  updateHeroOverlay(window.pageYOffset || 0);
  startAnimationLoop();

})();
