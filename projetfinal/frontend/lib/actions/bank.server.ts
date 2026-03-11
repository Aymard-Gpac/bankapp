import { cookies } from "next/headers";

const API_URL =
  process.env.API_URL_INTERNAL ||
  "http://localhost:5000";

export async function getClientAccountsServer(clientId: number) {
  const token = cookies().get("token")?.value;

  const res = await fetch(`${API_URL}/api/clients/${clientId}/accounts`, {
    cache: "no-store",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  const text = await res.text();
  if (!res.ok) throw new Error(`getClientAccountsServer failed ${res.status}: ${text}`);

  return JSON.parse(text);
}

export async function getClientAccountServer({
  clientId,
  accountId,
  page,
  pageSize,
}: {
  clientId: number;
  accountId: number;
  page: number;
  pageSize: number;
}) {
  const token = cookies().get("token")?.value;

  const url = `${API_URL}/api/clients/${clientId}/accounts/${accountId}?page=${page}&pageSize=${pageSize}`;

  const res = await fetch(url, {
    cache: "no-store",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  const text = await res.text();
  if (!res.ok) throw new Error(`getClientAccountServer failed ${res.status}: ${text}`);

  return JSON.parse(text);
}
 // =========================
 
export async function getClientTransactionHistoryServer(clientId: number) {
  const token = cookies().get("token")?.value;

  const res = await fetch(
    `${API_URL}/api/clients/${clientId}/transactions/history`,
    {
      cache: "no-store",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }
  );

  const text = await res.text();
  if (!res.ok) {
    throw new Error(
      `getClientTransactionHistoryServer failed ${res.status}: ${text}`
    );
  }

  return JSON.parse(text);
}