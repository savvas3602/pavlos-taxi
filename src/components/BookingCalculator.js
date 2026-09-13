// BookingCalculator.js - Plain JS component for Vite.
// Renders the "Get an Instant Quote" form: trip direction, location, and
// per-trip details (date/time, adults, children, luggage, add-ons) drive an
// auto-selected vehicle + indicative price (src/utils/booking-calculator.js).
// When the pick-up is the airport, the customer can also add a return leg
// (its own date/time, passengers, luggage, add-ons) for a round trip at a
// 10% discount on the combined fare. Either way, the visitor sends the
// result to us as a prefilled WhatsApp message - same backend-free,
// WhatsApp-to-human booking model the rest of the site already uses.
import { LOCATIONS, ADD_ONS, CURRENCY_SYMBOL, WHATSAPP_URL, AIRPORT_LABEL, ROUND_TRIP_DISCOUNT } from '../config.js';
import { calculateQuote, combineRoundTripQuote, MAX_PASSENGERS } from '../utils/booking-calculator.js';

const LUGGAGE_SIZES = [
    { id: 's', label: 'Small' },
    { id: 'm', label: 'Medium' },
    { id: 'l', label: 'Large' },
];
const MAX_LUGGAGE_PER_SIZE = 3;
const ROUND_TRIP_DISCOUNT_PERCENT = Math.round(ROUND_TRIP_DISCOUNT * 100);

// Every route is Larnaca Airport <-> a location (see LOCATIONS in
// config.js) - the customer picks which end the airport is. Pricing is the
// same either way, so this only affects labels/wording, not the quote.
const TRIP_DIRECTIONS = [
    { id: 'from-airport', label: `Pick-up at ${AIRPORT_LABEL}` },
    { id: 'to-airport', label: `Drop-off at ${AIRPORT_LABEL}` },
];
const DEFAULT_DIRECTION = 'to-airport';

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

function directionFieldHtml(direction) {
    const checked = direction.id === DEFAULT_DIRECTION ? 'checked' : '';
    return `
    <div class="form-check form-check-inline">
        <input class="form-check-input booking-direction" type="radio" name="booking-direction" id="booking-direction-${direction.id}" value="${direction.id}" ${checked}>
        <label class="form-check-label" for="booking-direction-${direction.id}">${direction.label}</label>
    </div>
    `;
}

function directionFieldsHtml() {
    return TRIP_DIRECTIONS.map(directionFieldHtml).join('');
}

// The location dropdown plays the pick-up role when the airport is the
// destination, and vice versa - relabel it so the form reads correctly.
function locationLabelText(direction) {
    return direction === 'from-airport' ? 'Destination' : 'Pick-up location';
}

// "YYYY-MM-DDTHH:mm" in the visitor's local time, for the <input
// datetime-local>'s min attribute (and as a floor, not a default value -
// the field itself starts empty).
function nowLocalDateTimeString() {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
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
        <label class="form-check-label" for="${id}">${addOn.label} (+${CURRENCY_SYMBOL}${addOn.price})</label>
    </div>
    `;
}

function addOnFieldsHtml(prefix) {
    return ADD_ONS.map((addOn) => addOnFieldHtml(addOn, prefix)).join('');
}

function addOnLineHtml(addOn) {
    return `<li>${addOn.label}: +${CURRENCY_SYMBOL}${addOn.price}</li>`;
}

function addOnsListHtml(addOns) {
    if (!addOns.length) {
        return '';
    }
    return `<ul class="mb-2 ps-3">${addOns.map(addOnLineHtml).join('')}</ul>`;
}

// Pick-up date/time, adults, children, luggage and add-ons for one leg of
// the trip - identical shape for the outbound leg and (when round trip is
// on) the return leg, just with ids/data-trip scoped by `prefix`.
function tripFieldsHtml(prefix) {
    return `
        <div class="col-12 col-md-6">
            <label for="booking-${prefix}-pickup-time" class="form-label fw-semibold">Pick-up date &amp; time</label>
            <input type="datetime-local" id="booking-${prefix}-pickup-time" class="form-control" min="${nowLocalDateTimeString()}">
        </div>
        <div class="col-6 col-md-3">
            <label for="booking-${prefix}-adults" class="form-label fw-semibold">Adults</label>
            <input type="number" id="booking-${prefix}-adults" class="form-control" min="0" max="${MAX_PASSENGERS}" value="1">
        </div>
        <div class="col-6 col-md-3">
            <label for="booking-${prefix}-children" class="form-label fw-semibold">Children</label>
            <input type="number" id="booking-${prefix}-children" class="form-control" min="0" max="${MAX_PASSENGERS}" value="0">
        </div>
        <div class="col-12">
            <span class="form-label fw-semibold d-block">Luggage</span>
            <div class="row g-2">
                ${luggageCountFieldsHtml(prefix)}
            </div>
            <div id="booking-${prefix}-luggage-total" class="form-text"></div>
        </div>
        <div class="col-12">
            <span class="form-label fw-semibold d-block">Add-ons</span>
            <div class="d-flex flex-wrap gap-3">
                ${addOnFieldsHtml(prefix)}
            </div>
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
    lines.push(
        `- Passengers: ${legState.adults} adult(s), ${legState.children} child(ren)`,
        `- Luggage: ${luggage || 'None'}`,
    );
    if (quote.addOns.length) {
        lines.push(`- Add-ons: ${quote.addOns.map((a) => a.label).join(', ')}`);
    }
    if (quote.vehicle) {
        lines.push(`- Vehicle: ${quote.vehicle.vehicle} (up to ${quote.vehicle.capacity} passengers)`);
    }
    return lines;
}

