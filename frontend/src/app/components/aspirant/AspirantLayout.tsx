import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import AspirantNavbar from "./AspirantNavbar";

type AspirantLayoutProps = {
  onLogout: () => void;
};

export default function AspirantLayout({ onLogout }: AspirantLayoutProps) {
  useEffect(() => {
    try {
      const raw = localStorage.getItem("authUser");
      const accessToken = localStorage.getItem("accessToken");
      if (!raw || !accessToken) return;

      const user = JSON.parse(raw);
      if (user?.id) {
        import("../../../socketio-service").then(({ authenticateSocket, disconnectSocket }) => {
          authenticateSocket(Number(user.id), user.role === "consultancy" ? "consultancy" : "student");
          return { authenticateSocket, disconnectSocket };
        }).catch(() => null);
      }
    } catch {
      // ignore malformed local storage state
    }

    return () => {
      import("../../../socketio-service").then(({ disconnectSocket }) => {
        disconnectSocket();
      }).catch(() => null);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#f0f4f8]">
      <AspirantNavbar onLogout={onLogout} />
      <div className="min-h-[calc(100vh-4rem)]">
        <Outlet />
      </div>
    </div>
  );
}
