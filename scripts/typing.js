function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function typingEffect(textContainerSelector, words) {
    // Shuffle the words array
    words = shuffleArray(words);

    const textContainer = document.querySelector(textContainerSelector);
    let wordIndex = 0;
    let letterIndex = 0;

    function typeNextWord() {
        const currentWord = words[wordIndex];
        textContainer.textContent = currentWord.substring(0, letterIndex + 1);
        letterIndex++;
        if (letterIndex === currentWord.length) {
            setTimeout(eraseWord, 4000); // Increase delay before erasing
        } else {
            setTimeout(typeNextWord, 100); // Delay between each letter typing
        }
    }

    function eraseWord() {
        const currentWord = words[wordIndex];
        textContainer.textContent = currentWord.substring(0, letterIndex);
        letterIndex--;
        if (letterIndex >= 0) {
            setTimeout(eraseWord, 50); // Delay between each letter erasing
        } else {
            wordIndex++;
            if (wordIndex === words.length) {
                wordIndex = 0;
            }
            setTimeout(typeNextWord, 300);
        }
    }

    // Initial start of typing effect
    typeNextWord();
}
