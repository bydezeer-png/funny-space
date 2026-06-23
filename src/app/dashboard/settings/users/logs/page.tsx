import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { ShieldCheck, Calendar, Info, Users } from "lucide-react"

export const metadata = {
  title: 'سجل الحركات | Soly\'s Space',
}

export default async function AuditLogsPage() {
  const session = await auth()
  
  if (!session?.user) {
    redirect("/login")
  }

  // Security check: Only Admins can view this page
  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id }
  })
  
  if (currentUser?.role !== "ADMIN") {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <div className="w-24 h-24 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-6 shadow-sm">
          <ShieldCheck size={48} />
        </div>
        <h2 className="text-3xl font-black text-foreground mb-4">غير مصرح لك بالدخول</h2>
        <p className="text-foreground/60 text-lg">هذه الصفحة مخصصة لمديري النظام فقط (ADMIN) لعرض سجل الحركات.</p>
      </div>
    )
  }

  const logs = await prisma.auditLog.findMany({
    take: 100,
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: { name: true, role: true }
      }
    }
  })

  // Action Names Localization
  const actionNames: Record<string, string> = {
    // User Management
    "CREATE_USER": "إضافة موظف",
    "UPDATE_USER": "تعديل بيانات موظف",
    "TOGGLE_USER_STATUS": "تغيير حالة موظف (حظر/تفعيل)",
    "DELETE_USER": "حذف موظف",
    // Clients & Enrollments
    "CREATE_CLIENT": "إضافة عميلة جديدة",
    "DELETE_CLIENT": "حذف عميلة",
    "ADD_PAYMENT": "تسجيل دفعة مالية",
    "CONFIRM_ENROLLMENT": "تأكيد اشتراك عميلة",
    "DELETE_ENROLLMENT": "حذف اشتراك عميلة",
    "RECORD_ATTENDANCE": "تسجيل حضور عميلة",
    // POS & Inventory
    "CREATE_POS_ORDER": "إنشاء طلب مبيعات كاشير",
    "RETURN_POS_ORDER": "إرجاع طلب كاشير",
    "OPEN_SHIFT": "فتح وردية كاشير",
    "CLOSE_SHIFT": "إغلاق وردية كاشير",
    "RESTOCK_INVENTORY": "شراء بضاعة (إضافة للمخزون)",
    "CREATE_INVENTORY_ITEM": "إضافة منتج جديد للمخزون",
    "UPDATE_INVENTORY_ITEM": "تعديل بيانات منتج",
    // Programs & Events
    "CREATE_PROGRAM_CATEGORY": "إضافة فئة برامج",
    "DELETE_PROGRAM_CATEGORY": "حذف فئة برامج",
    "CREATE_PROGRAM": "إضافة برنامج تدريبي",
    "UPDATE_PROGRAM": "تعديل برنامج تدريبي",
    "DELETE_PROGRAM": "حذف برنامج تدريبي",
    "CREATE_WORKSHOP": "إضافة ورشة فنية",
    "UPDATE_WORKSHOP": "تعديل ورشة فنية",
    "DELETE_WORKSHOP": "حذف ورشة فنية",
    "CREATE_EVENT": "إضافة حفلة / فعالية",
    "UPDATE_EVENT": "تعديل حفلة / فعالية",
    "DELETE_EVENT": "حذف حفلة / فعالية",
    // Accounting
    "CREATE_EXPENSE": "تسجيل مصروف خارجي",
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary mb-2 flex items-center gap-3">
            سجل نشاط الموظفين <ShieldCheck className="text-primary"/>
          </h1>
          <p className="text-foreground/60 font-medium">
            تتبع كافة الإجراءات المهمة التي يقوم بها الموظفون في النظام. (أحدث 100 حركة)
          </p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-[2rem] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-muted/50 border-b border-border/50 text-foreground/60 text-sm">
                <th className="p-4 font-bold">الموظف/ة</th>
                <th className="p-4 font-bold">الحركة</th>
                <th className="p-4 font-bold">التفاصيل (التغييرات)</th>
                <th className="p-4 font-bold">التاريخ والوقت</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {logs.map(log => {
                let parsedDetails: any = log.details || null

                // Translate common keys for better UX
                const keyTranslations: Record<string, string> = {
                  orderId: "رقم الطلب",
                  totalAmount: "الإجمالي (ج.م)",
                  amountPaid: "المبلغ المدفوع",
                  amountToAdd: "قيمة الدفعة",
                  clientName: "اسم العميلة",
                  shiftId: "معرف الوردية",
                  actualCash: "النقدية الفعلية (ج.م)",
                  startingCash: "عُهدة البداية (ج.م)",
                  notes: "ملاحظات",
                  isMakeup: "حصة تعويضية؟",
                  amount: "المبلغ",
                  category: "التصنيف",
                  description: "التفاصيل",
                  name: "الاسم",
                  quantityAdded: "الكمية المضافة",
                  totalCost: "إجمالي التكلفة",
                  enrollmentId: "معرف الاشتراك",
                }

                const renderDetails = (details: any) => {
                  if (!details) return "لا توجد تفاصيل إضافية";
                  return Object.entries(details).map(([k, v]) => {
                    const label = keyTranslations[k] || k;
                    let valStr = String(v);
                    if (typeof v === 'boolean') valStr = v ? "نعم" : "لا";
                    if (valStr === '' || valStr === 'undefined' || valStr === 'null') valStr = "—";
                    return (
                      <div key={k} className="flex gap-2">
                        <span className="font-bold text-primary">{label}:</span>
                        <span className="text-foreground/90 font-medium">{valStr}</span>
                      </div>
                    )
                  })
                }

                return (
                  <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-2 font-black text-foreground">
                        <Users size={16} className="text-primary"/> {log.user?.name || "مستخدم محذوف"}
                      </div>
                      <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">{log.user?.role}</span>
                    </td>
                    <td className="p-4 font-bold text-foreground/80">
                      <span className="bg-muted px-2 py-1 rounded-lg text-xs">
                        {actionNames[log.action] || log.action}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="text-xs text-foreground/70 flex flex-col gap-1">
                        {renderDetails(parsedDetails)}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-sm text-foreground/70 font-bold dir-ltr w-max">
                        <Calendar size={14} />
                        {new Date(log.createdAt).toLocaleString('ar-EG')}
                      </div>
                    </td>
                  </tr>
                )
              })}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-foreground/50 font-medium">
                    لم يتم تسجيل أي حركات حتى الآن.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
