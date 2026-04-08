document.addEventListener("DOMContentLoaded", () => {
  const data = localStorage.getItem("productoSeleccionado");

  const img = document.getElementById("productImage");
  const nameEl = document.getElementById("productName");
  const priceEl = document.getElementById("productPrice");
  const waEl = document.getElementById("productWhatsApp");
  const crumbsEl = document.getElementById("productCrumbs");
  const emptyEl = document.getElementById("productEmpty");

  const pillCat = document.getElementById("pillCat");
  const pillSub = document.getElementById("pillSub");

  if (!data) {
    emptyEl.hidden = false;
    // escondemos el layout “normal”
    img.closest(".product__layout").style.display = "none";
    return;
  }

  let product;
  try {
    product = JSON.parse(data);
  } catch (e) {
    emptyEl.hidden = false;
    img.closest(".product__layout").style.display = "none";
    return;
  }

  const name        = product?.name        || "Producto";
  const price       = Number(product?.price || 0);
  const image       = product?.image       || "";
  const cat         = product?.cat         || "";
  const sub         = product?.sub         || "";
  const description = product?.description || "";

  nameEl.textContent = name;
  priceEl.textContent = "$" + price.toLocaleString("es-AR");

  // Imagen
  img.src = image;
  img.alt = name;

  // Pills + crumbs
  const catLabel = prettify(cat);
  const subLabel = prettify(sub);

  if (catLabel) {
    pillCat.hidden = false;
    pillCat.textContent = catLabel;
  }
  if (subLabel && subLabel !== catLabel) {
    pillSub.hidden = false;
    pillSub.textContent = subLabel;
  }

  crumbsEl.textContent = `Catálogo${catLabel ? " / " + catLabel : ""}${subLabel ? " / " + subLabel : ""}`;

  // Descripción
  const descCard = document.getElementById("productDescCard");
  const descEl   = document.getElementById("productDesc");
  if (description && descCard && descEl) {
    descEl.textContent = description;
    descCard.hidden = false;
  }

  // WhatsApp link (mensaje más lindo)
  const msg = `Hola! 👋 Quiero consultar por: ${name}. ¿Está disponible?`;
  waEl.href = `https://wa.me/5492604002520?text=${encodeURIComponent(msg)}`;

  // Si la imagen falla, mostramos un placeholder prolijo
  img.addEventListener("error", () => {
    img.style.display = "none";
    const wrap = document.querySelector(".product__imgwrap");
    wrap.classList.add("is-error");
    wrap.innerHTML = `
      <div class="product__imgfallback">
        <div class="product__imgicon">🖼️</div>
        <div>
          <strong>No se pudo cargar la imagen</strong>
          <div class="muted">Revisá el nombre/ubicación en assets.</div>
        </div>
      </div>
    `;
  });

  function prettify(str) {
    if (!str) return "";
    return String(str)
      .replace(/-/g, " ")
      .replace(/\b\w/g, (m) => m.toUpperCase());
  }
});