import { test, expect } from '@playwright/test';

const baseURL = process.env.CC_BASE_URL || 'http://127.0.0.1:4173';
const frame = page => page.frameLocator('iframe[title="ClearChoice demo store"]');

test.beforeEach(async ({ page }) => {
  await page.goto(baseURL);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test('desktop opens with the mobile-first app in an S26 Ultra frame', async ({ page }) => {
  await expect(page.getByLabel('Samsung Galaxy S26 Ultra preview')).toBeVisible();
  await expect(page.getByRole('heading', { name: /Enhance your shopping apps/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /Launch Shopping Mode/ })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Features' })).toBeVisible();
});

test('reconstructed product layout maps Add to the source cart and verifies one change', async ({ page }) => {
  await page.getByRole('button', { name: /Launch Shopping Mode/ }).click();
  const shop = frame(page);
  await expect(shop.locator('[data-cc-product]')).toHaveCount(12);
  await expect(shop.locator('#cc-adapter-panel')).toBeVisible();
  await expect(shop.locator('#cc-adapter-panel .cc-card')).toHaveCount(12);
  await shop.locator('#cc-adapter-panel .cc-card').first().getByRole('button', { name: 'Add to cart' }).click();
  await expect(shop.getByRole('button', { name: 'Cart 1' })).toBeVisible();
  await expect(shop.locator('#cc-adapter-panel')).toContainText('Added once; cart count verified.');
  await shop.getByRole('button', { name: 'Close' }).click();
  await shop.getByRole('button', { name: 'Cart 1' }).click();
  await expect(shop.locator('#cartview')).toContainText('QuietComfort Wireless Headphones');
  await expect(shop.locator('#cartview .cartline')).toContainText('$279.00');
});

test('source store Add remains usable without the reconstructed layer', async ({ page }) => {
  await page.getByRole('button', { name: /Launch Shopping Mode/ }).click();
  const shop = frame(page);
  await shop.locator('#cc-adapter-panel').waitFor({state:'visible'});
  await shop.getByRole('button', {name:'Close',exact:true}).click();
  await shop.locator('[data-cc-product="w1"] [data-cc-action="add-to-cart"]').click();
  await expect(shop.getByRole('button', { name: 'Cart 1' })).toBeVisible();
  await expect(shop.locator('#cc-adapter-launch')).toBeVisible();
});

test('price, seller, picks, and coupon insights use labeled fixture data', async ({ page }) => {
  await page.getByRole('button', { name: 'Features' }).click();
  await page.getByRole('button', { name: /Open Experience Studio/ }).click();
  await page.locator('[data-pref="cta"]').focus();
  await page.locator('[data-pref="cta"]').press('End');
  await page.getByRole('button', { name: 'Apply to demo' }).click();
  await page.getByRole('button', { name: 'Home' }).click();
  await page.getByRole('button', { name: /Launch Shopping Mode/ }).click();
  const shop = frame(page);
  await expect(shop.locator('#cc-adapter-panel')).toBeVisible();
  await shop.getByRole('button', { name: 'Price history' }).click();
  await expect(shop.locator('.cc-demo-result')).toContainText('Sample history for 12 demo products');
  await shop.getByRole('button', { name: 'Seller totals' }).click();
  await expect(shop.locator('.cc-demo-result')).toContainText('Illustrative seller totals');
  await shop.getByRole('button', { name: 'Smart picks' }).click();
  await expect(shop.locator('.cc-demo-result')).toContainText('Smart picks, ranked by fixture savings');
  await shop.getByRole('button', { name: 'Find a coupon' }).click();
  await shop.getByRole('button', { name: 'Apply coupon' }).click();
  await expect(shop.locator('.cc-demo-result')).toContainText('DEMO10 applied');
});

test('studio scopes, prompt controls, profile persistence, and preview comparison work', async ({ page }) => {
  await page.getByRole('button', { name: 'Features' }).click();
  await page.getByRole('button', { name: /Open Experience Studio/ }).click();
  await page.getByLabel('Scope').selectOption('Product page');
  await page.getByLabel('Tell us what to change').fill('Make text larger and add more spacing');
  await page.getByRole('button', { name: 'Apply prompt' }).click();
  await expect(page.locator('[data-pref="font"]')).toHaveValue('85');
  await expect(page.locator('#preview')).toHaveCSS('font-size', '19.35px');
  await expect(page.locator('#preview')).toHaveCSS('padding', '28px');
  await page.getByRole('button', { name: 'Save profile' }).click();
  await expect(page.getByRole('button', { name: /Use Profile 1/ })).toBeVisible();
  await page.getByRole('button', { name: 'Compare before / after' }).click();
  await expect(page.locator('#compare-output')).toContainText('Balanced baseline');
  await expect(page.locator('#compare-output')).toContainText('Current profile');
});

test('disabling ClearChoice hides its layer but leaves the source Add action working', async ({ page }) => {
  await page.getByLabel('Enable ClearChoice engine').uncheck();
  await page.getByRole('button', { name: /Launch Shopping Mode/ }).click();
  const shop = frame(page);
  await expect(shop.locator('#cc-adapter-launch')).toHaveCount(0);
  await shop.locator('[data-cc-product="h1"] [data-cc-action="add-to-cart"]').click();
  await expect(shop.getByRole('button', { name: 'Cart 1' })).toBeVisible();
});


test('product details keep variant selection in the original store modal', async ({ page }) => {
  await page.getByRole('button', { name: /Launch Shopping Mode/ }).click();
  const shop = frame(page);
  await shop.locator('#cc-adapter-panel').waitFor({state:'visible'});
  await shop.getByRole('button', {name:'Close',exact:true}).click();
  await shop.locator('[data-cc-product="h2"] [data-detail]').first().click();
  await shop.locator('#variant').selectOption('Graphite');
  await shop.locator('#detail [data-add="h2"]').click();
  await shop.getByRole('button', { name: 'Cart 1' }).click();
  await expect(shop.locator('#cartview')).toContainText('Graphite');
  await expect(shop.locator('#cartview')).toContainText('$129.00');
});


test('cart quantity controls update the selected product variant line', async ({ page }) => {
  await page.getByRole('button', { name: /Launch Shopping Mode/ }).click();
  const shop = frame(page);
  await shop.locator('#cc-adapter-panel').waitFor({state:'visible'});
  await shop.getByRole('button', {name:'Close',exact:true}).click();
  await shop.getByRole('button', { name: 'View Studio One Headphones' }).click();
  await shop.locator('#variant').selectOption('White');
  await shop.locator('#detail [data-add="h2"]').click();
  await shop.locator('[data-cc-product="h2"] [data-detail]').first().click();
  await shop.locator('#variant').selectOption('Graphite');
  await shop.locator('#detail [data-add="h2"]').click();
  await shop.getByRole('button', { name: 'Cart 2' }).click();
  await expect(shop.locator('#cartview')).toContainText('White · Qty');
  await expect(shop.locator('#cartview')).toContainText('Graphite · Qty');
  await shop.locator('[data-qty="h2"][data-variant="White"][data-delta="1"]').click();
  await expect(shop.locator('#cartview .cartline').filter({ hasText: 'White' })).toContainText(/Qty.*2/);
  await expect(shop.locator('#cartview .cartline').filter({ hasText: 'Graphite' })).toContainText(/Qty.*1/);
});


test('shopping modes open distinct views while preserving the source cart', async ({page}) => {
  await page.getByRole('button',{name:/Launch Shopping Mode/}).click();
  let shop=frame(page);
  await shop.locator('#cc-adapter-panel .cc-card').first().getByRole('button',{name:'Add to cart',exact:true}).click();
  await expect(shop.getByRole('button',{name:'Cart 1',exact:true})).toBeVisible();
  await page.goto(baseURL+'/#home');
  await page.getByRole('radio',{name:/Smart Shopping/}).check();
  await page.getByRole('button',{name:/Launch Shopping Mode/}).click();
  shop=frame(page);
  await expect(shop.locator('.cc-demo-result')).toContainText('Smart picks, ranked by fixture savings');
  await expect(shop.getByRole('button',{name:'Cart 1',exact:true})).toBeVisible();
  await page.goto(baseURL+'/#home');
  await page.getByRole('radio',{name:/Data Assist/}).check();
  await page.getByRole('button',{name:/Launch Shopping Mode/}).click();
  await expect(frame(page).locator('.cc-demo-result')).toContainText('Price history and seller data');
  await page.goto(baseURL+'/#home');
  await page.getByRole('radio',{name:/AI Buying Assistant/}).check();
  let requests=0;page.on('request',r=>{if(r.url().includes('/v1/evaluate'))requests++});
  await page.getByRole('button',{name:/Launch Shopping Mode/}).click();
  await expect(page.getByRole('button',{name:'Ask local AI for a layout'})).toBeVisible();
  await page.getByRole('button',{name:'Ask local AI for a layout'}).click();
  await expect(page.locator('#toast')).toContainText('Enable sanitized AI analysis');
  expect(requests).toBe(0);
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('cc-cart-v1')).reduce((n,x)=>n+x.qty,0))).toBe(1);
});
