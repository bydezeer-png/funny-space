import Link from "next/link";
import React from "react";
import { LayoutDashboard, Users, CreditCard, CalendarDays, PartyPopper, PackageSearch, Calculator, FileBarChart, LogOut, ScanLine, ShieldAlert, BarChart3, MessageSquare, Settings, Menu } from "lucide-react";
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
      
      {/* Sidebar mobile toggle */}
      <input type="checkbox" id="dashboard-sidebar-toggle" className="hidden peer" />
      
      {/* Sidebar Overlay */}
      <label htmlFor="dashboard-sidebar-toggle" className="fixed inset-0 bg-black/40 z-40 hidden peer-checked:block md:peer-checked:hidden"></label>

      {/* Sidebar */}
      <aside className="w-64 bg-card border-l border-border flex flex-col shadow-2xl fixed inset-y-0 right-0 z-50 transform translate-x-full peer-checked:translate-x-0 transition-transform duration-300 ease-in-out md:static md:translate-x-0 md:flex">
        <div className="p-6 flex items-center justify-between border-b border-border/50 w-full">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 overflow-hidden rounded-xl border border-pink-100 bg-white p-1 shadow-sm shrink-0">
              <img src="/logo.png" alt="Soly's Space Logo" className="w-full h-full object-contain" />
            </div>
            <div className="text-right">
              <h1 className="text-sm font-black tracking-tight text-foreground leading-none font-display">Soly's Space</h1>
              <p className="text-[8px] text-primary font-extrabold tracking-[0.1em] uppercase mt-1">EMBRACE THE VIBE</p>
            </div>
          </div>
          <label htmlFor="dashboard-sidebar-toggle" className="md:hidden cursor-pointer p-2 hover:bg-border/50 rounded-lg text-foreground/55 hover:text-foreground">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </label>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          <label htmlFor="dashboard-sidebar-toggle" className="block w-full cursor-pointer">
            <SidebarNavLink href="/dashboard" icon={<LayoutDashboard size={18}/>}>الرئيسية</SidebarNavLink>
          </label>
          
          {checkUserPermission(currentUser, [PERMISSIONS.BOOK_ENROLLMENT, PERMISSIONS.CONFIRM_ENROLLMENT, PERMISSIONS.CANCEL_ENROLLMENT, PERMISSIONS.RECORD_ATTENDANCE]) && (
            <label htmlFor="dashboard-sidebar-toggle" className="block w-full cursor-pointer">
              <SidebarNavLink href="/dashboard/reception" icon={<CreditCard size={18}/>}>الاستقبال والحجوزات</SidebarNavLink>
            </label>
          )}
          
          {checkUserPermission(currentUser, [PERMISSIONS.RECORD_ATTENDANCE]) && (
            <label htmlFor="dashboard-sidebar-toggle" className="block w-full cursor-pointer">
              <SidebarNavLink href="/dashboard/scanner" icon={<ScanLine size={18} className="text-primary"/>}>مسح الدخول (QR)</SidebarNavLink>
            </label>
          )}
          
          {checkUserPermission(currentUser, [PERMISSIONS.ADD_CLIENT, PERMISSIONS.EDIT_CLIENT, PERMISSIONS.DELETE_CLIENT]) && (
            <label htmlFor="dashboard-sidebar-toggle" className="block w-full cursor-pointer">
              <SidebarNavLink href="/dashboard/clients" icon={<Users size={18}/>}>العميلات (CRM)</SidebarNavLink>
            </label>
          )}
          
          {checkUserPermission(currentUser, [PERMISSIONS.MANAGE_PROGRAMS]) && (
            <label htmlFor="dashboard-sidebar-toggle" className="block w-full cursor-pointer">
              <SidebarNavLink href="/dashboard/programs" icon={<CalendarDays size={18}/>}>البرامج</SidebarNavLink>
            </label>
          )}
          
          {checkUserPermission(currentUser, [PERMISSIONS.MANAGE_WORKSHOPS, PERMISSIONS.MANAGE_EVENTS]) && (
            <label htmlFor="dashboard-sidebar-toggle" className="block w-full cursor-pointer">
              <SidebarNavLink href="/dashboard/events" icon={<PartyPopper size={18}/>}>الورش والحفلات</SidebarNavLink>
            </label>
          )}
          
          {checkUserPermission(currentUser, [PERMISSIONS.SELL_POS, PERMISSIONS.RETURN_ORDER, PERMISSIONS.MANAGE_INVENTORY, PERMISSIONS.OPEN_CLOSE_SHIFT]) && (
            <label htmlFor="dashboard-sidebar-toggle" className="block w-full cursor-pointer">
              <SidebarNavLink href="/dashboard/pos" icon={<Calculator size={18}/>}>الكاشير (POS)</SidebarNavLink>
            </label>
          )}
          
          {checkUserPermission(currentUser, [PERMISSIONS.VIEW_REPORTS, PERMISSIONS.ADD_EXPENSE]) && (
            <label htmlFor="dashboard-sidebar-toggle" className="block w-full cursor-pointer">
              <SidebarNavLink href="/dashboard/accounting" icon={<FileBarChart size={18}/>}>الحسابات والتقارير</SidebarNavLink>
            </label>
          )}
          
          {checkUserPermission(currentUser, [PERMISSIONS.EDIT_CLIENT, PERMISSIONS.MANAGE_USERS]) && (
            <label htmlFor="dashboard-sidebar-toggle" className="block w-full cursor-pointer">
              <SidebarNavLink href="/dashboard/testimonials" icon={<MessageSquare size={18}/>}>آراء العميلات</SidebarNavLink>
            </label>
          )}
          
          {currentUser?.role === "ADMIN" && (
            <div className="pt-4 mt-4 border-t border-border/50">
              <label htmlFor="dashboard-sidebar-toggle" className="block w-full cursor-pointer">
                <SidebarNavLink href="/dashboard/reports" icon={<BarChart3 size={18} className="text-red-500"/>}>
                  <span className="text-red-600 font-bold">التقارير الشاملة</span>
                </SidebarNavLink>
              </label>
              <label htmlFor="dashboard-sidebar-toggle" className="block w-full cursor-pointer">
                <SidebarNavLink href="/dashboard/settings" icon={<Settings size={18} className="text-red-500"/>}>
                  <span className="text-red-600 font-bold">الإعدادات</span>
                </SidebarNavLink>
              </label>
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
        <header className="h-20 bg-card/80 backdrop-blur-md border-b border-border flex items-center justify-between px-6 md:px-8 sticky top-0 z-30 transition-colors duration-300">
          <div className="md:hidden flex items-center gap-3">
             <label htmlFor="dashboard-sidebar-toggle" className="cursor-pointer p-2 hover:bg-border/30 rounded-lg text-foreground">
               <Menu size={20} />
             </label>
             <div className="w-9 h-9 overflow-hidden rounded-xl border border-pink-100 bg-white p-0.5 shadow-xs shrink-0">
               <img src="/logo.png" alt="Soly's Space" className="w-full h-full object-contain" />
             </div>
             <h1 className="text-lg font-black tracking-tight text-foreground leading-none font-display">Soly's Space</h1>
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


