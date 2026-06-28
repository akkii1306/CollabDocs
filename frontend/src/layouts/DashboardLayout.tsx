import { Outlet, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/auth.store";
import { Button } from "@/components/ui/button";
import { LogOut, Home, User as UserIcon, Sparkles } from "lucide-react";
import api from "../lib/api";
import { motion } from "framer-motion";

export default function DashboardLayout() {
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
    <div className="flex h-screen flex-col bg-background relative overflow-hidden">
      {/* Subtle Background Gradients */}
      <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-purple-500/10 blur-[120px] pointer-events-none" />

      <motion.header 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="flex items-center justify-between px-6 py-3 border-b border-white/5 glass z-10"
      >
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")} className="hover:bg-primary/20 text-primary transition-colors">
            <Home className="h-5 w-5" />
          </Button>
          <div 
            className="flex items-center gap-2 cursor-pointer group" 
            onClick={() => navigate("/dashboard")}
          >
            <Sparkles className="h-5 w-5 text-primary group-hover:text-purple-400 transition-colors" />
            <h1 className="text-xl font-bold text-gradient tracking-tight">
              CollabDocs
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 bg-secondary/50 px-3 py-1.5 rounded-full border border-white/5">
            <div className="bg-gradient-to-br from-primary to-purple-600 p-1.5 rounded-full shadow-lg shadow-primary/20">
              <UserIcon className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-medium mr-2">{user?.name}</span>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout} className="border-white/10 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-all">
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </motion.header>

      <div className="flex-1 flex overflow-hidden z-10 relative">
        <main className="flex-1 overflow-auto bg-background/40">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
