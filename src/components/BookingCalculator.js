// BookingCalculator.js - Plain JS component for Vite.
// Renders the "Get an Instant Quote" form: trip direction, location, and
// per-trip details (date/time, adults, children, luggage, add-ons) drive an
// auto-selected vehicle + indicative price (src/utils/booking-calculator.js).
// Luggage and add-ons are optional, so they sit folded inside one
// "Luggage & add-ons" <details> row per leg (opened automatically once
// children are added, so child seats aren't missed).
// When the pick-up is the airport, the customer must give their flight
// number (so the arrival can be tracked), and can also add a return leg for
// a round trip at a 10% discount on the combined fare. The return leg only
// asks for its date/time by default ("Same people, luggage & add-ons"
// starts ticked); unticking it reveals its own passengers/luggage/add-ons,
// prefilled from the outbound leg. Either way, the visitor sends the
// result to us as a prefilled WhatsApp message - same backend-free,
// WhatsApp-to-human booking model the rest of the site already uses.
import {
    LOCATIONS, ADD_ONS, CURRENCY_SYMBOL, WHATSAPP_URL, AIRPORT_LABEL, ROUND_TRIP_DISCOUNT, EVENING_START, EVENING_END,
} from '../config.js';
import { calculateQuote, combineRoundTripQuote, MAX_PASSENGERS } from '../utils/booking-calculator.js';

const LUGGAGE_SIZES = [
    { id: 's', label: 'Small' },
    { id: 'm', label: 'Medium' },
    { id: 'l', label: 'Large' },
];
const MAX_LUGGAGE_PER_SIZE = 3;
const MAX_FLIGHT_NUMBER_LENGTH = 10;
const ROUND_TRIP_DISCOUNT_PERCENT = Math.round(ROUND_TRIP_DISCOUNT * 100);
const EVENING_SURCHARGE_LABEL = `Evening surcharge (${EVENING_START}–${EVENING_END})`;

// Every price shown - on the page and in the WhatsApp message - goes through
// here. Amounts are already rounded to whole cents (roundToCents() in
// booking-calculator.js); this only fixes how they print: whole euros stay
// "€20", anything with cents always gets two decimals ("€5.50", not "€5.5").
function formatPrice(amount) {
    const value = Number.isInteger(amount) ? String(amount) : amount.toFixed(2);
    return `${CURRENCY_SYMBOL}${value}`;
}

// Every route is Larnaca Airport <-> a location (see LOCATIONS in
// config.js) - the customer picks which end the airport is via the
// pick-up/destination swap button (see layoutRoute() below). Pricing is the
// same either way, so this only affects labels/wording, not the quote.
const DIRECTION_AIRPORT_PICKUP = 'from-airport';
const DIRECTION_AIRPORT_DESTINATION = 'to-airport';
const DEFAULT_DIRECTION = DIRECTION_AIRPORT_DESTINATION;

function optionHtml(value, label) {
    return `<option value="${value}">${label}</option>`;
}

function locationOptionsHtml() {
    return LOCATIONS.map((location) => optionHtml(location.id, location.description)).join('');
}

function luggageCountFieldHtml(size, prefix) {
    const id = `booking-${prefix}-luggage-${size.id}`;
    return `
    <div class="col-4">
        <label for="${id}" class="form-label small mb-1">${size.label}</label>
        <input type="number" id="${id}" class="form-control booking-luggage-count"
               data-trip="${prefix}" data-size-id="${size.id}" min="0" max="${MAX_LUGGAGE_PER_SIZE}" value="0">
    </div>
    `;
}

function luggageCountFieldsHtml(prefix) {
    return LUGGAGE_SIZES.map((size) => luggageCountFieldHtml(size, prefix)).join('');
}

// e.g. { s: 1, m: 2, l: 1 } -> "1 Small, 2 Medium, 1 Large"; sizes left at 0
// are omitted. Used for both the on-screen hint and the WhatsApp message.
function luggageSummary(luggageCounts) {
    return LUGGAGE_SIZES
        .filter((size) => luggageCounts[size.id] > 0)
        .map((size) => `${luggageCounts[size.id]} ${size.label}`)
        .join(', ');
}

function totalLuggageCount(luggageCounts) {
    return LUGGAGE_SIZES.reduce((sum, size) => sum + (luggageCounts[size.id] || 0), 0);
}

// What the folded "Luggage & add-ons" row shows on its right, so a choice
// made inside stays visible once it's closed again - e.g. "3 bags · Baby
// Seat". "Optional" until something is picked.
const EXTRAS_EMPTY_LABEL = 'Optional';

