document.addEventListener('DOMContentLoaded', function () {
    const menuToggle = document.querySelector('.menu-toggle');
    const navigation = document.querySelector('.navigation');
    const navLinks = document.querySelectorAll('.navigation li a');

    // Mobile Menu Toggle
    menuToggle.addEventListener('click', () => {
        navigation.classList.toggle('active');
    });

    // Highlight Active Link
    const currentUrl = window.location.pathname.split('/').pop();
    navLinks.forEach((link) => {
        const href = link.getAttribute('href');
        if (href === currentUrl || (currentUrl === '' && href === 'index.html')) {
            link.classList.add('active');
        }
    });

    // Smooth Scroll Effect for Navigation Links
    navLinks.forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }

            // Remove active class from all links
            navLinks.forEach(link => link.classList.remove('active'));

            // Add active class to clicked link
            link.classList.add('active');
        });
    });
});
