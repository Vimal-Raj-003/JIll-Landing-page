class DistributionPlayer {
  constructor(canvasId, folder, totalFrames) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.folder = folder;
    this.totalFrames = totalFrames;
    this.frames = [];
    this.currentIndex = -1;
    this.fps = 24;
    this.frameInterval = 1000 / this.fps;
    this.isPlaying = false;
    this.lastFrameTime = 0;

    this._resize();
    window.addEventListener('resize', () => this._resize());

    // Auto-play when visible
    this._observe();
  }

  _resize() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (this.currentIndex >= 0 && this.frames[this.currentIndex]) {
      this._drawFrame(this.currentIndex);
    }
  }

  _observe() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !this.isPlaying) {
          this._startPreloadAndPlay();
        } else if (!entry.isIntersecting && this.isPlaying) {
          this.isPlaying = false;
        }
      });
    }, { threshold: 0.3 });
    observer.observe(this.canvas);
  }

  async _startPreloadAndPlay() {
    if (this.frames.length > 0) {
      this.play();
      return;
    }
    // Load first batch, then start playing while loading rest
    const batch = 24;
    const promises = [];
    for (let i = 0; i < Math.min(batch, this.totalFrames); i++) {
      promises.push(this._loadFrame(i));
    }
    await Promise.all(promises);
    this.play();

    // Background load remaining
    this._backgroundLoad(batch);
  }

  async _backgroundLoad(startFrom) {
    for (let i = startFrom; i < this.totalFrames; i += 12) {
      const promises = [];
      for (let j = i; j < Math.min(i + 12, this.totalFrames); j++) {
        if (this.frames[j]) continue;
        promises.push(this._loadFrame(j));
      }
      await Promise.all(promises);
      await new Promise(r => setTimeout(r, 16));
    }
  }

  _loadFrame(index) {
    return new Promise(resolve => {
      const img = new Image();
      img.onload = () => { this.frames[index] = img; resolve(); };
      img.onerror = () => resolve();
      const padded = String(index).padStart(3, '0');
      const delay = index % 3 === 0 ? '0.041s' : '0.042s';
      img.src = `${this.folder}/frame_${padded}_delay-${delay}.webp`;
    });
  }

  _drawFrame(index) {
    if (!this.frames[index]) return;
    const img = this.frames[index];
    const cw = this.canvas.getBoundingClientRect().width;
    const ch = this.canvas.getBoundingClientRect().height;

    this.ctx.clearRect(0, 0, cw, ch);

    const imgAspect = img.naturalWidth / img.naturalHeight;
    const canvasAspect = cw / ch;
    let sx, sy, sw, sh;

    if (imgAspect > canvasAspect) {
      sh = img.naturalHeight;
      sw = sh * canvasAspect;
      sx = (img.naturalWidth - sw) / 2;
      sy = 0;
    } else {
      sw = img.naturalWidth;
      sh = sw / canvasAspect;
      sx = 0;
      sy = (img.naturalHeight - sh) / 2;
    }

    this.ctx.drawImage(img, sx, sy, sw, sh, 0, 0, cw, ch);
    this.currentIndex = index;
  }

  play() {
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.lastFrameTime = 0;
    this._animate();
  }

  _animate(timestamp) {
    if (!this.isPlaying) return;
    if (!timestamp) { requestAnimationFrame(t => this._animate(t)); return; }

    if (!this.lastFrameTime) this.lastFrameTime = timestamp;
    const elapsed = timestamp - this.lastFrameTime;

    if (elapsed >= this.frameInterval) {
      this.lastFrameTime = timestamp - (elapsed % this.frameInterval);
      let nextIndex = this.currentIndex + 1;

      // Loop when reaching the end
      if (nextIndex >= this.totalFrames) {
        nextIndex = 0;
      }

      if (this.frames[nextIndex]) {
        this._drawFrame(nextIndex);
      }
    }

    requestAnimationFrame(t => this._animate(t));
  }
}
