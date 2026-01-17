import { createNavbar } from './components/Navbar.js';
import { createFooter } from './components/Footer.js';
import { createLanguageModal } from './components/LanguageModal.js';
import { createWhatsappBubble } from './components/WhatsappBubble.js';

document.addEventListener('DOMContentLoaded', () => {
    const navbarMount = document.getElementById('navbar');
    if (navbarMount) {
        navbarMount.replaceWith(createNavbar());
    }
    const languageModalMount = document.getElementById('language-modal');
    if (languageModalMount) {
        languageModalMount.replaceWith(createLanguageModal());
    }
    const whatsappBubbleMount = document.getElementById('whatsapp-bubble');
    if (whatsappBubbleMount) {
        whatsappBubbleMount.replaceWith(createWhatsappBubble());
    }
    const footerMount = document.getElementById('footer');
    if (footerMount) {
        footerMount.replaceWith(createFooter());
    }
});
