/* ═══════════════════════════════════════════════════════════
   ZENITH PRANAVI — Authentication Module (Unified)
   ═══════════════════════════════════════════════════════════
   All CTA buttons open the unified registration modal.
   Flow: Account → Parent+Student Details → Session → Confirm
   ═══════════════════════════════════════════════════════════ */

// ──────────── DOM REFERENCES ────────────
const authButtons    = document.getElementById('auth-buttons');
const userMenu       = document.getElementById('user-menu');
const homepageEl     = document.getElementById('homepage');
const dashboardEl    = document.getElementById('dashboard');

// ═══════════════════════════════════════════════════════════
// TOAST NOTIFICATION SYSTEM
// ═══════════════════════════════════════════════════════════

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => { if (toast.parentNode) toast.remove(); }, 4000);
}

// ═══════════════════════════════════════════════════════════
// BUTTON LOADING STATE
// ═══════════════════════════════════════════════════════════

function setButtonLoading(button, loading) {
    const btnText   = button.querySelector('.btn-text');
    const btnLoader = button.querySelector('.btn-loader');
    if (loading) {
        if (btnText) btnText.classList.add('hidden');
        if (btnLoader) btnLoader.classList.remove('hidden');
        button.disabled = true;
    } else {
        if (btnText) btnText.classList.remove('hidden');
        if (btnLoader) btnLoader.classList.add('hidden');
        button.disabled = false;
    }
}

// ═══════════════════════════════════════════════════════════
// UNIFIED REGISTRATION MODAL
// ═══════════════════════════════════════════════════════════

const regModal = document.getElementById('register-modal');
let regCurrentStep = 1;
const REG_TOTAL_STEPS = 4;

// Collected data
let regData = {
    parentName: '', parentEmail: '', parentPhone: '', whatsapp: '',
    studentName: '', studentGrade: '', curriculum: '',
    subject: '', timeSlot: '', mode: 'Online'
};

/**
 * Open the unified registration modal
 * @param {string} mode - 'signup' or 'signin'
 * @param {string} prefilledEmail - optional email from CTA
 */
function openRegisterModal(mode = 'signup', prefilledEmail = '') {
    regCurrentStep = 1;
    checkRegAuthState();

    // Pre-fill email if provided
    if (prefilledEmail) {
        const fields = ['reg-email', 'reg-signin-email', 'reg-parent-email'];
        fields.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = prefilledEmail;
        });
    }

    // Show correct tab
    if (mode === 'signin') {
        switchRegTab('signin');
    } else {
        switchRegTab('create');
    }

    goToRegStep(1);
    regModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeRegisterModal() {
    regModal.classList.remove('active');
    document.body.style.overflow = '';
}

function switchRegTab(tab) {
    document.querySelectorAll('.reg-auth-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.reg-auth-panel').forEach(p => p.classList.remove('active'));

    const tabBtn = document.querySelector(`.reg-auth-tab[data-tab="${tab}"]`);
    if (tabBtn) tabBtn.classList.add('active');

    const panel = document.getElementById(`reg-panel-${tab}`);
    if (panel) panel.classList.add('active');

    // Show tabs
    const tabs = document.getElementById('reg-auth-tabs');
    if (tabs) tabs.style.display = '';
}

function goToRegStep(step) {
    regCurrentStep = step;
    document.querySelectorAll('.reg-step').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(`reg-step-${step}`);
    if (target) target.classList.add('active');

    // Update progress
    const bar = document.getElementById('reg-progress-bar');
    bar.style.width = `${(step / REG_TOTAL_STEPS) * 100}%`;

    document.querySelectorAll('.reg-step-dot').forEach(dot => {
        const ds = parseInt(dot.dataset.step);
        dot.classList.remove('active', 'completed');
        if (ds === step) dot.classList.add('active');
        else if (ds < step) dot.classList.add('completed');
    });
}

