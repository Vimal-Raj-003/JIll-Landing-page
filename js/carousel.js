class Carousel {
  constructor() {
    this.track = document.getElementById('carouselTrack');
    this.container = document.getElementById('carouselContainer');
    if (!this.track || !this.container) return;

    this.images = this.track.querySelectorAll('img');
    this.total = this.images.length; // 6 (5 originals + 1 duplicate of first)
    this.currentIndex = 0;
    this.isTransitioning = false;
    this.interval = 6000; // 6 seconds per slide (Phase A — bigger, calmer carousel)

    this._init();
  }

  _init() {
    this._slide();

    // Pause on hover
    this.container.addEventListener('mouseenter', () => this._pause());
    this.container.addEventListener('mouseleave', () => this._slide());
  }

  _slide() {
    this._clearTimer();
    this._timer = setInterval(() => this._next(), this.interval);
  }

  _pause() {
    this._clearTimer();
  }

  _clearTimer() {
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = null;
    }
  }

  _next() {
    if (this.isTransitioning) return;
    this.isTransitioning = true;
    this.currentIndex++;

    // Move to next slide with smooth transition
    this.track.style.transition = 'transform 0.8s cubic-bezier(0.25, 1, 0.5, 1)';
    this.track.style.transform = `translateX(-${this.currentIndex * 100}%)`;

    // After transition ends
    setTimeout(() => {
      // If we reached the duplicate (last image = copy of first)
      if (this.currentIndex >= this.total - 1) {
        // Instantly jump back to the real first slide (no transition)
        this.track.style.transition = 'none';
        this.currentIndex = 0;
        this.track.style.transform = 'translateX(0)';

        // Force reflow so the instant jump takes effect
        this.track.offsetHeight;

        // Re-enable transitions for the next slide
        this.track.style.transition = 'transform 0.8s cubic-bezier(0.25, 1, 0.5, 1)';
      }
      this.isTransitioning = false;
    }, 850);
  }
}
