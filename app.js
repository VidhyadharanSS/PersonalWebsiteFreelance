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

    // ── CTA "Claim Free Session" Forms ──
    document.getElementById('cta-form').addEventListener('submit', handleCtaForm);

    // ── Final CTA Form (Duplicate before footer) → Opens Multi-Step Modal ──
    document.getElementById('final-cta-form').addEventListener('submit', handleFinalCtaForm);

    // ── Initialize Multi-Step Booking Modal ──
    initMultiStepForm();

    // ── Initialize Program Selection Modal ──
    initProgramModal();

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

    // Open the multi-step booking modal with pre-filled email
    openMultiStepModal(email);
}


// ═══════════════════════════════════════════════════════════
// FINAL CTA FORM HANDLER (Opens Multi-Step Modal)
// ═══════════════════════════════════════════════════════════

async function handleFinalCtaForm(e) {
    e.preventDefault();

    const emailInput = document.getElementById('final-cta-email');
    const email = emailInput.value.trim();

    // Open multi-step modal regardless (email is optional pre-fill)
    openMultiStepModal(email);
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


// ═══════════════════════════════════════════════════════════
// MULTI-STEP FORM MODAL (High-Conversion Booking Flow)
// ═══════════════════════════════════════════════════════════

const msfModal = document.getElementById('msf-modal');
let msfCurrentStep = 1;
const MSF_TOTAL_STEPS = 6;

// Collected form data
let msfData = {
    parentName: '', parentEmail: '', parentPhone: '', parentAltPhone: '',
    studentName: '', studentGrade: '', curriculum: '',
    subject: '', timeSlot: '', mode: 'Online', ctaEmail: ''
};

/**
 * Open the multi-step booking modal
 * @param {string} prefilledEmail - Optional email from CTA input
 */
function openMultiStepModal(prefilledEmail = '') {
    msfData.ctaEmail = prefilledEmail;
    msfCurrentStep = 1;

    // Check if user is already logged in
    checkMsfAuthState();

    // Pre-fill email if provided
    if (prefilledEmail) {
        const emailField = document.getElementById('msf-email');
        const signupEmailField = document.getElementById('msf-signup-email');
        const parentEmailField = document.getElementById('msf-parent-email');
        if (emailField) emailField.value = prefilledEmail;
        if (signupEmailField) signupEmailField.value = prefilledEmail;
        if (parentEmailField) parentEmailField.value = prefilledEmail;
    }

    goToMsfStep(1);
    msfModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeMultiStepModal() {
    msfModal.classList.remove('active');
    document.body.style.overflow = '';
}

/**
 * Navigate to a specific step
 */
function goToMsfStep(step) {
    msfCurrentStep = step;

    // Hide all steps
    document.querySelectorAll('.msf-step').forEach(s => s.classList.remove('active'));
    // Show target step
    const targetStep = document.getElementById(`msf-step-${step}`);
    if (targetStep) targetStep.classList.add('active');

    // Update progress bar
    const progressBar = document.getElementById('msf-progress-bar');
    progressBar.style.width = `${(step / MSF_TOTAL_STEPS) * 100}%`;

    // Update step dots
    document.querySelectorAll('.msf-step-dot').forEach(dot => {
        const dotStep = parseInt(dot.dataset.step);
        dot.classList.remove('active', 'completed');
        if (dotStep === step) dot.classList.add('active');
        else if (dotStep < step) dot.classList.add('completed');
    });
}

/**
 * Check if user is already authenticated for Step 1
 */
async function checkMsfAuthState() {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        const skipAuth = document.getElementById('msf-skip-auth');
        const emailPanel = document.getElementById('msf-auth-email');
        const authTabs = document.querySelector('.msf-auth-tabs');

        if (session?.user) {
            // User is logged in — show skip option
            const name = session.user.user_metadata?.name ||
                        session.user.user_metadata?.full_name ||
                        session.user.email?.split('@')[0] || 'User';
            document.getElementById('msf-logged-name').textContent = `Signed in as ${name}`;

            // Pre-fill parent details
            document.getElementById('msf-parent-name').value = name;
            document.getElementById('msf-parent-email').value = session.user.email || '';

            skipAuth.classList.remove('hidden');
            emailPanel.classList.remove('active');
            if (authTabs) authTabs.style.display = 'none';

            // Hide all other auth panels
            document.querySelectorAll('.msf-auth-panel').forEach(p => p.classList.remove('active'));
        } else {
            skipAuth.classList.add('hidden');
            emailPanel.classList.add('active');
            if (authTabs) authTabs.style.display = '';
        }
    } catch (e) {
        console.error('MSF auth check error:', e);
    }
}

/**
 * Validate current step before proceeding
 */
function validateMsfStep(step) {
    switch (step) {
        case 2: {
            const name = document.getElementById('msf-parent-name').value.trim();
            const email = document.getElementById('msf-parent-email').value.trim();
            const phone = document.getElementById('msf-parent-phone').value.trim();
            const altPhone = document.getElementById('msf-parent-alt-phone').value.trim();
            if (!name || !email || !phone || !altPhone) {
                showToast('Please fill in all parent details.', 'warning');
                return false;
            }
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                showToast('Please enter a valid email address.', 'warning');
                return false;
            }
            msfData.parentName = name;
            msfData.parentEmail = email;
            msfData.parentPhone = document.getElementById('msf-parent-phone-code').value + ' ' + phone;
            msfData.parentAltPhone = document.getElementById('msf-parent-alt-code').value + ' ' + altPhone;
            return true;
        }
        case 3: {
            const studentName = document.getElementById('msf-student-name').value.trim();
            const studentGrade = document.getElementById('msf-student-grade').value;
            if (!studentName || !studentGrade) {
                showToast('Please fill in student name and grade.', 'warning');
                return false;
            }
            msfData.studentName = studentName;
            msfData.studentGrade = studentGrade;
            return true;
        }
        case 4: {
            const curriculum = document.getElementById('msf-curriculum-value').value;
            if (!curriculum) {
                showToast('Please select a curriculum.', 'warning');
                return false;
            }
            msfData.curriculum = curriculum;
            return true;
        }
        case 5: {
            const subject = document.getElementById('msf-subject').value.trim();
            const timeSlot = document.getElementById('msf-time-slot').value;
            if (!subject || !timeSlot) {
                showToast('Please fill in subject and preferred time slot.', 'warning');
                return false;
            }
            msfData.subject = subject;
            msfData.timeSlot = timeSlot;
            msfData.mode = document.getElementById('msf-mode').value;
            return true;
        }
        default:
            return true;
    }
}

