import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { axeViolations } from '@/test/axe'
import {
  CartridgeCard,
  EmptyState,
  ErrorState,
  LcdPanel,
  LoadingState,
  PixelButton,
  PlatformBadge,
  RegionTag,
  Sticker,
} from '.'

describe('CartridgeCard', () => {
  it('renders as a link with a descriptive label when href is given', () => {
    render(<CartridgeCard title="Tetris" compat="gb" year={1989} owned href="/games/tetris" />)
    const link = screen.getByRole('link', { name: 'Tetris, Game Boy, 1989, owned' })
    expect(link).toHaveAttribute('href', '/games/tetris')
  })

  it('renders as an image without href and describes the cart type', () => {
    render(<CartridgeCard title="Wario Land 3" compat="gbc_only" wishlisted />)
    expect(
      screen.getByRole('img', { name: 'Wario Land 3, Game Boy Color only, on wishlist' }),
    ).toBeInTheDocument()
  })

  it('shows the matching platform badge', () => {
    render(<CartridgeCard title="X" compat="gbc_dual" />)
    expect(screen.getByText('GBC')).toBeInTheDocument()
  })

  it('has no axe violations', async () => {
    const { container } = render(
      <div>
        <CartridgeCard title="A" compat="gb" regions={['eu', 'jp']} href="/a" />
        <CartridgeCard title="B" compat="gbc_dual" owned />
      </div>,
    )
    expect(await axeViolations(container)).toEqual([])
  })
})

describe('PixelButton', () => {
  it('defaults to type=button', () => {
    render(<PixelButton>Go</PixelButton>)
    expect(screen.getByRole('button', { name: 'Go' })).toHaveAttribute('type', 'button')
  })

  it('renders a link when href is given', () => {
    render(<PixelButton href="/games">Browse</PixelButton>)
    expect(screen.getByRole('link', { name: 'Browse' })).toHaveAttribute('href', '/games')
  })

  it('lets className override variant colours', () => {
    render(<PixelButton className="bg-power">Red</PixelButton>)
    const cls = screen.getByRole('button').className
    expect(cls).toContain('bg-power')
    expect(cls).not.toContain('bg-lcd-200')
  })
})

describe('badges and stickers', () => {
  it('PlatformBadge exposes the full platform name', () => {
    render(<PlatformBadge platform="gbc" />)
    expect(screen.getByLabelText('Game Boy Color')).toHaveTextContent('GBC')
  })

  it('RegionTag exposes the region name', () => {
    render(<RegionTag region="jp" />)
    expect(screen.getByLabelText('Japan')).toBeInTheDocument()
  })

  it('Sticker has screen-reader text and accepts a custom label', () => {
    render(<Sticker kind="price">€24</Sticker>)
    expect(screen.getByText('Estimated value:', { exact: false })).toHaveClass('sr-only')
    expect(screen.getByText('€24')).toBeInTheDocument()
  })
})

describe('states', () => {
  it('LoadingState is a polite live region', () => {
    render(<LoadingState label="Booting" />)
    expect(screen.getByRole('status')).toHaveTextContent('Booting')
  })

  it('ErrorState shows GAME OVER and the continue prompt with an action', () => {
    render(<ErrorState action={<PixelButton>Yes</PixelButton>} />)
    expect(screen.getByRole('heading', { name: 'GAME OVER' })).toBeInTheDocument()
    expect(screen.getByText('CONTINUE?')).toBeInTheDocument()
  })

  it('EmptyState and LcdPanel have no axe violations', async () => {
    const { container } = render(
      <div>
        <EmptyState title="NO DATA" description={<p>Nothing yet</p>} />
        <LcdPanel tone="gbc" bezelLabel="Color">
          <p>Hi</p>
        </LcdPanel>
      </div>,
    )
    expect(await axeViolations(container)).toEqual([])
  })
})