async function checkRegAuthState() {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        const loggedPanel = document.getElementById('reg-panel-loggedin');
        const createPanel = document.getElementById('reg-panel-create');
        const tabs = document.getElementById('reg-auth-tabs');

        if (session?.user) {
            const name = session.user.user_metadata?.name ||
                        session.user.user_metadata?.full_name ||
                        session.user.email?.split('@')[0] || 'User';
            document.getElementById('reg-logged-name').textContent = `Signed in as ${name}`;
            document.getElementById('reg-parent-name').value = name;
            document.getElementById('reg-parent-email').value = session.user.email || '';

            // Show logged-in panel, hide tabs
            document.querySelectorAll('.reg-auth-panel').forEach(p => p.classList.remove('active'));
            loggedPanel.classList.add('active');
            if (tabs) tabs.style.display = 'none';
        } else {
            loggedPanel.classList.remove('active');
            createPanel.classList.add('active');
            if (tabs) tabs.style.display = '';
        }
    } catch (e) {
        console.error('Reg auth check error:', e);
    }
}

function validateRegStep(step) {
    switch (step) {
        case 2: {
            const parentName = document.getElementById('reg-parent-name').value.trim();
            const parentEmail = document.getElementById('reg-parent-email').value.trim();
            const parentPhone = document.getElementById('reg-parent-phone').value.trim();
            const whatsapp = document.getElementById('reg-whatsapp').value.trim();
            const studentName = document.getElementById('reg-student-name').value.trim();
            const grade = document.getElementById('reg-student-grade').value;
            const curriculum = document.getElementById('reg-student-curriculum').value;

            if (!parentName || !parentEmail || !parentPhone || !whatsapp || !studentName || !grade || !curriculum) {
                showToast('Please fill in all required fields.', 'warning');
                return false;
            }
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(parentEmail)) {
                showToast('Please enter a valid email address.', 'warning');
                return false;
            }

            const phoneCode = document.getElementById('reg-parent-phone-code').value;
            const waCode = document.getElementById('reg-whatsapp-code').value;
            regData.parentName = parentName;
            regData.parentEmail = parentEmail;
            regData.parentPhone = phoneCode + ' ' + parentPhone;
            regData.whatsapp = waCode + ' ' + whatsapp;
            regData.studentName = studentName;
            regData.studentGrade = grade;
            regData.curriculum = curriculum;
            return true;
        }
        case 3: {
            const subject = document.getElementById('reg-subject').value.trim();
            const timeSlot = document.getElementById('reg-time-slot').value;
            if (!subject || !timeSlot) {
                showToast('Please fill in subject and preferred time slot.', 'warning');
                return false;
            }
            regData.subject = subject;
            regData.timeSlot = timeSlot;
            regData.mode = document.getElementById('reg-mode').value;
            return true;
        }
        default:
            return true;
    }
}

