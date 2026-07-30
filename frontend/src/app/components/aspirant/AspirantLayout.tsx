import { Outlet } from "react-router-dom";
import AspirantNavbar from "./AspirantNavbar";

type AspirantLayoutProps = {
  onLogout: () => void;
};

export default function AspirantLayout({ onLogout }: AspirantLayoutProps) {
  return (
    <div className="min-h-screen bg-[#f0f4f8]">
      <AspirantNavbar onLogout={onLogout} />
      <div className="min-h-[calc(100vh-4rem)]">
        <Outlet />
      </div>
    </div>
  );
}
