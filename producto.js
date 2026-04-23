const API_URL = "https://api-agustina.juaniperez1243.workers.dev";

function cloudinaryUrl(url, w = 1200) {
  if (!url || !url.includes("cloudinary.com")) return url;
  return url.replace("/upload/", `/upload/f_auto,q_auto,w_${w}/`);
}

document.addEventListener("DOMContentLoaded", async () => {

  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  if (!id) { showEmpty(); return; }

  let product;
  try {
    const res = await fetch(`${API_URL}/producto?id=${id}`);
    const data = await res.json();
    product = data;
  } catch (e) { showEmpty(); return; }

  if (!product) { showEmpty(); return; }

  const name           = product.name           || "Producto";
  const price          = Number(product.price   || 0);
  const precioEfectivo = Number(product.precio_efectivo || 0);
  const image          = product.image_url      || "";
  const cat            = product.cat            || "";
  const sub            = product.sub            || "";
  const description    = product.descripcion    || "";
  const images         = (product.images && product.images.length) ? product.images : [image].filter(Boolean);

  // Título pestaña
  document.title = `${name} • AGUSTINA`;

  // Imagen
  const imgEl = document.getElementById("prdImage");
  imgEl.src = cloudinaryUrl(image);
  imgEl.alt = name;

  // Nombre y precio
  document.getElementById("prdName").textContent  = name;
  document.getElementById("prdPrice").textContent = "$" + price.toLocaleString("es-AR");

  // Precio efectivo (opcional)
  if (precioEfectivo > 0 && cat !== "giftcards") {
    document.getElementById("prdPriceEfectivo").style.display = "block";
    document.getElementById("prdPriceEfectivoVal").textContent = "$" + precioEfectivo.toLocaleString("es-AR");
  }

  // Breadcrumbs
  const catLabel = prettify(cat);
  const subLabel = prettify(sub);
  document.getElementById("prdCrumbs").textContent =
    `Catálogo${catLabel ? " / " + catLabel : ""}${subLabel ? " / " + subLabel : ""}`;

  // Pills
  const pillsEl = document.getElementById("prdPills");
  if (catLabel) pillsEl.innerHTML += `<span class="prd-pill">${catLabel}</span>`;
  if (subLabel && subLabel !== catLabel) pillsEl.innerHTML += `<span class="prd-pill">${subLabel}</span>`;

  // Descripción
  if (description) {
    const descEl = document.getElementById("prdDesc");
    descEl.textContent = description;
    descEl.style.display = "block";
  }

  // ── Gift card: mostrar selector de monto si la categoría es giftcards ──
  const isGiftCard = cat === "giftcards";
  let gcSelectedAmount = 0;

  if (isGiftCard) {
    // Mostrar bloque y ocultar precio fijo
    document.getElementById("gcAmount").hidden = false;
    document.getElementById("prdPrice").style.display = "none";

    const presets = document.querySelectorAll(".gc-preset");
    const gcInput = document.getElementById("gcInput");

    // Click en preset
    presets.forEach(btn => {
      btn.addEventListener("click", () => {
        presets.forEach(b => b.classList.remove("selected"));
        btn.classList.add("selected");
        gcSelectedAmount = Number(btn.dataset.val);
        gcInput.value = "";
        updatePriceDisplay(gcSelectedAmount);
      });
    });

    // Escritura libre
    gcInput.addEventListener("input", () => {
      presets.forEach(b => b.classList.remove("selected"));
      const v = Number(gcInput.value);
      gcSelectedAmount = v > 0 ? v : 0;
      updatePriceDisplay(gcSelectedAmount);
    });

    function updatePriceDisplay(amount) {
      const priceEl = document.getElementById("prdPrice");
      if (amount > 0) {
        priceEl.textContent = "$" + amount.toLocaleString("es-AR");
        priceEl.style.display = "block";
      } else {
        priceEl.style.display = "none";
      }
    }
  }

  // ── WhatsApp directo (solo este producto) ──
  function buildWAMsg() {
    if (isGiftCard && gcSelectedAmount > 0) {
      return `Hola Agustina! 👋 Quiero una *Gift Card por $${gcSelectedAmount.toLocaleString("es-AR")}*. ¿Cómo la gestiono?`;
    }
    return `Hola Agustina! 👋 Quiero consultar por: *${name}*. ¿Está disponible?`;
  }

  const waBtn = document.getElementById("prdWA");
  waBtn.href = `https://wa.me/5492604009647?text=${encodeURIComponent(buildWAMsg())}`;
  // Actualizar link WA cuando cambia el monto
  if (isGiftCard) {
    document.getElementById("gcAmount").addEventListener("input", () => {
      waBtn.href = `https://wa.me/5492604009647?text=${encodeURIComponent(buildWAMsg())}`;
    });
    document.querySelectorAll(".gc-preset").forEach(btn => {
      btn.addEventListener("click", () => {
        waBtn.href = `https://wa.me/5492604009647?text=${encodeURIComponent(buildWAMsg())}`;
      });
    });
  }

  // ── Botón "Agregar al carrito" ──
  const cartBtn = document.getElementById("prdCartBtn");
  if (cartBtn) {
    cartBtn.addEventListener("click", () => {
      // Validar monto si es gift card
      if (isGiftCard && gcSelectedAmount <= 0) {
        const gcInput = document.getElementById("gcInput");
        gcInput.focus();
        gcInput.style.outline = "2px solid #c06080";
        setTimeout(() => gcInput.style.outline = "", 1500);
        return;
      }

      if (typeof cartAdd === "function") {
        const finalPrice = isGiftCard ? gcSelectedAmount : price;
        const finalName  = isGiftCard
          ? `${name} — $${gcSelectedAmount.toLocaleString("es-AR")}`
          : name;

        cartAdd({ id: String(product.id) + (isGiftCard ? `-${gcSelectedAmount}` : ""), name: finalName, price: finalPrice, precio_efectivo: isGiftCard ? 0 : precioEfectivo, image: images[0] || image, cat });

        cartBtn.classList.add("added");
        cartBtn.innerHTML = `
          <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 10 8 14 16 6"/></svg>
          Agregado al carrito`;
        setTimeout(() => {
          cartBtn.classList.remove("added");
          cartBtn.innerHTML = `
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 01-8 0"/>
            </svg>
            Agregar al carrito`;
        }, 2000);
      }
    });
  }

  // ── Galería: thumbnails (desktop) + dots + swipe (mobile) ──────────────
  const thumbsEl = document.getElementById("prdThumbs");
  const dotsEl   = document.getElementById("prdDots");

  if (images.length > 1) {
    let currentIdx = 0;

    function goToImage(idx) {
      currentIdx = idx;
      imgEl.style.opacity = "0";
      setTimeout(() => {
        imgEl.src = cloudinaryUrl(images[idx]);
        imgEl.style.opacity = "1";
      }, 180);
      thumbsEl.querySelectorAll(".prd-thumb").forEach((t, i) => t.classList.toggle("active", i === idx));
      dotsEl.querySelectorAll(".prd-dot").forEach((d, i)   => d.classList.toggle("active", i === idx));
    }

    // Thumbnails
    images.forEach((url, i) => {
      const thumb = document.createElement("img");
      thumb.src = cloudinaryUrl(url, 300);
      thumb.className = "prd-thumb" + (i === 0 ? " active" : "");
      thumb.addEventListener("click", () => goToImage(i));
      thumbsEl.appendChild(thumb);
    });

    // Dots
    images.forEach((_, i) => {
      const dot = document.createElement("span");
      dot.className = "prd-dot" + (i === 0 ? " active" : "");
      dot.addEventListener("click", () => goToImage(i));
      dotsEl.appendChild(dot);
    });

    // Swipe táctil
    const wrap = imgEl.closest(".prd-imgwrap");
    let tx = 0, ty = 0;
    wrap.addEventListener("touchstart", e => {
      tx = e.touches[0].clientX;
      ty = e.touches[0].clientY;
    }, { passive: true });
    wrap.addEventListener("touchend", e => {
      const dx = e.changedTouches[0].clientX - tx;
      const dy = e.changedTouches[0].clientY - ty;
      if (Math.abs(dx) < 40 || Math.abs(dy) > Math.abs(dx) * 0.8) return;
      goToImage(dx < 0
        ? (currentIdx < images.length - 1 ? currentIdx + 1 : 0)
        : (currentIdx > 0 ? currentIdx - 1 : images.length - 1)
      );
    }, { passive: true });
  }

  // Error imagen
  imgEl.addEventListener("error", () => {
    imgEl.closest(".prd-imgwrap").style.minHeight = "200px";
  });

  // ── Productos recomendados ──────────────────────────────────────────────
  loadRecommended(id, cat);

  function showEmpty() {
    document.getElementById("prdEmpty").hidden  = false;
    document.getElementById("prdLayout").hidden = true;
  }

  function prettify(str) {
    if (!str) return "";
    return str.replace(/-/g, " ").replace(/\b\w/g, m => m.toUpperCase());
  }
});

