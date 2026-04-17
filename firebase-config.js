// ========== FIREBASE KONFIGURATSIYASI (O‘ZINGIZNING MA'LUMOTLARINGIZNI KIRITING) ==========
const FIREBASE_CONFIG = {
    apiKey: "AIzaSyAEVOV3RPtA9j8onCRLvijg_5J7v9_Y2ao",
  authDomain: "quiz-game-23f7f.firebaseapp.com",
  databaseURL: "https://quiz-game-23f7f-default-rtdb.firebaseio.com",
  projectId: "quiz-game-23f7f",
  storageBucket: "quiz-game-23f7f.firebasestorage.app",
  messagingSenderId: "50230883657",
  appId: "1:50230883657:web:b1043a1a84d14f24b85698"
};

let db = null;
let isFirebaseReady = false;

try {
    if (FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.apiKey !== "YOUR_API_KEY") {
        firebase.initializeApp(FIREBASE_CONFIG);
        db = firebase.database();
        isFirebaseReady = true;
        console.log("✅ Firebase connected");
    } else {
        console.warn("⚠️ Firebase not configured");
    }
} catch(e) {
    console.error("❌ Firebase error:", e);
}