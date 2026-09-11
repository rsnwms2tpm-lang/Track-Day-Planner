(() => {
  function tidyOnboarding() {
    const dialog = document.querySelector('#onboard');
    if (!dialog) return;

    const eyebrow = dialog.querySelector('.eyebrow');
    const copy = dialog.querySelector('p.muted');
    const name = dialog.querySelector('#yourName');
    const car = dialog.querySelector('#yourCar');

    if (eyebrow && eyebrow.textContent !== 'GET STARTED') eyebrow.textContent = 'GET STARTED';
    if (copy && copy.textContent !== 'Add your name and car.') copy.textContent = 'Add your name and car.';
    if (name && (name.value === 'Dave' || !name.dataset.clearedByLanding)) {
      name.value = '';
      name.dataset.clearedByLanding = '1';
    }
    if (car && (car.value === 'Clio 172' || !car.dataset.clearedByLanding)) {
      car.value = '';
      car.dataset.clearedByLanding = '1';
    }
  }

  tidyOnboarding();
  const observer = new MutationObserver(tidyOnboarding);
  observer.observe(document.documentElement, { childList: true, subtree: true });

  let attempts = 0;
  const timer = setInterval(() => {
    tidyOnboarding();
    attempts += 1;
    if (attempts > 50) clearInterval(timer);
  }, 100);
})();