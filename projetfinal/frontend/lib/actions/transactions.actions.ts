export type Frequency = "once" | "weekly" | "monthly";

export type Transfer = {
  id: number;
  from_account_id: number;
  to_account_id: number;
  amount: number;
  created_at: string;
};

export type InternalTransferPayload = {
  fromAccountId: number;
  toAccountId: number;
  amount: number;
  date: string;
  frequency: Frequency;
  description?: string;
};

type Ok<T> = { ok: true; data: T };
type Err = { ok: false; error: string };

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000";
  
async function safeJson(res: Response) {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

export async function createInternalTransfer(
  payload: InternalTransferPayload,
): Promise<Ok<any> | Err> {
  try {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_URL}/api/transfers/internal`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    const json = await safeJson(res);
    if (!res.ok)
      return { ok: false, error: json?.error || `HTTP ${res.status}` };

    return { ok: true, data: json?.data };
  } catch (e: any) {
    return { ok: false, error: e?.message || "Erreur réseau" };
  }
}

export async function getTransfersHistory(params?: {
  accountId?: number;
  page?: number;
  limit?: number;
}): Promise<Ok<Transfer[]> | Err> {
  try {
    const accountId = params?.accountId;
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 50;

    const query = new URLSearchParams();
    if (accountId) query.set("accountId", String(accountId));
    query.set("page", String(page));
    query.set("limit", String(limit));

    const res = await fetch(`${API_URL}/api/transfers?${query.toString()}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include", // ✅ cookie envoyé par le navigateur
      cache: "no-store",
    });

    const json = await safeJson(res);
    if (!res.ok)
      return { ok: false, error: json?.error || `HTTP ${res.status}` };

    return { ok: true, data: (json?.data ?? []) as Transfer[] };
  } catch (e: any) {
    return { ok: false, error: e?.message || "Erreur réseau" };
  }
}
