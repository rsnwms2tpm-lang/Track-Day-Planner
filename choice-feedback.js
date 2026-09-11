(() => {
  document.addEventListener('click', event => {
    const button = event.target.closest('[data-vote-choice]');
    if (!button) return;

    const row = button.closest('.vote-row');
    if (!row) return;

    row.querySelectorAll('[data-vote-choice]').forEach(b => b.classList.remove('selected'));
    button.classList.add('selected');

    const card = button.closest('.event');
    const score = card?.querySelector('.score strong');
    if (score) {
      score.textContent = button.dataset.voteChoice === 'yes'
        ? 'Yes'
        : button.dataset.voteChoice === 'maybe'
          ? 'Maybe'
          : 'Can’t do';
    }
  }, true);
})();