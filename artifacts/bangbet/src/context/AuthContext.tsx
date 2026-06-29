import {
  createContext, useContext, useState, useEffect, type ReactNode,
} from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updatePassword,
  onAuthStateChanged,
  reauthenticateWithCredential,
  EmailAuthProvider,
  sendPasswordResetEmail,
  type User as FirebaseUser,
} from "firebase/auth";
import {
  doc, getDoc, setDoc, updateDoc, addDoc, collection,
  query, where, getDocs, onSnapshot,
  serverTimestamp, increment,
} from "firebase/firestore";
import { auth, db, googleProvider } from "../lib/firebase";

export interface User {
  uid: string;
  name: string;
  phone: string;
  email: string;
  balance: number;
  bonus: number;
  winnings: number;
  joinedDate: string;
  referralCode: string;
  status: "active" | "suspended" | "banned";
}

export interface Transaction {
  id: string;
  type: "deposit" | "withdraw" | "bonus" | "bet" | "win" | "referral";
  amount: number;
  description: string;
  date: string;
  status: "completed" | "pending" | "failed";
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  transactions: Transaction[];
  login: (phone: string, password: string, dialCode?: string) => Promise<{ success: boolean; error?: string }>;
  register: (firstName: string, lastName: string, phone: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  updateProfile: (updates: Partial<Pick<User, "name">>) => Promise<void>;
  deposit: (amount: number, method: string) => Promise<{ success: boolean; error?: string }>;
  withdraw: (amount: number, method: string, number: string) => Promise<{ success: boolean; error?: string }>;
  claimReferral: (code: string) => Promise<{ success: boolean; error?: string }>;
  creditBalance: (amount: number, description: string) => Promise<void>;
  debitBalance: (amount: number, description: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  signInWithGoogle: () => Promise<{ success: boolean; needsPhone?: boolean; error?: string }>;
  completeGoogleSignup: (phone: string, dialCode: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | null>(null);

function genCode(phone: string): string {
  let hash = 0;
  const str = phone + "ref";
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return "BM" + Math.abs(hash).toString().slice(0, 6).toUpperCase();
}

function nowString(): string {
  return new Date().toLocaleString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

async function addTransaction(
  userId: string,
  txn: Omit<Transaction, "id" | "date">,
) {
  await addDoc(collection(db, "transactions"), {
    userId,
    ...txn,
    date: nowString(),
    createdAt: serverTimestamp(),
  });
}

function buildUser(uid: string, data: Record<string, any>, fbEmail?: string | null): User {
  return {
    uid,
    name: data.name,
    phone: data.phone ?? "",
    email: data.email ?? fbEmail ?? "",
    balance: data.balance ?? 0,
    bonus: data.bonus ?? 0,
    winnings: data.winnings ?? 0,
    joinedDate: data.joinedDate ?? "",
    referralCode: data.referralCode ?? "",
    status: data.status ?? "active",
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [fbUser, setFbUser] = useState<FirebaseUser | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setFbUser(firebaseUser);
      if (!firebaseUser) {
        setUser(null);
        setTransactions([]);
        setLoading(false);
        return;
      }
      const snap = await getDoc(doc(db, "users", firebaseUser.uid));
      if (snap.exists()) {
        setUser(buildUser(firebaseUser.uid, snap.data(), firebaseUser.email));
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!fbUser) { setTransactions([]); return; }
    const q = query(collection(db, "transactions"), where("userId", "==", fbUser.uid));
    const unsub = onSnapshot(q, (snap) => {
      const txns = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Transaction, "id">) }));
      txns.sort((a, b) => {
        const aMs = (a as any).createdAt?.toMillis?.() ?? 0;
        const bMs = (b as any).createdAt?.toMillis?.() ?? 0;
        return bMs - aMs;
      });
      setTransactions(txns);
    });
    return unsub;
  }, [fbUser?.uid]);

