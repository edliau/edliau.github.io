// "lights off" / "lights on": a dark-mode switch, as a nod to lighting tech.
// Follows the device setting until you choose, then remembers your choice.
document.addEventListener('DOMContentLoaded', () => {
    const root = document.documentElement;
    const button = document.getElementById('lights');
    const label = button?.querySelector('.lights__label');
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)');

    const current = () => root.dataset.theme || (systemDark.matches ? 'dark' : 'light');

    const sync = () => {
        const dark = current() === 'dark';
        if (button) {
            button.setAttribute('aria-pressed', String(dark));
            button.setAttribute('aria-label', dark ? 'Turn the lights on (light theme)' : 'Turn the lights off (dark theme)');
        }
        if (label) label.textContent = dark ? 'lights on' : 'lights off';
        if (metaTheme) metaTheme.setAttribute('content', getComputedStyle(root).getPropertyValue('--paper').trim());
    };

    button?.addEventListener('click', () => {
        const next = current() === 'dark' ? 'light' : 'dark';
        root.classList.add('theme-fade');
        root.dataset.theme = next;
        try {
            localStorage.setItem('theme', next);
        } catch (e) { /* private mode: the choice just won't persist */ }
        sync();
        setTimeout(() => root.classList.remove('theme-fade'), 700);
    });

    systemDark.addEventListener('change', sync);
    sync();
});
