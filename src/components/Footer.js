// Footer.js - Plain JS component for Vite
export function createFooter() {
    const footer = document.createElement('footer');
    footer.className = 'bg-dark border-top text-light';
    footer.innerHTML = `
    <div class="container py-5">
        <div class="row">
            <!-- Column 1: Logo and Description -->
            <div class="col-12 col-md-4 mb-4 mb-md-0 d-flex flex-column align-items-md-start align-items-center">
                <div class="d-flex align-items-center mb-2">
                    <img src="assets/taxi-logo.png" alt="Taxi Logo" width="40" height="40" class="me-2">
                    <div class="d-flex flex-column">
                        <span class="fw-bold text-light">Paul's Airport Taxi</span>
                        <span class="small text-secondary">Premium Transfer Service</span>
                    </div>
                </div>
                <p class="mb-0 text-secondary text-center text-md-start">
                    Professional airport transfers and premium transportation services.
                </p>
            </div>
            <!-- Column 2: Quick Links -->
            <div class="col-12 col-md-4 mb-4 mb-md-0">
                <h6 class="fw-bold mb-3 text-light">Quick Links</h6>
                <ul class="list-unstyled">
                    <li><a href="index.html" class="text-decoration-none text-light">Home</a></li>
                    <li><a href="#" class="text-decoration-none text-light">Services</a></li>
                    <li><a href="fleet.html" class="text-decoration-none text-light">Fleet</a></li>
                    <li><a href="contact.html" class="text-decoration-none text-light">Contact</a></li>
                </ul>
            </div>
            <!-- Column 3: Contact Info -->
            <div class="col-12 col-md-4">
                <h6 class="fw-bold mb-3 text-light">Contact Info</h6>
                <ul class="list-unstyled mb-0">
                    <li class="mb-2"><i class="bi bi-whatsapp me-2 text-success"></i>WhatsApp:
                        <a href="https://wa.me/35796699870" class="text-decoration-none text-light">+357 96 699 870</a>
                    </li>
                    <li class="mb-2"><i class="bi bi-telephone me-2 text-primary"></i>Phone:
                        <a href="tel:+35796699870" class="text-decoration-none text-light">+357 96 699 870</a></li>
                    <li><i class="bi bi-envelope me-2 text-warning"></i>
                        <a href="mailto:paul@airporttaxi.com" class="text-decoration-none text-light">paul@airporttaxi.com</a>
                    </li>
                </ul>
            </div>
        </div>
    </div>
    `;
    return footer;
}
