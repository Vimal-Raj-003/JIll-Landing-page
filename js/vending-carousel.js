class VendingCarousel {
  constructor() {
    this.track = document.getElementById('vendingCarouselTrack');
    this.images = this.track ? this.track.querySelectorAll('img') : [];
    this.features = document.querySelectorAll('.vending-feature[data-slide]');
    this.currentIndex = 0;
    this.interval = 3000;

    if (this.images.length === 0) return;

    this.images[0].classList.add('active');
    this.syncFeatures(this.images[0].dataset.slide);
    this.start();
  }

  syncFeatures(slideId) {
    this.features.forEach(f => {
      if (f.dataset.slide === slideId) {
        f.classList.add('active');
      } else {
        f.classList.remove('active');
      }
    });
  }

  goTo(index) {
    this.images.forEach(img => img.classList.remove('active'));
    this.images[index].classList.add('active');
    this.syncFeatures(this.images[index].dataset.slide);
    this.currentIndex = index;
  }

  next() {
    const nextIndex = (this.currentIndex + 1) % this.images.length;
    this.goTo(nextIndex);
  }

  start() {
    this.timer = setInterval(() => this.next(), this.interval);

    this.features.forEach(feature => {
      feature.addEventListener('mouseenter', () => {
        clearInterval(this.timer);
        const slideId = feature.dataset.slide;
        const idx = Array.from(this.images).findIndex(img => img.dataset.slide === slideId);
        if (idx !== -1) this.goTo(idx);
      });

      feature.addEventListener('mouseleave', () => {
        this.timer = setInterval(() => this.next(), this.interval);
      });
    });
  }
}
