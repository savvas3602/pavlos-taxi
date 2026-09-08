// booking-calculator.js - pure vehicle-selection/pricing logic for the
// book-now quote form. No DOM access here on purpose, so the rules can be
// reasoned about (and tested) independently of the UI that renders them.
import { VEHICLES, PRICING, ADD_ONS } from '../config.js';

export const MAX_PASSENGERS = Math.max(...VEHICLES.map((v) => v.capacity));

/**
 * Picks the smallest vehicle tier whose capacity covers the given
 * passenger count (adults + children counted equally - each takes a seat).
 * Returns null if the party is larger than the biggest available vehicle.
 */
export function selectVehicle(totalPassengers) {
    const candidates = VEHICLES
        .filter((v) => v.capacity >= totalPassengers)
        .sort((a, b) => a.capacity - b.capacity);
    return candidates[0] ?? null;
}

/**
 * Calculates an indicative quote for the given selections.
 *
 * `locationId` is the non-airport end of the trip - every supported route is
 * Larnaca Airport <-> that location, and the fare is the same either
 * direction, so which end is the pick-up vs. the destination doesn't affect
 * price and isn't needed here (it's a presentational concern, handled in
 * BookingCalculator.js for the on-screen summary and WhatsApp message).
 *
 * `luggageSize` is accepted and passed through for the WhatsApp summary,
 * but does not yet affect vehicle choice or price - that pricing rule is
 * still TBD (see TODO.md), so it's a no-op here until it's defined.
 *
 * Returns:
 *   - { totalPassengers: 0, vehicle: null, ... }              nothing selected yet
 *   - { vehicle: null, totalPassengers, overCapacity: true }  party too large for any vehicle
 *   - { vehicle, basePrice: null, ... }                       vehicle found but no price for that location
 *   - { vehicle, basePrice, addOns, addOnsTotal, total }      normal quote
 */
export function calculateQuote({ locationId, adults = 0, children = 0, addOnIds = [] } = {}) {
    const totalPassengers = adults + children;

    if (totalPassengers === 0) {
        return { totalPassengers, vehicle: null, overCapacity: false, basePrice: null, addOns: [], addOnsTotal: 0, total: null };
    }

    const vehicle = selectVehicle(totalPassengers);
    if (!vehicle) {
        return { totalPassengers, vehicle: null, overCapacity: true, basePrice: null, addOns: [], addOnsTotal: 0, total: null };
    }

    const addOns = ADD_ONS.filter((addOn) => addOnIds.includes(addOn.id));
    const addOnsTotal = addOns.reduce((sum, addOn) => sum + addOn.price, 0);
    const basePrice = PRICING[vehicle.id]?.[locationId] ?? null;
    const total = basePrice === null ? null : basePrice + addOnsTotal;

    return { totalPassengers, vehicle, overCapacity: false, basePrice, addOns, addOnsTotal, total };
}
