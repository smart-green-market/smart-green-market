import Banner from "../../components/User/Home/Banner";
import ViewAllProductsCTA from "../../components/User/Home/ViewAllProductsCTA";
import CommitmentSection from "../../components/User/Home/CommitmentSection";
import StoreStatsSection from "../../components/User/Home/StoreStatsSection";
import QuickReviewsSection from "../../components/User/Home/QuickReviewsSection";
import ScrollReveal from "../../components/User/Ui/ScrollReveal";
import { useBuyerCatalog } from "../../hooks/useBuyerCatalog";
import Slogan from "../../components/User/Home/Slogan";

export default function HomePage() {
    const { products } = useBuyerCatalog();

    return (
        <div className="flex w-full flex-col gap-0 bg-gray-50 pb-16">
            <ScrollReveal variant="fade" duration={500}>
                <Slogan />
            </ScrollReveal>

            <ScrollReveal variant="zoom-in" delay={80} duration={800}>
                <Banner />
            </ScrollReveal>

            <ScrollReveal variant="fade-up" delay={60}>
                <ViewAllProductsCTA productCount={products.length} />
            </ScrollReveal>

            <CommitmentSection />
            <StoreStatsSection />
            <QuickReviewsSection />
        </div>
    );
}
