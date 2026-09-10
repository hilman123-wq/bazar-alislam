// ==========================================
// APLIKASI UTAMA (Vanilla JS)
// ==========================================

let currentUser = null;
let html5QrcodeScanner = null;

// --- DOM ELEMENTS ---
const screens = {
    login: document.getElementById('login-screen'),
    main: document.getElementById('main-screen')
};

const views = {
    dashboard: document.getElementById('view-dashboard'),
    scan: document.getElementById('view-scan'),
    terbitVoucher: document.getElementById('view-terbit-voucher'),
    printVoucher: document.getElementById('view-print-voucher')
};

const ui = {
    loading: document.getElementById('loading'),
    toast: document.getElementById('toast'),
    toastMsg: document.getElementById('toast-msg'),
    navLinks: document.getElementById('nav-links'),
    userInfo: document.getElementById('user-info'),
    sidebar: document.getElementById('sidebar'),
    menuToggle: document.getElementById('menu-toggle')
};

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    checkSession();
    setupEventListeners();
});

// --- CORE FUNCTIONS ---
function showLoading(show = true) {
    if(show) ui.loading.classList.remove('hidden');
    else ui.loading.classList.add('hidden');
}

function showToast(message, isError = false) {
    ui.toastMsg.innerText = message;
    ui.toast.style.background = isError ? "var(--danger-color)" : "#323232";
    ui.toast.classList.remove('hidden');
    setTimeout(() => {
        ui.toast.classList.add('hidden');
    }, 3000);
}

function switchScreen(screenName) {
    Object.values(screens).forEach(s => s.classList.add('hidden'));
    screens[screenName].classList.remove('hidden');
}

function switchView(viewName) {
    Object.values(views).forEach(v => v.classList.add('hidden'));
    views[viewName].classList.remove('hidden');
    
    // Cleanup scanner if navigating away from scan view
    if (viewName !== 'scan' && html5QrcodeScanner) {
        html5QrcodeScanner.clear().catch(e => console.error("Scanner clear error", e));
        html5QrcodeScanner = null;
    }
}

// --- API WRAPPER ---
async function api(action, data = {}) {
    if (CONFIG.API_URL === "YOUR_APPS_SCRIPT_WEB_APP_URL_HERE") {
        showToast("Error: API URL belum dikonfigurasi di config.js!", true);
        return { success: false, message: "API URL missing" };
    }

    const token = localStorage.getItem('session_token');
    
    try {
        const response = await fetch(CONFIG.API_URL, {
            method: 'POST',
            mode: 'cors', // Ensure CORS is handled by GAS correctly
            body: JSON.stringify({ action, token, data })
        });
        
        const result = await response.json();
        
        if (!result.success && result.code === 'UNAUTHORIZED') {
            handleLogout(false); // Force logout
            showToast(result.message, true);
        }
        
        return result;
    } catch (error) {
        console.error("API Error:", error);
        return { success: false, message: "Koneksi ke server gagal. Coba lagi." };
    }
}

