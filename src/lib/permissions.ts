export const PERMISSIONS = {
  // User Management
  MANAGE_USERS: "CAN_MANAGE_USERS",
  
  // Client Management
  ADD_CLIENT: "CAN_ADD_CLIENT",
  EDIT_CLIENT: "CAN_EDIT_CLIENT",
  DELETE_CLIENT: "CAN_DELETE_CLIENT",
  
  // Reception & Booking
  BOOK_ENROLLMENT: "CAN_BOOK_ENROLLMENT",
  CONFIRM_ENROLLMENT: "CAN_CONFIRM_ENROLLMENT",
  CANCEL_ENROLLMENT: "CAN_CANCEL_ENROLLMENT",
  RECORD_ATTENDANCE: "CAN_RECORD_ATTENDANCE",
  
  // POS & Inventory
  SELL_POS: "CAN_SELL_POS",
  RETURN_ORDER: "CAN_RETURN_ORDER",
  MANAGE_INVENTORY: "CAN_MANAGE_INVENTORY",
  OPEN_CLOSE_SHIFT: "CAN_OPEN_CLOSE_SHIFT",
  
  // Accounting
  ADD_EXPENSE: "CAN_ADD_EXPENSE",
  VIEW_REPORTS: "CAN_VIEW_REPORTS",
  
  // Services
  MANAGE_PROGRAMS: "CAN_MANAGE_PROGRAMS",
  MANAGE_WORKSHOPS: "CAN_MANAGE_WORKSHOPS",
  MANAGE_EVENTS: "CAN_MANAGE_EVENTS",
} as const;

export type PermissionKey = keyof typeof PERMISSIONS;
export type PermissionValue = typeof PERMISSIONS[PermissionKey];

// Helper to get a localized name for UI
export const getPermissionName = (perm: string): string => {
  const map: Record<string, string> = {
    [PERMISSIONS.MANAGE_USERS]: "إدارة الموظفين (إضافة/تعديل/حذف)",
    [PERMISSIONS.ADD_CLIENT]: "إضافة عميلة جديدة",
    [PERMISSIONS.EDIT_CLIENT]: "تعديل بيانات عميلة",
    [PERMISSIONS.DELETE_CLIENT]: "مسح عميلة",
    [PERMISSIONS.BOOK_ENROLLMENT]: "حجز اشتراكات (برامج/ورش)",
    [PERMISSIONS.CONFIRM_ENROLLMENT]: "تأكيد الدفع للاشتراكات",
    [PERMISSIONS.CANCEL_ENROLLMENT]: "إلغاء اشتراك عميلة",
    [PERMISSIONS.RECORD_ATTENDANCE]: "تسجيل الحضور والانصراف",
    [PERMISSIONS.SELL_POS]: "البيع عبر الكاشير",
    [PERMISSIONS.RETURN_ORDER]: "إرجاع طلبات الكاشير",
    [PERMISSIONS.MANAGE_INVENTORY]: "إدارة المخزون والمشتريات",
    [PERMISSIONS.OPEN_CLOSE_SHIFT]: "فتح وإغلاق الورديات",
    [PERMISSIONS.ADD_EXPENSE]: "تسجيل المصروفات العامة",
    [PERMISSIONS.VIEW_REPORTS]: "الاطلاع على التقارير المالية",
    [PERMISSIONS.MANAGE_PROGRAMS]: "إدارة البرامج التدريبية",
    [PERMISSIONS.MANAGE_WORKSHOPS]: "إدارة الورش الفنية",
    [PERMISSIONS.MANAGE_EVENTS]: "إدارة الفعاليات والحفلات",
  }
  return map[perm] || perm;
}

// Helper to check user permissions
export function checkUserPermission(
  user: { role: string; permissions: string[] } | null | undefined, 
  requiredPermissions: string | string[], 
  matchAll = false
): boolean {
  if (!user) return false;
  if (user.role === "ADMIN") return true; // Admin has all permissions
  
  const userPerms = user.permissions || [];
  
  if (Array.isArray(requiredPermissions)) {
    if (matchAll) {
      return requiredPermissions.every(p => userPerms.includes(p));
    } else {
      return requiredPermissions.some(p => userPerms.includes(p));
    }
  }
  
  return userPerms.includes(requiredPermissions);
}

