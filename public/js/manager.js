// --- CONFIGURATION & SOUNDS ---
const notifySound = new Audio('sounds/notify.mp3'); 
let allBookings = []; // Global data store for bookings filtering
let lastAlertCount = 0; // FIXED: Explicit global state persistence for the audio sync trigger

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded and synchronized with Luxe UI");
    
    // Independent initialization blocks to isolate failures
    try { loadTableStatus(); } catch(e) { console.error("Table Grid Error:", e); }
    try { loadCurrentOffer(); } catch(e) { console.error("Offer Stream Error:", e); } 
    try { loadGalleryAssets(); } catch(e) { console.error("Gallery Stream Error:", e); }
    try { loadReviews(); } catch(e) { console.error("Review Stream Error:", e); }
    try { loadBookings(); } catch(e) { console.error("Booking Ledger Error:", e); }
    try { loadMenu(); } catch(e) { console.error("Menu Stream Error:", e); }
    try { loadFaculty(); } catch(e) { console.error("Faculty Hub Error:", e); }
    try { loadAIInsights(); } catch(e) { console.error("AI Insights Error:", e); }

    // Form Submit Event Listeners Initialization
    initFormListeners();

    // Background Synchronization Intervals
    setInterval(checkNotifications, 4000); // Poll for system alerts every 4 seconds
    setInterval(loadTableStatus, 5000);    // Sync floor layout engine every 5 seconds
});

// --- 1. PERSISTENT ALERTS NOTIFICATION SYSTEM ---
async function checkNotifications() {
    try {
        const res = await fetch('/api/manager/notifications');
        const alerts = await res.json();
        
        // 🌟 LINKED TO FIXED SIDEBAR NODE
        const feedContainer = document.getElementById('notificationFeed');
        if (!feedContainer) return;

        if (alerts && alerts.length > 0) {
            // Render mapping array pipeline cleanly
            feedContainer.innerHTML = alerts.map(a => `
                <div class="alert-node ${a.type === 'bill-request' || a.type === 'shortage' ? 'bill-request' : 'qr-live'}">
                    <button class="alert-dismiss" onclick="clearNotif(${a.id})">✕</button>
                    <div style="font-weight: bold; font-size: 11px; text-transform: uppercase; margin-bottom: 3px; color: var(--gold);">
                        ${a.type || 'SYSTEM NOTICE'}
                    </div>
                    <div>${a.message || a.msg}</div>
                </div>
            `).join('');
            
            // 🔊 OPTIMIZED AUTOMATED AUDIO REPLAY PIPELINE
            // Plays sound ONLY when new alerts arrive, avoiding constant looping restarts
            if (alerts.length > lastAlertCount) {
                notifySound.currentTime = 0; // Hard reset audio pointer asset state
                notifySound.play().catch(e => {
                    console.log("Sound context pending user interaction pipeline adjustment:", e);
                });
            }
        } else {
            feedContainer.innerHTML = `<p style="text-align: center; color: #444; font-size: 12px; margin-top: 20px;">No ongoing floor events.</p>`; 
        }

        // Mutate dynamic state tracking index boundaries safely
        lastAlertCount = alerts ? alerts.length : 0;
    } catch (err) { 
        console.error("Notification pipeline fetch fallback:", err); 
    }
}

async function clearNotif(id) {
    try {
        const res = await fetch('/api/manager/clear-notification', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ id: id })
        });
        if (res.ok) { checkNotifications(); }
    } catch (e) { console.error("Dismiss route execution error:", e); }
}

