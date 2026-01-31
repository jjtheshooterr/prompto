import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AuthorChip } from '@/components/common/AuthorChip'

describe('AuthorChip', () => {
  it('should render display name', () => {
    render(
      <AuthorChip
        userId="user-123"
        username="testuser"
        displayName="Test User"
        avatarUrl={null}
      />
    )
    
    expect(screen.getByText('Test User')).toBeInTheDocument()
  })

  it('should render username with @ symbol', () => {
    render(
      <AuthorChip
        userId="user-123"
        username="testuser"
        displayName="Test User"
        avatarUrl={null}
      />
    )
    
    expect(screen.getByText('@testuser')).toBeInTheDocument()
  })

  it('should link to user profile with username', () => {
    render(
      <AuthorChip
        userId="user-123"
        username="testuser"
        displayName="Test User"
        avatarUrl={null}
      />
    )
    
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/u/testuser')
  })

  it('should link to profile by ID when no username', () => {
    render(
      <AuthorChip
        userId="user-123"
        username={null}
        displayName="Test User"
        avatarUrl={null}
      />
    )
    
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/profile/user-123')
  })

  it('should show avatar when provided', () => {
    render(
      <AuthorChip
        userId="user-123"
        username="testuser"
        displayName="Test User"
        avatarUrl="https://example.com/avatar.jpg"
        showAvatar={true}
      />
    )
    
    const avatar = screen.getByRole('img')
    expect(avatar).toBeInTheDocument()
    expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.jpg')
  })

  it('should not show avatar when showAvatar is false', () => {
    render(
      <AuthorChip
        userId="user-123"
        username="testuser"
        displayName="Test User"
        avatarUrl="https://example.com/avatar.jpg"
        showAvatar={false}
      />
    )
    
    const avatar = screen.queryByRole('img')
    expect(avatar).not.toBeInTheDocument()
  })

  it('should show default avatar icon when no avatarUrl', () => {
    render(
      <AuthorChip
        userId="user-123"
        username="testuser"
        displayName="Test User"
        avatarUrl={null}
        showAvatar={true}
      />
    )
    
    // Should show the SVG icon instead of img
    const avatarContainer = screen.getByRole('link').querySelector('div')
    expect(avatarContainer).toBeInTheDocument()
    expect(avatarContainer?.querySelector('svg')).toBeInTheDocument()
  })

  it('should render "Anonymous" when no display name', () => {
    render(
      <AuthorChip
        userId="user-123"
        username="testuser"
        displayName={null}
        avatarUrl={null}
      />
    )
    
    expect(screen.getByText('Anonymous')).toBeInTheDocument()
  })

  it('should apply size classes correctly', () => {
    const { rerender } = render(
      <AuthorChip
        userId="user-123"
        username="testuser"
        displayName="Test User"
        avatarUrl={null}
        size="sm"
      />
    )
    
    let link = screen.getByRole('link')
    expect(link.className).toContain('text-xs')

    rerender(
      <AuthorChip
        userId="user-123"
        username="testuser"
        displayName="Test User"
        avatarUrl={null}
        size="md"
      />
    )
    
    link = screen.getByRole('link')
    expect(link.className).toContain('text-sm')

    rerender(
      <AuthorChip
        userId="user-123"
        username="testuser"
        displayName="Test User"
        avatarUrl={null}
        size="lg"
      />
    )
    
    link = screen.getByRole('link')
    expect(link.className).toContain('text-base')
  })

  it('should apply custom className', () => {
    render(
      <AuthorChip
        userId="user-123"
        username="testuser"
        displayName="Test User"
        avatarUrl={null}
        className="custom-class"
      />
    )
    
    const link = screen.getByRole('link')
    expect(link.className).toContain('custom-class')
  })
})
