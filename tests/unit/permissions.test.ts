import { checkUserPermission, PERMISSIONS } from '@/lib/permissions'

describe('checkUserPermission helper function', () => {
  it('should return false if user is null or undefined', () => {
    expect(checkUserPermission(null, PERMISSIONS.ADD_CLIENT)).toBe(false)
    expect(checkUserPermission(undefined, PERMISSIONS.ADD_CLIENT)).toBe(false)
  })

  it('should always return true for ADMIN role regardless of permissions', () => {
    const adminUser = { role: 'ADMIN', permissions: [] }
    expect(checkUserPermission(adminUser, PERMISSIONS.ADD_CLIENT)).toBe(true)
    expect(checkUserPermission(adminUser, [PERMISSIONS.ADD_CLIENT, PERMISSIONS.DELETE_CLIENT], true)).toBe(true)
  })

  it('should return true if user possesses the single required permission', () => {
    const receptionist = { role: 'RECEPTION', permissions: [PERMISSIONS.ADD_CLIENT] }
    expect(checkUserPermission(receptionist, PERMISSIONS.ADD_CLIENT)).toBe(true)
  })

  it('should return false if user lacks the required permission', () => {
    const instructor = { role: 'INSTRUCTOR', permissions: [PERMISSIONS.RECORD_ATTENDANCE] }
    expect(checkUserPermission(instructor, PERMISSIONS.ADD_CLIENT)).toBe(false)
  })

  it('should return true if user matches at least one of the multiple permissions (matchAll = false)', () => {
    const accountant = { role: 'ACCOUNTANT', permissions: [PERMISSIONS.ADD_EXPENSE] }
    expect(checkUserPermission(accountant, [PERMISSIONS.ADD_EXPENSE, PERMISSIONS.VIEW_REPORTS], false)).toBe(true)
  })

  it('should return false if user matches one but required matchAll is true', () => {
    const accountant = { role: 'ACCOUNTANT', permissions: [PERMISSIONS.ADD_EXPENSE] }
    expect(checkUserPermission(accountant, [PERMISSIONS.ADD_EXPENSE, PERMISSIONS.VIEW_REPORTS], true)).toBe(false)
  })

  it('should return true if user matches all permissions when matchAll is true', () => {
    const superUser = { role: 'RECEPTION', permissions: [PERMISSIONS.ADD_EXPENSE, PERMISSIONS.VIEW_REPORTS] }
    expect(checkUserPermission(superUser, [PERMISSIONS.ADD_EXPENSE, PERMISSIONS.VIEW_REPORTS], true)).toBe(true)
  })
})
