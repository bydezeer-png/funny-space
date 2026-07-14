import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import ThemeToggle from '@/components/ThemeToggle'

// Mock next-themes
const mockSetTheme = jest.fn()
jest.mock('next-themes', () => ({
  useTheme: () => ({
    theme: 'light',
    setTheme: mockSetTheme,
  }),
}))

describe('ThemeToggle Component', () => {
  beforeEach(() => {
    mockSetTheme.mockClear()
  })

  it('renders placeholder loading skeleton if not mounted', () => {
    // We can simulate not mounted by spying on useState
    const useStateSpy = jest.spyOn(React, 'useState')
    useStateSpy.mockImplementationOnce(() => [false, jest.fn()])

    const { container } = render(<ThemeToggle />)
    expect(container.firstChild).toHaveClass('animate-pulse')

    useStateSpy.mockRestore()
  })

  it('renders switch button after mounting', () => {
    render(<ThemeToggle />)
    const button = screen.getByRole('button')
    expect(button).toBeInTheDocument()
    expect(button).toHaveAttribute('title', 'تبديل الوضع الليلي / النهاري')
  })

  it('toggles the theme when clicked', () => {
    render(<ThemeToggle />)
    const button = screen.getByRole('button')
    fireEvent.click(button)
    expect(mockSetTheme).toHaveBeenCalledWith('dark')
  })
})
