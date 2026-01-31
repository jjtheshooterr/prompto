import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import PromptCard from '@/components/prompts/PromptCard'

// Mock the toast
vi.mock('sonner', () => ({
  toast: vi.fn()
}))

describe('PromptCard', () => {
  const mockPrompt = {
    id: 'prompt-123',
    title: 'Test Prompt',
    system_prompt: 'You are a helpful assistant',
    model: 'gpt-4',
    created_at: '2024-01-01T00:00:00Z',
    created_by: 'user-123',
    parent_prompt_id: null,
    notes: null,
    best_for: ['testing', 'development'],
    improvement_summary: null,
    prompt_stats: [{
      upvotes: 10,
      downvotes: 2,
      score: 8,
      copy_count: 5,
      view_count: 100,
      fork_count: 3,
      works_count: 7,
      fails_count: 1,
      reviews_count: 8
    }],
    author: {
      id: 'user-123',
      username: 'testuser',
      display_name: 'Test User',
      avatar_url: null
    }
  }

  it('should render prompt title', () => {
    render(<PromptCard prompt={mockPrompt} />)
    
    expect(screen.getByText('Test Prompt')).toBeInTheDocument()
  })

  it('should render model and date', () => {
    render(<PromptCard prompt={mockPrompt} />)
    
    expect(screen.getByText(/gpt-4/)).toBeInTheDocument()
    expect(screen.getByText(/12\/31\/2023/)).toBeInTheDocument()
  })

  it('should render stats correctly', () => {
    render(<PromptCard prompt={mockPrompt} />)
    
    expect(screen.getByText('7 Works')).toBeInTheDocument()
    expect(screen.getByText('1 Fails')).toBeInTheDocument()
    expect(screen.getByText('10')).toBeInTheDocument() // upvotes
    expect(screen.getByText('2')).toBeInTheDocument() // downvotes
    expect(screen.getByText(/Score: 8/)).toBeInTheDocument()
  })

  it('should render system prompt', () => {
    render(<PromptCard prompt={mockPrompt} />)
    
    expect(screen.getByText('You are a helpful assistant')).toBeInTheDocument()
  })

  it('should render best_for tags', () => {
    render(<PromptCard prompt={mockPrompt} />)
    
    expect(screen.getByText('testing')).toBeInTheDocument()
    expect(screen.getByText('development')).toBeInTheDocument()
  })

  it('should render author attribution', () => {
    render(<PromptCard prompt={mockPrompt} />)
    
    expect(screen.getByText('Test User')).toBeInTheDocument()
  })

  it('should render View Details link', () => {
    render(<PromptCard prompt={mockPrompt} />)
    
    const link = screen.getByRole('link', { name: /View Details/i })
    expect(link).toHaveAttribute('href', '/prompts/prompt-123')
  })

  it('should render fork indicator when prompt is a fork', () => {
    const forkedPrompt = {
      ...mockPrompt,
      parent_prompt_id: 'parent-123',
      notes: 'Forked from parent-123. Improved for better results'
    }

    render(<PromptCard prompt={forkedPrompt} />)
    
    expect(screen.getByText('Fork')).toBeInTheDocument()
    expect(screen.getByText(/Improved for better results/)).toBeInTheDocument()
  })

  it('should render improvement summary when present', () => {
    const improvedPrompt = {
      ...mockPrompt,
      improvement_summary: 'Better accuracy and faster responses'
    }

    render(<PromptCard prompt={improvedPrompt} />)
    
    expect(screen.getByText(/Better accuracy and faster responses/)).toBeInTheDocument()
  })

  it('should render fork count when greater than 0', () => {
    render(<PromptCard prompt={mockPrompt} />)
    
    expect(screen.getByText('3 forks')).toBeInTheDocument()
  })

  it('should render view and copy counts', () => {
    render(<PromptCard prompt={mockPrompt} />)
    
    expect(screen.getByText('100 views')).toBeInTheDocument()
    expect(screen.getByText('5 copies')).toBeInTheDocument()
  })
})
