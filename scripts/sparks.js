// When the hero finishes typing a word, a few little glyphs drift up off the
// highlighter, picked to match the word (suits for bridge, notes for music…).
document.addEventListener('DOMContentLoaded', () => {
    const layer = document.querySelector('.sparks');
    if (!layer) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    // First matching keyword wins.
    const GLYPHS = [
        [/bridge/i, ['♠', '♥', '♦', '♣']],
        [/warriors/i, ['swish.', '3', 'splash!', '+3']],
        [/boygenius|musical|hip-hop/i, ['♪', '♫', '♩', '♬']],
        [/barista|coffee/i, ['~', '∿', '☕︎', '§']],
        [/thrift/i, ['$', '¢', '50% off', '%']],
        [/video game/i, ['▲', '▼', '◀', '▶', '1UP']],
        [/deckbuilder/i, ['+1 energy', 'draw 2', '6 dmg', 'block 5']],
        [/customer success/i, ['✓', '5★', 'thanks!', '♡']],
        [/pilgrim/i, ['88', '↟', '⛰︎', '·']],
        [/cat foster/i, ['=^.^=', 'mrrp', '♡', '✿']],
        [/lighting/i, ['✺', '☀︎', 'cue 1', 'go']],
        [/telegram bot/i, ['/start', '/help', '>_', '…']],
        [/mythology/i, ['☉', '☾', '⚡︎', '✶']],
        [/cute|kuromi/i, ['♡', '✿', '✦', '★']],
        [/UI\/UX|designer|website|developer/i, ['{ }', '</>', '✎', '◧']],
    ];
    const DEFAULT = ['✦', '✧', '·'];

    const glyphsFor = (word) => (GLYPHS.find(([re]) => re.test(word)) || [null, DEFAULT])[1];

    const random = (min, max) => min + Math.random() * (max - min);

    document.addEventListener('typing:word', (event) => {
        const { word, element } = event.detail;
        const glyphs = glyphsFor(word);
        const width = element.offsetWidth;
        const count = 6;

        for (let i = 0; i < count; i++) {
            const spark = document.createElement('span');
            spark.className = 'spark';
            spark.textContent = glyphs[i % glyphs.length];
            spark.style.setProperty('--x', `${random(0.1, 1) * width}px`);
            spark.style.setProperty('--dx', `${random(-30, 30)}px`);
            spark.style.setProperty('--dy', `${random(-70, -40)}px`);
            spark.style.setProperty('--r', `${random(-35, 35)}deg`);
            spark.style.animationDelay = `${i * 70}ms`;
            spark.addEventListener('animationend', () => spark.remove());
            layer.appendChild(spark);
        }
    });
});
