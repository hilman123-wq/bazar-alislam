// ==========================================
// KONFIGURASI FRONTEND
// ==========================================

// WARNING: REPLACE THIS URL WITH YOUR ACTUAL DEPLOYED GOOGLE APPS SCRIPT WEB APP URL
const API_URL = "https://script.google.com/macros/s/AKfycbzsEtpGNTw-I_-uXEvwpiThrppacJuUB5oCJDIzztI6d4nuyq1HVdOGXdqp35CurTw/exec";

// Format Rupiah utility
const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(number);
};
