export const ADMIN_CREDENTIALS = { username: "admin", password: "Admin@2024" };

export interface AdminUser {
  id: string; name: string; phone: string; email?: string;
  balance: number; bonus: number; winnings: number; pendingBetAmount: number;
  totalBets: number; wonBets: number; lostBets: number; pendingBets: number;
  totalDeposited: number; totalWithdrawn: number;
  status: "active" | "suspended" | "banned";
  joinDate: string; lastSeen: string; country: string;
  riskLevel: "low" | "medium" | "high";
  ipAddress?: string; device?: string;
  notifications: Array<{ id: string; msg: string; date: string; read: boolean }>;
}

export interface AdminBet {
  id: string; userId: string; userName: string; ticketId: string;
  stake: number; totalOdds: number; potentialWin: number;
  status: "pending" | "won" | "lost" | "cashed_out";
  date: string; selectionsCount: number; type: string;
  selections?: any[];
}

export interface AdminTransaction {
  id: string; userId: string; userName: string;
  type: "deposit" | "withdrawal" | "withdraw" | "win" | "bet" | "bonus" | "cashout" | "referral";
  amount: number; method?: string; description?: string;
  status: "completed" | "pending" | "failed";
  date: string; ref?: string;
}

export interface SecurityLog {
  id: string; event: string; userId?: string; userName?: string;
  ip: string; date: string; severity: "low" | "medium" | "high";
  resolved: boolean;
}
