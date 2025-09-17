import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { TooltipProvider } from '@/components/ui/tooltip'
import { vi } from 'vitest'

// Create a custom render function that includes providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  })

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <TooltipProvider>
          {children}
        </TooltipProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options })

export * from '@testing-library/react'
export { customRender as render }

// Mock data generators
export const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  user_metadata: {
    full_name: 'Test User',
  },
  created_at: '2023-01-01T00:00:00.000Z',
}

export const mockTattooDesign = {
  id: 'test-design-id',
  user_id: 'test-user-id',
  prompt: 'A beautiful rose tattoo',
  style: 'traditional',
  technique: 'linework',
  subject: 'rose',
  color_palette: 'red,green',
  placement: 'arm',
  ai_model: 'flux',
  image_url: 'https://example.com/image.jpg',
  metadata: {},
  created_at: '2023-01-01T00:00:00.000Z',
  updated_at: '2023-01-01T00:00:00.000Z',
}

export const mockConversation = {
  id: 'test-conversation-id',
  user_id: 'test-user-id',
  title: 'Test Conversation',
  messages: [],
  created_at: '2023-01-01T00:00:00.000Z',
  updated_at: '2023-01-01T00:00:00.000Z',
}

export const mockStyleTransferResult = {
  originalPrompt: 'A traditional rose tattoo',
  transferredPrompt: 'A realistic rose tattoo with photorealistic detail',
  fromStyle: 'traditional',
  toStyle: 'realistic',
  confidence: 85,
  compatibilityScore: 80,
  estimatedQuality: 90,
  preservedElements: ['rose', 'composition'],
  transformedElements: [
    {
      original: 'bold black outlines',
      transformed: 'fine detailed linework',
      reason: 'Style adaptation for realistic approach'
    }
  ],
  warnings: [],
  suggestions: ['Consider adding more detail for better realism'],
  processingTime: 1500,
  metadata: {}
}

// Test helpers
export const waitForLoadingToFinish = () => 
  new Promise(resolve => setTimeout(resolve, 0))

export const mockSupabaseResponse = (data: any, error: any = null) => ({
  data,
  error,
})

export const mockSupabaseQuery = () => ({
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  gte: vi.fn().mockReturnThis(),
  lte: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  single: vi.fn(),
})

// Mock API responses
export const mockApiResponses = {
  generateTattoo: {
    success: {
      image_url: 'https://example.com/generated-tattoo.jpg',
      prompt: 'A beautiful rose tattoo',
      metadata: {
        model: 'flux',
        style: 'traditional',
        processing_time: 5000,
      }
    },
    error: {
      error: 'Generation failed',
      message: 'Unable to generate tattoo design'
    }
  },
  
  analyzeTattoo: {
    success: {
      analysis: {
        style: 'traditional',
        elements: ['rose', 'thorns'],
        colors: ['red', 'green', 'black'],
        placement_suggestions: ['arm', 'shoulder'],
        quality_score: 85,
      }
    },
    error: {
      error: 'Analysis failed',
      message: 'Unable to analyze tattoo image'
    }
  }
}

// Custom matchers
export const customMatchers = {
  toBeInTheDocument: expect.any(Function),
  toHaveClass: expect.any(Function),
  toHaveAttribute: expect.any(Function),
}

// Mock intersection observer for components that use it
export const mockIntersectionObserver = () => {
  const mockIntersectionObserver = vi.fn()
  mockIntersectionObserver.mockReturnValue({
    observe: () => null,
    unobserve: () => null,
    disconnect: () => null
  })
  window.IntersectionObserver = mockIntersectionObserver
  window.IntersectionObserverEntry = vi.fn()
}

// Mock resize observer for components that use it
export const mockResizeObserver = () => {
  const mockResizeObserver = vi.fn()
  mockResizeObserver.mockReturnValue({
    observe: () => null,
    unobserve: () => null,
    disconnect: () => null
  })
  window.ResizeObserver = mockResizeObserver
  window.ResizeObserverEntry = vi.fn()
}

// Mock file upload
export const createMockFile = (name = 'test.jpg', type = 'image/jpeg') => {
  const file = new File(['test'], name, { type })
  Object.defineProperty(file, 'size', { value: 1024 })
  return file
}

// Mock drag and drop events
export const createMockDragEvent = (files: File[]) => {
  return {
    dataTransfer: {
      files,
      items: files.map(file => ({
        kind: 'file',
        type: file.type,
        getAsFile: () => file,
      })),
      types: ['Files'],
    },
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
  }
}

// Mock touch events for mobile testing
export const createMockTouchEvent = (touches: Array<{ clientX: number; clientY: number }>) => {
  return {
    touches: touches.map(touch => ({
      ...touch,
      identifier: Math.random(),
      target: document.body,
    })),
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
  }
}

// Mock geolocation for location-based features
export const mockGeolocation = () => {
  const mockGeolocation = {
    getCurrentPosition: vi.fn(),
    watchPosition: vi.fn(),
    clearWatch: vi.fn(),
  }
  
  Object.defineProperty(navigator, 'geolocation', {
    value: mockGeolocation,
    writable: true,
  })
  
  return mockGeolocation
}

// Mock media devices for camera/microphone access
export const mockMediaDevices = () => {
  const mockMediaDevices = {
    getUserMedia: vi.fn(),
    enumerateDevices: vi.fn(),
    getDisplayMedia: vi.fn(),
  }
  
  Object.defineProperty(navigator, 'mediaDevices', {
    value: mockMediaDevices,
    writable: true,
  })
  
  return mockMediaDevices
}

// Performance testing helpers
export const measureRenderTime = async (renderFn: () => void) => {
  const start = performance.now()
  renderFn()
  await waitForLoadingToFinish()
  const end = performance.now()
  return end - start
}

// Accessibility testing helpers
export const checkAccessibility = async (container: HTMLElement) => {
  // Basic accessibility checks
  const buttons = container.querySelectorAll('button')
  const inputs = container.querySelectorAll('input, textarea, select')
  const images = container.querySelectorAll('img')
  
  const issues: string[] = []
  
  // Check buttons have accessible names
  buttons.forEach((button, index) => {
    if (!button.textContent?.trim() && !button.getAttribute('aria-label')) {
      issues.push(`Button ${index} missing accessible name`)
    }
  })
  
  // Check inputs have labels
  inputs.forEach((input, index) => {
    const hasLabel = input.getAttribute('aria-label') || 
                    input.getAttribute('aria-labelledby') ||
                    container.querySelector(`label[for="${input.id}"]`)
    if (!hasLabel) {
      issues.push(`Input ${index} missing label`)
    }
  })
  
  // Check images have alt text
  images.forEach((img, index) => {
    if (!img.getAttribute('alt')) {
      issues.push(`Image ${index} missing alt text`)
    }
  })
  
  return issues
}
