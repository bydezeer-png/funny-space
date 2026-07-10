import Link from "next/link";
import React from "react";
import { LayoutDashboard, Users, CreditCard, CalendarDays, PartyPopper, PackageSearch, Calculator, FileBarChart, LogOut, ScanLine, ShieldAlert, BarChart3, MessageSquare, Settings } from "lucide-react";
// ... (I will just do this precisely)
import { signOut } from "@/auth";
import { SidebarNavLink } from "@/components/SidebarNavLink";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import GlobalSearch from "@/components/GlobalSearch";

import { checkUserPermission, PERMISSIONS } from "@/lib/permissions";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  // Fetch current user to determine role
  const currentUser = await prisma.user.findUnique({
    where: { id: session.user?.id }
  });

  return (
    <div className="flex h-screen overflow-hidden bg-background" dir="rtl">
      <GlobalSearch />
      {/* Sidebar */}
      <aside className="w-64 bg-card border-l border-border hidden md:flex flex-col shadow-2xl relative z-20">
        <div className="p-6 flex items-center gap-3 border-b border-border/50 justify-start w-full">
          <div className="w-12 h-12 overflow-hidden rounded-xl border border-pink-100 bg-white p-1 shadow-sm shrink-0">
            <img src="/logo.png" alt="Soly's Space Logo" className="w-full h-full object-contain" />
          </div>
          <div className="text-right">
            <h1 className="text-sm font-black tracking-tight text-foreground leading-none font-display">Soly's Space</h1>
            <p className="text-[8px] text-primary font-extrabold tracking-[0.1em] uppercase mt-1">EMBRACE THE VIBE</p>
          </div>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          <SidebarNavLink href="/dashboard" icon={<LayoutDashboard size={18}/>}>الرئيسية</SidebarNavLink>
          
          {checkUserPermission(currentUser, [PERMISSIONS.BOOK_ENROLLMENT, PERMISSIONS.CONFIRM_ENROLLMENT, PERMISSIONS.CANCEL_ENROLLMENT, PERMISSIONS.RECORD_ATTENDANCE]) && (
            <SidebarNavLink href="/dashboard/reception" icon={<CreditCard size={18}/>}>الاستقبال والحجوزات</SidebarNavLink>
          )}
          
          {checkUserPermission(currentUser, [PERMISSIONS.RECORD_ATTENDANCE]) && (
            <SidebarNavLink href="/dashboard/scanner" icon={<ScanLine size={18} className="text-primary"/>}>مسح الدخول (QR)</SidebarNavLink>
          )}
          
          {checkUserPermission(currentUser, [PERMISSIONS.ADD_CLIENT, PERMISSIONS.EDIT_CLIENT, PERMISSIONS.DELETE_CLIENT]) && (
            <SidebarNavLink href="/dashboard/clients" icon={<Users size={18}/>}>العميلات (CRM)</SidebarNavLink>
          )}
          
          {checkUserPermission(currentUser, [PERMISSIONS.MANAGE_PROGRAMS]) && (
            <SidebarNavLink href="/dashboard/programs" icon={<CalendarDays size={18}/>}>البرامج</SidebarNavLink>
          )}
          
          {checkUserPermission(currentUser, [PERMISSIONS.MANAGE_WORKSHOPS, PERMISSIONS.MANAGE_EVENTS]) && (
            <SidebarNavLink href="/dashboard/events" icon={<PartyPopper size={18}/>}>الورش والحفلات</SidebarNavLink>
          )}
          
          {checkUserPermission(currentUser, [PERMISSIONS.SELL_POS, PERMISSIONS.RETURN_ORDER, PERMISSIONS.MANAGE_INVENTORY, PERMISSIONS.OPEN_CLOSE_SHIFT]) && (
            <SidebarNavLink href="/dashboard/pos" icon={<Calculator size={18}/>}>الكاشير (POS)</SidebarNavLink>
          )}
          
          {checkUserPermission(currentUser, [PERMISSIONS.VIEW_REPORTS, PERMISSIONS.ADD_EXPENSE]) && (
            <SidebarNavLink href="/dashboard/accounting" icon={<FileBarChart size={18}/>}>الحسابات والتقارير</SidebarNavLink>
          )}
          
          {checkUserPermission(currentUser, [PERMISSIONS.EDIT_CLIENT, PERMISSIONS.MANAGE_USERS]) && (
            <SidebarNavLink href="/dashboard/testimonials" icon={<MessageSquare size={18}/>}>آراء العميلات</SidebarNavLink>
          )}
          
          {currentUser?.role === "ADMIN" && (
            <div className="pt-4 mt-4 border-t border-border/50">
              <SidebarNavLink href="/dashboard/reports" icon={<BarChart3 size={18} className="text-red-500"/>}>
                <span className="text-red-600 font-bold">التقارير الشاملة</span>
              </SidebarNavLink>
              <SidebarNavLink href="/dashboard/settings" icon={<Settings size={18} className="text-red-500"/>}>
                <span className="text-red-600 font-bold">الإعدادات</span>
              </SidebarNavLink>
            </div>
          )}
        </nav>

        <div className="p-4 border-t border-border/50">
          <form action={async () => {
            "use server"
            await signOut({ redirectTo: "/" })
          }}>
            <button type="submit" className="flex items-center gap-3 text-foreground/70 hover:text-red-500 w-full px-4 py-3 rounded-xl transition-all hover:bg-red-500/10 font-semibold">
              <LogOut size={18} />
              تسجيل الخروج
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative z-10 bg-gradient-to-br from-background to-background/50">
        {/* Header */}
        <header className="h-20 bg-card/80 backdrop-blur-md border-b border-border flex items-center justify-between px-8 sticky top-0 z-30 transition-colors duration-300">
          <div className="md:hidden flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-secondary p-[2px]">
               <div className="w-full h-full bg-card rounded-full flex items-center justify-center text-[10px] font-bold text-primary">SS</div>
             </div>
             <h1 className="text-xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">Soly's Space</h1>
          </div>
          <div className="flex items-center gap-4 mr-auto">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center text-white font-bold shadow-lg ring-2 ring-background">
              {session.user?.name?.charAt(0).toUpperCase() || "A"}
            </div>
          </div>
        </header>

        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}


