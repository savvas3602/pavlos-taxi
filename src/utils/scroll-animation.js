export function initializeScrollAnimations() {
    const scrollElements = document.querySelectorAll(".scroll-animate");
    if (!scrollElements.length) return;

    const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) {
        // Skip the animation machinery entirely; just show content.
        scrollElements.forEach((el) => el.classList.add("is-visible"));
        return;
    }

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                entry.target.classList.toggle("is-visible", entry.isIntersecting);
            });
        },
        {
            threshold: 0,
            rootMargin: "0px 0px -20% 0px", // reveal a bit before the element's bottom edge
        }
    );

    scrollElements.forEach((el) => observer.observe(el));
}
