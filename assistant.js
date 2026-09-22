(function () {
  if (window.__pappasAssistantLoaded) return;
  window.__pappasAssistantLoaded = true;

  var css = document.createElement('link');
  css.rel = 'stylesheet';
  css.href = new URL('assistant.css', document.currentScript.src).href;
  document.head.appendChild(css);

  var root = document.createElement('div');
  root.className = 'pappas-assistant';
  root.innerHTML = [
    '<button class="pa-launcher" type="button" aria-label="Open Pappas assistant" aria-expanded="false">',
    '  <span class="pa-launcher-icon" aria-hidden="true">✦</span><span>Ask Pappas</span>',
    '</button>',
    '<section class="pa-panel" role="dialog" aria-label="Pappas website assistant" hidden>',
    '  <header class="pa-header">',
    '    <div><strong>Pappas Assistant</strong><span>Service questions and quote help</span></div>',
    '    <button class="pa-close" type="button" aria-label="Close assistant">×</button>',
    '  </header>',
    '  <div class="pa-chat-view">',
    '    <div class="pa-messages" role="log" aria-live="polite" aria-relevant="additions text"></div>',
    '    <div class="pa-actions" aria-label="Quick questions">',
    '      <button type="button" data-action="services">Our services</button>',
    '      <button type="button" data-action="fall">Fall cleanups</button>',
    '      <button type="button" data-action="quote">Get a quote</button>',
    '      <button type="button" data-action="account">My account</button>',
    '    </div>',
    '    <form class="pa-message-form">',
    '      <label class="pa-sr-only" for="pa-question">Ask a question</label>',
    '      <input id="pa-question" name="question" maxlength="1200" placeholder="Ask about our services..." required>',
    '      <button type="submit" aria-label="Send question">Send</button>',
    '    </form>',
    '  </div>',
    '  <div class="pa-lead-view" hidden>',
    '    <div class="pa-lead-heading"><button class="pa-back" type="button">← Chat</button><strong>Request a quote</strong></div>',
    '    <p>Tell us about your property. Our team will review your request and follow up with a custom quote.</p>',
    '    <form class="pa-lead-form">',
    '      <div class="pa-name-row"><label>First name<input name="firstName" autocomplete="given-name" maxlength="80" required></label><label>Last name<input name="lastName" autocomplete="family-name" maxlength="80" required></label></div>',
    '      <label>Email<input name="email" type="email" autocomplete="email" maxlength="160" required></label>',
    '      <label>Phone<input name="phone" type="tel" autocomplete="tel" maxlength="30" required></label>',
    '      <label>Service address<input name="address" autocomplete="street-address" maxlength="220" required></label>',
    '      <label>Service<select name="service" required><option value="">Choose a service</option><option>Fall Cleanup</option><option>Lawn Maintenance</option><option>Spring Cleanup</option><option>Mulching</option><option>Aeration</option><option>Shrub &amp; Hedge Trimming</option><option>Fertilization</option><option>Weed Control</option><option>Snow Removal</option><option>Other</option></select></label>',
    '      <label>Anything else we should know? <span>(optional)</span><textarea name="notes" rows="3" maxlength="600"></textarea></label>',
    '      <label class="pa-consent"><input name="consentTerms" type="checkbox" required><span>I agree to the <a href="/terms" target="_blank" rel="noopener">Terms</a> and <a href="/privacy" target="_blank" rel="noopener">Privacy Policy</a>.</span></label>',
    '      <p class="pa-lead-error" role="alert" hidden></p>',
    '      <button class="pa-submit-lead" type="submit">Send quote request</button>',
    '    </form>',
    '    <p class="pa-lead-alternative">Prefer the full form? <a href="/quote">Open the quote page</a>.</p>',
    '  </div>',
    '  <footer class="pa-footer">AI assistant · No payment details in chat · <a href="/privacy">Privacy</a> · <a href="tel:4408867318">Call us</a></footer>',
    '</section>'
  ].join('');
  document.body.appendChild(root);

  var launcher = root.querySelector('.pa-launcher');
  var panel = root.querySelector('.pa-panel');
  var close = root.querySelector('.pa-close');
  var chatView = root.querySelector('.pa-chat-view');
  var leadView = root.querySelector('.pa-lead-view');
  var messagesEl = root.querySelector('.pa-messages');
  var messageForm = root.querySelector('.pa-message-form');
  var questionInput = root.querySelector('#pa-question');
  var leadForm = root.querySelector('.pa-lead-form');
  var leadError = root.querySelector('.pa-lead-error');
  var history = [];
  var waiting = false;

  function setOpen(open) {
    panel.hidden = !open;
    launcher.setAttribute('aria-expanded', String(open));
    launcher.setAttribute('aria-label', open ? 'Close Pappas assistant' : 'Open Pappas assistant');
    if (open) (leadView.hidden ? questionInput : leadForm.elements.firstName).focus();
    else launcher.focus();
  }

  function addMessage(who, message) {
    var node = document.createElement('div');
    node.className = 'pa-message pa-' + who;
    node.textContent = message;
    messagesEl.appendChild(node);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function addAccountHelp() {
    addMessage('bot', 'For your schedule, invoices, payments, and account details, please sign in to the secure customer portal. You can also call us at (440) 886-7318.');
    var link = document.createElement('a');
    link.className = 'pa-portal-link';
    link.href = 'https://secure.copilotcrm.com/client/login/portal/5261';
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = 'Open secure customer portal →';
    messagesEl.appendChild(link);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  async function ask(question) {
    if (waiting || !question) return;
    waiting = true;
    questionInput.disabled = true;
    messageForm.querySelector('button').disabled = true;
    addMessage('user', question);
    history.push({ role: 'user', content: question });
    history = history.slice(-8);
    var pending = document.createElement('div');
    pending.className = 'pa-message pa-bot pa-pending';
    pending.textContent = 'Thinking…';
    messagesEl.appendChild(pending);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    try {
      var response = await fetch('/api/site-assistant', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ messages: history })
      });
      var result = await response.json().catch(function () { return {}; });
      if (!response.ok || !result.answer) throw new Error('unavailable');
      pending.remove();
      addMessage('bot', result.answer);
      history.push({ role: 'assistant', content: result.answer.slice(0, 1200) });
    } catch (error) {
      pending.remove();
      history.pop();
      addMessage('bot', 'I can’t answer right now. You can request a quote here or call us at (440) 886-7318.');
    } finally {
      waiting = false;
      questionInput.disabled = false;
      messageForm.querySelector('button').disabled = false;
      questionInput.focus();
    }
  }

  function showLead(service) {
    chatView.hidden = true;
    leadView.hidden = false;
    if (service) leadForm.elements.service.value = service;
    leadForm.elements.firstName.focus();
  }

  function showChat() {
    leadView.hidden = true;
    chatView.hidden = false;
    questionInput.focus();
  }

  function getRecaptchaToken() {
    var siteKey = '6LeNqnQsAAAAAGgwOp8QUnjq6U8HZNoC1tVFTTV3';
    return new Promise(function (resolve, reject) {
      function run() {
        if (!window.grecaptcha || !window.grecaptcha.execute) return reject(new Error('Verification unavailable'));
        window.grecaptcha.ready(function () {
          window.grecaptcha.execute(siteKey, { action: 'quote_request' }).then(resolve, reject);
        });
      }
      if (window.grecaptcha && window.grecaptcha.execute) return run();
      var script = document.createElement('script');
      script.src = 'https://www.google.com/recaptcha/api.js?render=' + siteKey;
      script.onload = run;
      script.onerror = function () { reject(new Error('Verification unavailable')); };
      document.head.appendChild(script);
    });
  }

  launcher.addEventListener('click', function () { setOpen(panel.hidden); });
  close.addEventListener('click', function () { setOpen(false); });
  root.querySelector('.pa-back').addEventListener('click', showChat);
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && !panel.hidden) setOpen(false);
  });
  messageForm.addEventListener('submit', function (event) {
    event.preventDefault();
    var question = questionInput.value.trim();
    if (!question) return;
    questionInput.value = '';
    ask(question);
  });
  root.querySelectorAll('.pa-actions button').forEach(function (button) {
    button.addEventListener('click', function () {
      if (button.dataset.action === 'services') ask('What services do you offer?');
      if (button.dataset.action === 'fall') ask('What does your fall cleanup include?');
      if (button.dataset.action === 'quote') showLead('');
      if (button.dataset.action === 'account') addAccountHelp();
    });
  });

  leadForm.addEventListener('submit', async function (event) {
    event.preventDefault();
    leadError.hidden = true;
    var submit = leadForm.querySelector('.pa-submit-lead');
    submit.disabled = true;
    submit.textContent = 'Sending…';
    try {
      var form = new FormData(leadForm);
      var recaptchaToken = await getRecaptchaToken();
      var payload = {
        firstName: String(form.get('firstName') || '').trim(),
        lastName: String(form.get('lastName') || '').trim(),
        email: String(form.get('email') || '').trim(),
        phone: String(form.get('phone') || '').trim(),
        address: String(form.get('address') || '').trim(),
        services: [String(form.get('service') || '')],
        notes: String(form.get('notes') || '').trim(),
        source: 'website_ai_assistant',
        consentTerms: true,
        consentTransactional: false,
        consentMarketing: false,
        recaptchaToken: recaptchaToken
      };
      var response = await fetch('https://pappas-quote-backend-production.up.railway.app/api/quotes', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload)
      });
      var result = await response.json().catch(function () { return {}; });
      if (!response.ok || !result.success) throw new Error('Quote request could not be saved');
      leadForm.reset();
      showChat();
      addMessage('bot', 'Thanks—your quote request was sent to our team. We’ll review your property details and follow up.');
    } catch (error) {
      leadError.textContent = 'We couldn’t send your request. Please try the full quote form or call (440) 886-7318.';
      leadError.hidden = false;
    } finally {
      submit.disabled = false;
      submit.textContent = 'Send quote request';
    }
  });

  addMessage('bot', 'Hi! I can help with services and quote requests. For your schedule or invoices, I’ll point you to the secure customer portal.');
})();
