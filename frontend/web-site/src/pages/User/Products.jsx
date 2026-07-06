import FilterProduct from "../../components/User/Home/FilterProduct";
import SuggestProduct from "../../components/User/Home/SuggestProduct";
import BestSellingProduct from "../../components/User/Home/BestSellingProduct";
import Baner from "../../components/User/Home/Banner";

export default function ProductsPage() {
    return (
        <div className="flex w-full flex-col bg-gray-50 pb-16">
            {/* <Baner /> */}
            <SuggestProduct/>
            <BestSellingProduct/>
            <FilterProduct />
        </div>
    );
}
