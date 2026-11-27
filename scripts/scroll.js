// Smooth scrolling and the header offset are handled in CSS
// (scroll-behavior and scroll-margin-top). This script only:
// - adds a hairline under the header and shows "back to top" once you scroll
// - marks the nav link of the section currently on screen
document.addEventListener('DOMContentLoaded', () => {
    const header = document.getElementById('site-header');

    let ticking = false;
    const updateHeader = () => {
        ticking = false;
        header.classList.toggle('is-scrolled', window.scrollY > 24);
        const scrollable = document.documentElement.scrollHeight - window.innerHeight;
        const progress = scrollable > 0 ? Math.min(1, window.scrollY / scrollable) : 0;
        header.style.setProperty('--progress', progress.toFixed(4));
    };
    updateHeader();
    window.addEventListener('scroll', () => {
        if (!ticking) {
            ticking = true;
            requestAnimationFrame(updateHeader);
        }
    }, { passive: true });

    if (!('IntersectionObserver' in window)) return;

    const links = document.querySelectorAll('.site-nav__links .nav-link');
    const linkFor = id => document.querySelector(`.site-nav__links a[href="#${id}"]`);

    const spy = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            links.forEach(link => link.removeAttribute('aria-current'));
            const link = linkFor(entry.target.id);
            if (link) link.setAttribute('aria-current', 'true');
        });
    }, {
        // A thin band across the middle of the screen decides which section is "current".
        rootMargin: '-45% 0px -50% 0px'
    });

    document.querySelectorAll('main > section[id]').forEach(section => spy.observe(section));
});
