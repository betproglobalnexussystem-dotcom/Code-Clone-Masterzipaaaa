import { useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { getPendingPayment, clearPendingPayment, apiRequestStatus, parseRequestStatus } from "../lib/paymentApi";

const MAX_ATTEMPTS = 600;

export default function PendingPaymentRecovery() {
  const { user, creditBalance, debitBalance } = useAuth();
  const runningRef = useRef(false);

  useEffect(() => {
    if (!user?.uid || runningRef.current) return;

    const pending = getPendingPayment(user.uid);
    if (!pending) return;

    runningRef.current = true;
    let attempts = 0;
    let timeoutId: ReturnType<typeof setTimeout>;

    const poll = async () => {
      if (attempts >= MAX_ATTEMPTS) {
        clearPendingPayment();
        runningRef.current = false;
        return;
      }
      attempts++;
      try {
        const status = await apiRequestStatus(pending.internal_reference);
        const s = parseRequestStatus(status);
        if (s === "success") {
          clearPendingPayment();
          runningRef.current = false;
          if (pending.type === "deposit") {
            await creditBalance(pending.amount, `Deposit via ${pending.method} (${pending.msisdn})`);
          } else {
            await debitBalance(pending.amount, `Withdrawal to ${pending.method} (${pending.msisdn})`);
          }
          return;
        }
        if (s === "failed" || s === "error" || s === "cancelled") {
          clearPendingPayment();
          runningRef.current = false;
          return;
        }
      } catch {
        // network blip — keep polling
      }
      timeoutId = setTimeout(poll, 1000);
    };

    poll();
    return () => {
      clearTimeout(timeoutId);
      runningRef.current = false;
    };
  }, [user?.uid]);

  return null;
}
