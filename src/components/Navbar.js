// Navbar.js - Plain JS component for Vite
export function createNavbar() {
    const nav = document.createElement('nav');
    nav.className = 'navbar navbar-expand-lg navbar-light bg-light sticky-top shadow';
    nav.innerHTML = `
    <div class="container-fluid">
        <a class="navbar-brand mb-0 h1 d-flex align-items-center" href="index.html">
            <img src="assets/taxi-logo.png" alt="Taxi Logo" width="40" height="40" class="me-2">
            <div class="d-flex flex-column">
                <span>Paul's Airport Taxi</span>
                <span class="small text-muted">Premium Transfer Service</span>
            </div>
        </a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav"
                aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
            <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarNav">
            <ul class="navbar-nav mx-auto">
                <li class="nav-item">
                    <a class="nav-link" href="index.html">Home</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="airport-transfers.html">Airport Transfers</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="services.html">Services</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="fleet.html">Fleet</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="contact.html">Contact</a>
                </li>
            </ul>
            <div class="d-flex justify-content-end align-items-center ms-auto">
                <button type="button" class="btn btn-link text-secondary fs-4 p-0 ms-3 language-icon" data-bs-toggle="modal"
                        data-bs-target="#languageModal" aria-label="Select Language">
                    <i class="bi bi-translate"></i>
                </button>
            </div>
        </div>
    </div>
    <style>
        .navbar-nav .nav-link,
        .btn-link.language-icon {
            position: relative;
            border-bottom: 0.2rem solid transparent !important;
            transition: border-bottom-color 0.3s;
        }
        .navbar-nav .nav-link:hover,
        .navbar-nav .nav-link:focus,
        .btn-link.language-icon:hover,
        .btn-link.language-icon:focus {
            border-bottom: 0.2rem solid #ffc107 !important;
        }
    </style>
    `;

    // Navbar active link highlighting based on href
    const currentPath = window.location.pathname;
    let pageName = currentPath.split('/').pop().toLowerCase();

    // Default to 'index' if on the root path
    if (!pageName) pageName = 'index';

    // Remove .html extension for comparison
    pageName = pageName.replace(/\.html$/, '');

    const links = nav.querySelectorAll('.nav-link');
    links.forEach(link => {
        const href = link.getAttribute('href');

        let linkPage = href.split('/').pop().toLowerCase();
        linkPage = linkPage.replace(/\.html$/, '');

        // Match normalized names (e.g. 'index' === 'index')
        if (linkPage === pageName) {
             link.classList.add('active');
             link.setAttribute('aria-current', 'page');
        } else {
             link.classList.remove('active');
             link.removeAttribute('aria-current');
        }
    });

    return nav;
}
