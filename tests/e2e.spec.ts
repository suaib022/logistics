import { test, expect } from '@playwright/test';

test.describe('Dashboard E2E', () => {
  test.skip(!process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.SUPABASE_URL, 'Skipping E2E tests because SUPABASE_URL is not set (Setup required).');

  test('redirects to /orders', async ({ page }) => {
    await page.goto('http://localhost:3000/');
    await expect(page).toHaveURL(/.*\/orders/);
  });

  test('create order and update status', async ({ page }) => {
    // 1. Create order
    await page.goto('http://localhost:3000/orders');
    await page.getByRole('button', { name: 'Add order' }).click();
    
    // Fill required fields
    await page.getByPlaceholder('Enter your full name').fill('Test User');
    await page.getByPlaceholder('jane@company.com').fill('test@example.com');
    await page.getByPlaceholder('Enter departure city or port').fill('Origin A');
    await page.getByPlaceholder('Enter arrival city or port').fill('Destination B');
    
    // Check consent is true by default
    const consent = page.getByRole('checkbox');
    await expect(consent).toBeChecked();
    
    await page.getByRole('button', { name: 'Create Order' }).click();
    
    // Check toast
    const toast = page.locator('text=Order created: CKT-');
    await expect(toast).toBeVisible({ timeout: 10000 });
    
    // Extract ID from toast
    const toastText = await toast.textContent();
    const orderId = toastText?.match(/CKT-\d{4}-\d{6}/)?.[0] || '';
    expect(orderId).toBeTruthy();

    // 2. Open drawer and update status
    await page.locator('tbody tr', { hasText: orderId }).click();
    const drawerTitle = page.locator(`h2:has-text("Order ${orderId}")`);
    await expect(drawerTitle).toBeVisible();

    await page.getByRole('combobox').selectOption('in_transit');
    await page.getByPlaceholder('Location (optional)').fill('Test Location');
    await page.getByPlaceholder('Note (optional)').fill('Test Note');
    await page.getByRole('button', { name: 'Update Status' }).click();

    await expect(page.locator('text=Status updated')).toBeVisible({ timeout: 10000 });
    
    // 3. Track Order
    await page.goto('http://localhost:3000/track-order');
    await page.getByPlaceholder('Enter your order ID').fill(orderId);
    await page.getByRole('button', { name: 'Track Order' }).click();

    // Assert summary and status
    await expect(page.locator(`h2:has-text("${orderId}")`)).toBeVisible();
    await expect(page.locator('h3:has-text("In Transit")')).toBeVisible();

    // Assert timeline entries
    const timelineEvents = page.locator('h3.flex.items-center.text-lg.font-medium');
    const count = await timelineEvents.count();
    expect(count).toBeGreaterThanOrEqual(2);
    
    await page.screenshot({ path: 'test-results/screenshots/track-order-desktop.png' });
  });

  test('track order invalid format', async ({ page }) => {
    // 4. Invalid ID format
    await page.goto('http://localhost:3000/track-order');
    await page.getByPlaceholder('Enter your order ID').fill('nonsense');
    await page.getByRole('button', { name: 'Track Order' }).click();
    await expect(page.locator('text=Invalid format')).toBeVisible();

    // 4. Not found
    await page.getByPlaceholder('Enter your order ID').fill('CKT-2099-000000');
    await page.getByRole('button', { name: 'Track Order' }).click();
    await expect(page.locator('text=No order found')).toBeVisible();
  });

  test('create quote', async ({ page }) => {
    // 5. Create Quote
    await page.goto('http://localhost:3000/quotes');
    await page.getByRole('button', { name: 'Add quote' }).click();

    // 6. Submit empty
    await page.locator('button[type="submit"][form="add-quote-form"]').click();
    // HTML5 validation will trigger, or we can check visually.
    
    await page.getByPlaceholder('Enter your full name').fill('Quote User');
    await page.getByPlaceholder('jane@company.com').fill('quote@example.com');
    await page.getByPlaceholder('Enter departure city or port').fill('Q Origin');
    await page.getByPlaceholder('Enter arrival city or port').fill('Q Dest');
    
    await page.locator('button[type="submit"][form="add-quote-form"]').click();

    const toast = page.locator('text=Quote created: QT-');
    await expect(toast).toBeVisible({ timeout: 10000 });
  });

  test('mobile sidebar drawer', async ({ page }) => {
    // 7. Resize to 390px
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('http://localhost:3000/orders');
    
    const menuButton = page.locator('button:has(svg.lucide-menu)');
    await expect(menuButton).toBeVisible();
    await menuButton.click();
    
    // Assert drawer opens (nav links visible in mobile overlay)
    const navItem = page.locator('.md\\:hidden nav a', { hasText: 'Orders' }).first();
    await expect(navItem).toBeVisible();
    await page.screenshot({ path: 'test-results/screenshots/mobile-drawer.png' });
  });
});
