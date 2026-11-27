// Fills the interest band. The list is written twice so the CSS loop
// (translate by -50%) joins up seamlessly.
document.addEventListener('DOMContentLoaded', () => {
    const track = document.querySelector('.marquee__track');
    if (!track || !Array.isArray(window.INTERESTS)) return;

    const items = window.INTERESTS.map(text => text.replace(/\.$/, ''));

    const renderRun = () => {
        const run = document.createElement('div');
        run.className = 'marquee__run';
        items.forEach(text => {
            const item = document.createElement('span');
            item.className = 'marquee__item';
            item.textContent = text;
            run.appendChild(item);
        });
        return run;
    };

    track.append(renderRun(), renderRun());
});
