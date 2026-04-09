const SUPABASE_URL = "https://srqkahdyboqannrmkqmf.supabase.co";
const SUPABASE_KEY = "sb_publishable_C25BY4_efIwhRHoBqzYvgQ_MqMGmrI7";

document.addEventListener("DOMContentLoaded", async () => {

  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  if (!id) { showEmpty(); return; }

  let product;
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/productos?id=eq.${id}&limit=1`,
      { headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` } }
    );
    const data = await res.json();
    product = data[0];
  } catch (e) { showEmpty(); return; }

  if (!product) { showEmpty(); return; }

  const name        = product.name        || "Producto";
  const price       = Number(product.price || 0);
  const image       = product.image_url   || "";
  const cat         = product.cat         || "";
  const sub         = product.sub         || "";
  const description = product.description || "";
  const images      = (product.images && product.images.length) ? product.images : [image].filter(Boolean);

  // Título pestaña
  document.title = `${name} • AGUSTINA`;

  // Imagen
  const imgEl = document.getElementById("prdImage");
  imgEl.src = image;
  imgEl.alt = name;

  // Nombre y precio
  document.getElementById("prdName").textContent  = name;
  document.getElementById("prdPrice").textContent = "$" + price.toLocaleString("es-AR");

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

  // WhatsApp
  const msg = `Hola! 👋 Quiero consultar por: ${name}. ¿Está disponible?`;
  document.getElementById("prdWA").href = `https://wa.me/5492604002520?text=${encodeURIComponent(msg)}`;

  // Galería thumbnails
  const thumbsEl = document.getElementById("prdThumbs");

  if (images.length > 1) {
    images.forEach((url, i) => {
      const thumb = document.createElement("img");
      thumb.src = url;
      thumb.className = "prd-thumb" + (i === 0 ? " active" : "");
      thumb.addEventListener("click", () => {
        imgEl.src = url;
        thumbsEl.querySelectorAll(".prd-thumb").forEach(t => t.classList.remove("active"));
        thumb.classList.add("active");
      });
      thumbsEl.appendChild(thumb);
    });
  }

  // Error imagen
  imgEl.addEventListener("error", () => {
    imgEl.closest(".prd-imgwrap").style.minHeight = "200px";
  });

  function showEmpty() {
    document.getElementById("prdEmpty").hidden  = false;
    document.getElementById("prdLayout").hidden = true;
  }

  function prettify(str) {
    if (!str) return "";
    return str.replace(/-/g, " ").replace(/\b\w/g, m => m.toUpperCase());
  }
});
