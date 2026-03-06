import { SignUpParams } from "@/types";
import { LoginUser } from "@/types";


const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function createStudentAccount(data: SignUpParams) {
  return {
    first_name: data.firstName,
    last_name: data.lastName,
    address: data.address1,
    city: data.city,
    state: data.state,
    postal_code: data.postalCode,
    date_of_birth: data.dateOfBirth,
    ssn: data.ssn,
    email: data.email,
    password: data.password,
  };
}

export async function signUp(data: SignUpParams) {
  const res = await fetch(`${API_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(createStudentAccount(data)),
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(json?.error || "Register failed");
  }

  return json;
}

export async function signIn(data: LoginUser) {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data), 
  });

  const text = await res.text();
  if (!res.ok) throw new Error(`Login failed ${res.status}: ${text}`);

  return JSON.parse(text);
}


export async function getCurrentUser() {
  const res = await fetch(`${API_URL}/api/auth/me`, {
    credentials: "include",
    cache: "no-store",
  });

  if (!res.ok) return null;
  return res.json();
}

export async function logoutUser() {
  await fetch(`${API_URL}/api/auth/logout`, {
    method: "POST",
    credentials: "include",
  });
}
