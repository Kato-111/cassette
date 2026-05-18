import { SidebarTrigger } from "@/components/ui/sidebar";

export const MobileTopBar = () => (
  <div className="flex items-center justify-between gap-2 border-b border-white/8 bg-background px-3 py-2 md:hidden">
    <h1 className="font-ephesis text-2xl font-bold">Cassette</h1>
    <SidebarTrigger />
  </div>
);
