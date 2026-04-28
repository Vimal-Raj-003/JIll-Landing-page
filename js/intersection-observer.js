class ScrollReveal {
  constructor() {
    this.observer = null;
    this.counterObserver = null;
  }

  init() {
    // Main reveal observer
    this.observer = new IntersectionObserver(
      (entries) => this._onIntersect(entries),
      {
        threshold: [0, 0.1],
        rootMargin: '0px 0px -60px 0px'
      }
    );

    // Counter observer for stat numbers
    this.counterObserver = new IntersectionObserver(
      (entries) => this._onCounterIntersect(entries),
      {
        threshold: 0.5
      }
    );

    // Observe all reveal elements
    document.querySelectorAll('[data-reveal]').forEach(el => {
      this.observer.observe(el);
    });

    // Observe counters
    document.querySelectorAll('[data-count]').forEach(el => {
      this.counterObserver.observe(el);
    });
  }

  _onIntersect(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const delay = parseInt(el.dataset.revealDelay || '0', 10);

        setTimeout(() => {
          el.classList.add('revealed');
        }, delay);

        this.observer.unobserve(el);
      }
    });
  }

  _onCounterIntersect(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseInt(el.dataset.count, 10);
        this._animateCount(el, target);
        this.counterObserver.unobserve(el);
      }
    });
  }

  _animateCount(el, target) {
    const duration = 2000;
    const start = performance.now();

    const animate = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out quart
      const eased = 1 - Math.pow(1 - progress, 4);
      const current = Math.floor(eased * target);

      el.textContent = current;

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        el.textContent = target;
      }
    };

    requestAnimationFrame(animate);
  }
}
