document.addEventListener('DOMContentLoaded', () => {

    // Definisikan elemen HTML
    const calendarBody = document.getElementById('calendar-body');
    const prevMonthBtn = document.getElementById('prev-month');
    const nextMonthBtn = document.getElementById('next-month');
    const loader = document.getElementById('loader');
    const gregorianYearEl = document.getElementById('gregorian-year');
    const hijriYearEl = document.getElementById('hijri-year');
    const hijriMonthNameEl = document.getElementById('hijri-month-name');
    const gregorianMonthNameEl = document.getElementById('gregorian-month-name');
    const fastingDetailsEl = document.getElementById('fasting-details'); // Elemen untuk penjelasan puasa
    
    // Variabel state
    let currentDate = new Date(2025, 0, 1);
    let calendarData = [];

    // --- DATA PUASA SUNNAH DAN DALILNYA ---
    const fastingData = {
        seninKamis: {
            title: "Puasa Senin dan Kamis",
            dalil: "“Amalan-amalan diperlihatkan pada hari Senin dan Kamis, maka aku ingin saat amalku diperlihatkan aku sedang berpuasa.” (HR. Tirmidzi dan Nasa’i)"
        },
        ayyamulBidh: {
            title: "Puasa Ayyamul Bidh",
            dalil: '"Berpuasalah tiga hari dalam sebulan, karena satu kebaikan dibalas sepuluh kali lipat." (HR. Bukhari)'
        },
        syawal: {
            title: "Puasa Enam Hari di Bulan Syawal",
            dalil: '“Barang siapa berpuasa Ramadan kemudian mengikutinya dengan enam hari di bulan Syawal, maka ia seperti berpuasa sepanjang tahun.” (HR. Muslim)'
        },
        arafah: {
            title: "Puasa Arafah (9 Dzulhijjah)",
            dalil: '“Puasa Arafah menghapus dosa tahun lalu dan tahun yang akan datang.” (HR. Muslim)'
        },
        asyuraTaua: {
            title: "Puasa Asyura dan Tasu’a",
            dalil: '“Puasa Asyura menghapus dosa setahun yang lalu.” (HR. Muslim)'
        },
        muharram: {
            title: "Puasa di Bulan Muharram",
            dalil: '“Puasa yang paling utama setelah Ramadan adalah di bulan Allah, yaitu Muharram.” (HR. Muslim)'
        },
        syaban: {
            title: "Puasa di Bulan Sya’ban",
            dalil: '“Beliau biasa berpuasa di bulan Sya’ban seluruhnya (atau sebagian besar).” (HR. Bukhari dan Muslim)'
        }
    };

    // --- LOGIKA UTAMA ---
    async function fetchCalendarData(year, month) {
        loader.style.display = 'block';
        calendarBody.style.display = 'none';
        const lat = -6.2088; // Jakarta
        const lon = 106.8456;
        const apiUrl = `https://api.aladhan.com/v1/calendar/${year}/${month}?latitude=${lat}&longitude=${lon}&method=10`;
        
        try {
            const response = await fetch(apiUrl);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            calendarData = data.data;
            renderCalendar();
        } catch (error) {
            console.error("Gagal memuat data kalender:", error);
        } finally {
            loader.style.display = 'none';
            calendarBody.style.display = 'grid';
        }
    }

    function renderCalendar() {
        if (!calendarData || calendarData.length === 0) return;

        calendarBody.innerHTML = '';
        const firstDayData = calendarData[0];
        const currentHijriMonth = firstDayData.date.hijri.month.number;

        // Update info bulan di sidebar
        gregorianYearEl.textContent = firstDayData.date.gregorian.year;
        hijriYearEl.textContent = `${firstDayData.date.hijri.year} H`;
        hijriMonthNameEl.textContent = firstDayData.date.hijri.month.en.toUpperCase();
        gregorianMonthNameEl.textContent = firstDayData.date.gregorian.month.en.toUpperCase();

        const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
        for (let i = 0; i < firstDayOfMonth; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.classList.add('calendar-day', 'is-other-month');
            calendarBody.appendChild(emptyCell);
        }

        const relevantFasts = new Set(); 

        calendarData.forEach(day => {
            const dayCell = document.createElement('div');
            dayCell.classList.add('calendar-day');
            
            const today = new Date();
            const dayDate = new Date(day.date.readable);
            if (today.toDateString() === dayDate.toDateString()) {
                dayCell.classList.add('is-today');
            }

            const hijriDay = parseInt(day.date.hijri.day);
            const hijriMonth = day.date.hijri.month.number;
            const gregorianWeekday = day.date.gregorian.weekday.en;

            let fastingText = '';
            
            if (hijriMonth === 9) {
                fastingText = 'Puasa Ramadhan';
            } 
            else if (hijriMonth === 12 && hijriDay === 9) {
                fastingText = 'Puasa Arafah';
                relevantFasts.add('arafah');
            } else if (hijriMonth === 1 && hijriDay === 9) {
                fastingText = 'Puasa Tasu’a';
                relevantFasts.add('asyuraTaua');
            } else if (hijriMonth === 1 && hijriDay === 10) {
                fastingText = 'Puasa Asyura';
                relevantFasts.add('asyuraTaua');
            }
            else if ([13, 14, 15].includes(hijriDay)) {
                fastingText = 'Puasa Ayyamul Bidh';
                dayCell.classList.add('is-ayyamul-bidh');
                relevantFasts.add('ayyamulBidh');
            }
            else if (gregorianWeekday === 'Monday' || gregorianWeekday === 'Thursday') {
                fastingText = (gregorianWeekday === 'Monday') ? 'Puasa Senin' : 'Puasa Kamis';
                relevantFasts.add('seninKamis');
            }
            
            dayCell.innerHTML = `
                <div class="date-container">
                    <div class="gregorian-date">${day.date.gregorian.day}</div>
                    <div class="hijri-date-cell">${day.date.hijri.day}</div>
                </div>
                <div class="fasting-info">${fastingText}</div>
            `;
            calendarBody.appendChild(dayCell);
        });
        
        updateFastingExplanation(currentHijriMonth, relevantFasts);
    }

    function updateFastingExplanation(hijriMonth, relevantFasts) {
        fastingDetailsEl.innerHTML = ''; // Kosongkan dulu
        
        // Selalu tampilkan penjelasan puasa rutin
        relevantFasts.add('seninKamis');
        relevantFasts.add('ayyamulBidh');

        // Tambahkan penjelasan puasa berdasarkan bulan
        if (hijriMonth === 1) relevantFasts.add('muharram');
        if (hijriMonth === 8) relevantFasts.add('syaban');
        if (hijriMonth === 10) relevantFasts.add('syawal');
        if (hijriMonth === 12) relevantFasts.add('arafah');
        
        // Urutkan penjelasan agar konsisten
        const sortedFasts = Array.from(relevantFasts).sort();

        sortedFasts.forEach(fastKey => {
            const fast = fastingData[fastKey];
            if (fast) {
                const explanationHTML = `
                    <h4>${fast.title}</h4>
                    <p>${fast.dalil}</p>
                `;
                fastingDetailsEl.innerHTML += explanationHTML;
            }
        });
    }

    // --- EVENT LISTENERS ---
    prevMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        fetchCalendarData(currentDate.getFullYear(), currentDate.getMonth() + 1);
    });

    nextMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        fetchCalendarData(currentDate.getFullYear(), currentDate.getMonth() + 1);
    });

    // --- INISIALISASI ---
    fetchCalendarData(currentDate.getFullYear(), currentDate.getMonth() + 1);
});
