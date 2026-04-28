class LoginModal {
  constructor() {
    this.overlay = document.getElementById('loginModal');
    this.closeBtn = document.getElementById('modalClose');
    this.loginBtn = document.getElementById('loginBtn');
    this.loginBtnMobile = document.getElementById('loginBtnMobile');
    this.form = document.getElementById('loginForm');

    this._init();
  }

  _init() {
    if (!this.overlay) return;

    this.loginBtn?.addEventListener('click', () => this._open());
    this.loginBtnMobile?.addEventListener('click', () => this._open());
    this.closeBtn?.addEventListener('click', () => this._close());

    // Close on overlay click
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) this._close();
    });

    // Close on escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this._close();
    });

    // Form submit
    this.form?.addEventListener('submit', (e) => {
      e.preventDefault();
      // Placeholder - ready for API integration
      const email = document.getElementById('loginEmail')?.value;
      const password = document.getElementById('loginPassword')?.value;
      console.log('Login attempt:', { email, password: '***' });
      alert('Login functionality will be connected to the backend soon.');
    });

    // Focus trap
    this.overlay.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        this._trapFocus(e);
      }
    });
  }

  _open() {
    this.overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    // Focus first input
    setTimeout(() => {
      document.getElementById('loginEmail')?.focus();
    }, 300);
  }

  _close() {
    this.overlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  _trapFocus(e) {
    const focusable = this.overlay.querySelectorAll('input, button, a, [tabindex]:not([tabindex="-1"])');
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }
}