/**
 * Initialize all multi-step form event listeners
 */
function initMultiStepForm() {
    if (!msfModal) return;

    // Close modal
    document.getElementById('msf-close').addEventListener('click', closeMultiStepModal);
    msfModal.addEventListener('click', (e) => {
        if (e.target === msfModal) closeMultiStepModal();
    });

    // Auth tabs (email / phone toggle)
    document.querySelectorAll('.msf-auth-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.msf-auth-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            document.querySelectorAll('.msf-auth-panel').forEach(p => p.classList.remove('active'));
            const panelId = `msf-auth-${tab.dataset.authTab}`;
            const panel = document.getElementById(panelId);
            if (panel) panel.classList.add('active');
        });
    });

    // Switch to signup
    document.getElementById('msf-switch-signup').addEventListener('click', (e) => {
        e.preventDefault();
        document.querySelectorAll('.msf-auth-panel').forEach(p => p.classList.remove('active'));
        document.getElementById('msf-auth-signup').classList.add('active');
    });

    // Switch to login
    document.getElementById('msf-switch-login').addEventListener('click', (e) => {
        e.preventDefault();
        document.querySelectorAll('.msf-auth-panel').forEach(p => p.classList.remove('active'));
        document.getElementById('msf-auth-email').classList.add('active');
    });

    // Forgot password trigger
    document.getElementById('msf-forgot-trigger').addEventListener('click', (e) => {
        e.preventDefault();
        document.querySelectorAll('.msf-auth-panel').forEach(p => p.classList.remove('active'));
        document.getElementById('msf-auth-forgot').classList.add('active');
    });

    // Back to login from forgot
    document.getElementById('msf-back-to-login').addEventListener('click', (e) => {
        e.preventDefault();
        document.querySelectorAll('.msf-auth-panel').forEach(p => p.classList.remove('active'));
        document.getElementById('msf-auth-email').classList.add('active');
    });

    // Email Login
    document.getElementById('msf-email-login').addEventListener('click', async () => {
        const email = document.getElementById('msf-email').value.trim();
        const password = document.getElementById('msf-password').value;
        const btn = document.getElementById('msf-email-login');

        if (!email || !password) {
            showToast('Please enter email and password.', 'warning');
            return;
        }

        setButtonLoading(btn, true);
        try {
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;

            const name = data.user?.user_metadata?.name || email.split('@')[0];
            showToast(`Signed in as ${name}! ✅`, 'success');

            // Pre-fill parent details
            document.getElementById('msf-parent-name').value = name;
            document.getElementById('msf-parent-email').value = email;

            goToMsfStep(2);
        } catch (error) {
            showToast(error.message || 'Login failed.', 'error');
        } finally {
            setButtonLoading(btn, false);
        }
    });

    // Email Signup
    document.getElementById('msf-signup-btn').addEventListener('click', async () => {
        const name = document.getElementById('msf-signup-name').value.trim();
        const email = document.getElementById('msf-signup-email').value.trim();
        const password = document.getElementById('msf-signup-password').value;
        const btn = document.getElementById('msf-signup-btn');

        if (!name || !email || !password) {
            showToast('Please fill in all fields.', 'warning');
            return;
        }
        if (password.length < 6) {
            showToast('Password must be at least 6 characters.', 'warning');
            return;
        }

        setButtonLoading(btn, true);
        try {
            const { data, error } = await supabase.auth.signUp({
                email, password,
                options: { data: { name, full_name: name }, emailRedirectTo: SITE_URL }
            });
            if (error) throw error;

            showToast(`Account created! Welcome, ${name}! 🎉`, 'success');

            document.getElementById('msf-parent-name').value = name;
            document.getElementById('msf-parent-email').value = email;

            if (data.session) {
                handleAuthStateChange(data.user);
            } else {
                showToast('Check your email to verify your account.', 'info');
            }

            goToMsfStep(2);
        } catch (error) {
            showToast(error.message || 'Signup failed.', 'error');
        } finally {
            setButtonLoading(btn, false);
        }
    });

    // Phone OTP (Send)
    document.getElementById('msf-send-otp').addEventListener('click', async () => {
        const code = document.getElementById('msf-phone-code').value;
        const phone = document.getElementById('msf-phone').value.trim();
        const btn = document.getElementById('msf-send-otp');

        if (!phone) {
            showToast('Please enter your phone number.', 'warning');
            return;
        }

        setButtonLoading(btn, true);
        try {
            const { error } = await supabase.auth.signInWithOtp({ phone: code + phone });
            if (error) throw error;

            showToast('OTP sent! Check your phone. 📲', 'success');
            document.getElementById('msf-otp-group').classList.remove('hidden');
        } catch (error) {
            showToast(error.message || 'Failed to send OTP. Try email login instead.', 'error');
        } finally {
            setButtonLoading(btn, false);
        }
    });

    // Phone OTP (Verify)
    document.getElementById('msf-verify-otp').addEventListener('click', async () => {
        const code = document.getElementById('msf-phone-code').value;
        const phone = document.getElementById('msf-phone').value.trim();
        const otp = document.getElementById('msf-otp').value.trim();
        const btn = document.getElementById('msf-verify-otp');

        if (!otp || otp.length < 6) {
            showToast('Please enter the 6-digit OTP.', 'warning');
            return;
        }

        setButtonLoading(btn, true);
        try {
            const { data, error } = await supabase.auth.verifyOtp({
                phone: code + phone, token: otp, type: 'sms'
            });
            if (error) throw error;

            showToast('Phone verified! ✅', 'success');
            goToMsfStep(2);
        } catch (error) {
            showToast(error.message || 'OTP verification failed.', 'error');
        } finally {
            setButtonLoading(btn, false);
        }
    });

    // Forgot password send
    document.getElementById('msf-forgot-send').addEventListener('click', async () => {
        const email = document.getElementById('msf-forgot-email').value.trim();
        const btn = document.getElementById('msf-forgot-send');

        if (!email) {
            showToast('Please enter your email.', 'warning');
            return;
        }

        setButtonLoading(btn, true);
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: SITE_URL
            });
            if (error) throw error;
            showToast('Password reset link sent! Check your email. 📧', 'success');
        } catch (error) {
            showToast(error.message || 'Failed to send reset link.', 'error');
        } finally {
            setButtonLoading(btn, false);
        }
    });

    // Skip auth (already logged in)
    document.getElementById('msf-skip-btn').addEventListener('click', () => {
        goToMsfStep(2);
    });

    // Back / Next navigation buttons
    document.querySelectorAll('.msf-back-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const goto = parseInt(btn.dataset.goto);
            goToMsfStep(goto);
        });
    });

    document.querySelectorAll('.msf-next-btn:not(.msf-submit-btn)').forEach(btn => {
        btn.addEventListener('click', () => {
            const goto = parseInt(btn.dataset.goto);
            const currentStep = goto - 1;
            if (validateMsfStep(currentStep)) {
                goToMsfStep(goto);
            }
        });
    });

    // Curriculum pill selection
    document.querySelectorAll('.msf-curriculum-pill').forEach(pill => {
        pill.addEventListener('click', () => {
            document.querySelectorAll('.msf-curriculum-pill').forEach(p => p.classList.remove('selected'));
            pill.classList.add('selected');
            document.getElementById('msf-curriculum-value').value = pill.dataset.curriculum;
        });
    });

    // Final Submit (Step 5 → Step 6)
    document.getElementById('msf-final-submit').addEventListener('click', async () => {
        if (!validateMsfStep(5)) return;

        const btn = document.getElementById('msf-final-submit');
        setButtonLoading(btn, true);

        try {
            // Submit as enquiry to Supabase
            const message = `🌸 FREE SESSION REQUEST (Multi-Step Form)
─────────────────────────────
PARENT: ${msfData.parentName}
EMAIL: ${msfData.parentEmail}
PHONE: ${msfData.parentPhone}
ALT PHONE: ${msfData.parentAltPhone}
─────────────────────────────
STUDENT: ${msfData.studentName}
GRADE: ${msfData.studentGrade}
CURRICULUM: ${msfData.curriculum}
─────────────────────────────
SUBJECT: ${msfData.subject}
TIME: ${msfData.timeSlot}
MODE: ${msfData.mode}`;

            await submitEnquiry({
                name: msfData.parentName,
                email: msfData.parentEmail,
                message: message
            });

            // Show confirmation summary
            const summary = document.getElementById('msf-confirm-summary');
            summary.innerHTML = `
                <strong>Student:</strong> ${msfData.studentName} (${msfData.studentGrade})<br>
                <strong>Curriculum:</strong> ${msfData.curriculum}<br>
                <strong>Subject:</strong> ${msfData.subject}<br>
                <strong>Time:</strong> ${msfData.timeSlot} (${msfData.mode})<br>
                <strong>Contact:</strong> ${msfData.parentEmail}
            `;

            goToMsfStep(6);
        } catch (error) {
            showToast('Something went wrong. Please try again.', 'error');
        } finally {
            setButtonLoading(btn, false);
        }
    });

    // Done button (Step 6)
    document.getElementById('msf-done-btn').addEventListener('click', () => {
        closeMultiStepModal();
        // Reset form
        msfData = {
            parentName: '', parentEmail: '', parentPhone: '', parentAltPhone: '',
            studentName: '', studentGrade: '', curriculum: '',
            subject: '', timeSlot: '', mode: 'Online', ctaEmail: ''
        };
    });
}


