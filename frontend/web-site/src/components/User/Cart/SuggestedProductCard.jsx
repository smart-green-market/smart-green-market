import { formatCurrency } from "./mockData";

export default function SuggestedProductCard({ product }) {
  return (
    <article className="space-y-4">
      <div className="overflow-hidden rounded-2xl bg-zinc-100 shadow-sm">
        <img
          src={product.image}
          alt={product.name}
          className="h-72 w-full object-cover transition duration-300 hover:scale-105"
        />
      </div>
      <div className="space-y-1">
        <p className="text-xs font-bold uppercase tracking-wide text-teal-800">
          {product.category}
        </p>
        <h3 className="text-base text-emerald-950">{product.name}</h3>
        <p className="text-sm font-semibold text-teal-800">
          {formatCurrency(product.price)} /{product.unit}
        </p>
      </div>
    </article>
  );
}
