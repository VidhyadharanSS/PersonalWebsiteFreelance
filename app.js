/* ═══════════════════════════════════════════════════════════
   ZENITH PRANAVI — Main Application Controller
   ═══════════════════════════════════════════════════════════
   Phase 3: Ties together Auth + Database + UI
   ═══════════════════════════════════════════════════════════ */

// ═══════════════════════════════════════════════════════════
// APPLICATION INIT
// ═══════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Zenith Pranavi — Initializing...');

    // 1. Check for existing session (auto-login)
    await checkExistingSession();

    // 2. Load homepage tutors
    await loadTutors();

    // 3. Set up event listeners
    initializeEventListeners();

    // 4. Set min booking dates to today
    setMinBookingDates();

    // 5. Initialize scroll animations
    initScrollAnimations();

    console.log('✅ Application fully initialized');
});


// ═══════════════════════════════════════════════════════════
// EVENT LISTENERS
// ═══════════════════════════════════════════════════════════

function initializeEventListeners() {

    // ── Mobile Navigation Toggle ──
    const mobileToggle = document.getElementById('mobile-toggle');
    const navLinks = document.getElementById('nav-links');

    mobileToggle.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        mobileToggle.classList.toggle('active');
    });

    // Close mobile nav on link click
    navLinks.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active');
            mobileToggle.classList.remove('active');
        });
    });

    // ── Smooth Scroll for Nav Links ──
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            const sectionId = link.dataset.section;
            if (sectionId) {
                e.preventDefault();

                // If on dashboard, switch to homepage first
                if (!dashboardEl.classList.contains('hidden')) {
                    showHomepage();
                    setTimeout(() => {
                        const section = document.getElementById(sectionId);
                        if (section) section.scrollIntoView({ behavior: 'smooth' });
                    }, 150);
                } else {
                    const section = document.getElementById(sectionId);
                    if (section) section.scrollIntoView({ behavior: 'smooth' });
                }

                // Update active state
                document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                link.classList.add('active');
            }
        });
    });

    // ── Dashboard Booking Form ──
    document.getElementById('booking-form').addEventListener('submit', handleDashboardBooking);

    // ── Tutor Select → Update Price Display ──
    document.getElementById('booking-tutor').addEventListener('change', (e) => {
        const priceLabel = document.getElementById('booking-price-label');
        if (e.target.value) {
            const tutorData = JSON.parse(e.target.value);
            priceLabel.textContent = `$${tutorData.price}/hour`;
        } else {
            priceLabel.textContent = '$0/hour';
        }
    });

    // ── Quick Booking Form (Modal) ──
    document.getElementById('quick-booking-form').addEventListener('submit', handleQuickBooking);

    // ── Contact/Enquiry Form ──
    document.getElementById('enquiry-form').addEventListener('submit', handleEnquiry);

    // ── CTA "Claim Free Session" Form ──
    document.getElementById('cta-form').addEventListener('submit', handleCtaForm);

    // ── Footer Links ──
    const footerSignin = document.getElementById('footer-signin-link');
    const footerSignup = document.getElementById('footer-signup-link');
    const footerDash   = document.getElementById('footer-dashboard-link');
    const footerBook   = document.getElementById('footer-bookings-link');

    if (footerSignin) footerSignin.addEventListener('click', (e) => { e.preventDefault(); openAuthModal('login'); });
    if (footerSignup) footerSignup.addEventListener('click', (e) => { e.preventDefault(); openAuthModal('signup'); });
    if (footerDash) footerDash.addEventListener('click', async (e) => {
        e.preventDefault();
        const { data: { session } } = await supabase.auth.getSession();
        if (session) { showDashboard(); } else { openAuthModal('login'); }
    });
    if (footerBook) footerBook.addEventListener('click', async (e) => {
        e.preventDefault();
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            showDashboard();
            setTimeout(() => {
                document.getElementById('book-section').scrollIntoView({ behavior: 'smooth' });
            }, 300);
        } else { openAuthModal('login'); }
    });

    // ── Active Nav on Scroll ──
    window.addEventListener('scroll', updateActiveNavOnScroll);

    // ── Navbar shadow on scroll ──
    window.addEventListener('scroll', () => {
        const navbar = document.getElementById('navbar');
        if (window.scrollY > 20) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
}


// ═══════════════════════════════════════════════════════════
// BOOKING HANDLERS
// ═══════════════════════════════════════════════════════════

/**
 * Handle booking from dashboard form
 */
async function handleDashboardBooking(e) {
    e.preventDefault();

    const tutorSelect = document.getElementById('booking-tutor');
    const subject     = document.getElementById('booking-subject').value.trim();
    const date        = document.getElementById('booking-date').value;
    const time        = document.getElementById('booking-time').value;
    const submitBtn   = document.getElementById('booking-submit');

    if (!tutorSelect.value || !subject || !date || !time) {
        showToast('Please fill in all booking fields.', 'warning');
        return;
    }

    const tutorData = JSON.parse(tutorSelect.value);

    // Validate date is not in the past
    if (new Date(date) < new Date(new Date().toDateString())) {
        showToast('Please select a future date.', 'warning');
        return;
    }

    setButtonLoading(submitBtn, true);

    const result = await createBooking({
        tutorName: tutorData.name,
        subject:   subject,
        date:      date,
        time:      time,
        price:     tutorData.price
    });

    if (result) {
        e.target.reset();
        document.getElementById('booking-price-label').textContent = '$0/hour';
        await renderBookingsTable();
        document.getElementById('bookings-table').scrollIntoView({ behavior: 'smooth' });
    }

    setButtonLoading(submitBtn, false);
}

/**
 * Handle booking from quick-book modal (tutor card)
 */
async function handleQuickBooking(e) {
    e.preventDefault();

    const tutorName  = document.getElementById('qb-tutor-name').value;
    const tutorPrice = parseInt(document.getElementById('qb-tutor-price').value);
    const subject    = document.getElementById('qb-subject').value.trim();
    const date       = document.getElementById('qb-date').value;
    const time       = document.getElementById('qb-time').value;
    const submitBtn  = document.getElementById('qb-submit');

    if (!subject || !date || !time) {
        showToast('Please fill in all fields.', 'warning');
        return;
    }

    if (new Date(date) < new Date(new Date().toDateString())) {
        showToast('Please select a future date.', 'warning');
        return;
    }

    setButtonLoading(submitBtn, true);

    const result = await createBooking({
        tutorName: tutorName,
        subject:   subject,
        date:      date,
        time:      time,
        price:     tutorPrice
    });

    if (result) {
        closeBookingModal();
        await renderBookingsTable();
    }

    setButtonLoading(submitBtn, false);
}


// ═══════════════════════════════════════════════════════════
// ENQUIRY HANDLER
// ═══════════════════════════════════════════════════════════

async function handleEnquiry(e) {
    e.preventDefault();

    const name      = document.getElementById('enquiry-name').value.trim();
    const email     = document.getElementById('enquiry-email').value.trim();
    const message   = document.getElementById('enquiry-message').value.trim();
    const submitBtn = document.getElementById('enquiry-submit');

    if (!name || !email || !message) {
        showToast('Please fill in all fields.', 'warning');
        return;
    }

    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showToast('Please enter a valid email address.', 'warning');
        return;
    }

    setButtonLoading(submitBtn, true);

    const success = await submitEnquiry({ name, email, message });
    if (success) {
        e.target.reset();
    }

    setButtonLoading(submitBtn, false);
}


