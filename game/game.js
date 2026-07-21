(() => {
  const $ = (selector) => document.querySelector(selector);
  const screens = [$('#setup-screen'), $('#play-screen'), $('#results-screen')];
  const setupScreen = screens[0];
  const playScreen = screens[1];
  const resultsScreen = screens[2];
  const restartDialog = $('#restart-dialog');

  const players = [
    { id: 'you', name: 'You', model: 'Human player', color: '#ffd84d' },
    { id: 'analyst', name: 'The Analyst', model: 'GPT-5 strategy', color: '#5974ff' },
    { id: 'pioneer', name: 'The Pioneer', model: 'GPT-3.5 strategy', color: '#ffb43f' }
  ];

  const opponents = [
    { id: 'pioneer', name: 'The Pioneer', model: 'GPT-3.5 strategy', subtitle: 'Bold, strange, unpredictable', color: '#ffb43f' },
    { id: 'analyst', name: 'The Analyst', model: 'GPT-5 strategy', subtitle: 'Reads the score before the risk', color: '#5974ff' },
    { id: 'delta', name: 'State Delta', model: 'House strategy', subtitle: 'Adapts to lead, time, and table size', color: '#3ed6a4' }
  ];

  const matchScores = [
    { ...players[0], score: 450 },
    { ...players[1], score: 410 },
    { ...players[2], score: 380 }
  ];

  const finalScores = [
    { ...players[0], score: 1250 },
    { ...players[1], score: 1180 },
    { ...players[2], score: 1050 }
  ];

  function showScreen(target) {
    screens.forEach((screen) => {
      const active = screen === target;
      screen.hidden = !active;
      screen.classList.toggle('active', active);
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function playerRow(player, index) {
    return `
      <li class="lineup-player" style="--player-color:${player.color}">
        <span class="player-avatar" aria-hidden="true">${player.name.charAt(0)}</span>
        <div><strong>${player.name}</strong><span>${player.model}</span></div>
        <button class="remove-player" type="button" aria-label="Remove ${player.name}" disabled><svg><use href="#i-trash"></use></svg></button>
      </li>`;
  }

  function renderSetup() {
    $('#lineup-list').innerHTML = players.map(playerRow).join('');
    $('#opponent-options').innerHTML = opponents.map((opponent) => `
      <button class="opponent-card" type="button" style="--opponent-color:${opponent.color}" ${opponent.id !== 'delta' ? 'disabled' : ''}>
        <strong>${opponent.name}</strong><span class="plus"><svg><use href="#i-plus"></use></svg></span>
        <span class="model">${opponent.model}</span><p>${opponent.subtitle}</p>
      </button>`).join('');
  }

  function renderScoreboard() {
    const highest = matchScores[0].score;
    $('#scoreboard').innerHTML = matchScores.map((player, index) => `
      <li class="score-row ${player.id === 'you' ? 'active' : ''}" style="--row-color:${player.color};--score-width:${player.score / highest * 100}%">
        <span class="score-rank">${String(index + 1).padStart(2, '0')}</span>
        <span class="score-player"><strong>${player.name}</strong><span>${player.model}</span></span>
        <strong class="score-value">${player.score.toLocaleString()}</strong>
      </li>`).join('');
  }

  function renderResults() {
    $('#final-ranking').innerHTML = finalScores.map((player, index) => `
      <li class="final-row"><span>${String(index + 1).padStart(2, '0')}</span><b>${player.name}</b><strong>${player.score.toLocaleString()}</strong></li>`).join('');
  }

  function pulseControl(button) {
    button.classList.remove('prototype-pulse');
    requestAnimationFrame(() => button.classList.add('prototype-pulse'));
  }

  $('#start-game').addEventListener('click', () => showScreen(playScreen));
  $('#preview-result').addEventListener('click', () => showScreen(resultsScreen));
  $('#play-again').addEventListener('click', () => showScreen(playScreen));
  $('#new-game').addEventListener('click', () => showScreen(setupScreen));
  $('#restart-game').addEventListener('click', () => restartDialog.showModal());
  restartDialog.addEventListener('close', () => {
    if (restartDialog.returnValue === 'confirm') showScreen(setupScreen);
  });

  $('#strategy-toggle').addEventListener('click', (event) => {
    const button = event.currentTarget;
    const isOn = button.getAttribute('aria-pressed') === 'true';
    button.setAttribute('aria-pressed', String(!isOn));
    button.querySelector('b').textContent = isOn ? 'Off' : 'On';
    $('#strategy-rail').classList.toggle('lens-off', isOn);
  });

  [$('#roll-button'), $('#bank-button')].forEach((button) => {
    button.addEventListener('click', () => pulseControl(button));
  });
  document.querySelectorAll('.opponent-card:not(:disabled)').forEach((button) => {
    button.addEventListener('click', () => pulseControl(button));
  });

  renderSetup();
  renderScoreboard();
  renderResults();
})();
