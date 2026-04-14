/* ═══════════════════════════════════════════════════════════
   ZENITH PRANAVI — Main Application Controller
   ═══════════════════════════════════════════════════════════
   EdTech Platform — Homepage + Dashboard
   ═══════════════════════════════════════════════════════════ */

// ═══════════════════════════════════════════════════════════
// APPLICATION INIT
// ═══════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Zenith Pranavi — Initializing...');

    // 1. Check for existing session (auto-login)
    await checkExistingSession();

    // 2. Set up event listeners
    initializeEventListeners();

    // 3. Set min booking dates to today
    setMinBookingDates();

    // 4. Initialize scroll animations
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

    // ── Year Selector (Category expand/collapse + Grade select) ──
    initYearSelector();

    // ── Quick Booking Form (Modal — legacy, kept for compatibility) ──
    const qbForm = document.getElementById('quick-booking-form');
    if (qbForm) qbForm.addEventListener('submit', handleQuickBooking);

    // ── Contact/Enquiry Form ──
    document.getElementById('enquiry-form').addEventListener('submit', handleEnquiry);

    // ── CTA "Claim Free Session" Form ──
    document.getElementById('cta-form').addEventListener('submit', handleCtaForm);

    // ── Footer Links ──
    const footerSignin = document.getElementById('footer-signin-link');
    const footerSignup = document.getElementById('footer-signup-link');

    if (footerSignin) footerSignin.addEventListener('click', (e) => { e.preventDefault(); openAuthModal('login'); });
    if (footerSignup) footerSignup.addEventListener('click', (e) => { e.preventDefault(); openAuthModal('signup'); });

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

async function handleDashboardBooking(e) {
    e.preventDefault();

    const selectedYear  = document.getElementById('booking-year').value;
    const selectedPrice = document.getElementById('booking-year-price').value;
    const subject       = document.getElementById('booking-subject').value.trim();
    const date          = document.getElementById('booking-date').value;
    const time          = document.getElementById('booking-time').value;
    const submitBtn     = document.getElementById('booking-submit');

    if (!selectedYear || !subject || !date || !time) {
        showToast('Please fill in all booking fields — including selecting your year.', 'warning');
        return;
    }

    if (new Date(date) < new Date(new Date().toDateString())) {
        showToast('Please select a future date.', 'warning');
        return;
    }

    setButtonLoading(submitBtn, true);

    const result = await createBooking({
        tutorName: selectedYear,
        subject:   subject,
        date:      date,
        time:      time,
        price:     parseInt(selectedPrice) || 20
    });

    if (result) {
        e.target.reset();
        clearYearSelection();
        document.getElementById('booking-price-label').textContent = '$0/hour';
        await renderBookingsTable();
        document.getElementById('bookings-table').scrollIntoView({ behavior: 'smooth' });
    }

    setButtonLoading(submitBtn, false);
}

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
// YEAR SELECTOR LOGIC
// ═══════════════════════════════════════════════════════════

function initYearSelector() {
    const categoryBtns = document.querySelectorAll('.year-category-btn');
    const gradeBtns    = document.querySelectorAll('.year-grade-btn');
    const clearBtn     = document.getElementById('clear-year-btn');

    // Category expand/collapse
    categoryBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const category = btn.dataset.category;

            // "All Grades" — select it directly (no panel)
            if (category === 'all') {
                selectYear('All Grades', 20); // default price
                return;
            }

            const panelId = `grades-${category}`;
            const panel   = document.getElementById(panelId);

            // Toggle: close all other panels first
            document.querySelectorAll('.year-grades-panel').forEach(p => {
                if (p.id !== panelId) p.classList.remove('open');
            });
            categoryBtns.forEach(b => {
                if (b !== btn) b.classList.remove('active');
            });

            // Toggle this panel
            panel.classList.toggle('open');
            btn.classList.toggle('active');
        });
    });

    // Individual grade selection
    gradeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const year  = btn.dataset.year;
            const price = btn.dataset.price;
            selectYear(year, price);

            // Highlight selected grade
            gradeBtns.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
        });
    });

    // Clear selection
    if (clearBtn) {
        clearBtn.addEventListener('click', clearYearSelection);
    }
}

function selectYear(year, price) {
    document.getElementById('booking-year').value       = year;
    document.getElementById('booking-year-price').value  = price;
    document.getElementById('booking-price-label').textContent = `$${price}/hour`;

    const display = document.getElementById('selected-year-display');
    const text    = document.getElementById('selected-year-text');
    text.textContent = `✅ ${year} — $${price}/hr`;
    display.classList.remove('hidden');
}

function clearYearSelection() {
    document.getElementById('booking-year').value       = '';
    document.getElementById('booking-year-price').value  = '';
    document.getElementById('booking-price-label').textContent = '$0/hour';

    document.getElementById('selected-year-display').classList.add('hidden');
    document.querySelectorAll('.year-grade-btn').forEach(b => b.classList.remove('selected'));
    document.querySelectorAll('.year-category-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.year-grades-panel').forEach(p => p.classList.remove('open'));
}

// ═══════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════

function setMinBookingDates() {
    const today = new Date().toISOString().split('T')[0];
    document.querySelectorAll('input[type="date"]').forEach(input => {
        input.min = today;
    });
}

function updateActiveNavOnScroll() {
    if (homepageEl.classList.contains('hidden')) return;

    const sections = ['home', 'programs', 'pricing', 'how-it-works', 'contact'];
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

    const selectors = [
        '.program-card',
        '.process-step',
        '.why-feature-card',
        '.contact-info-card',
        '.impact-card',
        '.cta-card',
        '.pricing-card',
        '.experience-card',
        '.trust-pill'
    ];

    document.querySelectorAll(selectors.join(', ')).forEach((el, index) => {
        el.classList.add('fade-in');
        el.style.transitionDelay = `${index * 0.08}s`;
        observer.observe(el);
    });
}


console.log('✅ App controller loaded — Zenith Pranavi ready!');