// --- 2. FLOOR GRID CONTROLLER (RESERVED STATUS SYNCED) ---
async function loadTableStatus() {
    try {
        const res = await fetch('/api/get-tables');
        let tables = await res.json();
        const grid = document.getElementById('tableGrid');
        if(!grid) return;

        // CRITICAL WORKAROUND: Counter frontend override state logic for Table 1
        tables = tables.map(t => {
            if (parseInt(t.table_num) === 1 && t.status !== 'Occupied' && t.status !== 'Reserved') {
                t.status = 'Available'; 
            }
            return t;
        });

        // Render dynamic engine
        grid.innerHTML = tables.map(t => `
            <button class="table-btn ${t.status}" onclick="handleTableClick(${t.table_num}, '${t.status}')">
                <span style="font-size: 1.2rem; font-weight:bold;">${t.table_num}</span>
                <small>${t.status === 'Available' ? 'Ready' : (t.status === 'Occupied' ? 'Dining' : 'Holding')}</small>
            </button>
        `).join('');

        // Global dashboard metrics counter recalculation updates
        const occupiedCount = tables.filter(t => t.status === 'Occupied').length;
        const statActiveTables = document.getElementById('statActiveTables');
        if(statActiveTables) statActiveTables.innerText = occupiedCount;
    } catch (err) { console.error("Floor infrastructure layout mapping error:", err); }
}

function handleTableClick(num, status) {
    const inputField = document.getElementById('manualTableInput');
    if(inputField) inputField.value = num;
    
    if (status === 'Occupied') {
        fetchManualBill(); 
    } else if (status === 'Reserved') {
        alert(`Table ${num} is currently holding an upcoming reservation window.`);
    } else {
        alert(`Table ${num} is Empty and Available.`);
    }
}

// --- 3. AUDIT SETTLEMENT & TRANSACTION ENGINE ---
async function fetchManualBill() {
    const tableInput = document.getElementById('manualTableInput');
    const table = tableInput ? tableInput.value : '';
    if (!table) return alert("System prompt: Table ID required.");

    try {
        const res = await fetch(`/api/get-bill/${table}`);
        if (!res.ok) throw new Error();
        const data = await res.json();

        if (data.items && data.items.length > 0) {
            document.getElementById('billTableNum').innerText = data.table;
            const list = document.getElementById('billItemsList');
            list.innerHTML = data.items.map(i => `
                <div class="bill-item">
                    <span>${i.item_name || i.name} (x${i.qty})</span>
                    <span>₹${i.item_total || (i.price * i.qty)}</span>
                </div>
            `).join('');
            
            document.getElementById('subtotalAmt').innerText = data.subtotal;
            calculateFinalTotal();
            
            // Pop open premium modal architectures
            document.getElementById('modalOverlay').style.display = 'block';
            document.getElementById('billModal').style.display = 'block';
        } else {
            alert(`No active KOT data logs tracked on node table ${table}`);
        }
    } catch (e) { alert("Data fetch pipeline failed or no active records returned for Table " + table); }
}

function calculateFinalTotal() {
    const subDisp = document.getElementById('subtotalAmt');
    const gstDisp = document.getElementById('gstRate');
    const serviceDisp = document.getElementById('serviceCharge');
    const finalDisp = document.getElementById('finalTotalAmt');

    if(!subDisp || !finalDisp) return;

    const sub = parseFloat(subDisp.innerText) || 0;
    const gst = gstDisp ? (parseFloat(gstDisp.value) || 0) : 0;
    const service = serviceDisp ? (parseFloat(serviceDisp.value) || 0) : 0;
    
    const total = sub + (sub * gst / 100) + service;
    finalDisp.innerText = Math.round(total);
}

async function printAndMarkPaid() {
    const table = document.getElementById('billTableNum').innerText;
    const subtotal = document.getElementById('subtotalAmt').innerText;
    const finalTotal = document.getElementById('finalTotalAmt').innerText;
    const gst = document.getElementById('gstRate').value;
    const service = document.getElementById('serviceCharge').value;
    const payMode = document.getElementById('paymentMode').value;

    const printContent = `
        <div style="width:300px; font-family:monospace; text-align:center; padding:10px; color:#000;">
            <h3>👑 LUXE CAFE SELECTION</h3>
            <p>Table Node: ${table} | Mode: ${payMode}</p>
            <p>${new Date().toLocaleString()}</p>
            <hr style="border-top:1px dashed #000;">
            <div>${document.getElementById('billItemsList').innerHTML}</div>
            <hr style="border-top:1px dashed #000;">
            <p align="right">Subtotal: ₹${subtotal}</p>
            <p align="right">GST (${gst}%): ₹${Math.round(subtotal * gst / 100)}</p>
            <p align="right">Service: ₹${service}</p>
            <h3 align="right">GRAND TOTAL: ₹${finalTotal}</h3>
            <p style="margin-top:15px;">--- System Authenticated Receipt ---</p>
        </div>
    `;

    const pWin = window.open('', '_blank', 'width=400,height=600');
    pWin.document.write('<html><body onload="window.print();window.close()">' + printContent + '</body></html>');
    pWin.document.close();

    if(confirm("Print stream execution complete. Push settlement mutation to main architecture?")) {
        await executeSettle(table, finalTotal, payMode);
    }
}

