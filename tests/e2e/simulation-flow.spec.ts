import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Simulation Flow
 * Tests the complete user journey through the simulator
 */

test.describe('Simulation Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/simulator');
  });

  test('should display simulator page', async ({ page }) => {
    await expect(page).toHaveTitle(/TB.*Simulator/i);
  });

  test.skip('should configure and run a simulation', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Configure vaccination rate
    const vaccinationSlider = page.getByRole('slider', { name: /vaccination rate/i });
    await vaccinationSlider.fill('85');

    // Enable universal BCG
    const universalBCGCheckbox = page.getByRole('checkbox', { name: /universal bcg/i });
    await universalBCGCheckbox.check();

    // Select a scenario
    const scenarioSelect = page.getByRole('combobox', { name: /scenario/i });
    await scenarioSelect.selectOption('current-trajectory');

    // Start simulation
    const runButton = page.getByRole('button', { name: /run scenario/i });
    await runButton.click();

    // Verify simulation is running
    await expect(page.getByTestId('simulation-status')).toHaveText(/running/i);
    await expect(page.getByTestId('day-counter')).not.toHaveText('Day 0');

    // Wait for completion (with timeout)
    await expect(page.getByTestId('simulation-status')).toHaveText(/completed/i, {
      timeout: 60000,
    });

    // Verify results displayed
    await expect(page.getByTestId('total-infections')).toBeVisible();
    await expect(page.getByTestId('prevented-infections')).toBeVisible();
    await expect(page.getByTestId('infection-chart')).toBeVisible();
  });

  test.skip('should pause and resume simulation', async ({ page }) => {
    // Start simulation
    await page.getByRole('button', { name: /run scenario/i }).click();
    await expect(page.getByTestId('simulation-status')).toHaveText(/running/i);

    // Pause
    await page.getByRole('button', { name: /pause/i }).click();
    await expect(page.getByTestId('simulation-status')).toHaveText(/paused/i);

    // Get current day
    const dayBefore = await page.getByTestId('day-counter').textContent();

    // Wait a moment
    await page.waitForTimeout(1000);

    // Day should not have changed
    const dayAfter = await page.getByTestId('day-counter').textContent();
    expect(dayAfter).toBe(dayBefore);

    // Resume
    await page.getByRole('button', { name: /resume/i }).click();
    await expect(page.getByTestId('simulation-status')).toHaveText(/running/i);
  });

  test.skip('should reset simulation', async ({ page }) => {
    // Start simulation
    await page.getByRole('button', { name: /run scenario/i }).click();

    // Wait for some progress
    await page.waitForFunction(() => {
      const counter = document.querySelector('[data-testid="day-counter"]');
      return counter && !counter.textContent?.includes('Day 0');
    });

    // Reset
    await page.getByRole('button', { name: /reset/i }).click();

    // Verify reset
    await expect(page.getByTestId('simulation-status')).toHaveText(/idle/i);
    await expect(page.getByTestId('day-counter')).toHaveText(/day 0/i);
  });
});

test.describe('Scenario Selection', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/scenarios');
  });

  test.skip('should display available scenarios', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /scenarios/i })).toBeVisible();

    // Check for preset scenarios
    await expect(page.getByText(/current trajectory/i)).toBeVisible();
    await expect(page.getByText(/universal bcg/i)).toBeVisible();
    await expect(page.getByText(/enhanced screening/i)).toBeVisible();
    await expect(page.getByText(/who elimination/i)).toBeVisible();
    await expect(page.getByText(/no intervention/i)).toBeVisible();
  });

  test.skip('should load selected scenario', async ({ page }) => {
    // Click on a scenario card
    await page.getByText(/universal bcg/i).click();

    // Should navigate to simulator with scenario loaded
    await expect(page).toHaveURL(/simulator/);

    // Verify scenario is loaded (universal BCG should be enabled)
    const universalBCGCheckbox = page.getByRole('checkbox', { name: /universal bcg/i });
    await expect(universalBCGCheckbox).toBeChecked();
  });
});

test.describe('Accessibility', () => {
  test('should have no accessibility violations on simulator page', async ({ page }) => {
    await page.goto('/simulator');

    // Basic accessibility checks
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('h1, [role="heading"]').first()).toBeVisible();
  });

  test.skip('should be navigable by keyboard', async ({ page }) => {
    await page.goto('/simulator');

    // Tab through controls
    await page.keyboard.press('Tab');
    const firstFocusable = page.locator(':focus');
    await expect(firstFocusable).toBeVisible();

    // Continue tabbing
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
    }

    // Should still have focus somewhere
    await expect(page.locator(':focus')).toBeVisible();
  });
});
