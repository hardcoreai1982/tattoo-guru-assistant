import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/test/utils'
import userEvent from '@testing-library/user-event'
import StyleTransferPanel from '../StyleTransferPanel'
import { mockStyleTransferResult } from '@/test/utils'

// Mock the style transfer service
vi.mock('@/services/styleTransferService', () => ({
  StyleTransferService: {
    transferStyle: vi.fn(),
    previewTransfer: vi.fn(),
  },
}))

describe('StyleTransferPanel', () => {
  const user = userEvent.setup()
  
  const defaultProps = {
    originalPrompt: 'A traditional rose tattoo',
    originalStyle: 'traditional',
    onTransferComplete: vi.fn(),
    onPromptUpdate: vi.fn(),
    availableModels: ['flux', 'openai', 'stablediffusion'],
    currentModel: 'flux' as const,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    
    const { StyleTransferService } = require('@/services/styleTransferService')
    StyleTransferService.previewTransfer.mockReturnValue({
      compatibility: 85,
      preservedElements: ['subject matter', 'composition'],
      modifiedElements: ['line style', 'color approach'],
      warnings: []
    })
    StyleTransferService.transferStyle.mockResolvedValue(mockStyleTransferResult)
  })

  describe('Basic Rendering', () => {
    it('should render the style transfer panel', () => {
      render(<StyleTransferPanel {...defaultProps} />)

      expect(screen.getByText('Style Transfer')).toBeInTheDocument()
      expect(screen.getByText(/transform your design from traditional/i)).toBeInTheDocument()
      expect(screen.getByText('Current Style')).toBeInTheDocument()
      expect(screen.getByText('traditional')).toBeInTheDocument()
    })

    it('should show available target styles', async () => {
      render(<StyleTransferPanel {...defaultProps} />)

      const targetStyleSelect = screen.getByRole('combobox')
      await user.click(targetStyleSelect)

      expect(screen.getByText('Realistic')).toBeInTheDocument()
      expect(screen.getByText('Geometric')).toBeInTheDocument()
      expect(screen.getByText('Watercolor')).toBeInTheDocument()
      expect(screen.getByText('Minimalist')).toBeInTheDocument()
      expect(screen.getByText('Blackwork')).toBeInTheDocument()
      
      // Should not show the current style
      expect(screen.queryByText('Traditional')).not.toBeInTheDocument()
    })

    it('should show transfer options', () => {
      render(<StyleTransferPanel {...defaultProps} />)

      expect(screen.getByLabelText(/preserve subject/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/preserve composition/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/preserve color scheme/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/target ai model/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/custom instructions/i)).toBeInTheDocument()
    })
  })

  describe('Style Selection', () => {
    it('should update preview when target style is selected', async () => {
      const { StyleTransferService } = require('@/services/styleTransferService')
      
      render(<StyleTransferPanel {...defaultProps} />)

      const targetStyleSelect = screen.getByRole('combobox')
      await user.click(targetStyleSelect)
      
      const realisticOption = screen.getByText('Realistic')
      await user.click(realisticOption)

      await waitFor(() => {
        expect(StyleTransferService.previewTransfer).toHaveBeenCalledWith('traditional', 'realistic')
      })
    })

    it('should show compatibility preview', async () => {
      render(<StyleTransferPanel {...defaultProps} />)

      const targetStyleSelect = screen.getByRole('combobox')
      await user.click(targetStyleSelect)
      
      const realisticOption = screen.getByText('Realistic')
      await user.click(realisticOption)

      await waitFor(() => {
        expect(screen.getByText('Transfer Compatibility')).toBeInTheDocument()
        expect(screen.getByText('85%')).toBeInTheDocument()
        expect(screen.getByText('Preserved')).toBeInTheDocument()
        expect(screen.getByText('Modified')).toBeInTheDocument()
      })
    })

    it('should show warnings for challenging combinations', async () => {
      const { StyleTransferService } = require('@/services/styleTransferService')
      StyleTransferService.previewTransfer.mockReturnValue({
        compatibility: 50,
        preservedElements: ['subject matter'],
        modifiedElements: ['style approach', 'color handling'],
        warnings: ['This is a challenging transformation that may require manual refinement']
      })

      render(<StyleTransferPanel {...defaultProps} />)

      const targetStyleSelect = screen.getByRole('combobox')
      await user.click(targetStyleSelect)
      
      const blackworkOption = screen.getByText('Blackwork')
      await user.click(blackworkOption)

      await waitFor(() => {
        expect(screen.getByText('Warnings')).toBeInTheDocument()
        expect(screen.getByText(/challenging transformation/i)).toBeInTheDocument()
      })
    })
  })

  describe('Transfer Options', () => {
    it('should toggle preserve subject option', async () => {
      render(<StyleTransferPanel {...defaultProps} />)

      const preserveSubjectSwitch = screen.getByLabelText(/preserve subject/i)
      expect(preserveSubjectSwitch).toBeChecked()

      await user.click(preserveSubjectSwitch)
      expect(preserveSubjectSwitch).not.toBeChecked()
    })

    it('should toggle preserve composition option', async () => {
      render(<StyleTransferPanel {...defaultProps} />)

      const preserveCompositionSwitch = screen.getByLabelText(/preserve composition/i)
      expect(preserveCompositionSwitch).toBeChecked()

      await user.click(preserveCompositionSwitch)
      expect(preserveCompositionSwitch).not.toBeChecked()
    })

    it('should toggle preserve color scheme option', async () => {
      render(<StyleTransferPanel {...defaultProps} />)

      const preserveColorSwitch = screen.getByLabelText(/preserve color scheme/i)
      expect(preserveColorSwitch).not.toBeChecked()

      await user.click(preserveColorSwitch)
      expect(preserveColorSwitch).toBeChecked()
    })

    it('should update target model selection', async () => {
      render(<StyleTransferPanel {...defaultProps} />)

      const modelSelect = screen.getByLabelText(/target ai model/i)
      await user.click(modelSelect)
      
      const openaiOption = screen.getByText('OPENAI')
      await user.click(openaiOption)

      expect(screen.getByDisplayValue('openai')).toBeInTheDocument()
    })

    it('should accept custom instructions', async () => {
      render(<StyleTransferPanel {...defaultProps} />)

      const customInstructionsTextarea = screen.getByLabelText(/custom instructions/i)
      await user.type(customInstructionsTextarea, 'Make it more detailed and add shadows')

      expect(customInstructionsTextarea).toHaveValue('Make it more detailed and add shadows')
    })
  })

  describe('Style Transfer Execution', () => {
    it('should perform style transfer when button is clicked', async () => {
      const { StyleTransferService } = require('@/services/styleTransferService')
      
      render(<StyleTransferPanel {...defaultProps} />)

      // Select target style
      const targetStyleSelect = screen.getByRole('combobox')
      await user.click(targetStyleSelect)
      const realisticOption = screen.getByText('Realistic')
      await user.click(realisticOption)

      // Click transfer button
      const transferButton = screen.getByRole('button', { name: /transfer style/i })
      await user.click(transferButton)

      await waitFor(() => {
        expect(StyleTransferService.transferStyle).toHaveBeenCalledWith({
          originalPrompt: 'A traditional rose tattoo',
          originalStyle: 'traditional',
          targetStyle: 'realistic',
          preserveSubject: true,
          preserveComposition: true,
          preserveColorScheme: false,
          targetModel: 'flux',
          customInstructions: undefined
        })
      })
    })

    it('should show loading state during transfer', async () => {
      const { StyleTransferService } = require('@/services/styleTransferService')
      StyleTransferService.transferStyle.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(mockStyleTransferResult), 100))
      )

      render(<StyleTransferPanel {...defaultProps} />)

      // Select target style
      const targetStyleSelect = screen.getByRole('combobox')
      await user.click(targetStyleSelect)
      const realisticOption = screen.getByText('Realistic')
      await user.click(realisticOption)

      // Click transfer button
      const transferButton = screen.getByRole('button', { name: /transfer style/i })
      await user.click(transferButton)

      expect(screen.getByText('Transferring...')).toBeInTheDocument()
      expect(transferButton).toBeDisabled()

      await waitFor(() => {
        expect(screen.queryByText('Transferring...')).not.toBeInTheDocument()
      })
    })

    it('should call onTransferComplete when transfer succeeds', async () => {
      render(<StyleTransferPanel {...defaultProps} />)

      // Select target style
      const targetStyleSelect = screen.getByRole('combobox')
      await user.click(targetStyleSelect)
      const realisticOption = screen.getByText('Realistic')
      await user.click(realisticOption)

      // Click transfer button
      const transferButton = screen.getByRole('button', { name: /transfer style/i })
      await user.click(transferButton)

      await waitFor(() => {
        expect(defaultProps.onTransferComplete).toHaveBeenCalledWith(mockStyleTransferResult)
      })
    })

    it('should show transfer result', async () => {
      render(<StyleTransferPanel {...defaultProps} />)

      // Select target style and transfer
      const targetStyleSelect = screen.getByRole('combobox')
      await user.click(targetStyleSelect)
      const realisticOption = screen.getByText('Realistic')
      await user.click(realisticOption)

      const transferButton = screen.getByRole('button', { name: /transfer style/i })
      await user.click(transferButton)

      await waitFor(() => {
        expect(screen.getByText('Transfer Result')).toBeInTheDocument()
        expect(screen.getByText('85% confidence')).toBeInTheDocument()
        expect(screen.getByText('Transferred Prompt')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /use this prompt/i })).toBeInTheDocument()
      })
    })

    it('should handle transfer errors', async () => {
      const { StyleTransferService } = require('@/services/styleTransferService')
      StyleTransferService.transferStyle.mockRejectedValue(new Error('Transfer failed'))

      render(<StyleTransferPanel {...defaultProps} />)

      // Select target style
      const targetStyleSelect = screen.getByRole('combobox')
      await user.click(targetStyleSelect)
      const realisticOption = screen.getByText('Realistic')
      await user.click(realisticOption)

      // Click transfer button
      const transferButton = screen.getByRole('button', { name: /transfer style/i })
      await user.click(transferButton)

      await waitFor(() => {
        expect(screen.getByText(/style transfer failed/i)).toBeInTheDocument()
      })
    })
  })

  describe('Validation', () => {
    it('should require target style selection', async () => {
      render(<StyleTransferPanel {...defaultProps} />)

      const transferButton = screen.getByRole('button', { name: /transfer style/i })
      await user.click(transferButton)

      expect(screen.getByText(/please select a target style/i)).toBeInTheDocument()
    })

    it('should prevent transfer to same style', async () => {
      const propsWithSameStyle = {
        ...defaultProps,
        originalStyle: 'realistic',
      }

      render(<StyleTransferPanel {...propsWithSameStyle} />)

      // Try to select the same style (this shouldn't be possible in UI, but test the validation)
      const transferButton = screen.getByRole('button', { name: /transfer style/i })
      expect(transferButton).toBeDisabled()
    })
  })

  describe('Result Actions', () => {
    beforeEach(async () => {
      render(<StyleTransferPanel {...defaultProps} />)

      // Perform a transfer to get results
      const targetStyleSelect = screen.getByRole('combobox')
      await user.click(targetStyleSelect)
      const realisticOption = screen.getByText('Realistic')
      await user.click(realisticOption)

      const transferButton = screen.getByRole('button', { name: /transfer style/i })
      await user.click(transferButton)

      await waitFor(() => {
        expect(screen.getByText('Transfer Result')).toBeInTheDocument()
      })
    })

    it('should use transferred prompt when button is clicked', async () => {
      const usePromptButton = screen.getByRole('button', { name: /use this prompt/i })
      await user.click(usePromptButton)

      expect(defaultProps.onPromptUpdate).toHaveBeenCalledWith(mockStyleTransferResult.transferredPrompt)
    })

    it('should copy transferred prompt to clipboard', async () => {
      const copyButton = screen.getByRole('button', { name: /copy/i })
      await user.click(copyButton)

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(mockStyleTransferResult.transferredPrompt)
    })

    it('should show transformations applied', () => {
      expect(screen.getByText('Transformations Applied')).toBeInTheDocument()
      expect(screen.getByText('Style adaptation for realistic approach')).toBeInTheDocument()
    })

    it('should show suggestions when available', () => {
      expect(screen.getByText('Suggestions')).toBeInTheDocument()
      expect(screen.getByText('Consider adding more detail for better realism')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<StyleTransferPanel {...defaultProps} />)

      expect(screen.getByLabelText(/preserve subject/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/preserve composition/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/preserve color scheme/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/target ai model/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/custom instructions/i)).toBeInTheDocument()
    })

    it('should support keyboard navigation', async () => {
      render(<StyleTransferPanel {...defaultProps} />)

      const targetStyleSelect = screen.getByRole('combobox')
      targetStyleSelect.focus()

      expect(document.activeElement).toBe(targetStyleSelect)

      await user.tab()
      expect(document.activeElement).not.toBe(targetStyleSelect)
    })

    it('should announce transfer progress to screen readers', async () => {
      render(<StyleTransferPanel {...defaultProps} />)

      // Select target style
      const targetStyleSelect = screen.getByRole('combobox')
      await user.click(targetStyleSelect)
      const realisticOption = screen.getByText('Realistic')
      await user.click(realisticOption)

      // Click transfer button
      const transferButton = screen.getByRole('button', { name: /transfer style/i })
      await user.click(transferButton)

      expect(screen.getByText('Transferring...')).toBeInTheDocument()
    })
  })

  describe('Mobile Responsiveness', () => {
    it('should render mobile-optimized layout', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })

      render(<StyleTransferPanel {...defaultProps} />)

      expect(screen.getByText('Style Transfer')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /transfer style/i })).toBeInTheDocument()
    })

    it('should handle touch interactions', async () => {
      render(<StyleTransferPanel {...defaultProps} />)

      const targetStyleSelect = screen.getByRole('combobox')
      
      // Simulate touch events
      await user.click(targetStyleSelect)
      
      expect(screen.getByText('Realistic')).toBeInTheDocument()
    })
  })
})
