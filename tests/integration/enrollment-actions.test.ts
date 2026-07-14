import { recordAttendance } from '@/actions/enrollments'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

// Mock auth module to prevent importing next-auth
jest.mock('@/auth', () => ({
  auth: jest.fn(),
  handlers: {},
  signIn: jest.fn(),
  signOut: jest.fn(),
}))

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    enrollment: {
      findUnique: jest.fn(),
    },
    attendance: {
      create: jest.fn(),
    },
  },
}))

jest.mock('@/actions/users', () => ({
  verifyPermission: jest.fn().mockResolvedValue({ id: 'test-receptionist', role: 'RECEPTION' }),
}))

jest.mock('@/lib/audit', () => ({
  logAction: jest.fn().mockResolvedValue(true),
}))

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}))

describe('Enrollments Server Actions - Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('recordAttendance should throw error if enrollment does not exist', async () => {
    ;(prisma.enrollment.findUnique as jest.Mock).mockResolvedValue(null)

    await expect(recordAttendance('invalid-enrollment-id')).rejects.toThrow('الاشتراك غير موجود')
  })

  it('recordAttendance should throw error if enrollment status is not CONFIRMED', async () => {
    const mockEnrollment = {
      id: 'enrollment-1',
      status: 'PENDING',
      attendances: [],
    }
    ;(prisma.enrollment.findUnique as jest.Mock).mockResolvedValue(mockEnrollment)

    await expect(recordAttendance('enrollment-1')).rejects.toThrow('يجب تأكيد الدفع أولاً')
  })

  it('recordAttendance should prevent duplicate attendance on the same day', async () => {
    const today = new Date()
    const mockEnrollment = {
      id: 'enrollment-1',
      status: 'CONFIRMED',
      client: { name: 'العضوة ياسمين' },
      attendances: [
        { id: 'att-old-1', date: today, isMakeup: false }
      ],
      program: { name: 'الجمباز المبتدئ' },
      option: { price: 400, sessionsPerMonth: 8 },
      totalAmount: 400,
      amountPaid: 400,
    }
    ;(prisma.enrollment.findUnique as jest.Mock).mockResolvedValue(mockEnrollment)

    // Attempting to record regular attendance (isMakeup = false) on the same day should fail
    await expect(recordAttendance('enrollment-1', false)).rejects.toThrow('تم تسجيل حضور أساسي لهذه المشتركة بالفعل اليوم')
  })

  it('recordAttendance should successfully log attendance if validation passes', async () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)

    const mockEnrollment = {
      id: 'enrollment-1',
      status: 'CONFIRMED',
      client: { name: 'العضوة ياسمين' },
      attendances: [
        { id: 'att-old-1', date: yesterday, isMakeup: false }
      ],
      program: { name: 'الجمباز المبتدئ' },
      option: { price: 400, sessionsPerMonth: 8 },
      totalAmount: 400,
      amountPaid: 400,
    }
    ;(prisma.enrollment.findUnique as jest.Mock).mockResolvedValue(mockEnrollment)

    const createAttendanceMock = prisma.attendance.create as jest.Mock
    createAttendanceMock.mockResolvedValue({ id: 'att-new-1', enrollmentId: 'enrollment-1', date: new Date() })

    // Call recordAttendance
    await recordAttendance('enrollment-1', false)

    // Verify DB insertion occurred
    expect(createAttendanceMock).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        enrollmentId: 'enrollment-1',
        status: 'ATTENDED',
        isMakeup: false
      })
    }))

    // Verify caching path was revalidated
    expect(revalidatePath).toHaveBeenCalledWith('/dashboard/reception')
    expect(revalidatePath).toHaveBeenCalledWith('/dashboard/clients')
  })
})
