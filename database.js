/* ═══════════════════════════════════════════════════════════
   ZENITH PRANAVI — Database Module
   Handles: Bookings, Enquiries, Dashboard Data
   ═══════════════════════════════════════════════════════════ */

// ═══════════════════════════════════════════════════════════
// BOOKING MANAGEMENT
// ═══════════════════════════════════════════════════════════

async function createBooking(bookingData) {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            showToast('Please log in to book a session.', 'warning');
            openRegisterModal('signin');
            return null;
        }
        const userName = user.user_metadata?.name ||
                        user.user_metadata?.full_name ||
                        user.email?.split('@')[0] || 'Student';
        const booking = {
            user_id: user.id,
            student_name: userName,
            tutor_name: bookingData.tutorName,
            subject: bookingData.subject,
            booking_date: bookingData.date,
            booking_time: bookingData.time,
            price: bookingData.price,
            status: 'pending'
        };
        const { data, error } = await supabase.from('bookings').insert([booking]).select();
        if (error) throw error;
        showToast('Session booked successfully!', 'success');
        return data?.[0] || null;
    } catch (error) {
        console.error('Booking error:', error);
        showToast('Failed to create booking. Please try again.', 'error');
        return null;
    }
}

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
        return [];
    }
}

async function renderBookingsTable() {
    const bookings = await fetchUserBookings();
    const tbody = document.getElementById('bookings-tbody');
    const totalEl = document.getElementById('total-bookings-count');
    const confirmedEl = document.getElementById('confirmed-bookings-count');
    const pendingEl = document.getElementById('pending-bookings-count');

    if (totalEl) totalEl.textContent = bookings.length;
    if (confirmedEl) confirmedEl.textContent = bookings.filter(b => b.status === 'confirmed').length;
    if (pendingEl) pendingEl.textContent = bookings.filter(b => b.status === 'pending').length;

    if (!tbody) return;

    if (bookings.length === 0) {
        tbody.innerHTML = '<tr class="empty-row"><td colspan="6">No sessions yet. Book your first session above.</td></tr>';
        return;
    }

    tbody.innerHTML = bookings.map(function(booking) {
        var formattedDate = new Date(booking.booking_date).toLocaleDateString('en-AU', {
            day: 'numeric', month: 'short', year: 'numeric'
        });
        return '<tr>' +
            '<td><strong>' + (booking.tutor_name || '-') + '</strong></td>' +
            '<td>' + booking.subject + '</td>' +
            '<td>' + formattedDate + '</td>' +
            '<td>' + booking.booking_time + '</td>' +
            '<td>$' + booking.price + '</td>' +
            '<td><span class="status-badge ' + booking.status + '">' + booking.status + '</span></td>' +
        '</tr>';
    }).join('');
}


// ═══════════════════════════════════════════════════════════
// ENQUIRY MANAGEMENT
// ═══════════════════════════════════════════════════════════

async function submitEnquiry(enquiryData) {
    try {
        const { error } = await supabase.from('enquiries').insert([{
            name: enquiryData.name,
            email: enquiryData.email,
            message: enquiryData.message
        }]);
        if (error) throw error;
        showToast('Message sent! We will get back to you soon.', 'success');
        return true;
    } catch (error) {
        console.error('Enquiry error:', error);
        showToast('Failed to send message. Please try again.', 'error');
        return false;
    }
}


// ═══════════════════════════════════════════════════════════
// DASHBOARD DATA LOADER
// ═══════════════════════════════════════════════════════════

async function loadDashboardData(user) {
    await renderBookingsTable();
}
