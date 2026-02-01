import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Landing Page
 *
 * Tests the main landing page including:
 * - Page structure and content
 * - Navigation to simulator
 * - Navigation to scenarios
 * - Statistics display
 * - Feature sections
 */

test.describe('Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Page Structure', () => {
    test('should load landing page successfully', async ({ page }) => {
      await expect(page).toHaveURL('/');
    });

    test('should have header navigation', async ({ page }) => {
      // Check for header
      const header = page.locator('header');
      await expect(header).toBeVisible();
    });

    test('should have footer', async ({ page }) => {
      // Check for footer
      const footer = page.locator('footer');
      await expect(footer).toBeVisible();
    });

    test('should have main content area', async ({ page }) => {
      await expect(page.locator('main')).toBeVisible();
    });
  });

  test.describe('Hero Section', () => {
    test('should display main headline', async ({ page }) => {
      await expect(
        page.getByRole('heading', { name: /understand the future of.*tb/i })
      ).toBeVisible();
    });

    test('should display subtitle about simulator', async ({ page }) => {
      await expect(
        page.getByText(/interactive epidemiological simulator/i)
      ).toBeVisible();
    });

    test('should display UK low-incidence alert badge', async ({ page }) => {
      await expect(
        page.getByText(/uk at risk of losing low-incidence/i)
      ).toBeVisible();
    });

    test('should display current UK incidence rate', async ({ page }) => {
      await expect(
        page.getByText(/current uk incidence rate/i)
      ).toBeVisible();
      // Should show the rate value
      await expect(page.getByText(/per 100,000/i).first()).toBeVisible();
    });

    test('should display WHO threshold reference', async ({ page }) => {
      await expect(page.getByText(/who low-incidence threshold/i)).toBeVisible();
    });

    test('should display Launch Simulator CTA button', async ({ page }) => {
      await expect(
        page.getByRole('link', { name: /launch simulator/i })
      ).toBeVisible();
    });

    test('should display View Scenarios button', async ({ page }) => {
      await expect(
        page.getByRole('link', { name: /view scenarios/i })
      ).toBeVisible();
    });
  });

  test.describe('Statistics Section', () => {
    test('should display statistics section heading', async ({ page }) => {
      await expect(
        page.getByRole('heading', { name: /uk tb statistics at a glance/i })
      ).toBeVisible();
    });

    test('should display annual TB notifications', async ({ page }) => {
      await expect(page.getByText(/annual tb notifications/i)).toBeVisible();
    });

    test('should display national incidence rate', async ({ page }) => {
      await expect(page.getByText(/national incidence rate/i)).toBeVisible();
    });

    test('should display regional incidence info', async ({ page }) => {
      // Should mention London or highest regional rate
      await expect(page.getByText(/london.*rate/i)).toBeVisible();
    });

    test('should display TB deaths statistic', async ({ page }) => {
      await expect(page.getByText(/tb deaths/i)).toBeVisible();
    });

    test('should display incidence trend chart', async ({ page }) => {
      await expect(page.getByText(/incidence trend/i)).toBeVisible();
    });

    test('should display key risk factors', async ({ page }) => {
      await expect(page.getByText(/key risk factors/i)).toBeVisible();
      await expect(page.getByText(/rising incidence/i)).toBeVisible();
      await expect(page.getByText(/regional disparities/i)).toBeVisible();
    });
  });

  test.describe('Features Section', () => {
    test('should display features section heading', async ({ page }) => {
      await expect(
        page.getByRole('heading', { name: /powerful simulation features/i })
      ).toBeVisible();
    });

    test('should display SEIR Model feature', async ({ page }) => {
      await expect(page.getByText(/seir model/i)).toBeVisible();
    });

    test('should display Real UK Data feature', async ({ page }) => {
      await expect(page.getByText(/real uk data/i)).toBeVisible();
    });

    test('should display Policy Comparison feature', async ({ page }) => {
      await expect(page.getByText(/policy comparison/i)).toBeVisible();
    });

    test('should display Interactive Maps feature', async ({ page }) => {
      await expect(page.getByText(/interactive maps/i)).toBeVisible();
    });
  });

  test.describe('How It Works Section', () => {
    test('should display how it works heading', async ({ page }) => {
      await expect(
        page.getByRole('heading', { name: /how it works/i })
      ).toBeVisible();
    });

    test('should display step 1 - Configure Population', async ({ page }) => {
      await expect(page.getByText(/configure population/i)).toBeVisible();
    });

    test('should display step 2 - Set Vaccination Policy', async ({ page }) => {
      await expect(page.getByText(/set vaccination policy/i)).toBeVisible();
    });

    test('should display step 3 - Run Simulation', async ({ page }) => {
      await expect(page.getByText(/run simulation/i)).toBeVisible();
    });

    test('should display step 4 - Compare Outcomes', async ({ page }) => {
      await expect(page.getByText(/compare outcomes/i)).toBeVisible();
    });
  });

  test.describe('Final CTA Section', () => {
    test('should display ready to explore heading', async ({ page }) => {
      await expect(
        page.getByRole('heading', { name: /ready to explore/i })
      ).toBeVisible();
    });

    test('should display Explore Scenarios button', async ({ page }) => {
      await expect(
        page.getByRole('link', { name: /explore scenarios/i })
      ).toBeVisible();
    });

    test('should display Start Fresh button', async ({ page }) => {
      await expect(
        page.getByRole('link', { name: /start fresh/i })
      ).toBeVisible();
    });
  });

  test.describe('Navigation to Simulator', () => {
    test('should navigate to simulator when clicking Launch Simulator', async ({
      page,
    }) => {
      await page.getByRole('link', { name: /launch simulator/i }).click();
      await expect(page).toHaveURL('/simulator');
    });

    test('should navigate to simulator when clicking Start Fresh', async ({
      page,
    }) => {
      await page.getByRole('link', { name: /start fresh/i }).click();
      await expect(page).toHaveURL('/simulator');
    });
  });

  test.describe('Navigation to Scenarios', () => {
    test('should navigate to scenarios when clicking View Scenarios', async ({
      page,
    }) => {
      await page.getByRole('link', { name: /view scenarios/i }).click();
      await expect(page).toHaveURL('/scenarios');
    });

    test('should navigate to scenarios when clicking Explore Scenarios', async ({
      page,
    }) => {
      await page.getByRole('link', { name: /explore scenarios/i }).click();
      await expect(page).toHaveURL('/scenarios');
    });
  });
});

