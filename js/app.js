// =============================================================================
// Leonie's Groceries - Main Application Controller
// Optimized for iPad Landscape with Senior-Friendly Controls
// =============================================================================

import { initSync, saveItemQuantity, clearAllItems } from "./api.js";

// Application State
let catalogData = [];
const itemLookup = new Map(); // itemId -> item metadata
let activeItems = {}; // itemId -> { id, name, category, emoji, unit, quantity }
let selectedCategory = "ALL";

// DOM Elements
const categoryNavEl = document.getElementById("category-nav");
const catalogGridEl = document.getElementById("catalog-grid");
const totalBadgeEl = document.getElementById("total-badge");
const cartEmptyEl = document.getElementById("cart-empty");
const cartItemsEl = document.getElementById("cart-items");
const btnClearListEl = document.getElementById("btn-clear-list");
const statusPillEl = document.getElementById("status-pill");
const statusTextEl = document.getElementById("status-text");
const btnInstallAppEl = document.getElementById("btn-install-app");

// PWA Install Prompt State
let deferredInstallPrompt = null;

// Modal Elements
const clearModalEl = document.getElementById("clear-modal");
const modalCancelBtn = document.getElementById("modal-cancel");
const modalConfirmBtn = document.getElementById("modal-confirm");

/**
 * Main Initialization
 */
async function initApp() {
  try {
    // 1. Fetch grocery catalog
    const response = await fetch("data/groceries.json");
    if (!response.ok) {
      throw new Error(`Failed to load groceries.json (${response.status})`);
    }
    catalogData = await response.json();

    // Populate lookup map
    catalogData.forEach((group) => {
      group.items.forEach((item) => {
        itemLookup.set(item.id, {
          ...item,
          category: group.category
        });
      });
    });

    // 2. Render initial category navigation
    renderCategoryNav();

    // 3. Render catalog cards
    renderCatalogGrid();

    // 4. Connect to synchronization layer (Firestore or localStorage)
    initSync(handleSyncUpdate, handleStatusChange);

    // 5. Setup modal, PWA install and button listeners
    setupEventListeners();

    // 6. Register Progressive Web App Service Worker
    registerServiceWorker();
  } catch (error) {
    console.error("Initialization error:", error);
    statusTextEl.textContent = "Error loading data";
    statusPillEl.className = "status-pill offline";
  }
}

/**
 * Handles incoming data updates from cloud or local storage
 * @param {Object} updatedItemsMap
 */
function handleSyncUpdate(updatedItemsMap) {
  activeItems = updatedItemsMap || {};
  renderCatalogGrid();
  renderCartSidebar();
  renderCategoryNav(); // updates category active badges
}

/**
 * Handles status updates (synced, syncing, local, offline)
 */
function handleStatusChange(status, detail) {
  statusPillEl.className = `status-pill ${status}`;
  statusPillEl.title = detail;

  switch (status) {
    case "synced":
      statusTextEl.textContent = "🟢 Synced (Live)";
      break;
    case "syncing":
      statusTextEl.textContent = "🟡 Syncing...";
      break;
    case "error":
      statusTextEl.textContent = "🔴 Firestore Permission / Setup Error";
      break;
    case "offline":
      statusTextEl.textContent = "🔴 Cloud Offline (Saved Locally)";
      break;
    case "local":
    default:
      statusTextEl.textContent = "🔵 Local Mode";
      break;
  }
}

/**
 * Renders the top category navigation pill buttons
 */
