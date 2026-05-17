import admin from "firebase-admin";

let _initialized = false;

export function getAdmin(): typeof admin {
  if (!_initialized) {
    const raw = process.env["FIREBASE_SERVICE_ACCOUNT_JSON"];
    if (!raw) {
      throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON env var is not set");
    }
    const serviceAccount = JSON.parse(raw);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: "https://bet-mali-africa-default-rtdb.firebaseio.com",
    });
    _initialized = true;
  }
  return admin;
}

export function getDb() {
  return getAdmin().firestore();
}