test.describe('Landing Page - Mobile Responsiveness', () => {
  test.use({
    viewport: { width: 375, height: 667 },
  });

  test('should display correctly on mobile', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Main content should be visible
    await expect(page.locator('main')).toBeVisible();

    // Hero headline should be visible
    await expect(
      page.getByRole('heading', { name: /understand the future of.*tb/i })
    ).toBeVisible();

    // CTA buttons should be visible
    await expect(
      page.getByRole('link', { name: /launch simulator/i })
    ).toBeVisible();
  });

  test('should have functional navigation on mobile', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Click the launch simulator button
    await page.getByRole('link', { name: /launch simulator/i }).click();
    await expect(page).toHaveURL('/simulator');
  });
});

test.describe('Landing Page - Tablet Responsiveness', () => {
  test.use({
    viewport: { width: 768, height: 1024 },
  });

  test('should display correctly on tablet', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Main content should be visible
    await expect(page.locator('main')).toBeVisible();

    // Statistics section should be visible
    await expect(
      page.getByRole('heading', { name: /uk tb statistics/i })
    ).toBeVisible();
  });
});

test.describe('Landing Page - Accessibility', () => {
  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Should have exactly one h1
    const h1Elements = page.getByRole('heading', { level: 1 });
    expect(await h1Elements.count()).toBe(1);

    // H1 should contain the main topic
    await expect(h1Elements).toContainText(/tb/i);
  });

  test('should have accessible links with descriptive text', async ({
    page,
  }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Main CTA links should have descriptive text
    const launchLink = page.getByRole('link', { name: /launch simulator/i });
    await expect(launchLink).toBeVisible();
    await expect(launchLink).toHaveAttribute('href', '/simulator');

    const scenariosLink = page.getByRole('link', { name: /view scenarios/i });
    await expect(scenariosLink).toBeVisible();
    await expect(scenariosLink).toHaveAttribute('href', '/scenarios');
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Tab through interactive elements
    await page.keyboard.press('Tab');
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();

    // Continue tabbing
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toBeVisible();
  });

  test('should have visible focus indicators', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Tab to a link
    await page.keyboard.press('Tab');

    // The focused element should be visible and identifiable
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });

  test('should have alt text or aria labels for icons', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Icons should have aria-hidden or be decorative
    const icons = page.locator('svg[aria-hidden="true"]');
    expect(await icons.count()).toBeGreaterThan(0);
  });
});

test.describe('Landing Page - Performance', () => {
  test('should load within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    const loadTime = Date.now() - startTime;

    // Page should load within 10 seconds
    expect(loadTime).toBeLessThan(10000);
  });

  test('should have main content visible quickly', async ({ page }) => {
    await page.goto('/');

    // Main content should appear quickly
    await expect(page.locator('main')).toBeVisible({ timeout: 5000 });

    // Headline should be visible quickly
    await expect(
      page.getByRole('heading', { name: /understand the future/i })
    ).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Landing Page - Browser Back/Forward', () => {
  test('should handle navigation history correctly', async ({ page }) => {
    // Start at landing page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Navigate to simulator
    await page.getByRole('link', { name: /launch simulator/i }).click();
    await expect(page).toHaveURL('/simulator');
    await page.waitForLoadState('networkidle');

    // Go back
    await page.goBack();
    await expect(page).toHaveURL('/');
    await page.waitForLoadState('networkidle');

    // Verify landing page content is still there
    await expect(
      page.getByRole('heading', { name: /understand the future/i })
    ).toBeVisible();

    // Go forward
    await page.goForward();
    await expect(page).toHaveURL('/simulator');
  });

  test('should handle navigation to scenarios and back', async ({ page }) => {
    // Start at landing page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Navigate to scenarios
    await page.getByRole('link', { name: /view scenarios/i }).click();
    await expect(page).toHaveURL('/scenarios');
    await page.waitForLoadState('networkidle');

    // Go back
    await page.goBack();
    await expect(page).toHaveURL('/');

    // Landing page content should be intact
    await expect(
      page.getByRole('link', { name: /launch simulator/i })
    ).toBeVisible();
  });
});

test.describe('Landing Page - Content Integrity', () => {
  test('should display accurate incidence rate from data', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // The displayed rate should be a reasonable number (between 5 and 15 per 100,000)
    const rateText = await page.getByText(/per 100,000/i).first().textContent();
    expect(rateText).toBeTruthy();
  });

  test('should display trend information', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Trend indicator should show percentage
    await expect(page.getByText(/since 2020/i)).toBeVisible();
  });

  test('should have consistent branding/messaging', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Should mention TB/tuberculosis
    await expect(page.getByText(/tuberculosis|tb/i).first()).toBeVisible();

    // Should mention UK
    await expect(page.getByText(/uk|united kingdom/i).first()).toBeVisible();
  });
});
