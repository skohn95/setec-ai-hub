import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PrivacyTooltip } from './PrivacyTooltip'

describe('PrivacyTooltip', () => {
  it('renders children correctly', () => {
    render(
      <PrivacyTooltip>
        <button>Upload</button>
      </PrivacyTooltip>
    )

    expect(screen.getByRole('button', { name: 'Upload' })).toBeInTheDocument()
  })

  it('renders children as tooltip trigger', () => {
    render(
      <PrivacyTooltip>
        <span data-testid="trigger">Hover me</span>
      </PrivacyTooltip>
    )

    const trigger = screen.getByTestId('trigger')
    expect(trigger).toBeInTheDocument()
    // The trigger should be wrapped by Radix tooltip trigger
    expect(trigger.closest('[data-slot="tooltip-trigger"]')).toBeInTheDocument()
  })

  it('children have accessible role', () => {
    render(
      <PrivacyTooltip>
        <button aria-label="Attach file">Icon</button>
      </PrivacyTooltip>
    )

    expect(screen.getByRole('button', { name: 'Attach file' })).toBeInTheDocument()
  })
})
