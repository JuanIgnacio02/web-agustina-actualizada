const SUPABASE_URL = "https://srqkahdyboqannrmkqmf.supabase.co";
const SUPABASE_KEY = "sb_publishable_C25BY4_efIwhRHoBqzYvgQ_MqMGmrI7";

document.addEventListener("DOMContentLoaded", async () => {

  const img        = document.getElementById("productImage");
  const nameEl     = document.getElementById("productName");
  const priceEl    = document.getElementById("productPrice");
  const waEl       = document.getElementById("productWhatsApp");
  const crumbsEl   = document.getElementById("productCrumbs");
  const emptyEl    = document.getElementById("productEmpty");
  const pillCat    = document.getElementById("pillCat");
  const pillSub    = document.getElementById("pillSub");
  const descCard   = document.getElementById("productDescCard");
  const descEl     = document.getElementById("productDesc");

  // Leer el ID de la URL (?id=123)
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  if (!id) {
    showEmpty();
    return;
  }

  // Buscar el producto en Supabase
  let product;
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/productos?id=eq.${id}&limit=1`,
      {
        headers: {
          "apikey": SUPABASE_KEY,
          "Authorization": `Bearer ${SUPABASE_KEY}`
        }
      }
    );
    const data = await res.json();
    product = data[0];
  } catch (e) {
    showEmpty();
    return;
  }

  if (!product) {
    showEmpty();
    return;
  }

  const name        = product.name        || "Producto";
  const price       = Number(product.price || 0);
  const image       = product.image_url   || "";
  const cat         = product.cat         || "";
  const sub         = product.sub         || "";
  const description = product.description || "";

  // Título de la pestaña
  document.title = `${name} • AGUSTINA`;

  nameEl.textContent  = name;
  priceEl.textContent = "$" + price.toLocaleString("es-AR");

  img.src = image;
  img.alt = name;

  // Pills + crumbs
  const catLabel = prettify(cat);
  const subLabel = prettify(sub);

  if (catLabel) { pillCat.hidden = false; pillCat.textContent = catLabel; }
  if (subLabel && subLabel !== catLabel) { pillSub.hidden = false; pillSub.textContent = subLabel; }

  crumbsEl.textContent = `Catálogo${catLabel ? " / " + catLabel : ""}${subLabel ? " / " + subLabel : ""}`;

  // Descripción
  if (description && descCard && descEl) {
    descEl.textContent = description;
    descCard.hidden = false;
  }

  // WhatsApp
  const msg = `Hola! 👋 Quiero consultar por: ${name}. ¿Está disponible?`;
  waEl.href = `https://wa.me/5492604002520?text=${encodeURIComponent(msg)}`;

  // Error de imagen
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

  function showEmpty() {
    emptyEl.hidden = false;
    const layout = document.querySelector(".product__layout");
    if (layout) layout.style.display = "none";
  }

  function prettify(str) {
    if (!str) return "";
    return String(str)
      .replace(/-/g, " ")
      .replace(/\b\w/g, (m) => m.toUpperCase());
  }
});
