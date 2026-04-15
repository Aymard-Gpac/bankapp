import HeaderBox from "@/components/HeaderBox";
import ProductCard from "@/components/ProductCard";
import { financialProducts } from "@/constants";
import { getCurrentUserServer } from "@/lib/actions/user.server";
import { redirect } from "next/navigation";

const ProductsPage = async () => {
  const client = await getCurrentUserServer();

  if (!client || !client.id) {
    redirect("/sign-in");
  }

  const userName =
    `${client?.first_name ?? ""} ${client?.last_name ?? ""}`.trim() ||
    client?.firstName ||
    "Client";

  return (
    <section className="w-full h-screen flex-col gap-8 overflow-y-auto px-5 py-7 sm:px-8 lg:py-12">
      <div className="mx-auto w-full max-w-7xl px-6 py-8">
        <HeaderBox
          title="Produits financiers"
          subtext="Consultez les principales solutions bancaires disponibles afin de mieux comprendre les options offertes par votre banque."
          userName={userName}
        />

        <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-6">
          <div className="grid gap-4 rounded-2xl bg-blue-25 p-5 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <h2 className="text-20 font-semibold text-gray-900">
                Choisir le bon produit
              </h2>
              <p className="mt-2 text-14 text-gray-700">
                Cette page présente les produits les plus courants dans le domaine
                bancaire : comptes, services de transfert, options de crédit et
                solutions d’épargne.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              <div className="rounded-xl bg-white p-4">
                <p className="text-12 font-medium text-gray-500">Produits listés</p>
                <p className="mt-2 text-24 font-semibold text-gray-900">
                  {financialProducts.length}
                </p>
              </div>

              <div className="rounded-xl bg-white p-4">
                <p className="text-12 font-medium text-gray-500">Catégories</p>
                <p className="mt-2 text-24 font-semibold text-gray-900">4</p>
              </div>

              <div className="rounded-xl bg-white p-4">
                <p className="text-12 font-medium text-gray-500">Objectif</p>
                <p className="mt-2 text-14 font-semibold text-gray-900">
                  Informer le client
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-2">
            {financialProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProductsPage;