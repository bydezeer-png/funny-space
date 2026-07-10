import React from "react";
import { ShieldAlert } from "lucide-react";
import Link from "next/link";

export default function AccessDenied({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 bg-card border border-border/50 rounded-[2.5rem] shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6 shadow-sm border border-red-100">
        <ShieldAlert size={40} />
      </div>
      <h2 className="text-3xl font-black text-foreground mb-3">عفواً، الدخول غير مصرح!</h2>
      <p className="text-foreground/60 font-semibold max-w-md mb-8">
        {message || "لا تملك الصلاحيات الكافية للوصول إلى هذه الصفحة. يرجى التواصل مع إدارة النظام إذا كنت تعتقد أن هذا خطأ."}
      </p>
      <Link 
        href="/dashboard" 
        className="bg-primary hover:bg-primary/95 text-white px-6 py-3 rounded-xl font-bold transition-all hover:scale-[1.02] active:scale-95 shadow-md shadow-pink-100/30 text-sm"
      >
        العودة للرئيسية
      </Link>
    </div>
  );
}
