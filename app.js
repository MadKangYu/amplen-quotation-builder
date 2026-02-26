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

  let currentLang = 'ru';

  const LANG = {
    ru: {
      fullQuote: '📄 Полная котировка (38 товаров)',
      addAll1: '＋ Все по 1 шт.', addAll3: '＋ Все по 3 шт.',
      reset: '↺ Сброс',
      products: 'Товары', qty: 'Кол-во', total: 'Итого',
      cartFilter: '🛒 Выбранные', preview: '📋 Просмотр',
      downloadPdf: '📄 Скачать PDF', pdfBtn: '📄 PDF',
      back: '← Назад',
      emptyMain: 'Выберите товары и укажите количество',
      emptyHint: '제품을 선택하고 수량을 입력하세요',
      quoteTitle: '📋 Коммерческое предложение',
      allCats: 'Все категории', allTab: 'Все',
      confirmReset: 'Сбросить все количества?\n모든 수량을 초기화합니다?',
      addQuickTitle: 'Добавить 1 шт.',
      noProducts: 'Нет выбранных товаров\n선택된 제품이 없습니다',
      loading: 'Загрузка...', loadingPrep: 'Подготовка котировки...',
      loadingFonts: 'Загрузка шрифтов...', loadingPdf: 'Создание PDF...',
      sec1: '+1шт', sec3: '+3шт', secCount: 'товаров',
      qtNameCol: 'Наименование', qtVolCol: 'Объём',
      qtPriceCol: 'Цена', qtQtyCol: 'Кол-во', qtSumCol: 'Сумма',
      qtTotal: 'ИТОГО / TOTAL',
      qtSumProducts: 'Товаров', qtSumQty: 'Кол-во', qtSumTotal: 'Итого',
      historyTitle: '📚 История котировок',
      historyEmpty: 'История пуста. Создайте первую котировку.',
      histDocNum: '№ Документа', histDate: 'Дата',
      histProducts: 'Товары', histQty: 'Кол-во', histTotal: 'Сумма',
      histType: 'Тип', histFull: 'Полная', histPartial: 'Выборочная',
      histDetail: 'Подробности', histBackToList: '← К списку',
    },
    kr: {
      fullQuote: '📄 전체 견적서 (38개 제품)',
      addAll1: '＋ 전체 1개씩', addAll3: '＋ 전체 3개씩',
      reset: '↺ 초기화',
      products: '제품', qty: '수량', total: '합계',
      cartFilter: '🛒 선택됨', preview: '📋 미리보기',
      downloadPdf: '📄 PDF 다운로드', pdfBtn: '📄 PDF',
      back: '← 뒤로',
      emptyMain: '제품을 선택하고 수량을 입력하세요',
      emptyHint: 'Выберите товары и укажите количество',
      quoteTitle: '📋 견적서',
      allCats: '전체 카테고리', allTab: '전체',
      confirmReset: '모든 수량을 초기화합니다?\nСбросить все количества?',
      addQuickTitle: '1개 추가',
      noProducts: '선택된 제품이 없습니다\nНет выбранных товаров',
      loading: '로딩 중...', loadingPrep: '견적서 준비 중...',
      loadingFonts: '폰트 로딩 중...', loadingPdf: 'PDF 생성 중...',
      sec1: '+1개', sec3: '+3개', secCount: '제품',
      qtNameCol: '제품명', qtVolCol: '용량',
      qtPriceCol: '가격', qtQtyCol: '수량', qtSumCol: '금액',
      qtTotal: '합계 / TOTAL',
      qtSumProducts: '제품', qtSumQty: '수량', qtSumTotal: '합계',
      historyTitle: '📚 견적서 히스토리',
      historyEmpty: '히스토리가 비어있습니다. 첫 견적서를 생성하세요.',
      histDocNum: '문서번호', histDate: '날짜',
      histProducts: '제품', histQty: '수량', histTotal: '금액',
      histType: '유형', histFull: '전체', histPartial: '선택',
      histDetail: '상세', histBackToList: '← 목록으로',
    }
  };

  function L(key) { return LANG[currentLang][key] || LANG.ru[key] || key; }

  function toggleLang() {
    currentLang = currentLang === 'ru' ? 'kr' : 'ru';
    document.body.dataset.lang = currentLang;
    document.getElementById('btnLang').textContent = '🌐 ' + currentLang.toUpperCase();
    applyLangUI();
  }

  function applyLangUI() {
    // Header quick action buttons
    const q = (id, key) => { const el = document.getElementById(id); if (el) el.textContent = L(key); };
    q('btnFullQuote', 'fullQuote');
    q('btnAddAll1', 'addAll1');
    q('btnAddAll3', 'addAll3');
    q('btnResetTop', 'reset');

    // Bottom bar stat labels
    const statLabels = document.querySelectorAll('.stat-label');
    if (statLabels[0]) statLabels[0].textContent = L('products');
    if (statLabels[1]) statLabels[1].textContent = L('qty');
    if (statLabels[2]) statLabels[2].textContent = L('total');

    // Bottom bar action buttons
    const cartBtn = document.getElementById('btnCartFilter');
    if (cartBtn) {
      const countSpan = cartBtn.querySelector('.cart-filter-count');
      const countText = countSpan ? countSpan.outerHTML : '';
      cartBtn.innerHTML = L('cartFilter') + ' ' + countText;
    }
    q('btnQuote', 'preview');
    q('btnPdf', 'pdfBtn');

    // Empty state
    const emptyEl = document.getElementById('emptyState');
    if (emptyEl) {
      const ps = emptyEl.querySelectorAll('p');
      if (ps[0]) ps[0].textContent = L('emptyMain');
      if (ps[1]) ps[1].textContent = L('emptyHint');
    }

    // Quote modal
    const qtTitle = document.querySelector('.quote-modal-title');
    if (qtTitle) qtTitle.textContent = L('quoteTitle');
    q('quoteBack', 'back');
    q('quotePdf', 'downloadPdf');
    // History modal title
    const htTitle = document.querySelector('.history-modal-title');
    if (htTitle) htTitle.textContent = L('historyTitle');

    // Mobile menu toggle label
    const mmtLabel = document.getElementById('mmtLabel');
    if (mmtLabel) {
      if (activeTab === 'all') {
        mmtLabel.textContent = L('allCats');
      } else {
        const sec = DATA.sections.find(s => s.id === activeTab);
        if (sec) mmtLabel.textContent = sec.num + ' ' + getSectionLabel(sec);
      }
    }

    // "Все" tab label
    const allTabBtn = document.querySelector('[data-tab="all"]');
    if (allTabBtn) {
      const countSpan = allTabBtn.querySelector('.tab-count');
      const icon = '<span class="tab-icon">☰</span> ';
      allTabBtn.innerHTML = icon + L('allTab') + (countSpan ? countSpan.outerHTML : '');
    }

    // Section +1/+3 buttons & section title labels
    document.querySelectorAll('.btn-sec-add').forEach(btn => {
      const q = parseInt(btn.dataset.qty);
      btn.textContent = q === 1 ? L('sec1') : L('sec3');
    });

    // Section titleRu line — show Russian or Korean
    document.querySelectorAll('.section-group').forEach(g => {
      const secId = g.dataset.section;
      const sec = DATA.sections.find(s => s.id === secId);
      if (!sec) return;
      const titleRuEl = g.querySelector('.section-title-ru');
      if (titleRuEl) {
        const prods = DATA.products.filter(p => p.sectionId === sec.id);
        const label = currentLang === 'kr'
          ? (sec.titleKr || sec.titleRu || '') + ' · ' + prods.length + ' ' + L('secCount')
          : (sec.titleRu || '') + ' · ' + prods.length + ' ' + L('secCount');
        titleRuEl.textContent = label;
      }
    });
  }

  function getSectionLabel(sec) {
    if (currentLang === 'kr' && sec.titleKr) return sec.titleKr;
    return sec.title;
  }

  // === QUOTATION STORE (localStorage — Postgres-ready) ===
  const QS_KEY = 'amplen_quotation_history';
  const QS_SEQ = 'amplen_quotation_seq';

  const QuotationStore = {
    _load() { try { return JSON.parse(localStorage.getItem(QS_KEY)) || []; } catch { return []; } },
    _save(arr) { localStorage.setItem(QS_KEY, JSON.stringify(arr)); },

    nextNumber() {
      const year = new Date().getFullYear();
      let seq = parseInt(localStorage.getItem(QS_SEQ)) || 0;
      seq++;
      localStorage.setItem(QS_SEQ, String(seq));
      return '\u041a\u041f-' + year + '-' + String(seq).padStart(4, '0');
    },

    save(record) {
      const arr = this._load();
      arr.unshift(record);
      if (arr.length > 200) arr.length = 200;
      this._save(arr);
      return record;
    },

    getAll() { return this._load(); },
    getById(docNumber) { return this._load().find(r => r.docNumber === docNumber) || null; },
    count() { return this._load().length; },
  };

  // === INIT ===
  async function init() {
    document.getElementById("dateLabel").textContent = fmtDate(new Date());
    startUzbekClock();

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
    applyLangUI(); // apply language-specific UI text
    updateHistoryBadge();
    syncTabsTop();
    setTimeout(syncTabsTop, 100); // ensure after layout paint
  }

  function fmtDate(d) {
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
  }

  function startUzbekClock() {
    const el = document.getElementById('clockLabel');
    function tick() {
      const now = new Date();
      const uzb = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Tashkent' }));
      const h = String(uzb.getHours()).padStart(2, '0');
      const m = String(uzb.getMinutes()).padStart(2, '0');
      const s = String(uzb.getSeconds()).padStart(2, '0');
      el.textContent = '🇺🇿 ' + h + ':' + m + ':' + s;
    }
    tick();
    setInterval(tick, 1000);
  }

  // Sync sticky tab bar top with actual header height
  function syncTabsTop() {
    const header = document.querySelector('.header');
    if (!header) return;
    const h = header.offsetHeight;
    document.documentElement.style.setProperty('--header-h', h + 'px');
  }
  window.addEventListener('resize', syncTabsTop);
  window.addEventListener('scroll', function() {
    // Re-sync on first scroll in case layout shifted after initial paint
    syncTabsTop();
  }, { once: true });

  // === CART ===
  function loadCart() {
    cart = {};
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
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
    // Mobile toggle header
    let html = `<div class="mobile-menu-toggle" id="mobileMenuToggle">
      <span class="mmt-icon">☰</span>
      <span class="mmt-label" id="mmtLabel">${L('allCats')}</span>
      <span class="mmt-arrow">▾</span>
    </div>`;
    html += `<div class="tab-list" id="tabList">`;
    html += `<button class="tab-btn active" data-tab="all"><span class="tab-icon">☰</span> ${L('allTab')}<span class="tab-count" id="tc-all"></span></button>`;
    DATA.sections.forEach(s => {
      html += `<button class="tab-btn" data-tab="${s.id}"><span class="tab-num">${s.num}</span>${s.title}<span class="tab-count" id="tc-${s.id}"></span></button>`;
    });
    html += `</div>`;
    nav.innerHTML = html;
    // Mobile menu toggle
    document.getElementById('mobileMenuToggle').addEventListener('click', () => {
      nav.classList.toggle('open');
    });
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
              <span class="section-title-ru">${currentLang === 'kr' ? (sec.titleKr || sec.titleRu || '') : (sec.titleRu || '')} · ${prods.length} ${L('secCount')}</span>
            </div>
            <div class="section-actions">
              <button class="btn-sec btn-sec-add" data-sec="${sec.id}" data-qty="1">${L('sec1')}</button>
              <button class="btn-sec btn-sec-add" data-sec="${sec.id}" data-qty="3">${L('sec3')}</button>
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
          <button class="card-quick-add" data-pid="${p.id}" title="${L('addQuickTitle')}">+</button>
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

  function scrollToSection(tab) {
    if (tab === 'selected') return;
    const headerH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 108;
    const isMobile = window.innerWidth <= 768;
    // On mobile: toggle bar is ~48px; on PC: sidebar doesn't add vertical offset
    const toggle = document.getElementById('mobileMenuToggle');
    const tabsH = isMobile && toggle ? toggle.offsetHeight : 0;
    const offset = headerH + tabsH + 12;
    if (tab === 'all') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const sec = document.getElementById('sec-' + tab);
    if (!sec) return;
    const top = sec.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
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
      scrollToSection(activeTab);
      // Mobile: close dropdown + update toggle label
      const nav = document.getElementById('sectionTabs');
      nav.classList.remove('open');
      const label = document.getElementById('mmtLabel');
      if (label) {
        if (activeTab === 'all') { label.textContent = L('allCats'); }
        else {
          const sec = DATA.sections.find(s => s.id === activeTab);
          label.textContent = sec ? sec.num + ' ' + getSectionLabel(sec) : activeTab;
        }
      }
    });

    // 🛒 Cart filter toggle (bottom bar)
    const btnCart = document.getElementById("btnCartFilter");
    if (btnCart) {
      btnCart.addEventListener("click", () => {
        if (activeTab === "selected") {
          activeTab = "all";
          btnCart.classList.remove("active");
          document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
          const allBtn = document.querySelector('[data-tab="all"]');
          if (allBtn) allBtn.classList.add("active");
        } else {
          activeTab = "selected";
          btnCart.classList.add("active");
          document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
        }
        applyFilter();
      });
    }

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
      if (confirm(L('confirmReset'))) resetAll();
    });

    // Full quotation button
    document.getElementById("btnFullQuote").addEventListener("click", generateFullQuotation);

    // Bottom bar
    document.getElementById("btnReset").addEventListener("click", () => {
      if (Object.keys(cart).length === 0) return;
      if (confirm(L('confirmReset'))) resetAll();
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

    // Language toggle
    document.getElementById('btnLang').addEventListener('click', toggleLang);

    // History
    document.getElementById('btnHistory').addEventListener('click', openHistory);
    document.getElementById('historyClose').addEventListener('click', closeHistory);
    document.getElementById('historyBack').addEventListener('click', closeHistory);
    document.getElementById('historyOverlay').addEventListener('click', e => {
      if (e.target === e.currentTarget) closeHistory();
    });
  }

  // === QUOTATION PREVIEW ===
  function openQuotePreview() {
    const selected = getSelected();
    if (!selected.length) { alert(L('noProducts')); return; }

    const grouped = {};
    DATA.sections.forEach(s => { grouped[s.id] = { sec: s, items: [] }; });
    selected.forEach(it => { if (grouped[it.sectionId]) grouped[it.sectionId].items.push(it); });

    let totalQty = 0, totalUsd = 0, idx = 0;
    let rows = "";

    Object.values(grouped).forEach(({ sec, items }) => {
      if (!items.length) return;
      const secSum = items.reduce((s, i) => s + i.pricing.usd * i.qty, 0);
      const secLabel = currentLang === 'kr' ? (sec.titleKr || sec.titleRu || '') : (sec.titleRu || '');
      rows += `<tr class="qt-sec"><td colspan="5">${sec.num}. ${sec.title} \u2014 ${secLabel}</td><td style="text-align:right">$${secSum.toFixed(2)}</td></tr>`;
      items.forEach(it => {
        idx++;
        const sub = it.pricing.usd * it.qty;
        totalQty += it.qty;
        totalUsd += sub;
        rows += `<tr>
          <td><img src="${it.image}" class="qt-img" loading="lazy" onerror="this.style.display='none'"></td>
          <td><div class="qt-name-ru">${currentLang === 'kr' ? it.nameKr : it.nameRu}</div><div class="qt-name-sub">${it.nameEn}</div></td>
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

    rows += `<tr class="qt-total"><td colspan="4" style="text-align:right">${L('qtTotal')}</td><td style="text-align:center">${totalQty}</td><td style="text-align:right;font-size:16px">$${totalUsd.toFixed(2)}</td></tr>`;

    const body = document.getElementById("quoteBody");
    body.innerHTML = `
      <table class="qt">
        <thead><tr>
          <th style="width:50px"></th>
          <th>${L('qtNameCol')}</th>
          <th>${L('qtVolCol')}</th>
          <th style="text-align:right">${L('qtPriceCol')}</th>
          <th>${L('qtQtyCol')}</th>
          <th style="text-align:right">${L('qtSumCol')}</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="qt-summary">
        <div class="qt-summary-box"><div class="qt-summary-label">${L('qtSumProducts')}</div><div class="qt-summary-value">${selected.length}</div></div>
        <div class="qt-summary-box"><div class="qt-summary-label">${L('qtSumQty')}</div><div class="qt-summary-value">${totalQty}</div></div>
        <div class="qt-summary-box total"><div class="qt-summary-label">${L('qtSumTotal')}</div><div class="qt-summary-value">$${totalUsd.toFixed(2)}</div></div>
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
  const PLACEHOLDER_IMG = 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><rect fill="#f0f0f0" width="80" height="80" rx="4"/><text x="40" y="44" text-anchor="middle" fill="#bbb" font-size="9" font-family="sans-serif">No Image</text></svg>');

  function showLoading(msg) {
    const el = document.getElementById('loadingOverlay');
    document.getElementById('loadingMsg').textContent = msg || 'Загрузка...';
    el.classList.add('open');
  }
  function updateLoading(msg) {
    document.getElementById('loadingMsg').textContent = msg;
  }
  function hideLoading() {
    document.getElementById('loadingOverlay').classList.remove('open');
  }

  async function fetchImageAsBase64(url) {
    if (!url || url.startsWith('data:')) return url || PLACEHOLDER_IMG;

    // Strategy 1: Proxy (works on Vercel)
    try {
      const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(url)}`;
      const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(8000) });
      if (res.ok) {
        const blob = await res.blob();
        const b64 = await blobToBase64(blob);
        if (b64 && b64.length > 100) return b64;
      }
    } catch {}

    // Strategy 2: Direct fetch
    try {
      const res = await fetch(url, { mode: 'cors', signal: AbortSignal.timeout(8000) });
      if (res.ok) {
        const blob = await res.blob();
        const b64 = await blobToBase64(blob);
        if (b64 && b64.length > 100) return b64;
      }
    } catch {}

    // Strategy 3: Canvas from loaded DOM image
    try {
      const imgs = document.querySelectorAll('img');
      for (const img of imgs) {
        if (img.src === url && img.naturalWidth > 0 && img.complete) {
          const c = document.createElement('canvas');
          c.width = 80; c.height = 80;
          const ctx = c.getContext('2d');
          ctx.fillStyle = '#f3f3f3';
          ctx.fillRect(0, 0, 80, 80);
          // Fit image
          const scale = Math.min(80 / img.naturalWidth, 80 / img.naturalHeight);
          const w = img.naturalWidth * scale;
          const h = img.naturalHeight * scale;
          ctx.drawImage(img, (80 - w) / 2, (80 - h) / 2, w, h);
          return c.toDataURL('image/jpeg', 0.85);
        }
      }
    } catch {}

    // Strategy 4: Load fresh via Image element
    try {
      const b64 = await new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const c = document.createElement('canvas');
          c.width = 80; c.height = 80;
          const ctx = c.getContext('2d');
          ctx.fillStyle = '#f3f3f3';
          ctx.fillRect(0, 0, 80, 80);
          const scale = Math.min(80 / img.naturalWidth, 80 / img.naturalHeight);
          const w = img.naturalWidth * scale;
          const h = img.naturalHeight * scale;
          ctx.drawImage(img, (80 - w) / 2, (80 - h) / 2, w, h);
          resolve(c.toDataURL('image/jpeg', 0.85));
        };
        img.onerror = () => resolve('');
        // Try proxy URL for the Image element too
        img.src = `/api/proxy-image?url=${encodeURIComponent(url)}`;
        setTimeout(() => resolve(''), 6000);
      });
      if (b64 && b64.length > 100) return b64;
    } catch {}

    return PLACEHOLDER_IMG;
  }

  function blobToBase64(blob) {
    return new Promise(resolve => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = () => resolve('');
      reader.readAsDataURL(blob);
    });
  }

  async function preloadImages(products) {
    const total = products.length;
    let done = 0;
    const results = {};
    // Process in batches of 6 to avoid overwhelming browser
    const batchSize = 6;
    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize);
      await Promise.all(batch.map(async (p) => {
        results[p.id] = await fetchImageAsBase64(p.image);
        done++;
        updateLoading(`Загрузка изображений: ${done}/${total}`);
      }));
    }
    return results;
  }

  // === FULL QUOTATION (38 products × 1EA) ===
  // === FONT LOADING FOR CYRILLIC SUPPORT ===
  let _fontCache = { regular: null, bold: null };

  async function loadCyrillicFonts() {
    if (_fontCache.regular) return _fontCache;
    const loadFont = async (url) => {
      try {
        const response = await fetch(url);
        if (!response.ok) return null;
        const arrayBuffer = await response.arrayBuffer();
        const uint8 = new Uint8Array(arrayBuffer);
        let binary = '';
        const chunk = 8192;
        for (let i = 0; i < uint8.length; i += chunk) {
          binary += String.fromCharCode(...uint8.subarray(i, Math.min(i + chunk, uint8.length)));
        }
        return btoa(binary);
      } catch (e) {
        console.warn('Font load failed:', url, e);
        return null;
      }
    };
    const [regular, bold] = await Promise.all([
      loadFont('/fonts/PTSans-Regular.ttf'),
      loadFont('/fonts/PTSans-Bold.ttf'),
    ]);
    _fontCache = { regular, bold };
    return _fontCache;
  }

  function embedFonts(doc) {
    if (_fontCache.regular) {
      doc.addFileToVFS('PTSans-Regular.ttf', _fontCache.regular);
      doc.addFont('PTSans-Regular.ttf', 'PTSans', 'normal');
    }
    if (_fontCache.bold) {
      doc.addFileToVFS('PTSans-Bold.ttf', _fontCache.bold);
      doc.addFont('PTSans-Bold.ttf', 'PTSans', 'bold');
    }
    if (_fontCache.regular) {
      doc.setFont('PTSans');
    }
  }

  async function generateFullQuotation() {
    // Add all products at qty 1 if not already in cart
    DATA.products.forEach(p => {
      if (!cart[p.id]) setQty(p.id, 1);
    });
    await generatePdf(true);
  }

  // === PDF GENERATION (jsPDF + autoTable — no html2canvas) ===
  async function generatePdf(isFullQuotation) {
    const products = isFullQuotation
      ? DATA.products.map(p => ({ ...p, qty: getQty(p.id) || 1 }))
      : getSelected();

    if (!products.length) {
      alert('\u041d\u0435\u0442 \u0432\u044b\u0431\u0440\u0430\u043d\u043d\u044b\u0445 \u0442\u043e\u0432\u0430\u0440\u043e\u0432\n\uc120\ud0dd\ub41c \uc81c\ud488\uc774 \uc5c6\uc2b5\ub2c8\ub2e4');
      return;
    }

    showLoading('\u041f\u043e\u0434\u0433\u043e\u0442\u043e\u0432\u043a\u0430 \u043a\u043e\u0442\u0438\u0440\u043e\u0432\u043a\u0438...');

    // Load Cyrillic fonts (PT Sans) for Russian text support
    updateLoading('Загрузка шрифтов...');
    await loadCyrillicFonts();

    // Preload images as base64 for embedding in PDF
    try {
      imageCache = await preloadImages(products);
    } catch {
      imageCache = {};
    }

    updateLoading('\u0421\u043e\u0437\u0434\u0430\u043d\u0438\u0435 PDF...');

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    embedFonts(doc);
    const usePTSans = !!_fontCache.regular;
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const today = fmtDate(new Date());
    const docNumber = QuotationStore.nextNumber();

    // --- HEADER ---
    doc.setFontSize(22);
    doc.setTextColor(26, 35, 126);
    doc.text('AMPLE:N', 14, 16);
    doc.setFontSize(8);
    doc.setTextColor(102, 102, 102);
    doc.text('Commercial Quotation · ' + docNumber, 14, 21);

    doc.setFontSize(8);
    doc.setTextColor(85, 85, 85);
    doc.text(`Date: ${today}`, pageW - 14, 12, { align: 'right' });
    doc.text(`Rate: $1 = KRW ${EXCHANGE_RATE.toLocaleString()}`, pageW - 14, 16, { align: 'right' });
    doc.text(`Products: ${products.length} items`, pageW - 14, 20, { align: 'right' });
    doc.text(docNumber, pageW - 14, 24, { align: 'right' });

    // Header line
    doc.setDrawColor(26, 35, 126);
    doc.setLineWidth(0.8);
    doc.line(14, 24, pageW - 14, 24);

    // --- TABLE DATA ---
    const grouped = {};
    DATA.sections.forEach(s => { grouped[s.id] = { sec: s, items: [] }; });
    products.forEach(it => {
      if (grouped[it.sectionId]) grouped[it.sectionId].items.push(it);
    });

    let totalQty = 0, totalUsd = 0, idx = 0;
    const tableBody = [];

    Object.values(grouped).forEach(({ sec, items }) => {
      if (!items.length) return;
      const secSum = items.reduce((s, i) => s + i.pricing.usd * i.qty, 0);
      // Section header row
      tableBody.push([{
        content: `${sec.num}. ${sec.title} \u2014 ${sec.titleRu || ''}    $${secSum.toFixed(2)}`,
        colSpan: 7,
        styles: { fillColor: [232, 234, 246], textColor: [26, 35, 126], fontStyle: 'bold', fontSize: 7.5, cellPadding: 2 }
      }]);

      items.forEach(it => {
        idx++;
        const sub = it.pricing.usd * it.qty;
        totalQty += it.qty;
        totalUsd += sub;
        const imgB64 = imageCache[it.id] || '';

        tableBody.push([
          { content: String(idx), styles: { halign: 'center', fontSize: 7, textColor: [150, 150, 150] } },
          imgB64 ? '' : '-',
          { content: `${it.nameRu}\n${it.nameEn}`, styles: { fontSize: 6.5, cellPadding: { top: 1.5, bottom: 1.5, left: 2, right: 2 } } },
          { content: it.volume, styles: { halign: 'center', fontStyle: 'bold', fontSize: 7 } },
          { content: `$${it.pricing.usd.toFixed(2)}`, styles: { halign: 'right', fontSize: 7 } },
          { content: String(it.qty), styles: { halign: 'center', fontStyle: 'bold', fontSize: 8, textColor: [26, 35, 126] } },
          { content: `$${sub.toFixed(2)}`, styles: { halign: 'right', fontStyle: 'bold', fontSize: 7.5, textColor: [26, 35, 126] } },
        ]);
      });
    });

    // Total row
    tableBody.push([{
      content: `TOTAL (${products.length} items)`,
      colSpan: 5,
      styles: { halign: 'right', fillColor: [26, 35, 126], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 }
    }, {
      content: String(totalQty),
      styles: { halign: 'center', fillColor: [26, 35, 126], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 }
    }, {
      content: `$${totalUsd.toFixed(2)}`,
      styles: { halign: 'right', fillColor: [26, 35, 126], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 10 }
    }]);

    // --- DRAW TABLE ---
    doc.autoTable({
      startY: 27,
      margin: { left: 14, right: 14 },
      head: [[
        { content: '\u2116', styles: { halign: 'center' } },
        { content: 'Photo' },
        { content: 'Product' },
        { content: 'Vol.', styles: { halign: 'center' } },
        { content: 'Price (USD)', styles: { halign: 'right' } },
        { content: 'Qty', styles: { halign: 'center' } },
        { content: 'Total (USD)', styles: { halign: 'right' } },
      ]],
      body: tableBody,
      columnStyles: {
        0: { cellWidth: 8 },
        1: { cellWidth: 12 },
        2: { cellWidth: 'auto' },
        3: { cellWidth: 20 },
        4: { cellWidth: 22 },
        5: { cellWidth: 14 },
        6: { cellWidth: 24 },
      },
      headStyles: {
        fillColor: [26, 35, 126],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 7,
        cellPadding: 2,
        font: usePTSans ? 'PTSans' : 'helvetica',
      },
      bodyStyles: {
        fontSize: 7,
        cellPadding: 1.5,
        textColor: [34, 34, 34],
        font: usePTSans ? 'PTSans' : 'helvetica',
      },
      alternateRowStyles: {
        fillColor: [247, 248, 252],
      },
      didDrawCell: function(data) {
        // Draw images in column 1 (Photo)
        if (data.section === 'body' && data.column.index === 1) {
          const rowIdx = data.row.index;
          // Find the product for this row (skip section header rows)
          const rowData = data.row.raw;
          if (Array.isArray(rowData) && rowData.length === 7) {
            // This is a product row, find its image
            const flatProducts = [];
            Object.values(grouped).forEach(({ items }) => items.forEach(it => flatProducts.push(it)));
            // Count product rows up to this point
            let prodIdx = 0;
            for (let r = 0; r < data.row.index; r++) {
              const rd = tableBody[r];
              if (Array.isArray(rd) && rd.length === 7) prodIdx++;
            }
            const prod = flatProducts[prodIdx];
            if (prod) {
              const b64 = imageCache[prod.id];
              if (b64 && b64.startsWith('data:image')) {
                try {
                  const imgFormat = b64.includes('image/png') ? 'PNG' : 'JPEG';
                  doc.addImage(b64, imgFormat, data.cell.x + 1, data.cell.y + 0.5, 10, 10);
                } catch {}
              }
            }
          }
        }
      },
      didDrawPage: function(data) {
        // Footer on each page
        doc.setFontSize(6);
        doc.setTextColor(170, 170, 170);
        doc.text('AMPLE:N Uzbekistan · ' + docNumber + ' · Confidential', 14, pageH - 6);
        doc.text(`${today} · $1 = KRW ${EXCHANGE_RATE.toLocaleString()}`, pageW - 14, pageH - 6, { align: 'right' });
      },
    });

    // Save
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const filename = `AMPLEN_${docNumber}_${products.length}items_${dateStr}.pdf`;
    doc.save(filename);

    // Save to history
    let totalQtyH = 0, totalUsdH = 0;
    products.forEach(p => { totalQtyH += p.qty; totalUsdH += p.pricing.usd * p.qty; });
    QuotationStore.save({
      docNumber,
      createdAt: new Date().toISOString(),
      totalProducts: products.length,
      totalQty: totalQtyH,
      totalUsd: totalUsdH,
      isFullQuotation: !!isFullQuotation,
      items: products.map(p => ({
        id: p.id, nameRu: p.nameRu, nameEn: p.nameEn, nameKr: p.nameKr,
        volume: p.volume, unitPrice: p.pricing.usd, qty: p.qty,
        subtotal: p.pricing.usd * p.qty
      }))
    });
    updateHistoryBadge();
    hideLoading();
  }

  // === HISTORY UI ===
  function updateHistoryBadge() {
    const el = document.getElementById('historyCount');
    if (el) el.textContent = QuotationStore.count();
  }

  function openHistory() {
    renderHistoryList();
    document.getElementById('historyOverlay').classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeHistory() {
    document.getElementById('historyOverlay').classList.remove('open');
    document.body.style.overflow = '';
  }

  function renderHistoryList() {
    const records = QuotationStore.getAll();
    const body = document.getElementById('historyBody');
    const title = document.querySelector('.history-modal-title');
    if (title) title.textContent = L('historyTitle');

    if (!records.length) {
      body.innerHTML = `<div class="history-empty"><div class="empty-icon">\ud83d\udcda</div><p>${L('historyEmpty')}</p></div>`;
      return;
    }

    let html = `<table class="ht">
      <thead><tr>
        <th>${L('histDocNum')}</th>
        <th>${L('histDate')}</th>
        <th>${L('histType')}</th>
        <th style="text-align:center">${L('histProducts')}</th>
        <th style="text-align:center">${L('histQty')}</th>
        <th style="text-align:right">${L('histTotal')}</th>
        <th></th>
      </tr></thead><tbody>`;

    records.forEach(r => {
      const d = new Date(r.createdAt);
      const dateStr = fmtDate(d);
      const timeStr = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
      const typeLabel = r.isFullQuotation ? L('histFull') : L('histPartial');
      const typeCls = r.isFullQuotation ? 'ht-type-full' : 'ht-type-partial';
      html += `<tr class="ht-row" data-doc="${r.docNumber}">
        <td class="ht-doc">${r.docNumber}</td>
        <td class="ht-date">${dateStr}<br><span class="ht-time">${timeStr}</span></td>
        <td><span class="${typeCls}">${typeLabel}</span></td>
        <td style="text-align:center">${r.totalProducts}</td>
        <td style="text-align:center">${r.totalQty}</td>
        <td style="text-align:right;font-weight:600">$${r.totalUsd.toFixed(2)}</td>
        <td><button class="ht-detail-btn" data-doc="${r.docNumber}">${L('histDetail')}</button></td>
      </tr>`;
    });

    html += '</tbody></table>';
    body.innerHTML = html;

    // Detail click
    body.querySelectorAll('.ht-detail-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        renderHistoryDetail(btn.dataset.doc);
      });
    });
  }

  function renderHistoryDetail(docNumber) {
    const r = QuotationStore.getById(docNumber);
    if (!r) return;
    const body = document.getElementById('historyBody');
    const title = document.querySelector('.history-modal-title');
    if (title) title.textContent = docNumber;

    const d = new Date(r.createdAt);
    const dateStr = fmtDate(d);
    const timeStr = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');

    let html = `<div class="hd-header">
      <div class="hd-meta">
        <span class="hd-doc">${r.docNumber}</span>
        <span class="hd-date">${dateStr} ${timeStr}</span>
        <span class="${r.isFullQuotation ? 'ht-type-full' : 'ht-type-partial'}">${r.isFullQuotation ? L('histFull') : L('histPartial')}</span>
      </div>
      <button class="ht-back-btn" id="histBackToList">${L('histBackToList')}</button>
    </div>`;

    html += `<table class="ht hd-table">
      <thead><tr>
        <th style="width:30px">#</th>
        <th>${L('qtNameCol')}</th>
        <th>${L('qtVolCol')}</th>
        <th style="text-align:right">${L('qtPriceCol')}</th>
        <th style="text-align:center">${L('qtQtyCol')}</th>
        <th style="text-align:right">${L('qtSumCol')}</th>
      </tr></thead><tbody>`;

    r.items.forEach((it, i) => {
      const name = currentLang === 'kr' ? it.nameKr : it.nameRu;
      html += `<tr>
        <td style="color:#999">${i + 1}</td>
        <td><div class="hd-name">${name}</div><div class="hd-name-sub">${it.nameEn}</div></td>
        <td>${it.volume}</td>
        <td style="text-align:right">$${it.unitPrice.toFixed(2)}</td>
        <td style="text-align:center;font-weight:600">${it.qty}</td>
        <td style="text-align:right;font-weight:600">$${it.subtotal.toFixed(2)}</td>
      </tr>`;
    });

    html += `</tbody>
      <tfoot><tr class="ht-total">
        <td colspan="4" style="text-align:right">${L('qtTotal')}</td>
        <td style="text-align:center">${r.totalQty}</td>
        <td style="text-align:right;font-size:15px">$${r.totalUsd.toFixed(2)}</td>
      </tr></tfoot>
    </table>`;

    body.innerHTML = html;

    document.getElementById('histBackToList').addEventListener('click', () => {
      renderHistoryList();
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
