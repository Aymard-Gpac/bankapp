const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000";

type CheckDepositPayload = {
  clientId: number;
  imageName: string;
  imageType: string;
  imageSize: number;
  qrCode: string;
  amount: number;
};

type Ok<T> = { ok: true; data: T };
type Err = { ok: false; error: string };

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

async function safeJson(res: Response) {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

export async function createCheckDeposit(
  payload: CheckDepositPayload
): Promise<Ok<any> | Err> {
  try {
    const token = getToken();

    if (!token) {
      return {
        ok: false,
        error: "Session expirée. Veuillez vous reconnecter.",
      };
    }

    const res = await fetch(
      `${API_URL}/api/clients/${payload.clientId}/check-deposits`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify({
          imageName: payload.imageName,
          imageType: payload.imageType,
          imageSize: payload.imageSize,
          qrCode: payload.qrCode,
          amount: payload.amount,
        }),
      }
    );

    const json = await safeJson(res);

    if (!res.ok) {
      if (res.status === 401 && typeof window !== "undefined") {
        localStorage.removeItem("token");
      }

      return {
        ok: false,
        error: json?.error || `HTTP ${res.status}`,
      };
    }

    return { ok: true, data: json };
  } catch (error: any) {
    return {
      ok: false,
      error: error?.message || "Erreur réseau",
    };
  }
}