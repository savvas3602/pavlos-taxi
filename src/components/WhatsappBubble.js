// WhatsappBubble.js - Plain JS component for Vite
export function createWhatsappBubble() {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = `
    <style>
        @keyframes breathe {
            0%, 100% {
                transform: scale(1);
                box-shadow: 0 0.125rem 0.5rem rgba(0,0,0,0.15);
            }
            50% {
                transform: scale(1.05);
                box-shadow: 0 0.1875rem 0.75rem rgba(0,0,0,0.2);
            }
        }
        .whatsapp-bubble-bg {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: white;
            border-radius: 50%;
            animation: breathe 2.5s ease-in-out infinite;
            z-index: -1;
        }
    </style>
    <a href="https://wa.me/35796699870" target="_blank" rel="noopener"
       style="position: fixed; bottom: 2rem; right: 2rem; z-index: 1050;
       width: 4rem; height: 4rem; display: flex; align-items: center;
       justify-content: center;" aria-label="Contact us on WhatsApp">
        <div class="whatsapp-bubble-bg"></div>
        <i class="bi bi-whatsapp" aria-hidden="true" style="color: #25D366; font-size: 2.5rem; line-height: 1;"></i>
    </a>
    `;

    // Append the style and the link to the body
    document.head.appendChild(wrapper.querySelector('style'));
    return wrapper.querySelector('a');
}
