/* ═══════════════════════════════════════════════════════════
   ZENITH PRANAVI — Database Module
   ═══════════════════════════════════════════════════════════
   Handles: Tutors (fetch/render), Bookings (CRUD), Enquiries
   Tables:  tutors, bookings, enquiries
   Uses:    Supabase JS v2 (async/await)
   ═══════════════════════════════════════════════════════════ */

// ═══════════════════════════════════════════════════════════
// TUTOR MANAGEMENT
// ═══════════════════════════════════════════════════════════

/**
 * Fetch all active tutors from Supabase, ordered by rating (desc)
 */
async function fetchTutors() {
    try {
        const { data, error } = await supabase
            .from('tutors')
            .select('*')
            .eq('status', 'active')
            .order('rating', { ascending: false });

        if (error) throw error;
        console.log(`✅ Loaded ${data?.length || 0} tutors`);
        return data || [];
    } catch (error) {
        console.error('❌ Error fetching tutors:', error.message || error);
        showToast('Failed to load tutors. Please refresh the page.', 'error');
        return [];
    }
}

/**
 * Render tutor cards into a grid container
 * @param {Array} tutors - Array of tutor objects from Supabase
 * @param {string} containerId - Target DOM element ID
 * @param {boolean} showBookButton - Show "Book Session" button per card
 */
