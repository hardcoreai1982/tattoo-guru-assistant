import { describe, it, expect, vi, beforeEach } from 'vitest'
import { StyleTransferService } from '../styleTransferService'
import type { StyleTransferRequest } from '../styleTransferService'

describe('StyleTransferService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('transferStyle', () => {
    it('should successfully transfer from traditional to realistic style', async () => {
      const request: StyleTransferRequest = {
        originalPrompt: 'A traditional rose tattoo with bold black outlines',
        originalStyle: 'traditional',
        targetStyle: 'realistic',
        preserveSubject: true,
        preserveComposition: true,
        preserveColorScheme: false,
        targetModel: 'flux'
      }

      const result = await StyleTransferService.transferStyle(request)

      expect(result).toBeDefined()
      expect(result.fromStyle).toBe('traditional')
      expect(result.toStyle).toBe('realistic')
      expect(result.confidence).toBeGreaterThan(70)
      expect(result.compatibilityScore).toBe(85)
      expect(result.transferredPrompt).toContain('photorealistic')
      expect(result.transferredPrompt).toContain('fine detailed linework')
      expect(result.preservedElements).toContain('rose')
      expect(result.transformedElements).toHaveLength(4)
    })

    it('should handle low compatibility transfers with warnings', async () => {
      const request: StyleTransferRequest = {
        originalPrompt: 'A watercolor butterfly tattoo',
        originalStyle: 'watercolor',
        targetStyle: 'blackwork',
        preserveSubject: true,
        preserveComposition: true,
        preserveColorScheme: true,
        targetModel: 'flux'
      }

      const result = await StyleTransferService.transferStyle(request)

      expect(result.compatibilityScore).toBe(50)
      expect(result.warnings).toHaveLength(1)
      expect(result.warnings[0]).toContain('challenging transformation')
      expect(result.transferredPrompt).toContain('bold black ink')
      expect(result.suggestions).toHaveLength(1)
    })

    it('should preserve elements when requested', async () => {
      const request: StyleTransferRequest = {
        originalPrompt: 'A geometric mandala with blue and gold colors',
        originalStyle: 'geometric',
        targetStyle: 'minimalist',
        preserveSubject: true,
        preserveComposition: true,
        preserveColorScheme: true,
        targetModel: 'flux'
      }

      const result = await StyleTransferService.transferStyle(request)

      expect(result.preservedElements).toContain('mandala')
      expect(result.preservedElements).toContain('blue and gold colors')
      expect(result.transferredPrompt).toContain('blue and gold')
    })

    it('should include custom instructions when provided', async () => {
      const request: StyleTransferRequest = {
        originalPrompt: 'A traditional dragon tattoo',
        originalStyle: 'traditional',
        targetStyle: 'realistic',
        preserveSubject: true,
        preserveComposition: true,
        preserveColorScheme: false,
        targetModel: 'flux',
        customInstructions: 'Make it more fierce and add fire elements'
      }

      const result = await StyleTransferService.transferStyle(request)

      expect(result.transferredPrompt).toContain('fierce')
      expect(result.transferredPrompt).toContain('fire elements')
    })

    it('should throw error for same source and target styles', async () => {
      const request: StyleTransferRequest = {
        originalPrompt: 'A traditional rose tattoo',
        originalStyle: 'traditional',
        targetStyle: 'traditional',
        preserveSubject: true,
        preserveComposition: true,
        preserveColorScheme: false,
        targetModel: 'flux'
      }

      await expect(StyleTransferService.transferStyle(request))
        .rejects.toThrow('Source and target styles cannot be the same')
    })

    it('should handle unsupported style combinations gracefully', async () => {
      const request: StyleTransferRequest = {
        originalPrompt: 'A custom style tattoo',
        originalStyle: 'custom' as any,
        targetStyle: 'realistic',
        preserveSubject: true,
        preserveComposition: true,
        preserveColorScheme: false,
        targetModel: 'flux'
      }

      const result = await StyleTransferService.transferStyle(request)

      // Should fall back to style enhancement
      expect(result.confidence).toBeLessThan(70)
      expect(result.warnings).toContain('No specific transfer rule found')
    })
  })

  describe('previewTransfer', () => {
    it('should provide accurate preview for supported combinations', () => {
      const preview = StyleTransferService.previewTransfer('traditional', 'realistic')

      expect(preview).toBeDefined()
      expect(preview.compatibility).toBe(85)
      expect(preview.preservedElements).toContain('subject matter')
      expect(preview.modifiedElements).toContain('line style')
      expect(preview.warnings).toHaveLength(0)
    })

    it('should show warnings for challenging combinations', () => {
      const preview = StyleTransferService.previewTransfer('watercolor', 'blackwork')

      expect(preview.compatibility).toBe(50)
      expect(preview.warnings).toHaveLength(1)
      expect(preview.warnings[0]).toContain('challenging transformation')
    })

    it('should handle unsupported combinations', () => {
      const preview = StyleTransferService.previewTransfer('custom' as any, 'realistic')

      expect(preview.compatibility).toBe(60)
      expect(preview.warnings).toContain('Limited transfer support')
    })
  })

  describe('getAvailableTransfers', () => {
    it('should return all available transfer combinations', () => {
      const transfers = StyleTransferService.getAvailableTransfers()

      expect(transfers).toHaveLength(6)
      expect(transfers).toContainEqual({
        from: 'traditional',
        to: 'realistic',
        compatibility: 85
      })
      expect(transfers).toContainEqual({
        from: 'watercolor',
        to: 'blackwork',
        compatibility: 50
      })
    })

    it('should sort transfers by compatibility score', () => {
      const transfers = StyleTransferService.getAvailableTransfers()

      for (let i = 0; i < transfers.length - 1; i++) {
        expect(transfers[i].compatibility).toBeGreaterThanOrEqual(transfers[i + 1].compatibility)
      }
    })
  })

  describe('private methods', () => {
    it('should calculate confidence correctly', () => {
      // Test through public method since private methods aren't directly accessible
      const highCompatibilityRequest: StyleTransferRequest = {
        originalPrompt: 'A geometric pattern',
        originalStyle: 'geometric',
        targetStyle: 'minimalist',
        preserveSubject: true,
        preserveComposition: true,
        preserveColorScheme: false,
        targetModel: 'flux'
      }

      return StyleTransferService.transferStyle(highCompatibilityRequest).then(result => {
        expect(result.confidence).toBeGreaterThan(80)
      })
    })

    it('should estimate quality based on compatibility and transformations', async () => {
      const request: StyleTransferRequest = {
        originalPrompt: 'A simple geometric design',
        originalStyle: 'geometric',
        targetStyle: 'minimalist',
        preserveSubject: true,
        preserveComposition: true,
        preserveColorScheme: false,
        targetModel: 'flux'
      }

      const result = await StyleTransferService.transferStyle(request)

      expect(result.estimatedQuality).toBeGreaterThan(80)
      expect(result.estimatedQuality).toBeLessThanOrEqual(100)
    })
  })

  describe('edge cases', () => {
    it('should handle empty prompts', async () => {
      const request: StyleTransferRequest = {
        originalPrompt: '',
        originalStyle: 'traditional',
        targetStyle: 'realistic',
        preserveSubject: true,
        preserveComposition: true,
        preserveColorScheme: false,
        targetModel: 'flux'
      }

      await expect(StyleTransferService.transferStyle(request))
        .rejects.toThrow('Original prompt cannot be empty')
    })

    it('should handle very long prompts', async () => {
      const longPrompt = 'A '.repeat(1000) + 'traditional rose tattoo'
      const request: StyleTransferRequest = {
        originalPrompt: longPrompt,
        originalStyle: 'traditional',
        targetStyle: 'realistic',
        preserveSubject: true,
        preserveComposition: true,
        preserveColorScheme: false,
        targetModel: 'flux'
      }

      const result = await StyleTransferService.transferStyle(request)

      expect(result).toBeDefined()
      expect(result.transferredPrompt.length).toBeLessThan(longPrompt.length * 2)
    })

    it('should handle special characters in prompts', async () => {
      const request: StyleTransferRequest = {
        originalPrompt: 'A traditional tattoo with "quotes" & symbols!',
        originalStyle: 'traditional',
        targetStyle: 'realistic',
        preserveSubject: true,
        preserveComposition: true,
        preserveColorScheme: false,
        targetModel: 'flux'
      }

      const result = await StyleTransferService.transferStyle(request)

      expect(result).toBeDefined()
      expect(result.transferredPrompt).toContain('quotes')
      expect(result.transferredPrompt).toContain('symbols')
    })
  })

  describe('performance', () => {
    it('should complete transfers within reasonable time', async () => {
      const request: StyleTransferRequest = {
        originalPrompt: 'A traditional rose tattoo',
        originalStyle: 'traditional',
        targetStyle: 'realistic',
        preserveSubject: true,
        preserveComposition: true,
        preserveColorScheme: false,
        targetModel: 'flux'
      }

      const startTime = performance.now()
      await StyleTransferService.transferStyle(request)
      const endTime = performance.now()

      expect(endTime - startTime).toBeLessThan(1000) // Should complete within 1 second
    })

    it('should handle multiple concurrent transfers', async () => {
      const requests = Array.from({ length: 5 }, (_, i) => ({
        originalPrompt: `A traditional tattoo ${i}`,
        originalStyle: 'traditional' as const,
        targetStyle: 'realistic' as const,
        preserveSubject: true,
        preserveComposition: true,
        preserveColorScheme: false,
        targetModel: 'flux' as const
      }))

      const startTime = performance.now()
      const results = await Promise.all(
        requests.map(request => StyleTransferService.transferStyle(request))
      )
      const endTime = performance.now()

      expect(results).toHaveLength(5)
      expect(endTime - startTime).toBeLessThan(2000) // Should handle concurrent requests efficiently
      results.forEach(result => {
        expect(result).toBeDefined()
        expect(result.confidence).toBeGreaterThan(0)
      })
    })
  })
})
