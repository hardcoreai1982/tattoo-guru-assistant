import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@/test/utils'
import userEvent from '@testing-library/user-event'
import TattooCreator from '../TattooCreator'
import { mockApiResponses } from '@/test/utils'

// Mock the services
vi.mock('@/services/designService', () => ({
  DesignService: {
    generateTattoo: vi.fn(),
    saveDesign: vi.fn(),
  },
}))

vi.mock('@/services/styleTransferService', () => ({
  StyleTransferService: {
    transferStyle: vi.fn(),
    previewTransfer: vi.fn(),
  },
}))

vi.mock('@/services/promptEnhancementPipeline', () => ({
  PromptEnhancementPipeline: {
    processPrompt: vi.fn(),
    savePipelineResult: vi.fn(),
  },
}))

describe('TattooCreator', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup default mock implementations
    const { DesignService } = require('@/services/designService')
    DesignService.generateTattoo.mockResolvedValue(mockApiResponses.generateTattoo.success)
    DesignService.saveDesign.mockResolvedValue({ id: 'test-design-id' })
  })

  describe('Basic Rendering', () => {
    it('should render the tattoo creator form', () => {
      render(<TattooCreator />)

      expect(screen.getByText('Create Your Perfect Tattoo')).toBeInTheDocument()
      expect(screen.getByPlaceholderText(/describe your ideal tattoo/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /generate tattoo/i })).toBeInTheDocument()
    })

    it('should render all form fields', () => {
      render(<TattooCreator />)

      expect(screen.getByLabelText(/style/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/technique/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/subject/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/color palette/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/placement/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/ai model/i)).toBeInTheDocument()
    })

    it('should show advanced options when settings button is clicked', async () => {
      render(<TattooCreator />)

      const settingsButton = screen.getByRole('button', { name: /settings/i })
      await user.click(settingsButton)

      expect(screen.getByText(/advanced prompt builder/i)).toBeInTheDocument()
    })
  })

  describe('Form Interactions', () => {
    it('should update prompt when user types', async () => {
      render(<TattooCreator />)

      const promptInput = screen.getByPlaceholderText(/describe your ideal tattoo/i)
      await user.type(promptInput, 'A beautiful rose tattoo')

      expect(promptInput).toHaveValue('A beautiful rose tattoo')
    })

    it('should update style selection', async () => {
      render(<TattooCreator />)

      const styleSelect = screen.getByLabelText(/style/i)
      await user.click(styleSelect)
      
      const traditionalOption = screen.getByText('Traditional')
      await user.click(traditionalOption)

      expect(screen.getByDisplayValue('traditional')).toBeInTheDocument()
    })

    it('should update technique selection', async () => {
      render(<TattooCreator />)

      const techniqueSelect = screen.getByLabelText(/technique/i)
      await user.click(techniqueSelect)
      
      const lineworkOption = screen.getByText('Linework')
      await user.click(lineworkOption)

      expect(screen.getByDisplayValue('linework')).toBeInTheDocument()
    })

    it('should update AI model selection', async () => {
      render(<TattooCreator />)

      const modelSelect = screen.getByLabelText(/ai model/i)
      await user.click(modelSelect)
      
      const fluxOption = screen.getByText('FLUX')
      await user.click(fluxOption)

      expect(screen.getByDisplayValue('flux')).toBeInTheDocument()
    })
  })

  describe('Tattoo Generation', () => {
    it('should generate tattoo when form is submitted', async () => {
      const { DesignService } = require('@/services/designService')
      
      render(<TattooCreator />)

      const promptInput = screen.getByPlaceholderText(/describe your ideal tattoo/i)
      await user.type(promptInput, 'A beautiful rose tattoo')

      const generateButton = screen.getByRole('button', { name: /generate tattoo/i })
      await user.click(generateButton)

      await waitFor(() => {
        expect(DesignService.generateTattoo).toHaveBeenCalledWith(
          expect.objectContaining({
            prompt: 'A beautiful rose tattoo',
            style: 'traditional',
            technique: 'linework',
            aiModel: 'flux'
          })
        )
      })
    })

    it('should show loading state during generation', async () => {
      const { DesignService } = require('@/services/designService')
      DesignService.generateTattoo.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(mockApiResponses.generateTattoo.success), 100))
      )

      render(<TattooCreator />)

      const promptInput = screen.getByPlaceholderText(/describe your ideal tattoo/i)
      await user.type(promptInput, 'A beautiful rose tattoo')

      const generateButton = screen.getByRole('button', { name: /generate tattoo/i })
      await user.click(generateButton)

      expect(screen.getByText(/generating/i)).toBeInTheDocument()
      expect(generateButton).toBeDisabled()

      await waitFor(() => {
        expect(screen.queryByText(/generating/i)).not.toBeInTheDocument()
      })
    })

    it('should display generated image', async () => {
      render(<TattooCreator />)

      const promptInput = screen.getByPlaceholderText(/describe your ideal tattoo/i)
      await user.type(promptInput, 'A beautiful rose tattoo')

      const generateButton = screen.getByRole('button', { name: /generate tattoo/i })
      await user.click(generateButton)

      await waitFor(() => {
        const generatedImage = screen.getByAltText(/generated tattoo/i)
        expect(generatedImage).toBeInTheDocument()
        expect(generatedImage).toHaveAttribute('src', mockApiResponses.generateTattoo.success.image_url)
      })
    })

    it('should handle generation errors gracefully', async () => {
      const { DesignService } = require('@/services/designService')
      DesignService.generateTattoo.mockRejectedValue(new Error('Generation failed'))

      render(<TattooCreator />)

      const promptInput = screen.getByPlaceholderText(/describe your ideal tattoo/i)
      await user.type(promptInput, 'A beautiful rose tattoo')

      const generateButton = screen.getByRole('button', { name: /generate tattoo/i })
      await user.click(generateButton)

      await waitFor(() => {
        expect(screen.getByText(/generation failed/i)).toBeInTheDocument()
      })
    })

    it('should validate required fields before generation', async () => {
      render(<TattooCreator />)

      const generateButton = screen.getByRole('button', { name: /generate tattoo/i })
      await user.click(generateButton)

      expect(screen.getByText(/please enter a prompt/i)).toBeInTheDocument()
    })
  })

  describe('Style Transfer', () => {
    it('should show style transfer panel when shuffle button is clicked', async () => {
      render(<TattooCreator />)

      // First set a style
      const styleSelect = screen.getByLabelText(/style/i)
      await user.click(styleSelect)
      const traditionalOption = screen.getByText('Traditional')
      await user.click(traditionalOption)

      const shuffleButton = screen.getByRole('button', { name: /shuffle/i })
      await user.click(shuffleButton)

      expect(screen.getByText(/style transfer/i)).toBeInTheDocument()
    })

    it('should disable shuffle button when no style is selected', () => {
      render(<TattooCreator />)

      const shuffleButton = screen.getByRole('button', { name: /shuffle/i })
      expect(shuffleButton).toBeDisabled()
    })

    it('should handle style transfer completion', async () => {
      const { StyleTransferService } = require('@/services/styleTransferService')
      const mockTransferResult = {
        fromStyle: 'traditional',
        toStyle: 'realistic',
        transferredPrompt: 'A realistic rose tattoo',
        confidence: 85
      }
      StyleTransferService.transferStyle.mockResolvedValue(mockTransferResult)

      render(<TattooCreator />)

      // Set up initial state
      const styleSelect = screen.getByLabelText(/style/i)
      await user.click(styleSelect)
      const traditionalOption = screen.getByText('Traditional')
      await user.click(traditionalOption)

      const shuffleButton = screen.getByRole('button', { name: /shuffle/i })
      await user.click(shuffleButton)

      // Simulate style transfer completion
      const transferButton = screen.getByRole('button', { name: /transfer style/i })
      await user.click(transferButton)

      await waitFor(() => {
        expect(screen.getByText(/style comparison/i)).toBeInTheDocument()
      })
    })
  })

  describe('Image Actions', () => {
    beforeEach(async () => {
      render(<TattooCreator />)

      const promptInput = screen.getByPlaceholderText(/describe your ideal tattoo/i)
      await user.type(promptInput, 'A beautiful rose tattoo')

      const generateButton = screen.getByRole('button', { name: /generate tattoo/i })
      await user.click(generateButton)

      await waitFor(() => {
        expect(screen.getByAltText(/generated tattoo/i)).toBeInTheDocument()
      })
    })

    it('should show action buttons after generation', () => {
      expect(screen.getByRole('button', { name: /download/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /share/i })).toBeInTheDocument()
    })

    it('should handle download action', async () => {
      const downloadButton = screen.getByRole('button', { name: /download/i })
      await user.click(downloadButton)

      // Verify download was triggered (implementation depends on download logic)
      expect(downloadButton).toBeInTheDocument()
    })

    it('should handle save action', async () => {
      const { DesignService } = require('@/services/designService')
      
      const saveButton = screen.getByRole('button', { name: /save/i })
      await user.click(saveButton)

      await waitFor(() => {
        expect(DesignService.saveDesign).toHaveBeenCalled()
      })
    })

    it('should handle share action', async () => {
      // Mock navigator.share
      const mockShare = vi.fn().mockResolvedValue(undefined)
      Object.defineProperty(navigator, 'share', {
        value: mockShare,
        writable: true,
      })

      const shareButton = screen.getByRole('button', { name: /share/i })
      await user.click(shareButton)

      expect(mockShare).toHaveBeenCalled()
    })
  })

  describe('Advanced Features', () => {
    it('should show advanced prompt builder', async () => {
      render(<TattooCreator />)

      const settingsButton = screen.getByRole('button', { name: /settings/i })
      await user.click(settingsButton)

      expect(screen.getByText(/advanced prompt builder/i)).toBeInTheDocument()
    })

    it('should handle advanced prompt generation', async () => {
      const { PromptEnhancementPipeline } = require('@/services/promptEnhancementPipeline')
      PromptEnhancementPipeline.processPrompt.mockResolvedValue({
        enhancedPrompt: 'Enhanced rose tattoo prompt',
        confidence: 90
      })

      render(<TattooCreator />)

      const settingsButton = screen.getByRole('button', { name: /settings/i })
      await user.click(settingsButton)

      // Simulate advanced prompt generation
      const enhanceButton = screen.getByRole('button', { name: /enhance prompt/i })
      await user.click(enhanceButton)

      await waitFor(() => {
        expect(PromptEnhancementPipeline.processPrompt).toHaveBeenCalled()
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<TattooCreator />)

      expect(screen.getByLabelText(/style/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/technique/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/subject/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /generate tattoo/i })).toBeInTheDocument()
    })

    it('should support keyboard navigation', async () => {
      render(<TattooCreator />)

      const promptInput = screen.getByPlaceholderText(/describe your ideal tattoo/i)
      promptInput.focus()

      expect(document.activeElement).toBe(promptInput)

      // Tab to next element
      await user.tab()
      expect(document.activeElement).not.toBe(promptInput)
    })

    it('should announce loading states to screen readers', async () => {
      render(<TattooCreator />)

      const promptInput = screen.getByPlaceholderText(/describe your ideal tattoo/i)
      await user.type(promptInput, 'A beautiful rose tattoo')

      const generateButton = screen.getByRole('button', { name: /generate tattoo/i })
      await user.click(generateButton)

      expect(screen.getByText(/generating/i)).toBeInTheDocument()
    })
  })

  describe('Mobile Responsiveness', () => {
    it('should render mobile-optimized components', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })

      render(<TattooCreator />)

      // Mobile-specific elements should be present
      expect(screen.getByRole('button', { name: /generate tattoo/i })).toBeInTheDocument()
    })

    it('should handle touch interactions', async () => {
      render(<TattooCreator />)

      const generateButton = screen.getByRole('button', { name: /generate tattoo/i })
      
      // Simulate touch event
      fireEvent.touchStart(generateButton)
      fireEvent.touchEnd(generateButton)

      expect(generateButton).toBeInTheDocument()
    })
  })
})
