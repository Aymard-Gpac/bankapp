import { cookies } from "next/headers";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export async function getClientAccounts({ clientId }: { clientId: number }) {
  const cookieStore = cookies();
  const cookieHeader = cookieStore.toString();

  const res = await fetch(`${API_URL}/api/clients/${clientId}/accounts`, {
    cache: "no-store",
    headers: {
      Cookie: cookieHeader, 
    },
    credentials: "include",
  });

  const text = await res.text();
  if (!res.ok) throw new Error(`getClientAccounts failed ${res.status}: ${text}`);
  return JSON.parse(text);
}

export async function getClientAccount({
  clientId,
  accountId,
  page,
  pageSize = 10,
}: {
  clientId: number;
  accountId: number;
  page: number;
  pageSize?: number;
}) {
  const url = new URL(`${API_URL}/api/clients/${clientId}/accounts/${accountId}`);
  url.searchParams.set("page", String(page));
  url.searchParams.set("pageSize", String(pageSize));

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) return null;
  return res.json();
}
