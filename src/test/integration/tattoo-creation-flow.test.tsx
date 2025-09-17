import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/test/utils'
import userEvent from '@testing-library/user-event'
import TattooCreator from '@/components/TattooCreator'
import { mockApiResponses, mockStyleTransferResult } from '@/test/utils'

// Mock all services
vi.mock('@/services/designService', () => ({
  DesignService: {
    generateTattoo: vi.fn(),
    saveDesign: vi.fn(),
    analyzeDesign: vi.fn(),
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

vi.mock('@/services/conversationService', () => ({
  ConversationService: {
    createConversation: vi.fn(),
    addMessage: vi.fn(),
  },
}))

describe('Tattoo Creation Flow Integration', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup default mock implementations
    const { DesignService } = require('@/services/designService')
    const { StyleTransferService } = require('@/services/styleTransferService')
    const { PromptEnhancementPipeline } = require('@/services/promptEnhancementPipeline')
    
    DesignService.generateTattoo.mockResolvedValue(mockApiResponses.generateTattoo.success)
    DesignService.saveDesign.mockResolvedValue({ id: 'test-design-id' })
    
    StyleTransferService.previewTransfer.mockReturnValue({
      compatibility: 85,
      preservedElements: ['subject matter', 'composition'],
      modifiedElements: ['line style', 'color approach'],
      warnings: []
    })
    StyleTransferService.transferStyle.mockResolvedValue(mockStyleTransferResult)
    
    PromptEnhancementPipeline.processPrompt.mockResolvedValue({
      enhancedPrompt: 'A professional traditional rose tattoo with bold black outlines',
      confidence: 90,
      stageResults: [],
      processingTime: 1500,
      metadata: {}
    })
  })

  describe('Complete Tattoo Creation Workflow', () => {
    it('should complete full creation workflow from prompt to saved design', async () => {
      const { DesignService } = require('@/services/designService')
      
      render(<TattooCreator />)

      // Step 1: Enter prompt
      const promptInput = screen.getByPlaceholderText(/describe your ideal tattoo/i)
      await user.type(promptInput, 'A beautiful rose tattoo')

      // Step 2: Select style
      const styleSelect = screen.getByLabelText(/style/i)
      await user.click(styleSelect)
      const traditionalOption = screen.getByText('Traditional')
      await user.click(traditionalOption)

      // Step 3: Select technique
      const techniqueSelect = screen.getByLabelText(/technique/i)
      await user.click(techniqueSelect)
      const lineworkOption = screen.getByText('Linework')
      await user.click(lineworkOption)

      // Step 4: Generate tattoo
      const generateButton = screen.getByRole('button', { name: /generate tattoo/i })
      await user.click(generateButton)

      // Wait for generation to complete
      await waitFor(() => {
        expect(screen.getByAltText(/generated tattoo/i)).toBeInTheDocument()
      })

      // Step 5: Save design
      const saveButton = screen.getByRole('button', { name: /save/i })
      await user.click(saveButton)

      // Verify the complete workflow
      expect(DesignService.generateTattoo).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: 'A beautiful rose tattoo',
          style: 'traditional',
          technique: 'linework'
        })
      )
      
      await waitFor(() => {
        expect(DesignService.saveDesign).toHaveBeenCalled()
      })
    })

    it('should handle advanced prompt enhancement workflow', async () => {
      const { PromptEnhancementPipeline, DesignService } = require('@/services/promptEnhancementPipeline')
      
      render(<TattooCreator />)

      // Step 1: Enter basic prompt
      const promptInput = screen.getByPlaceholderText(/describe your ideal tattoo/i)
      await user.type(promptInput, 'rose')

      // Step 2: Open advanced prompt builder
      const settingsButton = screen.getByRole('button', { name: /settings/i })
      await user.click(settingsButton)

      // Step 3: Use prompt enhancement
      const enhanceButton = screen.getByRole('button', { name: /enhance prompt/i })
      await user.click(enhanceButton)

      // Wait for enhancement
      await waitFor(() => {
        expect(PromptEnhancementPipeline.processPrompt).toHaveBeenCalled()
      })

      // Step 4: Generate with enhanced prompt
      const generateButton = screen.getByRole('button', { name: /generate tattoo/i })
      await user.click(generateButton)

      await waitFor(() => {
        expect(DesignService.generateTattoo).toHaveBeenCalledWith(
          expect.objectContaining({
            prompt: 'A professional traditional rose tattoo with bold black outlines'
          })
        )
      })
    })

    it('should complete style transfer workflow', async () => {
      const { StyleTransferService, DesignService } = require('@/services/styleTransferService')
      
      render(<TattooCreator />)

      // Step 1: Create initial design
      const promptInput = screen.getByPlaceholderText(/describe your ideal tattoo/i)
      await user.type(promptInput, 'A traditional rose tattoo')

      const styleSelect = screen.getByLabelText(/style/i)
      await user.click(styleSelect)
      const traditionalOption = screen.getByText('Traditional')
      await user.click(traditionalOption)

      const generateButton = screen.getByRole('button', { name: /generate tattoo/i })
      await user.click(generateButton)

      await waitFor(() => {
        expect(screen.getByAltText(/generated tattoo/i)).toBeInTheDocument()
      })

      // Step 2: Open style transfer
      const shuffleButton = screen.getByRole('button', { name: /shuffle/i })
      await user.click(shuffleButton)

      // Step 3: Select target style
      const targetStyleSelect = screen.getByRole('combobox')
      await user.click(targetStyleSelect)
      const realisticOption = screen.getByText('Realistic')
      await user.click(realisticOption)

      // Step 4: Perform transfer
      const transferButton = screen.getByRole('button', { name: /transfer style/i })
      await user.click(transferButton)

      await waitFor(() => {
        expect(StyleTransferService.transferStyle).toHaveBeenCalled()
      })

      // Step 5: Use transferred prompt
      const usePromptButton = screen.getByRole('button', { name: /use this prompt/i })
      await user.click(usePromptButton)

      // Step 6: Generate with transferred style
      const generateTransferredButton = screen.getByRole('button', { name: /generate tattoo/i })
      await user.click(generateTransferredButton)

      await waitFor(() => {
        expect(DesignService.generateTattoo).toHaveBeenCalledWith(
          expect.objectContaining({
            prompt: mockStyleTransferResult.transferredPrompt
          })
        )
      })
    })
  })

  describe('Error Handling Integration', () => {
    it('should handle generation errors gracefully in full workflow', async () => {
      const { DesignService } = require('@/services/designService')
      DesignService.generateTattoo.mockRejectedValue(new Error('API Error'))

      render(<TattooCreator />)

      const promptInput = screen.getByPlaceholderText(/describe your ideal tattoo/i)
      await user.type(promptInput, 'A beautiful rose tattoo')

      const generateButton = screen.getByRole('button', { name: /generate tattoo/i })
      await user.click(generateButton)

      await waitFor(() => {
        expect(screen.getByText(/generation failed/i)).toBeInTheDocument()
      })

      // Should allow retry
      expect(generateButton).not.toBeDisabled()
    })

    it('should handle style transfer errors in workflow', async () => {
      const { StyleTransferService } = require('@/services/styleTransferService')
      StyleTransferService.transferStyle.mockRejectedValue(new Error('Transfer failed'))

      render(<TattooCreator />)

      // Create initial design
      const promptInput = screen.getByPlaceholderText(/describe your ideal tattoo/i)
      await user.type(promptInput, 'A traditional rose tattoo')

      const styleSelect = screen.getByLabelText(/style/i)
      await user.click(styleSelect)
      const traditionalOption = screen.getByText('Traditional')
      await user.click(traditionalOption)

      const generateButton = screen.getByRole('button', { name: /generate tattoo/i })
      await user.click(generateButton)

      await waitFor(() => {
        expect(screen.getByAltText(/generated tattoo/i)).toBeInTheDocument()
      })

      // Attempt style transfer
      const shuffleButton = screen.getByRole('button', { name: /shuffle/i })
      await user.click(shuffleButton)

      const targetStyleSelect = screen.getByRole('combobox')
      await user.click(targetStyleSelect)
      const realisticOption = screen.getByText('Realistic')
      await user.click(realisticOption)

      const transferButton = screen.getByRole('button', { name: /transfer style/i })
      await user.click(transferButton)

      await waitFor(() => {
        expect(screen.getByText(/style transfer failed/i)).toBeInTheDocument()
      })

      // Should allow retry
      expect(transferButton).not.toBeDisabled()
    })

    it('should handle prompt enhancement errors gracefully', async () => {
      const { PromptEnhancementPipeline } = require('@/services/promptEnhancementPipeline')
      PromptEnhancementPipeline.processPrompt.mockRejectedValue(new Error('Enhancement failed'))

      render(<TattooCreator />)

      const promptInput = screen.getByPlaceholderText(/describe your ideal tattoo/i)
      await user.type(promptInput, 'rose')

      const settingsButton = screen.getByRole('button', { name: /settings/i })
      await user.click(settingsButton)

      const enhanceButton = screen.getByRole('button', { name: /enhance prompt/i })
      await user.click(enhanceButton)

      await waitFor(() => {
        expect(screen.getByText(/enhancement failed/i)).toBeInTheDocument()
      })

      // Should still allow generation with original prompt
      const generateButton = screen.getByRole('button', { name: /generate tattoo/i })
      expect(generateButton).not.toBeDisabled()
    })
  })

  describe('User Experience Flow', () => {
    it('should maintain state across different panels', async () => {
      render(<TattooCreator />)

      // Set initial values
      const promptInput = screen.getByPlaceholderText(/describe your ideal tattoo/i)
      await user.type(promptInput, 'A beautiful rose tattoo')

      const styleSelect = screen.getByLabelText(/style/i)
      await user.click(styleSelect)
      const traditionalOption = screen.getByText('Traditional')
      await user.click(traditionalOption)

      // Open advanced builder
      const settingsButton = screen.getByRole('button', { name: /settings/i })
      await user.click(settingsButton)

      // Close advanced builder
      await user.click(settingsButton)

      // Values should be preserved
      expect(promptInput).toHaveValue('A beautiful rose tattoo')
      expect(screen.getByDisplayValue('traditional')).toBeInTheDocument()
    })

    it('should provide feedback throughout the workflow', async () => {
      render(<TattooCreator />)

      const promptInput = screen.getByPlaceholderText(/describe your ideal tattoo/i)
      await user.type(promptInput, 'A beautiful rose tattoo')

      const generateButton = screen.getByRole('button', { name: /generate tattoo/i })
      await user.click(generateButton)

      // Should show loading state
      expect(screen.getByText(/generating/i)).toBeInTheDocument()

      await waitFor(() => {
        // Should show success state
        expect(screen.getByAltText(/generated tattoo/i)).toBeInTheDocument()
      })

      // Should show action buttons
      expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /download/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /share/i })).toBeInTheDocument()
    })

    it('should handle rapid user interactions gracefully', async () => {
      const { DesignService } = require('@/services/designService')
      
      render(<TattooCreator />)

      const promptInput = screen.getByPlaceholderText(/describe your ideal tattoo/i)
      await user.type(promptInput, 'A beautiful rose tattoo')

      const generateButton = screen.getByRole('button', { name: /generate tattoo/i })
      
      // Rapid clicks should not cause multiple generations
      await user.click(generateButton)
      await user.click(generateButton)
      await user.click(generateButton)

      await waitFor(() => {
        expect(DesignService.generateTattoo).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('Performance Integration', () => {
    it('should handle large prompts efficiently', async () => {
      const { DesignService } = require('@/services/designService')
      
      render(<TattooCreator />)

      const largePrompt = 'A very detailed '.repeat(100) + 'rose tattoo'
      const promptInput = screen.getByPlaceholderText(/describe your ideal tattoo/i)
      await user.type(promptInput, largePrompt)

      const startTime = performance.now()
      const generateButton = screen.getByRole('button', { name: /generate tattoo/i })
      await user.click(generateButton)

      await waitFor(() => {
        expect(DesignService.generateTattoo).toHaveBeenCalled()
      })

      const endTime = performance.now()
      expect(endTime - startTime).toBeLessThan(2000) // Should handle large prompts quickly
    })

    it('should handle multiple concurrent operations', async () => {
      const { DesignService, StyleTransferService } = require('@/services/designService')
      
      render(<TattooCreator />)

      // Start generation
      const promptInput = screen.getByPlaceholderText(/describe your ideal tattoo/i)
      await user.type(promptInput, 'A traditional rose tattoo')

      const styleSelect = screen.getByLabelText(/style/i)
      await user.click(styleSelect)
      const traditionalOption = screen.getByText('Traditional')
      await user.click(traditionalOption)

      const generateButton = screen.getByRole('button', { name: /generate tattoo/i })
      await user.click(generateButton)

      await waitFor(() => {
        expect(screen.getByAltText(/generated tattoo/i)).toBeInTheDocument()
      })

      // Start style transfer while generation result is displayed
      const shuffleButton = screen.getByRole('button', { name: /shuffle/i })
      await user.click(shuffleButton)

      const targetStyleSelect = screen.getByRole('combobox')
      await user.click(targetStyleSelect)
      const realisticOption = screen.getByText('Realistic')
      await user.click(realisticOption)

      const transferButton = screen.getByRole('button', { name: /transfer style/i })
      await user.click(transferButton)

      await waitFor(() => {
        expect(StyleTransferService.transferStyle).toHaveBeenCalled()
      })

      // Both operations should complete successfully
      expect(DesignService.generateTattoo).toHaveBeenCalled()
      expect(StyleTransferService.transferStyle).toHaveBeenCalled()
    })
  })

  describe('Accessibility Integration', () => {
    it('should maintain focus management throughout workflow', async () => {
      render(<TattooCreator />)

      const promptInput = screen.getByPlaceholderText(/describe your ideal tattoo/i)
      promptInput.focus()
      expect(document.activeElement).toBe(promptInput)

      await user.tab()
      const styleSelect = screen.getByLabelText(/style/i)
      expect(document.activeElement).toBe(styleSelect)

      await user.tab()
      const techniqueSelect = screen.getByLabelText(/technique/i)
      expect(document.activeElement).toBe(techniqueSelect)
    })

    it('should announce state changes to screen readers', async () => {
      render(<TattooCreator />)

      const promptInput = screen.getByPlaceholderText(/describe your ideal tattoo/i)
      await user.type(promptInput, 'A beautiful rose tattoo')

      const generateButton = screen.getByRole('button', { name: /generate tattoo/i })
      await user.click(generateButton)

      // Loading state should be announced
      expect(screen.getByText(/generating/i)).toBeInTheDocument()

      await waitFor(() => {
        // Success state should be announced
        expect(screen.getByAltText(/generated tattoo/i)).toBeInTheDocument()
      })
    })
  })
})
