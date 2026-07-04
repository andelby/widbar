document.documentElement.classList.add("js");

const grid = document.querySelector("#widgets");
const status = document.querySelector("#status");
const search = document.querySelector("#search");
const template = document.querySelector("#widget-template");
const categoryFilters = document.querySelector("#categoryFilters");
const siteHeader = document.querySelector(".site-header");
const lightbox = document.querySelector("#imageLightbox");
const lightboxImage = lightbox?.querySelector("img");
const lightboxCaption = lightbox?.querySelector("figcaption");
const lightboxClose = lightbox?.querySelector(".image-lightbox-close");
const lightboxBackdrop = lightbox?.querySelector(".image-lightbox-backdrop");

let widgets = [];
let categories = [];
let activeCategory = "all";
let lastScrollY = window.scrollY;
let ticking = false;
let lastLightboxTrigger = null;

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const categoryLabels = {
  all: "All widgets",
  system: "System",
  media: "Media",
  utility: "Utility",
  productivity: "Productivity",
  info: "Info"
};

const revealObserver = !prefersReducedMotion && "IntersectionObserver" in window
  ? new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    }
  }, { threshold: 0.16, rootMargin: "0px 0px -8% 0px" })
  : null;

function localAsset(url) {
  const prefix = "https://andelby.github.io/winbar-showcase/";
  return typeof url === "string" && url.startsWith(prefix)
    ? url.slice(prefix.length)
    : url;
}

function prepareReveal(element) {
  if (!element) {
    return;
  }

  if (!revealObserver) {
    element.classList.add("is-visible");
    return;
  }

  element.classList.add("reveal");
  revealObserver.observe(element);
}

function prepareStaticReveals() {
  document
    .querySelectorAll([
      ".hero-copy",
      ".hero-composition",
      ".section-heading",
      ".feature-card",
      ".workflow article",
      ".showcase-section",
      ".developer-card",
      ".developer-panel",
      ".contact-card",
      ".privacy-panel"
    ].join(","))
    .forEach(prepareReveal);
}

function openImageLightbox(image) {
  if (!lightbox || !lightboxImage || !lightboxCaption || !lightboxClose) {
    return;
  }

  lastLightboxTrigger = image;
  lightboxImage.src = image.currentSrc || image.src;
  lightboxImage.alt = image.alt || "WidBar screenshot";
  lightboxCaption.textContent = image.alt || "";
  lightbox.hidden = false;
  document.body.classList.add("is-lightbox-open");
  lightboxClose.focus();
}

function closeImageLightbox() {
  if (!lightbox || !lightboxImage) {
    return;
  }

  lightbox.hidden = true;
  lightboxImage.removeAttribute("src");
  document.body.classList.remove("is-lightbox-open");
  lastLightboxTrigger?.focus?.();
  lastLightboxTrigger = null;
}

function prepareZoomableImages() {
  document
    .querySelectorAll(".hero-composition img, .feature-card > img")
    .forEach(image => {
      image.classList.add("is-zoomable");
      image.tabIndex = 0;
      image.setAttribute("role", "button");
      image.setAttribute("aria-label", `Open larger image: ${image.alt || "WidBar screenshot"}`);
      image.addEventListener("click", () => openImageLightbox(image));
      image.addEventListener("keydown", event => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openImageLightbox(image);
        }
      });
    });
}

function widgetMatches(widget, query) {
  if (activeCategory !== "all" && widget.category !== activeCategory) {
    return false;
  }

  if (!query) {
    return true;
  }

  const haystack = [
    widget.name,
    widget.summary,
    widget.description,
    widget.publisher,
    widget.category,
    ...(widget.tags || [])
  ].join(" ").toLocaleLowerCase();

  return haystack.includes(query);
}

function buildCategoryModel() {
  const known = new Map();
  for (const category of categories) {
    known.set(category.id, {
      id: category.id,
      name: category.name || categoryLabels[category.id] || category.id,
      count: 0
    });
  }

  for (const widget of widgets) {
    if (!known.has(widget.category)) {
      known.set(widget.category, {
        id: widget.category,
        name: categoryLabels[widget.category] || widget.category || "Other",
        count: 0
      });
    }

    known.get(widget.category).count += 1;
  }

  return [
    { id: "all", name: "All widgets", count: widgets.length },
    ...Array.from(known.values()).filter(category => category.count > 0)
  ];
}

function renderCategories() {
  const buttons = buildCategoryModel().map(category => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "category-button";
    button.classList.toggle("is-active", category.id === activeCategory);
    button.dataset.category = category.id;
    button.innerHTML = `
      <span>${category.name}</span>
      <span class="category-count">${category.count}</span>
    `;
    button.addEventListener("click", () => {
      activeCategory = category.id;
      render();
    });
    return button;
  });

  categoryFilters.replaceChildren(...buttons);
}

function createTag(label) {
  const chip = document.createElement("span");
  chip.textContent = label;
  return chip;
}

function createEmptyState() {
  const empty = document.createElement("div");
  empty.className = "empty-state";
  empty.textContent = "No widgets match this search yet.";
  return empty;
}

function render() {
  const query = search.value.trim().toLocaleLowerCase();
  const visible = widgets.filter(widget => widgetMatches(widget, query));

  const cards = visible.map(widget => {
    const card = template.content.firstElementChild.cloneNode(true);
    const icon = card.querySelector(".widget-icon");
    icon.src = localAsset(widget.iconUrl);
    icon.alt = `${widget.name} icon`;
    card.querySelector("h3").textContent = widget.name;
    card.querySelector(".publisher").textContent = widget.publisher || "WidBar widget";
    card.querySelector(".summary").textContent = widget.summary || "";
    card.querySelector(".description").textContent = widget.description || "";
    card.querySelector(".tags").replaceChildren(
      createTag(categoryLabels[widget.category] || widget.category || "Widget"),
      ...(widget.tags || []).slice(0, 2).map(createTag)
    );
    card.querySelector(".store-link").href =
      `https://apps.microsoft.com/detail/${String(widget.storeProductId || "").toLowerCase()}`;
    prepareReveal(card);
    return card;
  });

  grid.replaceChildren(...(cards.length ? cards : [createEmptyState()]));
  status.textContent = visible.length === 1
    ? "1 widget available"
    : `${visible.length} widgets available`;
  renderCategories();
}

fetch("catalog.json", { cache: "no-cache" })
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return response.json();
  })
  .then(catalog => {
    widgets = Array.isArray(catalog.widgets) ? catalog.widgets : [];
    categories = Array.isArray(catalog.categories) ? catalog.categories : [];
    render();
  })
  .catch(error => {
    status.textContent = "The widget catalog is temporarily unavailable.";
    grid.replaceChildren(createEmptyState());
    console.error(error);
  });

search.addEventListener("input", render);
lightboxClose?.addEventListener("click", closeImageLightbox);
lightboxBackdrop?.addEventListener("click", closeImageLightbox);
window.addEventListener("keydown", event => {
  if (event.key === "Escape" && lightbox && !lightbox.hidden) {
    closeImageLightbox();
  }
});

function updateHeaderVisibility() {
  const currentY = window.scrollY;
  const scrollingDown = currentY > lastScrollY;
  const awayFromTop = currentY > 120;

  siteHeader?.classList.toggle("is-hidden", scrollingDown && awayFromTop);
  lastScrollY = Math.max(currentY, 0);
  ticking = false;
}

window.addEventListener("scroll", () => {
  if (!ticking) {
    window.requestAnimationFrame(updateHeaderVisibility);
    ticking = true;
  }
}, { passive: true });

prepareStaticReveals();
prepareZoomableImages();