// ═══════════════════════════════════════════════════════════
// PROGRAM SELECTION MODAL (Pricing → Discovery Call)
// ═══════════════════════════════════════════════════════════

const programModal = document.getElementById('program-modal');
let selectedProgram = { name: '', grades: '', price: 0 };

function openProgramModal() {
    if (!programModal) return;

    // Reset to step 1
    document.querySelectorAll('.pm-step').forEach(s => s.classList.remove('active'));
    document.getElementById('pm-step-1').classList.add('active');

    programModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeProgramModal() {
    if (!programModal) return;
    programModal.classList.remove('active');
    document.body.style.overflow = '';
}

function initProgramModal() {
    if (!programModal) return;

    // Close
    document.getElementById('program-modal-close').addEventListener('click', closeProgramModal);
    programModal.addEventListener('click', (e) => {
        if (e.target === programModal) closeProgramModal();
    });

    // Program card selection
    document.querySelectorAll('.pm-card').forEach(card => {
        card.addEventListener('click', () => {
            selectedProgram.name = card.dataset.program;
            selectedProgram.grades = card.dataset.grades;
            selectedProgram.price = parseInt(card.dataset.price);

            document.getElementById('pm-selected-name').textContent = selectedProgram.name;
            document.getElementById('pm-selected-rate').textContent = `$${selectedProgram.price}`;

            // Go to step 2
            document.querySelectorAll('.pm-step').forEach(s => s.classList.remove('active'));
            document.getElementById('pm-step-2').classList.add('active');
        });
    });

    // Back buttons
    document.getElementById('pm-back-1').addEventListener('click', () => {
        document.querySelectorAll('.pm-step').forEach(s => s.classList.remove('active'));
        document.getElementById('pm-step-1').classList.add('active');
    });

    document.getElementById('pm-back-2').addEventListener('click', () => {
        document.querySelectorAll('.pm-step').forEach(s => s.classList.remove('active'));
        document.getElementById('pm-step-2').classList.add('active');
    });

    // Claim button → show booking form
    document.getElementById('pm-claim-btn').addEventListener('click', () => {
        document.querySelectorAll('.pm-step').forEach(s => s.classList.remove('active'));
        document.getElementById('pm-step-3').classList.add('active');
    });

    // Slot selection
    document.querySelectorAll('.pm-slot').forEach(slot => {
        slot.addEventListener('click', () => {
            document.querySelectorAll('.pm-slot').forEach(s => s.classList.remove('selected'));
            slot.classList.add('selected');
            document.getElementById('pm-slot-value').value = slot.dataset.slot;
        });
    });

    // Booking form submit
    document.getElementById('pm-booking-form').addEventListener('submit', async (e) => {
        e.preventDefault();

        const childName = document.getElementById('pm-child-name').value.trim();
        const childAge = document.getElementById('pm-child-age').value;
        const parentEmail = document.getElementById('pm-parent-email').value.trim();
        const whatsappCode = document.getElementById('pm-whatsapp-code').value;
        const whatsapp = document.getElementById('pm-parent-whatsapp').value.trim();
        const slot = document.getElementById('pm-slot-value').value;
        const btn = document.getElementById('pm-submit-btn');

        if (!childName || !childAge || !parentEmail || !whatsapp) {
            showToast('Please fill in all fields.', 'warning');
            return;
        }
        if (!slot) {
            showToast('Please select a time slot.', 'warning');
            return;
        }

        setButtonLoading(btn, true);

        try {
            const message = `🌸 FREE DISCOVERY CALL (Program Modal)
─────────────────────────────
PROGRAM: ${selectedProgram.name} (${selectedProgram.grades})
PRICE: $${selectedProgram.price}/hour
─────────────────────────────
CHILD: ${childName} (Age ${childAge})
PARENT EMAIL: ${parentEmail}
WHATSAPP: ${whatsappCode} ${whatsapp}
SLOT: ${slot}`;

            await submitEnquiry({
                name: childName,
                email: parentEmail,
                message: message
            });

            // Go to success
            document.querySelectorAll('.pm-step').forEach(s => s.classList.remove('active'));
            document.getElementById('pm-step-4').classList.add('active');
        } catch (error) {
            showToast('Failed to submit. Please try again.', 'error');
        } finally {
            setButtonLoading(btn, false);
        }
    });

    // Done button
    document.getElementById('pm-done-btn').addEventListener('click', closeProgramModal);
}


console.log('✅ App controller loaded — Zenith Pranavi ready!');
