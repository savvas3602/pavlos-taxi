// WhatsappBubble.js - Plain JS component for Vite
export function createWhatsappBubble() {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = `
<a href="https://wa.me/35796699870" target="_blank" rel="noopener"
   style="position: fixed; bottom: 2rem; right: 2rem; z-index: 1050; background: white; border-radius: 50%;
   box-shadow: 0 0.125rem 0.5rem rgba(0,0,0,0.15); width: 4rem; height: 4rem; display: flex; align-items: center;
   justify-content: center;" aria-label="Contact us on WhatsApp">
    <img src="assets/WhatsApp_Logo_green.svg" alt="WhatsApp" width="40" height="40" style="display: block;"/>
</a>
`;
    return wrapper.firstElementChild;
}