  useEffect(() => {
    if (!fbUser) return;
    const unsub = onSnapshot(doc(db, "users", fbUser.uid), (snap) => {
      if (snap.exists()) setUser(buildUser(fbUser.uid, snap.data(), fbUser.email));
    });
    return unsub;
  }, [fbUser?.uid]);

  const login = async (phone: string, password: string, dialCode?: string): Promise<{ success: boolean; error?: string }> => {
    const local = phone.replace(/\s+/g, "");
    if (!local) return { success: false, error: "Please enter your phone number." };
    if (!password) return { success: false, error: "Please enter your password." };

    // Build candidates: try international format first, then local
    const intl = dialCode ? dialCode + local.replace(/^0/, "") : null;
    const candidates = [...new Set([intl, local].filter(Boolean) as string[])];

    try {
      let email: string | null = null;
      for (const candidate of candidates) {
        const qs = await getDocs(query(collection(db, "users"), where("phone", "==", candidate)));
        if (!qs.empty) { email = qs.docs[0].data().email ?? null; break; }
      }
      if (!email) return { success: false, error: "No account found with this phone number." };
      await signInWithEmailAndPassword(auth, email, password);
      return { success: true };
    } catch (err: any) {
      const code = err?.code ?? "";
      if (code === "auth/invalid-credential" || code === "auth/wrong-password" || code === "auth/user-not-found") {
        return { success: false, error: "Incorrect phone number or password." };
      }
      return { success: false, error: "Login failed. Please try again." };
    }
  };

  const register = async (
    firstName: string, lastName: string, phone: string, email: string, password: string,
  ): Promise<{ success: boolean; error?: string }> => {
    const cleanFirst = firstName.trim();
    const cleanLast = lastName.trim();
    const clean = phone.replace(/\s+/g, "");
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanFirst) return { success: false, error: "Please enter your first name." };
    if (!cleanLast) return { success: false, error: "Please enter your last name." };
    if (!clean || clean.length < 9) return { success: false, error: "Please enter a valid phone number." };
    if (!cleanEmail || !cleanEmail.includes("@")) return { success: false, error: "Please enter a valid email address." };
    if (password.length < 6) return { success: false, error: "Password must be at least 6 characters." };

