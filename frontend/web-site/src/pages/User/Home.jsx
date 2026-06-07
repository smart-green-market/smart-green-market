import Slogan from "../../components/User/Home/Slogan";
import Banner from "../../components/User/Home/Banner";
import SuggestProduct from "../../components/User/Home/SuggestProduct";
import BestSellingProduct from "../../components/User/Home/BestSellingProduct";
import FavProduct from "../../components/User/Home/FavProduct";

export function HomePage() {
    return (
        <div className="w-full flex flex-col items-center gap-0 pb-16 bg-gray-50">
            <Slogan />
            <Banner />
            <SuggestProduct />
            <BestSellingProduct />
            <FavProduct />
        </div>
    );
}