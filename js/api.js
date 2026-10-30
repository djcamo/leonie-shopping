// =============================================================================
// API & Data Synchronization Layer (Firebase Firestore + Local Storage Fallback)
// =============================================================================

import { firebaseConfig, isFirebaseConfigured } from "./firebase-config.js";

const LOCAL_STORAGE_KEY = "leonie_groceries_active_list";
const COLLECTION_NAME = "shopping_list";

let firestoreDb = null;
let firestoreOps = null; // Cached Firestore functions
let unsubscribeSnapshot = null;
let onSyncCallback = null;
let onStatusChangeCallback = null;

// Status types: 'synced' | 'syncing' | 'local' | 'offline' | 'error'
let currentStatus = "local";

function updateStatus(newStatus, detail = "") {
  currentStatus = newStatus;
  console.log(`[Status] ${newStatus.toUpperCase()}: ${detail}`);
  if (typeof onStatusChangeCallback === "function") {
    onStatusChangeCallback(newStatus, detail);
  }
}

/**
 * Initializes synchronization with Firestore or falls back to localStorage.
 * @param {Function} syncCallback - Called whenever data changes: callback(itemsMap)
 * @param {Function} statusCallback - Called whenever status changes: callback(status, detail)
 */
export async function initSync(syncCallback, statusCallback) {
  onSyncCallback = syncCallback;
  onStatusChangeCallback = statusCallback;

  if (!isFirebaseConfigured()) {
    updateStatus("local", "Using local storage (Firebase keys not yet configured)");
    loadFromLocalStorage();
    return;
  }

  updateStatus("syncing", "Connecting to Firebase Firestore...");
  console.log("[Firebase] Connecting to project:", firebaseConfig.projectId);

  try {
    const { initializeApp } = await import(
      "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js"
    );
    const firestoreModule = await import(
      "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js"
    );

    firestoreOps = firestoreModule;
    const { getFirestore, collection, onSnapshot } = firestoreModule;

    const app = initializeApp(firebaseConfig);
    firestoreDb = getFirestore(app);

    const listRef = collection(firestoreDb, COLLECTION_NAME);

    // Listen for real-time updates from Firestore
    unsubscribeSnapshot = onSnapshot(
      listRef,
      (snapshot) => {
        const itemsMap = {};
        snapshot.forEach((docSnapshot) => {
          const data = docSnapshot.data();
          if (data && data.quantity > 0) {
            itemsMap[docSnapshot.id] = data;
          }
        });

        console.log(`[Firebase] Snapshot received: ${Object.keys(itemsMap).length} active items in cloud`);

        // Update local storage backup
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(itemsMap));
        updateStatus("synced", "Connected to Firebase Firestore");

        if (typeof onSyncCallback === "function") {
          onSyncCallback(itemsMap);
        }
      },
      (error) => {
        console.error("[Firebase] Firestore listener error:", error);
        if (error && error.code === "permission-denied") {
          updateStatus("error", "Permission Denied: Check Firestore Security Rules in Firebase Console");
        } else if (error && error.code === "not-found") {
          updateStatus("error", "Database Not Found: Create Cloud Firestore database in Firebase Console");
        } else {
          updateStatus("offline", `Cloud sync offline (${error.message || "using local backup"})`);
        }
        loadFromLocalStorage();
      }
    );
  } catch (error) {
    console.error("[Firebase] Failed to initialize Firebase SDK:", error);
    updateStatus("local", "Firebase offline / not reachable. Using local backup.");
    loadFromLocalStorage();
  }
}

/**
 * Loads current list from localStorage
 */
function loadFromLocalStorage() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    const itemsMap = raw ? JSON.parse(raw) : {};
    if (typeof onSyncCallback === "function") {
      onSyncCallback(itemsMap);
    }
  } catch (e) {
    console.error("Failed to parse localStorage:", e);
  }
}

/**
 * Saves or deletes an item's quantity in Firestore and local storage.
 * @param {Object} item - { id, name, category, emoji, unit }
 * @param {number} quantity - updated quantity
 */
export async function saveItemQuantity(item, quantity) {
  // Always update local cache immediately for responsive UI
  let localData = {};
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    localData = raw ? JSON.parse(raw) : {};
  } catch (e) {
    localData = {};
  }

  if (quantity > 0) {
    localData[item.id] = {
      id: item.id,
      name: item.name,
      category: item.category,
      emoji: item.emoji,
      unit: item.unit || "",
      quantity: quantity,
      updatedAt: new Date().toISOString()
    };
  } else {
    delete localData[item.id];
  }

  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(localData));

  // If Firebase is active and initialized, persist to Firestore
  if (firestoreDb && isFirebaseConfigured() && firestoreOps) {
    try {
      const { doc, setDoc, deleteDoc, serverTimestamp } = firestoreOps;
      const docRef = doc(firestoreDb, COLLECTION_NAME, item.id);

      if (quantity > 0) {
        console.log(`[Firebase] Writing item "${item.id}" (qty: ${quantity}) to collection "${COLLECTION_NAME}"...`);
        await setDoc(docRef, {
          id: item.id,
          name: item.name,
          category: item.category,
          emoji: item.emoji,
          unit: item.unit || "",
          quantity: quantity,
          updatedAt: serverTimestamp()
        });
        console.log(`[Firebase] Successfully written "${item.id}" to Firestore!`);
      } else {
        console.log(`[Firebase] Deleting item "${item.id}" from collection "${COLLECTION_NAME}"...`);
        await deleteDoc(docRef);
        console.log(`[Firebase] Successfully deleted "${item.id}" from Firestore!`);
      }
      updateStatus("synced", "Changes saved to Firebase Cloud");
    } catch (error) {
      console.error("[Firebase] Error saving to Firestore:", error);
      if (error && error.code === "permission-denied") {
        updateStatus("error", "Permission Denied: Check Firestore Security Rules in Firebase Console");
      } else {
        updateStatus("offline", `Could not sync to cloud: ${error.message || "Saved locally"}`);
      }
    }
  } else {
    // Local mode callback trigger
    if (typeof onSyncCallback === "function") {
      onSyncCallback(localData);
    }
  }
}

/**
 * Clears all active grocery items
 * @param {Array<string>} activeItemIds
 */
export async function clearAllItems(activeItemIds = []) {
  // Clear localStorage
  localStorage.removeItem(LOCAL_STORAGE_KEY);

  // Clear Firestore documents
  if (firestoreDb && isFirebaseConfigured() && firestoreOps && activeItemIds.length > 0) {
    try {
      const { doc, writeBatch } = firestoreOps;
      const batch = writeBatch(firestoreDb);
      for (const id of activeItemIds) {
        const docRef = doc(firestoreDb, COLLECTION_NAME, id);
        batch.delete(docRef);
      }
      console.log(`[Firebase] Batch deleting ${activeItemIds.length} items from Firestore...`);
      await batch.commit();
      console.log("[Firebase] Successfully cleared Firestore collection!");
      updateStatus("synced", "List cleared in cloud");
    } catch (error) {
      console.error("[Firebase] Failed to clear Firestore items:", error);
      if (error && error.code === "permission-denied") {
        updateStatus("error", "Permission Denied: Check Firestore Security Rules in Firebase Console");
      } else {
        updateStatus("offline", "Cleared locally (cloud sync offline)");
      }
    }
  } else {
    if (typeof onSyncCallback === "function") {
      onSyncCallback({});
    }
  }
}

/**
 * Returns current sync status
 */
export function getCurrentStatus() {
  return currentStatus;
}
