import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Scenario Selection
 *
 * Tests the scenario gallery and scenario detail pages including:
 * - Scenario gallery display
 * - Scenario card interactions
 * - Scenario detail page navigation
 * - Scenario comparison functionality
 * - Loading scenarios into simulator
 */

test.describe('Scenario Gallery Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/scenarios');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Page Structure', () => {
    test('should display scenarios page with heading', async ({ page }) => {
      await expect(
        page.getByRole('heading', { name: /tb simulation scenarios/i })
      ).toBeVisible();
    });

    test('should display page description', async ({ page }) => {
      await expect(
        page.getByText(/explore pre-built scenarios/i)
      ).toBeVisible();
    });

    test('should display comparison instructions', async ({ page }) => {
      await expect(
        page.getByText(/click the.*icon on any card/i)
      ).toBeVisible();
    });
  });

  test.describe('Scenario Cards', () => {
    test('should display all preset scenarios', async ({ page }) => {
      // Check for the five preset scenarios
      await expect(page.getByText(/current trajectory/i).first()).toBeVisible();
      await expect(page.getByText(/universal bcg/i).first()).toBeVisible();
      await expect(page.getByText(/enhanced screening/i).first()).toBeVisible();
      await expect(page.getByText(/who elimination/i).first()).toBeVisible();
      await expect(page.getByText(/no intervention/i).first()).toBeVisible();
    });

    test('should display scenario cards in a grid', async ({ page }) => {
      // Check that multiple cards are visible
      const cards = page.locator('[class*="card"]').filter({ hasText: /expected outcome/i });
      const cardCount = await cards.count();
      expect(cardCount).toBeGreaterThanOrEqual(5);
    });

    test('should display scenario category badges', async ({ page }) => {
      // Check for category badges on cards
      await expect(page.getByText(/baseline/i).first()).toBeVisible();
      await expect(page.getByText(/vaccination/i).first()).toBeVisible();
    });

    test('should display expected outcome on each card', async ({ page }) => {
      // Each card should show expected outcome
      const expectedOutcomes = page.getByText(/expected outcome/i);
      const outcomeCount = await expectedOutcomes.count();
      expect(outcomeCount).toBeGreaterThanOrEqual(5);
    });

    test('should display View Details button on each card', async ({ page }) => {
      // Each card should have a View Details button
      const viewDetailsButtons = page.getByRole('link', { name: /view details/i });
      const buttonCount = await viewDetailsButtons.count();
      expect(buttonCount).toBeGreaterThanOrEqual(5);
    });
  });

  test.describe('Navigation to Scenario Details', () => {
    test('should navigate to scenario detail page when clicking View Details', async ({
      page,
    }) => {
      // Click the first View Details link
      const viewDetailsLink = page.getByRole('link', { name: /view details/i }).first();
      await viewDetailsLink.click();

      // Should navigate to a scenario detail page
      await expect(page).toHaveURL(/\/scenarios\/[a-z-]+/);
    });

    test('should navigate to current trajectory scenario', async ({ page }) => {
      // Find the Current Trajectory card and click View Details
      const card = page.locator('[class*="card"]').filter({ hasText: /current trajectory/i });
      const viewDetailsLink = card.getByRole('link', { name: /view details/i });
      await viewDetailsLink.click();

      await expect(page).toHaveURL(/\/scenarios\/current-trajectory/);
    });

    test('should navigate to universal BCG scenario', async ({ page }) => {
      const card = page.locator('[class*="card"]').filter({ hasText: /universal bcg/i });
      const viewDetailsLink = card.getByRole('link', { name: /view details/i });
      await viewDetailsLink.click();

      await expect(page).toHaveURL(/\/scenarios\/universal-bcg/);
    });
  });

  test.describe('Comparison Feature', () => {
    test('should have comparison icons on scenario cards', async ({ page }) => {
      // Each card should have a compare button (GitCompare icon)
      const compareButtons = page.getByRole('button', { name: /add.*to comparison/i });
      const buttonCount = await compareButtons.count();
      expect(buttonCount).toBeGreaterThanOrEqual(5);
    });

    test('should add scenario to comparison when clicking compare button', async ({
      page,
    }) => {
      // Click the compare button on the first card
      const compareButton = page.getByRole('button', { name: /add.*to comparison/i }).first();
      await compareButton.click();

      // Comparison banner should appear
      await expect(page.getByText(/select one more scenario/i)).toBeVisible();
    });

    test('should show comparison banner with selected scenarios', async ({
      page,
    }) => {
      // Select first scenario
      const compareButtons = page.getByRole('button', { name: /add.*to comparison/i });
      await compareButtons.first().click();

      // Select second scenario
      await compareButtons.nth(1).click();

      // Banner should show "vs" between scenarios
      await expect(page.getByText(/vs/i)).toBeVisible();

      // Compare button should be enabled
      await expect(
        page.getByRole('button', { name: /^compare$/i })
      ).toBeEnabled();
    });

    test('should clear comparison selection when clicking clear', async ({
      page,
    }) => {
      // Select a scenario
      const compareButton = page.getByRole('button', { name: /add.*to comparison/i }).first();
      await compareButton.click();

      // Click clear
      await page.getByRole('button', { name: /clear/i }).click();

      // Banner should no longer show the selection message
      await expect(page.getByText(/select one more scenario/i)).not.toBeVisible();
    });

    test('should navigate to comparison view when clicking compare', async ({
      page,
    }) => {
      // Select two scenarios
      const compareButtons = page.getByRole('button', { name: /add.*to comparison/i });
      await compareButtons.first().click();
      await compareButtons.nth(1).click();

      // Click compare
      await page.getByRole('button', { name: /^compare$/i }).click();

      // Should navigate to simulator with compare query
      await expect(page).toHaveURL(/\/simulator\?compare=/);
    });

    test('should remove scenario from comparison when clicking X', async ({
      page,
    }) => {
      // Select first scenario
      const compareButton = page.getByRole('button', { name: /add.*to comparison/i }).first();
      await compareButton.click();

      // The card should now show a selected state with X button
      const removeButton = page.getByRole('button', { name: /remove.*from comparison/i });
      await expect(removeButton).toBeVisible();

      // Click remove
      await removeButton.click();

      // Selection should be cleared
      await expect(page.getByText(/select one more scenario/i)).not.toBeVisible();
    });
  });
});

