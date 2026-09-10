// ==========================================
// KONFIGURASI FRONTEND
// ==========================================

// WARNING: REPLACE THIS URL WITH YOUR ACTUAL DEPLOYED GOOGLE APPS SCRIPT WEB APP URL
const CONFIG = {
    // API_URL: "https://script.google.com/macros/s/AKfycb.../exec", // Example format
    API_URL: "YOUR_APPS_SCRIPT_WEB_APP_URL_HERE", 
};

// Format Rupiah utility
const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(number);
};