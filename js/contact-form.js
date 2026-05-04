class ContactForm {
  constructor() {
    this.form = document.getElementById('contactForm');
    if (!this.form) return;
    this.status = this.form.querySelector('.form-status');
    this.submit = this.form.querySelector('button[type="submit"]');
    this.defaultLabel = this.submit.textContent;
    this.form.addEventListener('submit', this.onSubmit.bind(this));
  }

  setState(label, message, disabled) {
    this.submit.textContent = label;
    this.submit.disabled = disabled;
    this.status.textContent = message;
  }

  async onSubmit(event) {
    event.preventDefault();
    if (!this.form.reportValidity()) return;

    this.setState('Sending…', '', true);
    const payload = Object.fromEntries(new FormData(this.form));

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (data.ok) {
        this.form.reset();
        this.setState('Sent ✓', "Thanks — we'll be in touch within one business day.", true);
      } else {
        this.setState(this.defaultLabel, data.error || 'Something went wrong. Please try again.', false);
      }
    } catch (error) {
      this.setState(this.defaultLabel, 'Network error. Please try again.', false);
    }
  }
}
