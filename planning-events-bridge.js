// Planning v2 reads window.events, while the proven live provider loader in app.js
// keeps `events` in the shared global lexical environment. Mirror that feed into
// window.events and refresh Choices when the async provider load completes.
(() => {
  let lastCount = -1;
  let attempts = 0;
  const sync = () => {
    attempts += 1;
    try {
      if (typeof events !== 'undefined' && Array.isArray(events)) {
        window.events = events;
        if (events.length !== lastCount) {
          lastCount = events.length;
          if (events.length) {
            const choices = document.querySelector('#planningV2 [data-nav="choices"]');
            if (choices && !choices.disabled) choices.click();
          }
        }
      }
    } catch (e) {
      console.warn('Planning event bridge unavailable', e);
    }
    if (attempts < 80) setTimeout(sync, 250);
  };
  sync();
})();
