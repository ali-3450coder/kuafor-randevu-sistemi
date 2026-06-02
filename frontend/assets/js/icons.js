/* ================================================================
   icons.js — Merkezi SVG ikon kütüphanesi
   Lucide uyumlu, stroke-tabanlı, fill:none
   Kullanım: _ikon('calendar', 20)  → SVG string döner
   ================================================================ */
(function () {
    'use strict';

    /* Her değer: viewBox="0 0 24 24" içindeki path/shape dizisi */
    var _P = {

        /* ── Navigasyon & Panel ──────────────────────────────── */
        'panel':
            '<rect x="3" y="3" width="7" height="7" rx="1.5"/>' +
            '<rect x="14" y="3" width="7" height="7" rx="1.5"/>' +
            '<rect x="3" y="14" width="7" height="7" rx="1.5"/>' +
            '<rect x="14" y="14" width="7" height="7" rx="1.5"/>',

        'calendar':
            '<rect x="3" y="4" width="18" height="18" rx="2"/>' +
            '<line x1="16" y1="2" x2="16" y2="6"/>' +
            '<line x1="8" y1="2" x2="8" y2="6"/>' +
            '<line x1="3" y1="10" x2="21" y2="10"/>',

        'calendar-check':
            '<rect x="3" y="4" width="18" height="18" rx="2"/>' +
            '<line x1="16" y1="2" x2="16" y2="6"/>' +
            '<line x1="8" y1="2" x2="8" y2="6"/>' +
            '<line x1="3" y1="10" x2="21" y2="10"/>' +
            '<polyline points="9 16 11 18 15 14"/>',

        'users':
            '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>' +
            '<circle cx="9" cy="7" r="4"/>' +
            '<path d="M23 21v-2a4 4 0 0 0-3-3.87"/>' +
            '<path d="M16 3.13a4 4 0 0 1 0 7.75"/>',

        'user':
            '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>' +
            '<circle cx="12" cy="7" r="4"/>',

        'user-check':
            '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>' +
            '<circle cx="9" cy="7" r="4"/>' +
            '<polyline points="16 11 18 13 22 9"/>',

        'scissors':
            '<circle cx="6" cy="6" r="3"/>' +
            '<circle cx="6" cy="18" r="3"/>' +
            '<line x1="20" y1="4" x2="8.12" y2="15.88"/>' +
            '<line x1="14.47" y1="14.48" x2="20" y2="20"/>' +
            '<line x1="8.12" y1="8.12" x2="12" y2="12"/>',

        'credit-card':
            '<rect x="1" y="4" width="22" height="16" rx="2"/>' +
            '<line x1="1" y1="10" x2="23" y2="10"/>',

        'key':
            '<circle cx="7.5" cy="15.5" r="5.5"/>' +
            '<path d="M21 2l-9.6 9.6"/>' +
            '<path d="M15.5 7.5l3 3L22 7l-3-3"/>',

        'shield-check':
            '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>' +
            '<polyline points="9 12 11 14 15 10"/>',

        /* ── Durum & Onay ────────────────────────────────────── */
        'clock':
            '<circle cx="12" cy="12" r="10"/>' +
            '<polyline points="12 6 12 12 16 14"/>',

        'check-circle':
            '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>' +
            '<polyline points="22 4 12 14.01 9 11.01"/>',

        'check-square':
            '<polyline points="9 11 12 14 22 4"/>' +
            '<path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',

        'check':
            '<polyline points="20 6 9 17 4 12"/>',

        'x-circle':
            '<circle cx="12" cy="12" r="10"/>' +
            '<line x1="15" y1="9" x2="9" y2="15"/>' +
            '<line x1="9" y1="9" x2="15" y2="15"/>',

        'x':
            '<line x1="18" y1="6" x2="6" y2="18"/>' +
            '<line x1="6" y1="6" x2="18" y2="18"/>',

        'alert':
            '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>' +
            '<line x1="12" y1="9" x2="12" y2="13"/>' +
            '<line x1="12" y1="17" x2="12.01" y2="17"/>',

        /* ── Ödeme & Finans ──────────────────────────────────── */
        'wallet':
            '<path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/>' +
            '<path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/>' +
            '<path d="M18 12a2 2 0 0 0 0 4h4v-4z"/>',

        'trending-up':
            '<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>' +
            '<polyline points="17 6 23 6 23 12"/>',

        /* ── UI Elemanları ───────────────────────────────────── */
        'menu':
            '<line x1="3" y1="6" x2="21" y2="6"/>' +
            '<line x1="3" y1="12" x2="21" y2="12"/>' +
            '<line x1="3" y1="18" x2="21" y2="18"/>',

        'settings':
            '<circle cx="12" cy="12" r="3"/>' +
            '<path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',

        'lock':
            '<rect x="3" y="11" width="18" height="11" rx="2"/>' +
            '<path d="M7 11V7a5 5 0 0 1 10 0v4"/>',

        'mail':
            '<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>' +
            '<polyline points="22 6 12 13 2 6"/>',

        'search':
            '<circle cx="11" cy="11" r="8"/>' +
            '<line x1="21" y1="21" x2="16.65" y2="16.65"/>',

        'clipboard':
            '<path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>' +
            '<rect x="8" y="2" width="8" height="4" rx="1"/>',

        /* ── Hizmet Kategorileri (Ana Sayfa) ─────────────────── */
        'droplet':
            '<path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>',

        'leaf':
            '<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/>' +
            '<path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>',

        'wind':
            '<path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2"/>' +
            '<path d="M9.6 4.6A2 2 0 1 1 11 8H2"/>' +
            '<path d="M12.6 19.4A2 2 0 1 0 14 16H2"/>',

        'palette':
            '<circle cx="13.5" cy="6.5" r="1"/>' +
            '<circle cx="17.5" cy="10.5" r="1"/>' +
            '<circle cx="8.5" cy="7.5" r="1"/>' +
            '<circle cx="6.5" cy="12.5" r="1"/>' +
            '<path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>',

        'sparkles':
            '<path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z"/>' +
            '<path d="M5 3l.75 2.25L8 6l-2.25.75L5 9l-.75-2.25L2 6l2.25-.75z"/>' +
            '<path d="M19 15l.75 2.25L22 18l-2.25.75L19 21l-.75-2.25L16 18l2.25-.75z"/>',

        'wand':
            '<path d="m5 3 4 4"/>' +
            '<path d="m3 5 4 4"/>' +
            '<path d="M12.2 6.2 11 5"/>' +
            '<path d="m17.8 6.2 1.2-1.2"/>' +
            '<path d="m17.8 11.8 1.2 1.2"/>' +
            '<path d="M12 12h.01"/>' +
            '<path d="M8.5 8.5 21 21"/>',

        /* ── Nasıl Çalışır adımları ──────────────────────────── */
        'list-check':
            '<line x1="10" y1="6" x2="21" y2="6"/>' +
            '<line x1="10" y1="12" x2="21" y2="12"/>' +
            '<line x1="10" y1="18" x2="21" y2="18"/>' +
            '<polyline points="3 6 4 7 6 5"/>' +
            '<polyline points="3 12 4 13 6 11"/>' +
            '<polyline points="3 18 4 19 6 17"/>',

        'sun':
            '<circle cx="12" cy="12" r="5"/>' +
            '<line x1="12" y1="1" x2="12" y2="3"/>' +
            '<line x1="12" y1="21" x2="12" y2="23"/>' +
            '<line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>' +
            '<line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>' +
            '<line x1="1" y1="12" x2="3" y2="12"/>' +
            '<line x1="21" y1="12" x2="23" y2="12"/>' +
            '<line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>' +
            '<line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>',

        'sunrise':
            '<path d="M17 18a5 5 0 0 0-10 0"/>' +
            '<line x1="12" y1="9" x2="12" y2="2"/>' +
            '<line x1="4.22" y1="10.22" x2="5.64" y2="11.64"/>' +
            '<line x1="1" y1="18" x2="3" y2="18"/>' +
            '<line x1="21" y1="18" x2="23" y2="18"/>' +
            '<line x1="18.36" y1="11.64" x2="19.78" y2="10.22"/>' +
            '<polyline points="16 5 12 9 8 5"/>',

        'sunset':
            '<path d="M17 18a5 5 0 0 0-10 0"/>' +
            '<line x1="12" y1="9" x2="12" y2="2"/>' +
            '<line x1="4.22" y1="10.22" x2="5.64" y2="11.64"/>' +
            '<line x1="1" y1="18" x2="3" y2="18"/>' +
            '<line x1="21" y1="18" x2="23" y2="18"/>' +
            '<line x1="18.36" y1="11.64" x2="19.78" y2="10.22"/>' +
            '<polyline points="8 5 12 9 16 5"/>',
    };

    /**
     * _ikon(name, size) → SVG string
     * @param {string} name  - İkon adı (_P nesnesindeki key)
     * @param {number} [size=20] - SVG genişlik/yükseklik (px)
     * @returns {string} Inline SVG HTML string
     */
    window._ikon = function (name, size) {
        var paths = _P[name];
        if (!paths) {
            /* Bilinmeyen ikon → alert ikonu göster */
            paths = _P['alert'];
        }
        var s = size || 20;
        return (
            '<svg xmlns="http://www.w3.org/2000/svg"' +
            ' width="' + s + '" height="' + s + '"' +
            ' viewBox="0 0 24 24"' +
            ' fill="none"' +
            ' stroke="currentColor"' +
            ' stroke-width="2"' +
            ' stroke-linecap="round"' +
            ' stroke-linejoin="round"' +
            ' class="ikon" aria-hidden="true">' +
            paths +
            '</svg>'
        );
    };
})();
