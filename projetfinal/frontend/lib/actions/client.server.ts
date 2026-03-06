import { cookies } from "next/headers";

const API_URL =
  process.env.API_URL_INTERNAL ||
  "http://localhost:5000";

  
export async function getCurrentClientServer(clientId: number) {
  const token = cookies().get("token")?.value;

  if (!token) return null;

  const res = await fetch(`${API_URL}/api/clients/${clientId}`, {
    cache: "no-store",
    headers: { Authorization: `Bearer ${token}` },
  });

  const text = await res.text();
  if (!res.ok) {
    console.log("getCurrentClientServer failed", res.status, text);
    return null;
  }

  return JSON.parse(text);
}