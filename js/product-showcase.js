class ProductShowcase {
  constructor() {
    this.cards = document.querySelectorAll('.product-card');
    this._init();
  }

  _init() {
    if (!this.cards.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const container = entry.target;
            const cards = container.querySelectorAll('.product-card');

            cards.forEach((card, i) => {
              setTimeout(() => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
              }, i * 150);
            });

            observer.unobserve(container);
          }
        });
      },
      { threshold: 0.2, rootMargin: '0px 0px -40px 0px' }
    );

    const grid = document.getElementById('productsGrid');
    if (grid) {
      observer.observe(grid);
    }

    // Set initial state
    this.cards.forEach(card => {
      card.style.opacity = '0';
      card.style.transform = 'translateY(40px)';
      card.style.transition = 'opacity 600ms cubic-bezier(0.16, 1, 0.3, 1), transform 600ms cubic-bezier(0.16, 1, 0.3, 1)';
    });
  }
}
