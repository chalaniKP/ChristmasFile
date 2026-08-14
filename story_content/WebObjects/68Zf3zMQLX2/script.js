// ===== MEMORY MATCH (4x3) - STORYLINE WEB OBJECT =====
(() => {
  'use strict';

  const WEB_OBJECT_ID = "FlipCardGame_01";

  window.addEventListener("message", function (event) {
    if (event.data?.action === "reload" && event.data.target === WEB_OBJECT_ID) {
      location.reload();
    }
  });


  // === CONFIG ===
  const TOTAL_PAIRS = 6;
  const TOTAL_CARDS = TOTAL_PAIRS * 2;
  const CARD_SCORE = 5; // each correct match = 10 points
  const TARGET_SCORE = 30;
  const IMAGE_PATH = 'images/'; // folder relative to script.js
  const FACE_IMAGES = Array.from({ length: TOTAL_PAIRS }, (_, i) => `${IMAGE_PATH}img${i+1}.png`);
  const BACK_IMAGE = `${IMAGE_PATH}back.png`;

  // === GAME STATE ===
  let gameState = {
    cards: [],             // array of card objects { id, faceSrc, matched }
    flippedCards: [],      // DOM elements currently flipped
    matchedPairs: 0,
    score: 0,
    canFlip: true,
    isGameActive: true
  };

  // === DOM ===
  // Expect the HTML to have a container with id="memory-grid"
  // (No other controls or text on the page)
  const memoryGrid = document.getElementById('memory-grid');

  // Simple audio system (kept from previous implementation)
  const audio = {
    context: null,
    init: () => {
      try {
        audio.context = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) {
        console.log('Web Audio not supported');
      }
    },
    playTone: (frequency, duration, type = 'sine') => {
      if (!audio.context) return;
      const oscillator = audio.context.createOscillator();
      const gain = audio.context.createGain();
      oscillator.connect(gain);
      gain.connect(audio.context.destination);
      oscillator.frequency.setValueAtTime(frequency, audio.context.currentTime);
      oscillator.type = type;
      gain.gain.setValueAtTime(0.1, audio.context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audio.context.currentTime + duration);
      oscillator.start(audio.context.currentTime);
      oscillator.stop(audio.context.currentTime + duration);
    },
    playFlip: () => audio.playTone(800, 0.08),
    playMatch: () => audio.playTone(1200, 0.18),
    playError: () => audio.playTone(300, 0.35),
    playWin: () => {
      setTimeout(() => audio.playTone(523, 0.18), 0);
      setTimeout(() => audio.playTone(659, 0.18), 180);
      setTimeout(() => audio.playTone(784, 0.28), 360);
    }
  };

  // === UTILITIES ===
  const utils = {
    shuffle: (arr) => {
      const a = arr.slice();
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    }
  };

  // === Messaging to Storyline ===
  // We will send both a combined message and individual variable-style messages
  // so your Storyline listener can pick whichever format you have.
  const sendResultsToStoryline = (lvl1Score, lvl1Complete) => {
    console.log('sendResultsToStoryline() ->', { lvl1Score, lvl1Complete });

    // 1) Combined message (preferred)
    window.parent.postMessage(
      { action: "setVariables", lvl1Score: lvl1Score, lvl1Complete: lvl1Complete },
      "*"
    );

    // 2) Individual setVariable messages (compatibility with older listeners)
    window.parent.postMessage(
      { action: "setVariable", name: "FinalScore", value: lvl1Score },
      "*"
    );

    window.parent.postMessage(
      { action: "setVariable", name: "GameCompleteStatus", value: lvl1Complete },
      "*"
    );

    // Note: Storyline side should have an event listener for "message" and then
    // update its variables accordingly (GetPlayer().SetVar(...))
  };

  // === CARD DOM CREATION ===
  function createCardElement(cardObj) {
    // Structure:
    // <div class="memory-card" data-id="...">
    //   <div class="card-inner">
    //     <img class="card-front" src="back.png">
    //     <img class="card-back" src="face.png">
    //   </div>
    // </div>
    const card = document.createElement('div');
    card.className = 'memory-card';
    card.dataset.id = cardObj.id;

    const inner = document.createElement('div');
    inner.className = 'card-inner';

    const frontImg = document.createElement('img');
    frontImg.className = 'card-front';
    frontImg.src = BACK_IMAGE;
    frontImg.alt = 'card back';

    const backImg = document.createElement('img');
    backImg.className = 'card-back';
    backImg.src = cardObj.faceSrc;
    backImg.alt = 'card face';

    inner.appendChild(frontImg);
    inner.appendChild(backImg);
    card.appendChild(inner);

    // Click handler
    card.addEventListener('click', () => handleCardClick(card, cardObj));

    return card;
  }

  // === CARD CLICK / MATCH LOGIC ===
  function handleCardClick(cardEl, cardObj) {
    if (!gameState.isGameActive || !gameState.canFlip) return;
    if (cardObj.matched) return;
    if (cardEl.classList.contains('flipped')) return;
    if (gameState.flippedCards.length >= 2) return;

    // Flip visually
    cardEl.classList.add('flipped');
    audio.playFlip();

    // Track flipped
    gameState.flippedCards.push({ el: cardEl, obj: cardObj });

    if (gameState.flippedCards.length === 2) {
      gameState.canFlip = false;
      setTimeout(checkMatch, 600); // small delay for player to see
    }
  }

  function checkMatch() {
    const [a, b] = gameState.flippedCards;
    if (!a || !b) {
      gameState.flippedCards = [];
      gameState.canFlip = true;
      return;
    }

    // Match if faceSrc is identical
    if (a.obj.faceSrc === b.obj.faceSrc) {
      // mark matched
      a.obj.matched = true;
      b.obj.matched = true;

      a.el.classList.add('matched');
      b.el.classList.add('matched');

      gameState.matchedPairs += 1;
      gameState.score += CARD_SCORE; // +10 per correct match
      audio.playMatch();
      // check completion based on score
      const lvl1Complete = gameState.score >= TARGET_SCORE;

      // send score + completion status on EACH match
      sendResultsToStoryline(gameState.score, lvl1Complete);

      console.log('Match! Score:',gameState.score,'MatchedPairs:',gameState.matchedPairs,'lvl1Complete:',lvl1Complete);

      // If all pairs matched -> complete
      if (gameState.matchedPairs === TOTAL_PAIRS) {
        gameComplete(true);
      }
    } else {
      // Not a match: flip back
      a.el.classList.add('card-error');
      b.el.classList.add('card-error');
      audio.playError();

      setTimeout(() => {
        a.el.classList.remove('flipped', 'card-error');
        b.el.classList.remove('flipped', 'card-error');
      }, 500);
    }

    // reset flip state
    gameState.flippedCards = [];
    gameState.canFlip = true;
  }

  // === GAME COMPLETE ===
  function gameComplete(didWin) {
    gameState.isGameActive = false;
    gameState.canFlip = false;

    if (didWin) {
      // play win sound
      audio.playWin();
      console.log('Game complete! Final Score =', gameState.score);

      // Send results to Storyline (score and completion status)
      sendResultsToStoryline(gameState.score, true);

      // Also send a small 'test' message so you can verify Storyline received something
      window.parent.postMessage({ action: "gameCompleteNotif", score: gameState.score }, "*");
    } else {
      // If you ever implement a lose-path, send false here
      sendResultsToStoryline(gameState.score, false);
    }
  }

  // === SETUP GRID ===
  function setupGrid() {
    // Build pairs: for each face image, create two card objects
    const pairObjects = FACE_IMAGES.map((src, idx) => ({
      id: `p${idx+1}`,
      faceSrc: src,
      matched: false
    }));

    // Duplicate and assign unique ids per card
    let cardPool = [];
    pairObjects.forEach((p, idx) => {
      cardPool.push({ id: `${p.id}_a`, faceSrc: p.faceSrc, matched: false });
      cardPool.push({ id: `${p.id}_b`, faceSrc: p.faceSrc, matched: false });
    });

    // Shuffle
    cardPool = utils.shuffle(cardPool);

    // Save to game state
    gameState.cards = cardPool;

    // Render grid DOM (6 columns x 4 rows)
    // Clear container
    memoryGrid.innerHTML = '';
    memoryGrid.style.display = 'grid';
    memoryGrid.style.gridTemplateColumns = 'repeat(4, 1fr)'; // 6 columns
    memoryGrid.style.gridGap = '8px';

    cardPool.forEach(cardObj => {
      const el = createCardElement(cardObj);
      memoryGrid.appendChild(el);
    });

    console.log(`Grid setup: ${cardPool.length} cards (${TOTAL_PAIRS} pairs)`);
  }

  // === INIT ===
  function init() {
    console.log('Memory Match (4x3) initializing...');
    // init audio on user interaction (many browsers require a user gesture to unlock audio)
    document.addEventListener('click', () => {
      if (!audio.context) audio.init();
    }, { once: true });

    setupGrid();

    // Small debug test message to verify parent listener
    console.log('Attempting test postMessage to parent');
    window.parent.postMessage({ action: "test" }, "*");
    console.log('Test postMessage sent');

    console.log('Game ready.');
  }

  // Start when DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