function initRegisterModal() {
    if (!regModal) return;

    // Close
    document.getElementById('register-modal-close').addEventListener('click', closeRegisterModal);
    regModal.addEventListener('click', (e) => { if (e.target === regModal) closeRegisterModal(); });

    // Auth tabs
    document.querySelectorAll('.reg-auth-tab').forEach(tab => {
        tab.addEventListener('click', () => switchRegTab(tab.dataset.tab));
    });

    // Forgot password
    document.getElementById('reg-forgot-trigger').addEventListener('click', (e) => {
        e.preventDefault();
        document.querySelectorAll('.reg-auth-panel').forEach(p => p.classList.remove('active'));
        document.getElementById('reg-panel-forgot').classList.add('active');
        document.getElementById('reg-auth-tabs').style.display = 'none';
    });

    // Back to sign in
    document.getElementById('reg-back-to-signin').addEventListener('click', (e) => {
        e.preventDefault();
        switchRegTab('signin');
    });

    // Create Account
    document.getElementById('reg-create-btn').addEventListener('click', async () => {
        const name = document.getElementById('reg-name').value.trim();
        const email = document.getElementById('reg-email').value.trim();
        const password = document.getElementById('reg-password').value;
        const btn = document.getElementById('reg-create-btn');

        if (!name || !email || !password) { showToast('Please fill in all fields.', 'warning'); return; }
        if (password.length < 6) { showToast('Password must be at least 6 characters.', 'warning'); return; }

        setButtonLoading(btn, true);
        try {
            const { data, error } = await supabase.auth.signUp({
                email, password,
                options: { data: { name, full_name: name }, emailRedirectTo: SITE_URL }
            });
            if (error) throw error;
            showToast(`Account created! Welcome, ${name}!`, 'success');
            document.getElementById('reg-parent-name').value = name;
            document.getElementById('reg-parent-email').value = email;
            if (data.session) handleAuthStateChange(data.user);
            goToRegStep(2);
        } catch (error) {
            showToast(error.message || 'Signup failed.', 'error');
        } finally { setButtonLoading(btn, false); }
    });

    // Sign In
    document.getElementById('reg-signin-btn').addEventListener('click', async () => {
        const email = document.getElementById('reg-signin-email').value.trim();
        const password = document.getElementById('reg-signin-password').value;
        const btn = document.getElementById('reg-signin-btn');

        if (!email || !password) { showToast('Please enter email and password.', 'warning'); return; }

        setButtonLoading(btn, true);
        try {
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;
            const name = data.user?.user_metadata?.name || email.split('@')[0];
            showToast(`Welcome back, ${name}!`, 'success');
            document.getElementById('reg-parent-name').value = name;
            document.getElementById('reg-parent-email').value = email;
            handleAuthStateChange(data.user);
            goToRegStep(2);
        } catch (error) {
            showToast(error.message || 'Login failed.', 'error');
        } finally { setButtonLoading(btn, false); }
    });

    // Forgot password
    document.getElementById('reg-forgot-btn').addEventListener('click', async () => {
        const email = document.getElementById('reg-forgot-email').value.trim();
        const btn = document.getElementById('reg-forgot-btn');
        if (!email) { showToast('Please enter your email.', 'warning'); return; }
        setButtonLoading(btn, true);
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: SITE_URL });
            if (error) throw error;
            showToast('Password reset link sent! Check your email.', 'success');
        } catch (error) {
            showToast(error.message || 'Failed to send reset link.', 'error');
        } finally { setButtonLoading(btn, false); }
    });

    // Skip (already logged in)
    document.getElementById('reg-skip-btn').addEventListener('click', () => goToRegStep(2));

    // Back / Next navigation
    document.querySelectorAll('.reg-back-btn').forEach(btn => {
        btn.addEventListener('click', () => goToRegStep(parseInt(btn.dataset.goto)));
    });
    document.querySelectorAll('.reg-next-btn:not(.reg-submit-btn)').forEach(btn => {
        btn.addEventListener('click', () => {
            const goto = parseInt(btn.dataset.goto);
            if (validateRegStep(goto - 1)) goToRegStep(goto);
        });
    });

    // Final Submit
    document.getElementById('reg-submit-btn').addEventListener('click', async () => {
        if (!validateRegStep(3)) return;
        const btn = document.getElementById('reg-submit-btn');
        setButtonLoading(btn, true);

        try {
            const message = `FREE SESSION REQUEST
Parent: ${regData.parentName}
Email: ${regData.parentEmail}
Phone: ${regData.parentPhone}
WhatsApp: ${regData.whatsapp}
Student: ${regData.studentName}
Grade: ${regData.studentGrade}
Curriculum: ${regData.curriculum}
Subject: ${regData.subject}
Time: ${regData.timeSlot}
Mode: ${regData.mode}`;

            await submitEnquiry({ name: regData.parentName, email: regData.parentEmail, message });

            // Show confirmation summary
            document.getElementById('reg-confirm-summary').innerHTML = `
                <strong>Student:</strong> ${regData.studentName} (${regData.studentGrade})<br>
                <strong>Curriculum:</strong> ${regData.curriculum}<br>
                <strong>Subject:</strong> ${regData.subject}<br>
                <strong>Time:</strong> ${regData.timeSlot} (${regData.mode})<br>
                <strong>Contact:</strong> ${regData.parentEmail}
            `;
            goToRegStep(4);
        } catch (error) {
            showToast('Something went wrong. Please try again.', 'error');
        } finally { setButtonLoading(btn, false); }
    });

    // Done
    document.getElementById('reg-done-btn').addEventListener('click', () => {
        closeRegisterModal();
        regData = { parentName: '', parentEmail: '', parentPhone: '', whatsapp: '', studentName: '', studentGrade: '', curriculum: '', subject: '', timeSlot: '', mode: 'Online' };
    });
}

// ═══════════════════════════════════════════════════════════
// AUTH STATE MANAGEMENT
// ═══════════════════════════════════════════════════════════