test.describe('Scenario Detail Page', () => {
  test.describe('Current Trajectory Scenario', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/scenarios/current-trajectory');
      await page.waitForLoadState('networkidle');
    });

    test('should display scenario name', async ({ page }) => {
      await expect(
        page.getByRole('heading', { name: /current trajectory/i })
      ).toBeVisible();
    });

    test('should display back to scenarios link', async ({ page }) => {
      await expect(
        page.getByRole('link', { name: /back to scenarios/i })
      ).toBeVisible();
    });

    test('should display expected outcome card', async ({ page }) => {
      await expect(page.getByText(/expected outcome/i)).toBeVisible();
    });

    test('should display Launch Simulation button', async ({ page }) => {
      await expect(
        page.getByRole('button', { name: /launch simulation/i })
      ).toBeVisible();
    });

    test('should display Compare dropdown', async ({ page }) => {
      await expect(page.getByText(/compare with/i)).toBeVisible();
    });

    test('should display simulation settings', async ({ page }) => {
      await expect(page.getByText(/simulation settings/i)).toBeVisible();
      await expect(page.getByText(/simulation duration/i)).toBeVisible();
    });

    test('should display vaccination policy settings', async ({ page }) => {
      await expect(page.getByText(/vaccination policy/i)).toBeVisible();
      await expect(page.getByText(/neonatal bcg/i)).toBeVisible();
    });

    test('should navigate back to scenarios when clicking back link', async ({
      page,
    }) => {
      await page.getByRole('link', { name: /back to scenarios/i }).click();
      await expect(page).toHaveURL(/\/scenarios$/);
    });

    test('should launch simulation and navigate to simulator', async ({
      page,
    }) => {
      await page.getByRole('button', { name: /launch simulation/i }).first().click();
      await expect(page).toHaveURL(/\/simulator/);
    });
  });

  test.describe('Universal BCG Scenario', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/scenarios/universal-bcg');
      await page.waitForLoadState('networkidle');
    });

    test('should display universal BCG scenario details', async ({ page }) => {
      await expect(
        page.getByRole('heading', { name: /universal bcg/i })
      ).toBeVisible();
    });

    test('should show vaccination policy is enabled', async ({ page }) => {
      // Universal BCG scenario should show neonatal BCG as enabled
      await expect(page.getByText(/neonatal bcg/i)).toBeVisible();
    });
  });

  test.describe('WHO Elimination Scenario', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/scenarios/who-elimination');
      await page.waitForLoadState('networkidle');
    });

    test('should display WHO elimination scenario', async ({ page }) => {
      await expect(
        page.getByRole('heading', { name: /who elimination/i })
      ).toBeVisible();
    });

    test('should display active interventions', async ({ page }) => {
      await expect(page.getByText(/active interventions/i)).toBeVisible();
    });
  });

  test.describe('No Intervention Scenario', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/scenarios/no-intervention');
      await page.waitForLoadState('networkidle');
    });

    test('should display no intervention scenario', async ({ page }) => {
      await expect(
        page.getByRole('heading', { name: /no intervention/i })
      ).toBeVisible();
    });

    test('should show warning about worst case', async ({ page }) => {
      await expect(
        page.getByText(/worst-case|removal of all/i)
      ).toBeVisible();
    });
  });

  test.describe('Scenario Comparison Navigation', () => {
    test('should navigate to comparison view via dropdown', async ({ page }) => {
      await page.goto('/scenarios/current-trajectory');
      await page.waitForLoadState('networkidle');

      // Open the compare dropdown
      const trigger = page.getByRole('combobox');
      await trigger.click();

      // Select another scenario
      await page.getByRole('option', { name: /universal bcg/i }).click();

      // Should navigate to simulator with compare query
      await expect(page).toHaveURL(/\/simulator\?compare=current-trajectory,universal-bcg/);
    });
  });

  test.describe('Invalid Scenario', () => {
    test('should show 404 for invalid scenario ID', async ({ page }) => {
      const response = await page.goto('/scenarios/invalid-scenario-id');

      // Should return 404 or show not found page
      expect(response?.status()).toBe(404);
    });
  });
});

