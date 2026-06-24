import { Outlet } from "react-router-dom";
import Header from "../components/User/Ui/Header";
import Footer from "../components/User/Ui/Footer";
import ScrollToTopButton from "../components/User/Ui/ScrollToTopButton";
import AppToaster from "../components/common/AppToaster";
import { CartProvider } from "../contexts/cartProvider";

export default function UserLayout() {
    return (
        <CartProvider>
            <div className="min-h-screen flex flex-col bg-gray-50">
                <Header />
                <main className="flex-1 pt-[108px] md:pt-[72px]">
                    <Outlet />
                </main>
                <Footer />
                <ScrollToTopButton />
                <AppToaster />
            </div>
        </CartProvider>
    );
}