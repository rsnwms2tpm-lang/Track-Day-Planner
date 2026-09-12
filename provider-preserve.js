(() => {
  // Keep separate organiser listings even when they share the same circuit/date.
  // Different providers can have different price, format and availability, so
  // collapsing by date+venue hides valid choices (usually leaving Javelin first).
  cleanLiveEvents = function(raw) {
    const map = new Map();
    const today = localToday();
    for (const item of raw || []) {
      if (!item.date || item.date < today) continue;
      const venue = venues.find(v => String(item.track || '').toLowerCase().startsWith(v.toLowerCase()));
      if (!venue) continue;
      if (String(item.availability || '').toLowerCase() === 'sold out') continue;
      const provider = String(item.provider || 'Live provider').trim();
      const e = {
        ...item,
        track: venue,
        provider,
        id: `${provider}-${item.date}-${venue.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
      };
      const key = `${provider.toLowerCase()}|${e.date}|${venue.toLowerCase()}`;
      const old = map.get(key);
      if (!old || (old.price == null && e.price != null)) map.set(key, e);
    }
    return [...map.values()].sort((a, b) => a.date.localeCompare(b.date) || a.track.localeCompare(b.track) || a.provider.localeCompare(b.provider));
  };
})();
