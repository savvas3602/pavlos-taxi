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

export const CURRENCY_SYMBOL = '€';

export const DESTINATIONS = [
    { id: 'lca-city', description: 'LCA City' },
    { id: 'lca-tourist-area', description: 'LCA Turist Area' },
    { id: 'ayia-napa', description: 'Ayia Nappa' },
    { id: 'protaras', description: 'Protaras' },
    { id: 'limassol-city', description: 'Limassol City' },
    { id: 'limassol-tourist-area', description: 'Limassol Turist area' },
    { id: 'paphos-city', description: 'Paphos City' },
    { id: 'paphos-airport', description: 'Paphos Airport' },
];

// Vehicle capacity/pricing tiers used by the book-now quote calculator.
// Note: the 6- and 8-seater tiers are the *same* physical vehicle (Mercedes
// Vito), just priced differently based on how many of its seats are used -
// they are pricing tiers, not distinct cars, hence the separate `vehicle`
// (display name) vs `id` (pricing-lookup key) fields.
export const VEHICLES = [
    { id: '4-seater', vehicle: 'Mercedes E-Class', capacity: 4 },
    { id: '6-seater', vehicle: 'Mercedes Vito', capacity: 6 },
    { id: '8-seater', vehicle: 'Mercedes Vito', capacity: 8 },
];

// Base fare per vehicle tier x destination, in EUR.
export const PRICING = {
    '4-seater': {
        'lca-city': 20,
        'lca-tourist-area': 35,
        'ayia-napa': 65,
        'protaras': 75,
        'limassol-city': 80,
        'limassol-tourist-area': 70,
        'paphos-city': 135,
        'paphos-airport': 150,
    },
    '6-seater': {
        'lca-city': 30,
        'lca-tourist-area': 45,
        'ayia-napa': 90,
        'protaras': 100,
        'limassol-city': 100,
        'limassol-tourist-area': 90,
        'paphos-city': 170,
        'paphos-airport': 200,
    },
    '8-seater': {
        'lca-city': 40,
        'lca-tourist-area': 50,
        'ayia-napa': 100,
        'protaras': 110,
        'limassol-city': 110,
        'limassol-tourist-area': 100,
        'paphos-city': 180,
        'paphos-airport': 220,
    },
};

// Flat add-on fees, in EUR. Luggage size (S/M/L) is collected on the
// book-now form too, but doesn't have a priced rule yet - TBD, see TODO.md.
export const ADD_ONS = [
    { id: 'baby-seat', label: 'Baby Seat', price: 5 },
    { id: 'booster-seat', label: 'Booster Seat', price: 5 },
    { id: 'pet', label: 'Pet', price: 5 },
];
