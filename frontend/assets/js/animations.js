/* ===============================================================
   animations.js — Ana sayfa görsel animasyonları
   - heroCanvasBaslat : #hero-canvas partikül ağı (40 fps, IntersectionObserver)
   - scrollRevealBaslat : [data-reveal] elementleri görünürken is-revealed alır
   - sayacBaslat : [data-count] elementleri için easeOut sayaç animasyonu
   =============================================================== */

/* ============================================================
   1. HERO CANVAS ANİMASYONU
   ============================================================ */

/**
 * Hero bölümündeki canvas üzerinde partikül ağı animasyonu başlatır.
 * IntersectionObserver ile canvas görünür alanda olduğunda çalışır,
 * sekme arka plana geçtiğinde durur; resize'da boyut ve partiküller yenilenir.
 */
function heroCanvasBaslat() {
    var canvas = document.getElementById('hero-canvas');
    if (!canvas) return;

    var ctx = canvas.getContext('2d');
    var parcaciklar = [];
    var PARCACIK_SAYISI = 55;
    var BAGLANTI_MESAFESI = 220;
    var RENK_PARCACIK = 'rgba(201, 169, 97, 0.8)';
    var RENK_CIZGI = 'rgba(201, 169, 97, 0.22)';

    function canvasBoyutlandir() {
        var hero = canvas.parentElement;
        if (hero) {
            canvas.width = hero.offsetWidth;
            canvas.height = hero.offsetHeight;
        } else {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
    }

    function Parcacik() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * 2.2;
        this.vy = (Math.random() - 0.5) * 2.2;
        this.boyut = Math.random() * 2.5 + 1;
    }

    Parcacik.prototype.guncelle = function () {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x <= this.boyut) {
            this.x = this.boyut;
            this.vx = Math.abs(this.vx);
        } else if (this.x >= canvas.width - this.boyut) {
            this.x = canvas.width - this.boyut;
            this.vx = -Math.abs(this.vx);
        }

        if (this.y <= this.boyut) {
            this.y = this.boyut;
            this.vy = Math.abs(this.vy);
        } else if (this.y >= canvas.height - this.boyut) {
            this.y = canvas.height - this.boyut;
            this.vy = -Math.abs(this.vy);
        }
    };

    Parcacik.prototype.ciz = function () {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.boyut, 0, Math.PI * 2);
        ctx.fillStyle = RENK_PARCACIK;
        ctx.fill();
    };

    function parcaciklariOlustur() {
        parcaciklar = [];
        for (var i = 0; i < PARCACIK_SAYISI; i++) {
            parcaciklar.push(new Parcacik());
        }
    }

    function baglantiCiz() {
        /* Tek bir path + tek ctx.stroke() → GPU draw call sayısını minimize eder */
        ctx.beginPath();
        ctx.strokeStyle = RENK_CIZGI;
        ctx.lineWidth = 1;
        for (var i = 0; i < parcaciklar.length; i++) {
            for (var j = i + 1; j < parcaciklar.length; j++) {
                var dx = parcaciklar[i].x - parcaciklar[j].x;
                var dy = parcaciklar[i].y - parcaciklar[j].y;
                var d2 = dx * dx + dy * dy;
                if (d2 < BAGLANTI_MESAFESI * BAGLANTI_MESAFESI) {
                    ctx.moveTo(parcaciklar[i].x, parcaciklar[i].y);
                    ctx.lineTo(parcaciklar[j].x, parcaciklar[j].y);
                }
            }
        }
        ctx.stroke();
    }

    var _calisıyor  = false;
    var _rafId      = null;
    var _timeoutId  = null;
    var _KARE_SURE  = 1000 / 40; /* 40 fps — setTimeout+rAF hybrid */

    function _kareizle() {
        if (!_calisıyor) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (var i = 0; i < parcaciklar.length; i++) {
            parcaciklar[i].guncelle();
            parcaciklar[i].ciz();
        }
        baglantiCiz();
        /* Bir sonraki kareyi setTimeout ile geciktir → sadece 24/sn rAF tetiklenir */
        _timeoutId = setTimeout(function () {
            if (_calisıyor) _rafId = requestAnimationFrame(_kareizle);
        }, _KARE_SURE);
    }

    function basla() {
        if (_calisıyor) return;
        _calisıyor = true;
        _rafId = requestAnimationFrame(_kareizle);
    }

    function durdur() {
        _calisıyor = false;
        if (_rafId)     { cancelAnimationFrame(_rafId); _rafId = null; }
        if (_timeoutId) { clearTimeout(_timeoutId);     _timeoutId = null; }
    }

    canvasBoyutlandir();
    parcaciklariOlustur();

    /* Canvas görünür alanda olduğunda çalıştır, değilse durdur */
    if ('IntersectionObserver' in window) {
        var canvasGozlemci = new IntersectionObserver(function (kayitlar) {
            if (kayitlar[0].isIntersecting) {
                basla();
            } else {
                durdur();
            }
        }, { threshold: 0 });
        canvasGozlemci.observe(canvas);
    } else {
        basla();
    }

    /* Sekme arka plana geçince durdur */
    document.addEventListener('visibilitychange', function () {
        if (document.hidden) {
            durdur();
        } else if (canvas.getBoundingClientRect().top < window.innerHeight) {
            basla();
        }
    });

    window.addEventListener('resize', function () {
        canvasBoyutlandir();
        parcaciklariOlustur();
    });
}

