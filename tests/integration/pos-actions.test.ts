import { addShiftExpense } from '@/actions/pos'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

// Mock auth module to prevent importing next-auth
jest.mock('@/auth', () => ({
  auth: jest.fn(),
  handlers: {},
  signIn: jest.fn(),
  signOut: jest.fn(),
}))

// Mock prisma client
jest.mock('@/lib/prisma', () => ({
  prisma: {
    pOSShift: {
      findUnique: jest.fn(),
    },
    shiftExpense: {
      create: jest.fn(),
    },
    transaction: {
      create: jest.fn(),
    },
    $transaction: jest.fn((promises) => Promise.all(promises)),
  },
}))

jest.mock('@/actions/users', () => ({
  verifyPermission: jest.fn().mockResolvedValue({ id: 'test-admin', role: 'ADMIN' }),
}))

jest.mock('@/lib/audit', () => ({
  logAction: jest.fn().mockResolvedValue(true),
}))

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}))

describe('POS Server Actions - Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('addShiftExpense should record expense and transaction without decrementing DB cash directly', async () => {
    const mockShift = { id: 'shift-1', expectedCash: 500 }
    
    // Setup Prisma mocks
    const findUniqueMock = prisma.pOSShift.findUnique as jest.Mock
    findUniqueMock.mockResolvedValue(mockShift)

    const createExpenseMock = prisma.shiftExpense.create as jest.Mock
    const createTxMock = prisma.transaction.create as jest.Mock

    // Call addShiftExpense
    await addShiftExpense('shift-1', 50, 'شراء مستلزمات ورقية')

    // Verify shift was checked
    expect(findUniqueMock).toHaveBeenCalledWith({ where: { id: 'shift-1' } })

    // Verify shiftExpense creation
    expect(createExpenseMock).toHaveBeenCalledWith({
      data: { amount: 50, description: 'شراء مستلزمات ورقية', shiftId: 'shift-1' }
    })

    // Verify general Transaction creation
    expect(createTxMock).toHaveBeenCalledWith({
      data: {
        type: 'EXPENSE',
        amount: 50,
        description: 'مصروفات وردية كاشير: شراء مستلزمات ورقية'
      }
    })

    // Verify cache revalidation
    expect(revalidatePath).toHaveBeenCalledWith('/dashboard/pos')
    expect(revalidatePath).toHaveBeenCalledWith('/dashboard/accounting')
  })

  it('addShiftExpense should throw an error if the shift does not exist', async () => {
    // Setup Prisma mock to return null (no active shift)
    ;(prisma.pOSShift.findUnique as jest.Mock).mockResolvedValue(null)

    await expect(addShiftExpense('invalid-shift', 50, 'test')).rejects.toThrow('الوردية غير موجودة')
  })
})
