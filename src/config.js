// config.js - single source of truth for business contact details.
// Consumed By:
//  1. JS modules 
//  2. HTML with %VITE_*% placeholders
export const PHONE_NUMBER = '35796699870';
export const PHONE_DISPLAY = '+357 96699870';
export const EMAIL = 'paul@airporttaxi.com';

export const WHATSAPP_URL = `https://wa.me/${PHONE_NUMBER}`;
export const TEL_HREF = `tel:+${PHONE_NUMBER}`;
export const MAILTO_HREF = `mailto:${EMAIL}`;