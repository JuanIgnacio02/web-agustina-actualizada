document.addEventListener("DOMContentLoaded", async () => {

  const SUPABASE_URL = "https://srqkahdyboqannrmkqmf.supabase.co";
  const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNycWthaGR5Ym9xYW5ucm1rcW1mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2MzE5NzYsImV4cCI6MjA5MTIwNzk3Nn0.AhedlrcW9bD_8JF2PvEvIaFsgJDF9ooCy9YdwULEMjk";

  // ── Fetch productos ─────────────────────────────────
  async function fetchProducts() {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/productos?activo=eq.true&order=created_at.desc`,
      { headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` } }
    );
    if (!res.ok) return [];
    return await res.json();
  }

  // ── DOM refs ────────────────────────────────────────
  const grid             = document.getElementById("product-grid");
  const sectionTitle     = document.getElementById("section-title");
  const yearEl           = document.getElementById("year");
  const chips            = document.getElementById("catalogoChips");
  const chipGroup        = document.querySelector(".chip-group");
  const header           = document.querySelector(".header");
  const filterBurger     = document.getElementById("filterBurger");
  const filterBurgerBadge = document.getElementById("filterBurgerActive");
  const filterBackdrop   = document.getElementById("filterBackdrop");
  const mSheet           = document.getElementById("mSheet");
  const mSheetClose      = document.getElementById("mSheetClose");
  const mSheetList       = document.getElementById("mSheetList");

  if (yearEl) yearEl.textContent = new Date().getFullYear();

  function isMobile() { return window.innerWidth <= 768; }

  // ── Construir lista del bottom sheet desde los chips ─
  let activeFilter = { type: "all", value: "all" };

  function buildSheetList() {
    if (!mSheetList || !chips) return;
    mSheetList.innerHTML = "";

    chips.querySelectorAll("[data-filter]").forEach((btn, i) => {
      // Separador visual antes del primer subchip de Indumentaria
      if (btn.closest(".chip-sub") && i === 0) return; // lo manejamos abajo

      const item = document.createElement("button");
      item.className = "m-sheet-item";
      item.dataset.filter = btn.dataset.filter;
      item.dataset.value  = btn.dataset.value;

      const isSubItem = !!btn.closest(".chip-sub");
      const label = btn.textContent.replace("▾","").trim();
      item.innerHTML = `
        <span style="${isSubItem ? "padding-left:14px;color:#666;font-size:14px;" : ""}">${label}</span>
        <span class="m-sheet-item__check"></span>
      `;

      if (btn.dataset.value === activeFilter.value) {
        item.classList.add("is-active");
      }

      item.addEventListener("click", () => {
        const type  = item.dataset.filter;
        const value = item.dataset.value;
        applyFilter(type, value, label);
        setTimeout(() => closeSheet(), 180);
      });

      mSheetList.appendChild(item);

      // Si es el grupo Indumentaria, añadir sus sub-items inmediatamente
      if (btn.classList.contains("chip-parent")) {
        const divider = document.createElement("div");
        divider.className = "m-sheet-divider";
        // mSheetList.appendChild(divider); // solo si hay subcats
        btn.closest(".chip-group")?.querySelectorAll(".chip-sub .chip").forEach(sub => {
          const subItem = document.createElement("button");
          subItem.className = "m-sheet-item";
          subItem.dataset.filter = sub.dataset.filter;
          subItem.dataset.value  = sub.dataset.value;
          const subLabel = sub.textContent.trim();
          subItem.innerHTML = `
            <span style="padding-left:18px;color:#888;font-size:14px;">${subLabel}</span>
            <span class="m-sheet-item__check"></span>
          `;
          if (sub.dataset.value === activeFilter.value) subItem.classList.add("is-active");
          subItem.addEventListener("click", () => {
            applyFilter(sub.dataset.filter, sub.dataset.value, subLabel);
            setTimeout(() => closeSheet(), 180);
          });
          mSheetList.appendChild(subItem);
        });
        mSheetList.appendChild(divider);
      }
    });
  }

  function applyFilter(type, value, label) {
    activeFilter = { type, value };
    const displayLabel = type === "all" ? "Todo" : label;

    if (sectionTitle) sectionTitle.textContent = displayLabel;
    if (filterBurgerBadge) {
      filterBurgerBadge.textContent = type === "all" ? "" : displayLabel;
    }

    // Sync chips desktop
    if (chips) {
      chips.querySelectorAll(".chip").forEach(c =>
        c.classList.toggle("is-active", c.dataset.value === value)
      );
    }

    grid.classList.add("is-animating");
    setTimeout(() => {
      renderProducts({ type, value });
      requestAnimationFrame(() => grid.classList.remove("is-animating"));
    }, 140);

    document.querySelector("#catalogo")?.scrollIntoView({ behavior: "smooth" });
  }

  // ── Bottom sheet open/close ─────────────────────────
  function openSheet() {
    buildSheetList();
    mSheet?.classList.add("is-open");
    mSheet?.removeAttribute("aria-hidden");
    filterBackdrop?.classList.add("is-open");
    filterBurger?.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
  }

  function closeSheet() {
    mSheet?.classList.remove("is-open");
    mSheet?.setAttribute("aria-hidden", "true");
    filterBackdrop?.classList.remove("is-open");
    filterBurger?.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  }

  if (filterBurger) {
    filterBurger.addEventListener("click", () => {
      isMobile() ? (mSheet?.classList.contains("is-open") ? closeSheet() : openSheet()) : null;
    });
  }
  mSheetClose?.addEventListener("click", closeSheet);
  filterBackdrop?.addEventListener("click", closeSheet);

  // Cerrar con swipe hacia abajo (touch)
  if (mSheet) {
    let startY = 0;
    mSheet.addEventListener("touchstart", e => { startY = e.touches[0].clientY; }, { passive: true });
    mSheet.addEventListener("touchend", e => {
      if (e.changedTouches[0].clientY - startY > 60) closeSheet();
    }, { passive: true });
  }

  // ── Submenú Indumentaria desktop (click) ────────────
  if (chipGroup) {
    const parentChip = chipGroup.querySelector(".chip-parent");
    const subMenu    = chipGroup.querySelector(".chip-sub");
    if (parentChip) parentChip.addEventListener("click", () => chipGroup.classList.toggle("open"));
    if (subMenu)    subMenu.addEventListener("click",    () => chipGroup.classList.remove("open"));
    document.addEventListener("click", (e) => {
      if (!isMobile() && !chipGroup.contains(e.target)) chipGroup.classList.remove("open");
    });
  }

  // ── Header shrink on scroll ─────────────────────────
  function setHeaderH() {
    if (!header) return;
    document.documentElement.style.setProperty("--headerH", header.offsetHeight + "px");
  }
  function onScroll() {
    if (!header) return;
    header.classList.toggle("header--compact", window.scrollY > 10);
    setHeaderH();
  }
  setHeaderH();
  window.addEventListener("resize", setHeaderH);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  if (!grid) return;

  // ── Scroll reveal ───────────────────────────────────
  const revealObserver = new IntersectionObserver(
    (entries) => entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add("is-visible"); revealObserver.unobserve(e.target); }
    }),
    { threshold: 0.12 }
  );

  function observeCards() {
    document.querySelectorAll(".card").forEach(c => {
      c.classList.remove("is-visible");
      revealObserver.observe(c);
    });
  }

  // ── Render ──────────────────────────────────────────
  let products = [];

  function renderProducts(filter = { type: "all", value: "all" }) {
    let list = products;
    if (filter.type === "cat") list = products.filter(p => p.cat === filter.value);
    if (filter.type === "sub") list = products.filter(p => p.sub === filter.value);

    if (list.length === 0) {
      grid.innerHTML = `<p style="grid-column:1/-1;text-align:center;padding:3rem 1rem;color:#aaa;font-size:15px;">
        Todavía no hay productos en esta categoría 🌸</p>`;
      return;
    }

    grid.innerHTML = list.map(p => {
      // Todas las imágenes del producto (usa array 'images' de Supabase)
      const allImgs = (p.images && p.images.length) ? p.images : [p.image_url].filter(Boolean);

      const isNew = p.created_at
        ? (Date.now() - new Date(p.created_at).getTime()) < 14 * 24 * 60 * 60 * 1000
        : false;

      const catLabel = (p.cat || "").replace(/-/g, " ").replace(/\b\w/g, m => m.toUpperCase());

      // Indicadores de imagen (solo si hay más de 1)
      const dots = allImgs.length > 1
        ? `<div class="card__dots">${allImgs.map((_, i) =>
            `<span class="card__dot${i === 0 ? " is-active" : ""}"></span>`).join("")}</div>`
        : "";

      const imgEncoded = encodeURIComponent(allImgs[0] || "");
      const nameEncoded = encodeURIComponent(p.name);

      return `
        <article class="card product-link"
          data-id="${p.id}"
          data-images="${encodeURIComponent(JSON.stringify(allImgs))}">
          <div class="card__media">
            ${isNew ? '<span class="card__badge">NUEVO</span>' : ""}
            <img src="${allImgs[0] || ""}" class="card__img" alt="${p.name}">
            ${dots}
            <button class="card__add-btn"
              data-cart-id="${p.id}"
              data-cart-name="${nameEncoded}"
              data-cart-price="${p.price}"
              data-cart-image="${imgEncoded}"
              data-cart-cat="${p.cat || ""}"
              aria-label="Agregar al carrito">
              <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <path d="M16 10a4 4 0 01-8 0"/>
              </svg>
            </button>
          </div>
          <div class="card__info">
            ${catLabel ? `<span class="card__cat">${catLabel}</span>` : ""}
            <h3 class="card__title">${p.name}</h3>
            <p class="card__price">$${p.price.toLocaleString("es-AR")}</p>
          </div>
        </article>`;
    }).join("");

    observeCards();
    attachImageCycle();
  }

  // ── Image cycling en hover ──────────────────────────
  function attachImageCycle() {
    document.querySelectorAll(".product-link").forEach(card => {
      const allImgs = JSON.parse(decodeURIComponent(card.dataset.images || "[]"));
      if (allImgs.length <= 1) return;

      const imgEl = card.querySelector(".card__img");
      const dots  = card.querySelectorAll(".card__dot");
      let timer = null;
      let idx = 0;

      function showImg(i) {
        idx = i;
        imgEl.style.opacity = "0";
        setTimeout(() => {
          imgEl.src = allImgs[idx];
          imgEl.style.opacity = "1";
        }, 120);
        dots.forEach((d, j) => d.classList.toggle("is-active", j === idx));
      }

      card.addEventListener("mouseenter", () => {
        idx = 0;
        clearInterval(timer);
        timer = setInterval(() => showImg((idx + 1) % allImgs.length), 750);
      });

      card.addEventListener("mouseleave", () => {
        clearInterval(timer);
        timer = null;
        idx = 0;
        imgEl.style.opacity = "1";
        imgEl.src = allImgs[0];
        dots.forEach((d, j) => d.classList.toggle("is-active", j === 0));
      });
    });
  }

  // ── Chips filtros (desktop) ─────────────────────────
  if (chips) {
    chips.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-filter]");
      if (!btn || isMobile()) return;
      const label = btn.textContent.trim().replace("▾", "").trim();
      applyFilter(btn.dataset.filter, btn.dataset.value, label);
    });
  }

  // ── Click en "+" → agregar al carrito ──────────────
  grid.addEventListener("click", (e) => {
    const addBtn = e.target.closest(".card__add-btn");
    if (addBtn) {
      e.stopPropagation();
      if (typeof cartAdd === "function") {
        cartAdd({
          id:    addBtn.dataset.cartId,
          name:  decodeURIComponent(addBtn.dataset.cartName),
          price: Number(addBtn.dataset.cartPrice),
          image: decodeURIComponent(addBtn.dataset.cartImage),
          cat:   addBtn.dataset.cartCat,
        });
      }
      return;
    }

    // ── Click en card → página de producto ────────────
    const card = e.target.closest(".product-link");
    if (!card) return;
    window.location.href = `producto.html?id=${card.dataset.id}`;
  });

  // ── Init ────────────────────────────────────────────
  grid.innerHTML = `<p style="grid-column:1/-1;text-align:center;padding:2rem;color:#999">Cargando...</p>`;
  products = await fetchProducts();

  // Si viene con ?cat=giftcards en la URL, filtrar directamente
  const urlCat = new URLSearchParams(window.location.search).get("cat");
  if (urlCat) {
    history.replaceState(null, '', window.location.pathname);
    const matchChip = chips?.querySelector(`[data-value="${urlCat}"]`);
    const label = matchChip ? matchChip.textContent.replace("▾","").trim() : urlCat;
    applyFilter("cat", urlCat, label);
    document.querySelector("#catalogo")?.scrollIntoView({ behavior: "smooth" });
  } else {
    renderProducts({ type: "all", value: "all" });
  }

});
