import { Outlet, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/auth.store";
import { Button } from "@/components/ui/button";
import { LogOut, Home, User as UserIcon } from "lucide-react";
import api from "../lib/api";

export default function DashboardLayout({ isEditor = false }: { isEditor?: boolean }) {
  const { user, logout, refreshToken } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout", { refreshToken });
    } catch (e) {
      // Ignore
    } finally {
      logout();
      navigate("/login");
    }
  };

  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="flex items-center justify-between px-6 py-3 border-b shadow-sm">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <Home className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold cursor-pointer" onClick={() => navigate("/dashboard")}>
            CollabDocs
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 p-2 rounded-full">
              <UserIcon className="h-4 w-4 text-primary" />
            </div>
            <span className="text-sm font-medium">{user?.name}</span>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-hidden flex">
        {!isEditor && (
          <aside className="w-64 border-r bg-muted/20 hidden md:block">
            {/* Sidebar content will go here (Workspace switcher etc) */}
          </aside>
        )}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
