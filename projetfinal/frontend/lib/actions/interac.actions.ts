const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

async function safeJson(res: Response) {
  const text = await res.text();
  try { return text ? JSON.parse(text) : null; } catch { return null; }
}

export async function sendInterac(payload: {
  fromAccountId: number;
  recipientUserId: number;
  amount: number;
  message?: string;
}) {
  const res = await fetch(`${API_URL}/api/transfers/interac`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  const json = await safeJson(res);
  if (!res.ok) return { ok: false as const, error: json?.error || `HTTP ${res.status}` };
  return { ok: true as const, data: json.data };
}