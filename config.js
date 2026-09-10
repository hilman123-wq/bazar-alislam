// ==========================================
// KONFIGURASI FRONTEND
// ==========================================

// WARNING: REPLACE THIS URL WITH YOUR ACTUAL DEPLOYED GOOGLE APPS SCRIPT WEB APP URL
const API_URL = "https://script.google.com/macros/s/AKfycbwhkjnEC-89jb5lgaKexZnVCUOQpLfOav4z1bVFyNpg-YOMzPzhOqA7dkNv2y2xJtU/exec";

// Format Rupiah utility
const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(number);
};