function extrasSummary(legState) {
    const parts = [];
    const bags = totalLuggageCount(legState.luggageCounts);
    if (bags > 0) {
        parts.push(`${bags} ${bags === 1 ? 'bag' : 'bags'}`);
    }
    ADD_ONS
        .filter((addOn) => legState.addOnIds.includes(addOn.id))
        .forEach((addOn) => parts.push(addOn.label));
    return parts.join(' · ');
}

function updateExtrasSummary(els, legState) {
    const summary = extrasSummary(legState);
    els.extrasValueEl.textContent = summary || EXTRAS_EMPTY_LABEL;
    els.extrasValueEl.classList.toggle('text-body-secondary', !summary);
}

// Reads one leg's fields (outbound or return - see legEls()) into the plain
// state shape calculateQuote()/the message builders expect.
function readLegState(els, locationId) {
    const luggageCounts = {};
    els.luggageCountEls.forEach((el) => {
        luggageCounts[el.dataset.sizeId] = Math.max(0, Number.parseInt(el.value, 10) || 0);
    });
    return {
        locationId,
        pickupDateTime: els.pickupTimeEl.value,
        adults: Math.max(0, Number.parseInt(els.adultsEl.value, 10) || 0),
        children: Math.max(0, Number.parseInt(els.childrenEl.value, 10) || 0),
        luggageCounts,
        addOnIds: Array.from(els.addOnEls).filter((el) => el.checked).map((el) => el.value),
    };
}

// The location dropdown always sits in the "Pick-up" or "Destination" slot
// opposite the airport (see layoutRoute()) - this only names its role for
// the "choose a ___" hint before a location is picked.
function locationRoleLabel(direction) {
    return direction === DIRECTION_AIRPORT_PICKUP ? 'destination' : 'pick-up location';
}

// "YYYY-MM-DDTHH:mm" in the visitor's local time, for the <input
// datetime-local>'s min attribute (and as a floor, not a default value -
// the field itself starts empty).
function nowLocalDateTimeString() {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
}

// The <input>'s own `min` (nowLocalDateTimeString() above) is only set
// once, when the form is built, so it goes stale as time passes - this
// re-checks live on every update(). "YYYY-MM-DDTHH:mm" values sort
// correctly as plain strings, so no Date parsing is needed here.
function isFutureDateTime(value) {
    return Boolean(value) && value >= nowLocalDateTimeString();
}

// null unless `pickupDateTime` is set and already in the past.
function pastDateTimeWarning(pickupDateTime, legLabel = 'Pick-up') {
    if (!pickupDateTime || isFutureDateTime(pickupDateTime)) {
        return null;
    }
    return `${legLabel} date & time must be in the future.`;
}

// null unless both legs' times are set and the return isn't after the
// outbound - only meaningful for a round trip.
function returnBeforeOutboundWarning(outboundDateTime, returnDateTime) {
    if (!outboundDateTime || !returnDateTime || returnDateTime > outboundDateTime) {
        return null;
    }
    return 'Return date & time must be after the outbound pick-up.';
}

