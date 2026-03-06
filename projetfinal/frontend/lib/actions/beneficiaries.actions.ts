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

export async function getBeneficiaries() {
  const res = await fetch(`${API_URL}/api/beneficiaries`, {
    credentials: "include",
    cache: "no-store",
  });

  const json = await safeJson(res);
  if (!res.ok) throw new Error(json?.error || `HTTP ${res.status}`);

  // backend peut renvoyer {data: [...] } ou directement [...]
  return Array.isArray(json) ? json : (json?.data ?? []);
}