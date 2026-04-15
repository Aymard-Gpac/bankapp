import { Account, SignUpParams } from "@/types";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000";

  
function mapClientPayload(data: SignUpParams) {
  return {
    first_name: data.firstName,
    last_name: data.lastName,
    address: data.address1,
    city: data.city,
    state: data.state,
    postal_code: data.postalCode,
    date_of_birth: data.dateOfBirth,
    ssn: data.ssn || null,
    email: data.email,
    password: data.password,
  };
}

// ✅ si tu passes en cookie HttpOnly, tu n’as plus besoin de localStorage token
export async function createClient(data: SignUpParams) {
  const res = await fetch(`${API_URL}/api/clients`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(mapClientPayload(data)),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error || "Client creation failed");
  return json;
}

export async function getClients() {
  const res = await fetch(`${API_URL}/api/clients`, {
    credentials: "include",
  });

  const json = await res.json().catch(() => ([]));
  if (!res.ok) throw new Error(json?.error || "Failed to fetch clients");
  return json;
}

export async function deleteClient(clientId: number) {
  const res = await fetch(`${API_URL}/api/clients/${clientId}`, {
    method: "DELETE",
    credentials: "include",
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error || "Delete failed");
  return json;
}

export async function getClientAccounts(clientId: string | number) {
  const res = await fetch(`${API_URL}/api/clients/${clientId}/accounts`, {
    method: "GET",
    credentials: "include", 
    cache: "no-store",
  });

  const text = await res.text();
  if (!res.ok) throw new Error(`Failed to load accounts ${res.status}: ${text}`);
  return JSON.parse(text) as { data: Account[]; totalBanks: number; totalCurrentBalance: number };
}

export async function closeClientAccount(
  clientId: number,
  accountId: number
) {
  const res = await fetch(
    `${API_URL}/api/clients/${clientId}/accounts/${accountId}/close`,
    {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(json?.error || "Impossible de fermer ce compte");
  }

  return json;
}