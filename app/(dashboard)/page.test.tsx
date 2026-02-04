import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import DashboardPage from './page'

describe('DashboardPage', () => {
  it('renders the placeholder message', () => {
    render(<DashboardPage />)
    expect(
      screen.getByText('Selecciona una conversación o inicia una nueva')
    ).toBeInTheDocument()
  })

  it('centers the content', () => {
    const { container } = render(<DashboardPage />)
    const wrapper = container.firstChild
    expect(wrapper).toHaveClass('flex', 'items-center', 'justify-center')
  })
})
