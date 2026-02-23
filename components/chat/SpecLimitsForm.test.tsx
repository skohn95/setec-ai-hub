import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SpecLimitsForm from './SpecLimitsForm'

describe('SpecLimitsForm', () => {
  const mockOnSubmit = vi.fn()
  const mockOnCancel = vi.fn()
  const defaultProps = {
    detectedCount: 100,
    onSubmit: mockOnSubmit,
    onCancel: mockOnCancel,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it('renders with data summary correctly', () => {
      render(<SpecLimitsForm {...defaultProps} />)

      expect(
        screen.getByText('Se detectó 1 variable numérica con 100 valores')
      ).toBeInTheDocument()
    })

    it('renders both input fields with labels', () => {
      render(<SpecLimitsForm {...defaultProps} />)

      expect(
        screen.getByLabelText(/límite inferior de especificación/i)
      ).toBeInTheDocument()
      expect(
        screen.getByLabelText(/límite superior de especificación/i)
      ).toBeInTheDocument()
    })

    it('renders submit button with correct text', () => {
      render(<SpecLimitsForm {...defaultProps} />)

      expect(
        screen.getByRole('button', { name: /iniciar análisis/i })
      ).toBeInTheDocument()
    })

    it('renders cancel button with correct text', () => {
      render(<SpecLimitsForm {...defaultProps} />)

      expect(
        screen.getByRole('button', { name: /cancelar/i })
      ).toBeInTheDocument()
    })

    it('renders form title', () => {
      render(<SpecLimitsForm {...defaultProps} />)

      expect(
        screen.getByText('Límites de Especificación')
      ).toBeInTheDocument()
    })
  })

  describe('required field validation', () => {
    it('displays required error for empty LEI field on submit', async () => {
      const user = userEvent.setup()
      render(<SpecLimitsForm {...defaultProps} />)

      const lesInput = screen.getByLabelText(/límite superior de especificación/i)
      await user.type(lesInput, '105')

      const submitButton = screen.getByRole('button', { name: /iniciar análisis/i })
      await user.click(submitButton)

      expect(screen.getByText('Este campo es requerido')).toBeInTheDocument()
      expect(mockOnSubmit).not.toHaveBeenCalled()
    })

    it('displays required error for empty LES field on submit', async () => {
      const user = userEvent.setup()
      render(<SpecLimitsForm {...defaultProps} />)

      const leiInput = screen.getByLabelText(/límite inferior de especificación/i)
      await user.type(leiInput, '95')

      const submitButton = screen.getByRole('button', { name: /iniciar análisis/i })
      await user.click(submitButton)

      expect(screen.getByText('Este campo es requerido')).toBeInTheDocument()
      expect(mockOnSubmit).not.toHaveBeenCalled()
    })

    it('displays required errors for both fields when both are empty', async () => {
      const user = userEvent.setup()
      render(<SpecLimitsForm {...defaultProps} />)

      const submitButton = screen.getByRole('button', { name: /iniciar análisis/i })
      await user.click(submitButton)

      const errors = screen.getAllByText('Este campo es requerido')
      expect(errors).toHaveLength(2)
      expect(mockOnSubmit).not.toHaveBeenCalled()
    })
  })

  describe('numeric validation', () => {
    it('displays non-numeric error for LEI field', async () => {
      const user = userEvent.setup()
      render(<SpecLimitsForm {...defaultProps} />)

      const leiInput = screen.getByLabelText(/límite inferior de especificación/i)
      const lesInput = screen.getByLabelText(/límite superior de especificación/i)

      await user.type(leiInput, 'abc')
      await user.type(lesInput, '105')

      const submitButton = screen.getByRole('button', { name: /iniciar análisis/i })
      await user.click(submitButton)

      expect(screen.getByText('Debe ser un valor numérico')).toBeInTheDocument()
      expect(mockOnSubmit).not.toHaveBeenCalled()
    })

    it('displays non-numeric error for LES field', async () => {
      const user = userEvent.setup()
      render(<SpecLimitsForm {...defaultProps} />)

      const leiInput = screen.getByLabelText(/límite inferior de especificación/i)
      const lesInput = screen.getByLabelText(/límite superior de especificación/i)

      await user.type(leiInput, '95')
      await user.type(lesInput, 'xyz')

      const submitButton = screen.getByRole('button', { name: /iniciar análisis/i })
      await user.click(submitButton)

      expect(screen.getByText('Debe ser un valor numérico')).toBeInTheDocument()
      expect(mockOnSubmit).not.toHaveBeenCalled()
    })
  })

  describe('LEI < LES validation', () => {
    it('displays error when LEI equals LES', async () => {
      const user = userEvent.setup()
      render(<SpecLimitsForm {...defaultProps} />)

      const leiInput = screen.getByLabelText(/límite inferior de especificación/i)
      const lesInput = screen.getByLabelText(/límite superior de especificación/i)

      await user.type(leiInput, '100')
      await user.type(lesInput, '100')

      const submitButton = screen.getByRole('button', { name: /iniciar análisis/i })
      await user.click(submitButton)

      expect(
        screen.getByText('El límite inferior debe ser menor que el límite superior')
      ).toBeInTheDocument()
      expect(mockOnSubmit).not.toHaveBeenCalled()
    })

    it('displays error when LEI is greater than LES', async () => {
      const user = userEvent.setup()
      render(<SpecLimitsForm {...defaultProps} />)

      const leiInput = screen.getByLabelText(/límite inferior de especificación/i)
      const lesInput = screen.getByLabelText(/límite superior de especificación/i)

      await user.type(leiInput, '110')
      await user.type(lesInput, '105')

      const submitButton = screen.getByRole('button', { name: /iniciar análisis/i })
      await user.click(submitButton)

      expect(
        screen.getByText('El límite inferior debe ser menor que el límite superior')
      ).toBeInTheDocument()
      expect(mockOnSubmit).not.toHaveBeenCalled()
    })
  })

  describe('valid submission', () => {
    it('calls onSubmit with correct values on valid submission', async () => {
      const user = userEvent.setup()
      render(<SpecLimitsForm {...defaultProps} />)

      const leiInput = screen.getByLabelText(/límite inferior de especificación/i)
      const lesInput = screen.getByLabelText(/límite superior de especificación/i)

      await user.type(leiInput, '95')
      await user.type(lesInput, '105')

      const submitButton = screen.getByRole('button', { name: /iniciar análisis/i })
      await user.click(submitButton)

      expect(mockOnSubmit).toHaveBeenCalledWith({ lei: 95, les: 105 })
    })

    it('handles decimal values correctly', async () => {
      const user = userEvent.setup()
      render(<SpecLimitsForm {...defaultProps} />)

      const leiInput = screen.getByLabelText(/límite inferior de especificación/i)
      const lesInput = screen.getByLabelText(/límite superior de especificación/i)

      await user.type(leiInput, '95.5')
      await user.type(lesInput, '105.75')

      const submitButton = screen.getByRole('button', { name: /iniciar análisis/i })
      await user.click(submitButton)

      expect(mockOnSubmit).toHaveBeenCalledWith({ lei: 95.5, les: 105.75 })
    })

    it('handles negative values correctly', async () => {
      const user = userEvent.setup()
      render(<SpecLimitsForm {...defaultProps} />)

      const leiInput = screen.getByLabelText(/límite inferior de especificación/i)
      const lesInput = screen.getByLabelText(/límite superior de especificación/i)

      await user.type(leiInput, '-10')
      await user.type(lesInput, '10')

      const submitButton = screen.getByRole('button', { name: /iniciar análisis/i })
      await user.click(submitButton)

      expect(mockOnSubmit).toHaveBeenCalledWith({ lei: -10, les: 10 })
    })

    it('clears form fields after successful submission', async () => {
      const user = userEvent.setup()
      render(<SpecLimitsForm {...defaultProps} />)

      const leiInput = screen.getByLabelText(/límite inferior de especificación/i) as HTMLInputElement
      const lesInput = screen.getByLabelText(/límite superior de especificación/i) as HTMLInputElement

      await user.type(leiInput, '95')
      await user.type(lesInput, '105')

      expect(leiInput.value).toBe('95')
      expect(lesInput.value).toBe('105')

      const submitButton = screen.getByRole('button', { name: /iniciar análisis/i })
      await user.click(submitButton)

      expect(mockOnSubmit).toHaveBeenCalled()
      expect(leiInput.value).toBe('')
      expect(lesInput.value).toBe('')
    })
  })

  describe('cancel behavior', () => {
    it('calls onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup()
      render(<SpecLimitsForm {...defaultProps} />)

      const cancelButton = screen.getByRole('button', { name: /cancelar/i })
      await user.click(cancelButton)

      expect(mockOnCancel).toHaveBeenCalled()
    })

    it('does not call onSubmit when cancel is clicked', async () => {
      const user = userEvent.setup()
      render(<SpecLimitsForm {...defaultProps} />)

      const cancelButton = screen.getByRole('button', { name: /cancelar/i })
      await user.click(cancelButton)

      expect(mockOnSubmit).not.toHaveBeenCalled()
    })
  })

  describe('disabled state during submission', () => {
    it('disables submit button when isSubmitting is true', () => {
      render(<SpecLimitsForm {...defaultProps} isSubmitting={true} />)

      const submitButton = screen.getByRole('button', { name: /iniciar análisis/i })
      expect(submitButton).toBeDisabled()
    })

    it('disables cancel button when isSubmitting is true', () => {
      render(<SpecLimitsForm {...defaultProps} isSubmitting={true} />)

      const cancelButton = screen.getByRole('button', { name: /cancelar/i })
      expect(cancelButton).toBeDisabled()
    })

    it('disables input fields when isSubmitting is true', () => {
      render(<SpecLimitsForm {...defaultProps} isSubmitting={true} />)

      const leiInput = screen.getByLabelText(/límite inferior de especificación/i)
      const lesInput = screen.getByLabelText(/límite superior de especificación/i)

      expect(leiInput).toBeDisabled()
      expect(lesInput).toBeDisabled()
    })
  })

  describe('clearing validation errors on input change', () => {
    it('clears LEI error when user starts typing', async () => {
      const user = userEvent.setup()
      render(<SpecLimitsForm {...defaultProps} />)

      const leiInput = screen.getByLabelText(/límite inferior de especificación/i)
      const lesInput = screen.getByLabelText(/límite superior de especificación/i)

      // Trigger validation error
      await user.type(lesInput, '105')
      const submitButton = screen.getByRole('button', { name: /iniciar análisis/i })
      await user.click(submitButton)

      expect(screen.getByText('Este campo es requerido')).toBeInTheDocument()

      // Start typing in LEI field
      await user.type(leiInput, '9')

      // Error should be cleared
      await waitFor(() => {
        expect(screen.queryByText('Este campo es requerido')).not.toBeInTheDocument()
      })
    })

    it('clears LES error when user starts typing', async () => {
      const user = userEvent.setup()
      render(<SpecLimitsForm {...defaultProps} />)

      const leiInput = screen.getByLabelText(/límite inferior de especificación/i)
      const lesInput = screen.getByLabelText(/límite superior de especificación/i)

      // Trigger validation error
      await user.type(leiInput, '95')
      const submitButton = screen.getByRole('button', { name: /iniciar análisis/i })
      await user.click(submitButton)

      expect(screen.getByText('Este campo es requerido')).toBeInTheDocument()

      // Start typing in LES field
      await user.type(lesInput, '1')

      // Error should be cleared
      await waitFor(() => {
        expect(screen.queryByText('Este campo es requerido')).not.toBeInTheDocument()
      })
    })
  })

  describe('data summary with different counts', () => {
    it('displays correct count for 1 value (singular)', () => {
      render(<SpecLimitsForm {...defaultProps} detectedCount={1} />)

      expect(
        screen.getByText('Se detectó 1 variable numérica con 1 valor')
      ).toBeInTheDocument()
    })

    it('displays correct count for large numbers', () => {
      render(<SpecLimitsForm {...defaultProps} detectedCount={10000} />)

      expect(
        screen.getByText('Se detectó 1 variable numérica con 10000 valores')
      ).toBeInTheDocument()
    })
  })
})
