function shuffleArray(array) {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

// Types each word, holds it, erases it, then moves on. Clicking the word skips
// ahead. When a word finishes it fires a `typing:word` event on the document
// (sparks.js listens). With reduced motion the words swap whole instead.
function typingEffect(textContainerSelector, words) {
    const textContainer = document.querySelector(textContainerSelector);
    if (!textContainer) return;

    const button = textContainer.closest('button');
    const list = shuffleArray(words);
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const TYPE_MS = 75;
    const ERASE_MS = 30;
    const HOLD_MS = 2600;
    const GAP_MS = 350;

    let wordIndex = 0;
    let length = 0;
    let timer = null;
    let phase = 'typing';

    const schedule = (fn, ms) => {
        clearTimeout(timer);
        timer = setTimeout(fn, ms);
    };

    const announce = (word) => {
        document.dispatchEvent(new CustomEvent('typing:word', { detail: { word, element: textContainer } }));
    };

    const nextWord = () => {
        wordIndex = (wordIndex + 1) % list.length;
    };

    if (reduceMotion) {
        const swap = () => {
            textContainer.textContent = list[wordIndex];
            announce(list[wordIndex]);
            nextWord();
            schedule(swap, HOLD_MS + 1000);
        };
        button?.addEventListener('click', swap);
        swap();
        return;
    }

    function type() {
        phase = 'typing';
        const word = list[wordIndex];
        length++;
        textContainer.textContent = word.slice(0, length);
        if (length < word.length) {
            schedule(type, TYPE_MS);
        } else {
            phase = 'holding';
            announce(word);
            schedule(erase, HOLD_MS);
        }
    }

    function erase() {
        phase = 'erasing';
        length--;
        textContainer.textContent = list[wordIndex].slice(0, length);
        if (length > 0) {
            schedule(erase, ERASE_MS);
        } else {
            nextWord();
            schedule(type, GAP_MS);
        }
    }

    button?.addEventListener('click', () => {
        if (phase !== 'erasing') schedule(erase, 0);
    });

    // Start once the hero lines have finished rising in.
    schedule(type, 600);
}