function renderCategoryNav() {
  categoryNavEl.innerHTML = "";

  // Count active items across all
  const totalActiveCount = Object.keys(activeItems).length;

  // "All" Pill
  const allBtn = document.createElement("button");
  allBtn.className = `cat-pill ${selectedCategory === "ALL" ? "active" : ""}`;
  allBtn.innerHTML = `<span>All Groceries</span><span class="badge">${totalActiveCount}</span>`;
  allBtn.addEventListener("click", () => {
    selectedCategory = "ALL";
    renderCategoryNav();
    renderCatalogGrid();
  });
  categoryNavEl.appendChild(allBtn);

  // Individual Categories
  catalogData.forEach((group) => {
    // Count active items in this category
    const activeInCat = group.items.filter((item) => {
      const active = activeItems[item.id];
      return active && active.quantity > 0;
    }).length;

    const catBtn = document.createElement("button");
    catBtn.className = `cat-pill ${selectedCategory === group.category ? "active" : ""}`;
    catBtn.innerHTML = `
      <span>${group.icon || "🛒"} ${group.category}</span>
      ${activeInCat > 0 ? `<span class="badge">${activeInCat}</span>` : ""}
    `;

    catBtn.addEventListener("click", () => {
      selectedCategory = group.category;
      renderCategoryNav();
      renderCatalogGrid();
    });

    categoryNavEl.appendChild(catBtn);
  });
}

/**
 * Renders the catalog grid based on the active category filter
 */
function renderCatalogGrid() {
  catalogGridEl.innerHTML = "";

  // Filter items
  let displayGroups = catalogData;
  if (selectedCategory !== "ALL") {
    displayGroups = catalogData.filter((g) => g.category === selectedCategory);
  }

  displayGroups.forEach((group) => {
    group.items.forEach((item) => {
      const activeData = activeItems[item.id];
      const quantity = activeData ? activeData.quantity : 0;
      const isSelected = quantity > 0;

      const card = document.createElement("article");
      card.className = `item-card ${isSelected ? "selected" : ""}`;
      card.id = `card-${item.id}`;

      card.innerHTML = `
        <div class="card-top">
          <span class="item-emoji">${item.emoji}</span>
          <div class="item-info">
            <h2 class="item-name">${item.name}</h2>
            <span class="item-unit">${item.unit ? `(${item.unit})` : ""}</span>
          </div>
        </div>
        <div class="card-stepper">
          <button 
            type="button"
            class="btn-step btn-down" 
            aria-label="Decrease ${item.name}"
            ${quantity === 0 ? "disabled" : ""}
          >▼</button>
          <span class="qty-display">${quantity}</span>
          <button 
            type="button"
            class="btn-step btn-up" 
            aria-label="Increase ${item.name}"
          >▲</button>
        </div>
      `;

      // Button listeners
      const btnDown = card.querySelector(".btn-down");
      const btnUp = card.querySelector(".btn-up");

      btnDown.addEventListener("click", (e) => {
        e.stopPropagation();
        changeQuantity(item.id, -1);
      });

      btnUp.addEventListener("click", (e) => {
        e.stopPropagation();
        changeQuantity(item.id, 1);
      });

      catalogGridEl.appendChild(card);
    });
  });
}

/**
 * Renders the right sidebar active shopping cart
 */
function renderCartSidebar() {
  const activeIds = Object.keys(activeItems).filter(
    (id) => activeItems[id].quantity > 0
  );

  const totalItemTypes = activeIds.length;
  totalBadgeEl.textContent = totalItemTypes;

  if (totalItemTypes === 0) {
    cartEmptyEl.classList.remove("hidden");
    cartItemsEl.innerHTML = "";
    btnClearListEl.disabled = true;
    return;
  }

  cartEmptyEl.classList.add("hidden");
  cartItemsEl.innerHTML = "";
  btnClearListEl.disabled = false;

  activeIds.forEach((id) => {
    const itemData = activeItems[id];

    const row = document.createElement("div");
    row.className = "cart-row";
    row.innerHTML = `
      <div class="cart-row-left">
        <span class="cart-row-emoji">${itemData.emoji || "🛒"}</span>
        <div class="cart-row-details">
          <div class="cart-row-name">${itemData.name}</div>
          <div class="cart-row-unit">${itemData.unit ? `(${itemData.unit})` : ""}</div>
        </div>
      </div>
      <div class="cart-row-actions">
        <button class="cart-btn-mini btn-cart-down" aria-label="Decrease ${itemData.name}">▼</button>
        <span class="cart-qty-badge">${itemData.quantity}</span>
        <button class="cart-btn-mini btn-cart-up" aria-label="Increase ${itemData.name}">▲</button>
      </div>
    `;

    row.querySelector(".btn-cart-down").addEventListener("click", () => {
      changeQuantity(id, -1);
    });

    row.querySelector(".btn-cart-up").addEventListener("click", () => {
      changeQuantity(id, 1);
    });

    cartItemsEl.appendChild(row);
  });
}

