(() => {
  function tidyOnboarding() {
    const dialog = document.querySelector('#onboard');
    if (!dialog) return;

    const eyebrow = dialog.querySelector('.eyebrow');
    const copy = dialog.querySelector('p.muted');
    const name = dialog.querySelector('#yourName');
    const car = dialog.querySelector('#yourCar');

    if (eyebrow) eyebrow.textContent = 'GET STARTED';
    if (copy) copy.textContent = 'Add your name and car.';
    if (name && name.value === 'Dave') name.value = '';
    if (car && car.value === 'Clio 172') car.value = '';
  }

  tidyOnboarding();
  new MutationObserver(tidyOnboarding).observe(document.body, { childList: true, subtree: true });
})();
