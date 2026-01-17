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
                    <a class="nav-link" aria-current="page" href="index.html">Home</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="index.html">Airport Transfers</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="#">Services</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="fleet.html">Fleet</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="#">Contact</a>
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
    return nav;
}