// manager.js ke andar payAndClear ya jo bhi bill clear ka function hai usey aise update karein:
function payAndClear() {
    const tableNum = document.getElementById('billTableNum').innerText; // check your actual ID
    const finalAmount = document.getElementById('finalTotalAmt').innerText; // check your actual ID
    const paymentMode = document.getElementById('paymentMode').value;

    // URL ko badal kar exact '/api/manager/mark-paid' kariye
    fetch('/api/manager/mark-paid', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        // Keys ko backend ke mutabik table_num, amount_paid, aur payment_mode rakhein
        body: JSON.stringify({
            table_num: parseInt(tableNum),
            amount_paid: parseFloat(finalAmount),
            payment_mode: paymentMode
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert(`Table ${tableNum} Bill Mark paid and Table has been cleared!`);
            // Yahan modal close karne aur grid reload karne ka apna logic dalein
            if (typeof loadTables === 'function') loadTables(); 
        } else {
            alert("Error: " + data.error);
        }
    })
    .catch(error => {
        console.error('Error clearing bill:', error);
    });
}


async function executeSettle(table, amount, mode) {
    try {
        const res = await fetch('/api/manager/mark-paid', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ 
                table_num: parseInt(table), 
                amount_paid: parseFloat(amount), 
                payment_mode: mode 
            })
        });
        const data = await res.json();
        if(data.success) {
            closeBill();
            loadTableStatus();
            
            // Safe increment interface automation handler for dashboard counters
            const revEl = document.getElementById('statRevenue');
            if(revEl) {
                let currentRev = parseInt(revEl.innerText) || 0;
                revEl.innerText = currentRev + parseInt(amount);
            }
            alert(`Node entry Table ${table} verified and flushed cleanly via ${mode}.`);
        }
    } catch(err) { alert("Reconciliation exception thrown while mapping transaction parameters."); }
}

function closeBill() {
    document.getElementById('modalOverlay').style.display = 'none';
    document.getElementById('billModal').style.display = 'none';
}

// --- 4. RESERVATIONS ARCHIVE MANAGEMENT ---
async function loadBookings() {
    try {
        const res = await fetch('/api/manager/get-bookings');
        allBookings = await res.json();
        renderBookings(allBookings);
        
        const pendingCount = allBookings.filter(b => b.status === 'Pending').length;
        const statNewBookings = document.getElementById('statNewBookings');
        if(statNewBookings) statNewBookings.innerText = pendingCount;
    } catch (err) { console.error("Bookings stream down:", err); }
}

function renderBookings(data) {
    const list = document.getElementById('bookingList');
    if (!list) return;

    list.innerHTML = data.map(b => {
        const isPending = b.status === 'Pending';
        return `
        <div class="item-row" style="${isPending ? 'background: rgba(255, 215, 0, 0.04); border-left: 3px solid var(--gold);' : ''}">
            <div style="flex:1; padding-right: 10px;">
                <div style="color:white; font-weight:bold; font-size:14px;">
                    ${b.customer_name} ${isPending ? '<span style="color:var(--gold); font-size:9px; margin-left:8px;">● NEW</span>' : ''}
                </div>
                <div style="font-size:12px; color:#aaa; margin-top:2px;">🆔 <b>${b.booking_id}</b> | 📞 ${b.phone} | ${b.booking_date} | ${b.booking_time} (${b.guests} Pax)</div>
            </div>
            
            <div style="display:flex; gap:8px; align-items:center;">
                ${isPending ? `
                    <button onclick="handleConfirm(${b.id}, '${b.phone}', '${b.customer_name}', '${b.booking_id}')" 
                        style="background:var(--gold); color:black; border:none; padding:6px 12px; border-radius:4px; font-weight:bold; cursor:pointer; width:auto; margin:0; font-size:12px;">
                        Confirm
                    </button>
                ` : `
                    <select onchange="updateStatus(${b.id}, this.value, '${b.phone}', '${b.customer_name}', '${b.booking_id}')" 
                        style="background:#222; color:var(--gold); border:1px solid #444; padding:6px; border-radius:4px; cursor:pointer; width:auto; margin:0; font-size:12px;">
                        <option value="Confirmed" ${b.status === 'Confirmed' ? 'selected' : ''}>Confirmed</option>
                        <option value="Arrived" ${b.status === 'Arrived' ? 'selected' : ''}>Arrived</option>
                        <option value="No Show" ${b.status === 'No Show' ? 'selected' : ''}>No Show</option>
                    </select>
                `}
                <button onclick="deleteItem('/api/manager/delete-booking', {id: ${b.id}}, loadBookings)" style="background:transparent; border:none; cursor:pointer; color:var(--red); width:auto; margin:0; font-size:14px; padding:0 5px;">✕</button>
            </div>
        </div>`;
    }).join('');
}

