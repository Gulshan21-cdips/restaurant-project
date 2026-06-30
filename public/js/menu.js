let cart = [];

document.addEventListener("DOMContentLoaded", () => {
    // 1. Session Recovery Strategy
    const urlParams = new URLSearchParams(window.location.search);
    
    // URL se data lo, agar nahi hai toh localStorage se uthao
    let tableNum = urlParams.get('table') || localStorage.getItem('selectedTable');
    let clientToken = urlParams.get('token') || localStorage.getItem('clientToken');

    // 2. Data Integrity Check: Agar session invalid hai, toh hi error dikhao
    if (!tableNum || tableNum === "null" || tableNum === "undefined" || !clientToken) {
        // Redirection Loop break karne ke liye
        console.error("Session Corrupted: Redirecting...");
        window.location.href = 'index.html'; 
        return;
    }

    // 3. Save for future persistence (Refresh hone par bhi data rahega)
    localStorage.setItem('selectedTable', tableNum);
    localStorage.setItem('clientToken', clientToken);

    // 4. Update UI Header
    const tableDisplay = document.getElementById('displayTableNum');
    if (tableDisplay) tableDisplay.innerText = `TABLE NO: ${tableNum}`;

    // 5. Initialize
    loadMenu();
    setupOrderButtons(tableNum, clientToken);
});

// ... (Baki ke functions loadMenu, placeOrder wahi rahenge)
// ==========================================
// MENU INJECTION
// ==========================================
function loadMenu() {
    const container = document.getElementById('menuContainer');
    if (!container) return;

    fetch('/api/get-menu')
        .then(res => res.json())
        .then(items => {
            container.innerHTML = "";
            if (!items || items.length === 0) {
                container.innerHTML = "<p style='color: gray; text-align: center;'>No menu items available.</p>";
                return;
            }

            items.forEach(item => {
                const card = document.createElement('div');
                card.className = "menu-card";
                card.innerHTML = `
                    <img src="${item.image_url || 'placeholder.jpg'}" alt="${item.item_name}">
                    <div class="menu-details">
                        <h3 class="text-white">${item.item_name}</h3>
                        <div class="price-row">
                            <span class="price">₹${item.price}</span>
                            <button class="add-to-cart-btn">Add to Cart</button>
                        </div>
                    </div>
                `;

                card.querySelector('.add-to-cart-btn').addEventListener('click', () => {
                    cart.push({ name: item.item_name, price: item.price });
                    updateCartUI();
                });
                container.appendChild(card);
            });
        })
        .catch(err => console.error("Menu fetch failed:", err));
}

function updateCartUI() {
    const cartCount = document.getElementById('cartCount');
    const totalDisplay = document.getElementById('totalPrice');
    const cartList = document.getElementById('cartItemList');
    
    // 1. Count aur Total update karo
    cartCount.innerText = cart.length;
    let total = cart.reduce((sum, item) => sum + parseFloat(item.price), 0);
    totalDisplay.innerText = total.toFixed(2);

    // 2. Cart List ko clear karo aur naye items inject karo
    cartList.innerHTML = ""; 
    
    if (cart.length === 0) {
        cartList.innerHTML = "<p style='color:#555; text-align:center;'>Cart is empty</p>";
    } else {
        cart.forEach((item, index) => {
            const row = document.createElement('div');
            row.style.cssText = "display:flex; justify-content:space-between; padding:10px 0; border-bottom:1px solid #222;";
            row.innerHTML = `
                <span>${item.name}</span>
                <span>₹${item.price} 
                    <button onclick="removeFromCart(${index})" style="color:red; background:none; border:none; cursor:pointer; margin-left:10px;">✕</button>
                </span>
            `;
            cartList.appendChild(row);
        });
    }
}

// Ye function zaruri hai items hatane ke liye
function removeFromCart(index) {
    cart.splice(index, 1);
    updateCartUI();
}

// ==========================================
// ORDER ACTIONS
// ==========================================
function setupOrderButtons(tableNum, clientToken) {
    const checkoutBtn = document.getElementById('checkoutBtn');
    const billBtn = document.getElementById('billBtn');

    if (checkoutBtn) {
        checkoutBtn.onclick = () => placeOrder(tableNum, clientToken);
    }
    if (billBtn) {
        billBtn.onclick = () => requestBill(tableNum);
    }
    
    // Cart Modal Controls
    document.getElementById('viewCartBtn').onclick = () => document.getElementById('cartModal').style.display = 'flex';
    document.getElementById('closeCartBtn').onclick = () => document.getElementById('cartModal').style.display = 'none';
}

function placeOrder(tableNum, clientToken) {
    if (cart.length === 0) return alert("Cart khali hai!");

    const orderToken = localStorage.getItem(`table_${tableNum}_token`) || "NEW_ORDER";

    fetch('/api/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            table: parseInt(tableNum),
            items: cart.map(i => i.name),
            token: orderToken,
            client_token: clientToken
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            alert("🚀 Order Placed!");
            localStorage.setItem(`table_${tableNum}_token`, data.token);
            cart = [];
            updateCartUI();
            document.getElementById('cartModal').style.display = 'none';
        } else {
            alert("Error: " + data.message);
        }
    });
}

function requestBill(tableNum) {
    const orderToken = localStorage.getItem(`table_${tableNum}_token`) || "QR-LIVE";
    fetch('/api/manager/trigger-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table_num: tableNum, status: "Bill_Requested", token: orderToken })
    }).then(() => alert("🔔 Bill request sent!"));
}