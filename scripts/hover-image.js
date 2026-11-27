// "recently, I've…" list: hovering, focusing or tapping a line crossfades to its photo.
document.addEventListener('DOMContentLoaded', () => {
    const buttons = document.querySelectorAll('.photo-link[data-image]');
    const images = document.querySelectorAll('.photo-stack img');

    const show = (button) => {
        const target = document.getElementById(button.dataset.image);
        if (!target || target.classList.contains('is-active')) return;

        images.forEach(img => img.classList.toggle('is-active', img === target));
        buttons.forEach(b => {
            const active = b === button;
            b.classList.toggle('is-active', active);
            b.setAttribute('aria-pressed', String(active));
        });
    };

    buttons.forEach(button => {
        button.addEventListener('pointerenter', (e) => {
            if (e.pointerType === 'mouse') show(button);
        });
        button.addEventListener('focus', () => show(button));
        button.addEventListener('click', () => show(button));
    });
});
