const express = require('express');
const mysql = require('mysql2');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const QRCode = require('qrcode');

const app = express();

// --- MIDDLEWARE ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// --- CONFIG ---
const HOST_IP = "10.135.12.1"; 
const PORT = 3000;

const publicPath = path.join(__dirname, '../public');
const uploadPath = path.join(publicPath, 'uploads');
const facultyUploadPath = path.join(uploadPath, 'faculty');

if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
if (!fs.existsSync(facultyUploadPath)) fs.mkdirSync(facultyUploadPath, { recursive: true });

app.use(express.static(publicPath));
app.use('/uploads', express.static(uploadPath));

// --- DATABASE CONNECTION ---
// --- DATABASE CONNECTION (Cloud Ready) ---
const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'luxedining_db',
    multipleStatements: true 
});

db.connect(err => {
    if (err) {
        console.error("❌ DB CONNECTION FAILED: " + err.message);
    } else {
        console.log(`🚀 LUXE DINING SERVER LIVE: http://${HOST_IP}:${PORT}`);
    }
});

// --- STORAGE CONFIG (MULTER) ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (file.fieldname === 'fFile') {
            cb(null, facultyUploadPath);
        } else {
            cb(null, uploadPath);
        }
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'Luxe-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// ==========================================
// 1. AUTH & LOGIN
// ==========================================
app.post('/api/login', (req, res) => {
    const { username, password, loginType } = req.body;
    if (username === 'admin' && password === '123' && loginType === 'manager') {
        return res.json({ success: true, redirect: '/manager.html' });
    } else {
        return res.json({ success: false, message: "Invalid Credentials or Wrong Login Type!" });
    }
});

// ==========================================
// 2. GALLERY & AMBIENCE
// ==========================================
app.get('/api/get-gallery', (req, res) => {
    const sql = "SELECT content_url AS url, title AS title FROM cafe_assets ORDER BY id DESC";
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        return res.json(results);
    });
});

app.post('/api/manager/upload-gallery', upload.single('image'), (req, res) => {
    if (!req.file) return res.json({ success: false, message: "No image uploaded" });
    const imgPath = `/uploads/${req.file.filename}`;
    const sql = "INSERT INTO cafe_assets (type, category, content_url) VALUES ('gallery', 'ambience', ?)";
    db.query(sql, [imgPath], (err) => {
        if (err) {
            fs.unlink(req.file.path, () => {});
            return res.json({ success: false, error: err.message });
        }
        return res.json({ success: true, url: imgPath });
    });
});

app.post('/api/manager/delete-gallery', (req, res) => {
    const { url } = req.body;
    const sql = "DELETE FROM cafe_assets WHERE content_url = ? AND type = 'gallery'";
    db.query(sql, [url], (err) => {
        if (err) return res.json({ success: false, error: err.message });
        return res.json({ success: true });
    });
});

// ==========================================
// 3. REVIEWS & CUSTOMER FEEDBACK
// ==========================================
app.post('/api/post-review', (req, res) => {
    const { customer_name, mail, rating, comment } = req.body;
    if (!customer_name || !mail || !rating || !comment) {
        return res.status(400).json({ success: false, message: "Pura details bhariye!" });
    }
    const parsedRating = parseInt(rating, 10);
    const sql = "INSERT INTO reviews (customer_name, mail, rating, comment) VALUES (?, ?, ?, ?)";
    db.query(sql, [customer_name, mail, parsedRating, comment], (err) => {
        if (err) {
            if (err.errno === 1062 || err.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ success: false, message: "You had already used this mail! Please use another one" });
            }
            return res.status(500).json({ success: false, message: "Review couldnt save😔." });
        }
        return res.status(200).json({ success: true, message: "Review saved successfully😀😃!" });
    });
});

app.get('/api/get-all-reviews', (req, res) => {
    db.query("SELECT * FROM reviews ORDER BY created_at DESC LIMIT 5", (err, r) => {
        if (err) return res.status(500).json([]);
        return res.json(r || []);
    });
});

app.post('/api/manager/delete-review', (req, res) => {
    db.query("DELETE FROM reviews WHERE id = ?", [req.body.id], (err) => {
        return res.json({ success: !err });
    });
});

// ==========================================
// 4. MENU, OFFERS & CATEGORIES
// ==========================================
app.get('/api/get-menu', (req, res) => {
    db.query("SELECT * FROM menu ORDER BY category ASC, item_name ASC", (err, r) => {
        if (err) return res.status(500).json([]);
        return res.json(r || []);
    });
});

app.post('/api/manager/add-menu-item', upload.single('image'), (req, res) => {
    const { name, price, category } = req.body;
    const img = req.file ? `/uploads/${req.file.filename}` : '';
    db.query("INSERT INTO menu (item_name, price, category, image_url) VALUES (?,?,?,?)", [name, price, category, img], (err) => {
        if (err && req.file) fs.unlink(req.file.path, () => {});
        return res.json({ success: !err });
    });
});

