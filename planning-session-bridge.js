// Planning v2 is a separate classic script. The main app keeps `session` in the
// shared global lexical environment rather than as a window property. Expose
// that same object for Planning v2, which intentionally reads window.session.
try {
  if (typeof session !== 'undefined' && session) window.session = session;
} catch (e) {
  console.warn('Planning session bridge unavailable', e);
}
