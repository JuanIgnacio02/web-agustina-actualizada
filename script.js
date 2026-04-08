document.addEventListener("DOMContentLoaded", async () => {

  // =========================
  // 0) Supabase config
  // =========================
  const SUPABASE_URL = "https://srqkahdyboqannrmkqmf.supabase.co";
  const SUPABASE_KEY = "sb_publishable_C25BY4_efIwhRHoBqzYvgQ_MqMGmrI7";

  async function fetchProducts() {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/productos?activo=eq.true&order=created_at.desc`, {
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`
      }
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.map(p => ({
      id: p.id,
      name: p.name,
      price: p.price,
      image: p.image_url,
      cat: p.cat,
      sub: p.sub,
      description: p.description || "",
      created_at: p.created_at || ""
    }));
  }

  // =========================
  // 0) Data
  // =========================
  let products = [];

  // =========================
  // 1) DOM
  // =========================
  const grid = document.getElementById("product-grid");
  const sectionTitle = document.getElementById("section-title");
  const yearEl = document.getElementById("year");
  const chips = document.querySelector(".catalogo__chips");

  const chipGroup = document.querySelector(".chip-group");

if (chipGroup) {
  const parentChip = chipGroup.querySelector(".chip-parent");
  const subMenu    = chipGroup.querySelector(".chip-sub");

  // Abrir/cerrar al hacer click en "Indumentaria"
  if (parentChip) {
    parentChip.addEventListener("click", () => {
      chipGroup.classList.toggle("open");
    });
  }

  // Cerrar cuando se elige una subcategoría
  if (subMenu) {
    subMenu.addEventListener("click", () => {
      chipGroup.classList.remove("open");
    });
  }

  // Cerrar si se hace click en cualquier otro lado
  document.addEventListener("click", (e) => {
    if (!chipGroup.contains(e.target)) {
      chipGroup.classList.remove("open");
    }
  });
}
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // =========================
  // Header dinámico
  // =========================
  const header = document.querySelector(".header");

  function setHeaderHeightVar() {
    if (!header) return;
    document.documentElement.style.setProperty("--headerH", header.offsetHeight + "px");
  }

  function onScrollHeader() {
    if (!header) return;
    header.classList.toggle("header--compact", window.scrollY > 10);
    setHeaderHeightVar();
  }

  setHeaderHeightVar();
  window.addEventListener("resize", setHeaderHeightVar);
  window.addEventListener("scroll", onScrollHeader, { passive: true });
  onScrollHeader();

  if (!grid) {
    console.error("No existe #product-grid en el HTML");
    return;
  }

  // =========================
  // Scroll reveal cards
  // =========================
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  function observeCards() {
    document.querySelectorAll(".card").forEach((card) => {
      card.classList.remove("is-visible");
      observer.observe(card);
    });
  }

  // =========================
  // Render productos
  // =========================
  function renderProducts(filter = { type: "all", value: "all" }) {

    let list = products;

    if (filter.type === "cat") list = products.filter((p) => p.cat === filter.value);
    if (filter.type === "sub") list = products.filter((p) => p.sub === filter.value);

    if (list.length === 0) {
      grid.innerHTML = `<p style="grid-column:1/-1; text-align:center; padding:3rem 1rem; color:#aaa; font-size:15px;">
        Todavía no hay productos en esta categoría 🌸
      </p>`;
      return;
    }

    grid.innerHTML = list.map(p => {
      const isNew = p.created_at
        ? (Date.now() - new Date(p.created_at).getTime()) < 14 * 24 * 60 * 60 * 1000
        : false;
      const catLabel = (p.cat || "").replace(/-/g, " ").replace(/\b\w/g, m => m.toUpperCase());
      return `
      <article class="card product-link"
        data-id="${p.id}"
        data-name="${p.name}"
        data-image="${p.image}"
        data-price="${p.price}"
        data-cat="${p.cat}"
        data-sub="${p.sub}"
        data-description="${(p.description || "").replace(/"/g, '&quot;')}">

        <div class="card__media">
          ${isNew ? '<span class="card__badge">NUEVO</span>' : ''}
          <img src="${p.image}" class="card__img" alt="${p.name}">
        </div>

        <div class="card__info">
          ${catLabel ? `<span class="card__cat">${catLabel}</span>` : ''}
          <h3 class="card__title">${p.name}</h3>
          <p class="card__price">$${p.price.toLocaleString("es-AR")}</p>
        </div>

      </article>`;
    }).join("");

    observeCards();
  }

  // =========================
  // Chips filtros
  // =========================
  if (chips) {

    chips.addEventListener("click", (e) => {

      const btn = e.target.closest("[data-filter]");
      if (!btn) return;

      const type = btn.dataset.filter;
      const value = btn.dataset.value;

      if (sectionTitle) {
        sectionTitle.textContent =
          type === "all"
            ? "Todo"
            : btn.textContent.trim();
      }

      grid.classList.add("is-animating");

      setTimeout(() => {

        renderProducts({ type, value });

        requestAnimationFrame(() => {
          grid.classList.remove("is-animating");
        });

      }, 140);

      chips.querySelectorAll(".chip").forEach(c =>
        c.classList.remove("is-active")
      );

      btn.classList.add("is-active");

      document.querySelector("#catalogo")?.scrollIntoView({
        behavior: "smooth"
      });

    });

  }

  // =========================
  // Init
  // =========================
  grid.innerHTML = `<p style="grid-column:1/-1;text-align:center;padding:2rem;color:#999">Cargando productos...</p>`;
  products = await fetchProducts();
  renderProducts({ type: "all", value: "all" });

// =========================
// Abrir página de producto (SOLO en el grid)
// =========================
grid.addEventListener("click", (e) => {

  // si clickeó el botón de WhatsApp no abrir detalle
  if (e.target.closest(".card__cta")) return;

  const card = e.target.closest(".product-link");
  if (!card) return;

  window.location.href = `producto.html?id=${card.dataset.id}`;
});
  
});