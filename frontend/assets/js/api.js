/* ===============================================================
   api.js — apiGet / apiPost
   Sozlesme:
     - credentials: 'include' (her istekte)
     - Content-Type: 'application/json' (POST)
     - Zarf: { success, message, data?, errors? }
     - success === false  → caller toast / form mesaji gosterir
     - HTTP 401 + /yonetim/ yolu → giris.html'e yon lendir
     - HTTP 5xx          → console'a detay, generic nesne doner
   =============================================================== */

/**
 * @param {string} path   — ornek: "/api/genel/hizmetler.php"
 * @returns {Promise<object|null>}
 */
async function apiGet(path) {
  try {
    var res = await fetch(API_BASE_URL + path, {
      method: "GET",
      credentials: "include"
    });

    if (res.status === 401 && path.indexOf("/api/yonetim/") !== -1) {
      window.location.href = "/kuafor-randevu-sistemi/frontend/admin/giris.html";
      return null;
    }

    var data = await res.json();

    if (!data.success && res.status >= 500) {
      console.error("[API 500] GET " + path, data);
    }

    return data;
  } catch (err) {
    console.error("[API agError] GET " + path, err);
    return {
      success: false,
      message: "Sunucuya ulaşılamıyor. Lütfen daha sonra tekrar deneyin.",
      errors: {}
    };
  }
}

/**
 * @param {string} path   — ornek: "/api/genel/randevu_olustur.php"
 * @param {object} body   — JSON olarak gonderilecek nesne
 * @returns {Promise<object|null>}
 */
async function apiPost(path, body) {
  try {
    var res = await fetch(API_BASE_URL + path, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    if (res.status === 401 && path.indexOf("/api/yonetim/") !== -1) {
      window.location.href = "/kuafor-randevu-sistemi/frontend/admin/giris.html";
      return null;
    }

    var data = await res.json();

    if (!data.success && res.status >= 500) {
      console.error("[API 500] POST " + path, data);
    }

    return data;
  } catch (err) {
    console.error("[API agError] POST " + path, err);
    return {
      success: false,
      message: "Sunucuya ulaşılamıyor. Lütfen daha sonra tekrar deneyin.",
      errors: {}
    };
  }
}