async function verifyBookingToken() {
    const tokenInput = document.getElementById('tokenVerifyInput');
    const token = tokenInput ? tokenInput.value.trim() : '';
    if(!token) return alert("Verification error: Field missing token input.");

    try {
        const res = await fetch(`/api/check-status/${token}`);
        if (!res.ok) throw new Error("Network pipeline non-responsive.");
        
        const result = await res.json();
        if(result && (result.found || result.success)) {
            const b = result.data || result.booking;
            alert(`✅ Token Verified Match!\nCustomer: ${b.customer_name}\nStatus: ${b.status}\nGuests: ${b.guests}\nSchedule Window: ${b.booking_date} @ ${b.booking_time}`);
        } else {
            alert(result.message || "Token structure rejected or record expired.");
        }
    } catch(e) {
        console.error("Token structural exception intercept:", e);
        alert("Verification routing interrupted. Server path offline.");
    }
}

document.getElementById('bookingSearch')?.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const filtered = allBookings.filter(b => 
        b.customer_name.toLowerCase().includes(term) || 
        b.phone.includes(term) ||
        b.booking_id.toLowerCase().includes(term)
    );
    renderBookings(filtered);
});

async function handleConfirm(id, phone, name, bookingId) {
    await updateStatus(id, 'Confirmed', phone, name, bookingId);
}

async function updateStatus(id, newStatus, phone, name, bookingId) {
    try {
        const res = await fetch('/api/manager/update-booking-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, status: newStatus })
        });
        const result = await res.json();
        if (result.success && newStatus === 'Confirmed') {
            sendWhatsApp(phone, name, bookingId);
        }
        loadBookings();
    } catch (err) { console.error("Status state update crash:", err); }
}

function sendWhatsApp(phone, name, bookingId) {
    const msg = `Namaste ${name}! 🙏 Aapki booking (ID: ${bookingId}) Luxe Dining mein Confirm ho gayi hai. Hum aapka intezar karenge!`;
    const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
    const newWindow = window.open(waUrl, '_blank');
    if(!newWindow) { console.warn("Notice: Browser blocked external tab forwarding rules."); }
}

// --- 5. QR STRUCT DISTRIBUTOR ---
async function generateQRCode() {
    const numInput = document.getElementById('qrTableNum');
    const num = numInput ? numInput.value : '';
    if(!num) return alert("Generation failed: Table verification context missing.");

    try {
        const res = await fetch(`/api/manager/generate-qr/${num}`);
        const data = await res.json();
        if(data.success) {
            document.getElementById('qrResult').style.display = 'block';
            document.getElementById('qrLabel').innerText = `NODE STRUCTURE TABLE ${num}`;
            document.getElementById('qrImage').src = data.qr_code;
        }
    } catch (e) { alert("Server handling error routing QR encryption keys."); }
}

function downloadQR() {
    const link = document.createElement('a');
    link.download = `Table_${document.getElementById('qrTableNum').value}_MatrixQR.png`;
    link.href = document.getElementById('qrImage').src;
    link.click();
}

