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

// Every route the book-now quote calculator supports has Larnaca Airport as
// one end - the other end is one of these. Which end is the pick-up vs. the
// destination is a per-booking choice (see the swap button / DIRECTION_*
// constants in BookingCalculator.js), not fixed per location.
export const AIRPORT_LABEL = 'Larnaca Airport';

export const LOCATIONS = [
    { id: 'lca-city', description: 'Larnaca City' },
    { id: 'lca-tourist-area', description: 'Larnaca Tourist Area' },
    { id: 'ayia-napa', description: 'Ayia Napa' },
    { id: 'protaras', description: 'Protaras' },
    { id: 'limassol-city', description: 'Limassol City' },
    { id: 'limassol-tourist-area', description: 'Limassol Tourist area' },
    { id: 'paphos-city', description: 'Paphos City' },
    { id: 'paphos-airport', description: 'Paphos Airport' },
];

// Vehicle capacity/pricing tiers used by the book-now quote calculator.
export const VEHICLES = [
    { id: '4-seater', vehicle: 'Mercedes E-Class', capacity: 4 },
    { id: '6-seater', vehicle: 'Mercedes V-Class', capacity: 6 },
    { id: '8-seater', vehicle: 'Mercedes Vito', capacity: 8 },
];

// A trip whose pick-up time falls in this window (local time, "HH:mm";
// start inclusive, end exclusive - it wraps past midnight) pays the
// `eveningSurcharge` of its PRICING entry on top of the base fare.
export const EVENING_START = '20:30';
export const EVENING_END = '06:00';

// Base fare and evening surcharge per vehicle tier x location, in EUR. Same
// either direction (Larnaca Airport -> location or location -> Larnaca
// Airport). The surcharge is kept per entry, not as one constant, so it
// can differ by route/vehicle later.
export const PRICING = {
    '4-seater': {
        'lca-city': { fare: 20, eveningSurcharge: 10 },
        'lca-tourist-area': { fare: 35, eveningSurcharge: 10 },
        'ayia-napa': { fare: 65, eveningSurcharge: 10 },
        'protaras': { fare: 75, eveningSurcharge: 10 },
        'limassol-city': { fare: 80, eveningSurcharge: 10 },
        'limassol-tourist-area': { fare: 70, eveningSurcharge: 10 },
        'paphos-city': { fare: 135, eveningSurcharge: 10 },
        'paphos-airport': { fare: 150, eveningSurcharge: 10 },
    },
    '6-seater': {
        'lca-city': { fare: 30, eveningSurcharge: 10 },
        'lca-tourist-area': { fare: 45, eveningSurcharge: 10 },
        'ayia-napa': { fare: 90, eveningSurcharge: 10 },
        'protaras': { fare: 100, eveningSurcharge: 10 },
        'limassol-city': { fare: 100, eveningSurcharge: 10 },
        'limassol-tourist-area': { fare: 90, eveningSurcharge: 10 },
        'paphos-city': { fare: 170, eveningSurcharge: 10 },
        'paphos-airport': { fare: 200, eveningSurcharge: 10 },
    },
    '8-seater': {
        'lca-city': { fare: 40, eveningSurcharge: 10 },
        'lca-tourist-area': { fare: 50, eveningSurcharge: 10 },
        'ayia-napa': { fare: 100, eveningSurcharge: 10 },
        'protaras': { fare: 110, eveningSurcharge: 10 },
        'limassol-city': { fare: 110, eveningSurcharge: 10 },
        'limassol-tourist-area': { fare: 100, eveningSurcharge: 10 },
        'paphos-city': { fare: 180, eveningSurcharge: 10 },
        'paphos-airport': { fare: 220, eveningSurcharge: 10 },
    },
};

// Flat add-on fees, in EUR. Luggage size (S/M/L) is collected on the
// book-now form too, but doesn't have a priced rule yet - TBD, see TODO.md.
export const ADD_ONS = [
    { id: 'baby-seat', label: 'Baby Seat', price: 5 },
    { id: 'booster-seat', label: 'Booster Seat', price: 5 },
    { id: 'pet', label: 'Pet', price: 5 },
];

// Round trip = an outbound leg (Larnaca Airport -> location) plus a return
// leg (location -> Larnaca Airport) booked together, only offered when the
// airport is the pick-up (see BookingCalculator.js). This discount applies
// to the combined fare of both legs, not to each leg individually.
export const ROUND_TRIP_DISCOUNT = 0.10;
