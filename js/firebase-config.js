// =============================================================================
// Firebase Configuration
// =============================================================================
// Replace the placeholder values below with your Firebase project configuration
// found in your Firebase Console (Project Settings > General > Your apps > Web app)
// =============================================================================

export const firebaseConfig = {
  apiKey: "AIzaSyC0WepeMWwt4ZG0jFyo9rLV59aeA2UkRvo",
  authDomain: "leonie-99432.firebaseapp.com",
  projectId: "leonie-99432",
  storageBucket: "leonie-99432.firebasestorage.app",
  messagingSenderId: "116034174114",
  appId: "1:116034174114:web:878eed70c439c63c67abfb"
};

/**
 * Checks if real Firebase credentials have been supplied.
 */
export function isFirebaseConfigured() {
  return (
    typeof firebaseConfig.apiKey === "string" &&
    firebaseConfig.apiKey.length > 10 &&
    !firebaseConfig.apiKey.includes("YOUR_") &&
    typeof firebaseConfig.projectId === "string" &&
    firebaseConfig.projectId.length > 0 &&
    !firebaseConfig.projectId.includes("YOUR_")
  );
}