// ═══════════════════════════════════════════════════════════
// CTA FORM HANDLER (Claim Free Session)
// ═══════════════════════════════════════════════════════════

async function handleCtaForm(e) {
    e.preventDefault();

    const emailInput = document.getElementById('cta-email');
    const email = emailInput.value.trim();

    if (!email) {
        showToast('Please enter your email address.', 'warning');
        return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showToast('Please enter a valid email address.', 'warning');
        return;
    }

    // Save as an enquiry with auto-message
    const success = await submitEnquiry({
        name: email.split('@')[0],
        email: email,
        message: '🌸 Requested a FREE discovery session via homepage CTA.'
    });

    if (success) {
        emailInput.value = '';
        showToast('Thank you! We\'ll reach out to schedule your free session. 🎉', 'success');
    }
}


// ═══════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════

/**
 * Set minimum date on all date inputs to today
 */
function setMinBookingDates() {
    const today = new Date().toISOString().split('T')[0];
    document.querySelectorAll('input[type="date"]').forEach(input => {
        input.min = today;
    });
}

/**
 * Update active nav link based on scroll position
 */
function updateActiveNavOnScroll() {
    if (homepageEl.classList.contains('hidden')) return;

    const sections = ['home', 'programs', 'how-it-works', 'contact'];
    const scrollPos = window.scrollY + 160;

    for (let i = sections.length - 1; i >= 0; i--) {
        const section = document.getElementById(sections[i]);
        if (section && section.offsetTop <= scrollPos) {
            document.querySelectorAll('.nav-link').forEach(link => {
                link.classList.remove('active');
                if (link.dataset.section === sections[i]) {
                    link.classList.add('active');
                }
            });
            break;
        }
    }
}


// ═══════════════════════════════════════════════════════════
// SCROLL ANIMATIONS (Intersection Observer)
// ═══════════════════════════════════════════════════════════

function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.12,
        rootMargin: '0px 0px -40px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Apply fade-in to animated elements
    const selectors = [
        '.pricing-card',
        '.experience-card',
        '.process-step',
        '.why-feature-card',
        '.contact-info-card',
        '.tutor-card',
        '.impact-card',
        '.cta-card'
    ];

    document.querySelectorAll(selectors.join(', ')).forEach((el, index) => {
        el.classList.add('fade-in');
        el.style.transitionDelay = `${index * 0.08}s`;
        observer.observe(el);
    });
}


console.log('✅ App controller loaded — Zenith Pranavi ready!');
