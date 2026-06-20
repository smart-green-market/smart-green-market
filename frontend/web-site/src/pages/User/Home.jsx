import Slogan from "../../components/User/Home/Slogan";
import Banner from "../../components/User/Home/Banner";
import SuggestProduct from "../../components/User/Home/SuggestProduct";
import BestSellingProduct from "../../components/User/Home/BestSellingProduct";
import FavProduct from "../../components/User/Home/FavProduct";
import FilterProduct from "../../components/User/Home/FilterProduct";
import RecentlyViewedProducts from "../../components/User/Home/RecentlyViewedProducts";

export default function HomePage() {
    return (
        <div className="flex w-full flex-col gap-0 bg-gray-50 pb-16">
            <Slogan />
            <Banner />
            <RecentlyViewedProducts />
            <SuggestProduct />
            <BestSellingProduct />
            <FilterProduct />
        </div>
    );
}
