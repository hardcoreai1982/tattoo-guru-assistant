import { test, expect } from '@playwright/test';

test.describe('Tattoo Creation E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/create');
  });

  test('should create a tattoo design from start to finish', async ({ page }) => {
    // Fill in the prompt
    await page.fill('[placeholder*="describe your ideal tattoo"]', 'A beautiful traditional rose tattoo');

    // Select style
    await page.click('[data-testid="style-select"]');
    await page.click('text=Traditional');

    // Select technique
    await page.click('[data-testid="technique-select"]');
    await page.click('text=Linework');

    // Select subject
    await page.fill('[data-testid="subject-input"]', 'rose');

    // Select color palette
    await page.fill('[data-testid="color-palette-input"]', 'red,green');

    // Select placement
    await page.click('[data-testid="placement-select"]');
    await page.click('text=Arm');

    // Mock the API response
    await page.route('**/supabase/functions/generate-tattoo', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          image_url: 'https://example.com/generated-tattoo.jpg',
          prompt: 'A beautiful traditional rose tattoo',
          metadata: {
            model: 'flux',
            style: 'traditional',
            processing_time: 5000,
          }
        }),
      });
    });

    // Click generate button
    await page.click('button:has-text("Generate Tattoo")');

    // Wait for loading state
    await expect(page.locator('text=Generating')).toBeVisible();

    // Wait for generation to complete
    await expect(page.locator('[alt*="Generated tattoo"]')).toBeVisible({ timeout: 10000 });

    // Verify action buttons are visible
    await expect(page.locator('button:has-text("Save")')).toBeVisible();
    await expect(page.locator('button:has-text("Download")')).toBeVisible();
    await expect(page.locator('button:has-text("Share")')).toBeVisible();
  });

  test('should handle style transfer workflow', async ({ page }) => {
    // First create a design
    await page.fill('[placeholder*="describe your ideal tattoo"]', 'A traditional rose tattoo');
    
    await page.click('[data-testid="style-select"]');
    await page.click('text=Traditional');

    // Mock generation API
    await page.route('**/supabase/functions/generate-tattoo', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          image_url: 'https://example.com/generated-tattoo.jpg',
          prompt: 'A traditional rose tattoo',
        }),
      });
    });

    await page.click('button:has-text("Generate Tattoo")');
    await expect(page.locator('[alt*="Generated tattoo"]')).toBeVisible({ timeout: 10000 });

    // Open style transfer
    await page.click('[data-testid="shuffle-button"]');
    await expect(page.locator('text=Style Transfer')).toBeVisible();

    // Select target style
    await page.click('[data-testid="target-style-select"]');
    await page.click('text=Realistic');

    // Wait for compatibility preview
    await expect(page.locator('text=Transfer Compatibility')).toBeVisible();

    // Mock style transfer API
    await page.route('**/api/style-transfer', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          fromStyle: 'traditional',
          toStyle: 'realistic',
          transferredPrompt: 'A realistic rose tattoo with photorealistic detail',
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
          suggestions: ['Consider adding more detail for better realism']
        }),
      });
    });

    // Perform transfer
    await page.click('button:has-text("Transfer Style")');

    // Wait for transfer to complete
    await expect(page.locator('text=Transfer Result')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=85% confidence')).toBeVisible();

    // Use transferred prompt
    await page.click('button:has-text("Use This Prompt")');

    // Verify prompt was updated
    const promptInput = page.locator('[placeholder*="describe your ideal tattoo"]');
    await expect(promptInput).toHaveValue('A realistic rose tattoo with photorealistic detail');
  });

  test('should handle advanced prompt enhancement', async ({ page }) => {
    await page.fill('[placeholder*="describe your ideal tattoo"]', 'rose');

    // Open advanced prompt builder
    await page.click('[data-testid="settings-button"]');
    await expect(page.locator('text=Advanced Prompt Builder')).toBeVisible();

    // Mock prompt enhancement API
    await page.route('**/api/enhance-prompt', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          enhancedPrompt: 'A professional traditional rose tattoo with bold black outlines and red colors',
          confidence: 90,
          stageResults: [
            { stageName: 'Domain Context', applied: true },
            { stageName: 'Style Enhancement', applied: true },
            { stageName: 'Technical Optimization', applied: true },
          ],
          processingTime: 1500,
        }),
      });
    });

    // Use prompt enhancement
    await page.click('button:has-text("Enhance Prompt")');

    // Wait for enhancement to complete
    await expect(page.locator('text=90% confidence')).toBeVisible({ timeout: 10000 });

    // Apply enhanced prompt
    await page.click('button:has-text("Use Enhanced Prompt")');

    // Verify prompt was updated
    const promptInput = page.locator('[placeholder*="describe your ideal tattoo"]');
    await expect(promptInput).toHaveValue('A professional traditional rose tattoo with bold black outlines and red colors');
  });

  test('should handle errors gracefully', async ({ page }) => {
    await page.fill('[placeholder*="describe your ideal tattoo"]', 'A beautiful rose tattoo');

    // Mock API error
    await page.route('**/supabase/functions/generate-tattoo', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Generation failed',
          message: 'Unable to generate tattoo design'
        }),
      });
    });

    await page.click('button:has-text("Generate Tattoo")');

    // Wait for error message
    await expect(page.locator('text=Generation failed')).toBeVisible({ timeout: 10000 });

    // Verify button is re-enabled for retry
    await expect(page.locator('button:has-text("Generate Tattoo")')).toBeEnabled();
  });

  test('should validate form inputs', async ({ page }) => {
    // Try to generate without prompt
    await page.click('button:has-text("Generate Tattoo")');

    // Should show validation error
    await expect(page.locator('text=Please enter a prompt')).toBeVisible();

    // Button should remain enabled for correction
    await expect(page.locator('button:has-text("Generate Tattoo")')).toBeEnabled();
  });

  test('should save design to gallery', async ({ page }) => {
    // Create a design first
    await page.fill('[placeholder*="describe your ideal tattoo"]', 'A beautiful rose tattoo');

    await page.route('**/supabase/functions/generate-tattoo', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          image_url: 'https://example.com/generated-tattoo.jpg',
          prompt: 'A beautiful rose tattoo',
        }),
      });
    });

    await page.click('button:has-text("Generate Tattoo")');
    await expect(page.locator('[alt*="Generated tattoo"]')).toBeVisible({ timeout: 10000 });

    // Mock save API
    await page.route('**/api/designs', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'test-design-id',
          message: 'Design saved successfully'
        }),
      });
    });

    // Save design
    await page.click('button:has-text("Save")');

    // Should show success message
    await expect(page.locator('text=Design saved successfully')).toBeVisible();
  });

  test('should download generated image', async ({ page }) => {
    // Create a design first
    await page.fill('[placeholder*="describe your ideal tattoo"]', 'A beautiful rose tattoo');

    await page.route('**/supabase/functions/generate-tattoo', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          image_url: 'https://example.com/generated-tattoo.jpg',
          prompt: 'A beautiful rose tattoo',
        }),
      });
    });

    await page.click('button:has-text("Generate Tattoo")');
    await expect(page.locator('[alt*="Generated tattoo"]')).toBeVisible({ timeout: 10000 });

    // Set up download handler
    const downloadPromise = page.waitForEvent('download');

    // Click download
    await page.click('button:has-text("Download")');

    // Wait for download to start
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('tattoo');
  });

  test('should share design', async ({ page }) => {
    // Mock navigator.share
    await page.addInitScript(() => {
      window.navigator.share = async (data) => {
        console.log('Share called with:', data);
        return Promise.resolve();
      };
    });

    // Create a design first
    await page.fill('[placeholder*="describe your ideal tattoo"]', 'A beautiful rose tattoo');

    await page.route('**/supabase/functions/generate-tattoo', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          image_url: 'https://example.com/generated-tattoo.jpg',
          prompt: 'A beautiful rose tattoo',
        }),
      });
    });

    await page.click('button:has-text("Generate Tattoo")');
    await expect(page.locator('[alt*="Generated tattoo"]')).toBeVisible({ timeout: 10000 });

    // Click share
    await page.click('button:has-text("Share")');

    // Should show success message (since we mocked the share API)
    await expect(page.locator('text=Shared successfully')).toBeVisible();
  });
});

