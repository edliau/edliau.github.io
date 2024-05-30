document.querySelectorAll('a[data-image]').forEach(item => {
    item.addEventListener('mouseover', event => {
        const imgId = event.target.getAttribute('data-image');
        const targetImage = document.getElementById(imgId);
        const offset = targetImage.offsetLeft; // Calculate the offset of the target image
        document.querySelectorAll('.image-container img').forEach(img => {
            if (img === targetImage) {
                img.classList.add('active', 'fade-in');
                img.style.setProperty('--offset', offset + 'px'); // Set custom CSS variable for the offset
                img.classList.remove('fade-out');
            } else {
                img.classList.remove('active', 'fade-in');
                img.classList.add('fade-out');
            }
        });
    });
});
