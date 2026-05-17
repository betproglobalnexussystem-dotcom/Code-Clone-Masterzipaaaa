import {
  createContext, useContext, useState, useEffect, type ReactNode,
} from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  onAuthStateChanged,
  reauthenticateWithCredential,
  EmailAuthProvider,
  type User as FirebaseUser,
} from "firebase/auth";
import {
  doc, getDoc, setDoc, updateDoc, addDoc, collection,
  query, where, getDocs, orderBy, onSnapshot,
  serverTimestamp, increment,
} from "firebase/firestore";
import { auth, db, phoneToEmail } from "../lib/firebase";

export interface User {
  uid: string;
  name: string;
  phone: string;
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
  login: (phone: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, phone: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  updateProfile: (updates: Partial<Pick<User, "name">>) => Promise<void>;
  deposit: (amount: number, method: string) => Promise<{ success: boolean; error?: string }>;
  withdraw: (amount: number, method: string, number: string) => Promise<{ success: boolean; error?: string }>;
  claimReferral: (code: string) => Promise<{ success: boolean; error?: string }>;
  creditBalance: (amount: number, description: string) => Promise<void>;
  debitBalance: (amount: number, description: string) => Promise<void>;
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
        const data = snap.data();
        setUser({
          uid: firebaseUser.uid,
          name: data.name,
          phone: data.phone,
          balance: data.balance ?? 0,
          bonus: data.bonus ?? 0,
          winnings: data.winnings ?? 0,
          joinedDate: data.joinedDate ?? "",
          referralCode: data.referralCode ?? "",
          status: data.status ?? "active",
        });
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!fbUser) { setTransactions([]); return; }
    const q = query(
      collection(db, "transactions"),
      where("userId", "==", fbUser.uid),
    );
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
      if (snap.exists()) {
        const data = snap.data();
        setUser({
          uid: fbUser.uid,
          name: data.name,
          phone: data.phone,
          balance: data.balance ?? 0,
          bonus: data.bonus ?? 0,
          winnings: data.winnings ?? 0,
          joinedDate: data.joinedDate ?? "",
          referralCode: data.referralCode ?? "",
          status: data.status ?? "active",
        });
      }
    });
    return unsub;
  }, [fbUser?.uid]);

  const login = async (phone: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const clean = phone.replace(/\s+/g, "");
    if (!clean) return { success: false, error: "Please enter your phone number." };
    if (!password) return { success: false, error: "Please enter your password." };
    try {
      await signInWithEmailAndPassword(auth, phoneToEmail(clean), password);
      return { success: true };
    } catch (err: any) {
      const code = err?.code ?? "";
      if (code === "auth/invalid-credential" || code === "auth/wrong-password" || code === "auth/user-not-found") {
        return { success: false, error: "Incorrect phone number or password." };
      }
      return { success: false, error: "Login failed. Please try again." };
    }
  };

  const register = async (name: string, phone: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const cleanName = name.trim();
    const clean = phone.replace(/\s+/g, "");
    if (!cleanName) return { success: false, error: "Please enter your full name." };
    if (!clean) return { success: false, error: "Please enter a phone number." };
    if (clean.length < 9) return { success: false, error: "Please enter a valid phone number." };
    if (password.length < 6) return { success: false, error: "Password must be at least 6 characters." };
    try {
      const cred = await createUserWithEmailAndPassword(auth, phoneToEmail(clean), password);
      const uid = cred.user.uid;
      const joinedDate = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
      const referralCode = genCode(clean);
      await setDoc(doc(db, "users", uid), {
        name: cleanName,
        phone: clean,
        balance: 0,
        bonus: 37000,
        winnings: 0,
        joinedDate,
        referralCode,
        usedReferrals: [],
        status: "active",
        riskLevel: "low",
        totalDeposited: 0,
        totalWithdrawn: 0,
        pendingBetAmount: 0,
        totalBets: 0,
        wonBets: 0,
        lostBets: 0,
        pendingBets: 0,
        country: "Uganda",
        device: "Web",
        lastSeen: nowString(),
        notifications: [],
        createdAt: serverTimestamp(),
      });
      await addTransaction(uid, {
        type: "bonus",
        amount: 37000,
        description: "Welcome Bonus credited",
        status: "completed",
      });
      return { success: true };
    } catch (err: any) {
      const code = err?.code ?? "";
      if (code === "auth/email-already-in-use") {
        return { success: false, error: "An account with this phone number already exists." };
      }
      return { success: false, error: "Registration failed. Please try again." };
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  const changePassword = async (currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
    if (!fbUser || !user) return { success: false, error: "Not logged in." };
    if (!currentPassword) return { success: false, error: "Please enter your current password." };
    if (newPassword.length < 6) return { success: false, error: "New password must be at least 6 characters." };
    try {
      const cred = EmailAuthProvider.credential(phoneToEmail(user.phone), currentPassword);
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
    if (Object.keys(patch).length) {
      await updateDoc(doc(db, "users", fbUser.uid), patch);
    }
  };

  const deposit = async (amount: number, method: string): Promise<{ success: boolean; error?: string }> => {
    if (!fbUser || !user) return { success: false, error: "Not logged in." };
    if (amount < 1000) return { success: false, error: "Minimum deposit is UGX 1,000." };
    if (amount > 10000000) return { success: false, error: "Maximum deposit is UGX 10,000,000." };
    try {
      await updateDoc(doc(db, "users", fbUser.uid), {
        balance: increment(amount),
        totalDeposited: increment(amount),
        lastSeen: nowString(),
      });
      await addTransaction(fbUser.uid, {
        type: "deposit",
        amount,
        description: `Deposit via ${method}`,
        status: "completed",
      });
      return { success: true };
    } catch {
      return { success: false, error: "Deposit failed. Please try again." };
    }
  };

  const withdraw = async (amount: number, method: string, number: string): Promise<{ success: boolean; error?: string }> => {
    if (!fbUser || !user) return { success: false, error: "Not logged in." };
    if (amount < 5000) return { success: false, error: "Minimum withdrawal is UGX 5,000." };
    if (amount > user.balance) return { success: false, error: "Insufficient balance." };
    if (!number.trim()) return { success: false, error: "Please enter your mobile money number." };
    try {
      await updateDoc(doc(db, "users", fbUser.uid), {
        balance: increment(-amount),
        totalWithdrawn: increment(amount),
        lastSeen: nowString(),
      });
      await addTransaction(fbUser.uid, {
        type: "withdraw",
        amount,
        description: `Withdrawal to ${method} (${number.trim()})`,
        status: "completed",
      });
      return { success: true };
    } catch {
      return { success: false, error: "Withdrawal failed. Please try again." };
    }
  };

  const creditBalance = async (amount: number, description: string): Promise<void> => {
    if (!fbUser) return;
    await updateDoc(doc(db, "users", fbUser.uid), {
      balance: increment(amount),
      totalDeposited: increment(amount),
      lastSeen: nowString(),
    });
    await addTransaction(fbUser.uid, {
      type: "deposit",
      amount,
      description,
      status: "completed",
    });
  };

  const debitBalance = async (amount: number, description: string): Promise<void> => {
    if (!fbUser) return;
    await updateDoc(doc(db, "users", fbUser.uid), {
      balance: increment(-amount),
      totalWithdrawn: increment(amount),
      lastSeen: nowString(),
    });
    await addTransaction(fbUser.uid, {
      type: "withdraw",
      amount,
      description,
      status: "completed",
    });
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
      await updateDoc(doc(db, "users", fbUser.uid), {
        bonus: increment(500),
        usedReferrals: [...used, cleaned],
      });
      await updateDoc(doc(db, "users", referrerDoc.id), {
        bonus: increment(500),
      });
      await addTransaction(fbUser.uid, {
        type: "referral",
        amount: 500,
        description: `Referral bonus from code ${cleaned}`,
        status: "completed",
      });
      await addTransaction(referrerDoc.id, {
        type: "referral",
        amount: 500,
        description: "Referral bonus — friend joined",
        status: "completed",
      });
      return { success: true };
    } catch {
      return { success: false, error: "Could not process referral. Please try again." };
    }
  };

  return (
    <AuthContext.Provider value={{
      user, loading, transactions,
      login, register, logout, changePassword, updateProfile,
      deposit, withdraw, claimReferral,
      creditBalance, debitBalance,
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