// --- 6. CATALOG STREAM SYNC HANDLERS ---
async function loadGalleryAssets() {
    try {
        const res = await fetch('/api/get-gallery');
        const data = await res.json();
        const list = document.getElementById('galleryDisplay'); 
        if(!list) return;

        list.innerHTML = data.map(a => `
            <div class="item-row">
                <div style="display:flex; align-items:center; gap:8px;">
                    <img src="${a.url}" width="35" height="35" style="border-radius:4px; object-fit:cover;" onerror="this.src='https://placehold.co/35'">
                    <span style="color:#eee; font-size:13px;">${a.title || 'Ambience Stream Asset'}</span>
                </div>
                <button onclick="deleteItem('/api/manager/delete-gallery', {url: '${a.url}'}, loadGalleryAssets)" style="background:transparent; border:none; cursor:pointer; color:var(--red); width:auto; padding:0 5px;">✕</button>
            </div>
         `).join('');
    } catch (e) { console.error("Gallery asset rendering engine error:", e); }
}

async function loadCurrentOffer() {
    try {
        const res = await fetch('/api/get-offer');
        const data = await res.json();
        const textContainer = document.getElementById('activeOfferDisplay');
        const statusBox = document.getElementById('offerStatusBox');
        
        if(textContainer && data.success && data.offer_text) {
            textContainer.innerText = data.offer_text;
            if(statusBox) statusBox.style.display = 'block';
        } else {
            if(statusBox) statusBox.style.display = 'none';
        }
    } catch(e) { console.error("Promo asset fetching error logs:", e); }
}

async function saveOffer() {
    const input = document.getElementById('offerInput');
    if(!input || !input.value) return alert("Prompt notice: Enter promotional detail arrays.");
    
    try {
        const res = await fetch('/api/manager/update-offer', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ offer_text: input.value })
        });
        const data = await res.json();
        if(data.success) {
            alert("Promo broadcast node streaming active.");
            input.value = '';
            loadCurrentOffer();
        }
    } catch(e) { console.error(e); }
}

async function removeOffer() {
    try {
        const res = await fetch('/api/manager/remove-offer', { method: 'POST' });
        const data = await res.json();
        if(data.success) {
            alert("Broadcast matrix cleared cleanly.");
            loadCurrentOffer();
        }
    } catch(e) { console.error(e); }
}

async function loadReviews() {
    try {
        const res = await fetch('/api/get-all-reviews');
        const data = await res.json();
        const list = document.getElementById('reviewList');
        if(!list) return;
        
        list.innerHTML = data.map(r => `
            <div class="item-row" style="background: #0d0d0d; margin-bottom: 6px; border-radius: 6px; padding: 10px;">
                <div style="font-size:13px; flex: 1; padding-right: 10px; line-height: 1.4;">
                    <span style="display: flex; gap: 8px; align-items: center; margin-bottom: 2px;">
                        <b style="color:var(--gold); font-size:13px;">${r.customer_name}</b> 
                        <span style="color:var(--green); font-size:11px;">${r.rating} ★</span>
                    </span>
                    <div style="color:#ccc; font-size:12px; word-break: break-all;">${r.comment}</div>
                </div>
                <button onclick="deleteItem('/api/manager/delete-review', {id: ${r.id}}, loadReviews)" style="background:transparent; border:none; cursor:pointer; color:var(--red); width:auto; font-size: 14px;">✕</button>
            </div>
        `).join('');
    } catch(e) { console.error("Review matrix load handling error:", e); }
}

async function loadMenu() {
    try {
        const res = await fetch('/api/get-menu');
        const data = await res.json();
        const list = document.getElementById('menuList');
        if(!list) return;
        list.innerHTML = data.map(m => `
            <div class="item-row">
                <div style="font-size:13px;">
                    <b style="color:white;">${m.item_name || m.name}</b> - <span style="color:var(--gold);">₹${m.price}</span> <small style="color: gray;">[${m.category}]</small>
                </div>
                <button onclick="deleteItem('/api/manager/delete-menu-item', {id: ${m.id}}, loadMenu)" style="background:transparent; border:none; cursor:pointer; color:var(--red); width:auto;">✕</button>
            </div>
        `).join('');
    } catch(e) { console.error("Menu list rendering exception logs:", e); }
}

