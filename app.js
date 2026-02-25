/* ============================
   AMPLE:N Dealer Quotation Builder
   - Russian primary language
   - USD only on customer UI
   - KRW in data layer (products.json)
   - PC-focused, A4 landscape PDF
   ============================ */

(function () {
  "use strict";

  const EXCHANGE_RATE = 1450;
  const STORAGE_KEY = "amplen_quote_cart";

  let DATA = { sections: [], products: [] };
  let cart = {}; // { productId: qty }
  let activeTab = "all";
  let imageCache = {}; // { productId: base64DataUrl }

  // === INIT ===
  async function init() {
    document.getElementById("dateLabel").textContent = fmtDate(new Date());

    try {
      const res = await fetch("products.json");
      DATA = await res.json();
    } catch (e) {
      document.getElementById("productGrid").innerHTML = '<p style="text-align:center;padding:40px;color:red;">Error loading product data</p>';
      return;
    }

    loadCart();
    renderTabs();
    renderGrid();
    updateAll();
    bindEvents();
  }

  function fmtDate(d) {
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
  }

  // === CART ===
  function loadCart() {
    try { cart = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch { cart = {}; }
  }
  function saveCart() { localStorage.setItem(STORAGE_KEY, JSON.stringify(cart)); }
  function getQty(pid) { return cart[pid] || 0; }

  function setQty(pid, qty) {
    qty = Math.max(0, Math.min(999, parseInt(qty) || 0));
    if (qty === 0) delete cart[pid];
    else cart[pid] = qty;
    saveCart();
    updateCard(pid);
    updateAll();
  }

  function addToAll(addQty) {
    DATA.products.forEach(p => {
      setQty(p.id, getQty(p.id) + addQty);
    });
  }

  function addToSection(secId, addQty) {
    DATA.products.filter(p => p.sectionId === secId).forEach(p => {
      setQty(p.id, getQty(p.id) + addQty);
    });
  }

  function resetAll() {
    cart = {};
    saveCart();
    document.querySelectorAll(".product-card").forEach(c => {
      c.classList.remove("selected");
      c.querySelector(".qty-input").value = 0;
    });
    document.querySelectorAll("[id^='sub-']").forEach(el => el.textContent = "");
    updateAll();
  }

  // === TABS ===
  function renderTabs() {
    const nav = document.getElementById("sectionTabs");
    let html = `<button class="tab-btn active" data-tab="all">Все<span class="tab-count" id="tc-all"></span></button>`;
    html += `<button class="tab-btn tab-selected" data-tab="selected">🛒 Выбранные<span class="tab-count" id="tc-selected"></span></button>`;
    DATA.sections.forEach(s => {
      html += `<button class="tab-btn" data-tab="${s.id}">${s.num} ${s.title}<span class="tab-count" id="tc-${s.id}"></span></button>`;
    });
    nav.innerHTML = html;
  }

  function updateTabCounts() {
    const total = Object.keys(cart).length;
    setTabCount("all", total);
    setTabCount("selected", total);
    DATA.sections.forEach(s => {
      const cnt = DATA.products.filter(p => p.sectionId === s.id && cart[p.id]).length;
      setTabCount(s.id, cnt);
    });
  }

  function setTabCount(id, cnt) {
    const el = document.getElementById(`tc-${id}`);
    if (!el) return;
    el.textContent = cnt;
    el.classList.toggle("visible", cnt > 0);
  }

  // === GRID ===
  function renderGrid() {
    const grid = document.getElementById("productGrid");
    let html = "";

    DATA.sections.forEach(sec => {
      const prods = DATA.products.filter(p => p.sectionId === sec.id);
      html += `
        <div class="section-group visible" data-section="${sec.id}" id="sec-${sec.id}">
          <div class="section-header">
            <div class="section-title-wrap">
              <span class="section-num">${sec.num}</span>
              <span class="section-title">${sec.title}</span>
              <span class="section-title-ru">${sec.titleRu || ""} · ${prods.length} товаров</span>
            </div>
            <div class="section-actions">
              <button class="btn-sec btn-sec-add" data-sec="${sec.id}" data-qty="1">+1шт</button>
              <button class="btn-sec btn-sec-add" data-sec="${sec.id}" data-qty="3">+3шт</button>
            </div>
          </div>
          <div class="product-grid">
            ${prods.map(p => cardHTML(p)).join("")}
          </div>
        </div>`;
    });

    grid.innerHTML = html;
  }

  function cardHTML(p) {
    const qty = getQty(p.id);
    const usd = p.pricing.usd;
    const sub = qty > 0 ? `$${(usd * qty).toFixed(2)}` : "";
    const sel = qty > 0 ? " selected" : "";
    const fallback = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='%23f0f0f0' width='100' height='100'/%3E%3Ctext x='50' y='55' text-anchor='middle' fill='%23ccc' font-size='10'%3ENo Image%3C/text%3E%3C/svg%3E";

    return `
      <div class="product-card${sel}" id="c-${p.id}">
        <div class="card-img-wrap">
          <img src="${p.image}" alt="${p.nameRu}" class="card-img" loading="lazy" onerror="this.src='${fallback}'">
          <div class="card-vol">${p.volume}</div>
          <button class="card-quick-add" data-pid="${p.id}" title="Добавить 1 шт.">+</button>
        </div>
        <div class="card-body">
          <div class="card-name-ru">${p.nameRu}</div>
          <div class="card-name-en">${p.nameEn}</div>
          <div class="card-name-kr">${p.nameKr}</div>
          <div class="card-price">$${usd.toFixed(2)}</div>
          <div class="qty-row">
            <button class="qty-btn" data-pid="${p.id}" data-act="dec">−</button>
            <input class="qty-input" type="number" min="0" max="999" value="${qty}" data-pid="${p.id}" inputmode="numeric" pattern="[0-9]*">
            <button class="qty-btn" data-pid="${p.id}" data-act="inc">+</button>
          </div>
          <div class="card-subtotal" id="sub-${p.id}">${sub}</div>
        </div>
      </div>`;
  }

  function updateCard(pid) {
    const card = document.getElementById(`c-${pid}`);
    if (!card) return;
    const p = DATA.products.find(x => x.id === pid);
    if (!p) return;
    const qty = getQty(pid);
    const sub = qty > 0 ? `$${(p.pricing.usd * qty).toFixed(2)}` : "";
    card.classList.toggle("selected", qty > 0);
    card.querySelector(".qty-input").value = qty;
    document.getElementById(`sub-${pid}`).textContent = sub;
  }

  function updateAll() {
    let prods = 0, items = 0, usd = 0;
    Object.entries(cart).forEach(([pid, qty]) => {
      const p = DATA.products.find(x => x.id === parseInt(pid));
      if (p && qty > 0) { prods++; items += qty; usd += p.pricing.usd * qty; }
    });
    document.getElementById("totalProducts").textContent = prods;
    document.getElementById("totalItems").textContent = items;
    document.getElementById("totalUsd").textContent = `$${usd.toFixed(2)}`;
    document.getElementById("bottomBar").classList.toggle("visible", prods > 0);
    document.getElementById("emptyState").classList.toggle("visible", prods === 0);
    updateTabCounts();
    if (activeTab === "selected") applyFilter();
  }

  function applyFilter() {
    if (activeTab === "selected") {
      document.querySelectorAll(".section-group").forEach(g => {
        const secId = g.dataset.section;
        const hasSelected = DATA.products.some(p => p.sectionId === secId && cart[p.id]);
        g.classList.toggle("visible", hasSelected);
      });
      document.querySelectorAll(".product-card").forEach(c => {
        const pid = parseInt(c.id.replace("c-", ""));
        c.style.display = cart[pid] ? "" : "none";
      });
    } else {
      document.querySelectorAll(".section-group").forEach(g => {
        g.classList.toggle("visible", activeTab === "all" || g.dataset.section === activeTab);
      });
      document.querySelectorAll(".product-card").forEach(c => {
        c.style.display = "";
      });
    }
  }

  // === EVENTS ===
  function bindEvents() {
    // Tabs
    document.getElementById("sectionTabs").addEventListener("click", e => {
      const btn = e.target.closest(".tab-btn");
      if (!btn) return;
      activeTab = btn.dataset.tab;
      document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      applyFilter();
    });

    const grid = document.getElementById("productGrid");

    // Quick +1 on image
    grid.addEventListener("click", e => {
      const btn = e.target.closest(".card-quick-add");
      if (!btn) return;
      e.stopPropagation();
      const pid = parseInt(btn.dataset.pid);
      setQty(pid, getQty(pid) + 1);
    });

    // Qty +/-
    grid.addEventListener("click", e => {
      const btn = e.target.closest(".qty-btn");
      if (!btn) return;
      const pid = parseInt(btn.dataset.pid);
      setQty(pid, btn.dataset.act === "inc" ? getQty(pid) + 1 : getQty(pid) - 1);
    });

    // Qty input
    grid.addEventListener("change", e => {
      if (!e.target.classList.contains("qty-input")) return;
      setQty(parseInt(e.target.dataset.pid), parseInt(e.target.value) || 0);
    });
    grid.addEventListener("blur", e => {
      if (!e.target.classList.contains("qty-input")) return;
      setQty(parseInt(e.target.dataset.pid), parseInt(e.target.value) || 0);
    }, true);

    // Section add buttons
    grid.addEventListener("click", e => {
      const btn = e.target.closest(".btn-sec-add");
      if (!btn) return;
      addToSection(btn.dataset.sec, parseInt(btn.dataset.qty));
    });

    // Header quick actions
    document.getElementById("btnAddAll1").addEventListener("click", () => addToAll(1));
    document.getElementById("btnAddAll3").addEventListener("click", () => addToAll(3));
    document.getElementById("btnResetTop").addEventListener("click", () => {
      if (Object.keys(cart).length === 0) return;
      if (confirm("Сбросить все количества?\n모든 수량을 초기화합니다?")) resetAll();
    });

    // Full quotation button
    document.getElementById("btnFullQuote").addEventListener("click", generateFullQuotation);

    // Bottom bar
    document.getElementById("btnReset").addEventListener("click", () => {
      if (Object.keys(cart).length === 0) return;
      if (confirm("Сбросить все количества?\n모든 수량을 초기화합니다?")) resetAll();
    });
    document.getElementById("btnPdf").addEventListener("click", () => generatePdf(false));

    // Quotation preview
    document.getElementById("btnQuote").addEventListener("click", openQuotePreview);
    document.getElementById("quoteClose").addEventListener("click", closeQuotePreview);
    document.getElementById("quoteBack").addEventListener("click", closeQuotePreview);
    document.getElementById("quotePdf").addEventListener("click", () => { closeQuotePreview(); generatePdf(false); });
    document.getElementById("quoteOverlay").addEventListener("click", e => {
      if (e.target === e.currentTarget) closeQuotePreview();
    });
  }

  // === QUOTATION PREVIEW ===
  function openQuotePreview() {
    const selected = getSelected();
    if (!selected.length) { alert("Нет выбранных товаров\n선택된 제품이 없습니다"); return; }

    const grouped = {};
    DATA.sections.forEach(s => { grouped[s.id] = { sec: s, items: [] }; });
    selected.forEach(it => { if (grouped[it.sectionId]) grouped[it.sectionId].items.push(it); });

    let totalQty = 0, totalUsd = 0, idx = 0;
    let rows = "";

    Object.values(grouped).forEach(({ sec, items }) => {
      if (!items.length) return;
      const secSum = items.reduce((s, i) => s + i.pricing.usd * i.qty, 0);
      rows += `<tr class="qt-sec"><td colspan="5">${sec.num}. ${sec.title} — ${sec.titleRu || ""}</td><td style="text-align:right">$${secSum.toFixed(2)}</td></tr>`;
      items.forEach(it => {
        idx++;
        const sub = it.pricing.usd * it.qty;
        totalQty += it.qty;
        totalUsd += sub;
        rows += `<tr>
          <td><img src="${it.image}" class="qt-img" loading="lazy" onerror="this.style.display='none'"></td>
          <td><div class="qt-name-ru">${it.nameRu}</div><div class="qt-name-sub">${it.nameEn}</div><div class="qt-name-sub">${it.nameKr}</div></td>
          <td><span class="qt-vol">${it.volume}</span></td>
          <td style="text-align:right">$${it.pricing.usd.toFixed(2)}</td>
          <td>
            <div class="qt-qty">
              <button class="qt-qty-btn" data-qpid="${it.id}" data-qact="dec">−</button>
              <span class="qt-qty-val">${it.qty}</span>
              <button class="qt-qty-btn" data-qpid="${it.id}" data-qact="inc">+</button>
            </div>
          </td>
          <td class="qt-sub">$${sub.toFixed(2)}</td>
        </tr>`;
      });
    });

    rows += `<tr class="qt-total"><td colspan="4" style="text-align:right">ИТОГО / TOTAL</td><td style="text-align:center">${totalQty}</td><td style="text-align:right;font-size:16px">$${totalUsd.toFixed(2)}</td></tr>`;

    const body = document.getElementById("quoteBody");
    body.innerHTML = `
      <table class="qt">
        <thead><tr>
          <th style="width:50px"></th>
          <th>Наименование</th>
          <th>Объём</th>
          <th style="text-align:right">Цена</th>
          <th>Кол-во</th>
          <th style="text-align:right">Сумма</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="qt-summary">
        <div class="qt-summary-box"><div class="qt-summary-label">Товаров</div><div class="qt-summary-value">${selected.length}</div></div>
        <div class="qt-summary-box"><div class="qt-summary-label">Кол-во</div><div class="qt-summary-value">${totalQty}</div></div>
        <div class="qt-summary-box total"><div class="qt-summary-label">Итого</div><div class="qt-summary-value">$${totalUsd.toFixed(2)}</div></div>
      </div>`;

    // Qty buttons inside preview
    body.addEventListener("click", e => {
      const btn = e.target.closest(".qt-qty-btn");
      if (!btn) return;
      const pid = parseInt(btn.dataset.qpid);
      const act = btn.dataset.qact;
      setQty(pid, act === "inc" ? getQty(pid) + 1 : getQty(pid) - 1);
      openQuotePreview(); // re-render
    });

    document.getElementById("quoteOverlay").classList.add("open");
    document.body.style.overflow = "hidden";
  }

  function closeQuotePreview() {
    document.getElementById("quoteOverlay").classList.remove("open");
    document.body.style.overflow = "";
  }

  function getSelected() {
    const selected = [];
    Object.entries(cart).forEach(([pid, qty]) => {
      if (qty > 0) {
        const p = DATA.products.find(x => x.id === parseInt(pid));
        if (p) selected.push({ ...p, qty });
      }
    });
    return selected;
  }

  // === IMAGE PRELOADING FOR PDF ===
  function showLoading(msg) {
    const el = document.getElementById("loadingOverlay");
    document.getElementById("loadingMsg").textContent = msg || "Загрузка...";
    el.classList.add("open");
  }
  function updateLoading(msg) {
    document.getElementById("loadingMsg").textContent = msg;
  }
  function hideLoading() {
    document.getElementById("loadingOverlay").classList.remove("open");
  }

  async function fetchImageAsBase64(url) {
    // Strategy 1: Proxy (Vercel deployed)
    try {
      const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(url)}`;
      const res = await fetch(proxyUrl);
      if (res.ok) {
        const blob = await res.blob();
        return await blobToBase64(blob);
      }
    } catch {}
    // Strategy 2: Direct fetch (same-origin or CORS-friendly)
    try {
      const res = await fetch(url, { mode: "cors" });
      if (res.ok) {
        const blob = await res.blob();
        return await blobToBase64(blob);
      }
    } catch {}
    // Strategy 3: Canvas from loaded DOM image
    try {
      const img = document.querySelector(`img[src="${CSS.escape(url)}"]`);
      if (img && img.naturalWidth > 0) {
        const c = document.createElement("canvas");
        c.width = 80; c.height = 80;
        c.getContext("2d").drawImage(img, 0, 0, 80, 80);
        return c.toDataURL("image/jpeg", 0.85);
      }
    } catch {}
    return "";
  }

  function blobToBase64(blob) {
    return new Promise(resolve => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = () => resolve("");
      reader.readAsDataURL(blob);
    });
  }

  async function preloadImages(products) {
    const total = products.length;
    let done = 0;
    const results = {};
    const batch = products.map(async (p) => {
      const b64 = await fetchImageAsBase64(p.image);
      results[p.id] = b64;
      done++;
      updateLoading(`Загрузка изображений: ${done}/${total}`);
    });
    await Promise.all(batch);
    return results;
  }

  // === FULL QUOTATION (38 products × 1EA) ===
  async function generateFullQuotation() {
    // Add all products at qty 1 if not already in cart
    DATA.products.forEach(p => {
      if (!cart[p.id]) setQty(p.id, 1);
    });
    await generatePdf(true);
  }

  // === PDF GENERATION ===
  async function generatePdf(isFullQuotation) {
    const products = isFullQuotation
      ? DATA.products.map(p => ({ ...p, qty: getQty(p.id) || 1 }))
      : getSelected();

    if (!products.length) {
      alert("Нет выбранных товаров\n선택된 제품이 없습니다");
      return;
    }

    showLoading("Подготовка котировки...");

    // Preload all product images as base64
    try {
      imageCache = await preloadImages(products);
    } catch {
      imageCache = {};
    }

    updateLoading("Создание PDF...");

    // Group by section (preserve section order)
    const grouped = {};
    DATA.sections.forEach(s => { grouped[s.id] = { sec: s, items: [] }; });
    products.forEach(it => {
      if (grouped[it.sectionId]) grouped[it.sectionId].items.push(it);
    });

    let totalQty = 0, totalUsd = 0, idx = 0;
    let rows = "";

    Object.values(grouped).forEach(({ sec, items }) => {
      if (!items.length) return;
      const secSum = items.reduce((s, i) => s + i.pricing.usd * i.qty, 0);
      rows += `<tr class="pdf-sec-row"><td colspan="7" style="background:#e8eaf6;font-weight:700;color:#1a237e;border-bottom:2px solid #3f51b5;font-size:10px;padding:5px 8px">${sec.num}. ${sec.title} — ${sec.titleRu || ""}<span style="float:right;font-size:9px;color:#555">$${secSum.toFixed(2)}</span></td></tr>`;

      items.forEach(it => {
        idx++;
        const sub = it.pricing.usd * it.qty;
        totalQty += it.qty;
        totalUsd += sub;
        const bg = idx % 2 ? "#fff" : "#f7f8fc";
        const imgSrc = imageCache[it.id] || it.image;
        const imgTag = imgSrc
          ? `<img src="${imgSrc}" style="width:32px;height:32px;object-fit:contain;border-radius:3px;background:#f3f3f3;display:block" crossorigin="anonymous">`
          : `<div style="width:32px;height:32px;background:#f0f0f0;border-radius:3px"></div>`;

        rows += `<tr style="background:${bg}">
          <td style="text-align:center;font-size:8px;color:#999;padding:3px 4px">${idx}</td>
          <td style="padding:2px 4px;width:36px">${imgTag}</td>
          <td style="padding:3px 6px"><strong style="font-size:8.5px;color:#1a237e">${it.nameRu}</strong><br><span style="color:#888;font-size:6.5px">${it.nameEn}</span><br><span style="color:#bbb;font-size:6px">${it.nameKr}</span></td>
          <td style="text-align:center;font-weight:700;font-size:8px;color:#1a237e">${it.volume}</td>
          <td style="text-align:right;font-size:8.5px;padding:3px 6px">$${it.pricing.usd.toFixed(2)}</td>
          <td style="text-align:center;font-size:9px;font-weight:700;color:#1a237e">${it.qty}</td>
          <td style="text-align:right;font-weight:700;font-size:9px;padding:3px 6px;color:#1a237e">$${sub.toFixed(2)}</td>
        </tr>`;
      });
    });

    const today = fmtDate(new Date());
    const pdfHTML = `
      <div style="font-family:'Outfit',Helvetica,Arial,sans-serif;padding:14px 18px;color:#222;max-width:1100px">
        <!-- HEADER -->
        <div style="display:flex;justify-content:space-between;align-items:flex-end;border-bottom:3px solid #1a237e;padding-bottom:8px;margin-bottom:8px">
          <div>
            <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:28px;font-weight:700;color:#1a237e;letter-spacing:3px">AMPLE:N</div>
            <div style="font-size:10px;color:#666;margin-top:2px">Коммерческое предложение / Commercial Quotation / 견적서</div>
          </div>
          <div style="text-align:right;font-size:9px;color:#555">
            <div><strong>Дата:</strong> ${today}</div>
            <div><strong>Курс:</strong> $1 = ₩${EXCHANGE_RATE.toLocaleString()}</div>
            <div><strong>Товаров:</strong> ${products.length} наименований</div>
          </div>
        </div>

        <!-- TABLE -->
        <table style="width:100%;border-collapse:collapse;font-size:8.5px;table-layout:fixed">
          <colgroup>
            <col style="width:4%">
            <col style="width:5%">
            <col style="width:38%">
            <col style="width:10%">
            <col style="width:12%">
            <col style="width:8%">
            <col style="width:13%">
          </colgroup>
          <thead>
            <tr style="background:#1a237e;color:#fff">
              <th style="padding:5px 4px;text-align:center;font-weight:600;font-size:8px">№</th>
              <th style="padding:5px 4px;font-weight:600;font-size:8px">Фото</th>
              <th style="padding:5px 6px;font-weight:600;font-size:8px">Наименование / Product</th>
              <th style="padding:5px 4px;text-align:center;font-weight:600;font-size:8px">Объём</th>
              <th style="padding:5px 6px;text-align:right;font-weight:600;font-size:8px">Цена (USD)</th>
              <th style="padding:5px 4px;text-align:center;font-weight:600;font-size:8px">Кол-во</th>
              <th style="padding:5px 6px;text-align:right;font-weight:600;font-size:8px">Сумма (USD)</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
            <tr style="background:#1a237e;color:#fff">
              <td colspan="5" style="text-align:right;font-weight:700;font-size:10px;padding:7px 8px">ИТОГО / TOTAL (${products.length} наименований)</td>
              <td style="text-align:center;font-weight:700;font-size:10px;padding:7px 4px">${totalQty}</td>
              <td style="text-align:right;font-weight:700;font-size:13px;padding:7px 8px">$${totalUsd.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>

        <!-- FOOTER -->
        <div style="margin-top:8px;padding-top:6px;border-top:1px solid #ddd;display:flex;justify-content:space-between;font-size:7px;color:#999">
          <span>AMPLE:N Uzbekistan · Dealer Quotation · Confidential</span>
          <span>${today} · $1 = ₩${EXCHANGE_RATE.toLocaleString()}</span>
        </div>
      </div>`;

    const tpl = document.getElementById("pdfTemplate");
    tpl.innerHTML = pdfHTML;
    tpl.style.display = "block";

    try {
      await html2pdf().set({
        margin: [6, 6, 6, 6],
        filename: `AMPLEN_Quotation_${products.length}items_${new Date().toISOString().slice(0, 10).replace(/-/g, "")}.pdf`,
        image: { type: "jpeg", quality: 0.92 },
        html2canvas: { scale: 2, useCORS: true, allowTaint: true, logging: false },
        jsPDF: { unit: "mm", format: "a4", orientation: "landscape" },
        pagebreak: { mode: ["avoid-all", "css", "legacy"] },
      }).from(tpl).save();
    } catch (err) {
      alert("PDF 생성 오류: " + err.message);
    } finally {
      tpl.style.display = "none";
      hideLoading();
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