function buildOneWayMessage(state, quote) {
    const location = LOCATIONS.find((l) => l.id === state.locationId);
    const locationLabel = location ? location.description : '—';
    const [pickup, destination] = state.direction === 'from-airport'
        ? [AIRPORT_LABEL, locationLabel]
        : [locationLabel, AIRPORT_LABEL];

    const lines = [
        `Hi! I'd like a taxi quote:`,
        ...legDetailLines(pickup, destination, state.outbound, quote),
    ];
    if (quote.total !== null) {
        lines.push(`- Indicative total: ${CURRENCY_SYMBOL}${quote.total}`);
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
        outboundQuote.total !== null ? `- Fare: ${CURRENCY_SYMBOL}${outboundQuote.total}` : null,
        '',
        `Trip 2 - Return:`,
        ...legDetailLines(locationLabel, AIRPORT_LABEL, state.returnTrip, returnQuote),
        returnQuote.total !== null ? `- Fare: ${CURRENCY_SYMBOL}${returnQuote.total}` : null,
        '',
    ].filter((line) => line !== null);

    if (combined.total !== null) {
        lines.push(
            `- Subtotal: ${CURRENCY_SYMBOL}${combined.subtotal}`,
            `- Round trip discount (${ROUND_TRIP_DISCOUNT_PERCENT}%): -${CURRENCY_SYMBOL}${combined.discount}`,
            `- Indicative total: ${CURRENCY_SYMBOL}${combined.total}`,
        );
    }
    lines.push('', 'Please confirm availability.');
    return lines.join('\n');
}

