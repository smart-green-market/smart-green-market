import { BrowserRouter, Routes } from "react-router-dom";
import { AuthProvider } from "./contexts/authProvider";

// Modular Routes
import UserRoutes from "./routes/UserRoutes";
import SupplierRoutes from "./routes/SupplierRoutes";
import AdminRoutes from "./routes/AdminRoutes";
import DealerRoutes from "./routes/DealerRoutes";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {UserRoutes}
          {SupplierRoutes}
          {AdminRoutes}
          {DealerRoutes}
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