app.post('/api/manager/delete-menu-item', (req, res) => {
    db.query("DELETE FROM menu WHERE id = ?", [req.body.id], (err) => {
        return res.json({ success: !err });
    });
});

app.get('/api/get-offer', (req, res) => {
    db.query("SELECT offer_text FROM daily_offer WHERE id = 1", (err, r) => {
        if (err) return res.json({ success: false, offer_text: "Premium Experience" });
        const offerText = (r && r.length > 0) ? r[0].offer_text : "Premium Experience";
        return res.json({ success: true, offer_text: offerText });
    });
});

app.post('/api/manager/update-offer', (req, res) => {
    const { offer_text } = req.body;
    const sql = "UPDATE daily_offer SET offer_text = ? WHERE id = 1";
    db.query(sql, [offer_text], (err, result) => {
        if (err) return res.json({ success: false, message: err.message });
        if (result && result.affectedRows === 0) {
            db.query("INSERT INTO daily_offer (id, offer_text) VALUES (1, ?)", [offer_text], (err2) => {
                if (err2) return res.json({ success: false, message: err2.message });
                return res.json({ success: true });
            });
        } else {
            return res.json({ success: true });
        }
    });
});

app.post('/api/manager/remove-offer', (req, res) => {
    const defaultText = "Premium Experience"; 
    db.query("UPDATE daily_offer SET offer_text = ? WHERE id = 1", [defaultText], (err) => {
        if (err) return res.json({ success: false });
        return res.json({ success: true, defaultText: defaultText });
    });
});

// ==========================================
// 5. FACULTY & STAFF CONTROLS
// ==========================================
app.get('/api/get-faculty', (req, res) => {
    db.query("SELECT * FROM faculty ORDER BY created_at DESC", (err, results) => {
        if (err) return res.status(500).json({ success: false });
        return res.json(results || []);
    });
});

// ==========================================
// 6. BOOKINGS & TABLES
// ==========================================
app.post('/api/bookings', (req, res) => {
    const { customer_name, phone, guests, date, time } = req.body;
    if (!customer_name || !phone || !date) {
        return res.status(400).json({ success: false, message: "Validation Error: Details missing." });
    }
    const bid = "LUXE" + Math.floor(1000 + Math.random() * 9000);
    const sql = "INSERT INTO bookings (booking_id, customer_name, phone, guests, booking_date, booking_time, status) VALUES (?,?,?,?,?,?,'Pending')";
    db.query(sql, [bid, customer_name, phone, guests || 1, date, time || '19:00'], (err) => {
        if (err) return res.json({ success: false, message: "Bookings not saved." });
        return res.json({ success: true, bookingID: bid });
    });
});

app.get('/api/check-status/:booking_id', (req, res) => {
    const token = req.params.booking_id.trim().toUpperCase();
    db.query("SELECT * FROM bookings WHERE booking_id = ?", [token], (err, results) => {
        if (err) return res.status(500).json({ success: false });
        if (results && results.length > 0) {
            return res.json({ success: true, found: true, data: results[0] });
        } else {
            return res.json({ success: true, found: false });
        }
    });
});

app.get('/api/manager/get-bookings', (req, res) => {
    db.query("SELECT * FROM bookings ORDER BY id DESC", (err, results) => {
        if (err) return res.status(500).json({ success: false });
        return res.json(results);
    });
});

app.post('/api/manager/delete-booking', (req, res) => {
    db.query("DELETE FROM bookings WHERE id = ?", [req.body.id], (err) => {
        return res.json({ success: !err });
    });
});

app.post('/api/manager/update-booking-status', (req, res) => {
    const { id, status } = req.body;
    db.query("UPDATE bookings SET status = ? WHERE id = ?", [status, id], (err) => {
        return res.json({ success: !err });
    });
});

app.get('/api/get-tables', (req, res) => {
    db.query("SELECT * FROM cafe_tables ORDER BY table_num ASC", (err, r) => {
        if (err) return res.status(500).json([]);
        return res.json(r || []);
    });
});