async function loadFaculty() {
    try {
        const res = await fetch('/api/get-faculty');
        const data = await res.json();
        const list = document.getElementById('facultyDisplay');
        if(!list) return;

        const facultyArray = Array.isArray(data) ? data : (data.success && Array.isArray(data.data) ? data.data : []);

        if (facultyArray.length === 0) {
            list.innerHTML = `<div style="color: gray; padding: 10px; font-size: 12px; text-align: center;">No core staff profiles active in schema.</div>`;
            return;
        }

        list.innerHTML = facultyArray.map(f => `
            <div class="item-row">
                <div style="display:flex; align-items:center; gap:8px; font-size:13px;">
                    <img src="${f.image_url || f.url}" width="35" height="35" style="border-radius:50%; object-fit:cover;" onerror="this.src='https://placehold.co/35'">
                    <div><b>${f.name}</b><br><small style="color:#888;">${f.designation}</small></div>
                </div>
                <button onclick="deleteItem('/api/manager/delete-faculty', {id: ${f.id}}, loadFaculty)" style="background:transparent; border:none; cursor:pointer; color:var(--red); width:auto;">✕</button>
            </div>
        `).join('');
    } catch(e) { console.error("Faculty stream structural mapping runtime failure skipped safely:", e); }
}

// --- LIVE ORDERS SYSTEM (Upgrade) ---
// --- LIVE ORDERS SYSTEM (Standalone Module) ---

// 1. Fetching Logic
async function fetchLiveOrders() {
    try {
        const response = await fetch('/api/manager/get-live-orders');
        const orders = await response.json();
        const container = document.getElementById('orderContainer');
        
        if (!container) return;

        if (!orders || orders.length === 0) {
            container.innerHTML = "<p>No pending orders.</p>";
            return;
        }

       container.innerHTML = orders.map(o => `
    <div class="order-card">
        <h3>Table #${o.table_num}</h3>
        <p>${o.items}</p>
        <!-- Yahan function name ko markOrderServed se match karein -->
        <button onclick="markOrderServed(${o.table_num})">SERVED</button>
    </div>
`).join('');
    } catch (err) {
        console.error(err);
    }
}
async function markOrderServed(tableNum) {
    const res = await fetch('/api/manager/mark-served', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table_num: tableNum })
    });
    if (res.ok) {
        alert("Order Served!");
        fetchLiveOrders();
    }
}

// 2. Order ko DELETE/CLEAR karne ke liye
async function deleteOrder(tableNum) {
    if(!confirm("Kya aap sure hain ki ye order clear karna chahte hain?")) return;
    
    const res = await fetch('/api/manager/delete-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table_num: tableNum })
    });
    if (res.ok) {
        alert("Order Deleted!");
        fetchLiveOrders();
    }
}

// manager daily 
async function loadDailyReport() {
    try {
        const res = await fetch('/api/manager/daily-report');
        const json = await res.json();
        
        console.log("Full Response:", json); 

        // Agar data object ke andar hai toh access karein, varna seedha json use karein
        const reportData = Array.isArray(json) ? json : (json.data || []);

        if (reportData.length === 0) {
            document.getElementById('dailyReportList').innerHTML = `<p>No data found.</p>`;
            return;
        }
// manager.js
document.getElementById('dailyReportList').innerHTML = reportData.map(o => `
    <div class="audit-item">
        <span>Table #${o.table_num}</span>
        <span style="color:var(--gold);">₹${o.total_amount || 0}</span>
        <span>${new Date(o.order_date).toLocaleTimeString()}</span> 
    </div>
`).join('');
    } catch (e) {
        console.error("Fixing Map Error:", e);
    }
}

// Refresh logic (har 30 second mein update hoga)
setInterval(loadDailyReport, 30000);
loadDailyReport();

setInterval(fetchLiveOrders, 5000);
fetchLiveOrders();

// 4. Auto-Refresh Setup
// Ye ensure karega ki har 5 second mein orders update hote rahein
setInterval(fetchLiveOrders, 5000);

// Initial Load
fetchLiveOrders();