function renderTutorCards(tutors, containerId, showBookButton = false) {
    const container = document.getElementById(containerId);

    if (!tutors || tutors.length === 0) {
        container.innerHTML = `
            <div style="text-align:center; padding:60px 20px; color:var(--text-light); grid-column:1/-1;">
                <p style="font-size:1.1rem; font-style:italic;">No tutors available at the moment. Please check back later.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = tutors.map(tutor => {
        const initials   = tutor.name.split(' ').map(n => n[0]).join('').substring(0, 2);
        const subjectHTML = tutor.subjects.map(s => `<span class="subject-tag">${s}</span>`).join('');
        const fullStars  = Math.floor(tutor.rating);
        const halfStar   = tutor.rating % 1 >= 0.5 ? '½' : '';
        const stars      = '★'.repeat(fullStars) + halfStar;

        return `
            <div class="tutor-card" data-tutor-id="${tutor.id}">
                <div class="tutor-header">
                    <div class="tutor-avatar">${initials}</div>
                    <div>
                        <div class="tutor-name">${tutor.name}</div>
                        <div class="tutor-status ${tutor.status === 'active' ? '' : 'inactive'}">
                            ● ${tutor.status === 'active' ? 'Available' : 'Unavailable'}
                        </div>
                    </div>
                </div>
                <div class="tutor-subjects">${subjectHTML}</div>
                <div class="tutor-meta">
                    <div class="tutor-price">$${tutor.price_hour}<span>/hour</span></div>
                    <div>
                        <div class="tutor-rating">
                            <span class="stars">${stars}</span>
                            <span>${tutor.rating}</span>
                        </div>
                        <div class="tutor-sessions">${tutor.sessions_count} sessions</div>
                    </div>
                </div>
                ${showBookButton ? `
                    <button class="btn btn-primary btn-full tutor-book-btn"
                            data-tutor-name="${tutor.name}"
                            data-tutor-price="${tutor.price_hour}"
                            data-tutor-subjects='${JSON.stringify(tutor.subjects)}'>
                        Book Session
                    </button>
                ` : ''}
            </div>
        `;
    }).join('');

    // Attach quick-book listeners if dashboard mode
    if (showBookButton) {
        container.querySelectorAll('.tutor-book-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                openBookingModal(
                    btn.dataset.tutorName,
                    parseInt(btn.dataset.tutorPrice),
                    JSON.parse(btn.dataset.tutorSubjects)
                );
            });
        });
    }
}

/**
 * Load tutors into homepage grid (no book button)
 */
async function loadTutors() {
    const tutors = await fetchTutors();
    renderTutorCards(tutors, 'tutors-grid', false);
}

/**
 * Load tutors into dashboard grid (with book buttons) — kept for future use
 */
async function loadDashboardTutors() {
    // Dashboard now uses Year selector instead of tutor list
    // This function is kept for backwards compatibility
    console.log('ℹ️ Dashboard uses Year selector — tutor list not shown');
}


// ═══════════════════════════════════════════════════════════
// BOOKING MANAGEMENT
// ═══════════════════════════════════════════════════════════

/**
 * Create a new booking in the bookings table
 * @param {Object} bookingData - { tutorName, subject, date, time, price }
 * @returns {Object|null} Created booking or null on failure
 */
async function createBooking(bookingData) {
    try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            showToast('Please log in to book a session.', 'warning');
            openAuthModal('login');
            return null;
        }

        const userName = user.user_metadata?.name ||
                        user.user_metadata?.full_name ||
                        user.email?.split('@')[0] ||
                        'Student';

        const booking = {
            user_id:      user.id,
            student_name: userName,
            tutor_name:   bookingData.tutorName,
            subject:      bookingData.subject,
            booking_date: bookingData.date,
            booking_time: bookingData.time,
            price:        bookingData.price,
            status:       'pending'
        };

        const { data, error } = await supabase
            .from('bookings')
            .insert([booking])
            .select();

        if (error) throw error;

        showToast('Session booked successfully! 🎉', 'success');
        return data?.[0] || null;
    } catch (error) {
        console.error('Booking error:', error);
        showToast('Failed to create booking. Please try again.', 'error');
        return null;
    }
}

/**
 * Fetch all bookings for the current authenticated user
 */
async function fetchUserBookings() {
    try {
        const { data, error } = await supabase
            .from('bookings')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching bookings:', error);
        showToast('Failed to load bookings.', 'error');
        return [];
    }
}

/**
 * Render the bookings table + update stats counters
 */
async function renderBookingsTable() {
    const bookings = await fetchUserBookings();
    const tbody = document.getElementById('bookings-tbody');

    // Update dashboard stat counters
    document.getElementById('total-bookings-count').textContent = bookings.length;
    document.getElementById('confirmed-bookings-count').textContent =
        bookings.filter(b => b.status === 'confirmed').length;
    document.getElementById('pending-bookings-count').textContent =
        bookings.filter(b => b.status === 'pending').length;

    if (bookings.length === 0) {
        tbody.innerHTML = `
            <tr class="empty-row">
                <td colspan="6">No bookings yet. Book your first session above! 📖</td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = bookings.map(booking => {
        const formattedDate = new Date(booking.booking_date).toLocaleDateString('en-AU', {
            day: 'numeric', month: 'short', year: 'numeric'
        });

        return `
            <tr>
                <td><strong>${booking.tutor_name || '—'}</strong></td>
                <td>${booking.subject}</td>
                <td>${formattedDate}</td>
                <td>${booking.booking_time}</td>
                <td>$${booking.price}</td>
                <td><span class="status-badge ${booking.status}">${booking.status}</span></td>
            </tr>
        `;
    }).join('');
}


// ═══════════════════════════════════════════════════════════
// ENQUIRY MANAGEMENT
// ═══════════════════════════════════════════════════════════

/**
 * Submit a contact form enquiry (public — no auth required)
 * @param {Object} enquiryData - { name, email, message }
 * @returns {boolean} Success/failure
 */
async function submitEnquiry(enquiryData) {
    try {
        const { error } = await supabase
            .from('enquiries')
            .insert([{
                name:    enquiryData.name,
                email:   enquiryData.email,
                message: enquiryData.message
            }]);

        if (error) throw error;

        showToast('Message sent! We\'ll get back to you soon. 📬', 'success');
        return true;
    } catch (error) {
        console.error('Enquiry error:', error);
        showToast('Failed to send message. Please try again.', 'error');
        return false;
    }
}


// ═══════════════════════════════════════════════════════════
// BOOKING MODAL (Quick Book from Tutor Card)
// ═══════════════════════════════════════════════════════════

const bookingModal = document.getElementById('booking-modal');

function openBookingModal(tutorName, price, subjects) {
    document.getElementById('qb-tutor-name').value  = tutorName;
    document.getElementById('qb-tutor-price').value  = price;
    document.getElementById('booking-modal-tutor-info').textContent =
        `with ${tutorName} — $${price}/hour`;

    // Set minimum date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('qb-date').min   = today;
    document.getElementById('qb-date').value = '';
    document.getElementById('qb-subject').value = '';
    document.getElementById('qb-time').value = '';

    bookingModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeBookingModal() {
    bookingModal.classList.remove('active');
    document.body.style.overflow = '';
}

// Booking modal close handlers
document.getElementById('booking-modal-close').addEventListener('click', closeBookingModal);
bookingModal.addEventListener('click', (e) => {
    if (e.target === bookingModal) closeBookingModal();
});


// ═══════════════════════════════════════════════════════════
// DASHBOARD DATA LOADER
// ═══════════════════════════════════════════════════════════

/**
 * Master loader — called after successful login
 */
async function loadDashboardData(user) {
    console.log('📊 Loading dashboard data...');

    // Load tutors and bookings in parallel
    await Promise.all([
        loadDashboardTutors(),
        renderBookingsTable()
    ]);

    console.log('✅ Dashboard data loaded');
}

console.log('✅ Database module loaded');
