import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { supplierService } from "../../../services/api/suppilerService";

function getLoggedInUser() {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

async function fetchCurrentSupplier() {
  try {
    const profile = await supplierService.getMine();
    if (profile) return profile;
  } catch (error) {
    if (error.response?.status !== 404) throw error;
  }

  const user = getLoggedInUser();
  const supplierId =
    user?.supplier_id ?? user?.supplier?.id ?? user?.supplier ?? null;

  if (supplierId) {
    return supplierService.getById(supplierId);
  }

  return null;
}

export default function Logo() {
  const [companyName, setCompanyName] = useState("Kamereo");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const supplier = await supplierService.getAll();
        setCompanyName(supplier[0].company_name);
      } catch (error) {
        console.error("Lỗi tải tên nhà cung cấp:", error);
      }
    };
    load();
  }, []);

  return (
    <div className="w-auto flex items-center px-2">
      <span className="text-emerald-950 text-xl font-bold font-['Noto_Serif',serif] leading-7">
        <NavLink to="/nha-cung-cap">{companyName}</NavLink>
      </span>
    </div>
  );
}