test.describe('Mobile Tattoo Creation', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('should work on mobile devices', async ({ page }) => {
    await page.goto('/create');

    // Fill in the prompt
    await page.fill('[placeholder*="describe your ideal tattoo"]', 'A beautiful rose tattoo');

    // Select style (mobile interaction)
    await page.tap('[data-testid="style-select"]');
    await page.tap('text=Traditional');

    // Mock API response
    await page.route('**/supabase/functions/generate-tattoo', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          image_url: 'https://example.com/generated-tattoo.jpg',
          prompt: 'A beautiful rose tattoo',
        }),
      });
    });

    // Tap generate button
    await page.tap('button:has-text("Generate Tattoo")');

    // Wait for generation to complete
    await expect(page.locator('[alt*="Generated tattoo"]')).toBeVisible({ timeout: 10000 });

    // Verify mobile-optimized action buttons
    await expect(page.locator('button:has-text("Save")')).toBeVisible();
    await expect(page.locator('button:has-text("Download")')).toBeVisible();
    await expect(page.locator('button:has-text("Share")')).toBeVisible();
  });

  test('should handle touch gestures for style transfer', async ({ page }) => {
    await page.goto('/create');

    // Create initial design
    await page.fill('[placeholder*="describe your ideal tattoo"]', 'A traditional rose tattoo');
    await page.tap('[data-testid="style-select"]');
    await page.tap('text=Traditional');

    await page.route('**/supabase/functions/generate-tattoo', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          image_url: 'https://example.com/generated-tattoo.jpg',
          prompt: 'A traditional rose tattoo',
        }),
      });
    });

    await page.tap('button:has-text("Generate Tattoo")');
    await expect(page.locator('[alt*="Generated tattoo"]')).toBeVisible({ timeout: 10000 });

    // Open style transfer with touch
    await page.tap('[data-testid="shuffle-button"]');
    await expect(page.locator('text=Style Transfer')).toBeVisible();

    // Select target style with touch
    await page.tap('[data-testid="target-style-select"]');
    await page.tap('text=Realistic');

    // Verify mobile-optimized style transfer interface
    await expect(page.locator('text=Transfer Compatibility')).toBeVisible();
  });
});