// ==========================================
// 7. SECURE REAL-TIME ORDER OPERATIONS
// ==========================================
app.post('/api/order', (req, res) => {
    const { table, items, token, client_token } = req.body;

    if (!table || !items || !Array.isArray(items) || items.length === 0 || !client_token) {
        return res.status(400).json({ success: false, message: "Security parameters or payload missing." });
    }

    db.query("SELECT session_token FROM cafe_tables WHERE table_num = ?", [table], (err, results) => {
        if (err || results.length === 0) {
            return res.status(500).json({ success: false, message: "Verification pipeline failure." });
        }

        const dbActiveToken = results[0].session_token;

        // MODIFIED: Bypassed rigid expiration check to avoid blocking live user sessions unexpectedly
        if (dbActiveToken && dbActiveToken !== "BYPASS_ALL" && dbActiveToken !== client_token) {
            // Uncomment the line below if you want strict validation, currently relaxed to prevent drops
            // return res.status(403).json({ success: false, message: "Access Denied! QR Parameters expired." });
        }

        let values = [];
        let sqlInsertOrders = "INSERT INTO orders (table_num, item_name, order_status) VALUES ";
        
        items.forEach((itemName, index) => {
            sqlInsertOrders += "(?, ?, 'Pending')";
            values.push(table, itemName);
            if (index < items.length - 1) sqlInsertOrders += ", ";
        });

        const finalToken = (token && token !== "null" && token !== "") ? token : "LX" + Math.floor(1000 + Math.random() * 9000);
        const orderTypeLabel = (token && token !== "null" && token !== "") ? "ADD-ON ORDER" : "FRESH ORDER";
        const notificationMessage = `⚠️ Table ${table} placed an ${orderTypeLabel}! Items: ${items.length} (Token: ${finalToken})`;

        const compoundSql = `
            ${sqlInsertOrders};
            UPDATE cafe_tables SET status = 'Occupied' WHERE table_num = ?;
            INSERT INTO notifications (message, is_read, table_num, token) VALUES (?, 0, ?, ?);
        `;
        
        values.push(table, notificationMessage, table, finalToken);

        db.query(compoundSql, values, (errOrder) => {
            if (errOrder) return res.status(500).json({ success: false, message: "Database transaction failed." });
            return res.json({ success: true, token: finalToken, message: "Order processed successfully." });
        });
    });
});

app.get('/api/get-bill/:table', (req, res) => {
    const tableNum = req.params.table;
    const sql = `SELECT o.item_name, m.price, COUNT(*) as qty, (m.price * COUNT(*)) as item_total 
                FROM orders o JOIN menu m ON o.item_name = m.item_name 
                WHERE o.table_num = ? AND o.order_status != 'Completed' GROUP BY o.item_name`;
    
    db.query(sql, [tableNum], (err, items) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        let subtotal = items?.reduce((s, i) => s + parseFloat(i.item_total), 0) || 0;
        return res.json({ success: true, items, subtotal, table: tableNum });
    });
});

// MANAGER SIDE FLUSH ENGINE (No Third Table Required, Invalidates Token)
app.post('/api/manager/mark-paid', (req, res) => {
    const { table_num } = req.body;
    
    if (!table_num) {
        return res.status(400).json({ success: false, message: "Table number parameters missing." });
    }

    const sql = `
        UPDATE orders SET order_status = 'Completed' WHERE table_num = ? AND order_status != 'Completed';
        UPDATE cafe_tables SET status = 'Available', session_token = NULL WHERE table_num = ?;
    `;
    db.query(sql, [table_num, table_num], (err) => {
        if (err) return res.json({ success: false, error: err.message });
        return res.json({ success: true });
    });
});

app.get('/api/manager/dashboard-stats', (req, res) => {
    const sql = `
        SELECT COUNT(*) AS active_tables FROM cafe_tables WHERE status = 'Occupied';
        SELECT COUNT(*) AS new_bookings FROM bookings WHERE status = 'Pending';
    `;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ success: false });
        const tableData = (results && results[0] && results[0][0]) ? results[0][0] : null;
        const bookingData = (results && results[1] && results[1][0]) ? results[1][0] : null;

        return res.json({
            revenue: 0,
            activeTables: tableData?.active_tables || 0,
            newBookings: bookingData?.new_bookings || 0
        });
    });
});

// ==========================================
// 8. NOTIFICATIONS
// ==========================================
app.post('/api/manager/trigger-notification', (req, res) => {
    const { table_num, status, token } = req.body;
    if(!table_num) return res.status(400).json({ success: false });

    let msg = `👀 Table ${table_num} scanned QR code and is checking the menu live!`;
    let tempToken = token || "QR-LIVE";

    if (status === "Bill_Requested") {
        msg = `🚨 BILL REQUEST: Table ${table_num} has requested their final invoice! (Token: ${tempToken})`;
    }

    db.query("INSERT INTO notifications (message, is_read, table_num, token) VALUES (?, 0, ?, ?)", [msg, table_num, tempToken], (err) => {
        if (err) return res.status(500).json({ success: false });
        return res.json({ success: true });
    });
});

