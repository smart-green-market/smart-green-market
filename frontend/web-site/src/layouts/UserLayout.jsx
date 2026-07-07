import { Outlet } from "react-router-dom";
import Header from "../components/User/Ui/Header";
import Footer from "../components/User/Ui/Footer";
import ScrollToTopButton from "../components/User/Ui/ScrollToTopButton";
import ScrollToTopOnNavigate from "../components/User/Ui/ScrollToTopOnNavigate";
import { CartProvider } from "../contexts/cartProvider";

export default function UserLayout() {
    return (
        <CartProvider>
            <ScrollToTopOnNavigate />
            <div className="min-h-screen flex flex-col bg-gray-50">
                <Header />
                <main className="flex-1">
                    <Outlet />
                </main>
                <Footer />
                <ScrollToTopButton />
            </div>
        </CartProvider>
    );
}