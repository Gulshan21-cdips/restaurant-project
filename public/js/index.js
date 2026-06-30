let html5QrcodeScanner = null;

document.addEventListener('DOMContentLoaded', () => {
    loadGallery();
    loadReviews();
    displayOffer(); 
    loadFooterDetails(); // 🌟 Footer component link added
});

// --- 1. DAILY OFFER BROADCAST SYNC ---
function displayOffer() {
    const statusBox = document.getElementById('offerStatusBox');
    const displayText = document.getElementById('activeOfferDisplay');
    
    if(!statusBox || !displayText) return;

    fetch('/api/get-offer')
        .then(res => res.json())
        .then(data => {
            if (data.offer_text && data.offer_text !== "Premium Experience") {
                statusBox.style.display = "flex";
                displayText.innerHTML = `🔥 LIVE BROADCAST: ${data.offer_text} 🔥`;
            } else {
                statusBox.style.display = "none";
            }
        })
        .catch(err => {
            console.log("Offer channel offline:", err);
            statusBox.style.display = "none";
        });
}

// --- 2. ADVANCED QR SCANNER PIPELINE ---
function showScanner() {
    document.getElementById('qr-overlay').style.display = 'flex';
    if (!html5QrcodeScanner) {
        html5QrcodeScanner = new Html5Qrcode("reader");
    }
    
    html5QrcodeScanner.start(
        { facingMode: "environment" }, 
        { fps: 10, qrbox: 250 }, 
        onScanSuccess
    ).catch(err => {
        alert("Camera Initialization Error: " + err);
        hideScanner();
    });
}

function onScanSuccess(decodedText) {
    console.log("Scanned Data Stream:", decodedText); 
    
    try {
        if (decodedText.includes('?')) {
            const urlParams = new URLSearchParams(decodedText.split('?')[1]);
            const tableNum = urlParams.get('table');

            if (tableNum) {
                executeScannerRedirect(tableNum);
                return;
            }
        }
        
        let fallbackTable = decodedText.split('table=')[1] || decodedText.replace(/\D/g, "");
        if (fallbackTable) {
            executeScannerRedirect(fallbackTable);
        } else {
            alert("QR Code structure unrecognized. Table value missing.");
        }
    } catch (err) {
        console.error("Scanner parsing stack error:", err);
        let absoluteFallback = decodedText.replace(/\D/g, "");
        if(absoluteFallback) {
            executeScannerRedirect(absoluteFallback);
        } else {
            alert("Critical scan read conversion failure.");
        }
    }
}

// 🔥 UPGRADED ROUTER: QR Scan hote hi Manager Dashboard par Notification alert trigger karega
function executeScannerRedirect(tableNum) {
    const clientToken = "LX-" + Date.now(); // Unique Token generate
    
    // Yahan hum LocalStorage set kar rahe hain
    localStorage.setItem('selectedTable', tableNum);
    localStorage.setItem('clientToken', clientToken);
    localStorage.removeItem(`table_${tableNum}_token`); // Purane tokens clear karo

    // Ab URL par bhejo
    window.location.href = `menu.html?table=${tableNum}&token=${clientToken}`;
}

function hideScanner() {
    if (html5QrcodeScanner) {
        html5QrcodeScanner.stop()
            .then(() => {
                document.getElementById('qr-overlay').style.display = 'none';
            })
            .catch(() => {
                document.getElementById('qr-overlay').style.display = 'none';
            });
    } else {
        document.getElementById('qr-overlay').style.display = 'none';
    }
}

// --- 3. DYNAMIC AMBIENCE GALLERY ASSETS ---
function loadGallery() {
    const div = document.getElementById('galleryDisplay');
    if(!div) return;

    fetch('/api/get-gallery')
        .then(res => res.json())
        .then(data => {
            if (!data || data.length === 0) {
                div.innerHTML = "<p style='color:gray;'>Our luxury ambience photos are coming soon!</p>";
                return;
            }
            
            div.innerHTML = data.map(i => `
                <div class="gallery-wrapper" style="cursor: pointer;" onclick="openGalleryModal('${i.url}', '${i.title || 'Luxe Ambience'}')">
                    <img src="${i.url}" class="gal-img" alt="${i.title || 'Luxe Ambience'}">
                    <div class="gal-info">
                        <p class="gal-title">${i.title || 'Luxe Ambience'}</p>
                    </div>
                </div>
            `).join('');
        })
        .catch(err => {
            console.error("Gallery Fetch Error:", err);
            div.innerHTML = "<p style='color:red;'>Failed to load architecture assets gallery.</p>";
        });
}

