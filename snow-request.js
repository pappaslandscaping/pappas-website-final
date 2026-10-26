(function () {
  'use strict';
  const siteKey = '6LeNqnQsAAAAAGgwOp8QUnjq6U8HZNoC1tVFTTV3';
  function buildRequest(values, token, page) {
    const services = values.getAll('services');
    if (!services.length) throw new Error('Please select at least one service.');
    return {
      name: String(values.get('name') || '').trim(),
      email: String(values.get('email') || '').trim(),
      phone: String(values.get('phone') || '').trim(),
      address: String(values.get('address') || '').trim(),
      services,
      propertyType: values.get('propertyType'),
      notes: ['Snow estimate request — winter 2026–2027.', String(values.get('notes') || '').trim()].filter(Boolean).join('\n'),
      frequency: 'Seasonal', source: 'Existing customer snow email',
      landingPage: page, utmSource: 'homeworks', utmMedium: 'email', utmCampaign: 'snow-2026-2027',
      recaptchaToken: token
    };
  }
  if (typeof module === 'object' && module.exports) { module.exports = { buildRequest }; return; }
  const form = document.getElementById('snowRequestForm');
  const error = document.getElementById('formError');
  const button = form.querySelector('button[type="submit"]');
  let submitting = false;
  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    if (submitting || !form.reportValidity()) return;
    error.hidden = true;
    try {
      const values = new FormData(form);
      buildRequest(values, '', location.href);
      if (!window.grecaptcha || typeof window.grecaptcha.ready !== 'function') throw new Error('Security verification is still loading. Please try again, or call 440-886-7318.');
      submitting = true; button.disabled = true; button.textContent = 'Sending request…';
      await new Promise(resolve => grecaptcha.ready(resolve));
      const token = await grecaptcha.execute(siteKey, { action: 'quote_request' });
      if (!token) throw new Error('Security verification could not complete. Please try again.');
      const response = await fetch('https://pappas-quote-backend-production.up.railway.app/api/quotes', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(buildRequest(values, token, location.href))
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result || result.success !== true) throw new Error('Your request could not be confirmed. Please try again or call 440-886-7318.');
      form.hidden = true;
      const confirmation = document.getElementById('successMessage'); confirmation.hidden = false; confirmation.focus();
    } catch (failure) {
      error.textContent = failure.message || 'We could not send your request. Please try again or call 440-886-7318.';
      error.hidden = false;
    } finally { submitting = false; button.disabled = false; button.textContent = 'Request My Snow Estimate'; }
  });
})();
