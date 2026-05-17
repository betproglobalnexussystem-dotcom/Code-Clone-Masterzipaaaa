const BASE = "https://function-bun-production-b22d.up.railway.app";

export function normalizeMsisdn(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("256")) return `+${digits}`;
  if (digits.startsWith("0")) return `+256${digits.slice(1)}`;
  if (digits.length === 9) return `+256${digits}`;
  return `+${digits}`;
}

export async function apiDeposit(msisdn: string, amount: number) {
  const res = await fetch(`${BASE}/api/deposit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ msisdn, amount }),
  });
  return res.json();
}

export async function apiWithdraw(msisdn: string, amount: number) {
  const res = await fetch(`${BASE}/api/withdraw`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ msisdn, amount }),
  });
  return res.json();
}

export async function apiRequestStatus(internal_reference: string) {
  const res = await fetch(
    `${BASE}/api/request-status?internal_reference=${encodeURIComponent(internal_reference)}`
  );
  return res.json();
}

export type RequestStatus = "pending" | "success" | "failed" | "error" | string;

export function parseRequestStatus(data: any): RequestStatus {
  if (!data) return "error";
  const s = (data.request_status ?? data.status ?? "").toLowerCase();
  return s as RequestStatus;
}
