export const SUPPLIER_PAGE_CLASS = "flex flex-col gap-6 px-8 pt-6 pb-10";

export default function SupplierPageHeader({ title, description }) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">{title}</h1>
      {description && <p className="text-sm text-gray-500">{description}</p>}
    </div>
  );
}
