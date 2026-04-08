import type { FinancialProduct } from "@/types";
import Image from "next/image";

type ProductCardProps = {
  product: FinancialProduct;
};

const categoryClasses: Record<FinancialProduct["category"], string> = {
  Épargne: "bg-success-25 text-success-700",
  Crédit: "bg-pink-25 text-pink-700",
  Investissement: "bg-blue-25 text-blue-700",
  Services: "bg-gray-100 text-gray-700",
};

const ProductCard = ({ product }: ProductCardProps) => {
  return (
    <article className="flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className="flex size-12 items-center justify-center rounded-xl bg-blue-25">
          <Image src={product.icon} alt={product.title} width={24} height={24} />
        </div>

        <span
          className={`rounded-full px-3 py-1 text-12 font-semibold ${categoryClasses[product.category]}`}
        >
          {product.category}
        </span>
      </div>

      <div className="mt-5 space-y-3">
        <h3 className="text-20 font-semibold text-gray-900">{product.title}</h3>
        <p className="text-14 text-gray-600">{product.description}</p>
      </div>

      <div className="mt-5">
        <h4 className="text-14 font-semibold text-gray-900">Points clés</h4>

        <ul className="mt-3 space-y-2">
          {product.features.map((feature) => (
            <li key={feature} className="flex gap-2 text-14 text-gray-600">
              <span className="mt-[8px] size-1.5 rounded-full bg-blue-600" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-auto pt-5">
        <div className="rounded-xl bg-gray-25 p-4">
          <p className="text-12 font-semibold uppercase tracking-[0.08em] text-gray-500">
            Pour qui ?
          </p>
          <p className="mt-2 text-14 text-gray-700">{product.target}</p>
        </div>
      </div>
    </article>
  );
};

export default ProductCard;