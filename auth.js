/* ═══════════════════════════════════════════════════════════
   ZENITH PRANAVI — Authentication Module
   ═══════════════════════════════════════════════════════════
   Handles: Signup, Login, Logout, Session Persistence
   Uses: Supabase Auth v2 (async/await)
   ═══════════════════════════════════════════════════════════ */

// ──────────── DOM REFERENCES ────────────
const authModal      = document.getElementById('auth-modal');
const loginForm      = document.getElementById('login-form');
const signupForm     = document.getElementById('signup-form');
const modalTitle     = document.getElementById('modal-title');
const modalSubtitle  = document.getElementById('modal-subtitle');
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

    const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
    toast.innerHTML = `<span>${icons[type] || 'ℹ️'}</span> ${message}`;

    container.appendChild(toast);

    setTimeout(() => {
        if (toast.parentNode) toast.remove();
    }, 4000);
}

// ═══════════════════════════════════════════════════════════
// MODAL CONTROLS
// ═══════════════════════════════════════════════════════════

function openAuthModal(mode = 'login') {
    authModal.classList.add('active');
    document.body.style.overflow = 'hidden';

    if (mode === 'signup') {
        showSignupForm();
    } else {
        showLoginForm();
    }
}

function closeAuthModal() {
    authModal.classList.remove('active');
    document.body.style.overflow = '';
    loginForm.reset();
    signupForm.reset();
}

function showLoginForm() {
    loginForm.classList.remove('hidden');
    signupForm.classList.add('hidden');
    modalTitle.textContent = 'Welcome Back';
    modalSubtitle.textContent = 'Sign in to continue your learning journey';
}

function showSignupForm() {
    loginForm.classList.add('hidden');
    signupForm.classList.remove('hidden');
    modalTitle.textContent = 'Join Zenith Pranavi';
    modalSubtitle.textContent = 'Create your account and start learning today';
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
// SIGN UP
// ═══════════════════════════════════════════════════════════

async function handleSignup(e) {
    e.preventDefault();

    const name      = document.getElementById('signup-name').value.trim();
    const email     = document.getElementById('signup-email').value.trim();
    const password  = document.getElementById('signup-password').value;
    const submitBtn = document.getElementById('signup-submit');

    if (!name || !email || !password) {
        showToast('Please fill in all fields', 'warning');
        return;
    }

    if (password.length < 6) {
        showToast('Password must be at least 6 characters', 'warning');
        return;
    }

    setButtonLoading(submitBtn, true);

    try {
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    name: name,
                    full_name: name
                }
            }
        });

        if (error) throw error;

        if (data.user) {
            showToast(`Welcome to Zenith Pranavi, ${name}! 🎉`, 'success');
            closeAuthModal();

            // If email confirmation is disabled, user is logged in immediately
            if (data.session) {
                handleAuthStateChange(data.user);
            } else {
                showToast('Please check your email to verify your account.', 'info');
            }
        }
    } catch (error) {
        console.error('Signup error:', error);
        if (error.message && error.message.includes('already registered')) {
            showToast('This email is already registered. Please sign in.', 'error');
        } else {
            showToast(error.message || 'Signup failed. Please try again.', 'error');
        }
    } finally {
        setButtonLoading(submitBtn, false);
    }
}

// ═══════════════════════════════════════════════════════════
// LOGIN
// ═══════════════════════════════════════════════════════════

async function handleLogin(e) {
    e.preventDefault();

    const email     = document.getElementById('login-email').value.trim();
    const password  = document.getElementById('login-password').value;
    const submitBtn = document.getElementById('login-submit');

    if (!email || !password) {
        showToast('Please enter email and password', 'warning');
        return;
    }

    setButtonLoading(submitBtn, true);

    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) throw error;

        if (data.user) {
            const userName = data.user.user_metadata?.name ||
                           data.user.user_metadata?.full_name ||
                           email.split('@')[0];

            showToast(`Welcome back, ${userName}! 🎉`, 'success');
            closeAuthModal();
            handleAuthStateChange(data.user);
        }
    } catch (error) {
        console.error('Login error:', error);
        if (error.message && error.message.includes('Invalid login')) {
            showToast('Invalid email or password. Please try again.', 'error');
        } else {
            showToast(error.message || 'Login failed. Please try again.', 'error');
        }
    } finally {
        setButtonLoading(submitBtn, false);
    }
}

// ═══════════════════════════════════════════════════════════
// LOGOUT
// ═══════════════════════════════════════════════════════════

