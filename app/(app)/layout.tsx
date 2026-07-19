import { SidebarNav } from "@/components/sidebar-nav";
import { BottomNav } from "@/components/bottom-nav";
import { MobileHeader } from "@/components/mobile-header";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-bg text-ink">
      <SidebarNav />
      <div className="flex-1 min-w-0 flex flex-col">
        <MobileHeader />
        <main className="flex-1 min-w-0 px-4 py-5 pb-24 md:pb-10 md:px-8 md:py-8 max-w-6xl mx-auto w-full">
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
