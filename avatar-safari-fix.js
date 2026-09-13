(() => {
  let sharedSprite = '';
  let styleEl = null;

  function ensureStyle(sprite) {
    if (!sprite || sharedSprite === sprite) return;
    sharedSprite = sprite;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'tdp-avatar-safari-style';
      document.head.appendChild(styleEl);
    }
    document.documentElement.style.setProperty('--tdp-avatar-sprite', sprite);
    styleEl.textContent = '.tdp-avatar.tdp-avatar-art{background-image:var(--tdp-avatar-sprite)!important;background-repeat:no-repeat!important;}';
  }

  function fixAvatar(el) {
    if (!(el instanceof HTMLElement) || !el.classList.contains('tdp-avatar') || el.classList.contains('tdp-avatar-fallback')) return;
    const inline = el.style.backgroundImage;
    if (inline && inline !== 'none') ensureStyle(inline);
    if (sharedSprite) {
      el.style.removeProperty('background-image');
      el.classList.add('tdp-avatar-art');
    }
  }

  function sweep(root = document) {
    if (root instanceof HTMLElement && root.matches('.tdp-avatar')) fixAvatar(root);
    root.querySelectorAll?.('.tdp-avatar').forEach(fixAvatar);
  }

  sweep();
  const observer = new MutationObserver(records => {
    for (const record of records) {
      record.addedNodes.forEach(node => {
        if (node instanceof HTMLElement) sweep(node);
      });
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  const originalOpen = window.openAvatarPicker;
  if (typeof originalOpen === 'function') {
    window.openAvatarPicker = function(...args) {
      const result = originalOpen.apply(this, args);
      requestAnimationFrame(() => sweep());
      setTimeout(() => sweep(), 50);
      return result;
    };
  }
})();