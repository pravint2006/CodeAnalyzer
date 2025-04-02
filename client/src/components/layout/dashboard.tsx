import { Sidebar } from "./sidebar";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
//import { useState } from "react"; //removed unused import

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  //const [showSidebar, setShowSidebar] = useState(true); //removed unused state
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <div className="border-b p-4">
          <h1 className="font-semibold">Vulnerability Dashboard</h1>
        </div>
        <main className="flex-1 overflow-auto bg-background">
          <div className="container mx-auto p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}