async function handleLogout() {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;

        showToast('Logged out successfully. See you soon! 👋', 'info');
        showHomepage();
    } catch (error) {
        console.error('Logout error:', error);
        showToast('Logout failed. Please try again.', 'error');
    }
}

// ═══════════════════════════════════════════════════════════
// AUTH STATE MANAGEMENT
// ═══════════════════════════════════════════════════════════

function handleAuthStateChange(user) {
    if (user) {
        const userName = user.user_metadata?.name ||
                        user.user_metadata?.full_name ||
                        user.email?.split('@')[0] ||
                        'Student';
        const initial = userName.charAt(0).toUpperCase();

        // Update all UI elements
        document.getElementById('user-initial').textContent = initial;
        document.getElementById('user-display-name').textContent = userName;
        document.getElementById('dash-user-name').textContent = userName;

        // Toggle nav buttons
        authButtons.classList.add('hidden');
        userMenu.classList.remove('hidden');

        // Switch to dashboard
        showDashboard();

        // Load dashboard data
        if (typeof loadDashboardData === 'function') {
            loadDashboardData(user);
        }
    } else {
        showHomepage();
    }
}

function showDashboard() {
    homepageEl.classList.add('hidden');
    dashboardEl.classList.remove('hidden');

    // Clear active nav state
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showHomepage() {
    dashboardEl.classList.add('hidden');
    homepageEl.classList.remove('hidden');

    // Reset nav buttons
    authButtons.classList.remove('hidden');
    userMenu.classList.add('hidden');

    // Reload homepage tutors
    if (typeof loadTutors === 'function') {
        loadTutors();
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ═══════════════════════════════════════════════════════════
// SESSION PERSISTENCE (Auto-Login on page load)
// ═══════════════════════════════════════════════════════════

async function checkExistingSession() {
    try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) throw error;

        if (session?.user) {
            console.log('✅ Active session found — auto-login');
            handleAuthStateChange(session.user);
        } else {
            console.log('ℹ️ No active session — showing homepage');
            showHomepage();
        }
    } catch (error) {
        console.error('Session check error:', error);
        showHomepage();
    }
}

// ═══════════════════════════════════════════════════════════
// AUTH STATE LISTENER (Real-time)
// ═══════════════════════════════════════════════════════════

supabase.auth.onAuthStateChange((event, session) => {
    console.log('🔐 Auth event:', event);

    if (event === 'SIGNED_IN' && session?.user) {
        handleAuthStateChange(session.user);
    } else if (event === 'SIGNED_OUT') {
        showHomepage();
    } else if (event === 'TOKEN_REFRESHED') {
        console.log('🔄 Session token refreshed');
    }
});

// ═══════════════════════════════════════════════════════════
// EVENT LISTENERS
// ═══════════════════════════════════════════════════════════

// Modal open/close
document.getElementById('signin-btn').addEventListener('click', () => openAuthModal('login'));
document.getElementById('getstarted-btn').addEventListener('click', () => openAuthModal('signup'));
document.getElementById('modal-close').addEventListener('click', closeAuthModal);

// Close modal on overlay click
authModal.addEventListener('click', (e) => {
    if (e.target === authModal) closeAuthModal();
});

// Close modals on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeAuthModal();
        if (typeof closeBookingModal === 'function') closeBookingModal();
    }
});

// Toggle between login/signup forms
document.getElementById('switch-to-signup').addEventListener('click', (e) => {
    e.preventDefault();
    showSignupForm();
});

document.getElementById('switch-to-login').addEventListener('click', (e) => {
    e.preventDefault();
    showLoginForm();
});

// Form submissions
loginForm.addEventListener('submit', handleLogin);
signupForm.addEventListener('submit', handleSignup);

// Logout
document.getElementById('logout-btn').addEventListener('click', handleLogout);

// Dashboard button
document.getElementById('dashboard-btn').addEventListener('click', showDashboard);

// Hero CTA buttons
document.getElementById('hero-begin-btn').addEventListener('click', () => openAuthModal('signup'));
document.getElementById('hero-talk-btn').addEventListener('click', () => {
    document.getElementById('contact').scrollIntoView({ behavior: 'smooth' });
});

// Pricing "Book Now" buttons → require auth
document.querySelectorAll('.pricing-book-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            showDashboard();
            setTimeout(() => {
                document.getElementById('book-section').scrollIntoView({ behavior: 'smooth' });
            }, 300);
        } else {
            openAuthModal('signup');
        }
    });
});

console.log('✅ Auth module loaded');
