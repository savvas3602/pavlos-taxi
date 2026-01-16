// Inject navbar as a direct child of <body> for sticky-top to work
const navbarResponse = await fetch('./src/navbar.html');
const navbarHtml = await navbarResponse.text();
document.body.insertAdjacentHTML('afterbegin', navbarHtml);

// Inject language modal
const languageModalResponse = await fetch('./src/language-modal.html');
const languageModalHtml = await languageModalResponse.text();
document.getElementById('language-modal-container').innerHTML = languageModalHtml;

// Inject footer
const footerResponse = await fetch('./src/footer.html');
const footerHtml = await footerResponse.text();
document.getElementById('footer-container').innerHTML = footerHtml;

// Inject WhatsApp bubble
const whatsappBubbleResponse = await fetch('./src/whatsapp-bubble.html');
const whatsappBubbleHtml = await whatsappBubbleResponse.text();
document.getElementById('whatsapp-bubble-container').innerHTML = whatsappBubbleHtml;

