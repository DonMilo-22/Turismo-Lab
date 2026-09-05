(() => {
  const { alphabet, cities, hotelTerms, hotelAbbreviations } = window.TURISMO_DATA;

  const state = {
    currentView: 'inicio',
    currentAeroTab: 'study',
    currentCard: 0,
    speechRate: 1,
    soundEnabled: true,
    hotelFilter: 'all',
    gameMode: null,
    gameIndex: 0,
    gameScore: 0,
    gameQuestions: [],
    gameTimer: null,
    gameTime: 30,
    speedTotal: 10,
    shuffledCards: []
  };

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

  const normalizeText = (value = '') => value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');

  const randomItem = (array) => array[Math.floor(Math.random() * array.length)];
  const shuffle = (array) => [...array].sort(() => Math.random() - 0.5);

  function navigate(viewId) {
    const target = $(`#${viewId}`);
    if (!target) return;
    $$('.view').forEach((view) => view.classList.remove('active-view'));
    target.classList.add('active-view');
    $$('.nav-link').forEach((btn) => btn.classList.toggle('active', btn.dataset.nav === viewId));
    state.currentView = viewId;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (viewId === 'aero') renderFlashcard();
    if (viewId === 'hotel') renderHotelCards();
  }

  function speak(text, options = {}) {
    if (!state.soundEnabled || !('speechSynthesis' in window) || !text) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = options.lang || 'es-MX';
    utterance.rate = options.rate || state.speechRate;
    utterance.pitch = 1;
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find((voice) => /es-MX|es-MX|Spanish.*Mexico/i.test(`${voice.lang} ${voice.name}`))
      || voices.find((voice) => /^es/i.test(voice.lang));
    if (preferred) utterance.voice = preferred;
    window.speechSynthesis.speak(utterance);
  }

  function renderFlashcard() {
    const [letter, word] = alphabet[state.currentCard];
    $('#aeroCardIndex').textContent = state.currentCard + 1;
    $('#flashcardCount').textContent = `${state.currentCard + 1} / ${alphabet.length}`;
    $('#flashcardLetterMini').textContent = letter;
    $('#flashcardLetter').textContent = letter;
    $('#flashcardWord').textContent = word;
    $('#flashcardSpeak').textContent = `🔊 Escuchar “${word}”`;
  }

  function renderAlphabetGrid() {
    $('#alphabetGrid').innerHTML = alphabet.map(([letter, word], index) => `
      <button class="alphabet-card glass ${index === state.currentCard ? 'selected' : ''}" data-card-index="${index}" type="button">
        <span class="alphabet-letter">${letter}</span>
        <span class="alphabet-word">${word}</span>
        <span class="speaker-dot" title="Escuchar">🔊</span>
      </button>
    `).join('');
  }

  function renderCities(search = '') {
    const query = normalizeText(search);
    const filtered = cities.filter(([code, city]) => normalizeText(`${code}${city}`).includes(query));
    $('#citiesGrid').innerHTML = filtered.length
      ? filtered.map(([code, city]) => `
        <button class="city-card glass" data-city="${city}" data-code="${code}" type="button">
          <span class="city-code">${code}</span>
          <span class="city-name">${city}</span>
          <span class="speaker-dot">🔊</span>
        </button>
      `).join('')
      : `<div class="empty-panel glass"><span>🗺</span><h3>No encontramos esa clave</h3><p>Prueba con otra ciudad o código.</p></div>`;
  }

  function renderConverter() {
    const input = $('#converterInput').value.trim();
    const result = $('#converterList');
    const speakAll = $('#converterSpeakAll');
    if (!input) {
      $('#converterTitle').textContent = 'Escribe algo arriba';
      result.className = 'converter-list empty-state';
      result.innerHTML = '<span>✦</span><p>Aquí aparecerá la conversión letra por letra.</p>';
      speakAll.disabled = true;
      return;
    }

    const clean = input.toUpperCase();
    const items = [...clean].filter((char) => /[A-ZÁÉÍÓÚÜÑ]/i.test(char)).map((char) => {
      const normalized = normalizeText(char).charAt(0);
      const entry = alphabet.find(([letter]) => letter === normalized);
      return entry ? { letter: normalized, word: entry[1] } : null;
    }).filter(Boolean);

    $('#converterTitle').textContent = clean;
    result.className = 'converter-list';
    result.innerHTML = items.map(({ letter, word }) => `
      <button class="converter-item" data-word="${word}" type="button">
        <span>${letter}</span>
        <strong>${word}</strong>
        <span class="speaker-dot">🔊</span>
      </button>
    `).join('');
    speakAll.disabled = items.length === 0;
    speakAll.dataset.text = items.map((item) => item.word).join(' — ');
  }

  function getHotelCards() {
    const terms = hotelTerms.map(([term, definition]) => ({ type: 'term', term, definition }));
    const abbreviations = hotelAbbreviations.map(([abbr, code, definition]) => ({ type: 'abbr', term: abbr, code, definition }));
    return [...terms, ...abbreviations];
  }

  function renderHotelCards() {
    const query = normalizeText($('#hotelSearch')?.value || '');
    const items = getHotelCards().filter((item) => {
      const passesFilter = state.hotelFilter === 'all' || item.type === state.hotelFilter;
      const searchable = normalizeText(`${item.term} ${item.code || ''} ${item.definition}`);
      return passesFilter && (!query || searchable.includes(query));
    });

    $('#hotelGrid').innerHTML = items.map((item) => item.type === 'term' ? `
      <article class="hotel-card glass">
        <div class="hotel-card-top"><span class="pill">TERMINOLOGÍA</span><button class="icon-btn small" data-speak="${item.term}" type="button" title="Escuchar">🔊</button></div>
        <h3>${item.term}</h3>
        <p class="definition">${item.definition}</p>
        <div class="example-box"><span>📌</span><div><strong>Idea clave</strong><p>${item.definition.replace(/\.$/, '')}.</p></div></div>
      </article>
    ` : `
      <article class="hotel-card glass">
        <div class="hotel-card-top"><span class="pill accent">ABREVIATURA</span><button class="icon-btn small" data-speak="${item.code}" type="button" title="Escuchar">🔊</button></div>
        <div class="abbr-line"><h3>${item.term}</h3><span>·</span><strong>${item.code}</strong></div>
        <p class="definition">${item.definition}</p>
        <div class="example-box"><span>🔤</span><div><strong>Desglose</strong><p>${item.code}</p></div></div>
      </article>
    `).join('');

    $('#hotelEmpty').classList.toggle('hidden', items.length > 0);
  }

  function buildMcqQuestions() {
    const questionPool = [];
    alphabet.forEach(([letter, word]) => {
      const distractors = shuffle(alphabet.filter(([l]) => l !== letter)).slice(0, 3).map(([, w]) => w);
      questionPool.push({
        type: 'mcq',
        prompt: `¿Qué palabra representa la letra “${letter}”?`,
        answer: word,
        options: shuffle([word, ...distractors]),
        speech: `La letra ${letter}`
      });
    });
    hotelAbbreviations.slice(0, 10).forEach(([abbr, code, definition]) => {
      const distractors = shuffle(hotelAbbreviations.filter(([a]) => a !== abbr)).slice(0, 3).map(([, , d]) => d);
      questionPool.push({
        type: 'mcq',
        prompt: `¿Qué significa “${abbr}”?`,
        answer: definition,
        options: shuffle([definition, ...distractors]),
        speech: abbr
      });
    });
    return shuffle(questionPool).slice(0, 10);
  }

  function wordToCode(word) {
    return [...normalizeText(word)].map((letter) => {
      const entry = alphabet.find(([l]) => l === letter);
      return entry ? entry[1] : '';
    }).filter(Boolean);
  }

  function buildDecodeQuestions() {
    const words = ['HOTEL', 'CAMPECHE', 'TURISMO', 'VIAJE', 'AVION', 'LIMA', 'DELTA', 'PAPA', 'MEXICO', 'PLAYA'];
    return shuffle(words).slice(0, 10).map((word) => ({
      type: 'decode',
      prompt: '¿Qué palabra se forma?',
      answer: word,
      code: wordToCode(word)
    }));
  }

  function buildListenQuestions() {
    const words = ['HOTEL', 'CAMPECHE', 'TURISMO', 'VIAJE', 'AVION', 'LIMA', 'DELTA', 'PAPA', 'MEXICO', 'PLAYA'];
    return shuffle(words).slice(0, 10).map((word) => ({ type: 'listen', answer: word, code: wordToCode(word) }));
  }

  function startGame(mode) {
    clearInterval(state.gameTimer);
    state.gameMode = mode;
    state.gameIndex = 0;
    state.gameScore = 0;
    state.gameTime = 30;
    state.speedTotal = mode === 'speed' ? 10 : 10;
    state.gameQuestions = mode === 'mcq'
      ? buildMcqQuestions()
      : mode === 'decode'
        ? buildDecodeQuestions()
        : mode === 'listen'
          ? buildListenQuestions()
          : buildMcqQuestions();

    $('#practiceSelector').classList.add('hidden');
    $('#practiceGame').classList.remove('hidden');
    $('#gameProgress').textContent = `1 / ${state.gameQuestions.length}`;
    renderCurrentQuestion();

    if (mode === 'speed') {
      state.gameTime = 30;
      $('#gameProgress').textContent = `⏱ ${state.gameTime}s`;
      state.gameTimer = setInterval(() => {
        state.gameTime -= 1;
        $('#gameProgress').textContent = `⏱ ${state.gameTime}s`;
        if (state.gameTime <= 0) finishGame();
      }, 1000);
    }
  }

  function renderCurrentQuestion() {
    const q = state.gameQuestions[state.gameIndex];
    if (!q) return finishGame();
    if (state.gameMode !== 'speed') $('#gameProgress').textContent = `${state.gameIndex + 1} / ${state.gameQuestions.length}`;

    if (q.type === 'mcq') {
      $('#gameContent').innerHTML = `
        <div class="question-card">
          <span class="eyebrow">PREGUNTA ${state.gameIndex + 1}</span>
          <h2>${q.prompt}</h2>
          <button class="audio-question glass" data-q-speak="${q.speech}" type="button">🔊 Escuchar pregunta</button>
          <div class="answers-grid">${q.options.map((option) => `<button class="answer-btn glass" data-answer="${encodeURIComponent(option)}" type="button">${option}</button>`).join('')}</div>
          <div id="questionFeedback" class="feedback"></div>
        </div>`;
    } else {
      $('#gameContent').innerHTML = `
        <div class="question-card">
          <span class="eyebrow">${q.type === 'listen' ? 'ESCUCHA' : 'DESCIFRA'}</span>
          <h2>${q.prompt}</h2>
          <div class="code-display glass">${q.code.map((term, index) => `<button class="code-chip" data-code-speak="${term}" type="button">${term}${index < q.code.length - 1 ? ' ·' : ''}</button>`).join('')}</div>
          <button id="playSequence" class="btn btn-primary big-audio" type="button">🔊 Escuchar código completo</button>
          <div class="guess-row"><input id="guessInput" class="text-input" type="text" placeholder="Escribe la palabra..." autocomplete="off" /><button id="submitGuess" class="btn btn-secondary" type="button">Comprobar</button></div>
          <div id="questionFeedback" class="feedback"></div>
        </div>`;
      if (q.type === 'listen') setTimeout(() => speakCodeSequence(q.code), 350);
    }
  }

  function handleAnswer(isCorrect) {
    const feedback = $('#questionFeedback');
    if (isCorrect) {
      state.gameScore += 1;
      feedback.className = 'feedback correct';
      feedback.textContent = '✓ ¡Correcto!';
    } else {
      feedback.className = 'feedback incorrect';
      feedback.textContent = `✕ La respuesta correcta era: ${state.gameQuestions[state.gameIndex].answer}`;
    }
    $$('.answer-btn').forEach((button) => button.disabled = true);
    setTimeout(nextQuestion, 850);
  }

  function nextQuestion() {
    state.gameIndex += 1;
    if (state.gameIndex >= state.gameQuestions.length || (state.gameMode === 'speed' && state.gameTime <= 0)) finishGame();
    else renderCurrentQuestion();
  }

  function finishGame() {
    clearInterval(state.gameTimer);
    state.gameTimer = null;
    const total = state.gameQuestions.length;
    const score = state.gameScore;
    const percentage = total ? Math.round((score / total) * 100) : 0;
    const message = percentage >= 80 ? '¡Vas muy bien!' : percentage >= 50 ? '¡Buen trabajo, sigue practicando!' : 'Cada intento ayuda. ¡Vamos otra vez!';
    $('#gameProgress').textContent = '✓ Terminado';
    $('#gameContent').innerHTML = `
      <div class="result-card">
        <div class="result-emoji">${percentage >= 80 ? '🏆' : percentage >= 50 ? '✨' : '💪'}</div>
        <span class="eyebrow">RESULTADO</span>
        <h2>${score} / ${total} correctas</h2>
        <div class="result-percent">${percentage}%</div>
        <p>${message}</p>
        <div class="hero-actions center"><button id="retryGame" class="btn btn-primary">Intentar de nuevo</button><button id="backToPractice" class="btn btn-secondary">Elegir otro modo</button></div>
      </div>`;
  }

  function exitGame() {
    clearInterval(state.gameTimer);
    state.gameTimer = null;
    $('#practiceGame').classList.add('hidden');
    $('#practiceSelector').classList.remove('hidden');
  }

  function speakCodeSequence(code) {
    if (!state.soundEnabled) return;
    const text = code.join(' — ');
    speak(text, { rate: state.speechRate });
  }

  function initEvents() {
    document.addEventListener('click', (event) => {
      const navTarget = event.target.closest('[data-nav]');
      if (navTarget) {
        navigate(navTarget.dataset.nav);
        return;
      }

      const practiceLink = event.target.closest('[data-practice-mode]');
      if (practiceLink) {
        navigate('practica');
        startGame(practiceLink.dataset.practiceMode);
        return;
      }

      const aeroTab = event.target.closest('[data-aero-tab]');
      if (aeroTab) {
        state.currentAeroTab = aeroTab.dataset.aeroTab;
        $$('.tab-btn').forEach((btn) => btn.classList.toggle('active', btn.dataset.aeroTab === state.currentAeroTab));
        $$('.aero-panel').forEach((panel) => panel.classList.add('hidden'));
        $(`#aero-${state.currentAeroTab}`).classList.remove('hidden');
        return;
      }

      const card = event.target.closest('[data-card-index]');
      if (card) {
        state.currentCard = Number(card.dataset.cardIndex);
        renderFlashcard();
        renderAlphabetGrid();
        speak(alphabet[state.currentCard][1]);
        return;
      }

      const city = event.target.closest('[data-city]');
      if (city) {
        speak(`${city.dataset.city}`);
        return;
      }

      const converterItem = event.target.closest('[data-word]');
      if (converterItem) {
        speak(converterItem.dataset.word);
        return;
      }

      const speakBtn = event.target.closest('[data-speak]');
      if (speakBtn) {
        speak(speakBtn.dataset.speak);
        return;
      }

      const codeSpeak = event.target.closest('[data-code-speak]');
      if (codeSpeak) {
        speak(codeSpeak.dataset.codeSpeak);
        return;
      }

      const mode = event.target.closest('[data-mode]');
      if (mode) {
        startGame(mode.dataset.mode);
        return;
      }

      const answer = event.target.closest('[data-answer]');
      if (answer) {
        const option = decodeURIComponent(answer.dataset.answer);
        const correct = option === state.gameQuestions[state.gameIndex].answer;
        handleAnswer(correct);
        return;
      }
    });

    $('#prevCard').addEventListener('click', () => {
      state.currentCard = (state.currentCard - 1 + alphabet.length) % alphabet.length;
      renderFlashcard();
      renderAlphabetGrid();
    });
    $('#nextCard').addEventListener('click', () => {
      state.currentCard = (state.currentCard + 1) % alphabet.length;
      renderFlashcard();
      renderAlphabetGrid();
    });
    $('#flashcardSpeak').addEventListener('click', () => speak(alphabet[state.currentCard][1]));

    $('#converterInput').addEventListener('keydown', (event) => {
      if (event.key === 'Enter') renderConverter();
    });
    $('#convertBtn').addEventListener('click', renderConverter);
    $('#converterSpeakAll').addEventListener('click', (event) => speak(event.currentTarget.dataset.text || ''));

    $$('.speed-btn').forEach((btn) => btn.addEventListener('click', () => {
      state.speechRate = Number(btn.dataset.rate);
      $$('.speed-btn').forEach((item) => item.classList.toggle('active', item === btn));
    }));

    $('#citySearch').addEventListener('input', (event) => renderCities(event.target.value));
    $('#hotelSearch').addEventListener('input', renderHotelCards);
    $$('.filter-btn').forEach((btn) => btn.addEventListener('click', () => {
      state.hotelFilter = btn.dataset.hotelFilter;
      $$('.filter-btn').forEach((item) => item.classList.toggle('active', item === btn));
      renderHotelCards();
    }));

    $('#soundToggle').addEventListener('click', () => {
      state.soundEnabled = !state.soundEnabled;
      $('#soundToggle').textContent = state.soundEnabled ? '🔊' : '🔇';
    });

    $('#exitGame').addEventListener('click', exitGame);

    $('#gameContent').addEventListener('click', (event) => {
      const speakQuestion = event.target.closest('[data-q-speak]');
      if (speakQuestion) speak(speakQuestion.dataset.qSpeak);

      if (event.target.id === 'playSequence') {
        speakCodeSequence(state.gameQuestions[state.gameIndex].code);
      }

      if (event.target.id === 'submitGuess') {
        const input = $('#guessInput');
        const answer = state.gameQuestions[state.gameIndex].answer;
        const correct = normalizeText(input.value) === normalizeText(answer);
        const feedback = $('#questionFeedback');
        feedback.className = `feedback ${correct ? 'correct' : 'incorrect'}`;
        feedback.textContent = correct ? '✓ ¡Correcto!' : `✕ La respuesta correcta era: ${answer}`;
        input.disabled = true;
        event.target.disabled = true;
        if (correct) state.gameScore += 1;
        setTimeout(nextQuestion, 900);
      }

      if (event.target.id === 'retryGame') startGame(state.gameMode);
      if (event.target.id === 'backToPractice') exitGame();
    });

    $('#gameContent').addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && event.target.id === 'guessInput') $('#submitGuess')?.click();
    });
  }

  function init() {
    renderAlphabetGrid();
    renderFlashcard();
    renderCities();
    renderHotelCards();
    initEvents();
    if ('speechSynthesis' in window) window.speechSynthesis.getVoices();
  }

  init();
})();
