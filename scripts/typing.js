function typingEffect(textContainerSelector, words) {
    const textContainer = document.querySelector(textContainerSelector);

    let wordIndex = 0;
    let letterIndex = 0;

    function typeNextWord() {
        const currentWord = words[wordIndex];
        textContainer.textContent = currentWord.substring(0, letterIndex + 1);
        letterIndex++;
        if (letterIndex === currentWord.length) {
            setTimeout(eraseWord, 1000);
        } else {
            setTimeout(typeNextWord, 200);
        }
    }

    function eraseWord() {
        const currentWord = words[wordIndex];
        textContainer.textContent = currentWord.substring(0, letterIndex);
        letterIndex--;
        if (letterIndex >= 0) {
            setTimeout(eraseWord, 50);
        } else {
            wordIndex++;
            if (wordIndex === words.length) {
                wordIndex = 0;
            }
            setTimeout(typeNextWord, 1000);
        }
    }

    typeNextWord();
}