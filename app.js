/* ═══════════════════════════════════════════════════════════
   ZENITH PRANAVI — Main Application Controller
   ═══════════════════════════════════════════════════════════
   All CTA buttons → Unified Registration Modal
   ═══════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Init theme toggle
    initThemeToggle();

    // 2. Check existing session
    await checkExistingSession();

    // 3. Set up event listeners
    initializeEventListeners();

    // 4. Init registration modal
    initRegisterModal();

    // 5. Set min booking dates
    setMinBookingDates();

    // 6. Init scroll animations
    initScrollAnimations();

    console.log('Application initialized');
});


// ═══════════════════════════════════════════════════════════
// EVENT LISTENERS
// ═══════════════════════════════════════════════════════════

function initializeEventListeners() {
    // Mobile nav
    const mobileToggle = document.getElementById('mobile-toggle');
    const navLinks = document.getElementById('nav-links');
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

    // Smooth scroll nav
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            const sectionId = link.dataset.section;
            if (sectionId) {
                e.preventDefault();
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
                document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                link.classList.add('active');
            }
        });
    });

    // Dashboard booking form
    document.getElementById('booking-form').addEventListener('submit', handleDashboardBooking);

    // Year selector
    initYearSelector();

    // Contact form
    document.getElementById('enquiry-form').addEventListener('submit', handleEnquiry);

    // ALL CTA BUTTONS → Unified Registration Modal
    // CTA forms (email input + button)
    document.getElementById('cta-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('cta-email').value.trim();
        openRegisterModal('signup', email);
    });
    document.getElementById('final-cta-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('final-cta-email').value.trim();
        openRegisterModal('signup', email);
    });

    // Pricing buttons
    document.querySelectorAll('[data-cta="pricing"]').forEach(btn => {
        btn.addEventListener('click', () => openRegisterModal('signup'));
    });

    // Get Started banner button
    document.querySelectorAll('[data-cta="banner"]').forEach(btn => {
        btn.addEventListener('click', () => openRegisterModal('signup'));
    });

    // Footer links
    const footerSignin = document.getElementById('footer-signin-link');
    const footerSignup = document.getElementById('footer-signup-link');
    if (footerSignin) footerSignin.addEventListener('click', (e) => { e.preventDefault(); openRegisterModal('signin'); });
    if (footerSignup) footerSignup.addEventListener('click', (e) => { e.preventDefault(); openRegisterModal('signup'); });

    // Active nav on scroll
    window.addEventListener('scroll', updateActiveNavOnScroll);

    // Navbar shadow
    window.addEventListener('scroll', () => {
        const navbar = document.getElementById('navbar');
        navbar.classList.toggle('scrolled', window.scrollY > 20);
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
        showToast('Please fill in all booking fields.', 'warning');
        return;
    }
    if (new Date(date) < new Date(new Date().toDateString())) {
        showToast('Please select a future date.', 'warning');
        return;
    }

    setButtonLoading(submitBtn, true);
    const result = await createBooking({
        tutorName: selectedYear, subject, date, time,
        price: parseInt(selectedPrice) || 20
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


// ═══════════════════════════════════════════════════════════
// ENQUIRY HANDLER
// ═══════════════════════════════════════════════════════════

async function handleEnquiry(e) {
    e.preventDefault();
    const name = document.getElementById('enquiry-name').value.trim();
    const email = document.getElementById('enquiry-email').value.trim();
    const message = document.getElementById('enquiry-message').value.trim();
    const submitBtn = document.getElementById('enquiry-submit');

    if (!name || !email || !message) { showToast('Please fill in all fields.', 'warning'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showToast('Please enter a valid email address.', 'warning'); return; }

    setButtonLoading(submitBtn, true);
    const success = await submitEnquiry({ name, email, message });
    if (success) e.target.reset();
    setButtonLoading(submitBtn, false);
}


// ═══════════════════════════════════════════════════════════
// YEAR SELECTOR
// ═══════════════════════════════════════════════════════════

function initYearSelector() {
    const categoryBtns = document.querySelectorAll('.year-category-btn');
    const gradeBtns = document.querySelectorAll('.year-grade-btn');
    const clearBtn = document.getElementById('clear-year-btn');

    categoryBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const category = btn.dataset.category;
            if (category === 'all') { selectYear('All Grades', 20); return; }

            const panelId = `grades-${category}`;
            const panel = document.getElementById(panelId);
            document.querySelectorAll('.year-grades-panel').forEach(p => { if (p.id !== panelId) p.classList.remove('open'); });
            categoryBtns.forEach(b => { if (b !== btn) b.classList.remove('active'); });
            panel.classList.toggle('open');
            btn.classList.toggle('active');
        });
    });

    gradeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            selectYear(btn.dataset.year, btn.dataset.price);
            gradeBtns.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
        });
    });

    if (clearBtn) clearBtn.addEventListener('click', clearYearSelection);
}

function selectYear(year, price) {
    document.getElementById('booking-year').value = year;
    document.getElementById('booking-year-price').value = price;
    document.getElementById('booking-price-label').textContent = `$${price}/hour`;
    const display = document.getElementById('selected-year-display');
    document.getElementById('selected-year-text').textContent = `${year} — $${price}/hr`;
    display.classList.remove('hidden');
}

function clearYearSelection() {
    document.getElementById('booking-year').value = '';
    document.getElementById('booking-year-price').value = '';
    document.getElementById('booking-price-label').textContent = '$0/hour';
    document.getElementById('selected-year-display').classList.add('hidden');
    document.querySelectorAll('.year-grade-btn').forEach(b => b.classList.remove('selected'));
    document.querySelectorAll('.year-category-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.year-grades-panel').forEach(p => p.classList.remove('open'));
}


// ═══════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════

function setMinBookingDates() {
    const today = new Date().toISOString().split('T')[0];
    document.querySelectorAll('input[type="date"]').forEach(input => { input.min = today; });
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
        el.style.transitionDelay = `${index * 0.08}s`;
        observer.observe(el);
    });
}

console.log('App controller loaded');
