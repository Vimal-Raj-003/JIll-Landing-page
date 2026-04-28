class FrameEngine {
  constructor(canvasId, folder, totalFrames) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: false });
    this.folder = folder;
    this.totalFrames = totalFrames;
    this.frames = [];
    this.currentIndex = -1;
    this.isPlaying = false;
    this.playMode = 'timed';
    this.fps = 24;
    this.lastFrameTime = 0;
    this.frameInterval = 1000 / this.fps;
    this.onComplete = null;
    this.onFrame = null;
    this.loaded = false;

    this._resize();
    window.addEventListener('resize', () => this._resize());
  }

  _resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.canvas.width = w * dpr;
    this.canvas.height = h * dpr;
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (this.currentIndex >= 0 && this.frames[this.currentIndex]) {
      this._drawFrame(this.currentIndex);
    }
  }

  async preload(batchSize = 12) {
    const promises = [];
    for (let i = 0; i < this.totalFrames; i++) {
      const padded = String(i).padStart(3, '0');
      // Match the actual file naming pattern
      const delay = i % 3 === 0 ? '0.041s' : '0.042s';
      const src = `${this.folder}/frame_${padded}_delay-${delay}.webp`;
      promises.push(this._loadImage(src, i));

      if (promises.length >= batchSize || i === this.totalFrames - 1) {
        await Promise.all(promises.splice(0));
      }
    }
    this.loaded = true;
  }

  async preloadFirst(count = 24) {
    const promises = [];
    for (let i = 0; i < Math.min(count, this.totalFrames); i++) {
      const padded = String(i).padStart(3, '0');
      const delay = i % 3 === 0 ? '0.041s' : '0.042s';
      const src = `${this.folder}/frame_${padded}_delay-${delay}.webp`;
      promises.push(this._loadImage(src, i));
    }
    await Promise.all(promises);

    // Background load remaining frames
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => this._backgroundLoad(count));
    } else {
      setTimeout(() => this._backgroundLoad(count), 1000);
    }
  }

  async _backgroundLoad(startFrom) {
    for (let i = startFrom; i < this.totalFrames; i += 12) {
      const promises = [];
      for (let j = i; j < Math.min(i + 12, this.totalFrames); j++) {
        if (this.frames[j]) continue;
        const padded = String(j).padStart(3, '0');
        const delay = j % 3 === 0 ? '0.041s' : '0.042s';
        const src = `${this.folder}/frame_${padded}_delay-${delay}.webp`;
        promises.push(this._loadImage(src, j));
      }
      await Promise.all(promises);
      // Yield to main thread
      await new Promise(r => setTimeout(r, 16));
    }
    this.loaded = true;
  }

  _loadImage(src, index) {
    return new Promise(resolve => {
      const img = new Image();
      img.onload = () => {
        this.frames[index] = img;
        resolve();
      };
      img.onerror = () => resolve();
      img.src = src;
    });
  }

  _drawFrame(index) {
    if (!this.frames[index]) return;
    const img = this.frames[index];
    const cw = this.canvas.style.width ? parseInt(this.canvas.style.width) : window.innerWidth;
    const ch = this.canvas.style.height ? parseInt(this.canvas.style.height) : window.innerHeight;

    this.ctx.clearRect(0, 0, cw, ch);

    // Cover fit
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
    this.currentIndex = -1;
    this.lastFrameTime = 0;
    this._animate();
  }

  _animate(timestamp) {
    if (!this.isPlaying) return;

    if (!this.lastFrameTime) this.lastFrameTime = timestamp;
    const elapsed = timestamp - this.lastFrameTime;

    if (elapsed >= this.frameInterval) {
      this.lastFrameTime = timestamp - (elapsed % this.frameInterval);
      const nextIndex = this.currentIndex + 1;

      if (nextIndex >= this.totalFrames) {
        this.isPlaying = false;
        if (this.onComplete) this.onComplete();
        return;
      }

      this._drawFrame(nextIndex);
      if (this.onFrame) this.onFrame(nextIndex);
    }

    requestAnimationFrame(t => this._animate(t));
  }

  seekTo(progress) {
    const index = Math.min(
      Math.floor(progress * (this.totalFrames - 1)),
      this.totalFrames - 1
    );
    if (index !== this.currentIndex && this.frames[index]) {
      this._drawFrame(index);
    }
  }

  stop() {
    this.isPlaying = false;
  }

  setOpacity(val) {
    this.canvas.style.opacity = val;
  }

  show() {
    this.canvas.style.opacity = '1';
  }

  hide() {
    this.canvas.style.opacity = '0';
  }

  dim(opacity = 0.3) {
    this.canvas.style.opacity = String(opacity);
  }
}