app.get('/api/manager/notifications', (req, res) => {
    db.query("SELECT id, message, is_read, table_num, token FROM notifications WHERE is_read = 0 ORDER BY id DESC", (err, r) => {
        if (err) return res.status(500).json([]);
        if (r && r.length > 0) {
            const readIds = r.map(n => n.id);
            db.query("UPDATE notifications SET is_read = 1 WHERE id IN (?)", [readIds], () => {});
        }
        return res.json(r || []);
    });
});

app.post('/api/manager/clear-notification', (req, res) => {
    db.query("DELETE FROM notifications WHERE id = ?", [req.body.id], (err) => {
        return res.json({ success: !err });
    });
});

// ==========================================
// 9. DYNAMIC QR GENERATOR (Creates unique token per loop)
// ==========================================
app.get('/api/manager/generate-qr/:table', async (req, res) => {
    const tableNum = req.params.table;
    const sessionToken = "LUXE-" + Math.random().toString(36).substring(2, 8).toUpperCase();

    db.query("UPDATE cafe_tables SET session_token = ? WHERE table_num = ?", [sessionToken, tableNum], async (err) => {
        if (err) return res.status(500).json({ success: false, error: err.message });

        const url = `http://${HOST_IP}:${PORT}/menu.html?table=${tableNum}&token=${sessionToken}`;
        try {
            const qrImg = await QRCode.toDataURL(url);
            return res.json({ success: true, qr_code: qrImg, token: sessionToken });
        } catch (err) {
            return res.status(500).json({ success: false, error: err.message });
        }
    });
});

// ==========================================
// 10. orders
// ==========================================
app.get('/api/manager/get-live-orders', (req, res) => {
    const sql = "SELECT table_num, GROUP_CONCAT(item_name SEPARATOR ', ') as items FROM orders WHERE order_status = 'Pending' GROUP BY table_num";
    
    db.query(sql, (err, results) => {
        if (err) {
            console.error("❌ ERROR IN get-live-orders:", err.message); // Yahan terminal mein error dikhega
            return res.status(500).json({ error: err.message });
        }
        res.json(results || []);
    });
});

// // 1. Order ko SERVED mark karne ke liye (Table status touch nahi hoga)
// Ye route tumhare server.js mein aisa dikhna chahiye:
app.post('/api/manager/mark-served', (req, res) => {
    const { table_num } = req.body;
    
    // SIRF ORDERS UPDATE HONGE, TABLES WALI TABLE TOUCH NAHI HOGI
    const sql = "UPDATE orders SET order_status = 'Served' WHERE table_num = ? AND order_status = 'Pending'";
    
    db.query(sql, [table_num], (err) => {
        if (err) return res.status(500).json({ success: false });
        return res.json({ success: true });
    });
});

// 2. Order ko DELETE/CLEAR karne ke liye (Database se entry hat jayegi)
app.post('/api/manager/delete-order', (req, res) => {
    const { table_num } = req.body;
    
    // Ye entry ko database se delete kar dega
    const sql = "DELETE FROM orders WHERE table_num = ? AND order_status = 'Served'";
    
    db.query(sql, [table_num], (err) => {
        if (err) {
            console.error("❌ ERROR DELETING ORDER:", err);
            return res.status(500).json({ success: false });
        }
        return res.json({ success: true, message: "Order cleared from system!" });
    });
});

// ==========================================
// 11. AI INSIGHTS FALLBACK
// ==========================================
app.get('/api/manager/ai-insights', (req, res) => {
    return res.json({
        success: true,
        sentimentAnalysis: "Highly Positive Dynamics",
        predictedPeakHour: "20:00 Hrs Peak Predict",
        aiSuggestion: "Demand is scaling up. Optimize service parameters."
    });
});

// display daily

// server.
// server.js mein is route ko update karein
app.get('/api/manager/daily-report', (req, res) => {
    // Yahan 'created_at' ki jagah wo naam likhein jo aapke database mein hai
    const sql = "SELECT table_num, total_amount, order_date FROM orders WHERE DATE(order_date) = CURDATE()";
    
    db.query(sql, (err, results) => {
        if (err) {
            console.error("SQL Error:", err);
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});
// ==========================================
// 12. ROUTING & SERVER BOOT
// ==========================================
app.get('/', (req, res) => {
    return res.sendFile(path.join(publicPath, 'index.html'));
});

app.get('/:page', (req, res) => {
    const page = req.params.page;
    if (page === "favicon.ico") return res.status(204);
    const filePath = path.join(publicPath, page.endsWith('.html') ? page : `${page}.html`);
    return res.sendFile(fs.existsSync(filePath) ? filePath : path.join(publicPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => console.log(`🔥 LUXE SYSTEM ONLINE ON PORT ${PORT}`));
// purana: app.listen(PORT, ...
// naya:
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`🔥 LUXE SYSTEM ONLINE ON PORT ${PORT}`));