/* ============================================================
   2. SCROLL REVEAL ANİMASYONU
   ============================================================ */

/**
 * [data-reveal] özniteliği olan tüm elementlere IntersectionObserver bağlar.
 * Element görünür alana girdiğinde is-revealed sınıfı eklenir; data-delay (ms) desteklenir.
 * IntersectionObserver yoksa tüm elementler anında açılır.
 */
function scrollRevealBaslat() {
    var elementler = document.querySelectorAll('[data-reveal]');
    if (!elementler.length) return;

    if (!('IntersectionObserver' in window)) {
        for (var i = 0; i < elementler.length; i++) {
            elementler[i].classList.add('is-revealed');
        }
        return;
    }

    var gozlemci = new IntersectionObserver(function (kayitlar) {
        for (var k = 0; k < kayitlar.length; k++) {
            var kayit = kayitlar[k];
            if (kayit.isIntersecting) {
                var el = kayit.target;
                var gecikme = el.getAttribute('data-delay');
                if (gecikme) {
                    el.style.transitionDelay = gecikme + 'ms';
                }
                el.classList.add('is-revealed');
                gozlemci.unobserve(el);
            }
        }
    }, {
        threshold: 0.12
    });

    for (var i = 0; i < elementler.length; i++) {
        gozlemci.observe(elementler[i]);
    }
}

/* ============================================================
   3. SAYAÇ ANİMASYONU
   ============================================================ */

/**
 * [data-count] özniteliğindeki hedef sayıya easeOutQuad eğrisiyle 1.5 saniyede çıkar.
 * Element görünür alana girdiğinde tetiklenir; IntersectionObserver yoksa anında çalışır.
 */
function sayacBaslat() {
    var sayacElementler = document.querySelectorAll('[data-count]');
    if (!sayacElementler.length) return;

    function easeOutQuad(t) {
        return t * (2 - t);
    }

    function sayiciCalistir(el, hedef) {
        var sure = 1500;
        var baslangic = null;

        function adim(zaman) {
            if (!baslangic) baslangic = zaman;
            var gecenSure = zaman - baslangic;
            var ilerleme = Math.min(gecenSure / sure, 1);
            var kolaylastirma = easeOutQuad(ilerleme);
            var mevcutDeger = Math.floor(kolaylastirma * hedef);
            el.textContent = mevcutDeger;

            if (ilerleme < 1) {
                requestAnimationFrame(adim);
            } else {
                el.textContent = hedef;
            }
        }

        requestAnimationFrame(adim);
    }

    if (!('IntersectionObserver' in window)) {
        for (var i = 0; i < sayacElementler.length; i++) {
            var hedef = parseInt(sayacElementler[i].getAttribute('data-count'), 10);
            if (!isNaN(hedef)) {
                sayiciCalistir(sayacElementler[i], hedef);
            }
        }
        return;
    }

    var sayacGozlemci = new IntersectionObserver(function (kayitlar) {
        for (var k = 0; k < kayitlar.length; k++) {
            var kayit = kayitlar[k];
            if (kayit.isIntersecting) {
                var el = kayit.target;
                var hedef = parseInt(el.getAttribute('data-count'), 10);
                if (!isNaN(hedef)) {
                    sayiciCalistir(el, hedef);
                }
                sayacGozlemci.unobserve(el);
            }
        }
    }, {
        threshold: 0.12
    });

    for (var i = 0; i < sayacElementler.length; i++) {
        sayacGozlemci.observe(sayacElementler[i]);
    }
}

/* ============================================================
   4. BAŞLATMA
   ============================================================ */
document.addEventListener('DOMContentLoaded', function () {
    heroCanvasBaslat();
    scrollRevealBaslat();
    sayacBaslat();
});
