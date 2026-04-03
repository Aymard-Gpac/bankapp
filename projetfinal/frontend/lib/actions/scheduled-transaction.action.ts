/**
 * Actions frontend pour les transactions programmées
 *
 * Objectif :
 * - récupérer la liste des transactions futures
 * - annuler une transaction programmée
 *
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";


function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

/**
 * Cela évite de continuer à envoyer un ancien token cassé
 * à chaque appel API.
 */
function clearInvalidToken() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("token");
}

/**
 * Construit les headers communs pour les appels protégés.
 *
 * Si un token local existe, on l'ajoute dans Authorization.
 * Sinon, on laisse uniquement Content-Type.
 */
function buildAuthHeaders(): HeadersInit {
  const token = getToken();

  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/**
 * Gère proprement les erreurs API d'authentification.
 *
 * Si le backend renvoie 401 :
 * - on supprime le token local invalide/expiré
 * - on remonte un message clair
 */
async function handleApiResponse(response: Response) {
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    if (response.status === 401) {
      clearInvalidToken();

      throw new Error(
        data?.error ||
          data?.message ||
          "Session expirée ou token invalide. Veuillez vous reconnecter."
      );
    }

    throw new Error(
      data?.error ||
        data?.message ||
        "Erreur lors de la communication avec le serveur."
    );
  }

  return data;
}

/**
 * Récupère toutes les transactions programmées du client connecté.
 */
export async function getScheduledTransactions() {
  const response = await fetch(`${API_URL}/api/transfers/scheduled`, {
    method: "GET",
    headers: buildAuthHeaders(),
    credentials: "include", // envoie aussi les cookies si le backend les utilise
    cache: "no-store",
  });

  const data = await handleApiResponse(response);

  return data?.data ?? [];
}

/**
 * Annule une transaction programmée.
 *
 * Route attendue côté backend :
 * PATCH /api/transfers/scheduled/:id/cancel
 */
export async function cancelScheduledTransaction(transactionId: number) {
  const response = await fetch(
    `${API_URL}/api/transfers/scheduled/${transactionId}/cancel`,
    {
      method: "PATCH",
      headers: buildAuthHeaders(),
      credentials: "include", // envoie aussi les cookies si le backend les utilise
    }
  );

  const data = await handleApiResponse(response);

  return data?.data;
}