import { BrowserRouter, Routes, Route } from "react-router-dom";
import UserLayout from "./layouts/UserLayout";
import { HomePage } from "./pages/User/Home";

export default function App() {
    return (
        <BrowserRouter>
            {/* <AuthProvider> */}
                <Routes>
                    {/* User */}
                    <Route path="/" element={<UserLayout />}>
                        <Route index element={<HomePage />} />
                        <Route path="trang-chu" element={<HomePage />} />
                    </Route>
                </Routes>
            {/* </AuthProvider> */}
        </BrowserRouter>
    );
}