# Grocery App Specification & Implementation Plan

An iPad-first web application designed specifically for **landscape mode** with senior-friendly accessibility, allowing Leonie to easily pick regular grocery items and specify quantities for household shopping.

---

## 1. Application Overview & Persona Requirements

### 1.1 Target User & Context
- **Primary User**: Mother-in-law ("Leonie").
- **Device**: iPad (9.7", 10.2", 10.9", 11", or 12.9") mounted or held in **landscape orientation**.
- **Setting**: Kitchen counter, dining table, or living room.
- **Goals**: Effortlessly view habitual grocery items, increase/decrease quantities without typing, and have the list automatically update for whoever does the shopping.

### 1.2 Senior-Friendly Design Guidelines
1. **Zero Text Typing Required**: Everything operates via big tap buttons (`▲` and `▼`).
2. **Generous Touch Targets**: Tap targets minimum $64\text{px} \times 64\text{px}$ with spacing to prevent miss-taps.
3. **High Contrast & Large Typography**:
   - Item titles: $20\text{px} - 24\text{px}$, bold, dark text on bright card background.
   - Counter numbers: $28\text{px} - 34\text{px}$, high visual prominence.
4. **Visual Recognition Over Reading**: Large, recognizable emoji or iconography for each item.
5. **No Cluttered Menus or Deep Navigation**:
   - Split-screen landscape view: Catalog on the left, live cart on the right.
   - Category jump tabs across the top so scrolling is minimal.
6. **Accidental Action Prevention**:
   - "Clear All" protected with a confirmation dialog.
   - Quantity cannot drop below 0.
   - Disable iOS pinch-to-zoom and double-tap zoom gestures (`touch-action: manipulation`).

---

## 2. iPad Landscape Wireframe & Layout

Screen ratio in landscape (~4:3 to 16:10). The screen is divided into a fixed header, a two-panel work area, and safe margin padding for iOS home indicator.

```
+----------------------------------------------------------------------------------------------------------+
|  🛒 Leonie's Grocery List                [All] [Dairy] [Bakery] [Fruit/Veg] [Pantry]   🟢 Synced (Live)  |
+-----------------------------------------------------------------------------------+----------------------+
|  CATALOG GRID (70% Width - Scrollable)                                            |  ACTIVE LIST (30%)   |
|                                                                                   |                      |
|  +-----------------------+  +-----------------------+  +-----------------------+  |  Items Selected: 4   |
|  | 🥛 Full Cream Milk 2L |  | 🧈 Salted Butter      |  | 🍞 White Bread Sliced |  | -------------------- |
|  | Category: Dairy       |  | Category: Dairy       |  | Category: Bakery      |  | 🥛 Milk (2L)     x 2 |
|  |                       |  |                       |  |                       |  | 🍞 White Bread   x 1 |
|  |  [ ▼ ]   ( 2 )   [ ▲ ]|  |  [ ▼ ]   ( 0 )   [ ▲ ]|  |  [ ▼ ]   ( 1 )   [ ▲ ]|  | 🍌 Bananas (bunch)x 1|
|  +-----------------------+  +-----------------------+  +-----------------------+  |                      |
|                                                                                   |                      |
|  +-----------------------+  +-----------------------+  +-----------------------+  |                      |
|  | 🥚 Dozen Large Eggs   |  | 🍌 Bananas (bunch)    |  | 🍎 Gala Apples (bag)  |  |                      |
|  | Category: Dairy       |  | Category: Produce     |  | Category: Produce     |  |                      |
|  |                       |  |                       |  |                       |  |                      |
|  |  [ ▼ ]   ( 0 )   [ ▲ ]|  |  [ ▼ ]   ( 1 )   [ ▲ ]|  |  [ ▼ ]   ( 0 )   [ ▲ ]|  | -------------------- |
|  +-----------------------+  +-----------------------+  +-----------------------+  | [ 🗑️ Reset / Clear ] |
+-----------------------------------------------------------------------------------+----------------------+
```

### 2.1 UI Component Specifications
- **Header Bar**:
  - App title with high contrast.
  - Category filter pills (one-tap filter to show only *Dairy*, *Bakery*, *Fruit & Veg*, *Pantry*, *Household*, or *All*).
  - Sync indicator (Green = Synced to cloud, Amber = Syncing, Red = Offline).
- **Left Panel (Item Grid)**:
  - 3-column responsive grid on standard iPads, 4 columns on 12.9" iPads.
  - Cards highlight in light green/blue when quantity $> 0$.
  - Oversized `▲` (Increase) and `▼` (Decrease) buttons with clear tactile color separation (e.g. bold blue for `▲`, muted gray-red for `▼`).
- **Right Panel (Sticky Summary Sidebar)**:
  - Continuously visible summary of items currently added.
  - Shows item name and current quantity count.
  - One-tap quick remove button per item.
  - "Clear List" button with confirmation prompt at bottom.

### 2.2 Mobile Phone View (Shopping Mode)
- **Viewport target**: Screens $\le 768\text{px}$ or mobile landscape heights $\le 500\text{px}$.
- **Single Pane Focus**: Automatically hides the catalog grid and category navigation bar so only the active **Current List** pane is shown.
- **Full Width**: Expands the list pane to 100% width, optimized for one-handed handheld use in store aisles.
- **Touch Sizing**: Cart action buttons increased to $\ge 44\text{px} \times 44\text{px}$ touch targets with iOS safe-area bottom padding.

---

## 3. Data Design & Schemas

### 3.1 Local Catalog File (`data/groceries.json`)
Contains pre-set household staple items. Can be expanded at any time by editing the JSON file.

```json
[
  {
    "category": "Dairy, Eggs & Fridge",
    "items": [
      { "id": "milk_whole_2l", "name": "Full Cream Milk (2L)", "emoji": "🥛" },
      { "id": "milk_lite_2l", "name": "Lite Milk (2L)", "emoji": "🥛" },
      { "id": "butter_salted", "name": "Salted Butter (250g)", "emoji": "🧈" },
      { "id": "eggs_dozen", "name": "Eggs (1 Dozen)", "emoji": "🥚" },
      { "id": "cheddar_cheese", "name": "Cheddar Cheese Block", "emoji": "🧀" },
      { "id": "yogurt_greek", "name": "Greek Yogurt Tub", "emoji": "🥣" }
    ]
  },
  {
    "category": "Bakery",
    "items": [
      { "id": "white_bread", "name": "White Bread Sliced", "emoji": "🍞" },
      { "id": "wholemeal_bread", "name": "Wholemeal Bread", "emoji": "🍞" },
      { "id": "crumpets", "name": "Crumpets / English Muffins", "emoji": "🥞" }
    ]
  },
  {
    "category": "Fruit & Vegetables",
    "items": [
      { "id": "bananas", "name": "Bananas (Bunch)", "emoji": "🍌" },
      { "id": "apples_red", "name": "Apples", "emoji": "🍎" },
      { "id": "potatoes_bag", "name": "Potatoes (Bag)", "emoji": "🥔" },
      { "id": "carrots_bag", "name": "Carrots (1kg)", "emoji": "🥕" },
      { "id": "tomatoes", "name": "Tomatoes", "emoji": "🍅" },
      { "id": "lettuce", "name": "Lettuce / Salad Leaves", "emoji": "🥬" }
    ]
  },
  {
    "category": "Pantry & Breakfast",
    "items": [
      { "id": "cereal", "name": "Breakfast Cereal / Oats", "emoji": "🥣" },
      { "id": "tea_bags", "name": "Black Tea Bags", "emoji": "🫖" },
      { "id": "coffee", "name": "Instant Coffee", "emoji": "☕" },
      { "id": "sugar", "name": "White Sugar (1kg)", "emoji": "🧂" },
      { "id": "biscuits", "name": "Sweet Biscuits", "emoji": "🍪" },
      { "id": "tinned_soup", "name": "Tinned Soup", "emoji": "🥫" }
    ]
  },
  {
    "category": "Household & Care",
    "items": [
      { "id": "toilet_paper", "name": "Toilet Paper (Pack)", "emoji": "🧻" },
      { "id": "paper_towel", "name": "Paper Towel", "emoji": "🧻" },
      { "id": "dish_liquid", "name": "Dishwashing Liquid", "emoji": "🧼" },
      { "id": "tissues", "name": "Tissues (Box)", "emoji": "🤧" }
    ]
  }
]
```

### 3.2 Firebase Firestore Collection
- **Collection Name**: `shopping_list`
- **Document ID**: Item ID (matches `id` in `groceries.json`, e.g., `milk_whole_2l`)
- **Document Fields**:
  ```json
  {
    "id": "milk_whole_2l",
    "name": "Full Cream Milk (2L)",
    "category": "Dairy, Eggs & Fridge",
    "emoji": "🥛",
    "quantity": 2,
    "lastUpdated": "2026-10-26T14:00:00Z"
  }
  ```
- **Sync Behavior**:
  - When quantity reaches `0`, the document can either be deleted or updated to `0` so shoppers see only active items.
  - Changes in Firestore trigger real-time UI updates on the iPad via `onSnapshot`.

---

## 4. Technical Stack & File Architecture

```
c:\wamp64\www\leonie\
│
├── index.html                  # Semantic iPad landscape markup, iOS webapp headers
├── plan.md                     # This full architectural plan
│
├── css/
│   └── styles.css              # iPad layout (CSS Grid + Flex), high-contrast touch design
│
├── js/
│   ├── firebase-config.js      # Firebase project credentials & SDK init
│   ├── api.js                  # Firestore CRUD operations & real-time snapshot sync
│   └── app.js                  # Main UI controller: catalog renderer, stepper buttons, sidebar
│
└── data/
    └── groceries.json          # Pre-populated grocery catalog with categories & emojis
```

### Technology Selection:
- **HTML5**: Native semantic elements, iOS web app meta tags (`apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style: black-translucent`).
- **CSS3**: CSS Grid for catalog layout, Flexbox for stepper controls, CSS variables for color themes.
- **Vanilla JavaScript (ES Modules)**: Lightweight, fast on older iPads, no build tools or package managers needed.
- **Firebase JS SDK (v10 Modular)**: Loaded via official CDN (esm.run or gstatic), works directly in plain HTML/JS.

---

## 5. Interaction & Behavioral Rules

1. **Tap `▲` (Up Arrow)**:
   - Increments local quantity by 1.
   - Highlights the card with an active border and subtle green background.
   - Updates the live sidebar summary immediately.
   - Debounces / writes update to Firestore (`quantity: current + 1`).
2. **Tap `▼` (Down Arrow)**:
   - Decrements local quantity by 1 (minimum floor: 0).
   - If quantity becomes 0, removes the active highlight on the card and removes the item from the right-hand sidebar.
   - Syncs update to Firestore.
3. **Category Tab Filter**:
   - Tapping a category tab scrolls or filters the catalog to show only items belonging to that category, reducing cognitive clutter.
4. **"Clear List" Button**:
   - Opens an accessible modal: *"Are you sure you want to clear the entire shopping list?"*
   - Buttons: **[ Cancel ]** and **[ Yes, Clear All ]**.
   - Resets all item quantities to 0 and clears the Firestore collection.
5. **Touch Feedback**:
   - Active press effects (`:active` scale or color change) to provide immediate tactile feedback on iPad glass.

---

## 6. Implementation Steps

| Step | Task | Output |
| :---: | :--- | :--- |
| **1** | Create project folder structure and `data/groceries.json`. | Organized folders with rich default grocery data. |
| **2** | Create `index.html` with iPad landscape viewport meta tags and split-screen container. | App shell ready for styling. |
| **3** | Create `css/styles.css` with iPad landscape layout, big tap buttons, and senior-friendly typography. | Tablet-optimized UI styling. |
| **4** | Build `js/app.js` to fetch `data/groceries.json`, render cards, and handle `▲`/`▼` clicks. | Fully working local interactive app. |
| **5** | Create `js/firebase-config.js` and `js/api.js` for Firestore real-time sync. | Persistent cloud synchronization. |
| **6** | Test on iPad landscape browser and configure "Add to Home Screen" shortcut. | Verified end-to-end user experience. |

---
