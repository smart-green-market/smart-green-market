import { Outlet } from "react-router-dom";
import ProfileSidebar from "../components/User/Profile/ProfileSidebar";

export default function UserProfileLayout() {
  return (
    <div className="mx-auto w-full max-w-[1200px] py-12">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[320px_1fr]">
        <ProfileSidebar />
        <Outlet />
      </div>
    </div>
  );
}