export function createBookingCalculator() {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = `
    <div class="container-fluid py-5 scroll-animate">
        <div class="container">
            <div class="row justify-content-center">
                <div class="col-lg-8">
                    <div class="card shadow-lg p-4 p-md-5 pav-feature-card">
                        <div class="card-body">
                            <h2 class="fw-bold text-center mb-3">Get an Instant Quote</h2>
                            <p class="fs-5 text-center mb-4">Tell us your trip details and we'll pick the right vehicle and an indicative price.</p>
                            <form id="booking-form" class="row g-3" novalidate>
                                <div class="col-12">
                                    <span class="form-label fw-semibold d-block">Trip type</span>
                                    <div class="d-flex flex-wrap gap-3">
                                        ${directionFieldsHtml()}
                                    </div>
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
                                <div class="col-12 col-md-6">
                                    <label for="booking-location" id="booking-location-label" class="form-label fw-semibold">${locationLabelText(DEFAULT_DIRECTION)}</label>
                                    <select id="booking-location" class="form-select">
                                        <option value="" selected>Choose a location</option>
                                        ${locationOptionsHtml()}
                                    </select>
                                </div>

                                <div id="booking-outbound-heading" class="col-12 fw-semibold text-secondary text-uppercase small mt-2" hidden>Trip 1 — Outbound</div>
                                ${tripFieldsHtml('outbound')}

                                <div id="booking-return-section" class="col-12" hidden>
                                    <hr class="my-1">
                                    <div class="fw-semibold text-secondary text-uppercase small mb-1">Trip 2 — Return</div>
                                    <div class="row g-3">
                                        ${tripFieldsHtml('return')}
                                    </div>
                                </div>
                            </form>

                            <div id="booking-result" class="mt-4 p-3 rounded bg-light border" aria-live="polite"></div>

                            <div class="text-center mt-4">
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
    const directionEls = section.querySelectorAll('.booking-direction');
    const roundTripFieldEl = section.querySelector('#booking-round-trip-field');
    const roundTripEl = section.querySelector('#booking-round-trip');
    const locationLabelEl = section.querySelector('#booking-location-label');
    const locationEl = section.querySelector('#booking-location');
    const outboundHeadingEl = section.querySelector('#booking-outbound-heading');
    const returnSectionEl = section.querySelector('#booking-return-section');
    const resultEl = section.querySelector('#booking-result');
    const ctaEl = section.querySelector('#booking-cta');

    function legEls(prefix) {
        return {
            pickupTimeEl: section.querySelector(`#booking-${prefix}-pickup-time`),
            adultsEl: section.querySelector(`#booking-${prefix}-adults`),
            childrenEl: section.querySelector(`#booking-${prefix}-children`),
            luggageCountEls: section.querySelectorAll(`.booking-luggage-count[data-trip="${prefix}"]`),
            luggageTotalEl: section.querySelector(`#booking-${prefix}-luggage-total`),
            addOnEls: section.querySelectorAll(`.booking-addon[data-trip="${prefix}"]`),
        };
    }
    const outboundEls = legEls('outbound');
    const returnEls = legEls('return');

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

    function updateLuggageHint(els, luggageCounts) {
        const total = totalLuggageCount(luggageCounts);
        els.luggageTotalEl.textContent = total > 0
            ? `Total: ${total} piece${total === 1 ? '' : 's'} (${luggageSummary(luggageCounts)})`
            : '';
    }

    function readState() {
        const checkedDirection = Array.from(directionEls).find((el) => el.checked);
        const direction = checkedDirection ? checkedDirection.value : DEFAULT_DIRECTION;
        const locationId = locationEl.value;
        return {
            direction,
            locationId,
            outbound: readLegState(outboundEls, locationId),
            returnTrip: readLegState(returnEls, locationId),
        };
    }

    function renderResult(state, quote) {
        if (quote.totalPassengers === 0) {
            resultEl.innerHTML = `<p class="mb-0 text-secondary">Add at least one passenger to see your vehicle and indicative price.</p>`;
            return;
        }

        if (quote.overCapacity) {
            resultEl.innerHTML = `<p class="mb-0">Groups of ${quote.totalPassengers} need more than one vehicle — message us on WhatsApp for a custom quote.</p>`;
            return;
        }

        if (!state.locationId || quote.basePrice === null) {
            resultEl.innerHTML = `
                <p class="mb-0"><strong>${quote.vehicle.vehicle}</strong> (up to ${quote.vehicle.capacity} passengers) fits your group.</p>
                <p class="mb-0 text-secondary">Choose a ${locationLabelText(state.direction).toLowerCase()} to see the indicative price.</p>
            `;
            return;
        }

        const addOnsList = addOnsListHtml(quote.addOns);

        resultEl.innerHTML = `
            <p class="mb-1"><strong>${quote.vehicle.vehicle}</strong> (up to ${quote.vehicle.capacity} passengers)</p>
            <p class="mb-1">Base fare: ${CURRENCY_SYMBOL}${quote.basePrice}</p>
            ${addOnsList}
            <p class="fs-4 fw-bold mb-1">Total: ${CURRENCY_SYMBOL}${quote.total}</p>
            <p class="mb-0 text-secondary small">Indicative price — confirmed by our team via WhatsApp.</p>
        `;
    }

    function renderRoundTripResult(state, outboundQuote, returnQuote, combined) {
        if (outboundQuote.totalPassengers === 0 || returnQuote.totalPassengers === 0) {
            resultEl.innerHTML = `<p class="mb-0 text-secondary">Add at least one passenger to both trips to see your vehicles and indicative price.</p>`;
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
                <p class="mb-0 text-secondary">Choose a location to see the indicative price.</p>
            `;
            return;
        }

        resultEl.innerHTML = `
            <p class="mb-1"><strong>Trip 1 — Outbound</strong> (${outboundQuote.vehicle.vehicle})</p>
            <p class="mb-1">Base fare: ${CURRENCY_SYMBOL}${outboundQuote.basePrice}</p>
            ${addOnsListHtml(outboundQuote.addOns)}
            <p class="mb-2 fw-semibold">Trip 1 total: ${CURRENCY_SYMBOL}${outboundQuote.total}</p>
            <p class="mb-1"><strong>Trip 2 — Return</strong> (${returnQuote.vehicle.vehicle})</p>
            <p class="mb-1">Base fare: ${CURRENCY_SYMBOL}${returnQuote.basePrice}</p>
            ${addOnsListHtml(returnQuote.addOns)}
            <p class="mb-2 fw-semibold">Trip 2 total: ${CURRENCY_SYMBOL}${returnQuote.total}</p>
            <hr class="my-2">
            <p class="mb-1">Subtotal: ${CURRENCY_SYMBOL}${combined.subtotal}</p>
            <p class="mb-1">Round trip discount (${ROUND_TRIP_DISCOUNT_PERCENT}%): -${CURRENCY_SYMBOL}${combined.discount}</p>
            <p class="fs-4 fw-bold mb-1">Total: ${CURRENCY_SYMBOL}${combined.total}</p>
            <p class="mb-0 text-secondary small">Indicative price — confirmed by our team via WhatsApp.</p>
        `;
    }

    function update() {
        const state = readState();
        locationLabelEl.textContent = locationLabelText(state.direction);

        const roundTripAvailable = state.direction === 'from-airport';
        roundTripFieldEl.hidden = !roundTripAvailable;
        if (!roundTripAvailable) {
            roundTripEl.checked = false;
        }
        const roundTrip = roundTripAvailable && roundTripEl.checked;
        outboundHeadingEl.hidden = !roundTrip;
        returnSectionEl.hidden = !roundTrip;

        updateLuggageHint(outboundEls, state.outbound.luggageCounts);
        updateLuggageHint(returnEls, state.returnTrip.luggageCounts);

        const outboundQuote = calculateQuote(state.outbound);
        let canBook;
        let message;

        if (roundTrip) {
            const returnQuote = calculateQuote(state.returnTrip);
            const combined = combineRoundTripQuote(outboundQuote, returnQuote);
            renderRoundTripResult(state, outboundQuote, returnQuote, combined);
            canBook = Boolean(state.locationId)
                && Boolean(state.outbound.pickupDateTime)
                && Boolean(state.returnTrip.pickupDateTime)
                && combined.total !== null
                && !outboundQuote.overCapacity
                && !returnQuote.overCapacity;
            message = canBook ? buildRoundTripMessage(state, outboundQuote, returnQuote, combined) : null;
        } else {
            renderResult(state, outboundQuote);
            canBook = Boolean(state.locationId) && Boolean(state.outbound.pickupDateTime)
                && outboundQuote.total !== null && !outboundQuote.overCapacity;
            message = canBook ? buildOneWayMessage(state, outboundQuote) : null;
        }

        ctaEl.classList.toggle('disabled', !canBook);
        ctaEl.setAttribute('aria-disabled', String(!canBook));
        ctaEl.tabIndex = canBook ? 0 : -1;
        ctaEl.href = canBook ? `${WHATSAPP_URL}?text=${encodeURIComponent(message)}` : WHATSAPP_URL;
    }

    const inputEls = [
        locationEl,
        outboundEls.pickupTimeEl, outboundEls.adultsEl, outboundEls.childrenEl, ...outboundEls.luggageCountEls,
        returnEls.pickupTimeEl, returnEls.adultsEl, returnEls.childrenEl, ...returnEls.luggageCountEls,
    ];
    inputEls.forEach((el) => el.addEventListener('input', update));

    const changeEls = [...directionEls, roundTripEl, ...outboundEls.addOnEls, ...returnEls.addOnEls];
    changeEls.forEach((el) => el.addEventListener('change', update));

    update();

    return section;
}
