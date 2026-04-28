class ScrollHandler {
  constructor() {
    this.ticking = false;
    this.scrollProgress = 0;
    this.currentSection = '';
    this.lastScrollY = 0;
    this.heroEngine = null;
    this.endEngine = null;
    this.navElement = null;
    this.heroHeight = 0;
    this.endSection = null;
    this.hasScrolledAway = false;
    this.heroReplayed = false;

    this._onScroll = this._onScroll.bind(this);
    this._update = this._update.bind(this);
  }

  init(heroEngine, endEngine, navElement) {
    this.heroEngine = heroEngine;
    this.endEngine = endEngine;
    this.navElement = navElement;
    this.heroHeight = window.innerHeight;
    this.endSection = document.getElementById('endSection');

    window.addEventListener('scroll', this._onScroll, { passive: true });
    window.addEventListener('resize', () => {
      this.heroHeight = window.innerHeight;
    });
  }

  _onScroll() {
    if (this.ticking) return;
    this.ticking = true;
    requestAnimationFrame(this._update);
  }

  _update() {
    const scrollY = window.scrollY;
    const docHeight = document.documentElement.scrollHeight;
    const viewHeight = window.innerHeight;
    const maxScroll = docHeight - viewHeight;

    this.scrollProgress = maxScroll > 0 ? scrollY / maxScroll : 0;
    const scrollingDown = scrollY > this.lastScrollY;
    this.lastScrollY = scrollY;

    // Track if user has scrolled away from hero
    if (scrollY > this.heroHeight * 0.5) {
      this.hasScrolledAway = true;
    }

    // Nav visibility
    if (this.navElement) {
      if (scrollY > 100) {
        this.navElement.classList.add('scrolled');
        if (scrollingDown && scrollY > this.heroHeight) {
          this.navElement.classList.add('hidden');
        } else {
          this.navElement.classList.remove('hidden');
        }
      } else {
        this.navElement.classList.remove('scrolled');
        this.navElement.classList.remove('hidden');
      }
    }

    // Hero canvas opacity: dim immediately on scroll, fully gone by 3x viewport
    if (this.heroEngine && this.heroEngine.canvas) {
      if (scrollY < this.heroHeight * 3) {
        // Start dimming from scroll position 0
        // 0px = opacity 1, at 3x viewport = opacity 0.15
        const progress = scrollY / (this.heroHeight * 3);
        this.heroEngine.setOpacity(Math.max(0.15, 1 - progress * 0.85));
      } else {
        this.heroEngine.setOpacity(0.15);
      }

      // Replay animation if user scrolled away and came back to top
      if (scrollY < this.heroHeight * 0.3) {
        if (this.hasScrolledAway && !this.heroReplayed && !this.heroEngine.isPlaying) {
          this.heroReplayed = true;
          this.heroEngine.play();
          const overlay = document.getElementById('heroOverlay');
          if (overlay) overlay.classList.remove('visible');

          const origOnFrame = this.heroEngine.onFrame;
          this.heroEngine.onFrame = (index) => {
            if (index >= 144 && overlay && !overlay.classList.contains('visible')) {
              overlay.classList.add('visible');
            }
            if (origOnFrame) origOnFrame(index);
          };
        }
      }

      // Reset replay flag when user scrolls away
      if (scrollY > this.heroHeight * 0.5) {
        this.heroReplayed = false;
      }
    }

    // End animation trigger
    if (this.endEngine && this.endSection) {
      const endRect = this.endSection.getBoundingClientRect();
      const endVisible = endRect.top < viewHeight * 0.85;

      if (endVisible && !this.endEngine.isPlaying && this.endEngine.loaded) {
        this.endEngine.canvas.style.opacity = '1';
        this.endEngine.play();
      }
    }

    // Active nav link
    this._updateActiveNav(scrollY);

    this.ticking = false;
  }

  _updateActiveNav(scrollY) {
    const sections = ['hero', 'about', 'problem', 'solution', 'how-it-works', 'products', 'vending', 'advantages', 'impact', 'pricing', 'cta'];
    const links = document.querySelectorAll('.nav-link');

    let currentId = '';
    for (const id of sections) {
      const el = document.getElementById(id);
      if (el) {
        const rect = el.getBoundingClientRect();
        if (rect.top <= 200) {
          currentId = id;
        }
      }
    }

    links.forEach(link => {
      const href = link.getAttribute('href');
      if (href === '#' + currentId) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }
}
