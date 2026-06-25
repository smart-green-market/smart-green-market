import FilterProduct from "../../components/User/Home/FilterProduct";
import SuggestProduct from "../../components/User/Home/SuggestProduct";

export default function ProductsPage() {
    return (
        <div className="flex w-full flex-col bg-gray-50 pb-16">
            <SuggestProduct/>
            <FilterProduct />
        </div>
    );
}
