"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import ClientsTable, { type Client } from "./ClientsTable";
import { Pagination } from "./Pagination";
import { createClient, getClients } from "@/lib/actions/clients";
import { toast } from "sonner";

type FormState = {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  address1: string;
  city: string;
  state: string;
  postalCode: string;
  dateOfBirth: string; // (tu peux l'appeler "date limite" côté UI)
  ssn?: string;
};

const initialForm: FormState = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  address1: "",
  city: "",
  state: "",
  postalCode: "",
  dateOfBirth: "",
  ssn: "",
};

export default function ClientsSection() {
  const rowsPerPage = 10;

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const page = Number(searchParams.get("page") || "1");

  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");

  // ✅ Ajout client (student)
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(initialForm);
  const [creating, setCreating] = useState(false);

  const fetchClients = async () => {
    const data = await getClients();

    // mapping snake_case → camelCase
    const mapped: Client[] = data.map((u: any) => ({
      id: u.id,
      firstName: u.first_name,
      lastName: u.last_name,
      email: u.email,
      city: u.city,
      state: u.state,
      postalCode: u.postal_code,
      dateOfBirth: u.date_of_birth,
      role: u.role,
    }));

    setClients(mapped);
  };

  // 🔥 FETCH DES CLIENTS ICI
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        await fetchClients();
      } catch (e: any) {
        console.error(e);
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return clients;

    return clients.filter((c) => {
      const fullName = `${c.firstName} ${c.lastName}`.toLowerCase();
      return (
        fullName.includes(query) ||
        (c.email || "").toLowerCase().includes(query) ||
        (c.city || "").toLowerCase().includes(query) ||
        (c.state || "").toLowerCase().includes(query) ||
        (c.postalCode || "").toLowerCase().includes(query)
      );
    });
  }, [clients, q]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const safePage = Math.min(Math.max(page, 1), totalPages);

  const indexOfLast = safePage * rowsPerPage;
  const indexOfFirst = indexOfLast - rowsPerPage;
  const currentClients = filtered.slice(indexOfFirst, indexOfLast);

  const onSearch = (value: string) => {
    setQ(value);
    const sp = new URLSearchParams(searchParams.toString());
    sp.set("page", "1");
    router.replace(`${pathname}?${sp.toString()}`);
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const onSubmitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      await createClient({
        ...form,
        // password optionnel → si vide, backend/service génère
        password: form.password?.trim() ? form.password : undefined,
      } as any);

      toast.success("Client créé avec succès", { duration: 1500 });

      // ✅ cacher form + reset + refresh list
      setShowForm(false);
      setForm(initialForm);

      await fetchClients();

      // ✅ revenir à la page 1 pour voir le nouveau client facilement
      const sp = new URLSearchParams(searchParams.toString());
      sp.set("page", "1");
      router.replace(`${pathname}?${sp.toString()}`);
    } catch (err: any) {
      toast.error(err?.message || "Erreur création client", { duration: 2000 });
    } finally {
      setCreating(false);
    }
  };

  if (loading) return <p className="p-6">Chargement...</p>;
  if (error) return <p className="p-6 text-red-500">{error}</p>;

  return (
    <section className="recent-transactions">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h2 className="recent-transactions-label">Clients</h2>
          <p className="text-sm text-gray-500">{filtered.length} résultat(s)</p>
        </div>

        <div className="flex items-center gap-3">
          <Input
            value={q}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Rechercher (nom, email, ville...)"
            className="max-w-sm"
          />

          <button
            onClick={() => setShowForm((v) => !v)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700"
          >
            {showForm ? "Fermer" : "Ajouter client"}
          </button>
        </div>
      </header>

      {/* ✅ Formulaire ajout client (student) */}
      {showForm && (
        <div className="mt-4 p-4 border rounded-lg bg-white">
          <h3 className="font-semibold mb-3">Ajouter un client</h3>

          <form onSubmit={onSubmitCreate} className="space-y-3" autoComplete="off">
            <div className="grid grid-cols-2 gap-3">
              <input
                className="border p-2 rounded"
                name="firstName"
                placeholder="Prénom"
                value={form.firstName}
                onChange={onChange}
                required
              />
              <input
                className="border p-2 rounded"
                name="lastName"
                placeholder="Nom"
                value={form.lastName}
                onChange={onChange}
                required
              />
            </div>

            <input
              className="border p-2 rounded w-full"
              name="email"
              placeholder="Email"
              value={form.email}
              onChange={onChange}
              required
            />

            <input
              className="border p-2 rounded w-full"
              name="address1"
              placeholder="Adresse"
              value={form.address1}
              onChange={onChange}
            />

            <div className="grid grid-cols-2 gap-3">
              <input
                className="border p-2 rounded"
                name="city"
                placeholder="Ville"
                value={form.city}
                onChange={onChange}
              />
              <input
                className="border p-2 rounded"
                name="state"
                placeholder="Province"
                value={form.state}
                onChange={onChange}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <input
                className="border p-2 rounded"
                name="postalCode"
                placeholder="Code postal"
                value={form.postalCode}
                onChange={onChange}
              />
              <input
                className="border p-2 rounded"
                type="date"
                name="dateOfBirth"
                placeholder="Date limite"
                value={form.dateOfBirth}
                onChange={onChange}
              />
            </div>

            <input
              className="border p-2 rounded w-full"
              type="password"
              name="password"
              placeholder="Mot de passe (optionnel)"
              value={form.password || ""}
              onChange={onChange}
              autoComplete="new-password"
            />

            <button
              disabled={creating}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-60"
            >
              {creating ? "Création..." : "Créer"}
            </button>
          </form>
        </div>
      )}

      <ClientsTable clients={currentClients} />

      {totalPages > 1 && (
        <div className="my-4 w-full">
          <Pagination totalPages={totalPages} page={safePage} />
        </div>
      )}
    </section>
  );
}