import { History } from "lucide-react";
import { useRecentlyViewed } from "../../../hooks/useRecentlyViewed";
import DragScrollCarousel from "../Ui/DragScrollCarousel";
import SuggestProductCard from "./SuggestProductCard";

export default function RecentlyViewedProducts() {
    const { items } = useRecentlyViewed();

    if (!items.length) {
        return null;
    }

    return (
        <section className="mx-auto w-full max-w-[1280px] px-10 pt-10">
            <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <History className="h-6 w-6 text-emerald-800" />
                    <h2 className="text-2xl font-bold text-emerald-950">
                        Xem gần đây
                    </h2>
                </div>
            </div>

            <DragScrollCarousel showNav={items.length > 3}>
                {items.map((product) => (
                    <SuggestProductCard key={product.id} {...product} />
                ))}
            </DragScrollCarousel>
        </section>
    );
}
