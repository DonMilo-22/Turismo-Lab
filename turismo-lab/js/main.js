(() => {
  const { alphabet, cities, hotelTerms, hotelAbbreviations } = window.TURISMO_DATA;

  const state = {
    currentView: 'inicio',
    aeroTab: 'alphabet',
    hotelTab: 'terms',
    currentCard: 0,
    speechRate: 1,
    soundEnabled: true,
    currentGame: null,
    exam: {
      sections: [],
      sectionIndex: 0,
      questionIndex: 0,
      answers: [],
      sectionResults: []
    }
  };

  const $ = (s, scope = document) => scope.querySelector(s);
  const $$ = (s, scope = document) => [...scope.querySelectorAll(s)];
  const randomItem = arr => arr[Math.floor(Math.random() * arr.length)];
  const shuffle = arr => [...arr].sort(() => Math.random() - 0.5);
  const esc = value => String(value).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const normalize = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/[^A-Z0-9]/g, '');

  function navigate(viewId) {
    const target = $(`#${viewId}`);
    if (!target) return;
    $$('.view').forEach(v => v.classList.remove('active-view'));
    target.classList.add('active-view');
    $$('.nav-link').forEach(b => b.classList.toggle('active', b.dataset.nav === viewId));
    state.currentView = viewId;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (viewId === 'aero') { renderFlashcard(); renderCities(); }
    if (viewId === 'hotel') { renderHotelTerms(); renderHotelAbbr(); }
    if (viewId === 'examen') resetExamSetup();
  }

  function getSpeechVoice(lang) {
    if (!('speechSynthesis' in window)) return null;
    const voices = window.speechSynthesis.getVoices();
    if (lang.startsWith('en')) {
      return voices.find(v => /^en-US/i.test(v.lang)) || voices.find(v => /^en/i.test(v.lang)) || null;
    }
    return voices.find(v => /^es-MX/i.test(v.lang)) || voices.find(v => /^es/i.test(v.lang)) || null;
  }

  function speak(text, { lang = 'es-MX', rate = state.speechRate, force = false } = {}) {
    if ((!state.soundEnabled && !force) || !('speechSynthesis' in window) || !text) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = rate;
    utterance.pitch = 1;
    const voice = getSpeechVoice(lang);
    if (voice) utterance.voice = voice;
    window.speechSynthesis.speak(utterance);
  }

  function speakEnglish(text) {
    speak(text, { lang: 'en-US' });
  }

  function speakSequence(words, lang = 'en-US') {
    if (!state.soundEnabled || !words.length) return;
    window.speechSynthesis.cancel();
    const voices = window.speechSynthesis.getVoices();
    const voice = getSpeechVoice(lang);
    let delay = 0;
    words.forEach(word => {
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = lang;
      utterance.rate = state.speechRate;
      if (voice) utterance.voice = voice;
      setTimeout(() => window.speechSynthesis.speak(utterance), delay);
      delay += 650;
    });
  }

  function renderFlashcard() {
    const [letter, word] = alphabet[state.currentCard];
    $('#flashcardLetterMini').textContent = letter;
    $('#flashcardCount').textContent = `${state.currentCard + 1} / ${alphabet.length}`;
    $('#flashcardLetter').textContent = letter;
    $('#flashcardWord').textContent = word;
    $('#flashcardSpeak').textContent = `🔊 Escuchar “${word}”`;
  }

  function renderAlphabetGrid() {
    $('#alphabetGrid').innerHTML = alphabet.map(([letter, word], index) => `
      <button class="alphabet-card glass ${index === state.currentCard ? 'selected' : ''}" data-card-index="${index}" type="button">
        <span class="alphabet-letter">${esc(letter)}</span>
        <span class="alphabet-word">${esc(word)}</span>
      </button>`).join('');
  }

  function renderCities(search = '') {
    const query = normalize(search);
    const filtered = cities.filter(([code, city]) => normalize(`${code}${city}`).includes(query));
    $('#citiesGrid').innerHTML = filtered.length ? filtered.map(([code, city]) => `
      <div class="city-card glass">
        <span class="city-code">${esc(code)}</span>
        <span class="city-name">${esc(city)}</span>
      </div>`).join('') : `<div class="empty-panel glass"><span>🗺</span><h3>No encontramos esa clave</h3><p>Prueba con otra ciudad o código.</p></div>`;
  }

  function renderConverter() {
    const input = $('#converterInput').value.trim();
    const result = $('#converterList');
    const button = $('#converterSpeakAll');
    if (!input) {
      $('#converterTitle').textContent = 'Escribe algo arriba';
      result.className = 'converter-list empty-state';
      result.innerHTML = '<span>✦</span><p>Aquí aparecerá la conversión letra por letra.</p>';
      button.disabled = true;
      button.dataset.text = '';
      return;
    }
    const items = [...input].map(ch => {
      const key = normalize(ch).charAt(0);
      return alphabet.find(([letter]) => letter === key) || null;
    }).filter(Boolean);
    $('#converterTitle').textContent = input.toUpperCase();
    result.className = 'converter-list';
    result.innerHTML = items.map(([letter, word]) => `
      <div class="converter-item"><span>${esc(letter)}</span><strong>${esc(word)}</strong></div>`).join('');
    button.disabled = !items.length;
    button.dataset.text = items.map(([, word]) => word).join(' — ');
  }

  function renderHotelTerms() {
    const query = normalize($('#hotelTermSearch')?.value || '');
    const items = hotelTerms.filter(([term, definition]) => normalize(`${term} ${definition}`).includes(query));
    $('#hotelTermsGrid').innerHTML = items.map(([term, definition]) => `
      <article class="hotel-card glass">
        <div class="hotel-card-top"><span class="pill">TERMINOLOGÍA</span></div>
        <h3>${esc(term)}</h3>
        <p class="definition">${esc(definition)}</p>
      </article>`).join('');
    $('#hotelTermsEmpty').classList.toggle('hidden', items.length !== 0);
  }

  function renderHotelAbbr() {
    const query = normalize($('#hotelAbbrSearch')?.value || '');
    const items = hotelAbbreviations.filter(([abbr, definition]) => normalize(`${abbr} ${definition}`).includes(query));
    $('#hotelAbbrGrid').innerHTML = items.map(([abbr, definition]) => `
      <article class="hotel-card glass">
        <div class="hotel-card-top"><span class="pill accent">ABREVIATURA</span></div>
        <h3>${esc(abbr)}</h3>
        <p class="definition">${esc(definition)}</p>
      </article>`).join('');
    $('#hotelAbbrEmpty').classList.toggle('hidden', items.length !== 0);
  }

  const DECODE_WORDS = [
    'PAPA', 'DIA', 'AVION', 'HOTEL', 'TURISMO', 'VIAJE', 'PLAYA', 'RESORT', 'MARINA',
    'AGENCIA', 'MALETA', 'BOLETO', 'RESERVA', 'PASAJERO', 'DESTINO', 'VUELO',
    'AEROPUERTO', 'EMBARQUE', 'TURISTA', 'CABINA', 'PILOTO', 'ESCALA', 'MAPA',
    'HOTELERA', 'AGENTE', 'GUIA', 'CIUDAD', 'PLAYAS', 'CRUCERO', 'SALIDA', 'LLEGADA',
    'VIAJERO', 'TRAVEL', 'BOOKING', 'SUITE'
  ].filter((word, index, arr) => arr.indexOf(word) === index && word.length <= 8);

  function buildPairDataset(topic) {
    if (topic === 'alphabet') return alphabet.map(([a, b]) => ({ left: a, right: b, leftLabel: 'LETRA', rightLabel: 'CÓDIGO', voice: 'en-US' }));
    if (topic === 'cities') return cities.map(([a, b]) => ({ left: a, right: b, leftLabel: 'CLAVE', rightLabel: 'CIUDAD', voice: 'es-MX' }));
    if (topic === 'hotelTerms') return hotelTerms.map(([a, b]) => ({ left: a, right: b, leftLabel: 'TÉRMINO', rightLabel: 'SIGNIFICADO', voice: 'en-US' }));
    return hotelAbbreviations.map(([a, b]) => ({ left: a, right: b, leftLabel: 'ABREVIATURA', rightLabel: 'SIGNIFICADO', voice: 'es-MX' }));
  }

  function topicTitle(topic) {
    return ({ alphabet: 'Abecedario aeronáutico', cities: 'Claves de ciudades', hotelTerms: 'Terminología hotelera', hotelAbbr: 'Abreviaturas hoteleras' })[topic];
  }

  function makeQuestionFromItem(topic, item, direction) {
    const showingLeft = direction === 'leftToRight';
    const shown = showingLeft ? item.left : item.right;
    const correct = showingLeft ? item.right : item.left;
    const data = buildPairDataset(topic);
    const wrongs = shuffle(data.filter(d => d.left !== item.left).map(d => showingLeft ? d.right : d.left)).slice(0, 3);
    const showAudio = (topic === 'alphabet' && !showingLeft) || (topic === 'hotelTerms' && showingLeft);
    return {
      type: 'mcq',
      topic,
      prompt: `¿Qué corresponde a “${shown}”?`,
      answer: correct,
      options: shuffle([correct, ...wrongs]),
      speech: showAudio ? shown : null,
      speechLang: showAudio ? 'en-US' : null
    };
  }

  function makeQuestion(topic) {
    const data = buildPairDataset(topic);
    return makeQuestionFromItem(topic, randomItem(data), Math.random() > 0.5 ? 'leftToRight' : 'rightToLeft');
  }

  function makeTextQuestion(topic, item = null) {
    const data = buildPairDataset(topic);
    const pair = item || randomItem(data);
    let prompt;
    let answer;
    if (topic === 'alphabet') {
      prompt = `Escribe la letra que corresponde a “${pair.right}”.`;
      answer = pair.left;
    } else if (topic === 'cities') {
      prompt = `Escribe la clave de: ${pair.right}`;
      answer = pair.left;
    } else if (topic === 'hotelTerms') {
      prompt = `Escribe el término en inglés que corresponde a: ${pair.right}`;
      answer = pair.left;
    } else {
      prompt = `Escribe la abreviatura que corresponde a: ${pair.right}`;
      answer = pair.left;
    }
    return { type: 'text', topic, prompt, answer, item: pair };
  }

  function makeDecodeQuestion(topic, item = null) {
    if (topic === 'alphabet') {
      const word = item || randomItem(DECODE_WORDS);
      const sequence = [...normalize(word)].map(letter => alphabet.find(([l]) => l === letter)?.[1]).filter(Boolean);
      return {
        type: 'text',
        topic,
        prompt: `Descifra el código y escribe la palabra correcta.`,
        answer: word,
        sequence
      };
    }
    return makeTextQuestion(topic, item);
  }

  function makeEncryptQuestion(topic, word = null) {
    if (topic !== 'alphabet') return makeQuestion(topic);
    const target = word || randomItem(DECODE_WORDS);
    const letters = [...normalize(target)];
    const correct = letters.map(letter => alphabet.find(([l]) => l === letter)?.[1]).join(' · ');
    const options = new Set([correct]);
    while (options.size < 4) {
      const candidate = letters.map(letter => {
        if (Math.random() < 0.6) {
          return alphabet.find(([l]) => l === letter)?.[1] || '';
        }
        return randomItem(alphabet)[1];
      }).join(' · ');
      if (candidate !== correct) options.add(candidate);
    }
    return {
      type: 'mcq',
      topic,
      prompt: `¿Cuál secuencia encripta correctamente la palabra “${target}”?`,
      answer: correct,
      options: shuffle([...options]),
      targetWord: target
    };
  }

  function uniqueItemsForGame(topic, count) {
    const data = buildPairDataset(topic);
    return shuffle(data).slice(0, Math.min(count, data.length));
  }

  function launchGame(topic, game) {
    state.currentGame = { topic, game, score: 0, index: 0, total: 10, questions: [] };
    if (game === 'memory') openMemoryGame(topic);
    else openQuestionGame(topic, game);
  }

  function openQuestionGame(topic, game) {
    let questions;
    if (game === 'questions') {
      const pool = uniqueItemsForGame(topic, 10);
      questions = pool.map(item => makeQuestionFromItem(topic, item, Math.random() > 0.5 ? 'leftToRight' : 'rightToLeft'));
    } else if (game === 'decode') {
      if (topic === 'alphabet') {
        const words = shuffle(DECODE_WORDS).slice(0, 10);
        questions = words.map(word => makeDecodeQuestion(topic, word));
      } else {
        const pool = uniqueItemsForGame(topic, 10);
        questions = pool.map(item => makeDecodeQuestion(topic, item));
      }
    } else {
      if (topic === 'alphabet') {
        const words = shuffle(DECODE_WORDS).slice(0, 10);
        questions = words.map(word => makeEncryptQuestion(topic, word));
      } else {
        const pool = uniqueItemsForGame(topic, 10);
        questions = pool.map(item => makeQuestionFromItem(topic, item, 'leftToRight'));
      }
    }
    state.currentGame.questions = questions;
    state.currentGame.total = questions.length;

    const root = $('#modalRoot');
    root.classList.remove('hidden');
    root.setAttribute('aria-hidden', 'false');
    const gameTitle = game === 'questions' ? 'Juego de preguntas' : game === 'decode' ? (topic === 'alphabet' ? 'Descifra el código' : 'Escribe la respuesta') : 'Encripta y elige';
    root.innerHTML = `
      <div class="modal-backdrop"></div>
      <div class="game-modal glass">
        <div class="modal-head"><div><span class="eyebrow">${esc(topicTitle(topic))}</span><h3>${gameTitle}</h3></div><button class="icon-btn" data-close-modal type="button" aria-label="Cerrar">✕</button></div>
        <div id="modalGameContent"></div>
      </div>`;
    renderQuestionGame();
  }

  function renderQuestionGame() {
    const g = state.currentGame;
    const q = g.questions[g.index];
    if (!q) return finishQuestionGame();
    const content = $('#modalGameContent');
    const title = g.game === 'questions' ? 'PREGUNTA' : g.game === 'decode' ? 'DESCIFRA' : 'ENCRIPTA';
    let html = `<div class="game-status"><span>${title}</span><strong>${g.index + 1} / ${g.total}</strong></div>`;
    html += `<div class="game-question"><p class="eyebrow">${esc(topicTitle(q.topic))}</p><h2>${esc(q.prompt)}</h2>`;
    if (q.speech) {
      html += `<button class="btn btn-secondary audio-inline" data-game-speak="${esc(q.speech)}" data-game-lang="${esc(q.speechLang || 'en-US')}" type="button">🔊 Escuchar término</button>`;
    }
    if (q.sequence) {
      html += `<div class="sequence-box glass">${q.sequence.map((term, i) => `<span class="sequence-term">${esc(term)}${i < q.sequence.length - 1 ? ' ·' : ''}</span>`).join('')}</div>`;
      html += `<button class="btn btn-secondary audio-inline" data-play-sequence="1" type="button">🔊 Escuchar secuencia</button>`;
    }
    if (q.targetWord) {
      html += `<div class="target-word glass"><span class="eyebrow">PALABRA</span><strong>${esc(q.targetWord)}</strong></div>`;
    }
    if (q.type === 'mcq') {
      html += `<div class="answers-grid">${q.options.map(o => `<button class="answer-btn glass" data-game-answer="${esc(o)}" type="button">${esc(o)}</button>`).join('')}</div>`;
    } else {
      html += `<div class="guess-row"><input id="gameInput" class="text-input" type="text" placeholder="Escribe tu respuesta..." autocomplete="off" /><button class="btn btn-primary" data-submit-game type="button">Comprobar</button></div>`;
    }
    html += `<div id="gameFeedback" class="feedback"></div></div>`;
    content.innerHTML = html;
  }

  function gradeGame(answer) {
    const g = state.currentGame;
    const q = g.questions[g.index];
    const correct = normalize(answer) === normalize(q.answer);
    if (correct) g.score += 1;
    $('#gameFeedback').className = `feedback ${correct ? 'correct' : 'incorrect'}`;
    $('#gameFeedback').textContent = correct ? '✓ ¡Correcto!' : `✕ La respuesta correcta era: ${q.answer}`;
    $$('.answer-btn').forEach(b => b.disabled = true);
    const input = $('#gameInput');
    if (input) input.disabled = true;
    const submit = $('[data-submit-game]');
    if (submit) submit.disabled = true;
    setTimeout(() => { g.index += 1; renderQuestionGame(); }, 900);
  }

  function finishQuestionGame() {
    const g = state.currentGame;
    const pct = g.total ? Math.round((g.score / g.total) * 100) : 0;
    $('#modalGameContent').innerHTML = `
      <div class="result-card compact-result"><div class="result-emoji">${pct >= 80 ? '🏆' : pct >= 60 ? '✨' : '💪'}</div><span class="eyebrow">RESULTADO</span><h2>${g.score} / ${g.total}</h2><div class="result-percent">${pct}%</div><p>${pct >= 80 ? '¡Excelente trabajo!' : pct >= 60 ? '¡Vas por buen camino!' : 'Repásalo y vuelve a intentarlo.'}</p><div class="hero-actions center"><button class="btn btn-primary" data-retry-game type="button">Intentar de nuevo</button><button class="btn btn-secondary" data-close-modal type="button">Cerrar</button></div></div>`;
  }

  function openMemoryGame(topic) {
    const source = buildPairDataset(topic);
    const count = Math.min(10, source.length);
    const chosen = shuffle(source).slice(0, count);
    const cards = shuffle(chosen.flatMap((item, pairId) => [
      { pairId, side: 'left', text: item.left, label: item.leftLabel },
      { pairId, side: 'right', text: item.right, label: item.rightLabel }
    ]));
    state.currentGame = { topic, game: 'memory', cards, flipped: [], matched: new Set(), moves: 0, resolving: false };
    const root = $('#modalRoot');
    root.classList.remove('hidden');
    root.setAttribute('aria-hidden', 'false');
    root.innerHTML = `
      <div class="modal-backdrop"></div>
      <div class="game-modal glass memory-modal">
        <div class="modal-head"><div><span class="eyebrow">${esc(topicTitle(topic))}</span><h3>Memorama</h3></div><button class="icon-btn" data-close-modal type="button" aria-label="Cerrar">✕</button></div>
        <p class="memory-help">Voltea dos tarjetas. Si forman una pareja, se quedan boca arriba. Si no, tendrás unos segundos para recordar ambas antes de que se oculten.</p>
        <div class="memory-status"><span>Movimientos: <strong id="memoryMoves">0</strong></span><span>Parejas: <strong id="memoryMatches">0</strong> / ${count}</span></div>
        <div id="memoryGrid" class="memory-grid">${cards.map((_, i) => `<button class="memory-card" data-memory-index="${i}" type="button"><span class="memory-back">?</span><span class="memory-face"></span></button>`).join('')}</div>
      </div>`;
    renderMemoryCards();
  }

  function renderMemoryCards() {
    const g = state.currentGame;
    $$('.memory-card').forEach((card, index) => {
      const item = g.cards[index];
      const shown = g.flipped.includes(index) || g.matched.has(index);
      card.classList.toggle('flipped', shown);
      card.classList.toggle('matched', g.matched.has(index));
      card.querySelector('.memory-face').innerHTML = shown ? `<small>${esc(item.label)}</small><strong>${esc(item.text)}</strong>` : '';
    });
    $('#memoryMoves').textContent = g.moves;
    $('#memoryMatches').textContent = Math.floor(g.matched.size / 2);
  }

  function memoryFlip(index) {
    const g = state.currentGame;
    if (!g || g.game !== 'memory' || g.resolving || g.flipped.length >= 2 || g.flipped.includes(index) || g.matched.has(index)) return;
    g.flipped.push(index);
    renderMemoryCards();
    if (g.flipped.length < 2) return;
    g.moves += 1;
    const [a, b] = g.flipped;
    if (g.cards[a].pairId === g.cards[b].pairId) {
      g.matched.add(a); g.matched.add(b); g.flipped = [];
      renderMemoryCards();
      if (g.matched.size === g.cards.length) finishMemoryGame();
    } else {
      g.resolving = true;
      setTimeout(() => { g.flipped = []; g.resolving = false; renderMemoryCards(); }, 3000);
    }
  }

  function finishMemoryGame() {
    const g = state.currentGame;
    $('#memoryGrid').innerHTML = `<div class="memory-finish"><div class="result-emoji">🧠</div><h3>¡Completado!</h3><p>Encontraste todas las parejas en <strong>${g.moves}</strong> movimientos.</p><button class="btn btn-primary" data-retry-game type="button">Jugar de nuevo</button></div>`;
  }

  function buildExamQuestions(topic) {
    const data = buildPairDataset(topic);
    const pool = shuffle(data).slice(0, Math.min(10, data.length));
    return pool.map(item => makeQuestionFromItem(topic, item, Math.random() > 0.5 ? 'leftToRight' : 'rightToLeft'));
  }

  function resetExamSetup() {
    if (state.currentView !== 'examen') return;
    $('#examSetup').classList.remove('hidden');
    $('#examRunner').classList.add('hidden');
    $('#examResult').classList.add('hidden');
    $('#examResult').innerHTML = '';
  }

  function startExam() {
    const selected = $$('input[type="checkbox"]:checked', $('#examSetup')).map(i => i.value);
    if (!selected.length) {
      alert('Selecciona al menos un tema para comenzar.');
      return;
    }
    state.exam.sections = selected.map(topic => ({ topic, title: topicTitle(topic), questions: buildExamQuestions(topic) }));
    state.exam.sectionIndex = 0;
    state.exam.questionIndex = 0;
    state.exam.answers = [];
    state.exam.sectionResults = [];
    $('#examSetup').classList.add('hidden');
    $('#examRunner').classList.remove('hidden');
    renderExamQuestion();
  }

  function renderExamQuestion() {
    const e = state.exam;
    if (e.sectionIndex >= e.sections.length) return finishExam();
    const section = e.sections[e.sectionIndex];
    const q = section.questions[e.questionIndex];
    $('#examSectionLabel').textContent = `SECCIÓN ${e.sectionIndex + 1} DE ${e.sections.length}`;
    $('#examSectionTitle').textContent = section.title;
    $('#examProgress').textContent = `${e.questionIndex + 1} / ${section.questions.length}`;
    $('#examProgressBar').style.width = `${((e.questionIndex + 1) / section.questions.length) * 100}%`;
    $('#examQuestion').innerHTML = `
      <div class="exam-question-card">
        <span class="eyebrow">PREGUNTA ${e.questionIndex + 1}</span>
        <h2>${esc(q.prompt)}</h2>
        <div class="answers-grid">${q.options.map(o => `<button class="answer-btn glass" data-exam-answer="${esc(o)}" type="button">${esc(o)}</button>`).join('')}</div>
        <div id="examFeedback" class="feedback"></div>
      </div>`;
  }

  function gradeExam(answer) {
    const e = state.exam;
    const section = e.sections[e.sectionIndex];
    const q = section.questions[e.questionIndex];
    const correct = normalize(answer) === normalize(q.answer);
    e.answers.push({ section: section.title, question: q.prompt, selected: answer, correctAnswer: q.answer, correct });
    const feedback = $('#examFeedback');
    feedback.className = `feedback ${correct ? 'correct' : 'incorrect'}`;
    feedback.textContent = correct ? '✓ ¡Correcto!' : `✕ La respuesta correcta era: ${q.answer}`;
    $$('.answer-btn').forEach(b => b.disabled = true);
    setTimeout(() => {
      e.questionIndex += 1;
      if (e.questionIndex >= section.questions.length) {
        const sectionAnswers = e.answers.filter(a => a.section === section.title);
        e.sectionResults.push({ topic: section.topic, title: section.title, correct: sectionAnswers.filter(a => a.correct).length, total: section.questions.length, answers: sectionAnswers });
        e.sectionIndex += 1;
        e.questionIndex = 0;
      }
      renderExamQuestion();
    }, 700);
  }

  function finishExam() {
    const total = state.exam.answers.length;
    const correct = state.exam.answers.filter(a => a.correct).length;
    const overall = total ? Math.round((correct / total) * 100) : 0;
    $('#examRunner').classList.add('hidden');
    $('#examResult').classList.remove('hidden');
    $('#examResult').innerHTML = `
      <div class="glass result-card exam-results">
        <div class="result-emoji">${overall >= 80 ? '🏆' : overall >= 60 ? '✨' : '📚'}</div>
        <span class="eyebrow">EXAMEN TERMINADO</span>
        <h2>Promedio general</h2>
        <div class="result-percent">${overall}%</div>
        <p>${correct} respuestas correctas de ${total}.</p>
        <div class="section-results">${state.exam.sectionResults.map((r, i) => {
          const pct = Math.round((r.correct / r.total) * 100);
          return `<details class="result-section"><summary><span><strong>Sección ${i + 1}: ${esc(r.title)}</strong><small>${r.correct} / ${r.total} · ${pct}%</small></span><span>⌄</span></summary><div class="review-list">${r.answers.map((a, idx) => `<article class="review-item ${a.correct ? 'is-correct' : 'is-wrong'}"><div><span class="review-number">${idx + 1}</span><div><strong>${esc(a.question)}</strong><p>Tu respuesta: <span>${esc(a.selected)}</span>${a.correct ? '' : `<br>Respuesta correcta: <span class="correct-answer">${esc(a.correctAnswer)}</span>`}</p></div></div><span>${a.correct ? '✓' : '✕'}</span></article>`).join('')}</div></details>`;
        }).join('')}</div>
        <button id="newExam" class="btn btn-primary" type="button">Nuevo examen</button>
      </div>`;
  }

  function closeModal() {
    const root = $('#modalRoot');
    root.classList.add('hidden');
    root.setAttribute('aria-hidden', 'true');
    root.innerHTML = '';
    state.currentGame = null;
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  }

  function initEvents() {
    document.addEventListener('click', e => {
      const nav = e.target.closest('[data-nav]');
      if (nav) return navigate(nav.dataset.nav);

      const aeroTab = e.target.closest('[data-aero-tab]');
      if (aeroTab) {
        state.aeroTab = aeroTab.dataset.aeroTab;
        $$('[data-aero-tab]').forEach(b => b.classList.toggle('active', b === aeroTab));
        $('#aero-alphabet').classList.toggle('hidden', state.aeroTab !== 'alphabet');
        $('#aero-cities').classList.toggle('hidden', state.aeroTab !== 'cities');
        return;
      }

      const hotelTab = e.target.closest('[data-hotel-tab]');
      if (hotelTab) {
        state.hotelTab = hotelTab.dataset.hotelTab;
        $$('[data-hotel-tab]').forEach(b => b.classList.toggle('active', b === hotelTab));
        $('#hotel-terms').classList.toggle('hidden', state.hotelTab !== 'terms');
        $('#hotel-abbr').classList.toggle('hidden', state.hotelTab !== 'abbr');
        return;
      }

      const card = e.target.closest('[data-card-index]');
      if (card) {
        state.currentCard = Number(card.dataset.cardIndex);
        renderFlashcard(); renderAlphabetGrid();
        return;
      }

      const game = e.target.closest('[data-game-topic]');
      if (game) return launchGame(game.dataset.gameTopic, game.dataset.game);

      if (e.target.closest('[data-close-modal]') || e.target.classList.contains('modal-backdrop')) return closeModal();

      const ans = e.target.closest('[data-game-answer]');
      if (ans) return gradeGame(ans.dataset.gameAnswer);

      const examAns = e.target.closest('[data-exam-answer]');
      if (examAns) return gradeExam(examAns.dataset.examAnswer);

      const speakGame = e.target.closest('[data-game-speak]');
      if (speakGame) return speak(speakGame.dataset.gameSpeak, { lang: speakGame.dataset.gameLang || 'en-US' });

      if (e.target.closest('[data-play-sequence]')) {
        const q = state.currentGame.questions[state.currentGame.index];
        return speakSequence(q.sequence, 'en-US');
      }

      if (e.target.closest('[data-submit-game]')) {
        const input = $('#gameInput');
        if (input?.value.trim()) return gradeGame(input.value.trim());
        return;
      }

      if (e.target.closest('[data-retry-game]')) {
        const g = state.currentGame;
        return launchGame(g.topic, g.game);
      }

      if (e.target.closest('[data-new-exam]')) return resetExamSetup();

      const memoryCard = e.target.closest('[data-memory-index]');
      if (memoryCard) return memoryFlip(Number(memoryCard.dataset.memoryIndex));
    });

    $('#prevCard').addEventListener('click', () => { state.currentCard = (state.currentCard - 1 + alphabet.length) % alphabet.length; renderFlashcard(); renderAlphabetGrid(); });
    $('#nextCard').addEventListener('click', () => { state.currentCard = (state.currentCard + 1) % alphabet.length; renderFlashcard(); renderAlphabetGrid(); });
    $('#flashcardSpeak').addEventListener('click', () => speakEnglish(alphabet[state.currentCard][1]));

    $('#converterInput').addEventListener('keydown', e => { if (e.key === 'Enter') renderConverter(); });
    $('#convertBtn').addEventListener('click', renderConverter);
    $('#converterSpeakAll').addEventListener('click', e => speakSequence((e.currentTarget.dataset.text || '').split(' — '), 'en-US'));
    $$('.speed-btn').forEach(btn => btn.addEventListener('click', () => { state.speechRate = Number(btn.dataset.rate); $$('.speed-btn').forEach(b => b.classList.toggle('active', b === btn)); }));
    $('#citySearch').addEventListener('input', e => renderCities(e.target.value));
    $('#hotelTermSearch').addEventListener('input', renderHotelTerms);
    $('#hotelAbbrSearch').addEventListener('input', renderHotelAbbr);
    $('#soundToggle').addEventListener('click', () => { state.soundEnabled = !state.soundEnabled; $('#soundToggle').textContent = state.soundEnabled ? '🔊' : '🔇'; if (!state.soundEnabled && 'speechSynthesis' in window) window.speechSynthesis.cancel(); });
    $('#startExam').addEventListener('click', startExam);
    $('#examQuestion').addEventListener('keydown', e => { if (e.key === 'Enter') $('[data-exam-answer]')?.focus(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#modalRoot').classList.contains('hidden')) closeModal(); });
  }

  function init() {
    renderAlphabetGrid(); renderFlashcard(); renderCities(); renderHotelTerms(); renderHotelAbbr(); initEvents();
    if ('speechSynthesis' in window) window.speechSynthesis.getVoices();
  }

  init();
})();
