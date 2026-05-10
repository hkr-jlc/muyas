// ============================================
// Al-Muyassar fi 'Ilm al-Nahw - Unified JavaScript
// Supports 3 Levels with dynamic XML loading
// RTL Arabic layout
// ============================================

// State
let currentSection = 'contents';
let showTashkeel = false;
let showIndonesian = false;
let xmlData = null;
let sectionOrder = [];
let currentLevel = localStorage.getItem('muyassarLevel') || '';

// ============================================
// TASHKEEL UTILITY
// ============================================

const tashkeelMap = {};

function storeTashkeel(gundul, tashkeel) {
    if (gundul && tashkeel && gundul !== tashkeel) {
        tashkeelMap[gundul] = tashkeel;
    }
}

function removeTashkeel(text) {
    if (!text) return '';
    if (tashkeelMap[text]) return text;
    return text
        .replace(/[\u064B-\u0652]/g, '')
        .replace(/\u0651/g, '')
        .replace(/\u0670/g, '')
        .replace(/\u0640/g, '');
}

function applyTashkeelState() {
    document.querySelectorAll('.teks_arab').forEach(el => {
        const tashkeel = el.getAttribute('data-tashkeel');
        if (!tashkeel) return;
        const gundul = removeTashkeel(tashkeel);
        el.textContent = showTashkeel ? tashkeel : gundul;
    });
}

// Helper: Render Arabic text with tashkeel toggle support
// Default: gundul (no tashkeel). Click "تشكيل" to show tashkeel.
// SEMUA teks Arab otomatis pakai class="teks_arab"
function ar(text) {
    if (!text) return '';
    const tashkeel = tashkeelMap[text] || text;
    const display = showTashkeel ? tashkeel : text;
    return `<span class="teks_arab" data-tashkeel="${tashkeel.replace(/"/g, '&quot;')}">${display}</span>`;
}

function arText(text) {
    if (!text) return '';
    return text;
}

// Level Configuration
const LEVEL_CONFIG = {
    '1': { name: '١', label: 'المُسْتَوَى الْأَوَّلُ', color: '#27ae60', xmlFile: 'muyassar_level1.xml', desc: 'مُسْتَوَى الْمُبْتَدِئِينَ' },
    '2': { name: '٢', label: 'المُسْتَوَى الثَّانِي', color: '#2980b9', xmlFile: 'muyassar_level2.xml', desc: 'مُسْتَوَى الْمُتَوَسِّطِينَ' },
    '3': { name: '٣', label: 'المُسْتَوَى الثَّالِث', color: '#8e44ad', xmlFile: 'muyassar_level3.xml', desc: 'مُسْتَوَى الْمُتَقَدِّمِينَ' }
};

// ============================================
// LEVEL SELECTION
// ============================================

function selectLevel(level) {
    currentLevel = level;
    localStorage.setItem('muyassarLevel', level);
    document.getElementById('level-selector').classList.add('hidden');
    updateUILevel();
    loadXMLData();
}

function showLevelSelector() {
    closeDrawer();
    document.getElementById('level-selector').classList.remove('hidden');
}

function updateUILevel() {
    const config = LEVEL_CONFIG[currentLevel];
    if (!config) return;

    document.getElementById('drawer-logo').textContent = 'المُيَسَّرُ';
    document.getElementById('drawer-level-info').textContent = config.label;
    document.getElementById('current-section-title').textContent = 'المُيَسَّرُ';
    document.title = `${config.label} - المُيَسَّرُ فِي عِلْمِ النَّحْوِ`;
}

document.addEventListener('DOMContentLoaded', function() {
    const savedLevel = localStorage.getItem('muyassarLevel');
    if (savedLevel && LEVEL_CONFIG[savedLevel]) {
        currentLevel = savedLevel;
        document.getElementById('level-selector').classList.add('hidden');
        updateUILevel();
        loadXMLData();
    }
});

// ============================================
// DRAWER FUNCTIONS
// ============================================

