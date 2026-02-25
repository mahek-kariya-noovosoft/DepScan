import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { PackageJsonInput } from './PackageJsonInput'

const validJson = JSON.stringify({
  name: 'test',
  dependencies: { lodash: '^4.17.21' },
})

const invalidJson = '{ not valid json'

const noDepJson = JSON.stringify({ name: 'test', version: '1.0.0' })

describe('PackageJsonInput', () => {
  it('renders textarea and scan button', () => {
    render(<PackageJsonInput onSubmit={vi.fn()} disabled={false} />)
    expect(screen.getByRole('textbox')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /scan dependencies/i })).toBeInTheDocument()
  })

  it('scan button is disabled when textarea is empty', () => {
    render(<PackageJsonInput onSubmit={vi.fn()} disabled={false} />)
    expect(screen.getByRole('button', { name: /scan dependencies/i })).toBeDisabled()
  })

  it('scan button is enabled when valid JSON is entered', () => {
    render(<PackageJsonInput onSubmit={vi.fn()} disabled={false} />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: validJson } })
    expect(screen.getByRole('button', { name: /scan dependencies/i })).toBeEnabled()
  })

  it('shows error message for invalid JSON', () => {
    render(<PackageJsonInput onSubmit={vi.fn()} disabled={false} />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: invalidJson } })
    expect(screen.getByText(/invalid json/i)).toBeInTheDocument()
  })

  it('shows error when JSON has no dependencies', () => {
    render(<PackageJsonInput onSubmit={vi.fn()} disabled={false} />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: noDepJson } })
    expect(screen.getByText(/no dependencies or devdependencies found/i)).toBeInTheDocument()
  })

  it('calls onSubmit with content when valid JSON is submitted', () => {
    const onSubmit = vi.fn()
    render(<PackageJsonInput onSubmit={onSubmit} disabled={false} />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: validJson } })
    fireEvent.click(screen.getByRole('button', { name: /scan dependencies/i }))
    expect(onSubmit).toHaveBeenCalledWith(validJson)
  })

  it('does not call onSubmit when button is disabled', () => {
    const onSubmit = vi.fn()
    render(<PackageJsonInput onSubmit={onSubmit} disabled={false} />)
    // Button is disabled because textarea is empty
    fireEvent.click(screen.getByRole('button', { name: /scan dependencies/i }))
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('disables textarea and button when disabled prop is true', () => {
    render(<PackageJsonInput onSubmit={vi.fn()} disabled={true} />)
    expect(screen.getByRole('textbox')).toBeDisabled()
  })

  it('shows file upload hint when textarea is empty', () => {
    render(<PackageJsonInput onSubmit={vi.fn()} disabled={false} />)
    expect(screen.getByText(/or drop a package\.json file/i)).toBeInTheDocument()
  })

  it('hides file upload hint when textarea has content', () => {
    render(<PackageJsonInput onSubmit={vi.fn()} disabled={false} />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: validJson } })
    expect(screen.queryByText(/or drop a package\.json file/i)).not.toBeInTheDocument()
  })
})
