import { Outlet } from "react-router-dom";

export default function AuthLayout() {
  return (
    <div className="flex min-h-screen bg-muted/40 items-center justify-center p-4">
      <div className="w-full max-w-md bg-background rounded-xl shadow-lg border p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-primary">CollabDocs</h1>
          <p className="text-sm text-muted-foreground mt-2">Sign in to collaborate</p>
        </div>
        <Outlet />
      </div>
    </div>
  );
}
