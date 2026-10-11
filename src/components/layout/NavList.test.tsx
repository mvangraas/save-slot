import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { primaryNav } from '@/config/site'
import { BottomNavList, isActive } from './NavList'

describe('isActive', () => {
  it('matches home only exactly', () => {
    expect(isActive('/', '/')).toBe(true)
    expect(isActive('/', '/games')).toBe(false)
  })

  it('matches nested routes', () => {
    expect(isActive('/games', '/games/tetris')).toBe(true)
    expect(isActive('/games', '/gamesx')).toBe(false)
    expect(isActive('/games', null)).toBe(false)
  })
})

describe('BottomNavList', () => {
  it('renders the five primary items and marks the current page', () => {
    render(<BottomNavList items={primaryNav} pathname="/shop/cart" />)
    expect(screen.getAllByRole('link')).toHaveLength(5)
    expect(screen.getByRole('link', { name: 'Shop' })).toHaveAttribute('aria-current', 'page')
  })
})
