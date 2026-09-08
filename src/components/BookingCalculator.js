// BookingCalculator.js - Plain JS component for Vite.
// Renders the "Get an Instant Quote" form: trip direction, location, adults,
// children, luggage size and add-ons drive an auto-selected vehicle +
// indicative price (src/utils/booking-calculator.js), which the visitor
// then sends to us as a prefilled WhatsApp message - same backend-free,
// WhatsApp-to-human booking model the rest of the site already uses.
import { LOCATIONS, ADD_ONS, CURRENCY_SYMBOL, WHATSAPP_URL, AIRPORT_LABEL } from '../config.js';
import { calculateQuote, MAX_PASSENGERS } from '../utils/booking-calculator.js';

const LUGGAGE_SIZES = [
    { id: 's', label: 'Small' },
    { id: 'm', label: 'Medium' },
    { id: 'l', label: 'Large' },
];

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

function luggageOptionsHtml() {
    return LUGGAGE_SIZES.map((size) => optionHtml(size.id, size.label)).join('');
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

function addOnFieldHtml(addOn) {
    return `
    <div class="form-check">
        <input class="form-check-input booking-addon" type="checkbox" id="booking-addon-${addOn.id}" value="${addOn.id}">
        <label class="form-check-label" for="booking-addon-${addOn.id}">${addOn.label} (+${CURRENCY_SYMBOL}${addOn.price})</label>
    </div>
    `;
}

function addOnFieldsHtml() {
    return ADD_ONS.map(addOnFieldHtml).join('');
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

function buildWhatsappMessage(state, quote) {
    const location = LOCATIONS.find((l) => l.id === state.locationId);
    const locationLabel = location ? location.description : '—';
    const [pickup, destination] = state.direction === 'from-airport'
        ? [AIRPORT_LABEL, locationLabel]
        : [locationLabel, AIRPORT_LABEL];
    const luggage = LUGGAGE_SIZES.find((l) => l.id === state.luggageId);
    const pickupDateTime = formatPickupDateTime(state.pickupDateTime);
    const lines = [
        `Hi! I'd like a taxi quote:`,
        `- Pick-up: ${pickup}`,
        `- Destination: ${destination}`,
    ];
    if (pickupDateTime) {
        lines.push(`- Pick-up date & time: ${pickupDateTime}`);
    }
    lines.push(
        `- Passengers: ${state.adults} adult(s), ${state.children} child(ren)`,
        `- Luggage: ${luggage ? luggage.label : '—'}`,
    );
    if (quote.addOns.length) {
        lines.push(`- Add-ons: ${quote.addOns.map((a) => a.label).join(', ')}`);
    }
    if (quote.vehicle) {
        lines.push(`- Vehicle: ${quote.vehicle.vehicle} (up to ${quote.vehicle.capacity} passengers)`);
    }
    if (quote.total !== null) {
        lines.push(`- Indicative total: ${CURRENCY_SYMBOL}${quote.total}`);
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
                                <div class="col-12 col-md-6">
                                    <label for="booking-location" id="booking-location-label" class="form-label fw-semibold">${locationLabelText(DEFAULT_DIRECTION)}</label>
                                    <select id="booking-location" class="form-select">
                                        <option value="" selected>Choose a location</option>
                                        ${locationOptionsHtml()}
                                    </select>
                                </div>
                                <div class="col-12 col-md-6">
                                    <label for="booking-pickup-time" class="form-label fw-semibold">Pick-up date &amp; time</label>
                                    <input type="datetime-local" id="booking-pickup-time" class="form-control" min="${nowLocalDateTimeString()}">
                                </div>
                                <div class="col-6 col-md-3">
                                    <label for="booking-adults" class="form-label fw-semibold">Adults</label>
                                    <input type="number" id="booking-adults" class="form-control" min="0" max="${MAX_PASSENGERS}" value="1">
                                </div>
                                <div class="col-6 col-md-3">
                                    <label for="booking-children" class="form-label fw-semibold">Children</label>
                                    <input type="number" id="booking-children" class="form-control" min="0" max="${MAX_PASSENGERS}" value="0">
                                </div>
                                <div class="col-12 col-md-6">
                                    <label for="booking-luggage" class="form-label fw-semibold">Luggage size</label>
                                    <select id="booking-luggage" class="form-select">
                                        ${luggageOptionsHtml()}
                                    </select>
                                </div>
                                <div class="col-12 col-md-6">
                                    <span class="form-label fw-semibold d-block">Add-ons</span>
                                    <div class="d-flex flex-wrap gap-3">
                                        ${addOnFieldsHtml()}
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
    const locationLabelEl = section.querySelector('#booking-location-label');
    const locationEl = section.querySelector('#booking-location');
    const pickupTimeEl = section.querySelector('#booking-pickup-time');
    const adultsEl = section.querySelector('#booking-adults');
    const childrenEl = section.querySelector('#booking-children');
    const luggageEl = section.querySelector('#booking-luggage');
    const addOnEls = section.querySelectorAll('.booking-addon');
    const resultEl = section.querySelector('#booking-result');
    const ctaEl = section.querySelector('#booking-cta');

    function readState() {
        const checkedDirection = Array.from(directionEls).find((el) => el.checked);
        return {
            direction: checkedDirection ? checkedDirection.value : DEFAULT_DIRECTION,
            locationId: locationEl.value,
            pickupDateTime: pickupTimeEl.value,
            adults: Math.max(0, Number.parseInt(adultsEl.value, 10) || 0),
            children: Math.max(0, Number.parseInt(childrenEl.value, 10) || 0),
            luggageId: luggageEl.value,
            addOnIds: Array.from(addOnEls).filter((el) => el.checked).map((el) => el.value),
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

    function update() {
        const state = readState();
        const quote = calculateQuote(state);
        locationLabelEl.textContent = locationLabelText(state.direction);
        renderResult(state, quote);

        const canBook = Boolean(state.locationId) && Boolean(state.pickupDateTime) && quote.total !== null && !quote.overCapacity;
        ctaEl.classList.toggle('disabled', !canBook);
        ctaEl.setAttribute('aria-disabled', String(!canBook));
        ctaEl.tabIndex = canBook ? 0 : -1;
        ctaEl.href = canBook
            ? `${WHATSAPP_URL}?text=${encodeURIComponent(buildWhatsappMessage(state, quote))}`
            : WHATSAPP_URL;
    }

    [locationEl, pickupTimeEl, adultsEl, childrenEl, luggageEl].forEach((el) => el.addEventListener('input', update));
    addOnEls.forEach((el) => el.addEventListener('change', update));
    directionEls.forEach((el) => el.addEventListener('change', update));

    update();

    return section;
}