test.describe('Scenario to Simulator Integration', () => {
  test('should load scenario configuration when launching from detail page', async ({
    page,
  }) => {
    // Navigate to Universal BCG scenario
    await page.goto('/scenarios/universal-bcg');
    await page.waitForLoadState('networkidle');

    // Click Launch Simulation
    await page.getByRole('button', { name: /launch simulation/i }).first().click();

    // Wait for simulator to load
    await expect(page).toHaveURL(/\/simulator/);
    await page.waitForLoadState('networkidle');

    // Verify the scenario is loaded by checking if relevant options are set
    // The Universal BCG scenario should have neonatal BCG enabled
    await page.getByRole('tab', { name: /vaccine/i }).click();

    // Neonatal BCG switch should be checked
    const neonatalSwitch = page.locator('#neonatal-bcg');
    await expect(neonatalSwitch).toBeChecked();
  });

  test('should maintain scenario comparison state in URL', async ({ page }) => {
    // Navigate to scenarios page
    await page.goto('/scenarios');
    await page.waitForLoadState('networkidle');

    // Select two scenarios for comparison
    const compareButtons = page.getByRole('button', { name: /add.*to comparison/i });
    await compareButtons.first().click();
    await compareButtons.nth(1).click();

    // Click compare
    await page.getByRole('button', { name: /^compare$/i }).click();

    // Verify URL contains both scenario IDs
    await expect(page).toHaveURL(/compare=[a-z-]+,[a-z-]+/);
  });
});

test.describe('Accessibility - Scenarios', () => {
  test('should have proper heading hierarchy on scenarios page', async ({
    page,
  }) => {
    await page.goto('/scenarios');
    await page.waitForLoadState('networkidle');

    // Should have an h1
    const h1 = page.getByRole('heading', { level: 1 });
    await expect(h1).toBeVisible();
  });

  test('should support keyboard navigation through scenario cards', async ({
    page,
  }) => {
    await page.goto('/scenarios');
    await page.waitForLoadState('networkidle');

    // Tab to navigate
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Something should be focused
    await expect(page.locator(':focus')).toBeVisible();
  });

  test('should have accessible buttons with labels', async ({ page }) => {
    await page.goto('/scenarios');
    await page.waitForLoadState('networkidle');

    // View Details links should have accessible text
    const viewDetailsLinks = page.getByRole('link', { name: /view details/i });
    expect(await viewDetailsLinks.count()).toBeGreaterThan(0);

    // Compare buttons should have aria-labels
    const compareButtons = page.getByRole('button', { name: /add.*to comparison/i });
    expect(await compareButtons.count()).toBeGreaterThan(0);
  });

  test('should have proper heading on scenario detail page', async ({
    page,
  }) => {
    await page.goto('/scenarios/current-trajectory');
    await page.waitForLoadState('networkidle');

    const h1 = page.getByRole('heading', { level: 1 });
    await expect(h1).toBeVisible();
    await expect(h1).toHaveText(/current trajectory/i);
  });
});
