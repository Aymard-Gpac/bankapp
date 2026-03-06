import { cookies } from "next/headers";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export async function   getCurrentUserServer() {
  const token = cookies().get("token")?.value;
  if (!token) return null;

  const res = await fetch(`${API_URL}/api/auth/me`, {
    headers: {
      Cookie: `token=${token}`,
    },
    cache: "no-store",
  });

  if (!res.ok) return null;
  return res.json();
}