    try {
      const phoneQ = query(collection(db, "users"), where("phone", "==", clean));
      const phoneSnap = await getDocs(phoneQ);
      if (!phoneSnap.empty) return { success: false, error: "An account with this phone number already exists." };

      const cred = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      const uid = cred.user.uid;
      const fullName = `${cleanFirst} ${cleanLast}`;
      const joinedDate = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
      const referralCode = genCode(clean);

      await setDoc(doc(db, "users", uid), {
        name: fullName, phone: clean, email: cleanEmail,
        balance: 0, bonus: 37000, winnings: 0, joinedDate, referralCode,
        usedReferrals: [], status: "active", riskLevel: "low",
        totalDeposited: 0, totalWithdrawn: 0, pendingBetAmount: 0,
        totalBets: 0, wonBets: 0, lostBets: 0, pendingBets: 0,
        country: "Uganda", device: "Web", lastSeen: nowString(),
        notifications: [], createdAt: serverTimestamp(),
      });
      await addTransaction(uid, { type: "bonus", amount: 37000, description: "Welcome Bonus credited", status: "completed" });
      return { success: true };
    } catch (err: any) {
      const code = err?.code ?? "";
      if (code === "auth/email-already-in-use") return { success: false, error: "An account with this email already exists." };
      return { success: false, error: "Registration failed. Please try again." };
    }
  };

  // ── GOOGLE SIGN-IN ──
  const signInWithGoogle = async (): Promise<{ success: boolean; needsPhone?: boolean; error?: string }> => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const fbU = result.user;
      const snap = await getDoc(doc(db, "users", fbU.uid));

      if (snap.exists() && snap.data().phone) {
        // Returning Google user — already has a profile
        setUser(buildUser(fbU.uid, snap.data(), fbU.email));
        return { success: true, needsPhone: false };
      }

      // New Google user — need phone number
      return { success: true, needsPhone: true };
    } catch (err: any) {
      const code = err?.code ?? "";
      if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
        return { success: false, error: "" }; // silent — user closed popup
      }
      return { success: false, error: "Google sign-in failed. Please try again." };
    }
  };

  // Complete signup for Google users who need to add a phone number
  const completeGoogleSignup = async (phone: string, dialCode: string): Promise<{ success: boolean; error?: string }> => {
    const currentUser = auth.currentUser;
    if (!currentUser) return { success: false, error: "Session expired. Please try again." };

    const fullPhone = (dialCode + phone.replace(/\s+/g, "")).replace(/\+\+/, "+");
    const localPhone = phone.replace(/\s+/g, "");

    if (!localPhone || localPhone.length < 7) return { success: false, error: "Please enter a valid phone number." };

    try {
      // Check phone not already used
      const phoneQ = query(collection(db, "users"), where("phone", "==", fullPhone));
      const phoneSnap = await getDocs(phoneQ);
      if (!phoneSnap.empty) return { success: false, error: "This phone number is already linked to another account." };

      const displayName = currentUser.displayName ?? "BetMali User";
      const email = currentUser.email ?? "";
      const joinedDate = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
      const referralCode = genCode(fullPhone);

      await setDoc(doc(db, "users", currentUser.uid), {
        name: displayName, phone: fullPhone, email,
        balance: 0, bonus: 37000, winnings: 0, joinedDate, referralCode,
        usedReferrals: [], status: "active", riskLevel: "low",
        totalDeposited: 0, totalWithdrawn: 0, pendingBetAmount: 0,
        totalBets: 0, wonBets: 0, lostBets: 0, pendingBets: 0,
        country: "Uganda", device: "Web", lastSeen: nowString(),
        notifications: [], createdAt: serverTimestamp(), loginMethod: "google",
      });
      await addTransaction(currentUser.uid, { type: "bonus", amount: 37000, description: "Welcome Bonus credited", status: "completed" });
      return { success: true };
    } catch {
      return { success: false, error: "Failed to save your phone number. Please try again." };
    }
  };

  const logout = async () => { await signOut(auth); };

  const forgotPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) return { success: false, error: "Please enter a valid email address." };
    try {
      await sendPasswordResetEmail(auth, cleanEmail);
      return { success: true };
    } catch (err: any) {
      const code = err?.code ?? "";
      if (code === "auth/user-not-found") return { success: false, error: "No account found with this email address." };
      return { success: false, error: "Failed to send reset email. Please try again." };
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
    if (!fbUser || !user) return { success: false, error: "Not logged in." };
    if (!currentPassword) return { success: false, error: "Please enter your current password." };
    if (newPassword.length < 6) return { success: false, error: "New password must be at least 6 characters." };
    try {
      const email = user.email || fbUser.email || "";
      const cred = EmailAuthProvider.credential(email, currentPassword);
      await reauthenticateWithCredential(fbUser, cred);
      await updatePassword(fbUser, newPassword);
      return { success: true };
    } catch (err: any) {
      if (err?.code === "auth/wrong-password" || err?.code === "auth/invalid-credential") {
        return { success: false, error: "Current password is incorrect." };
      }
      return { success: false, error: "Password change failed." };
    }
  };

  const updateProfile = async (updates: Partial<Pick<User, "name">>) => {
    if (!fbUser) return;
    const patch: Record<string, any> = {};
    if (updates.name) patch.name = updates.name;
    if (Object.keys(patch).length) await updateDoc(doc(db, "users", fbUser.uid), patch);
  };

  const deposit = async (amount: number, method: string): Promise<{ success: boolean; error?: string }> => {
    if (!fbUser || !user) return { success: false, error: "Not logged in." };
    if (amount < 1000) return { success: false, error: "Minimum deposit is UGX 1,000." };
    if (amount > 10000000) return { success: false, error: "Maximum deposit is UGX 10,000,000." };
    try {
      await updateDoc(doc(db, "users", fbUser.uid), { balance: increment(amount), totalDeposited: increment(amount), lastSeen: nowString() });
      await addTransaction(fbUser.uid, { type: "deposit", amount, description: `Deposit via ${method}`, status: "completed" });
      return { success: true };
    } catch { return { success: false, error: "Deposit failed. Please try again." }; }
  };

  const withdraw = async (amount: number, method: string, number: string): Promise<{ success: boolean; error?: string }> => {
    if (!fbUser || !user) return { success: false, error: "Not logged in." };
    if (amount < 5000) return { success: false, error: "Minimum withdrawal is UGX 5,000." };
    if (amount > user.balance) return { success: false, error: "Insufficient balance." };
    if (!number.trim()) return { success: false, error: "Please enter your mobile money number." };
    try {
      await updateDoc(doc(db, "users", fbUser.uid), { balance: increment(-amount), totalWithdrawn: increment(amount), lastSeen: nowString() });
      await addTransaction(fbUser.uid, { type: "withdraw", amount, description: `Withdrawal to ${method} (${number.trim()})`, status: "completed" });
      return { success: true };
    } catch { return { success: false, error: "Withdrawal failed. Please try again." }; }
  };

  const creditBalance = async (amount: number, description: string): Promise<void> => {
    if (!fbUser) return;
    await updateDoc(doc(db, "users", fbUser.uid), { balance: increment(amount), totalDeposited: increment(amount), lastSeen: nowString() });
    await addTransaction(fbUser.uid, { type: "deposit", amount, description, status: "completed" });
  };

  const debitBalance = async (amount: number, description: string): Promise<void> => {
    if (!fbUser) return;
    await updateDoc(doc(db, "users", fbUser.uid), { balance: increment(-amount), totalWithdrawn: increment(amount), lastSeen: nowString() });
    await addTransaction(fbUser.uid, { type: "withdraw", amount, description, status: "completed" });
  };

  const claimReferral = async (code: string): Promise<{ success: boolean; error?: string }> => {
    if (!fbUser || !user) return { success: false, error: "Not logged in." };
    const cleaned = code.trim().toUpperCase();
    if (cleaned === user.referralCode) return { success: false, error: "You cannot use your own referral code." };
    try {
      const snap = await getDoc(doc(db, "users", fbUser.uid));
      const myData = snap.data();
      if (!myData) return { success: false, error: "Account not found." };
      const used: string[] = myData.usedReferrals ?? [];
      if (used.includes(cleaned)) return { success: false, error: "You have already used this referral code." };
      const q = query(collection(db, "users"), where("referralCode", "==", cleaned));
      const qs = await getDocs(q);
      if (qs.empty) return { success: false, error: "Invalid referral code. Please check and try again." };
      const referrerDoc = qs.docs[0];
      await updateDoc(doc(db, "users", fbUser.uid), { bonus: increment(500), usedReferrals: [...used, cleaned] });
      await updateDoc(doc(db, "users", referrerDoc.id), { bonus: increment(500) });
      await addTransaction(fbUser.uid, { type: "referral", amount: 500, description: `Referral bonus from code ${cleaned}`, status: "completed" });
      await addTransaction(referrerDoc.id, { type: "referral", amount: 500, description: "Referral bonus — friend joined", status: "completed" });
      return { success: true };
    } catch { return { success: false, error: "Could not process referral. Please try again." }; }
  };

  return (
    <AuthContext.Provider value={{
      user, loading, transactions,
      login, register, logout, changePassword, updateProfile,
      deposit, withdraw, claimReferral, creditBalance, debitBalance,
      forgotPassword, signInWithGoogle, completeGoogleSignup,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
