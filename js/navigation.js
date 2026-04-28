class Navigation {
  constructor() {
    this.nav = document.getElementById('navbar');
    this.hamburger = document.getElementById('hamburger');
    this.mobileMenu = document.getElementById('mobileMenu');
    this.links = document.querySelectorAll('.nav-link');
    this.isOpen = false;

    this._init();
  }

  _init() {
    if (this.hamburger) {
      this.hamburger.addEventListener('click', () => this._toggleMobile());
    }

    // Close mobile menu on link click
    this.links.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = link.getAttribute('href').substring(1);
        const target = document.getElementById(targetId);

        if (target) {
          target.scrollIntoView({ behavior: 'smooth' });
        }

        if (this.isOpen) {
          this._closeMobile();
        }
      });
    });

    // Close mobile menu on escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this._closeMobile();
      }
    });
  }

  _toggleMobile() {
    this.isOpen = !this.isOpen;
    this.hamburger.classList.toggle('active', this.isOpen);
    this.mobileMenu.classList.toggle('active', this.isOpen);
    document.body.style.overflow = this.isOpen ? 'hidden' : '';
  }

  _closeMobile() {
    this.isOpen = false;
    this.hamburger.classList.remove('active');
    this.mobileMenu.classList.remove('active');
    document.body.style.overflow = '';
  }
}
