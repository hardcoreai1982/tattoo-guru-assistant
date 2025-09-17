import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PromptEnhancementPipeline } from '../promptEnhancementPipeline'
import type { EnhancementContext } from '../promptEnhancementPipeline'

// Mock the supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({ 
        data: { user: { id: 'test-user-id' } }, 
        error: null 
      }),
    },
    from: vi.fn(() => ({
      insert: vi.fn().mockResolvedValue({ data: { id: 'test-id' }, error: null }),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [], error: null }),
    })),
  },
}))

describe('PromptEnhancementPipeline', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('processPrompt', () => {
    const defaultContext: EnhancementContext = {
      style: 'traditional',
      technique: 'linework',
      subject: 'rose',
      colorPalette: 'red,green',
      bodyZone: 'arm',
      targetModel: 'flux',
      userPreferences: {},
      isPreviewMode: false
    }

    it('should enhance a basic prompt through all stages', async () => {
      const basicPrompt = 'rose tattoo'
      
      const result = await PromptEnhancementPipeline.processPrompt(basicPrompt, defaultContext)

      expect(result).toBeDefined()
      expect(result.enhancedPrompt).toContain('traditional')
      expect(result.enhancedPrompt).toContain('rose')
      expect(result.enhancedPrompt).toContain('tattoo')
      expect(result.confidence).toBeGreaterThan(60)
      expect(result.confidence).toBeLessThanOrEqual(95)
      expect(result.stageResults).toHaveLength(6)
      expect(result.processingTime).toBeGreaterThan(0)
    })

    it('should apply domain context enhancement', async () => {
      const prompt = 'flower design'
      
      const result = await PromptEnhancementPipeline.processPrompt(prompt, defaultContext)

      expect(result.enhancedPrompt).toContain('tattoo')
      expect(result.stageResults[0].stageName).toBe('Domain Context')
      expect(result.stageResults[0].applied).toBe(true)
    })

    it('should enhance style-specific elements', async () => {
      const prompt = 'rose tattoo'
      const context = { ...defaultContext, style: 'watercolor' }
      
      const result = await PromptEnhancementPipeline.processPrompt(prompt, context)

      expect(result.enhancedPrompt).toContain('watercolor')
      expect(result.stageResults[1].stageName).toBe('Style Enhancement')
      expect(result.stageResults[1].applied).toBe(true)
    })

    it('should apply technical optimization', async () => {
      const prompt = 'simple rose'
      
      const result = await PromptEnhancementPipeline.processPrompt(prompt, defaultContext)

      expect(result.enhancedPrompt).toContain('high resolution')
      expect(result.stageResults[2].stageName).toBe('Technical Optimization')
      expect(result.stageResults[2].applied).toBe(true)
    })

    it('should adapt for specific AI models', async () => {
      const prompt = 'rose tattoo'
      const context = { ...defaultContext, targetModel: 'openai' }
      
      const result = await PromptEnhancementPipeline.processPrompt(prompt, context)

      expect(result.stageResults[3].stageName).toBe('Model Adaptation')
      expect(result.stageResults[3].applied).toBe(true)
    })

    it('should enhance quality aspects', async () => {
      const prompt = 'rose tattoo'
      
      const result = await PromptEnhancementPipeline.processPrompt(prompt, defaultContext)

      expect(result.enhancedPrompt).toContain('professional')
      expect(result.stageResults[4].stageName).toBe('Quality Enhancement')
      expect(result.stageResults[4].applied).toBe(true)
    })

    it('should refine context and flow', async () => {
      const prompt = 'rose tattoo'
      
      const result = await PromptEnhancementPipeline.processPrompt(prompt, defaultContext)

      expect(result.stageResults[5].stageName).toBe('Context Refinement')
      expect(result.stageResults[5].applied).toBe(true)
    })

    it('should handle custom stage weights', async () => {
      const prompt = 'rose tattoo'
      const customWeights = {
        domainContext: 0.5,
        styleEnhancement: 2.0,
        technicalOptimization: 1.0,
        modelAdaptation: 1.0,
        qualityEnhancement: 1.0,
        contextRefinement: 1.0
      }
      
      const result = await PromptEnhancementPipeline.processPrompt(
        prompt, 
        defaultContext, 
        customWeights
      )

      expect(result).toBeDefined()
      expect(result.stageResults[1].weight).toBe(2.0) // Style enhancement should have higher weight
    })

    it('should skip disabled stages', async () => {
      const prompt = 'rose tattoo'
      const enabledStages = {
        domainContext: true,
        styleEnhancement: false,
        technicalOptimization: true,
        modelAdaptation: false,
        qualityEnhancement: true,
        contextRefinement: true
      }
      
      const result = await PromptEnhancementPipeline.processPrompt(
        prompt, 
        defaultContext, 
        undefined, 
        enabledStages
      )

      const appliedStages = result.stageResults.filter(stage => stage.applied)
      expect(appliedStages).toHaveLength(4) // Only enabled stages should be applied
      expect(result.stageResults[1].applied).toBe(false) // Style enhancement disabled
      expect(result.stageResults[3].applied).toBe(false) // Model adaptation disabled
    })

    it('should calculate confidence based on enhancements', async () => {
      const veryBasicPrompt = 'rose'
      const detailedPrompt = 'A professional traditional rose tattoo with bold black outlines and red colors'
      
      const basicResult = await PromptEnhancementPipeline.processPrompt(veryBasicPrompt, defaultContext)
      const detailedResult = await PromptEnhancementPipeline.processPrompt(detailedPrompt, defaultContext)

      expect(basicResult.confidence).toBeLessThan(detailedResult.confidence)
    })

    it('should handle preview mode', async () => {
      const prompt = 'rose tattoo'
      const previewContext = { ...defaultContext, isPreviewMode: true }
      
      const result = await PromptEnhancementPipeline.processPrompt(prompt, previewContext)

      expect(result).toBeDefined()
      // Preview mode might have different behavior, but should still work
      expect(result.enhancedPrompt).toBeDefined()
    })

    it('should incorporate user preferences', async () => {
      const prompt = 'rose tattoo'
      const contextWithPrefs = {
        ...defaultContext,
        userPreferences: {
          preferredStyles: ['traditional', 'realistic'],
          avoidedElements: ['skulls'],
          qualityLevel: 'high'
        }
      }
      
      const result = await PromptEnhancementPipeline.processPrompt(prompt, contextWithPrefs)

      expect(result).toBeDefined()
      expect(result.enhancedPrompt).not.toContain('skull')
    })
  })

  describe('savePipelineResult', () => {
    it('should save pipeline result to database', async () => {
      const mockResult = {
        originalPrompt: 'rose tattoo',
        enhancedPrompt: 'A professional traditional rose tattoo',
        confidence: 85,
        stageResults: [],
        processingTime: 1500,
        metadata: {}
      }

      const success = await PromptEnhancementPipeline.savePipelineResult(mockResult)

      expect(success).toBe(true)
    })

    it('should handle database errors gracefully', async () => {
      // Mock database error
      const mockSupabase = await import('@/integrations/supabase/client')
      vi.mocked(mockSupabase.supabase.from).mockReturnValue({
        insert: vi.fn().mockResolvedValue({ data: null, error: new Error('Database error') })
      } as any)

      const mockResult = {
        originalPrompt: 'rose tattoo',
        enhancedPrompt: 'A professional traditional rose tattoo',
        confidence: 85,
        stageResults: [],
        processingTime: 1500,
        metadata: {}
      }

      const success = await PromptEnhancementPipeline.savePipelineResult(mockResult)

      expect(success).toBe(false)
    })
  })

  describe('getEnhancementHistory', () => {
    it('should retrieve user enhancement history', async () => {
      const history = await PromptEnhancementPipeline.getEnhancementHistory(10)

      expect(history).toBeDefined()
      expect(Array.isArray(history)).toBe(true)
    })

    it('should handle database errors in history retrieval', async () => {
      // Mock database error
      const mockSupabase = await import('@/integrations/supabase/client')
      vi.mocked(mockSupabase.supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: null, error: new Error('Database error') })
      } as any)

      const history = await PromptEnhancementPipeline.getEnhancementHistory(10)

      expect(history).toEqual([])
    })
  })

  describe('edge cases', () => {
    it('should handle empty prompts', async () => {
      const result = await PromptEnhancementPipeline.processPrompt('', defaultContext)

      expect(result.enhancedPrompt).toBeTruthy()
      expect(result.confidence).toBeLessThan(70) // Lower confidence for empty input
    })

    it('should handle very long prompts', async () => {
      const longPrompt = 'A '.repeat(500) + 'rose tattoo'
      
      const result = await PromptEnhancementPipeline.processPrompt(longPrompt, defaultContext)

      expect(result).toBeDefined()
      expect(result.enhancedPrompt.length).toBeLessThan(longPrompt.length * 2) // Should not explode in size
    })

    it('should handle special characters', async () => {
      const specialPrompt = 'A rose tattoo with "quotes" & symbols!'
      
      const result = await PromptEnhancementPipeline.processPrompt(specialPrompt, defaultContext)

      expect(result).toBeDefined()
      expect(result.enhancedPrompt).toContain('quotes')
      expect(result.enhancedPrompt).toContain('symbols')
    })

    it('should handle missing context fields gracefully', async () => {
      const minimalContext: Partial<EnhancementContext> = {
        targetModel: 'flux'
      }
      
      const result = await PromptEnhancementPipeline.processPrompt(
        'rose tattoo', 
        minimalContext as EnhancementContext
      )

      expect(result).toBeDefined()
      expect(result.confidence).toBeGreaterThan(0)
    })
  })

  describe('performance', () => {
    it('should complete enhancement within reasonable time', async () => {
      const startTime = performance.now()
      
      await PromptEnhancementPipeline.processPrompt('rose tattoo', defaultContext)
      
      const endTime = performance.now()
      expect(endTime - startTime).toBeLessThan(1000) // Should complete within 1 second
    })

    it('should handle concurrent enhancements', async () => {
      const prompts = ['rose tattoo', 'dragon tattoo', 'butterfly tattoo']
      
      const startTime = performance.now()
      const results = await Promise.all(
        prompts.map(prompt => PromptEnhancementPipeline.processPrompt(prompt, defaultContext))
      )
      const endTime = performance.now()

      expect(results).toHaveLength(3)
      expect(endTime - startTime).toBeLessThan(2000) // Should handle concurrent requests efficiently
      results.forEach(result => {
        expect(result).toBeDefined()
        expect(result.confidence).toBeGreaterThan(0)
      })
    })
  })
})
