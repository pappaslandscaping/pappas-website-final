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
    '      <button type="button" data-action="area">Service area</button>',
    '      <button type="button" data-action="quote">Get a quote</button>',
    '      <button type="button" data-action="account">My account</button>',
    '      <button type="button" data-action="person">Talk to a person</button>',
    '    </div>',
    '    <form class="pa-message-form">',
    '      <label class="pa-sr-only" for="pa-question">Ask a question</label>',
    '      <input id="pa-question" name="question" maxlength="1200" placeholder="Ask about our services..." required>',
    '      <button type="submit" aria-label="Send question">Send</button>',
    '    </form>',
    '  </div>',
    '  <div class="pa-human-view" hidden>',
    '    <div class="pa-lead-heading"><button class="pa-human-back" type="button">← Chat</button><strong>Talk to our team</strong></div>',
    '    <p>Send a message and we’ll reply here when someone is available. Leave a phone number or email so we can follow up if you close this page. Office hours: Mon–Fri 9–6, Sat 9–4, Sun closed (Eastern).</p>',
    '    <form class="pa-human-form">',
    '      <label>Your name<input name="name" autocomplete="name" maxlength="80" required></label>',
    '      <label>Phone or email<input name="contact" maxlength="160" required></label>',
    '      <label>How can we help?<textarea name="message" rows="3" maxlength="1200" required></textarea></label>',
    '      <label class="pa-honeypot" aria-hidden="true">Website<input name="website" tabindex="-1" autocomplete="off"></label>',
    '      <p class="pa-human-error" role="alert" hidden></p>',
    '      <button class="pa-submit-lead" type="submit">Send to our team</button>',
    '    </form>',
    '  </div>',
    '  <div class="pa-lead-view" hidden>',
    '    <div class="pa-lead-heading"><button class="pa-back" type="button">← Chat</button><strong>Request a quote</strong></div>',
    '    <p>Tell us about your property. We serve Lakewood, Brook Park, Bay Village, and the west side of Cleveland. Our team will review your request and follow up with a custom quote.</p>',
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
    '  <footer class="pa-footer">Chats are saved for our team · No payment details · <a href="/privacy">Privacy</a> · <a href="tel:4408867318">Call us</a></footer>',
    '</section>'
  ].join('');
  document.body.appendChild(root);

  var launcher = root.querySelector('.pa-launcher');
  var panel = root.querySelector('.pa-panel');
  var close = root.querySelector('.pa-close');
  var chatView = root.querySelector('.pa-chat-view');
  var leadView = root.querySelector('.pa-lead-view');
  var humanView = root.querySelector('.pa-human-view');
  var humanForm = root.querySelector('.pa-human-form');
  var humanError = root.querySelector('.pa-human-error');
  var messagesEl = root.querySelector('.pa-messages');
  var messageForm = root.querySelector('.pa-message-form');
  var questionInput = root.querySelector('#pa-question');
  var leadForm = root.querySelector('.pa-lead-form');
  var leadError = root.querySelector('.pa-lead-error');
  var history = [];
  var waiting = false;
  var liveChat = null;
  var liveMessageIds = {};
  var loggingWarningShown = false;
  var chatApi = 'https://pappas-quote-backend-production.up.railway.app/api/site-chat';
  try { liveChat = JSON.parse(sessionStorage.getItem('pappasLiveChat') || 'null'); } catch (_) { liveChat = null; }
  if (liveChat && !liveChat.mode) liveChat.mode = 'human';

  function saveChat() {
    if (liveChat) sessionStorage.setItem('pappasLiveChat', JSON.stringify(liveChat));
  }

  async function appendToChat(sender, message) {
    if (!liveChat) throw new Error('No chat session');
    var response = await fetch(chatApi + '/' + liveChat.id + '/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-chat-token': liveChat.token },
      body: JSON.stringify({ sender: sender, message: message })
    });
    var data = await response.json().catch(function () { return {}; });
    if (!response.ok || !data.success) throw new Error(data.error || 'Chat could not be saved');
    return data.message;
  }

  async function recordAiQuestion(question) {
    if (liveChat) {
      var saved = await appendToChat('visitor', question);
      liveMessageIds[saved.id] = true;
      return;
    }
    var recaptchaToken = await getRecaptchaToken('site_chat').catch(function () { return null; });
    var response = await fetch(chatApi, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ mode: 'assistant', message: question, recaptchaToken: recaptchaToken })
    });
    var data = await response.json().catch(function () { return {}; });
    if (!response.ok || !data.success) throw new Error(data.error || 'Chat could not be saved');
    liveChat = { id: data.id, token: data.token, mode: 'assistant' };
    liveMessageIds[data.messageId] = true;
    saveChat();
  }

  function setOpen(open) {
    panel.hidden = !open;
    launcher.setAttribute('aria-expanded', String(open));
    launcher.setAttribute('aria-label', open ? 'Close Pappas assistant' : 'Open Pappas assistant');
    if (open) (humanView.hidden ? (leadView.hidden ? questionInput : leadForm.elements.firstName) : humanForm.elements.name).focus();
    else launcher.focus();
  }

  function addMessage(who, message) {
    var node = document.createElement('div');
    node.className = 'pa-message pa-' + who;
    node.textContent = message;
    messagesEl.appendChild(node);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  async function addAccountHelp() {
    if (liveChat && liveChat.mode === 'human') {
      addMessage('bot', 'For account details, please sign in to the secure customer portal or call us at (440) 886-7318.');
    } else {
      await ask('How do I access my schedule, invoices, and payments?');
    }
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
    if (liveChat && liveChat.mode === 'human') return sendLiveMessage(question);
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
      try { await recordAiQuestion(question); }
      catch (_) {
        if (!loggingWarningShown) {
          loggingWarningShown = true;
          addMessage('bot', 'Team notifications are temporarily unavailable. Please call us if you need a person.');
        }
      }
      var response = await fetch('/api/site-assistant', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ messages: history })
      });
      var result = await response.json().catch(function () { return {}; });
      if (!response.ok || !result.answer) throw new Error('unavailable');
      if (liveChat && liveChat.mode === 'assistant') await pollLiveChat();
      if (liveChat && liveChat.mode === 'human') { pending.remove(); return; }
      pending.remove();
      addMessage('bot', result.answer);
      history.push({ role: 'assistant', content: result.answer.slice(0, 1200) });
      if (liveChat && liveChat.mode === 'assistant') {
        try {
          var savedAnswer = await appendToChat('assistant', result.answer.slice(0, 1200));
          liveMessageIds[savedAnswer.id] = true;
        } catch (_) { /* The answer remains visible even if its transcript cannot be saved. */ }
      }
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
    humanView.hidden = true;
    leadView.hidden = false;
    if (service) leadForm.elements.service.value = service;
    leadForm.elements.firstName.focus();
  }

  function showChat() {
    leadView.hidden = true;
    humanView.hidden = true;
    chatView.hidden = false;
    questionInput.focus();
  }

  function showHuman() {
    if (liveChat && liveChat.mode === 'human') { showChat(); return; }
    chatView.hidden = true;
    leadView.hidden = true;
    humanView.hidden = false;
    humanForm.elements.name.focus();
  }

  async function pollLiveChat() {
    if (!liveChat || document.hidden) return;
    try {
      var response = await fetch(chatApi + '/' + liveChat.id, { headers: { 'x-chat-token': liveChat.token } });
      if (response.status === 404) {
        liveChat = null;
        sessionStorage.removeItem('pappasLiveChat');
        addMessage('bot', 'This conversation has expired. Please start a new request to reach our team.');
        return;
      }
      if (!response.ok) return;
      var data = await response.json();
      if (data.mode === 'human' && liveChat.mode !== 'human') {
        liveChat.mode = 'human';
        questionInput.placeholder = 'Message our team...';
        saveChat();
        addMessage('bot', 'A team member has joined this chat. Your next message will go to our team.');
      }
      if (!history.length && data.mode === 'assistant') {
        history = (data.messages || []).filter(function (item) { return item.sender === 'visitor' || item.sender === 'assistant'; }).slice(-8).map(function (item) {
          return { role: item.sender === 'visitor' ? 'user' : 'assistant', content: item.body };
        });
      }
      (data.messages || []).forEach(function (item) {
        if (liveMessageIds[item.id]) return;
        liveMessageIds[item.id] = true;
        addMessage(item.sender === 'visitor' ? 'user' : 'bot', item.sender === 'staff' ? 'Pappas team: ' + item.body : item.body);
      });
      if (data.status === 'closed' && !liveChat.closed) {
        liveChat.closed = true;
        addMessage('bot', 'Our team has closed this conversation. You can start another chat if you need anything else.');
        sessionStorage.removeItem('pappasLiveChat');
        liveChat = null;
      }
    } catch (_) { /* A later poll will retry. */ }
  }

  async function sendLiveMessage(message) {
    if (!liveChat || waiting) return;
    waiting = true;
    try {
      await appendToChat('visitor', message);
      await pollLiveChat();
    } catch (_) { addMessage('bot', 'Your message did not send. Please try again or call (440) 886-7318.'); }
    finally { waiting = false; }
  }

  function getRecaptchaToken(action) {
    var siteKey = '6LeNqnQsAAAAAGgwOp8QUnjq6U8HZNoC1tVFTTV3';
    return new Promise(function (resolve, reject) {
      function run() {
        if (!window.grecaptcha || !window.grecaptcha.execute) return reject(new Error('Verification unavailable'));
        window.grecaptcha.ready(function () {
          window.grecaptcha.execute(siteKey, { action: action || 'quote_request' }).then(resolve, reject);
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
  root.querySelector('.pa-human-back').addEventListener('click', showChat);
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && !panel.hidden) setOpen(false);
  });
  messageForm.addEventListener('submit', function (event) {
    event.preventDefault();
    var question = questionInput.value.trim();
    if (!question) return;
    questionInput.value = '';
    if ((!liveChat || liveChat.mode === 'assistant') && /(?:\b(?:talk|speak|chat)\b.*\b(?:person|human|someone|representative|team)\b|\bcustomer service\b|\blive agent\b)/i.test(question)) {
      showHuman();
      humanForm.elements.message.value = question;
      return;
    }
    ask(question);
  });
  root.querySelectorAll('.pa-actions button').forEach(function (button) {
    button.addEventListener('click', function () {
      if (button.dataset.action === 'services') ask('What services do you offer?');
      if (button.dataset.action === 'area') ask('What areas do you serve?');
      if (button.dataset.action === 'quote') showLead('');
      if (button.dataset.action === 'account') addAccountHelp();
      if (button.dataset.action === 'person') showHuman();
    });
  });

  humanForm.addEventListener('submit', async function (event) {
    event.preventDefault();
    humanError.hidden = true;
    var submit = humanForm.querySelector('button[type="submit"]');
    submit.disabled = true;
    try {
      var form = new FormData(humanForm);
      var payload = { name: String(form.get('name') || '').trim(), contact: String(form.get('contact') || '').trim(), message: String(form.get('message') || '').trim(), website: String(form.get('website') || '') };
      var handoff = liveChat && liveChat.mode === 'assistant';
      var url = handoff ? chatApi + '/' + liveChat.id + '/handoff' : chatApi;
      var headers = { 'content-type': 'application/json' };
      if (handoff) headers['x-chat-token'] = liveChat.token;
      else payload.recaptchaToken = await getRecaptchaToken('site_chat').catch(function () { return null; });
      var response = await fetch(url, { method: 'POST', headers: headers, body: JSON.stringify(payload) });
      var data = await response.json().catch(function () { return {}; });
      if (!response.ok || !data.success) throw new Error(data.error || 'We couldn’t send your message. Please call us instead.');
      if (handoff) liveChat.mode = 'human';
      else liveChat = { id: data.id, token: data.token, mode: 'human' };
      saveChat();
      humanForm.reset();
      showChat();
      questionInput.placeholder = 'Message our team...';
      addMessage('bot', data.afterHours
        ? 'Thanks. We received your message after hours. We’ll reply during business hours and can use the contact information you provided if you close this page.'
        : (data.alerted || data.alreadyAlerted)
          ? 'Thanks. We alerted our team and will reply here when someone is available.'
          : 'Thanks. Your message is in our team inbox. You can keep this chat open for a reply or call (440) 886-7318.');
      await pollLiveChat();
    } catch (error) {
      humanError.textContent = error.message;
      humanError.hidden = false;
    } finally { submit.disabled = false; }
  });

  leadForm.addEventListener('submit', async function (event) {
    event.preventDefault();
    leadError.hidden = true;
    var submit = leadForm.querySelector('.pa-submit-lead');
    submit.disabled = true;
    submit.textContent = 'Sending…';
    try {
      var form = new FormData(leadForm);
      var address = String(form.get('address') || '').trim();
      var cityMatch = address.match(/,\s*([^,]+),\s*OH\b/i);
      var city = cityMatch ? cityMatch[1].trim().toLowerCase() : '';
      if (city && ['lakewood', 'brook park', 'bay village', 'cleveland'].indexOf(city) === -1) {
        throw new Error('outside-area');
      }
      var recaptchaToken = await getRecaptchaToken();
      var payload = {
        firstName: String(form.get('firstName') || '').trim(),
        lastName: String(form.get('lastName') || '').trim(),
        email: String(form.get('email') || '').trim(),
        phone: String(form.get('phone') || '').trim(),
        address: address,
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
      leadError.textContent = error.message === 'outside-area'
        ? 'We currently serve Lakewood, Brook Park, Bay Village, and west-side Cleveland only.'
        : 'We couldn’t send your request. Please try the full quote form or call (440) 886-7318.';
      leadError.hidden = false;
    } finally {
      submit.disabled = false;
      submit.textContent = 'Send quote request';
    }
  });

  addMessage('bot', 'Hi! I can help with services and quote requests. You can also ask to talk to our team. For your schedule or invoices, I’ll point you to the secure customer portal.');
  if (liveChat) { questionInput.placeholder = 'Message our team...'; pollLiveChat(); }
  setInterval(pollLiveChat, 5000);
})();