function formatPickupDateTime(value) {
    if (!value) {
        return null;
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return null;
    }
    return date.toLocaleString('en-GB', {
        weekday: 'short', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
}

function addOnFieldHtml(addOn, prefix) {
    const id = `booking-${prefix}-addon-${addOn.id}`;
    return `
    <div class="form-check">
        <input class="form-check-input booking-addon" type="checkbox" id="${id}" data-trip="${prefix}" value="${addOn.id}">
        <label class="form-check-label" for="${id}">${addOn.label} (+${formatPrice(addOn.price)})</label>
    </div>
    `;
}

function addOnFieldsHtml(prefix) {
    return ADD_ONS.map((addOn) => addOnFieldHtml(addOn, prefix)).join('');
}

function addOnLineHtml(addOn) {
    return `<li>${addOn.label}: +${formatPrice(addOn.price)}</li>`;
}

function addOnsListHtml(addOns) {
    if (!addOns.length) {
        return '';
    }
    return `<ul class="mb-2 ps-3">${addOns.map(addOnLineHtml).join('')}</ul>`;
}

// Breakdown color coding: surcharges red, discounts green, the final total's
// amount in brand yellow; base fares, add-ons and subtotals stay neutral
// (add-ons are extras the visitor picked, not a penalty). The *-emphasis
// variants are theme-aware - the plain text-danger/text-success are too dark
// to read on the dark page (~3:1) - and the +/- signs, labels and icons carry
// the meaning too, so it never depends on color alone.
const SURCHARGE_CLASS = 'text-danger-emphasis';
const DISCOUNT_CLASS = 'text-success-emphasis';

function totalHtml(total) {
    return `<p class="fs-4 fw-bold mb-1">Total: <span class="text-warning">${formatPrice(total)}</span></p>`;
}

// One leg of the round-trip summary on a single line ("Outbound · Mercedes
// E-Class ... €55"), with any evening surcharge/add-ons folded into the
// leg's price and listed underneath in small print, so nothing priced is
// hidden but the breakdown stays short.
function roundTripLegHtml(label, quote) {
    const included = quote.addOns.map((addOn) => `${addOn.label} +${formatPrice(addOn.price)}`);
    if (quote.eveningSurcharge) {
        included.unshift(`<span class="${SURCHARGE_CLASS}"><i class="bi bi-moon-stars-fill me-1" aria-hidden="true"></i>Evening +${formatPrice(quote.eveningSurcharge)}</span>`);
    }
    const includedHtml = included.length
        ? `<p class="mb-1 small text-body-secondary">incl. ${included.join(' · ')}</p>`
        : '';
    return `
        <div class="d-flex justify-content-between gap-2 mb-1">
            <span><strong>${label}</strong> · ${quote.vehicle.vehicle}</span>
            <span>${formatPrice(quote.total)}</span>
        </div>
        ${includedHtml}
    `;
}

// Empty unless the leg's pick-up time is in the evening window (see
// isEveningPickup() in booking-calculator.js) - shown as its own line in
// the breakdown, right under the base fare it's added to.
function eveningSurchargeHtml(quote) {
    if (!quote.eveningSurcharge) {
        return '';
    }
    return `<p class="mb-1 ${SURCHARGE_CLASS}"><i class="bi bi-moon-stars-fill me-1" aria-hidden="true"></i>${EVENING_SURCHARGE_LABEL}: +${formatPrice(quote.eveningSurcharge)}</p>`;
}

// The fields of one leg of the trip - identical shape for the outbound leg
// and (when round trip is on) the return leg, just with ids/data-trip
// scoped by `prefix`.
function pickupTimeFieldHtml(prefix, label) {
    return `
        <div class="col-12 col-md-6">
            <label for="booking-${prefix}-pickup-time" class="form-label fw-semibold">${label}</label>
            <input type="datetime-local" id="booking-${prefix}-pickup-time" class="form-control" min="${nowLocalDateTimeString()}">
            <div id="booking-${prefix}-pickup-time-feedback" class="invalid-feedback"></div>
        </div>
    `;
}

function passengerFieldsHtml(prefix) {
    return `
        <div class="col-6 col-md-3">
            <label for="booking-${prefix}-adults" class="form-label fw-semibold">Adults</label>
            <input type="number" id="booking-${prefix}-adults" class="form-control" min="0" max="${MAX_PASSENGERS}" value="1">
        </div>
        <div class="col-6 col-md-3">
            <label for="booking-${prefix}-children" class="form-label fw-semibold">Children</label>
            <input type="number" id="booking-${prefix}-children" class="form-control" min="0" max="${MAX_PASSENGERS}" value="0">
        </div>
    `;
}

// Luggage and add-ons, folded into one optional row (a native <details>,
// so it needs no JS to open/close and is keyboard/screen-reader friendly
// as-is). Styles: src/styles/booking-calculator.css.
function extrasFieldHtml(prefix) {
    return `
        <div class="col-12">
            <details id="booking-${prefix}-extras" class="pav-extras">
                <summary class="form-control d-flex align-items-center gap-2 pav-extras-summary">
                    <span class="fw-semibold text-nowrap">Luggage &amp; add-ons</span>
                    <span id="booking-${prefix}-extras-value" class="ms-auto text-truncate text-body-secondary">${EXTRAS_EMPTY_LABEL}</span>
                    <i class="bi bi-chevron-down pav-extras-chevron" aria-hidden="true"></i>
                </summary>
                <div class="pav-extras-body">
                    <span class="form-label small fw-semibold d-block">Luggage</span>
                    <div class="row g-2 mb-3">
                        ${luggageCountFieldsHtml(prefix)}
                    </div>
                    <span class="form-label small fw-semibold d-block">Add-ons</span>
                    <div class="d-flex flex-wrap column-gap-3">
                        ${addOnFieldsHtml(prefix)}
                    </div>
                </div>
            </details>
        </div>
    `;
}

// Pick-up/destination + trip details for one leg, without the fare line
// (callers append "Fare:"/"Indicative total:" themselves - the two message
// builders below word that line differently).
function legDetailLines(pickup, destination, legState, quote) {
    const luggage = luggageSummary(legState.luggageCounts);
    const pickupDateTime = formatPickupDateTime(legState.pickupDateTime);
    const lines = [`- Pick-up: ${pickup}`, `- Destination: ${destination}`];
    if (pickupDateTime) {
        lines.push(`- Pick-up date & time: ${pickupDateTime}`);
    }
    if (legState.flightNumber) {
        lines.push(`- Flight number: ${legState.flightNumber}`);
    }
    // Luggage is optional (folded away by default), so 0 bags means "not
    // told", not "no bags" - worded so the driver doesn't assume the latter.
    lines.push(
        `- Passengers: ${legState.adults} adult(s), ${legState.children} child(ren)`,
        `- Luggage: ${luggage || 'Not specified'}`,
    );
    if (quote.addOns.length) {
        lines.push(`- Add-ons: ${quote.addOns.map((a) => a.label).join(', ')}`);
    }
    if (quote.eveningSurcharge) {
        lines.push(`- ${EVENING_SURCHARGE_LABEL}: +${formatPrice(quote.eveningSurcharge)}`);
    }
    if (quote.vehicle) {
        lines.push(`- Vehicle: ${quote.vehicle.vehicle} (up to ${quote.vehicle.capacity} passengers)`);
    }
    return lines;
}

function buildOneWayMessage(state, quote) {
    const location = LOCATIONS.find((l) => l.id === state.locationId);
    const locationLabel = location ? location.description : '—';
    const [pickup, destination] = state.direction === DIRECTION_AIRPORT_PICKUP
        ? [AIRPORT_LABEL, locationLabel]
        : [locationLabel, AIRPORT_LABEL];

    const lines = [
        `Hi! I'd like a taxi quote:`,
        ...legDetailLines(pickup, destination, state.outbound, quote),
    ];
    if (quote.total !== null) {
        lines.push(`- Indicative total: ${formatPrice(quote.total)}`);
    }
    lines.push('', 'Please confirm availability.');
    return lines.join('\n');
}

function buildRoundTripMessage(state, outboundQuote, returnQuote, combined) {
    const location = LOCATIONS.find((l) => l.id === state.locationId);
    const locationLabel = location ? location.description : '—';

    const lines = [
        `Hi! I'd like a round-trip taxi quote:`,
        '',
        `Trip 1 - Outbound:`,
        ...legDetailLines(AIRPORT_LABEL, locationLabel, state.outbound, outboundQuote),
        outboundQuote.total !== null ? `- Fare: ${formatPrice(outboundQuote.total)}` : null,
        '',
        `Trip 2 - Return:`,
        ...legDetailLines(locationLabel, AIRPORT_LABEL, state.returnTrip, returnQuote),
        returnQuote.total !== null ? `- Fare: ${formatPrice(returnQuote.total)}` : null,
        '',
    ].filter((line) => line !== null);

    if (combined.total !== null) {
        lines.push(
            `- Subtotal: ${formatPrice(combined.subtotal)}`,
            `- Round trip discount (${ROUND_TRIP_DISCOUNT_PERCENT}%): -${formatPrice(combined.discount)}`,
            `- Indicative total: ${formatPrice(combined.total)}`,
        );
    }
    lines.push('', 'Please confirm availability.');
    return lines.join('\n');
}

export function createBookingCalculator() {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = `
    <div id="booking-calculator" class="container-fluid py-5 scroll-animate">
        <div class="container">
            <div class="row justify-content-center">
                <div class="col-lg-8">
                    <div class="card shadow-lg bg-body-tertiary p-1 p-sm-2 p-md-3 pav-feature-card">
                        <div class="card-body">
                            <h2 class="fw-bold text-center mb-2">Get an <span class="text-warning">Instant Quote</span></h2>
                            <p class="text-body-secondary text-center mb-4">The right vehicle and price, in seconds.</p>
                            <form id="booking-form" class="row g-3" novalidate>
                                <div class="col-12">
                                    <div class="d-flex flex-column flex-md-row gap-4 gap-md-2 align-items-md-center position-relative">
                                        <div id="booking-pickup-slot" class="form-floating w-100 flex-md-fill">
                                            <select id="booking-location" class="form-select">
                                                <option value="" selected>Choose a location</option>
                                                ${locationOptionsHtml()}
                                            </select>
                                            <label id="booking-pickup-label" for="booking-location">Pick-up</label>
                                        </div>
                                        <div class="d-flex justify-content-center pav-swap-col">
                                            <button type="button" id="booking-swap-direction" class="btn btn-dark border shadow-sm" aria-label="Swap pick-up and destination">
                                                <i class="bi bi-arrow-left-right d-none d-md-inline" aria-hidden="true"></i>
                                                <i class="bi bi-arrow-down-up d-inline d-md-none" aria-hidden="true"></i>
                                            </button>
                                        </div>
                                        <div id="booking-destination-slot" class="form-floating w-100 flex-md-fill">
                                            <select id="booking-airport" class="form-select" disabled>
                                                <option>${AIRPORT_LABEL}</option>
                                            </select>
                                            <label id="booking-destination-label" for="booking-airport">Destination</label>
                                        </div>
                                    </div>
                                    <div id="booking-swap-announcement" class="visually-hidden" aria-live="polite"></div>
                                </div>
                                <div class="col-12" id="booking-round-trip-field" hidden>
                                    <div class="form-check">
                                        <input class="form-check-input" type="checkbox" id="booking-round-trip">
                                        <label class="form-check-label fw-semibold" for="booking-round-trip">
                                            Book a round trip <span class="badge text-bg-success">-${ROUND_TRIP_DISCOUNT_PERCENT}%</span>
                                        </label>
                                    </div>
                                    <div class="form-text">Add a return journey back to ${AIRPORT_LABEL} and save ${ROUND_TRIP_DISCOUNT_PERCENT}% on the combined fare.</div>
                                </div>
                                <div id="booking-outbound-heading" class="col-12 fw-semibold text-body-secondary text-uppercase small mt-2" hidden>Trip 1 — Outbound</div>
                                <div class="col-12 col-md-6" id="booking-flight-number-field" hidden>
                                    <label for="booking-flight-number" class="form-label fw-semibold">Flight number</label>
                                    <input type="text" id="booking-flight-number" class="form-control text-uppercase"
                                           placeholder="e.g. A3 902" maxlength="${MAX_FLIGHT_NUMBER_LENGTH}" autocomplete="off" autocapitalize="characters" required>
                                    <div class="form-text">Required for airport pick-ups, so we can track your arrival.</div>
                                </div>
                                ${pickupTimeFieldHtml('outbound', 'Pick-up date &amp; time')}
                                ${passengerFieldsHtml('outbound')}
                                ${extrasFieldHtml('outbound')}

                                <div id="booking-return-section" class="col-12" hidden>
                                    <hr class="my-1">
                                    <div class="fw-semibold text-body-secondary text-uppercase small mb-1">Trip 2 — Return</div>
                                    <div class="row g-3">
                                        ${pickupTimeFieldHtml('return', 'Return date &amp; time')}
                                        <div class="col-12 col-md-6 d-flex align-items-md-end">
                                            <div class="form-check mb-md-2">
                                                <input class="form-check-input" type="checkbox" id="booking-return-same" checked>
                                                <label class="form-check-label" for="booking-return-same">Same people, luggage &amp; <span class="text-nowrap">add-ons</span></label>
                                            </div>
                                        </div>
                                        <div id="booking-return-details" class="col-12" hidden>
                                            <div class="row g-3">
                                                ${passengerFieldsHtml('return')}
                                                ${extrasFieldHtml('return')}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </form>

                            <div id="booking-result" class="mt-3 p-3 rounded bg-body border" aria-live="polite"></div>

                            <div class="text-center mt-3">
                                <a id="booking-cta" href="${WHATSAPP_URL}" target="_blank" rel="noopener"
                                   class="btn btn-warning btn-lg px-5 fw-bold disabled" aria-disabled="true" tabindex="-1">
                                    Book Now
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `;

    const section = wrapper.firstElementChild;
    const roundTripFieldEl = section.querySelector('#booking-round-trip-field');
    const roundTripEl = section.querySelector('#booking-round-trip');
    const pickupSlotEl = section.querySelector('#booking-pickup-slot');
    const destinationSlotEl = section.querySelector('#booking-destination-slot');
    const pickupLabelEl = section.querySelector('#booking-pickup-label');
    const destinationLabelEl = section.querySelector('#booking-destination-label');
    const swapDirectionEl = section.querySelector('#booking-swap-direction');
    const swapAnnouncementEl = section.querySelector('#booking-swap-announcement');
    const airportEl = section.querySelector('#booking-airport');
    const locationEl = section.querySelector('#booking-location');
    const outboundHeadingEl = section.querySelector('#booking-outbound-heading');
    const flightNumberFieldEl = section.querySelector('#booking-flight-number-field');
    const flightNumberEl = section.querySelector('#booking-flight-number');
    const returnSectionEl = section.querySelector('#booking-return-section');
    const returnSameEl = section.querySelector('#booking-return-same');
    const returnDetailsEl = section.querySelector('#booking-return-details');
    const resultEl = section.querySelector('#booking-result');
    const ctaEl = section.querySelector('#booking-cta');

    let direction = DEFAULT_DIRECTION;

    // Relocates the fixed airport select and the real location select
    // between the pick-up/destination slots to match `direction`, and keeps
    // each slot's label pointing at whichever select currently sits there.
    // The slots' own labels ("Pick-up"/"Destination") never change - only
    // which select fills them does.
    function layoutRoute() {
        const airportIsPickup = direction === DIRECTION_AIRPORT_PICKUP;
        const pickupSelectEl = airportIsPickup ? airportEl : locationEl;
        const destinationSelectEl = airportIsPickup ? locationEl : airportEl;
        // .append() (not .appendChild()) so the select always ends up
        // before its label, in one call - .form-floating's CSS targets
        // "select ~ label", so that order must hold after every swap.
        pickupSlotEl.append(pickupSelectEl, pickupLabelEl);
        destinationSlotEl.append(destinationSelectEl, destinationLabelEl);
        pickupLabelEl.setAttribute('for', pickupSelectEl.id);
        destinationLabelEl.setAttribute('for', destinationSelectEl.id);
    }

    function legEls(prefix) {
        return {
            pickupTimeEl: section.querySelector(`#booking-${prefix}-pickup-time`),
            pickupTimeFeedbackEl: section.querySelector(`#booking-${prefix}-pickup-time-feedback`),
            adultsEl: section.querySelector(`#booking-${prefix}-adults`),
            childrenEl: section.querySelector(`#booking-${prefix}-children`),
            luggageCountEls: section.querySelectorAll(`.booking-luggage-count[data-trip="${prefix}"]`),
            addOnEls: section.querySelectorAll(`.booking-addon[data-trip="${prefix}"]`),
            extrasEl: section.querySelector(`#booking-${prefix}-extras`),
            extrasValueEl: section.querySelector(`#booking-${prefix}-extras-value`),
            // Last children count seen, so the extras row opens only as
            // children go from 0 to 1+ - not again after the visitor closes it.
            previousChildren: 0,
        };
    }
    const outboundEls = legEls('outbound');
    const returnEls = legEls('return');

    function readState() {
        const locationId = locationEl.value;
        // Only the outbound leg can start at the airport (the return leg of
        // a round trip always ends there), so the flight number lives on
        // that leg - and is dropped when the airport isn't the pick-up, so
        // a value typed before a swap can't leak into the message.
        const flightNumber = direction === DIRECTION_AIRPORT_PICKUP
            ? flightNumberEl.value.trim().toUpperCase()
            : '';
        const outbound = readLegState(outboundEls, locationId);
        // While "Same people, luggage & add-ons" is ticked, the return
        // leg is the outbound leg at the return's own date/time.
        const returnTrip = returnSameEl.checked
            ? { ...outbound, pickupDateTime: returnEls.pickupTimeEl.value }
            : readLegState(returnEls, locationId);
        return {
            direction,
            locationId,
            outbound: { ...outbound, flightNumber },
            returnTrip,
        };
    }

    // Children usually need a baby/booster seat, and those live in the
    // folded extras row - so open it the moment children are added.
    function openExtrasForChildren(els) {
        const children = Math.max(0, Number.parseInt(els.childrenEl.value, 10) || 0);
        if (children > 0 && els.previousChildren === 0) {
            els.extrasEl.open = true;
        }
        els.previousChildren = children;
    }

    // Unticking "Same people, luggage & add-ons" starts the return
    // leg's own fields from the outbound values, so only differences need
    // editing.
    function copyOutboundToReturn() {
        returnEls.adultsEl.value = outboundEls.adultsEl.value;
        returnEls.childrenEl.value = outboundEls.childrenEl.value;
        returnEls.previousChildren = outboundEls.previousChildren;
        returnEls.luggageCountEls.forEach((el) => {
            const outboundEl = Array.from(outboundEls.luggageCountEls).find((o) => o.dataset.sizeId === el.dataset.sizeId);
            el.value = outboundEl.value;
        });
        returnEls.addOnEls.forEach((el) => {
            const outboundEl = Array.from(outboundEls.addOnEls).find((o) => o.value === el.value);
            el.checked = outboundEl.checked;
        });
        returnEls.extrasEl.open = outboundEls.extrasEl.open;
    }

    function renderResult(state, quote, dateTimeWarning) {
        if (quote.totalPassengers === 0) {
            resultEl.innerHTML = `<p class="mb-0 text-body-secondary">Add at least one passenger to see your vehicle and indicative price.</p>`;
            return;
        }

        if (quote.overCapacity) {
            resultEl.innerHTML = `<p class="mb-0">Groups of ${quote.totalPassengers} need more than one vehicle — message us on WhatsApp for a custom quote.</p>`;
            return;
        }

        if (!state.locationId || quote.basePrice === null) {
            resultEl.innerHTML = `
                <p class="mb-0"><strong>${quote.vehicle.vehicle}</strong> (up to ${quote.vehicle.capacity} passengers) fits your group.</p>
                <p class="mb-0 text-body-secondary">Choose a ${locationRoleLabel(state.direction)} to see the indicative price.</p>
            `;
            return;
        }

        const addOnsList = addOnsListHtml(quote.addOns);
        const warningHtml = dateTimeWarning ? `<p class="mb-1 text-danger-emphasis">${dateTimeWarning}</p>` : '';

        resultEl.innerHTML = `
            <p class="mb-1"><strong>${quote.vehicle.vehicle}</strong> (up to ${quote.vehicle.capacity} passengers)</p>
            <p class="mb-1">Base fare: ${formatPrice(quote.basePrice)}</p>
            ${eveningSurchargeHtml(quote)}
            ${addOnsList}
            ${totalHtml(quote.total)}
            ${warningHtml}
            <p class="mb-0 text-body-secondary small">Indicative price — confirmed by our team via WhatsApp.</p>
        `;
    }

    function renderRoundTripResult(state, outboundQuote, returnQuote, combined, dateTimeWarning) {
        if (outboundQuote.totalPassengers === 0 || returnQuote.totalPassengers === 0) {
            resultEl.innerHTML = `<p class="mb-0 text-body-secondary">Add at least one passenger to both trips to see your vehicles and indicative price.</p>`;
            return;
        }

        if (outboundQuote.overCapacity || returnQuote.overCapacity) {
            const legLabel = outboundQuote.overCapacity ? 'Trip 1 (outbound)' : 'Trip 2 (return)';
            const count = outboundQuote.overCapacity ? outboundQuote.totalPassengers : returnQuote.totalPassengers;
            resultEl.innerHTML = `<p class="mb-0">${legLabel}: groups of ${count} need more than one vehicle — message us on WhatsApp for a custom quote.</p>`;
            return;
        }

        if (!state.locationId || outboundQuote.basePrice === null || returnQuote.basePrice === null) {
            resultEl.innerHTML = `
                <p class="mb-1"><strong>Trip 1:</strong> ${outboundQuote.vehicle.vehicle} (up to ${outboundQuote.vehicle.capacity} passengers)</p>
                <p class="mb-1"><strong>Trip 2:</strong> ${returnQuote.vehicle.vehicle} (up to ${returnQuote.vehicle.capacity} passengers)</p>
                <p class="mb-0 text-body-secondary">Choose a location to see the indicative price.</p>
            `;
            return;
        }

        const warningHtml = dateTimeWarning ? `<p class="mb-1 text-danger-emphasis">${dateTimeWarning}</p>` : '';

        resultEl.innerHTML = `
            ${roundTripLegHtml('Outbound', outboundQuote)}
            ${roundTripLegHtml('Return', returnQuote)}
            <div class="d-flex justify-content-between gap-2 mb-1 ${DISCOUNT_CLASS}">
                <span><i class="bi bi-tag-fill me-1" aria-hidden="true"></i>Round trip discount (${ROUND_TRIP_DISCOUNT_PERCENT}%)</span>
                <span>-${formatPrice(combined.discount)}</span>
            </div>
            ${totalHtml(combined.total)}
            ${warningHtml}
            <p class="mb-0 text-body-secondary small">Indicative price — confirmed by our team via WhatsApp.</p>
        `;
    }

    function update() {
        const state = readState();

        const roundTripAvailable = state.direction === DIRECTION_AIRPORT_PICKUP;
        // Same condition as the round trip option: an airport pick-up means
        // an arriving flight, which we need the number of to book.
        flightNumberFieldEl.hidden = !roundTripAvailable;
        const flightNumberValid = !roundTripAvailable || Boolean(state.outbound.flightNumber);
        roundTripFieldEl.hidden = !roundTripAvailable;
        if (!roundTripAvailable) {
            roundTripEl.checked = false;
        }
        const roundTrip = roundTripAvailable && roundTripEl.checked;
        outboundHeadingEl.hidden = !roundTrip;
        returnSectionEl.hidden = !roundTrip;
        returnDetailsEl.hidden = returnSameEl.checked;

        updateExtrasSummary(outboundEls, state.outbound);
        updateExtrasSummary(returnEls, state.returnTrip);

        const outboundQuote = calculateQuote(state.outbound);
        let canBook;
        let message;

        if (roundTrip) {
            const returnQuote = calculateQuote(state.returnTrip);
            const combined = combineRoundTripQuote(outboundQuote, returnQuote);
            const outboundTimeValid = isFutureDateTime(state.outbound.pickupDateTime);
            const returnTimeValid = isFutureDateTime(state.returnTrip.pickupDateTime);
            const returnBeforeOutboundMsg = returnBeforeOutboundWarning(state.outbound.pickupDateTime, state.returnTrip.pickupDateTime);
            // Flagged on the return field itself too (not just in the
            // result box below, which only shows once a price is ready),
            // and the picker's floor follows the outbound pick-up so
            // earlier dates can't be chosen there in the first place.
            returnEls.pickupTimeEl.min = isFutureDateTime(state.outbound.pickupDateTime)
                ? state.outbound.pickupDateTime
                : nowLocalDateTimeString();
            returnEls.pickupTimeEl.classList.toggle('is-invalid', Boolean(returnBeforeOutboundMsg));
            returnEls.pickupTimeFeedbackEl.textContent = returnBeforeOutboundMsg || '';
            const dateTimeWarning = pastDateTimeWarning(state.outbound.pickupDateTime, 'Outbound pick-up')
                || pastDateTimeWarning(state.returnTrip.pickupDateTime, 'Return')
                || returnBeforeOutboundMsg;
            renderRoundTripResult(state, outboundQuote, returnQuote, combined, dateTimeWarning);
            canBook = Boolean(state.locationId)
                && flightNumberValid
                && outboundTimeValid
                && returnTimeValid
                && !returnBeforeOutboundMsg
                && combined.total !== null
                && !outboundQuote.overCapacity
                && !returnQuote.overCapacity;
            message = canBook ? buildRoundTripMessage(state, outboundQuote, returnQuote, combined) : null;
        } else {
            const outboundTimeValid = isFutureDateTime(state.outbound.pickupDateTime);
            const dateTimeWarning = pastDateTimeWarning(state.outbound.pickupDateTime);
            renderResult(state, outboundQuote, dateTimeWarning);
            canBook = Boolean(state.locationId) && flightNumberValid && outboundTimeValid
                && outboundQuote.total !== null && !outboundQuote.overCapacity;
            message = canBook ? buildOneWayMessage(state, outboundQuote) : null;
        }

        ctaEl.classList.toggle('disabled', !canBook);
        ctaEl.setAttribute('aria-disabled', String(!canBook));
        ctaEl.tabIndex = canBook ? 0 : -1;
        ctaEl.href = canBook ? `${WHATSAPP_URL}?text=${encodeURIComponent(message)}` : WHATSAPP_URL;
    }

    const inputEls = [
        locationEl, flightNumberEl,
        outboundEls.pickupTimeEl, outboundEls.adultsEl, outboundEls.childrenEl, ...outboundEls.luggageCountEls,
        returnEls.pickupTimeEl, returnEls.adultsEl, returnEls.childrenEl, ...returnEls.luggageCountEls,
    ];
    inputEls.forEach((el) => el.addEventListener('input', update));

    const changeEls = [roundTripEl, ...outboundEls.addOnEls, ...returnEls.addOnEls];
    changeEls.forEach((el) => el.addEventListener('change', update));

    [outboundEls, returnEls].forEach((els) => {
        els.childrenEl.addEventListener('input', () => openExtrasForChildren(els));
    });

    returnSameEl.addEventListener('change', () => {
        if (!returnSameEl.checked) {
            copyOutboundToReturn();
        }
        update();
    });

    swapDirectionEl.addEventListener('click', () => {
        direction = direction === DIRECTION_AIRPORT_PICKUP ? DIRECTION_AIRPORT_DESTINATION : DIRECTION_AIRPORT_PICKUP;
        layoutRoute();
        update();
        // The swap button has no native checked/pressed state to announce
        // on its own (unlike the radio buttons it replaced), so a visually-
        // hidden live region confirms the new arrangement for screen-reader
        // users - sighted users already see it from the swapped fields.
        const airportRole = direction === DIRECTION_AIRPORT_PICKUP ? 'pick-up' : 'destination';
        swapAnnouncementEl.textContent = `${AIRPORT_LABEL} is now the ${airportRole}.`;
    });

    layoutRoute();
    update();

    return section;
}