async function loadRecommended(currentId, cat) {
  try {
    const res = await fetch(`${API_URL}/productos`);
    const all = await res.json();

    const shuffle = arr => arr.sort(() => Math.random() - .5);
    const pool    = shuffle(all.filter(p => String(p.id) !== String(currentId) && p.cat === cat)).slice(0, 6);

    if (pool.length === 0) return;

    const recGrid    = document.getElementById("recGrid");
    const recSection = document.getElementById("recSection");
    recGrid.innerHTML = pool.map(buildRecCard).join("");
    recSection.hidden = false;

    attachRecBehavior(recGrid);
  } catch (e) { /* falla silenciosa */ }
}

function buildRecCard(p) {
  const allImgs   = (p.images && p.images.length) ? p.images : [p.image_url].filter(Boolean);
  const isNew     = p.created_at
    ? (Date.now() - new Date(p.created_at).getTime()) < 14 * 24 * 60 * 60 * 1000
    : false;
  const catLabel  = (p.cat || "").replace(/-/g, " ").replace(/\b\w/g, m => m.toUpperCase());
  const hasSecond = allImgs.length > 1;
  const lines     = allImgs.length >= 3
    ? `<div class="card__lines">${allImgs.map((_, i) =>
        `<span class="card__line${i === 0 ? " is-active" : ""}"></span>`).join("")}</div>`
    : "";
  const nameEncoded = encodeURIComponent(p.name);
  const imgEncoded  = encodeURIComponent(cloudinaryUrl(allImgs[0] || "", 600));

  return `
    <article class="card product-link"
      data-id="${p.id}"
      data-images="${encodeURIComponent(JSON.stringify(allImgs))}">
      <div class="card__media">
        ${isNew ? '<span class="card__badge">NUEVO</span>' : ""}
        <img src="${cloudinaryUrl(allImgs[0], 600)}" class="card__img card__img--primary" alt="${p.name}" loading="lazy">
        ${hasSecond ? `<img data-src="${cloudinaryUrl(allImgs[1], 600)}" class="card__img card__img--secondary" alt="${p.name}">` : ""}
        ${lines}
        <button class="card__add-btn"
          data-cart-id="${p.id}"
          data-cart-name="${nameEncoded}"
          data-cart-price="${p.price}"
          data-cart-efectivo="${p.precio_efectivo || 0}"
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
}

function attachRecBehavior(grid) {
  // Scroll reveal: las cards arrancan con opacity 0, necesitan clase is-visible
  const observer = new IntersectionObserver(
    entries => entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add("is-visible"); observer.unobserve(e.target); }
    }),
    { threshold: 0.12 }
  );
  grid.querySelectorAll(".card").forEach(c => observer.observe(c));

  // Navegación y carrito
  grid.addEventListener("click", e => {
    const addBtn = e.target.closest(".card__add-btn");
    if (addBtn) {
      e.stopPropagation();
      if (typeof cartAdd === "function") {
        cartAdd({
          id:              String(addBtn.dataset.cartId),
          name:            decodeURIComponent(addBtn.dataset.cartName),
          price:           Number(addBtn.dataset.cartPrice),
          precio_efectivo: Number(addBtn.dataset.cartEfectivo || 0),
          image:           decodeURIComponent(addBtn.dataset.cartImage),
          cat:             addBtn.dataset.cartCat,
        });
        const orig = addBtn.innerHTML;
        addBtn.innerHTML = `<svg viewBox="0 0 20 20" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 10 8 14 16 6"/></svg>`;
        setTimeout(() => { addBtn.innerHTML = orig; }, 1500);
      }
      return;
    }
    const card = e.target.closest(".product-link");
    if (card) window.location.href = `producto.html?id=${card.dataset.id}`;
  });

  // Ciclo de imágenes en hover (solo dispositivos con mouse real)
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  grid.querySelectorAll(".product-link").forEach(card => {
    const allImgs   = JSON.parse(decodeURIComponent(card.dataset.images || "[]"));
    const secondary = card.querySelector(".card__img--secondary");
    if (allImgs.length < 2 || !secondary) return;

    if (allImgs.length === 2) {
      card.addEventListener("mouseenter", function loadSec() {
        if (!secondary.src) secondary.src = secondary.dataset.src || cloudinaryUrl(allImgs[1], 600);
        card.removeEventListener("mouseenter", loadSec);
      });
      return;
    }

    const lines = card.querySelectorAll(".card__line");
    let timer = null, idx = 1;
    function showImg(i) {
      idx = i;
      secondary.style.opacity = "0";
      setTimeout(() => { secondary.src = cloudinaryUrl(allImgs[idx], 600); secondary.style.opacity = "1"; }, 100);
      lines.forEach((l, j) => l.classList.toggle("is-active", j === idx));
    }
    card.addEventListener("mouseenter", () => {
      idx = 1; secondary.src = cloudinaryUrl(allImgs[1], 600);
      clearInterval(timer);
      timer = setInterval(() => showImg(idx + 1 >= allImgs.length ? 1 : idx + 1), 900);
    });
    card.addEventListener("mouseleave", () => {
      clearInterval(timer); timer = null;
      lines.forEach((l, j) => l.classList.toggle("is-active", j === 0));
    });
  });
}
