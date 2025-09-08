// Menunggu dokumen html terload dulu
document.addEventListener('DOMContentLoaded', () => {

    // Definisikan yang ada di HTML
    const calendarBody = document.getElementById('calendar-body');
    const currentMonthYear = document.getElementById('current-month-year');
    const locationInfo = document.querySelector('.location-info');
    const prevMonthBtn = document.getElementById('prev-month');
    const nextMonthBtn = document.getElementById('next-month');
    const loader = document.getElementById('loader');

    // Variabel menyimpan tanggal sekarang
    let currentDate = new Date(2025, 0, 1); // Mulai dari januari 2025
    let calendarData = []; // Menyimpan data dari API (gunakan array [])

    // 1. Fungsi untuk mendapatkan lokasi pengguna
    function getUserLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(position => {
                const { latitude, longitude } = position.coords;
                locationInfo.textContent = `Kalender untuk lokasi Anda (Lat: ${latitude.toFixed(2)}, Lon: ${longitude.toFixed(2)})`;
                fetchCalendarData(currentDate.getFullYear(), currentDate.getMonth() + 1, latitude, longitude);
            }, error => {
                // Kalau gagal akses lokasi, otomatis jadi Jakarta
                console.warn("Gagal mendapatkan lokasi. Menggunakan lokasi default Jakarta.", error);
                locationInfo.textContent = 'Gagal deteksi lokasi. Menampilkan kalender untuk Jakarta';
                const jakartaLat = -6.2088;
                const jakartaLon = 106.8456;
                fetchCalendarData(currentDate.getFullYear(), currentDate.getMonth() + 1, jakartaLat, jakartaLon);
            });
        } else {
            // Jika browser tidak support Geolocation
            console.error("Geolocation tidak support di browser ini.");
            locationInfo.textContent = 'Browser tidak mendukung deteksi lokasi. Menampilkan kalender untuk Jakarta.';
            const jakartaLat = -6.2088;
            const jakartaLon = 106.8456;
            
            fetchCalendarData(currentDate.getFullYear(), currentDate.getMonth() + 1, jakartaLat, jakartaLon);
        }
    }

    // Fungsi untuk mengambil data dari API
    async function fetchCalendarData(year, month, lat, lon) {
        // Menampilkan loading
        loader.style.display = 'block';
        calendarBody.style.display = 'none';

        const method = 10;
        const apiUrl = `https://api.aladhan.com/v1/calendar/${year}/${month}?latitude=${lat}&longitude=${lon}&method=${method}`;
        
        try {
            const respons = await fetch(apiUrl);
           
            if (!respons.ok) {
                throw new Error(`HTTP error! status: ${respons.status}`);
            }
            const data = await respons.json();
            calendarData = data.data; // save data yang didapat
            renderCalendar(); // Menampilkan kalender
        } catch (error) {
            console.error("Gagal memuat data kalender:", error);
            locationInfo.textContent = "Gagal memuat data. Coba lagi!";
        } finally {
            // sembunyikan loading
            loader.style.display = 'none';
            calendarBody.style.display = 'grid';
        }
    }

    // Fungsi menampilkan kalender ke web
    function renderCalendar() {
        
        if (!calendarData || calendarData.length === 0) return;

        calendarBody.innerHTML = '';

        // update judul bulan dan tahun
        const firstDayData = calendarData[0];
        currentMonthYear.textContent = `${firstDayData.date.gregorian.month.en} ${firstDayData.date.gregorian.year} / ${firstDayData.date.hijri.month.en} ${firstDayData.date.hijri.year} H`;
        
        // mencari hari pertama di bulan ini apa
        const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

        // Tambahkan sel kosong untuk hari-hari sebelum tanggal 1
        for (let i = 0; i < firstDayOfMonth; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.classList.add('calendar-day', 'is-other-month');
            calendarBody.appendChild(emptyCell);
        }

        // tambahkan semua tanggal dalam sebulan
        calendarData.forEach(day => {
            const dayCell = document.createElement('div');
            dayCell.classList.add('calendar-day');

            // mengecek hari apa hari ini
            const today = new Date();
            
            const dayDate = new Date(day.date.readable);
            
            if (today.toDateString() === dayDate.toDateString()) {
                dayCell.classList.add('is-today');
            }

            // Buat konten setiap sel tanggal
            dayCell.innerHTML = `
                <div class="gregorian-date">${day.date.gregorian.day}</div>
                <div class="hijri-date">${day.date.hijri.day} ${day.date.hijri.month.ar}</div>
            `;
            
            // Tambahkan sel tanggal yang sudah dibuat ke dalam kalender
            calendarBody.appendChild(dayCell);
        });
    }

    // Tombol bulan sebelumnya
    prevMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        getUserLocation(); // Ambil data lagi untuk bulan yang baru
    });

    // Tombol bulan berikutnya
    nextMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        getUserLocation(); // Ambil data lagi untuk bulan yang baru
    });


    // --- INISIALISASI ---
    // Panggil fungsi untuk pertama kali saat halaman dimuat
    getUserLocation();
});