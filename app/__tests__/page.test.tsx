import { render, screen } from '@testing-library/react'
import Dashboard from '../page'

// Mocking fetch to avoid actual API calls during tests
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({ pagination: { total: 0 }, data: [] }),
  })
) as jest.Mock;

describe('Dashboard', () => {
  it('renders the main heading', () => {
    render(<Dashboard />)
    const heading = screen.getByRole('heading', {
      name: /dashboard/i,
    })
    expect(heading).toBeInTheDocument()
  })
})
