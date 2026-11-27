// Project accordion: each toggle opens or closes its own panel.
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.project__toggle').forEach(toggle => {
        const panel = document.getElementById(toggle.getAttribute('aria-controls'));
        if (!panel) return;

        toggle.addEventListener('click', () => {
            const open = toggle.getAttribute('aria-expanded') !== 'true';
            toggle.setAttribute('aria-expanded', String(open));
            panel.classList.toggle('is-open', open);
        });
    });
});
