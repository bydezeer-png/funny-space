import React from "react";
import { Settings } from "lucide-react";
import { SettingsTabs } from "./SettingsTabs";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-12 h-12 bg-pink-50 text-primary rounded-2xl flex items-center justify-center border border-pink-100 shadow-sm">
          <Settings size={24} />
        </div>
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">الإعدادات الشاملة</h1>
          <p className="text-foreground/60 font-medium">التحكم في معلومات المكان، إدارة الموظفين، وسجل الحركات.</p>
        </div>
      </div>

      {/* Tabs */}
      <SettingsTabs />

      {/* Content */}
      <div className="pt-4">
        {children}
      </div>
    </div>
  );
}
