function shuffleArray(array) {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

// Types each word, holds it, erases it, then moves on. With reduced motion
// the words swap whole instead of being typed letter by letter.
function typingEffect(textContainerSelector, words) {
    const textContainer = document.querySelector(textContainerSelector);
    if (!textContainer) return;

    const list = shuffleArray(words);
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const TYPE_MS = 75;
    const ERASE_MS = 35;
    const HOLD_MS = 2600;
    const GAP_MS = 350;

    let wordIndex = 0;
    let length = 0;

    const nextWord = () => {
        wordIndex = (wordIndex + 1) % list.length;
    };

    if (reduceMotion) {
        const swap = () => {
            textContainer.textContent = list[wordIndex];
            nextWord();
            setTimeout(swap, HOLD_MS + 1000);
        };
        swap();
        return;
    }

    function type() {
        const word = list[wordIndex];
        length++;
        textContainer.textContent = word.slice(0, length);
        setTimeout(length < word.length ? type : erase, length < word.length ? TYPE_MS : HOLD_MS);
    }

    function erase() {
        length--;
        textContainer.textContent = list[wordIndex].slice(0, length);
        if (length > 0) {
            setTimeout(erase, ERASE_MS);
        } else {
            nextWord();
            setTimeout(type, GAP_MS);
        }
    }

    // Start once the hero lines have finished rising in.
    setTimeout(type, 600);
}
