import { BottomNav } from "@/components/bottom-nav";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-[#f7f5f2] text-zinc-900">
      {children}
      <BottomNav />
    </div>
  );
}
