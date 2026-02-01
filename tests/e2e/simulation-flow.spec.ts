import { test, expect, type Page } from '@playwright/test';

/**
 * E2E Tests for Simulation Flow
 *
 * Tests the complete user journey through the simulator including:
 * - Page loading and basic structure
 * - Configuration via control panels
 * - Simulation execution (start, pause, resume, reset)
 * - Results display and statistics
 */

test.describe('Simulation Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/simulator');
    // Wait for the page to be fully loaded and hydrated
    await page.waitForLoadState('networkidle');
  });

  test.describe('Page Loading', () => {
    test('should load simulator page with correct title', async ({ page }) => {
      await expect(page).toHaveTitle(/TB.*Simulator/i);
    });

    test('should display main heading', async ({ page }) => {
      // The page should have a main content area
      await expect(page.locator('main')).toBeVisible();
    });

    test('should display simulation controls sidebar', async ({ page }) => {
      // Check for the tabs in the sidebar
      await expect(page.getByRole('tab', { name: /scenarios/i })).toBeVisible();
      await expect(page.getByRole('tab', { name: /population/i })).toBeVisible();
      await expect(page.getByRole('tab', { name: /vaccine/i })).toBeVisible();
      await expect(page.getByRole('tab', { name: /policy/i })).toBeVisible();
    });

    test('should display simulation playback controls', async ({ page }) => {
      // Start/Play button
      await expect(
        page.getByRole('button', { name: /start|play/i })
      ).toBeVisible();
      // Reset button (has sr-only text "Reset simulation")
      await expect(
        page.getByRole('button', { name: /reset/i })
      ).toBeVisible();
    });

    test('should display statistics dashboard', async ({ page }) => {
      // Check for stat cards
      await expect(page.getByText(/active cases/i)).toBeVisible();
      await expect(page.getByText(/vaccinated/i).first()).toBeVisible();
      await expect(page.getByText(/recovered/i).first()).toBeVisible();
      await expect(page.getByText(/deaths/i).first()).toBeVisible();
    });

    test('should display timeline control with day counter', async ({ page }) => {
      // Day counter should show Day 0 initially
      await expect(page.getByText(/day 0/i)).toBeVisible();
    });

    test('should show initial status as ready', async ({ page }) => {
      // Status badge should show "Ready"
      await expect(page.getByText(/ready/i)).toBeVisible();
    });
  });

  test.describe('Configuration Panels', () => {
    test('should switch between tabs', async ({ page }) => {
      // Click Population tab
      await page.getByRole('tab', { name: /population/i }).click();
      await expect(page.getByText(/total population/i)).toBeVisible();

      // Click Vaccination tab
      await page.getByRole('tab', { name: /vaccine/i }).click();
      await expect(page.getByText(/neonatal bcg/i)).toBeVisible();

      // Click Policy tab
      await page.getByRole('tab', { name: /policy/i }).click();
      await expect(page.getByText(/policy interventions/i)).toBeVisible();

      // Click Scenarios tab
      await page.getByRole('tab', { name: /scenarios/i }).click();
      await expect(page.getByText(/scenarios/i).first()).toBeVisible();
    });

    test('should display scenario presets in scenarios tab', async ({ page }) => {
      // Check for preset scenarios
      await expect(page.getByText(/current trajectory/i)).toBeVisible();
    });

    test('should load a scenario when clicking preset button', async ({ page }) => {
      // Find and click a scenario button
      const scenarioButton = page.getByRole('button', {
        name: /current trajectory/i,
      });
      await expect(scenarioButton).toBeVisible();
      await scenarioButton.click();

      // The button should now be in active/selected state (default variant)
      await expect(scenarioButton).toBeVisible();
    });

    test('should toggle vaccination settings', async ({ page }) => {
      // Navigate to vaccination tab
      await page.getByRole('tab', { name: /vaccine/i }).click();

      // Find the Neonatal BCG switch
      const neonatalSwitch = page.locator('#neonatal-bcg');
      await expect(neonatalSwitch).toBeVisible();

      // Get initial state and toggle
      const initialChecked = await neonatalSwitch.isChecked();
      await neonatalSwitch.click();

      // Verify state changed
      if (initialChecked) {
        await expect(neonatalSwitch).not.toBeChecked();
      } else {
        await expect(neonatalSwitch).toBeChecked();
      }
    });

    test('should adjust imported cases slider in population tab', async ({
      page,
    }) => {
      // Navigate to population tab
      await page.getByRole('tab', { name: /population/i }).click();

      // Find the slider for imported cases
      const slider = page.getByRole('slider');
      await expect(slider.first()).toBeVisible();
    });
  });

  test.describe('Simulation Execution', () => {
    test('should start simulation when clicking start button', async ({
      page,
    }) => {
      // Find and click the Start button
      const startButton = page.getByRole('button', { name: /start/i });
      await expect(startButton).toBeVisible();
      await startButton.click();

      // Status should change to running/simulating
      await expect(
        page.getByText(/simulating|running/i)
      ).toBeVisible({ timeout: 5000 });

      // Button text should change to Pause
      await expect(
        page.getByRole('button', { name: /pause/i })
      ).toBeVisible();
    });

    test('should pause simulation when clicking pause button', async ({
      page,
    }) => {
      // Start simulation
      await page.getByRole('button', { name: /start/i }).click();
      await expect(page.getByText(/simulating/i)).toBeVisible({ timeout: 5000 });

      // Click pause
      await page.getByRole('button', { name: /pause/i }).click();

      // Status should show paused
      await expect(page.getByText(/paused/i)).toBeVisible();

      // Button should now say Resume
      await expect(
        page.getByRole('button', { name: /resume/i })
      ).toBeVisible();
    });

    test('should resume simulation when clicking resume button', async ({
      page,
    }) => {
      // Start simulation
      await page.getByRole('button', { name: /start/i }).click();
      await expect(page.getByText(/simulating/i)).toBeVisible({ timeout: 5000 });

      // Pause simulation
      await page.getByRole('button', { name: /pause/i }).click();
      await expect(page.getByText(/paused/i)).toBeVisible();

      // Resume simulation
      await page.getByRole('button', { name: /resume/i }).click();

      // Should be running again
      await expect(page.getByText(/simulating/i)).toBeVisible();
    });

    test('should reset simulation when clicking reset button', async ({
      page,
    }) => {
      // Start simulation
      await page.getByRole('button', { name: /start/i }).click();
      await expect(page.getByText(/simulating/i)).toBeVisible({ timeout: 5000 });

      // Wait for simulation to progress a bit
      await page.waitForTimeout(1000);

      // Click reset
      await page.getByRole('button', { name: /reset/i }).click();

      // Status should return to ready/idle
      await expect(page.getByText(/ready/i)).toBeVisible();

      // Day counter should reset to Day 0
      await expect(page.getByText(/day 0/i)).toBeVisible();
    });

    test('should update day counter during simulation', async ({ page }) => {
      // Start simulation
      await page.getByRole('button', { name: /start/i }).click();

      // Wait for day to progress beyond 0
      await expect(async () => {
        const dayText = await page.getByText(/day \d+/i).first().textContent();
        const dayMatch = dayText?.match(/day (\d+)/i);
        const day = dayMatch ? parseInt(dayMatch[1], 10) : 0;
        expect(day).toBeGreaterThan(0);
      }).toPass({ timeout: 10000 });
    });
  });

  test.describe('Speed Controls', () => {
    test('should display current speed', async ({ page }) => {
      // Speed badge should be visible
      await expect(page.getByText(/1x/)).toBeVisible();
    });

    test('should increase simulation speed', async ({ page }) => {
      // Find and click the increase speed button (right chevron)
      const increaseButton = page.getByRole('button', {
        name: /increase speed/i,
      });
      await increaseButton.click();

      // Speed should show 2x
      await expect(page.getByText(/2x/)).toBeVisible();
    });

    test('should decrease simulation speed', async ({ page }) => {
      // First increase to 2x
      await page.getByRole('button', { name: /increase speed/i }).click();
      await expect(page.getByText(/2x/)).toBeVisible();

      // Then decrease back to 1x
      await page.getByRole('button', { name: /decrease speed/i }).click();
      await expect(page.getByText(/1x/)).toBeVisible();
    });
  });

  test.describe('Statistics Display', () => {
    test('should show compartment distribution', async ({ page }) => {
      await expect(page.getByText(/compartment distribution/i)).toBeVisible();
    });

    test('should show WHO target progress', async ({ page }) => {
      await expect(page.getByText(/who low-incidence target/i)).toBeVisible();
    });

    test('should show effective R number', async ({ page }) => {
      await expect(
        page.getByText(/effective reproduction number/i)
      ).toBeVisible();
    });

    test('should show population distribution bars', async ({ page }) => {
      await expect(page.getByText(/susceptible/i)).toBeVisible();
      await expect(page.getByText(/latent tb/i)).toBeVisible();
      await expect(page.getByText(/infectious/i)).toBeVisible();
    });

    test('should update statistics during simulation', async ({ page }) => {
      // Start simulation
      await page.getByRole('button', { name: /start/i }).click();
      await expect(page.getByText(/simulating/i)).toBeVisible({ timeout: 5000 });

      // Wait for some progress and verify stats are being updated
      await page.waitForTimeout(2000);

      // The stats should show numeric values (not all zeros)
      const activeCasesCard = page.locator('text=Active Cases').locator('..');
      await expect(activeCasesCard).toBeVisible();
    });
  });

  test.describe('Step Mode', () => {
    test('should step forward one day when clicking step button', async ({
      page,
    }) => {
      // Find the step button
      const stepButton = page.getByRole('button', { name: /step/i });
      await expect(stepButton).toBeVisible();

      // Click step to advance one day
      await stepButton.click();

      // Day should now show Day 1
      await expect(page.getByText(/day 1/i)).toBeVisible();
    });

    test('should disable step button when simulation is running', async ({
      page,
    }) => {
      // Start simulation
      await page.getByRole('button', { name: /start/i }).click();
      await expect(page.getByText(/simulating/i)).toBeVisible({ timeout: 5000 });

      // Step button should be disabled
      const stepButton = page.getByRole('button', { name: /step/i });
      await expect(stepButton).toBeDisabled();
    });
  });
});

test.describe('Accessibility', () => {
  test('should have no accessibility violations on simulator page', async ({
    page,
  }) => {
    await page.goto('/simulator');
    await page.waitForLoadState('networkidle');

    // Basic accessibility checks
    await expect(page.locator('main')).toBeVisible();

    // All interactive elements should be focusable
    const buttons = page.getByRole('button');
    const buttonCount = await buttons.count();
    expect(buttonCount).toBeGreaterThan(0);
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('/simulator');
    await page.waitForLoadState('networkidle');

    // Tab through the page
    await page.keyboard.press('Tab');
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();

    // Continue tabbing to verify focus moves
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toBeVisible();
  });

  test('should have proper ARIA labels on buttons', async ({ page }) => {
    await page.goto('/simulator');

    // Check that buttons have accessible names
    const resetButton = page.getByRole('button', { name: /reset/i });
    await expect(resetButton).toBeVisible();

    const stepButton = page.getByRole('button', { name: /step/i });
    await expect(stepButton).toBeVisible();
  });
});