/**
 * Changes item quantity and persists change
 * @param {string} itemId
 * @param {number} delta (+1 or -1)
 */
async function changeQuantity(itemId, delta) {
  const itemMeta = itemLookup.get(itemId);
  if (!itemMeta) return;

  const currentQty = activeItems[itemId] ? activeItems[itemId].quantity : 0;
  const newQty = Math.max(0, currentQty + delta);

  if (newQty === currentQty) return;

  // Immediate optimistic update
  if (newQty > 0) {
    activeItems[itemId] = {
      ...itemMeta,
      quantity: newQty
    };
  } else {
    delete activeItems[itemId];
  }

  // Update DOM directly for instant tactile speed
  updateItemCardDOM(itemId, newQty);
  renderCartSidebar();
  renderCategoryNav();

  // Persist to sync layer
  await saveItemQuantity(itemMeta, newQty);
}

/**
 * Fast targeted DOM update for item card to prevent full grid re-renders on tap
 */
function updateItemCardDOM(itemId, qty) {
  const card = document.getElementById(`card-${itemId}`);
  if (!card) return;

  const qtyEl = card.querySelector(".qty-display");
  const btnDown = card.querySelector(".btn-down");

  if (qtyEl) qtyEl.textContent = qty;
  if (btnDown) btnDown.disabled = qty === 0;

  if (qty > 0) {
    card.classList.add("selected");
  } else {
    card.classList.remove("selected");
  }
}

/**
 * Modal & Button Event Listeners
 */
function setupEventListeners() {
  // Clear List button -> Open Modal
  btnClearListEl.addEventListener("click", () => {
    clearModalEl.classList.remove("hidden");
  });

  // Modal Cancel
  modalCancelBtn.addEventListener("click", () => {
    clearModalEl.classList.add("hidden");
  });

  // Modal Confirm Clear
  modalConfirmBtn.addEventListener("click", async () => {
    clearModalEl.classList.add("hidden");
    const activeIds = Object.keys(activeItems);
    activeItems = {};
    renderCatalogGrid();
    renderCartSidebar();
    renderCategoryNav();
    await clearAllItems(activeIds);
  });

  // Close modal when clicking backdrop
  clearModalEl.addEventListener("click", (e) => {
    if (e.target === clearModalEl) {
      clearModalEl.classList.add("hidden");
    }
  });

  // PWA Install Prompt Handling (Chrome, Edge, Android)
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    console.log("[PWA] beforeinstallprompt event captured");
    if (btnInstallAppEl) {
      btnInstallAppEl.classList.remove("hidden");
    }
  });

  if (btnInstallAppEl) {
    btnInstallAppEl.addEventListener("click", async () => {
      if (!deferredInstallPrompt) return;
      deferredInstallPrompt.prompt();
      const { outcome } = await deferredInstallPrompt.userChoice;
      console.log(`[PWA] Install prompt outcome: ${outcome}`);
      deferredInstallPrompt = null;
      btnInstallAppEl.classList.add("hidden");
    });
  }

  window.addEventListener("appinstalled", () => {
    console.log("[PWA] App successfully installed to device");
    deferredInstallPrompt = null;
    if (btnInstallAppEl) {
      btnInstallAppEl.classList.add("hidden");
    }
  });
}

/**
 * Registers PWA Service Worker for offline capability & caching
 */
function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("./sw.js")
        .then((registration) => {
          console.log("[PWA] ServiceWorker registered with scope:", registration.scope);
        })
        .catch((error) => {
          console.warn("[PWA] ServiceWorker registration failed:", error);
        });
    });
  }
}

// Start App when DOM is ready
document.addEventListener("DOMContentLoaded", initApp);