function openDrawer() {
    document.getElementById('sidebar-drawer').classList.add('active');
    document.getElementById('drawer-overlay').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeDrawer() {
    document.getElementById('sidebar-drawer').classList.remove('active');
    document.getElementById('drawer-overlay').classList.remove('active');
    document.body.style.overflow = '';
}

function toggleDrawer() {
    const drawer = document.getElementById('sidebar-drawer');
    if (drawer.classList.contains('active')) {
        closeDrawer();
    } else {
        openDrawer();
    }
}

function toggleSubmenu(babId) {
    const submenu = document.getElementById(`submenu-${babId}`);
    const icon = document.getElementById(`expand-icon-${babId}`);
    if (!submenu || !icon) return;
    
    if (submenu.classList.contains('expanded')) {
        submenu.classList.remove('expanded');
        icon.classList.remove('expanded');
        icon.textContent = '◄';
    } else {
        submenu.classList.add('expanded');
        icon.classList.add('expanded');
        icon.textContent = '▼';
    }
}

// ============================================
// TRANSLATION / TASHKEEL FUNCTIONS
// ============================================

function toggleTashkeel() {
    showTashkeel = !showTashkeel;
    const btn = document.getElementById('translate-tashkeel-btn');
    const text = btn.querySelector('.translate-text');

    if (showTashkeel) {
        btn.classList.add('tashkeel-active');
        text.textContent = 'تَشْكِيل';
    } else {
        btn.classList.remove('tashkeel-active');
        text.textContent = 'تشكيل';
    }

    applyTashkeelState();
    localStorage.setItem('muyassarShowTashkeel', showTashkeel);
}

function toggleIndonesian() {
    showIndonesian = !showIndonesian;
    const btn = document.getElementById('translate-id-btn');
    const text = btn.querySelector('.translate-text');

    if (showIndonesian) {
        btn.classList.add('id-active');
        text.textContent = 'ON';
    } else {
        btn.classList.remove('id-active');
        text.textContent = 'ID';
    }

    document.querySelectorAll('.translation-id').forEach(el => {
        el.classList.toggle('visible', showIndonesian);
    });

    localStorage.setItem('muyassarShowIndonesian', showIndonesian);
}

// ============================================
// XML DATA LOADING
// ============================================

async function loadXMLData() {
    const config = LEVEL_CONFIG[currentLevel];
    if (!config) return;

    try {
        const response = await fetch(config.xmlFile);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const xmlText = await response.text();
        const parser = new DOMParser();
        xmlData = parser.parseFromString(xmlText, 'text/xml');

        renderDrawer('contents');
        renderAllContent();
        buildSectionOrder();

        const savedTashkeel = localStorage.getItem('muyassarShowTashkeel');
        const savedId = localStorage.getItem('muyassarShowIndonesian');
        
        if (savedTashkeel === 'true') {
            showTashkeel = false;
            toggleTashkeel();
        }
        
        if (savedId === 'true') toggleIndonesian();
    } catch (error) {
        console.error(`Error loading ${config.xmlFile}:`, error);
        document.getElementById('main-container').innerHTML = `
            <div style="text-align:center; padding:2rem; color:#dc2626; font-family: var(--font-body);">
                <p style="font-size:1.25rem; margin-bottom:1rem;">⚠️ خطأ في تحميل الملف</p>
                <p>تعذر تحميل ${config.xmlFile}</p>
                <p style="margin-top:1rem; font-size:0.9375rem; color:#6b7280;">يرجى التحقق من وجود الملف والمحاولة مرة أخرى</p>
            </div>
        `;
    }
}

// ============================================
// PARSE XML DATA
// ============================================

function getText(parent, tag) {
    const el = parent.querySelector(`:scope > ${tag}`);
    if (!el) return '';
    const gundul = el.textContent.trim() || '';
    const tashkeel = el.getAttribute('data-tashkeel');
    if (tashkeel) {
        storeTashkeel(gundul, tashkeel);
    }
    return gundul;
}

// Get Indonesian translation from teks_id attribute
function getTranslation(parent, tag) {
    const el = parent.querySelector(`:scope > ${tag}`);
    return el ? (el.getAttribute('teks_id') || '') : '';
}

function parseContent(contentEl) {
    if (!contentEl) return null;

    const type = contentEl.getAttribute('type') || 'definisi';
    const content = {
        type: type,
        teks: getText(contentEl, 'teks'),
        teksId: getTranslation(contentEl, 'teks'),
        teksLanjutan: getText(contentEl, 'teks_lanjutan'),
        teksLanjutanId: getTranslation(contentEl, 'teks_lanjutan'),
        teksLanjutan2: getText(contentEl, 'teks_lanjutan2'),
        teksLanjutan2Id: getTranslation(contentEl, 'teks_lanjutan2'),
        keterangan: getText(contentEl, 'keterangan'),
        keteranganId: getTranslation(contentEl, 'keterangan'),
        catatan: getText(contentEl, 'catatan'),
        catatanId: getTranslation(contentEl, 'catatan'),
        contohList: [],
        contohIdList: [],
        qismahList: [],
        tamrin: null,
        items: []
    };

    // Parse contoh - ambil teks_id langsung dari atribut
    contentEl.querySelectorAll(':scope > contoh').forEach(c => {
        content.contohList.push(c.textContent.trim());
        content.contohIdList.push(c.getAttribute('teks_id') || '');
    });

    // Parse qismah (diagram sections)
    contentEl.querySelectorAll(':scope > qism').forEach(q => {
        const contohs = [];
        q.querySelectorAll(':scope > contoh').forEach(c => contohs.push(c.textContent.trim()));

        content.qismahList.push({
            id: q.getAttribute('id'),
            nama: getText(q, 'nama'),
            namaId: getTranslation(q, 'nama'),
            definisi: getText(q, 'definisi'),
            definisiId: getTranslation(q, 'definisi'),
            contohs: contohs
        });
    });

    // Parse tamrin - ambil teks_id langsung dari atribut soal
    const tamrinEl = contentEl.querySelector(':scope > tamrin');
    if (tamrinEl) {
        const soals = [];
        tamrinEl.querySelectorAll(':scope > soal').forEach(s => {
            soals.push({
                id: s.getAttribute('id'),
                teks: s.textContent.trim(),
                teksId: s.getAttribute('teks_id') || ''
            });
        });
        content.tamrin = { soals };
    }

    // Parse daftar items (numbered list)
    contentEl.querySelectorAll(':scope > item').forEach(item => {
        content.items.push({
            num: item.getAttribute('num'),
            title: getText(item, 'judul'),
            titleId: getTranslation(item, 'judul'),
            teks: getText(item, 'teks'),
            teksId: getTranslation(item, 'teks')
        });
    });

    return content;
}

function parseSubBab(subBabEl) {
    return {
        id: subBabEl.getAttribute('id'),
        halaman: subBabEl.getAttribute('halaman'),
        nomor: getText(subBabEl, 'nomor'),
        judul: getText(subBabEl, 'judul'),
        judulId: getTranslation(subBabEl, 'judul'),
        content: parseContent(subBabEl.querySelector(':scope > content'))
    };
}

function parseXMLData() {
    if (!xmlData) return { infoBuku: {}, pengantar: [], daftarIsi: [], bab: [], khatimah: null, tamrinAkhir: null };

    const data = { infoBuku: {}, pengantar: [], daftarIsi: [], bab: [], khatimah: null, tamrinAkhir: null };

    // Parse info buku
    const infoEl = xmlData.querySelector('info_buku');
    if (infoEl) {
        data.infoBuku = {
            judul: getText(infoEl, 'judul'),
            judulId: getTranslation(infoEl, 'judul'),
            judulLatin: getText(infoEl, 'judul_latin'),
            penulis: getText(infoEl, 'penulis'),
            penulisId: getTranslation(infoEl, 'penulis'),
            penulisLatin: getText(infoEl, 'penulis_latin'),
            penerbit: getText(infoEl, 'penerbit'),
            penerbitId: getTranslation(infoEl, 'penerbit'),
            penerbitLatin: getText(infoEl, 'penerbit_latin'),
            edisi: getText(infoEl, 'edisi'),
            edisiId: getTranslation(infoEl, 'edisi'),
            tahunH: getText(infoEl, 'tahun_hijriyah'),
            tahunHId: getTranslation(infoEl, 'tahun_hijriyah'),
            tahunM: getText(infoEl, 'tahun_masehi'),
            tahunMId: getTranslation(infoEl, 'tahun_masehi'),
            level: getText(infoEl, 'level'),
            levelId: getTranslation(infoEl, 'level'),
            jumlahHalaman: getText(infoEl, 'jumlah_halaman'),
            jumlahHalamanId: getTranslation(infoEl, 'jumlah_halaman'),
            isbn: getText(infoEl, 'isbn')
        };
    }

    // Parse pengantar
    xmlData.querySelectorAll('pengantar > item').forEach(item => {
        data.pengantar.push({
            id: item.getAttribute('id'),
            halaman: item.getAttribute('halaman'),
            judul: getText(item, 'judul'),
            judulId: getTranslation(item, 'judul'),
            teks: getText(item, 'teks'),
            teksId: getTranslation(item, 'teks'),
            teksLanjutan: getText(item, 'teks_lanjutan'),
            teksLanjutanId: getTranslation(item, 'teks_lanjutan'),
            teksLanjutan2: getText(item, 'teks_lanjutan2'),
            teksLanjutan2Id: getTranslation(item, 'teks_lanjutan2'),
            teksPenutup: getText(item, 'teks_penutup'),
            teksPenutupId: getTranslation(item, 'teks_penutup'),
            penulisTtd: getText(item, 'penulis_ttd'),
            penulisTtdId: getTranslation(item, 'penulis_ttd'),
            tempat: getText(item, 'tempat'),
            tempatId: getTranslation(item, 'tempat')
        });
    });

    // Parse daftar isi
    xmlData.querySelectorAll('daftar_isi > bab').forEach(bab => {
        const subItems = [];
        bab.querySelectorAll(':scope > sub_item').forEach(si => {
            subItems.push({
                num: si.getAttribute('num'),
                halaman: si.getAttribute('halaman'),
                text: si.textContent.trim(),
                textId: si.getAttribute('teks_id') || ''
            });
        });

        data.daftarIsi.push({
            id: bab.getAttribute('id'),
            halaman: bab.getAttribute('halaman'),
            kategori: getText(bab, 'kategori'),
            kategoriId: getTranslation(bab, 'kategori'),
            nomor: getText(bab, 'nomor'),
            judul: getText(bab, 'judul'),
            judulId: getTranslation(bab, 'judul'),
            subItems: subItems
        });
    });

    // Parse bab content
    xmlData.querySelectorAll('al_muyassar > bab').forEach(bab => {
        const subBabs = [];
        bab.querySelectorAll(':scope > sub_bab').forEach(sb => {
            subBabs.push(parseSubBab(sb));
        });

        data.bab.push({
            id: bab.getAttribute('id'),
            halaman: bab.getAttribute('halaman'),
            kategori: getText(bab, 'kategori'),
            kategoriId: getTranslation(bab, 'kategori'),
            nomor: getText(bab, 'nomor'),
            judul: getText(bab, 'judul'),
            judulId: getTranslation(bab, 'judul'),
            content: parseContent(bab.querySelector(':scope > content')),
            subBabs: subBabs
        });
    });

    // Parse khatimah
    const khatimahEl = xmlData.querySelector('khatimah');
    if (khatimahEl) {
        data.khatimah = {
            halaman: khatimahEl.getAttribute('halaman'),
            judul: getText(khatimahEl, 'judul'),
            judulId: getTranslation(khatimahEl, 'judul'),
            teks: getText(khatimahEl, 'teks'),
            teksId: getTranslation(khatimahEl, 'teks')
        };
    }

    // Parse tamrin akhir - ambil teks_id langsung dari atribut soal
    const tamrinAkhirEl = xmlData.querySelector('tamrin_akhir');
    if (tamrinAkhirEl) {
        const soals = [];
        tamrinAkhirEl.querySelectorAll(':scope > soal').forEach(s => {
            soals.push({
                id: s.getAttribute('id'),
                teks: s.textContent.trim(),
                teksId: s.getAttribute('teks_id') || ''
            });
        });
        data.tamrinAkhir = {
            judul: getText(tamrinAkhirEl, 'judul'),
            judulId: getTranslation(tamrinAkhirEl, 'judul'),
            soals: soals
        };
    }

    return data;
}

// ============================================
// RENDER DRAWER
// ============================================

function renderDrawer(currentSectionId = 'contents') {
    const data = parseXMLData();
    const container = document.getElementById('drawer-content');

    let html = '';

    // Pengantar section
    if (data.pengantar.length > 0) {
        html += `<div class="drawer-section"><div class="drawer-section-title">${removeTashkeel('المُقَدِّمَةُ')}</div><div class="drawer-list">`;
        data.pengantar.forEach(item => {
            const isActive = currentSectionId === 'muqaddimah';
            html += `
                <div class="drawer-item ${isActive ? 'active' : ''}" onclick="showSection('muqaddimah'); closeDrawer();">
                    <div class="drawer-item-info" style="margin-right: 0;">
                        <span class="drawer-item-title" data-tashkeel="${(item.judul || '').replace(/"/g, '&quot;')}">${removeTashkeel(item.judul)}</span>
                        <span class="drawer-item-sub">ص. ${item.halaman}</span>
                    </div>
                </div>
            `;
        });
        html += `</div></div>`;
    }

    // Daftar Isi / Bab sections
    html += `<div class="drawer-section"><div class="drawer-section-title">${removeTashkeel('فَهْرِسُ الْكِتَابِ')}</div><div class="drawer-list">`;

    let currentKategori = '';
    data.daftarIsi.forEach((bab) => {
        if (bab.kategori && bab.kategori !== currentKategori) {
            currentKategori = bab.kategori;
            html += `<div style="padding: 0.5rem 1rem; font-size: 0.8125rem; color: var(--primary); font-weight: 700; font-family: var(--font-arabic); margin-top: 0.5rem; text-align: right;">${removeTashkeel(currentKategori)}</div>`;
        }

        const isBabActive = currentSectionId === `bab-${bab.id}`;
        const hasSubItems = bab.subItems && bab.subItems.length > 0;

        html += `
            <div class="drawer-bab-group">
                <div class="drawer-item-expandable ${isBabActive ? 'active' : ''}" onclick="${hasSubItems ? `toggleSubmenu('${bab.id}')` : `showSection('bab-${bab.id}'); closeDrawer();`}">
                    ${bab.nomor ? `<div class="drawer-item-number">${bab.nomor}</div>` : ''}
                    <div class="drawer-item-info">
                        <span class="drawer-item-title" data-tashkeel="${(bab.judul || '').replace(/"/g, '&quot;')}">${removeTashkeel(bab.judul)}</span>
                        <span class="drawer-item-sub">ص. ${bab.halaman}</span>
                    </div>
                    ${hasSubItems ? `<span class="drawer-expand-icon ${isBabActive ? 'expanded' : ''}" id="expand-icon-${bab.id}">◄</span>` : ''}
                </div>
        `;

        if (hasSubItems) {
            html += `<div class="drawer-submenu ${isBabActive ? 'expanded' : ''}" id="submenu-${bab.id}">`;
            bab.subItems.forEach(si => {
                html += `
                    <div class="drawer-submenu-item" onclick="showSection('bab-${bab.id}'); closeDrawer();">
                        <span class="drawer-submenu-text" data-tashkeel="${(si.text || '').replace(/"/g, '&quot;')}">${si.num ? si.num + '. ' : ''}${removeTashkeel(si.text)}</span>
                        <span style="font-size: 0.75rem; color: var(--text-light);">ص. ${si.halaman}</span>
                    </div>
                `;
            });
            html += `</div>`;
        }

        html += `</div>`;
    });

    html += `</div></div>`;

    // Khatimah
    if (data.khatimah) {
        html += `<div class="drawer-section"><div class="drawer-section-title">${removeTashkeel('الْخَاتِمَةُ')}</div><div class="drawer-list">`;
        html += `
            <div class="drawer-item ${currentSectionId === 'khatimah' ? 'active' : ''}" onclick="showSection('khatimah'); closeDrawer();">
                <div class="drawer-item-info" style="margin-right: 0;">
                    <span class="drawer-item-title" data-tashkeel="${(data.khatimah.judul || '').replace(/"/g, '&quot;')}">${removeTashkeel(data.khatimah.judul)}</span>
                    <span class="drawer-item-sub">ص. ${data.khatimah.halaman}</span>
                </div>
            </div>
        `;
        html += `</div></div>`;
    }

    // Tamrin Akhir
    if (data.tamrinAkhir) {
        html += `<div class="drawer-section"><div class="drawer-section-title">${removeTashkeel('التَّمَارِينُ الْعَامَّةُ')}</div><div class="drawer-list">`;
        html += `
            <div class="drawer-item ${currentSectionId === 'tamrin-akhir' ? 'active' : ''}" onclick="showSection('tamrin-akhir'); closeDrawer();">
                <div class="drawer-item-info" style="margin-right: 0;">
                    <span class="drawer-item-title" data-tashkeel="${(data.tamrinAkhir.judul || '').replace(/"/g, '&quot;')}">${removeTashkeel(data.tamrinAkhir.judul)}</span>
                    <span class="drawer-item-sub">${data.tamrinAkhir.soals.length} سؤال</span>
                </div>
            </div>
        `;
        html += `</div></div>`;
    }

    container.innerHTML = html;
}

// ============================================
// RENDER ALL CONTENT
// ============================================

function renderAllContent() {
    const container = document.getElementById('main-container');
    const data = parseXMLData();

    let html = '';

    // Render info buku + daftar isi
    html += renderContentsSection(data);

    // Render muqaddimah
    html += renderMuqaddimahSection(data);

    // Render bab-bab
    data.bab.forEach(bab => {
        html += renderBabSection(bab);
    });

    // Render khatimah
    if (data.khatimah) {
        html += renderKhatimahSection(data.khatimah);
    }

    // Render tamrin akhir
    if (data.tamrinAkhir) {
        html += renderTamrinAkhirSection(data.tamrinAkhir);
    }

    container.innerHTML = html;
}

function renderContentsSection(data) {
    const config = LEVEL_CONFIG[currentLevel];
    if (!config) return '';

    let html = `<section id="contents">`;

    // Info buku
    html += `
        <div class="info-buku-box">
            <div class="info-judul">${ar(data.infoBuku.judul || 'المُيَسَّرُ فِي عِلْمِ النَّحْوِ')}</div>
            ${data.infoBuku.judulId ? `<div class="translation-id">${data.infoBuku.judulId}</div>` : ''}
            <div class="info-detail">${ar(data.infoBuku.penulis || '')}</div>
            ${data.infoBuku.penulisId ? `<div class="translation-id">${data.infoBuku.penulisId}</div>` : ''}
            <div class="info-detail">${ar(data.infoBuku.penerbit || '')}</div>
            ${data.infoBuku.penerbitId ? `<div class="translation-id">${data.infoBuku.penerbitId}</div>` : ''}
            <div class="info-detail">المستوى: ${config.name} | ${config.desc}</div>
        </div>
    `;

    // Home header
    html += `
        <div class="home-header">
            <h1 class="home-title" style="color: ${config.color};">${ar(data.infoBuku.judul || 'المُيَسَّرُ')}</h1>
            ${data.infoBuku.judulId ? `<div class="translation-id" style="text-align:center;">${data.infoBuku.judulId}</div>` : ''}
            <p class="home-subtitle">${data.infoBuku.judulLatin || ''}</p>
            <p class="home-desc">${ar(data.infoBuku.edisi || '')} | ${data.infoBuku.tahunH || ''} هـ – ${data.infoBuku.tahunM || ''} م</p>
        </div>
    `;

    // Quick access / Daftar isi
    html += `<div class="quick-access">`;
    html += `<h2 class="quick-access-title">📖 ${ar('فَهْرِسُ الْكِتَابِ')}</h2>`;

    let currentKategori = '';
    data.daftarIsi.forEach(bab => {
        if (bab.kategori && bab.kategori !== currentKategori) {
            currentKategori = bab.kategori;
            html += `<div class="quick-section-title">${ar(currentKategori)}</div>`;
            if (bab.kategoriId) {
                html += `<div class="translation-id" style="padding-right:1rem; margin-bottom:0.5rem;">${bab.kategoriId}</div>`;
            }
        }

        html += `
            <div class="bab-card-home" onclick="showSection('bab-${bab.id}')">
                ${bab.nomor ? `<div class="bab-number-home">${bab.nomor}</div>` : '<div class="bab-number-home" style="background: var(--accent);">📖</div>'}
                <div class="bab-info-home">
                    <div class="bab-title-home">${ar(bab.judul)}</div>
                    ${bab.judulId ? `<div class="translation-id" style="font-size:0.8125rem;">${bab.judulId}</div>` : ''}
                </div>
                <span class="bab-page-home">ص. ${bab.halaman}</span>
            </div>
        `;
    });

    // Pengantar link
    if (data.pengantar.length > 0) {
        html += `<div class="quick-section-title">المقدمة</div>`;
        html += `
            <div class="bab-card-home" onclick="showSection('muqaddimah')" style="border-right-color: var(--accent);">
                <div class="bab-number-home" style="background: var(--accent);">✦</div>
                <div class="bab-info-home">
                    <div class="bab-title-home">${ar('المُقَدِّمَةُ')}</div>
                </div>
                <span class="bab-page-home">ص. أ</span>
            </div>
        `;
    }

    // Khatimah link
    if (data.khatimah) {
        html += `<div class="quick-section-title">${ar('الْخَاتِمَةُ')}</div>`;
        html += `
            <div class="bab-card-home" onclick="showSection('khatimah')" style="border-right-color: #8e44ad;">
                <div class="bab-number-home" style="background: #8e44ad;">✦</div>
                <div class="bab-info-home">
                    <div class="bab-title-home">${ar(data.khatimah.judul)}</div>
                    ${data.khatimah.judulId ? `<div class="translation-id" style="font-size:0.8125rem;">${data.khatimah.judulId}</div>` : ''}
                </div>
                <span class="bab-page-home">ص. ${data.khatimah.halaman}</span>
            </div>
        `;
    }

    // Tamrin Akhir link
    if (data.tamrinAkhir) {
        html += `<div class="quick-section-title">${ar('التَّمَارِينُ الْعَامَّةُ')}</div>`;
        html += `
            <div class="bab-card-home" onclick="showSection('tamrin-akhir')" style="border-right-color: #3730a3;">
                <div class="bab-number-home" style="background: #3730a3;">✏️</div>
                <div class="bab-info-home">
                    <div class="bab-title-home">${ar(data.tamrinAkhir.judul)}</div>
                    ${data.tamrinAkhir.judulId ? `<div class="translation-id" style="font-size:0.8125rem;">${data.tamrinAkhir.judulId}</div>` : ''}
                </div>
                <span class="bab-page-home">${data.tamrinAkhir.soals.length} سؤال</span>
            </div>
        `;
    }

    html += `</div>`;
    html += getNavButtons('contents');
    html += `</section>`;

    return html;
}

function renderMuqaddimahSection(data) {
    if (data.pengantar.length === 0) return '';

    const item = data.pengantar[0];

    let html = `<section id="muqaddimah" class="hidden">`;

    html += `
        <div class="section-header">
            <div class="bab-header-title">
                <h1 class="bab-header-text">${ar(item.judul)}</h1>
                ${item.judulId ? `<div class="bab-header-en translation-id">${item.judulId}</div>` : ''}
            </div>
        </div>
    `;

    html += `<div class="muqaddimah-box">`;

    if (item.teks) {
        html += `<div class="basmalah">${ar('بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ')}</div>`;
        html += `<div class="muqaddimah-text">${ar(item.teks)}</div>`;
        if (item.teksId) html += `<div class="translation-id">${item.teksId}</div>`;
    }
    if (item.teksLanjutan) {
        html += `<div class="muqaddimah-text">${ar(item.teksLanjutan)}</div>`;
        if (item.teksLanjutanId) html += `<div class="translation-id">${item.teksLanjutanId}</div>`;
    }
    if (item.teksLanjutan2) {
        html += `<div class="muqaddimah-text">${ar(item.teksLanjutan2)}</div>`;
        if (item.teksLanjutan2Id) html += `<div class="translation-id">${item.teksLanjutan2Id}</div>`;
    }
    if (item.teksPenutup) {
        html += `<div class="muqaddimah-text">${ar(item.teksPenutup)}</div>`;
        if (item.teksPenutupId) html += `<div class="translation-id">${item.teksPenutupId}</div>`;
    }
    if (item.penulisTtd) {
        html += `<div class="penulis-ttd">${ar(item.penulisTtd)}</div>`;
        if (item.penulisTtdId) html += `<div class="translation-id">${item.penulisTtdId}</div>`;
    }
    if (item.tempat) {
        html += `<div class="tempat">${ar(item.tempat)}</div>`;
        if (item.tempatId) html += `<div class="translation-id">${item.tempatId}</div>`;
    }

    html += `</div>`;
    html += getNavButtons('muqaddimah');
    html += `</section>`;

    return html;
}

function renderBabSection(bab) {
    let html = `<section id="bab-${bab.id}" class="hidden">`;

    // Section header
    html += `
        <div class="section-header">
            ${bab.kategori ? `<div class="bab-header-category">${ar(bab.kategori)}</div>` : ''}
            ${bab.kategoriId ? `<div class="translation-id" style="opacity:0.85;">${bab.kategoriId}</div>` : ''}
            <div class="bab-header-title">
                ${bab.nomor ? `<span class="bab-header-number">${bab.nomor}</span>` : ''}
                <h1 class="bab-header-text">${ar(bab.judul)}</h1>
                ${bab.judulId ? `<div class="bab-header-en translation-id">${bab.judulId}</div>` : ''}
            </div>
        </div>
    `;

    // Main content
    if (bab.content) {
        html += renderContent(bab.content);
    }

    // Sub-babs
    if (bab.subBabs && bab.subBabs.length > 0) {
        bab.subBabs.forEach(subBab => {
            html += `<div class="sub-bab-section">`;

            html += `
                <div class="sub-bab-header">
                    ${subBab.nomor ? `<div class="sub-bab-number">${subBab.nomor}</div>` : ''}
                    <div class="sub-bab-title">${ar(subBab.judul)}</div>
                    ${subBab.judulId ? `<div class="translation-id" style="font-size:0.9375rem; color:var(--text-light);">${subBab.judulId}</div>` : ''}
                </div>
            `;

            if (subBab.content) {
                html += renderContent(subBab.content);
            }

            html += `</div>`;
        });
    }

    // Page number
    html += `<p class="page-number">ص. ${bab.halaman}</p>`;

    html += getNavButtons(`bab-${bab.id}`);
    html += `</section>`;

    return html;
}

function renderContent(content) {
    if (!content) return '';

    let html = '';

    // Main text
    if (content.teks) {
        html += `<div class="content-box">`;
        html += `<div class="arabic-text">${ar(content.teks)}</div>`;
        if (content.teksId) {
            html += `<div class="translation-id">${content.teksId}</div>`;
        }

        if (content.teksLanjutan) {
            html += `<div class="arabic-text" style="margin-top: 1rem;">${ar(content.teksLanjutan)}</div>`;
            if (content.teksLanjutanId) {
                html += `<div class="translation-id">${content.teksLanjutanId}</div>`;
            }
        }
        if (content.teksLanjutan2) {
            html += `<div class="arabic-text" style="margin-top: 1rem;">${ar(content.teksLanjutan2)}</div>`;
            if (content.teksLanjutan2Id) {
                html += `<div class="translation-id">${content.teksLanjutan2Id}</div>`;
            }
        }

        html += `</div>`;
    }

    // Contoh examples
    if (content.contohList && content.contohList.length > 0) {
        content.contohList.forEach((contoh, idx) => {
            html += `
                <div class="contoh-box">
                    <div class="contoh-label">مثال ${idx + 1}</div>
                    <div class="arabic-text">${ar(contoh)}</div>
                    ${content.contohIdList && content.contohIdList[idx] ? `<div class="translation-id">${content.contohIdList[idx]}</div>` : ''}
                </div>
            `;
        });
    }

    // Qismah / Diagram sections
    if (content.qismahList && content.qismahList.length > 0) {
        html += `<div class="diagram-box">`;
        html += `<div class="diagram-title">${ar(content.keterangan) || 'التقسيم:'}</div>`;

        content.qismahList.forEach(q => {
            html += `<div class="qismah-card">`;
            html += `<div class="qismah-name">${ar(q.nama)}</div>`;
            if (q.namaId) {
                html += `<div class="translation-id">${q.namaId}</div>`;
            }
            if (q.definisi) {
                html += `<div class="qismah-def">${ar(q.definisi)}</div>`;
                if (q.definisiId) {
                    html += `<div class="translation-id">${q.definisiId}</div>`;
                }
            }
            q.contohs.forEach(c => {
                html += `<div class="qismah-example">${ar(c)}</div>`;
            });
            html += `</div>`;
        });

        html += `</div>`;
    }

    // Keterangan
    if (content.keterangan) {
        html += `<div class="content-box">`;
        html += `<div class="keterangan">${ar(content.keterangan)}</div>`;
        if (content.keteranganId) {
            html += `<div class="translation-id">${content.keteranganId}</div>`;
        }
        html += `</div>`;
    }

    // Catatan
    if (content.catatan) {
        html += `<div class="content-box">`;
        html += `<div class="catatan">${ar(content.catatan)}</div>`;
        if (content.catatanId) {
            html += `<div class="translation-id">${content.catatanId}</div>`;
        }
        html += `</div>`;
    }

    // Tamrin / Exercises
    if (content.tamrin && content.tamrin.soals.length > 0) {
        html += `<div class="tamrin-section">`;
        html += `<div class="tamrin-title">✏️ ${ar('التَّمَارِينُ')}</div>`;

        content.tamrin.soals.forEach((soal, idx) => {
            html += `
                <div class="soal-item">
                    <span class="soal-num">${idx + 1}</span>
                    <span>${ar(soal.teks)}</span>
                    ${soal.teksId ? `<div class="translation-id">${soal.teksId}</div>` : ''}
                </div>
            `;
        });

        html += `</div>`;
    }

    // Daftar items (numbered list)
    if (content.items && content.items.length > 0) {
        content.items.forEach(item => {
            html += `<div class="daftar-item">`;
            if (item.num) {
                html += `<div class="item-num">${item.num}</div>`;
            }
            if (item.title) {
                html += `<div class="item-title">${ar(item.title)}</div>`;
                if (item.titleId) {
                    html += `<div class="translation-id">${item.titleId}</div>`;
                }
            }
            if (item.teks) {
                html += `<div class="arabic-text">${ar(item.teks)}</div>`;
                if (item.teksId) {
                    html += `<div class="translation-id">${item.teksId}</div>`;
                }
            }
            html += `</div>`;
        });
    }

    return html;
}

function renderKhatimahSection(khatimah) {
    let html = `<section id="khatimah" class="hidden">`;

    html += `
        <div class="khatimah-box">
            <div class="khatimah-judul">${ar(khatimah.judul)}</div>
            ${khatimah.judulId ? `<div class="translation-id">${khatimah.judulId}</div>` : ''}
            <div class="khatimah-text">${ar(khatimah.teks)}</div>
            ${khatimah.teksId ? `<div class="translation-id">${khatimah.teksId}</div>` : ''}
        </div>
    `;

    html += getNavButtons('khatimah');
    html += `</section>`;

    return html;
}

function renderTamrinAkhirSection(tamrin) {
    let html = `<section id="tamrin-akhir" class="hidden">`;

    html += `
        <div class="section-header" style="background: linear-gradient(135deg, #3730a3 0%, #4f46e5 100%);">
            <div class="bab-header-title">
                <h1 class="bab-header-text">${ar(tamrin.judul)}</h1>
                ${tamrin.judulId ? `<div class="translation-id" style="opacity:0.85;">${tamrin.judulId}</div>` : ''}
            </div>
        </div>
    `;

    html += `<div class="tamrin-section">`;
    tamrin.soals.forEach((soal, idx) => {
        html += `
            <div class="soal-item">
                <span class="soal-num">${soal.id || (idx + 1)}</span>
                <span>${ar(soal.teks)}</span>
                ${soal.teksId ? `<div class="translation-id">${soal.teksId}</div>` : ''}
            </div>
        `;
    });
    html += `</div>`;

    html += getNavButtons('tamrin-akhir');
    html += `</section>`;

    return html;
}

// ============================================
// SECTION ORDER & NAVIGATION
// ============================================

function buildSectionOrder() {
    sectionOrder = ['contents'];
    const data = parseXMLData();

    if (data.pengantar.length > 0) {
        sectionOrder.push('muqaddimah');
    }

    data.bab.forEach(bab => {
        sectionOrder.push(`bab-${bab.id}`);
    });

    if (data.khatimah) {
        sectionOrder.push('khatimah');
    }

    if (data.tamrinAkhir) {
        sectionOrder.push('tamrin-akhir');
    }
}

function getNavButtons(currentId) {
    if (sectionOrder.length === 0) buildSectionOrder();
    const idx = sectionOrder.indexOf(currentId);
    if (idx === -1) return '';

    const prevId = idx > 0 ? sectionOrder[idx - 1] : null;
    const nextId = idx < sectionOrder.length - 1 ? sectionOrder[idx + 1] : null;

    let html = '<div class="nav-buttons">';

    if (nextId) {
        let nextLabel = 'التالي';
        if (nextId === 'contents') nextLabel = 'الفهرس';
        html += `<button class="nav-btn" onclick="showSection('${nextId}')">${nextLabel} ←</button>`;
    } else {
        html += '<span></span>';
    }

    if (prevId) {
        let prevLabel = 'السابق';
        if (prevId === 'contents') prevLabel = 'الفهرس';
        html += `<button class="nav-btn prev-btn" onclick="showSection('${prevId}')">→ ${prevLabel}</button>`;
    } else {
        html += '<span></span>';
    }

    html += '</div>';
    return html;
}

// ============================================
// SECTION NAVIGATION
// ============================================

function showSection(sectionId) {
    document.querySelectorAll('section').forEach(sec => {
        sec.classList.add('hidden');
    });

    const target = document.getElementById(sectionId);
    if (target) {
        target.classList.remove('hidden');
        currentSection = sectionId;

        renderDrawer(sectionId);

        const navTitle = document.getElementById('current-section-title');

        if (sectionId === 'contents') {
            navTitle.textContent = arText('الْفَهْرِسُ');
        } else if (sectionId === 'muqaddimah') {
            navTitle.textContent = arText('المُقَدِّمَةُ');
        } else if (sectionId === 'khatimah') {
            navTitle.textContent = arText('الْخَاتِمَةُ');
        } else if (sectionId === 'tamrin-akhir') {
            navTitle.textContent = arText('التَّمَارِينُ الْعَامَّةُ');
        } else {
            const babId = sectionId.replace('bab-', '');
            const data = parseXMLData();
            const bab = data.daftarIsi.find(b => b.id === babId);
            if (bab) {
                navTitle.textContent = removeTashkeel(bab.judul);
            } else {
                navTitle.textContent = arText('الْمُيَسَّرُ');
            }
        }

        window.scrollTo(0, 0);
    }
}

// ============================================
// TTS FOR ARABIC - class="teks_arab" only
// ============================================

function speakArabic(text) {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/<[^>]*>/g, '').trim().replace(/\s+/g, ' ');
    if (!cleanText) return;
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'ar-SA';
    utterance.rate = 0.8;
    window.speechSynthesis.speak(utterance);
}

function attachTTS() {
    // Inject hover style sekali saja untuk class teks_arab
    if (!document.getElementById('tts-hover-style')) {
        const style = document.createElement('style');
        style.id = 'tts-hover-style';
        style.textContent = `
            .teks_arab {
                cursor: pointer;
                transition: background-color 0.2s ease;
                border-radius: 4px;
                padding: 2px 4px;
                margin: -2px -4px;
            }
            .teks_arab:hover {
                background-color: rgba(26, 92, 58, 0.12);
            }
        `;
        document.head.appendChild(style);
    }

    // Attach ke SEMUA elemen dengan class="teks_arab" di main container
    document.querySelectorAll('#main-container .teks_arab').forEach(el => {
        if (el.dataset.ttsAttached) return;
        el.dataset.ttsAttached = 'true';
        el.title = 'انقر للاستماع';
        el.addEventListener('click', function(e) {
            // Jangan trigger kalau klik link atau tombol
            if (e.target.closest('a, button, .nav-btn')) return;
            speakArabic(this.textContent);
        });
    });
}

setInterval(attachTTS, 1000);
