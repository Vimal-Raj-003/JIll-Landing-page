class Chatbot {
  constructor() {
    this.toggle = document.getElementById('chatbotToggle');
    this.panel = document.getElementById('chatbotPanel');
    this.messagesEl = document.getElementById('chatbotMessages');
    this.composer = document.getElementById('chatbotComposer');
    if (!this.toggle || !this.panel || !this.messagesEl || !this.composer) return;

    this.input = this.composer.querySelector('input');
    this.sendBtn = this.composer.querySelector('button[type="submit"]');
    this.closeBtn = this.panel.querySelector('.chatbot-close');
    this.transcript = [];
    this.busy = false;

    this.toggle.addEventListener('click', () => this.open());
    this.closeBtn.addEventListener('click', () => this.close());
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !this.panel.hidden) this.close();
    });
    this.composer.addEventListener('submit', (e) => this.onSend(e));

    this.greet();
  }

  greet() {
    this.appendMessage('assistant',
      "Hi! I'm JillJill's assistant. Ask me about pricing, packages, distribution, or our well-funding mission.");
  }

  open() {
    this.panel.hidden = false;
    this.toggle.setAttribute('aria-expanded', 'true');
    this.input.focus();
  }

  close() {
    this.panel.hidden = true;
    this.toggle.setAttribute('aria-expanded', 'false');
    this.toggle.focus();
  }

  appendMessage(role, text) {
    const div = document.createElement('div');
    div.className = `chatbot-message ${role}`;
    div.textContent = text;
    this.messagesEl.appendChild(div);
    this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
    return div;
  }

  async onSend(event) {
    event.preventDefault();
    if (this.busy) return;
    const text = this.input.value.trim();
    if (!text) return;

    this.busy = true;
    this.sendBtn.disabled = true;
    this.input.value = '';

    this.appendMessage('user', text);
    this.transcript.push({ role: 'user', content: text });

    const assistantBubble = this.appendMessage('assistant', '…');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: this.transcript })
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        assistantBubble.textContent = err.error || 'Sorry, I had trouble. Please try the contact form.';
        assistantBubble.classList.add('error');
        return;
      }

      assistantBubble.textContent = '';
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let full = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        full += chunk;
        assistantBubble.textContent = full;
        this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
      }
      if (full.trim().length === 0) {
        assistantBubble.textContent = "The chatbot is temporarily unavailable. Please use the contact form below — we'll get back to you within a business day.";
        assistantBubble.classList.add('error');
        return;
      }
      this.transcript.push({ role: 'assistant', content: full });
    } catch (error) {
      assistantBubble.textContent = 'Network error. Please try again.';
      assistantBubble.classList.add('error');
    } finally {
      this.busy = false;
      this.sendBtn.disabled = false;
      this.input.focus();
    }
  }
}
