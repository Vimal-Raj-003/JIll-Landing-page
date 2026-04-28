(function () {
  'use strict';

  const HERO_FRAME_COUNT = 192;
  const END_FRAME_COUNT = 192;
  const HERO_FOLDER = 'Background-animation/Hero-Section';
  const END_FOLDER = 'Background-animation/ENd animation';
  const HERO_OVERLAY_FRAME = 144;

  let heroEngine, endEngine, scrollHandler;

  function init() {
    // Initialize hero canvas engine
    heroEngine = new FrameEngine('hero-canvas', HERO_FOLDER, HERO_FRAME_COUNT);

    // Initialize end canvas engine
    endEngine = new FrameEngine('end-canvas', END_FOLDER, END_FRAME_COUNT);

    // Initialize navigation
    new Navigation();

    // Initialize login modal
    new LoginModal();

    // Initialize product showcase
    new ProductShowcase();

    // Initialize image carousel
    new Carousel();

    // Initialize vending image carousel
    new VendingCarousel();

    // Initialize distribution animation in product section
    new DistributionPlayer('distribution-canvas', 'Background-animation/Distribution', 192);

    // Initialize scroll reveal
    const scrollReveal = new ScrollReveal();
    scrollReveal.init();

    // Start loading and playing hero animation
    startHeroSequence();

    // Initialize scroll handler
    scrollHandler = new ScrollHandler();
    scrollHandler.init(heroEngine, endEngine, document.getElementById('navbar'));

    // Preload end frames in background
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        endEngine.preload(24);
      }, { timeout: 5000 });
    } else {
      setTimeout(() => endEngine.preload(24), 3000);
    }
  }

  async function startHeroSequence() {
    // Load first 24 frames, then start playing
    await heroEngine.preloadFirst(24);

    // Set hero overlay frame callback
    heroEngine.onFrame = function (index) {
      if (index >= HERO_OVERLAY_FRAME) {
        const overlay = document.getElementById('heroOverlay');
        const gradient = document.getElementById('heroGradient');
        const scrollIndicator = document.querySelector('.hero-scroll-indicator');
        if (overlay && !overlay.classList.contains('visible')) {
          overlay.classList.add('visible');
        }
        if (gradient && !gradient.classList.contains('visible')) {
          gradient.classList.add('visible');
        }
        if (scrollIndicator && !scrollIndicator.classList.contains('visible')) {
          scrollIndicator.classList.add('visible');
        }
      }
    };

    heroEngine.onComplete = function () {
      // After hero completes, continue loading remaining frames in background
      // The canvas stays on the last frame
    };

    // Start playing
    heroEngine.play();
  }

  // Wait for DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
