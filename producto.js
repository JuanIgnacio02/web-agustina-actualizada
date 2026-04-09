document.addEventListener("DOMContentLoaded", () => {
  const data = localStorage.getItem("productoSeleccionado");

  const nameEl = document.getElementById("productName");
  const priceEl = document.getElementById("productPrice");
  const waEl = document.getElementById("productWhatsApp");
  const crumbsEl = document.getElementById("productCrumbs");
  const emptyEl = document.getElementById("productEmpty");
  const pillCat = document.getElementById("pillCat");
  const pillSub = document.getElementById("pillSub");
  const galleryEl = document.getElementById("productGallery");
  const mainImgEl = document.getElementById("productImage");

  if (!data) {
    emptyEl.hidden = false;
    document.querySelector(".product__layout").style.display = "none";
    return;
  }

  let product;
  try {
    product = JSON.parse(data);
  } catch (e) {
    emptyEl.hidden = false;
    document.querySelector(".product__layout").style.display = "none";
    return;
  }

  const name = product?.name || "Producto";
  const price = Number(product?.price || 0);
  const image = product?.image || "";
  const images = product?.images?.length ? product.images : [image];
  const cat = product?.cat || "";
  const sub = product?.sub || "";

  nameEl.textContent = name;
  priceEl.textContent = "$" + price.toLocaleString("es-AR");

  mainImgEl.src = images[0];
  mainImgEl.alt = name;

  if (images.length > 1 && galleryEl) {
    galleryEl.innerHTML = images.map((url, i) => `
      <img src="${url}" 
           class="gallery__thumb${i === 0 ? " active" : ""}" 
           alt="${name} ${i + 1}"
           onclick="selectImg(this, '${url}')" />
    `).join("");
    galleryEl.style.display = "flex";
  }

  const catLabel = prettify(cat);
  const subLabel = prettify(sub);

  if (catLabel) { pillCat.hidden = false; pillCat.textContent = catLabel; }
  if (subLabel && subLabel !== catLabel) { pillSub.hidden = false; pillSub.textContent = subLabel; }

  crumbsEl.textContent = `Catálogo${catLabel ? " / " + catLabel : ""}${subLabel ? " / " + subLabel : ""}`;

  const msg = `Hola! 👋 Quiero consultar por: ${name}. ¿Está disponible?`;
  waEl.href = `https://wa.me/5492604002520?text=${encodeURIComponent(msg)}`;

  mainImgEl.addEventListener("error", () => {
    mainImgEl.style.display = "none";
    const wrap = document.querySelector(".product__imgwrap");
    if (wrap) {
      wrap.classList.add("is-error");
      wrap.innerHTML = `<div class="product__imgfallback"><div class="product__imgicon">🖼️</div><div><strong>No se pudo cargar la imagen</strong></div></div>`;
    }
  });

  function prettify(str) {
    if (!str) return "";
    return String(str).replace(/-/g, " ").replace(/\b\w/g, m => m.toUpperCase());
  }
});

function selectImg(thumb, url) {
  document.getElementById("productImage").src = url;
  document.querySelectorAll(".gallery__thumb").forEach(t => t.classList.remove("active"));
  thumb.classList.add("active");
}
