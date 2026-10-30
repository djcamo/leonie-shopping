# Leonie's Groceries — iPad Landscape Shopping App

A tablet-optimized web application designed specifically for **iPad in landscape mode**, tailored with **senior-friendly UX** to allow quick selection and quantity adjustments of everyday household groceries.

---

## 📱 Features

- **Built Specifically for iPad Landscape**: Fixed two-column layout with 70% item catalog on the left and 30% sticky shopping list on the right.
- **Mobile Phone Shopping Mode**: When opened on a phone, the catalog grid and category navigation are automatically hidden, presenting **only the Current Shopping List** in full width for easy one-handed checking in supermarket aisles.
- **Senior-Friendly Touch Controls**:
  - Oversized **`▲` (Increase)** and **`▼` (Decrease)** buttons ($\ge 64\text{px} \times 56\text{px}$).
  - Zero typing required — simple, tactile one-touch operation.
  - Large, high-contrast numbers ($28\text{px}$ bold) and recognizable food emojis.
  - Category jump tabs across the top to minimize scrolling.
- **Safety First**: Accidental "Clear List" taps are protected by a confirmation dialog.
- **Instant Response**: Optimistic local UI updates instantly without any tap lag.
- **Dual Persistence**:
  - **Firebase Cloud Firestore**: Live real-time bidirectional synchronization with other devices or family members.
  - **Local Storage Fallback**: Works seamlessly out of the box even before Firebase is configured or when offline.

---

## 📂 Project Structure

```
leonie/
├── index.html              # Main iPad landscape shell & meta tags
├── plan.md                 # Full architecture & design specification
├── README.md               # User guide & Firebase setup instructions
├── css/
│   └── styles.css          # iPad landscape CSS grid, high-contrast accessible design
├── data/
│   └── groceries.json      # 40 standard grocery staples across 6 categories
└── js/
    ├── app.js              # UI controller, category tabs & stepper events
    ├── api.js              # Firestore real-time onSnapshot sync & localStorage backup
    └── firebase-config.js  # Firebase credentials configuration
```

---

## 🚀 How to Run Locally

### Option 1: Via WAMP Server
Because this project is located in `c:\wamp64\www\leonie`:
1. Start your WAMP Server.
2. Open your browser and go to `http://localhost/leonie/`.
3. To view it on your iPad on the same local Wi-Fi network:
   - Find your computer's local IP address (e.g. `192.168.1.50`).
   - On the iPad's Safari, open `http://192.168.1.50/leonie/`.

### Option 2: Via Node / Python (Quick Server)
In this directory, you can run:
```bash
# Using Node:
npx serve .

# Or using Python:
python -m http.server 8080
```

---

## 🔥 Setting Up Firebase Cloud Sync (Optional)

The app works locally right away. When you are ready to enable real-time cloud sync with Firebase:

1. Go to the [Firebase Console](https://console.firebase.google.com/) and create or open your project.
2. Under **Build**, click **Firestore Database** and choose **Create Database** (Start in **test mode** or set rules to allow reads/writes on `shopping_list`).
3. Under **Project Settings (⚙️) > General**, scroll down to **Your apps**, click the Web icon (`</>`), and register the app.
4. Copy the `firebaseConfig` object and paste the values into [js/firebase-config.js](file:///c:/wamp64/www/leonie/js/firebase-config.js):

```javascript
export const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

Once saved, reload the page. The status pill at the top right will turn green: **🟢 Synced (Live)**.

---

## 📲 Adding to iPad Home Screen (Kiosk Mode)

1. Open Safari on the iPad in landscape orientation.
2. Navigate to your app URL.
3. Tap the **Share** button in Safari's toolbar (box with arrow pointing up).
4. Tap **Add to Home Screen**.
5. Launch the app from the new Home Screen icon for a distraction-free, full-screen app experience!

