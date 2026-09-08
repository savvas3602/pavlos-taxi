// BookingCalculator.js - Plain JS component for Vite.
// Renders the "Get an Instant Quote" form: destination, adults, children,
// luggage size and add-ons drive an auto-selected vehicle + indicative
// price (src/utils/booking-calculator.js), which the visitor then sends to
// us as a prefilled WhatsApp message - same backend-free, WhatsApp-to-human
// booking model the rest of the site already uses.
import { DESTINATIONS, ADD_ONS, CURRENCY_SYMBOL, WHATSAPP_URL } from '../config.js';
import { calculateQuote, MAX_PASSENGERS } from '../utils/booking-calculator.js';

const LUGGAGE_SIZES = [
    { id: 's', label: 'Small' },
    { id: 'm', label: 'Medium' },
    { id: 'l', label: 'Large' },
];

function optionHtml(value, label) {
    return `<option value="${value}">${label}</option>`;
}

function destinationOptionsHtml() {
    return DESTINATIONS.map((destination) => optionHtml(destination.id, destination.description)).join('');
}

function luggageOptionsHtml() {
    return LUGGAGE_SIZES.map((size) => optionHtml(size.id, size.label)).join('');
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
    const destination = DESTINATIONS.find((d) => d.id === state.destinationId);
    const luggage = LUGGAGE_SIZES.find((l) => l.id === state.luggageId);
    const lines = [
        `Hi! I'd like a taxi quote:`,
        `- Destination: ${destination ? destination.description : '—'}`,
        `- Passengers: ${state.adults} adult(s), ${state.children} child(ren)`,
        `- Luggage: ${luggage ? luggage.label : '—'}`,
    ];
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
                                <div class="col-12 col-md-6">
                                    <label for="booking-destination" class="form-label fw-semibold">Destination</label>
                                    <select id="booking-destination" class="form-select">
                                        <option value="" selected>Choose a destination</option>
                                        ${destinationOptionsHtml()}
                                    </select>
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
    const destinationEl = section.querySelector('#booking-destination');
    const adultsEl = section.querySelector('#booking-adults');
    const childrenEl = section.querySelector('#booking-children');
    const luggageEl = section.querySelector('#booking-luggage');
    const addOnEls = section.querySelectorAll('.booking-addon');
    const resultEl = section.querySelector('#booking-result');
    const ctaEl = section.querySelector('#booking-cta');

    function readState() {
        return {
            destinationId: destinationEl.value,
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

        if (!state.destinationId || quote.basePrice === null) {
            resultEl.innerHTML = `
                <p class="mb-0"><strong>${quote.vehicle.vehicle}</strong> (up to ${quote.vehicle.capacity} passengers) fits your group.</p>
                <p class="mb-0 text-secondary">Choose a destination to see the indicative price.</p>
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
        renderResult(state, quote);

        const canBook = Boolean(state.destinationId) && quote.total !== null && !quote.overCapacity;
        ctaEl.classList.toggle('disabled', !canBook);
        ctaEl.setAttribute('aria-disabled', String(!canBook));
        ctaEl.tabIndex = canBook ? 0 : -1;
        ctaEl.href = canBook
            ? `${WHATSAPP_URL}?text=${encodeURIComponent(buildWhatsappMessage(state, quote))}`
            : WHATSAPP_URL;
    }

    [destinationEl, adultsEl, childrenEl, luggageEl].forEach((el) => el.addEventListener('input', update));
    addOnEls.forEach((el) => el.addEventListener('change', update));

    update();

    return section;
}
