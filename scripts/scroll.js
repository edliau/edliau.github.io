document.addEventListener('DOMContentLoaded', () => {
    const offset = 80; // Adjust this value to set how much below the top the section should appear

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();

            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - offset;

            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        });
    });
});

document.addEventListener('DOMContentLoaded', () => {
    // Get the "Scroll to Top" link
    const scrollToTopLink = document.getElementById('scrollToTop');

    // Add click event listener to the link
    scrollToTopLink.addEventListener('click', (e) => {
        e.preventDefault(); // Prevent default link behavior

        // Scroll to the top of the page
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
});