function openGalleryModal(imgUrl, imgTitle) {
    const modal = document.getElementById('galleryModal');
    const modalImg = document.getElementById('modalImage');
    const modalCap = document.getElementById('modalCaption');

    if(modal && modalImg && modalCap) {
        modal.style.display = "flex";
        modalImg.src = imgUrl;
        modalCap.innerText = imgTitle;
    }
}

function closeGalleryModal() {
    const modal = document.getElementById('galleryModal');
    if(modal) {
        modal.style.display = "none";
    }
}

// --- 4. GUEST REVIEWS CLEAN INTERFACE ENGINE ---
function loadReviews() {
    const box = document.getElementById('reviewList');
    if (!box) return;

    fetch('/api/get-all-reviews')
        .then(res => res.json())
        .then(data => {
            if (!data || data.length === 0) {
                box.innerHTML = "<p style='color:gray; text-align:center; padding:20px; grid-column:1/-1;'>Be the first to share your premium experience here!</p>";
                return;
            }

            box.innerHTML = data.map(r => {
                const initial = r.customer_name ? r.customer_name.charAt(0).toUpperCase() : "G";
                
                return `
                <div class="rev-card-item">
                    <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
                        <div style="display:flex; align-items:center; gap:5px;">
                            <div style="width:36px; height:36px; background: linear-gradient(135deg, #d4af37, #b8952d); color: black; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 1rem; flex-shrink: 0;">
                                ${initial}
                            </div>
                            <div>
                                <h4 style="color:gold; margin:0; font-size:1rem; font-weight:600;">${r.customer_name}</h4>
                                <small style="color:#555; font-size:10px; font-family:monospace;">${r.mail || 'Verified Guest'}</small>
                            </div>
                        </div>
                        <div style="color:gold; font-size:12px; letter-spacing:1px; white-space:nowrap;">
                            ${'★'.repeat(r.rating)}<span style="color:#222;">${'★'.repeat(5 - r.rating)}</span>
                        </div>
                    </div>
                    <p style="color:#bbb; font-size:13px; margin:5px 0 0 0; line-height:1.5; font-style: italic;">
                        "${r.comment}"
                    </p>
                </div>`;
            }).join('');
        })
        .catch(err => {
            console.error("Review Load Error:", err);
            box.innerHTML = "<p style='color:red; text-align:center; grid-column:1/-1;'>Could not synchronize feed pipeline stream.</p>";
        });
}

// --- 5. SECURE POST REVIEW TRANSACTIONS ---
const reviewForm = document.getElementById('reviewForm');
if(reviewForm) {
    reviewForm.onsubmit = function(e) {
        e.preventDefault();
        
        const formData = {
            customer_name: document.getElementById('customer_name').value,
            mail: document.getElementById('mail').value,
            rating: document.getElementById('rating').value,
            comment: document.getElementById('comment').value
        };

        fetch('/api/post-review', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        })
        .then(async res => {
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || "Server transmission error.");
            }
            return data;
        })
        .then(() => { 
            alert("Thank you for your valuable feedback!"); 
            reviewForm.reset(); 
            loadReviews(); 
        })
        .catch(err => {
            console.error("Pipeline Flow Exception:", err);
            alert(err.message); 
        });
    };
}

// --- 6. DYNAMIC FOOTER FETCH INTERFACE ---
function loadFooterDetails() {
    const aboutText = document.getElementById('footerAbout');
    const hoursText = document.getElementById('footerHours');
    const contactText = document.getElementById('footerContact');

    fetch('/api/get-footer')
        .then(res => {
            if(!res.ok) throw new Error("Footer pull offline");
            return res.json();
        })
        .then(data => {
            if(data) {
                if(aboutText && data.about_text) aboutText.innerText = data.about_text;
                if(hoursText && data.hours_text) hoursText.innerText = data.hours_text;
                if(contactText && data.contact_text) contactText.innerHTML = data.contact_text;
            }
        })
        .catch(err => {
            console.log("Footer system loading in fallback default state:", err);
        });
}