async function loadAIInsights() {
    try {
        const res = await fetch('/api/manager/ai-insights');
        const data = await res.json();
        
        const loadingBox = document.getElementById('aiLoading');
        const contentBox = document.getElementById('aiContent');

        if(data.success) {
            if(document.getElementById('aiSentiment')) document.getElementById('aiSentiment').innerText = data.sentimentAnalysis || "Stable / Positive Sentiment Flow";
            if(document.getElementById('aiPeak')) document.getElementById('aiPeak').innerText = data.predictedPeakHour || "19:30 RUSH PROFILE BOUNDS";
            if(document.getElementById('aiRecommendation')) document.getElementById('aiRecommendation').innerText = data.aiSuggestion || "Continuous stream pipeline automated.";
            
            if(loadingBox) loadingBox.style.display = 'none';
            if(contentBox) contentBox.style.display = 'block';
        }
    } catch(e) { console.error("Analytics stream extraction interceptor crash safely caught:", e); }
}

// --- 7. FORM SUBMISSION MULTIPART LOGIC PIPELINES ---
function initFormListeners() {
    // Gallery Assets Pushes
    document.getElementById('assetForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('title', document.getElementById('aTitle').value);
        formData.append('image', document.getElementById('aFile').files[0]);

        try {
            const res = await fetch('/api/manager/upload-gallery', { method: 'POST', body: formData });
            const data = await res.json();
            if(data.success) {
                alert("Ambience structural resource deployed live!");
                document.getElementById('assetForm').reset();
                loadGalleryAssets();
            }
        } catch (e) { console.error("Upload interface routing exception:", e); }
    });

    // Premium Catalog Item Commits
    document.getElementById('menuForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('name', document.getElementById('mName').value);
        formData.append('price', document.getElementById('mPrice').value);
        formData.append('category', document.getElementById('mCat').value);
        formData.append('image', document.getElementById('mFile').files[0]);

        try {
            const res = await fetch('/api/manager/add-menu-item', { method: 'POST', body: formData });
            if(res.ok) {
                alert("Dish committed into operational database architecture!");
                document.getElementById('menuForm').reset();
                loadMenu();
            }
        } catch(e) { console.error("Multipart route menu uploading process breakdown:", e); }
    });

    // Core Staff Profile Deployments
    document.getElementById('facultyForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('fName', document.getElementById('fName').value);
        formData.append('fDesignation', document.getElementById('fDesignation').value);
        formData.append('fFile', document.getElementById('fFile').files[0]); 

        try {
            const res = await fetch('/api/manager/add-faculty', { method: 'POST', body: formData });
            if(res.ok) {
                alert("Staff profile registry updated into system grid!");
                document.getElementById('facultyForm').reset();
                loadFaculty();
            }
        } catch(e) { console.error("Staff engine compilation framework pipeline errors:", e); }
    });
}

// --- 8. GLOBAL RECORD MUTATION REMOVAL PIPELINE ---
async function deleteItem(url, payload, callback) {
    if(!confirm("Are you sure you want to delete this live system data resource entry?")) return;
    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if(data.success) {
            alert("Resource record successfully decoupled.");
            if(callback) callback();
            
            // Sync dashboard summary parameters dynamically post-mutation entries
            const statRes = await fetch('/api/manager/dashboard-stats');
            const statData = await statRes.json();
            if(document.getElementById('statRevenue')) document.getElementById('statRevenue').innerText = statData.revenue || 0;
            if(document.getElementById('statNewBookings')) document.getElementById('statNewBookings').innerText = statData.newBookings || 0;
        } else {
            alert("Mutation request blocked: Target state rejected by standard infrastructure rules.");
        }
    } catch(e) {
        console.error("Critical execution breakdown in dynamic deletion pipeline loop:", e);
        alert("Fatal error running backend record removal array pathways.");
    }
}

// Ye code manager.js mein sabse niche daal do
window.onload = async () => {
    const res = await fetch('/api/manager/get-live-orders');
    const data = await res.json();
    console.log("DATABASE SE AAYA DATA:", data);
    if(data.length === 0) {
        alert("Database empty hai ya koi order Pending nahi hai!");
    }
};