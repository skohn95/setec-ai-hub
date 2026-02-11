import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PasswordInput } from './password-input'

describe('PasswordInput', () => {
  describe('Rendering', () => {
    it('renders as password input by default', () => {
      render(<PasswordInput aria-label="Password" />)

      const input = screen.getByLabelText('Password')
      expect(input).toHaveAttribute('type', 'password')
    })

    it('renders toggle button with show password label', () => {
      render(<PasswordInput aria-label="Password" />)

      const toggleButton = screen.getByRole('button', { name: 'Mostrar contraseña' })
      expect(toggleButton).toBeInTheDocument()
    })

    it('passes className to input', () => {
      render(<PasswordInput aria-label="Password" className="custom-class" />)

      const input = screen.getByLabelText('Password')
      expect(input).toHaveClass('custom-class')
    })

    it('passes other props to input', () => {
      render(
        <PasswordInput
          aria-label="Password"
          placeholder="Enter password"
          disabled
        />
      )

      const input = screen.getByLabelText('Password')
      expect(input).toHaveAttribute('placeholder', 'Enter password')
      expect(input).toBeDisabled()
    })
  })

  describe('Toggle Functionality', () => {
    it('shows password when toggle is clicked', async () => {
      const user = userEvent.setup()
      render(<PasswordInput aria-label="Password" />)

      const input = screen.getByLabelText('Password')
      expect(input).toHaveAttribute('type', 'password')

      const toggleButton = screen.getByRole('button', { name: 'Mostrar contraseña' })
      await user.click(toggleButton)

      expect(input).toHaveAttribute('type', 'text')
    })

    it('hides password when toggle is clicked again', async () => {
      const user = userEvent.setup()
      render(<PasswordInput aria-label="Password" />)

      const toggleButton = screen.getByRole('button', { name: 'Mostrar contraseña' })
      await user.click(toggleButton)

      // Now should show "Ocultar contraseña"
      const hideButton = screen.getByRole('button', { name: 'Ocultar contraseña' })
      await user.click(hideButton)

      const input = screen.getByLabelText('Password')
      expect(input).toHaveAttribute('type', 'password')
    })

    it('updates aria-label when toggling', async () => {
      const user = userEvent.setup()
      render(<PasswordInput aria-label="Password" />)

      expect(screen.getByRole('button', { name: 'Mostrar contraseña' })).toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: 'Mostrar contraseña' }))

      expect(screen.getByRole('button', { name: 'Ocultar contraseña' })).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('toggle button has type="button" to prevent form submission', () => {
      render(<PasswordInput aria-label="Password" />)

      const toggleButton = screen.getByRole('button', { name: 'Mostrar contraseña' })
      expect(toggleButton).toHaveAttribute('type', 'button')
    })

    it('toggle button is accessible via keyboard', async () => {
      const user = userEvent.setup()
      render(<PasswordInput aria-label="Password" />)

      const input = screen.getByLabelText('Password')
      await user.tab() // Focus input
      await user.tab() // Focus toggle button

      const toggleButton = screen.getByRole('button', { name: 'Mostrar contraseña' })
      expect(toggleButton).toHaveFocus()

      await user.keyboard('{Enter}')
      expect(input).toHaveAttribute('type', 'text')
    })
  })
})
