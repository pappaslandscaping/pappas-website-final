(function () {
  if (window.PappasAnalytics) return;

  // Only fixed event names and non-identifying values are sent to Analytics.
  var allowedEvents = {
    generate_lead: true,
    call_click: true,
    chat_started: true,
    human_handoff: true
  };
  var allowedForms = { full_quote: true, assistant_quote: true };
  var allowedChats = { assistant: true, human: true };

  function track(eventName, details) {
    if (!allowedEvents[eventName] || typeof window.gtag !== 'function') return;
    var params = {};
    if (details && allowedForms[details.form_type]) params.form_type = details.form_type;
    if (details && allowedChats[details.chat_type]) params.chat_type = details.chat_type;
    if (details && Number.isInteger(details.service_count) && details.service_count >= 0 && details.service_count <= 20) {
      params.service_count = details.service_count;
    }
    window.gtag('event', eventName, params);
  }

  window.PappasAnalytics = { track: track };

  document.addEventListener('click', function (event) {
    var link = event.target.closest && event.target.closest('a[href^="tel:"]');
    if (link) track('call_click');
  });
}());