function handleAuthStateChange(user) {
    if (user) {
        const userName = user.user_metadata?.name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Student';
        const initial = userName.charAt(0).toUpperCase();
        document.getElementById('user-initial').textContent = initial;
        document.getElementById('user-display-name').textContent = userName;
        document.getElementById('dash-user-name').textContent = userName;
        authButtons.classList.add('hidden');
        userMenu.classList.remove('hidden');
    }
}

function showDashboard() {
    homepageEl.classList.add('hidden');
    dashboardEl.classList.remove('hidden');
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showHomepage() {
    dashboardEl.classList.add('hidden');
    homepageEl.classList.remove('hidden');
    authButtons.classList.remove('hidden');
    userMenu.classList.add('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function handleLogout() {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        showToast('Logged out successfully.', 'info');
        showHomepage();
    } catch (error) {
        showToast('Logout failed.', 'error');
    }
}

// ═══════════════════════════════════════════════════════════
// EMAIL CONFIRMATION HANDLER
// ═══════════════════════════════════════════════════════════

async function handleEmailConfirmationRedirect() {
    const hash = window.location.hash;
    const params = new URLSearchParams(window.location.search);
    const hasHashToken = hash && (hash.includes('access_token') || hash.includes('type=signup') || hash.includes('type=recovery') || hash.includes('type=email'));
    const hasCodeParam = params.has('code');

    if (hasHashToken || hasCodeParam) {
        try {
            if (hasCodeParam) {
                const code = params.get('code');
                const { data, error } = await supabase.auth.exchangeCodeForSession(code);
                if (error) throw error;
                if (data?.session?.user) {
                    const name = data.session.user.user_metadata?.name || data.session.user.email?.split('@')[0] || 'Student';
                    showToast(`Email confirmed! Welcome, ${name}!`, 'success');
                }
            } else {
                const { data: { session }, error } = await supabase.auth.getSession();
                if (error) throw error;
                if (session?.user) {
                    const name = session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Student';
                    showToast(`Email confirmed! Welcome, ${name}!`, 'success');
                }
            }
            if (window.history.replaceState) window.history.replaceState(null, '', window.location.pathname);
            return true;
        } catch (error) {
            showToast('Email confirmation failed. Please try signing in.', 'error');
            if (window.history.replaceState) window.history.replaceState(null, '', window.location.pathname);
            return false;
        }
    }
    return false;
}

// ═══════════════════════════════════════════════════════════
// SESSION PERSISTENCE
// ═══════════════════════════════════════════════════════════

async function checkExistingSession() {
    try {
        await handleEmailConfirmationRedirect();
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (session?.user) {
            handleAuthStateChange(session.user);
            showDashboard();
            if (typeof loadDashboardData === 'function') loadDashboardData(session.user);
        } else {
            showHomepage();
        }
    } catch (error) {
        showHomepage();
    }
}

// Auth state listener
supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' && session?.user) handleAuthStateChange(session.user);
    else if (event === 'SIGNED_OUT') showHomepage();
});

// ═══════════════════════════════════════════════════════════
// EVENT LISTENERS
// ═══════════════════════════════════════════════════════════

// Nav buttons → open unified modal
document.getElementById('signin-btn').addEventListener('click', () => openRegisterModal('signin'));
document.getElementById('getstarted-btn').addEventListener('click', () => openRegisterModal('signup'));

// Close on Escape
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeRegisterModal();
});

// Logout & Dashboard
document.getElementById('logout-btn').addEventListener('click', handleLogout);
document.getElementById('dashboard-btn').addEventListener('click', () => {
    showDashboard();
    if (typeof loadDashboardData === 'function') {
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) loadDashboardData(user);
        });
    }
});

// ═══════════════════════════════════════════════════════════
// THEME TOGGLE
// ═══════════════════════════════════════════════════════════

function initThemeToggle() {
    const toggle = document.getElementById('theme-toggle');
    const html = document.documentElement;

    // Load saved theme
    const saved = localStorage.getItem('zp-theme');
    if (saved) html.setAttribute('data-theme', saved);

    toggle.addEventListener('click', () => {
        const current = html.getAttribute('data-theme') || 'light';
        const next = current === 'light' ? 'dark' : 'light';
        html.setAttribute('data-theme', next);
        localStorage.setItem('zp-theme', next);
    });
}

console.log('Auth module loaded');
