class ProblemCarousel {
  constructor() {
    this.INTERVAL_MS = 2300;
    // 4 cards × 575ms = INTERVAL_MS, so after staggered startup the four
    // cards tick exactly INTERVAL_MS apart and never realign. Keep this
    // relationship if the card count or interval changes.
    this.STAGGER_MS = 575;

    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const cards = document.querySelectorAll('#problem .problem-grid .card');
    cards.forEach((card, n) => this.startCard(card, n * this.STAGGER_MS));
  }

  activate(nodes, index) {
    nodes.forEach((node, i) => {
      if (i === index) {
        node.classList.add('active');
        node.removeAttribute('aria-hidden');
      } else {
        node.classList.remove('active');
        node.setAttribute('aria-hidden', 'true');
      }
    });
  }

  startCard(card, offsetMs) {
    const imgStack = card.querySelector('.card-img-stack');
    const txtStack = card.querySelector('.card-text-stack');
    if (!imgStack || !txtStack) return;

    const imgs = imgStack.querySelectorAll('img');
    const txts = txtStack.querySelectorAll('p');
    const count = Math.min(imgs.length, txts.length);
    if (count < 2) return;

    let i = 0;
    this.activate(imgs, 0);
    this.activate(txts, 0);

    setTimeout(() => {
      setInterval(() => {
        i = (i + 1) % count;
        this.activate(imgs, i);
        this.activate(txts, i);
      }, this.INTERVAL_MS);
    }, offsetMs);
  }
}
