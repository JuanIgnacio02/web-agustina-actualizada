document.addEventListener("DOMContentLoaded", async () => {

  // =========================
  // 0) Supabase config
  // =========================
  const SUPABASE_URL = "https://srqkahdyboqannrmkqmf.supabase.co";
  const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNycWthaGR5Ym9xYW5ucm1rcW1mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2MzE5NzYsImV4cCI6MjA5MTIwNzk3Nn0.AhedlrcW9bD_8JF2PvEvIaFsgJDF9ooCy9YdwULEMjk";

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
      images: p.images || [p.image_url],
      cat: p.cat,
      sub: p.sub
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

  chipGroup.addEventListener("mouseenter", () => {
    chipGroup.classList.add("open");
  });

  chipGroup.addEventListener("mouseleave", () => {
    chipGroup.classList.remove("open");
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

    grid.innerHTML = list.map(p => `
      <article class="card product-link"
      data-name="${p.name}"
      data-image="${p.image}"
      data-images="${encodeURIComponent(JSON.stringify(p.images || [p.image]))}"
      data-price="${p.price}"
      data-cat="${p.cat}"
      data-sub="${p.sub}">

  <div class="card__media">
    <span class="card__badge">NUEVO</span>
    <img src="${p.image}" class="card__img card__img--main" alt="${p.name}">
    ${p.images && p.images.length > 1 ? `<img src="${p.images[1]}" class="card__img card__img--hover" alt="${p.name}">` : ""}
  </div>

  <div class="card__info">
    <h3 class="card__title">${p.name}</h3>

    <div class="card__bottom">
      <p class="card__price">$${p.price.toLocaleString("es-AR")}</p>

      <a class="card__cta"
         href="https://wa.me/5492604002520?text=Hola!%20Quiero%20consultar%20por%20${encodeURIComponent(p.name)}"
         target="_blank">
         Consultar
      </a>
    </div>
  </div>

</article>
    `).join("");

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

  const product = {
    name: card.dataset.name,
    image: card.dataset.image,
    images: JSON.parse(decodeURIComponent(card.dataset.images || "[]")),
    price: card.dataset.price,
    cat: card.dataset.cat,
    sub: card.dataset.sub
  };

  localStorage.setItem("productoSeleccionado", JSON.stringify(product));

  window.location.href = "producto.html";
});
  
});