// --- AUTHENTICATION ---
function checkSession() {
    const userStr = localStorage.getItem('user_data');
    if (userStr) {
        currentUser = JSON.parse(userStr);
        setupUserInterface();
        switchScreen('main');
        loadDashboard();
    } else {
        switchScreen('login');
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const userIn = document.getElementById('username').value;
    const passIn = document.getElementById('password').value;
    
    showLoading(true);
    const res = await api('login', { username: userIn, password: passIn });
    showLoading(false);
    
    if (res.success) {
        localStorage.setItem('session_token', res.data.token);
        localStorage.setItem('user_data', JSON.stringify(res.data));
        currentUser = res.data;
        
        showToast("Login Berhasil");
        document.getElementById('login-form').reset();
        setupUserInterface();
        switchScreen('main');
        loadDashboard();
    } else {
        showToast(res.message, true);
    }
}

function handleLogout(callApi = true) {
    if (callApi && currentUser) api('logout'); // Fire and forget
    localStorage.removeItem('session_token');
    localStorage.removeItem('user_data');
    currentUser = null;
    switchScreen('login');
}

// --- UI SETUP BASED ON ROLE ---
function setupUserInterface() {
    ui.userInfo.innerText = currentUser.nama;
    document.getElementById('dash-role-badge').innerText = currentUser.role;
    
    // Build Navigation based on role
    let navHtml = `<li><a href="#" onclick="loadDashboard(); return false;">Dashboard</a></li>`;
    
    if (currentUser.role === 'ADMIN') {
        navHtml += `<li><a href="#" onclick="showToast('Fitur Master Data dalam pengembangan'); return false;">Master Data</a></li>`;
        navHtml += `<li><a href="#" onclick="showToast('Fitur Laporan dalam pengembangan'); return false;">Laporan</a></li>`;
    } 
    else if (currentUser.role === 'PEDAGANG') {
        navHtml += `<li><a href="#" onclick="initScanVoucher(); return false;">Scan Voucher</a></li>`;
        navHtml += `<li><a href="#" onclick="showToast('Fitur Riwayat dalam pengembangan'); return false;">Riwayat Transaksi</a></li>`;
    }
    else if (currentUser.role.startsWith('EDC')) {
        navHtml += `<li><a href="#" onclick="initTerbitVoucher(); return false;">Terbitkan Voucher</a></li>`;
        navHtml += `<li><a href="#" onclick="showToast('Fitur Tarik Tunai dalam pengembangan'); return false;">Tarik Tunai</a></li>`;
    }

    ui.navLinks.innerHTML = navHtml;
}

// --- VIEW CONTROLLERS ---

// 1. DASHBOARD
async function loadDashboard() {
    switchView('dashboard');
    showLoading(true);
    const res = await api('getDashboard');
    showLoading(false);
    
    if(res.success) {
        const d = res.data;
        const grid = document.getElementById('dashboard-widgets');
        let html = '';
        
        if (currentUser.role === 'ADMIN') {
            html += `<div class="widget"><h4>Status Bazar</h4><p>${d.status_bazar}</p></div>`;
            html += `<div class="widget"><h4>Kegiatan Aktif</h4><p style="font-size:1rem;">${d.kegiatan_aktif}</p></div>`;
            html += `<div class="widget"><h4>Trx Hari Ini</h4><p>${d.jumlah_transaksi}</p></div>`;
            html += `<div class="widget"><h4>Total Nominal Trx</h4><p>${formatRupiah(d.total_transaksi)}</p></div>`;
        } else if (currentUser.role === 'PEDAGANG') {
            html += `<div class="widget"><h4>Trx Hari Ini</h4><p>${d.jumlah_transaksi}</p></div>`;
            html += `<div class="widget"><h4>Total Penjualan</h4><p>${formatRupiah(d.total_penjualan)}</p></div>`;
            html += `<div class="widget"><h4>Belum Dicairkan</h4><p style="color:var(--danger-color);">${formatRupiah(d.belum_dicairkan)}</p></div>`;
        } else if (currentUser.role.startsWith('EDC')) {
            html += `<div class="widget"><h4>Voucher Diterbitkan</h4><p>${d.voucher_diterbitkan}</p></div>`;
            html += `<div class="widget"><h4>Total Nominal</h4><p>${formatRupiah(d.total_nominal_voucher)}</p></div>`;
        }
        
        grid.innerHTML = html;
    }
    
    // Close sidebar on mobile after click
    ui.sidebar.classList.remove('active');
}

// 2. SCAN VOUCHER (PEDAGANG)
function initScanVoucher() {
    switchView('scan');
    document.getElementById('scan-result').classList.add('hidden');
    document.getElementById('manual-token').value = '';
    
    // Initialize Scanner
    if (!html5QrcodeScanner) {
        html5QrcodeScanner = new Html5QrcodeScanner("qr-reader", { fps: 10, qrbox: {width: 250, height: 250} }, false);
        html5QrcodeScanner.render(onScanSuccess, onScanFailure);
    }
}

function onScanSuccess(decodedText, decodedResult) {
    // Stop scanner temporary to avoid multiple scans
    if (html5QrcodeScanner) html5QrcodeScanner.pause(true);
    processVoucherToken(decodedText);
}
function onScanFailure(error) { /* handle quietly */ }

document.getElementById('btn-manual-cek').addEventListener('click', () => {
    const token = document.getElementById('manual-token').value.trim();
    if(token) processVoucherToken(token);
    else showToast("Masukkan token terlebih dahulu", true);
});

async function processVoucherToken(token) {
    showLoading(true);
    const res = await api('validateVoucher', { qr_token: token });
    showLoading(false);
    
    if (res.success) {
        document.getElementById('scan-result').classList.remove('hidden');
        document.getElementById('scan-santri').innerText = res.data.santri_nama;
        document.getElementById('scan-saldo').innerText = formatRupiah(res.data.saldo);
        document.getElementById('active-qr-token').value = token;
        document.getElementById('nominal-belanja').value = '';
        document.getElementById('nominal-belanja').focus();
        showToast("Voucher Valid");
    } else {
        showToast(res.message, true);
        if (html5QrcodeScanner && html5QrcodeScanner.getState() === Html5QrcodeScannerState.PAUSED) {
            html5QrcodeScanner.resume();
        }
    }
}

document.getElementById('btn-batal-trx').addEventListener('click', () => {
    document.getElementById('scan-result').classList.add('hidden');
    if (html5QrcodeScanner && html5QrcodeScanner.getState() === Html5QrcodeScannerState.PAUSED) {
        html5QrcodeScanner.resume();
    }
});

document.getElementById('btn-proses-trx').addEventListener('click', async () => {
    const token = document.getElementById('active-qr-token').value;
    const nominal = document.getElementById('nominal-belanja').value;
    
    if(!nominal || nominal <= 0) {
        showToast("Masukkan nominal belanja yang benar", true);
        return;
    }
    
    if(!confirm(`Proses transaksi sebesar ${formatRupiah(nominal)}?`)) return;

    showLoading(true);
    const res = await api('createTransaction', { qr_token: token, nominal_belanja: nominal });
    showLoading(false);
    
    if (res.success) {
        showToast("Transaksi Berhasil ✓");
        alert(`SUKSES\nBelanja: ${formatRupiah(res.data.nominal)}\nSisa Saldo: ${formatRupiah(res.data.saldo_sesudah)}`);
        document.getElementById('scan-result').classList.add('hidden');
        
        // Resume Scanner for next customer
        if (html5QrcodeScanner && html5QrcodeScanner.getState() === Html5QrcodeScannerState.PAUSED) {
            html5QrcodeScanner.resume();
        }
    } else {
        showToast(res.message, true);
    }
});

// 3. TERBITKAN VOUCHER (EDC)
async function initTerbitVoucher() {
    switchView('terbitVoucher');
    document.getElementById('form-terbit-voucher').reset();
    
    showLoading(true);
    // Load Master Data simultaneously
    const [santriRes, kegiatanRes] = await Promise.all([
        api('getSantri'),
        api('getKegiatan')
    ]);
    showLoading(false);

    if (santriRes.success) {
        const sel = document.getElementById('select-santri');
        sel.innerHTML = '<option value="">-- Pilih Santri --</option>' + 
            santriRes.data.map(s => `<option value="${s.santri_id}">${s.nama} (${s.kelas})</option>`).join('');
    }
    if (kegiatanRes.success) {
        const sel = document.getElementById('select-kegiatan');
        // Preselect active activities if possible
        let html = '<option value="">-- Pilih Kegiatan --</option>';
        kegiatanRes.data.forEach(k => {
            let selected = (k.status === 'AKTIF') ? 'selected' : '';
            html += `<option value="${k.kegiatan_id}" ${selected}>${k.nama_kegiatan}</option>`;
        });
        sel.innerHTML = html;
    }
}

document.getElementById('form-terbit-voucher').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
        santri_id: document.getElementById('select-santri').value,
        kegiatan_id: document.getElementById('select-kegiatan').value,
        nominal: document.getElementById('voucher-nominal').value,
        ref_edc: document.getElementById('voucher-ref').value
    };
    
    showLoading(true);
    const res = await api('createVoucher', data);
    showLoading(false);
    
    if (res.success) {
        showToast("Voucher Diterbitkan!");
        
        // Setup Print View
        document.getElementById('v-print-nominal').innerText = formatRupiah(res.data.nominal);
        document.getElementById('v-print-id').innerText = res.data.voucher_id;
        document.getElementById('v-print-tgl').innerText = res.data.tanggal;
        
        // Very basic QR representation for demo (In real app, use a library like qrcode.js to generate actual image here)
        // For this MVP SPA without heavy external libraries, we just show the token text.
        document.getElementById('voucher-qr-display').innerText = "[QR_IMAGE_HERE]";
        document.getElementById('voucher-token-text').innerText = res.data.qr_token;
        
        switchView('printVoucher');
    } else {
        showToast(res.message, true);
    }
});

document.getElementById('btn-back-terbit').addEventListener('click', () => {
    initTerbitVoucher();
});


// --- EVENT LISTENERS ---
document.getElementById('login-form').addEventListener('submit', handleLogin);
document.getElementById('btn-logout').addEventListener('click', handleLogout);
ui.menuToggle.addEventListener('click', () => {
    ui.sidebar.classList.toggle('active');
});