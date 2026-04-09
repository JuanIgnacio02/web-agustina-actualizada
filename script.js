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
  const grid        = document.getElementById("product-grid");
  const sectionTitle = document.getElementById("section-title");
  const yearEl      = document.getElementById("year");
  const chips       = document.getElementById("catalogoChips");
  const chipGroup   = document.querySelector(".chip-group");
  const header      = document.querySelector(".header");
  const filterBurger = document.getElementById("filterBurger");
  const filterBurgerActive = document.getElementById("filterBurgerActive");

  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ── Botón hamburguesa de filtros (mobile) ───────────
  function isMobile() { return window.innerWidth <= 768; }

  if (filterBurger) {
    filterBurger.addEventListener("click", (e) => {
      e.stopPropagation();
      const isOpen = chips.classList.toggle("is-open");
      filterBurger.setAttribute("aria-expanded", isOpen);
    });

    // Cerrar al tocar fuera
    document.addEventListener("click", (e) => {
      if (isMobile() && chips && !chips.contains(e.target) && !filterBurger.contains(e.target)) {
        chips.classList.remove("is-open");
        filterBurger.setAttribute("aria-expanded", "false");
      }
    });
  }

  function closeBurgerMenu() {
    if (chips) chips.classList.remove("is-open");
    if (filterBurger) filterBurger.setAttribute("aria-expanded", "false");
  }

  // ── Submenú Indumentaria (click) ────────────────────
  if (chipGroup) {
    const parentChip = chipGroup.querySelector(".chip-parent");
    const subMenu    = chipGroup.querySelector(".chip-sub");

    if (parentChip) {
      parentChip.addEventListener("click", () => chipGroup.classList.toggle("open"));
    }
    if (subMenu) {
      subMenu.addEventListener("click", () => chipGroup.classList.remove("open"));
    }
    document.addEventListener("click", (e) => {
      if (!chipGroup.contains(e.target) && !isMobile()) chipGroup.classList.remove("open");
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

      return `
        <article class="card product-link"
          data-id="${p.id}"
          data-images="${encodeURIComponent(JSON.stringify(allImgs))}">
          <div class="card__media">
            ${isNew ? '<span class="card__badge">NUEVO</span>' : ""}
            <img src="${allImgs[0] || ""}" class="card__img" alt="${p.name}">
            ${dots}
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

  // ── Chips filtros ───────────────────────────────────
  if (chips) {
    chips.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-filter]");
      if (!btn) return;

      const type  = btn.dataset.filter;
      const value = btn.dataset.value;

      const label = type === "all" ? "Todo" : btn.textContent.trim().replace("▾", "").trim();

      if (sectionTitle) sectionTitle.textContent = label;

      // Actualizar label del botón hamburguesa en mobile
      if (filterBurgerActive) {
        filterBurgerActive.textContent = type === "all" ? "" : label;
      }

      // Cerrar el panel en mobile
      if (isMobile()) {
        setTimeout(() => closeBurgerMenu(), 180);
      }

      grid.classList.add("is-animating");
      setTimeout(() => {
        renderProducts({ type, value });
        requestAnimationFrame(() => grid.classList.remove("is-animating"));
      }, 140);

      chips.querySelectorAll(".chip").forEach(c => c.classList.remove("is-active"));
      btn.classList.add("is-active");
      document.querySelector("#catalogo")?.scrollIntoView({ behavior: "smooth" });
    });
  }

  // ── Click en card → página de producto ─────────────
  grid.addEventListener("click", (e) => {
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
    // Limpiar la URL para que no persista al refrescar
    history.replaceState(null, '', window.location.pathname);
    renderProducts({ type: "cat", value: urlCat });
    chips?.querySelectorAll(".chip").forEach(c => {
      c.classList.toggle("is-active", c.dataset.value === urlCat);
    });
    if (sectionTitle) {
      const matchChip = chips?.querySelector(`[data-value="${urlCat}"]`);
      if (matchChip) sectionTitle.textContent = matchChip.textContent.trim();
    }
    document.querySelector("#catalogo")?.scrollIntoView({ behavior: "smooth" });
  } else {
    renderProducts({ type: "all", value: "all" });
  }

});
