import { Outlet } from "react-router-dom";
import Header from "../components/User/Ui/Header";
import Footer from "../components/User/Ui/Footer";

export default function UserLayout() {
    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <Header />
            <main className="flex-1 pt-[72px]">
                <Outlet />
            </main>
            <Footer />
        </div>
    );
}