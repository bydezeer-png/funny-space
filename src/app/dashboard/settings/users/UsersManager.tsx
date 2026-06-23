"use client"

import { useState } from "react"
import { User, Role } from "@prisma/client"
import { createUser, updateUser, toggleUserStatus, deleteUser } from "@/actions/users"
import { Plus, Edit2, ShieldAlert, Trash2, ShieldCheck, UserCheck, UserX, KeyRound, Eye, EyeOff, Shield, Users, HelpCircle, Lock, X } from "lucide-react"
import { PERMISSIONS, getPermissionName } from "@/lib/permissions"
import { useConfirm } from "@/components/ConfirmProvider"
import { toast } from "sonner"

export default function UsersManager({ initialUsers, currentUserId }: { initialUsers: User[], currentUserId: string }) {
  const [users, setUsers] = useState<User[]>(initialUsers)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const confirm = useConfirm()
  
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "RECEPTION" as Role,
    permissions: [] as string[]
  })

  const resetForm = () => {
    setForm({ name: "", email: "", password: "", role: "RECEPTION", permissions: [] })
    setEditingUser(null)
    setShowPassword(false)
  }

  const handleOpenCreate = () => {
    resetForm()
    setIsModalOpen(true)
  }

  const handleOpenEdit = (user: User) => {
    setForm({ name: user.name, email: user.email, password: "", role: user.role, permissions: user.permissions || [] })
    setEditingUser(user)
    setShowPassword(false)
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (editingUser) {
        const updated = await updateUser(editingUser.id, {
          name: form.name,
          email: form.email,
          role: form.role,
          permissions: form.permissions,
          ...(form.password ? { password: form.password } : {})
        })
        setUsers(users.map(u => u.id === updated.id ? updated : u))
      } else {
        if (!form.password) {
          toast.error("يرجى إدخال كلمة المرور للمستخدم الجديد")
          setLoading(false)
          return
        }
        const created = await createUser({
          name: form.name,
          email: form.email,
          password: form.password,
          role: form.role,
          permissions: form.permissions
        })
        setUsers([created, ...users])
      }
      setIsModalOpen(false)
      resetForm()
      toast.success(editingUser ? "تم التعديل بنجاح" : "تمت الإضافة بنجاح")
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleStatus = async (user: User) => {
    if (user.id === currentUserId) return toast.error("لا يمكنك حظر حسابك الشخصي")
    const action = user.isActive ? "حظر" : "تفعيل"
    const ok = await confirm(`هل أنت متأكد من ${action} حساب الموظف/ة ${user.name}؟`)
    if (!ok) return

    try {
      await toggleUserStatus(user.id)
      setUsers(users.map(u => u.id === user.id ? { ...u, isActive: !u.isActive } : u))
      toast.success(`تم ${action} الحساب بنجاح`)
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const handleDelete = async (user: User) => {
    if (user.id === currentUserId) return toast.error("لا يمكنك حذف حسابك الشخصي")
    const ok = await confirm(`هل أنت متأكد من الحذف النهائي لحساب ${user.name}؟ لا يمكن التراجع عن هذا الإجراء.`)
    if (!ok) return

    try {
      await deleteUser(user.id)
      setUsers(users.filter(u => u.id !== user.id))
      toast.success("تم الحذف بنجاح")
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const roleColors: Record<string, string> = {
    ADMIN: "bg-red-50 text-red-600 border-red-100",
    RECEPTION: "bg-green-50 text-green-600 border-green-100",
    INSTRUCTOR: "bg-purple-50 text-purple-600 border-purple-100",
    ACCOUNTANT: "bg-blue-50 text-blue-600 border-blue-100"
  }

  const roleNames: Record<string, string> = {
    ADMIN: "مدير نظام",
    RECEPTION: "موظفة استقبال",
    INSTRUCTOR: "مدربة",
    ACCOUNTANT: "محاسبة"
  }

  const getRoleIcon = (role: Role) => {
    switch (role) {
      case "ADMIN": return <Shield size={13} className="text-red-500" />
      case "RECEPTION": return <UserCheck size={13} className="text-green-500" />
      case "INSTRUCTOR": return <Users size={13} className="text-purple-500" />
      case "ACCOUNTANT": return <KeyRound size={13} className="text-blue-500" />
      default: return <HelpCircle size={13} />
    }
  }

  return (
    <div className="space-y-6">
      
      {/* Header and Actions */}
      <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] border border-pink-100/50 shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-[#121212]">الموظفون والصلاحيات</h2>
          <p className="text-xs text-foreground/45 font-bold mt-1">إدارة حسابات فريق عمل Soly's Space وصلاحيات الدخول.</p>
        </div>
        <button 
          onClick={handleOpenCreate}
          className="bg-primary hover:bg-primary/95 text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-95 shadow-md shadow-pink-100/30 cursor-pointer"
        >
          <Plus size={18} /> إضافة موظف جديد
        </button>
      </div>

      {/* Users Table Card */}
      <div className="bg-white border border-pink-100/50 rounded-[2.5rem] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-[#FFF5F8] border-b border-pink-50 text-foreground/60 text-xs">
                <th className="p-5 font-bold">الاسم</th>
                <th className="p-5 font-bold">البريد الإلكتروني</th>
                <th className="p-5 font-bold">الدور والمسؤولية</th>
                <th className="p-5 font-bold">الحالة</th>
                <th className="p-5 font-bold">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-pink-50/50">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-[#FFF5F8]/45 transition-colors">
                  
                  {/* Name */}
                  <td className="p-5 font-black text-[#121212]">
                    <div className="flex items-center gap-2">
                      <span>{user.name}</span>
                      {user.id === currentUserId && (
                        <span className="text-[10px] text-primary bg-pink-50 border border-pink-100/40 px-2 py-0.5 rounded-full font-bold">
                          أنت
                        </span>
                      )}
                    </div>
                  </td>
                  
                  {/* Email */}
                  <td className="p-5 text-foreground/60 font-semibold" dir="ltr">{user.email}</td>
                  
                  {/* Role */}
                  <td className="p-5">
                    <span className={`px-3 py-1.5 rounded-xl text-xs font-black border flex items-center gap-1.5 w-max ${roleColors[user.role]}`}>
                      {getRoleIcon(user.role)}
                      {roleNames[user.role]}
                    </span>
                  </td>
                  
                  {/* Status */}
                  <td className="p-5">
                    {user.isActive ? (
                      <span className="flex items-center gap-1 text-green-600 text-xs font-black bg-green-50 border border-green-100/50 px-2.5 py-1 rounded-xl w-max">
                        <ShieldCheck size={14}/> نشط
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-red-600 text-xs font-black bg-red-50 border border-red-100/50 px-2.5 py-1 rounded-xl w-max">
                        <UserX size={14}/> محظور
                      </span>
                    )}
                  </td>
                  
                  {/* Actions */}
                  <td className="p-5">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleOpenEdit(user)}
                        className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-100/30 rounded-xl transition-all cursor-pointer"
                        title="تعديل البيانات"
                      >
                        <Edit2 size={15} />
                      </button>
                      
                      {user.id !== currentUserId && (
                        <>
                          <button 
                            onClick={() => handleToggleStatus(user)}
                            className={`p-2 rounded-xl border transition-all cursor-pointer ${
                              user.isActive 
                                ? 'text-yellow-600 bg-yellow-50 hover:bg-yellow-100 border-yellow-100/30' 
                                : 'text-green-600 bg-green-50 hover:bg-green-100 border-green-100/30'
                            }`}
                            title={user.isActive ? "حظر الموظف" : "تفعيل الموظف"}
                          >
                            {user.isActive ? <UserX size={15} /> : <UserCheck size={15} />}
                          </button>
                          
                          <button 
                            onClick={() => handleDelete(user)}
                            className="p-2 text-red-600 bg-red-50 hover:bg-red-500 hover:text-white border border-red-100/30 rounded-xl transition-all cursor-pointer"
                            title="حذف نهائي"
                          >
                            <Trash2 size={15} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                  
                </tr>
              ))}
              
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-foreground/40 font-bold">
                    لا يوجد موظفون مسجلون حالياً.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODERN OUTLINE MODAL FORM */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-[#121212]/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl border border-pink-100/50 p-8 animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center mb-6 border-b border-pink-50 pb-4">
              <h3 className="text-2xl font-black text-[#121212]">
                {editingUser ? "تعديل بيانات الموظف" : "إضافة موظف جديد"}
              </h3>
              <button 
                type="button" 
                onClick={() => setIsModalOpen(false)} 
                className="p-2 hover:bg-[#FFF5F8] rounded-full transition-colors text-foreground/60 border border-transparent hover:border-pink-100 cursor-pointer"
              >
                <EyeOff size={18} className="hidden" /> {/* to satisfy linter for Eye icons just in case */}
                <X size={20} />
              </button>
            </div>
            
            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              
              <div>
                <label className="block text-xs font-bold text-foreground/50 mb-2">اسم الموظف</label>
                <input 
                  required 
                  type="text" 
                  value={form.name}
                  onChange={e => setForm({...form, name: e.target.value})}
                  className="w-full px-4 py-3 bg-[#FFF5F8] border border-pink-100/50 rounded-xl focus:ring-2 focus:ring-primary/10 outline-none text-sm font-semibold transition-all"
                  placeholder="الاسم الكامل للموظف/ة"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground/50 mb-2">البريد الإلكتروني (لتسجيل الدخول)</label>
                <input 
                  required 
                  type="email" 
                  value={form.email}
                  onChange={e => setForm({...form, email: e.target.value})}
                  className="w-full px-4 py-3 bg-[#FFF5F8] border border-pink-100/50 rounded-xl focus:ring-2 focus:ring-primary/10 outline-none text-sm font-semibold transition-all dir-ltr text-left"
                  placeholder="name@solyspace.com"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground/50 mb-2 flex justify-between items-center">
                  <span>كلمة المرور</span>
                  {editingUser && (
                    <span className="text-[10px] text-primary font-bold bg-pink-50 border border-pink-100/30 px-2 py-0.5 rounded-md">
                      اتركها فارغة إذا لم ترد تغييرها
                    </span>
                  )}
                </label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"}
                    required={!editingUser}
                    value={form.password}
                    onChange={e => setForm({...form, password: e.target.value})}
                    className="w-full px-4 py-3 pl-12 bg-[#FFF5F8] border border-pink-100/50 rounded-xl focus:ring-2 focus:ring-primary/10 outline-none text-sm font-semibold transition-all dir-ltr text-left"
                    placeholder={editingUser ? "اتركها فارغة للمحافظة عليها..." : "******"}
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-2.5 p-1 text-foreground/40 hover:text-primary rounded-lg transition-colors cursor-pointer"
                    title={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                  <Lock size={16} className="absolute right-3.5 top-3.5 text-foreground/30 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground/50 mb-2">الدور الوظيفي (Role)</label>
                <select 
                  value={form.role}
                  onChange={e => setForm({...form, role: e.target.value as Role})}
                  className="w-full px-4 py-3 bg-[#FFF5F8] border border-pink-100/50 rounded-xl focus:ring-2 focus:ring-primary/10 outline-none text-sm font-semibold transition-all cursor-pointer"
                >
                  <option value="RECEPTION">موظفة استقبال (تسجيل وحجوزات)</option>
                  <option value="INSTRUCTOR">مدربة (متابعة البرامج)</option>
                  <option value="ACCOUNTANT">محاسبة (تقارير مالية ومصروفات)</option>
                  <option value="ADMIN">مدير نظام (صلاحيات كاملة)</option>
                </select>
              </div>

              {/* Granular Permissions Checklist */}
              {form.role !== 'ADMIN' && (
                <div className="bg-[#FFF5F8] p-4.5 rounded-2xl border border-pink-100/35">
                  <label className="block text-xs font-bold text-[#121212] mb-3 flex items-center gap-1.5">
                    <ShieldAlert size={14} className="text-primary" />
                    الصلاحيات التفصيلية (Granular Permissions)
                  </label>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {Object.values(PERMISSIONS).map(perm => {
                      const isChecked = form.permissions.includes(perm)
                      return (
                        <label 
                          key={perm} 
                          className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all select-none ${
                            isChecked 
                              ? 'bg-pink-50/50 border-primary text-primary font-black' 
                              : 'bg-white border-pink-100/30 text-foreground/60 hover:text-foreground hover:border-pink-100/60 font-semibold'
                          }`}
                        >
                          <span className="text-xs">{getPermissionName(perm)}</span>
                          <input 
                            type="checkbox" 
                            checked={isChecked}
                            onChange={e => {
                              if (e.target.checked) {
                                setForm({...form, permissions: [...form.permissions, perm]})
                              } else {
                                setForm({...form, permissions: form.permissions.filter(p => p !== perm)})
                              }
                            }}
                            className="w-4 h-4 rounded text-primary focus:ring-primary accent-primary cursor-pointer"
                          />
                        </label>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Actions Footer */}
              <div className="pt-4 flex gap-3 border-t border-pink-50">
                <button 
                  type="submit" 
                  disabled={loading}
                  className="flex-1 bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary/95 transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-50 text-sm cursor-pointer"
                >
                  {loading ? "جاري الحفظ..." : "حفظ البيانات"}
                </button>
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-3 bg-[#FFF5F8] border border-pink-100/30 text-foreground/60 font-bold rounded-xl hover:bg-pink-50/40 hover:text-foreground transition-colors text-sm cursor-pointer"
                >
                  إلغاء
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  )
}
