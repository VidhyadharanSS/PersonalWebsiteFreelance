/* ═══════════════════════════════════════════════════════════
   ZENITH PRANAVI — Main Application Controller
   Fresh from zero. All CTA → Unified Registration Modal.
   ═══════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', async () => {
    initThemeToggle();
    await checkExistingSession();
    initializeEventListeners();
    initRegisterModal();
    setMinBookingDates();
    initScrollAnimations();
});


// ═══════════════════════════════════════════════════════════
// EVENT LISTENERS
// ═══════════════════════════════════════════════════════════

function initializeEventListeners() {
    // Mobile nav
    const mobileToggle = document.getElementById('mobile-toggle');
    const navLinks = document.getElementById('nav-links');
    if (mobileToggle && navLinks) {
        mobileToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            mobileToggle.classList.toggle('active');
        });
        navLinks.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
                mobileToggle.classList.remove('active');
            });
        });
    }

    // Smooth scroll nav
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            const sectionId = link.dataset.section;
            if (sectionId) {
                e.preventDefault();
                if (dashboardEl && !dashboardEl.classList.contains('hidden')) {
                    showHomepage();
                    setTimeout(() => {
                        const section = document.getElementById(sectionId);
                        if (section) section.scrollIntoView({ behavior: 'smooth' });
                    }, 150);
                } else {
                    const section = document.getElementById(sectionId);
                    if (section) section.scrollIntoView({ behavior: 'smooth' });
                }
                document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                link.classList.add('active');
            }
        });
    });

    // ALL CTA BUTTONS → Unified Registration Modal
    // Every button with data-cta attribute opens the modal
    document.querySelectorAll('[data-cta]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            openRegisterModal('signup');
        });
    });

    // Dashboard booking form (simplified — no $0/hour)
    const bookingForm = document.getElementById('booking-form');
    if (bookingForm) bookingForm.addEventListener('submit', handleDashboardBooking);

    // Year selector change → show price
    const yearSelect = document.getElementById('booking-year-select');
    if (yearSelect) {
        yearSelect.addEventListener('change', () => {
            const selected = yearSelect.options[yearSelect.selectedIndex];
            const price = selected.dataset.price;
            const priceDisplay = document.getElementById('booking-price-display');
            const priceLabel = document.getElementById('booking-price-label');
            if (price && priceDisplay && priceLabel) {
                priceLabel.textContent = '$' + price + '/hour';
                priceDisplay.style.display = 'block';
            } else if (priceDisplay) {
                priceDisplay.style.display = 'none';
            }
        });
    }

    // Contact form
    const enquiryForm = document.getElementById('enquiry-form');
    if (enquiryForm) enquiryForm.addEventListener('submit', handleEnquiry);

    // Active nav on scroll
    window.addEventListener('scroll', updateActiveNavOnScroll);

    // Navbar shadow
    window.addEventListener('scroll', () => {
        const navbar = document.getElementById('navbar');
        if (navbar) navbar.classList.toggle('scrolled', window.scrollY > 20);
    });
}


// ═══════════════════════════════════════════════════════════
// BOOKING HANDLER (Dashboard only, after login)
// FIX #5: No $0/hour anywhere. Price only shown when year selected.
// ═══════════════════════════════════════════════════════════

async function handleDashboardBooking(e) {
    e.preventDefault();
    const yearSelect = document.getElementById('booking-year-select');
    const subject = document.getElementById('booking-subject').value.trim();
    const date = document.getElementById('booking-date').value;
    const time = document.getElementById('booking-time').value;
    const submitBtn = document.getElementById('booking-submit');

    if (!yearSelect.value || !subject || !date || !time) {
        showToast('Please fill in all booking fields.', 'warning');
        return;
    }
    if (new Date(date) < new Date(new Date().toDateString())) {
        showToast('Please select a future date.', 'warning');
        return;
    }

    const selectedOption = yearSelect.options[yearSelect.selectedIndex];
    const price = parseInt(selectedOption.dataset.price) || 20;

    setButtonLoading(submitBtn, true);
    const result = await createBooking({
        tutorName: yearSelect.value,
        subject: subject,
        date: date,
        time: time,
        price: price
    });
    if (result) {
        e.target.reset();
        document.getElementById('booking-price-display').style.display = 'none';
        await renderBookingsTable();
        document.getElementById('bookings-table').scrollIntoView({ behavior: 'smooth' });
    }
    setButtonLoading(submitBtn, false);
}


// ═══════════════════════════════════════════════════════════
// ENQUIRY HANDLER
// ═══════════════════════════════════════════════════════════

async function handleEnquiry(e) {
    e.preventDefault();
    const name = document.getElementById('enquiry-name').value.trim();
    const email = document.getElementById('enquiry-email').value.trim();
    const message = document.getElementById('enquiry-message').value.trim();
    const submitBtn = document.getElementById('enquiry-submit');

    if (!name || !email || !message) {
        showToast('Please fill in all fields.', 'warning');
        return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showToast('Please enter a valid email address.', 'warning');
        return;
    }

    setButtonLoading(submitBtn, true);
    const success = await submitEnquiry({ name, email, message });
    if (success) e.target.reset();
    setButtonLoading(submitBtn, false);
}


// ═══════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════

function setMinBookingDates() {
    const today = new Date().toISOString().split('T')[0];
    document.querySelectorAll('input[type="date"]').forEach(input => { input.min = today; });
}

function updateActiveNavOnScroll() {
    if (!homepageEl || homepageEl.classList.contains('hidden')) return;
    const sections = ['home', 'why', 'programs', 'pricing', 'how-it-works', 'contact'];
    const scrollPos = window.scrollY + 160;
    for (let i = sections.length - 1; i >= 0; i--) {
        const section = document.getElementById(sections[i]);
        if (section && section.offsetTop <= scrollPos) {
            document.querySelectorAll('.nav-link').forEach(link => {
                link.classList.remove('active');
                if (link.dataset.section === sections[i]) link.classList.add('active');
            });
            break;
        }
    }
}


// ═══════════════════════════════════════════════════════════
// SCROLL ANIMATIONS
// ═══════════════════════════════════════════════════════════

function initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    const selectors = [
        '.program-card', '.process-step', '.why-feature-card',
        '.contact-info-card', '.impact-card', '.cta-card',
        '.pricing-card', '.experience-card', '.trust-pill'
    ];

    document.querySelectorAll(selectors.join(', ')).forEach((el, index) => {
        el.classList.add('fade-in');
        el.style.transitionDelay = `${index * 0.06}s`;
        observer.observe(el);
    });
}
