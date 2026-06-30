// --- LUXE RESERVATION INTERACTIVE PIPELINE ---
document.addEventListener('DOMContentLoaded', () => {
    const bookingForm = document.getElementById('bookingForm');
    const submitBtn = document.getElementById('submitBtn');
    const bgMatrix = document.getElementById('bgMatrix');
    const formContainer = document.getElementById('formContainer');
    const backLink = document.getElementById('backLink');

    // 1. Min Date Sync Locking
    const datePicker = document.getElementById('date');
    if(datePicker) {
        const tzOffset = (new Date()).getTimezoneOffset() * 60000;
        const localISOTime = (new Date(Date.now() - tzOffset)).toISOString().split('T')[0];
        datePicker.setAttribute('min', localISOTime);
    }

    // 2. Event Submission Engine
    if (bookingForm) {
        bookingForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // 🔥 Dynamic execution blocking (Stops immediate reload!)

            const originalText = submitBtn.innerText;

            // Mapping parameters dynamically
            const formData = {
                customer_name: document.getElementById('customer_name')?.value.trim() || '',
                phone: document.getElementById('phone')?.value.trim() || '',
                guests: parseInt(document.getElementById('guests')?.value || 1, 10),
                date: document.getElementById('date')?.value || '',
                time: document.getElementById('time')?.value || '19:00'
            };

            // Phone Validation
            if (formData.phone.length !== 10 || isNaN(formData.phone)) {
                alert("Bhai, valid 10-digit phone number daalo!");
                return;
            }

            // Lock HUD Controls & Start Warp Speed Vector Graphics
            submitBtn.innerText = "RESERVING...";
            submitBtn.disabled = true;
            
            if (bgMatrix) bgMatrix.classList.add('warp-speed');
            if (formContainer) formContainer.classList.add('submitted-state');
            if (backLink) backLink.style.opacity = '0';

            try {
                // Fetch Request directly mapping backend transaction router
                const response = await fetch('/api/bookings', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });

                if (!response.ok) {
                    throw new Error(`HTTP network error code: ${response.status}`);
                }

                const result = await response.json();

                if (result.success) {
                    const generatedBookingID = result.bookingID || "SUCCESS";
                    localStorage.setItem('lastBookingId', generatedBookingID);
                    
                    bookingForm.reset();
                    
                    setTimeout(() => {
                        alert("🎉 Excellent! Your table has been booked.\nBooking ID: " + generatedBookingID);
                        window.location.href = 'index.html';
                    }, 600);
                    
                } else {
                    alert("Backend Error: " + (result.message || "Booking Failed😔😔."));
                    resetUI(originalText);
                }
            } catch (error) {
                console.error("Pipeline breakdown stack:", error);
                alert("🚨 SERVER CONNECTIVITY ERROR!\n\nCheck karo aapka Node backend server chal raha hai ya nahi?");
                resetUI(originalText);
            }
        });
    }

    function resetUI(originalText) {
        if (bgMatrix) bgMatrix.classList.remove('warp-speed');
        if (formContainer) formContainer.classList.remove('submitted-state');
        if (backLink) backLink.style.opacity = '1';
        if (submitBtn) {
            submitBtn.innerText = originalText;
            submitBtn.disabled = false;
        }
    }
});