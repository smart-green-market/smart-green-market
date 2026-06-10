import SuggestedProductCard from "./SuggestedProductCard";

export default function SuggestedProducts({ products }) {
  return (
    <section className="mt-12">
      <div className="mb-8 flex items-end justify-between">
        <h2 className="text-3xl font-semibold text-emerald-950">Có thể bạn sẽ thích</h2>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((product) => (
          <SuggestedProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
