import { test, expect } from 'playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFile } from 'node:fs/promises';

const report = await readFile(new URL('../stegarena-report.md', import.meta.url), 'utf8');
const results = JSON.parse(await readFile(new URL('../results.json', import.meta.url), 'utf8'));

test('首页资源与章节链接完整', async ({ page, request }) => {
  const pageErrors = [];
  const resourceErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  page.on('response', response => {
    if (response.url().startsWith('http://127.0.0.1:4173') && response.status() >= 400) {
      resourceErrors.push({ url: response.url(), status: response.status() });
    }
  });
  const response = await page.goto('/');
  expect(response.status()).toBe(200);
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.locator('main')).toBeVisible();
  await expect(page).toHaveTitle(/StegArena/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  const pageText = await page.evaluate(() => [
    document.title,
    document.body.textContent,
    ...[...document.querySelectorAll('[aria-label], [title], [alt], meta[content]')].flatMap(element =>
      ['aria-label', 'title', 'alt', 'content'].map(attribute => element.getAttribute(attribute) || '')
    )
  ].join('\n'));
  expect(/\p{Script=Han}/u.test(pageText)).toBe(false);
  const anchors = await page.locator('a[href^="#"]').evaluateAll(links => links.map(link => ({
    href: link.getAttribute('href'),
    target: Boolean(document.getElementById(link.hash.slice(1)))
  })));
  expect(anchors.length).toBeGreaterThan(10);
  expect(anchors.every(anchor => anchor.target)).toBe(true);
  const resources = await page.evaluate(() => performance.getEntriesByType('resource').map(entry => entry.name));
  expect(resources.length).toBeGreaterThan(4);
  for (const url of resources) {
    expect((await request.get(url)).status(), url).toBe(200);
  }
  expect(pageErrors).toEqual([]);
  expect(resourceErrors).toEqual([]);
});

test('十组实验表格与源数据逐项一致', async ({ page }) => {
  await page.goto('/');
  const rows = page.locator('[data-result-row]');
  await expect(rows).toHaveCount(10);
  for (let index = 0; index < results.pairings.length; index += 1) {
    const pairing = results.pairings[index];
    const row = rows.nth(index);
    const cells = (await row.locator('th, td').allTextContents()).map(text => text.trim());
    expect(cells[0]).toBe(pairing.id);
    expect(cells[1]).toBe(pairing.sender);
    expect(cells[2]).toBe(pairing.receiver);
    if (pairing.hit_minutes !== null) expect(Number.parseFloat(cells[4])).toBe(pairing.hit_minutes);
    expect(cells[5].match(/\d+/g).map(Number)).toEqual(pairing.wall_seconds);
    expect(cells[6].match(/\d+/g).map(Number)).toEqual([pairing.messages_sender, pairing.messages_receiver]);
    await expect(row).toHaveAttribute('data-group', pairing.group);
    await expect(row).toHaveAttribute('data-confirmed', String(results.confirmed_runs.includes(pairing.id)));
  }
  await expect(page.locator('[data-result-row][data-confirmed="true"]')).toHaveCount(3);
});

test('模型配对筛选与确认计数', async ({ page }) => {
  await page.goto('/');
  for (const [group, count, confirmed] of [['same', 4, 1], ['cross', 6, 2], ['all', 10, 3]]) {
    const button = page.locator(`[data-filter="${group}"]`);
    await button.click();
    await expect(button).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('[data-result-row]:visible')).toHaveCount(count);
    await expect(page.locator('[data-result-row][data-confirmed="true"]:visible')).toHaveCount(confirmed);
    await expect(page.locator('[data-result-count]')).toHaveText(`${count} runs · ${confirmed} complete transmission${confirmed === 1 ? '' : 's'}`);
  }
});

test('浅色与深色主题保存并恢复', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator('#theme-toggle')).toHaveAccessibleName('Switch to light mode');
  await page.locator('#theme-toggle').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(page.locator('#theme-toggle')).toHaveAccessibleName('Switch to dark mode');
  expect(await page.evaluate(() => localStorage.getItem('stegarena-theme'))).toBe('light');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#faf8f3');
  await page.locator('#theme-toggle').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  expect(await page.evaluate(() => localStorage.getItem('stegarena-theme'))).toBe('dark');
});

test('移动菜单支持点击与键盘操作', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const button = page.locator('.menu-toggle');
  const menu = page.locator('#mobile-nav');
  await button.click();
  await expect(menu).toBeVisible();
  await expect(button).toHaveAttribute('aria-expanded', 'true');
  await expect(button).toHaveText('Close');
  await expect(button).toHaveAccessibleName('Close menu');
  await page.keyboard.press('Escape');
  await expect(button).toHaveAttribute('aria-expanded', 'false');
  await expect(button).toHaveText('Menu');
  await expect(button).toHaveAccessibleName('Open menu');
  await expect(button).toBeFocused();
  await button.click();
  const destination = await menu.locator('a').first().getAttribute('href');
  await menu.locator('a').first().click();
  await expect(button).toHaveAttribute('aria-expanded', 'false');
  await expect(page).toHaveURL(new RegExp(`${destination}$`));
  await button.click();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await expect(button).toHaveAttribute('aria-expanded', 'false');
});

test('详情使用原生键盘展开', async ({ page }) => {
  await page.goto('/');
  const detail = page.locator('details').first();
  await detail.locator('summary').focus();
  await page.keyboard.press('Enter');
  expect(await detail.evaluate(element => element.open)).toBe(true);
  await expect(detail.locator('.detail-content')).toBeVisible();
  await page.keyboard.press('Enter');
  expect(await detail.evaluate(element => element.open)).toBe(false);
  const detailLink = page.locator('[data-detail-link]').first();
  const detailId = await detailLink.getAttribute('href');
  await detailLink.click();
  expect(await page.locator(detailId).evaluate(element => element.open)).toBe(true);
  await page.reload();
  expect(await page.locator(detailId).evaluate(element => element.open)).toBe(true);
});

test('完整报告与结构化结果可下载', async ({ page }) => {
  expect(/\p{Script=Han}/u.test(report)).toBe(false);
  await page.goto('/');
  for (const [filename, content] of [['stegarena-report.md', report], ['results.json', results]]) {
    const downloadEvent = page.waitForEvent('download');
    await page.locator(`a[download][href="${filename}"]`).first().click();
    const download = await downloadEvent;
    expect(download.suggestedFilename()).toBe(filename);
    const downloaded = await readFile(await download.path(), 'utf8');
    expect(filename.endsWith('.json') ? JSON.parse(downloaded) : downloaded).toEqual(content);
  }
});

test('六种窗口宽度保持页面边界', async ({ page }) => {
  await page.goto('/');
  for (const summary of await page.locator('details > summary').all()) await summary.click();
  for (const width of [320, 390, 760, 960, 1440, 1920]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.evaluate(() => document.fonts.ready);
    const dimensions = await page.evaluate(() => ({
      page: document.documentElement.scrollWidth,
      viewport: window.innerWidth,
      containers: [...document.querySelectorAll('.container')].map(element => ({
        left: element.getBoundingClientRect().left,
        right: element.getBoundingClientRect().right
      })),
      components: [...document.querySelectorAll('.hero-copy, .hero-results, .detail-content, .spec-grid, .case-body, .case-evidence, .fact-list')].map(element => ({
        name: element.className,
        contentWidth: element.scrollWidth,
        width: element.clientWidth
      }))
    }));
    expect(dimensions.page, `窗口宽度 ${width}`).toBeLessThanOrEqual(dimensions.viewport);
    for (const container of dimensions.containers) {
      expect(container.left).toBeGreaterThanOrEqual(0);
      expect(container.right).toBeLessThanOrEqual(dimensions.viewport);
    }
    for (const component of dimensions.components) {
      expect(component.contentWidth, `${width}px ${component.name}`).toBeLessThanOrEqual(component.width + 1);
    }
  }
});

test('GitHub Pages 子路径读取真实发布文件', async ({ page, request }) => {
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  const response = await page.goto('http://127.0.0.1:4174/stegarena-page/');
  expect(response.status()).toBe(200);
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator('h1')).toBeVisible();
  const resources = await page.evaluate(() => performance.getEntriesByType('resource').map(entry => entry.name));
  for (const url of resources) expect((await request.get(url)).status(), url).toBe(200);
  await page.locator('#theme-toggle').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.locator('[data-filter="same"]').click();
  await expect(page.locator('[data-result-row]:visible')).toHaveCount(4);
  expect(await (await request.get('http://127.0.0.1:4174/stegarena-page/stegarena-report.md')).text()).toBe(report);
  expect(await (await request.get('http://127.0.0.1:4174/stegarena-page/results.json')).json()).toEqual(results);
  expect(pageErrors).toEqual([]);
});

for (const theme of ['dark', 'light']) {
  test(`${theme} 主题符合 WCAG 2 AA 自动检查`, async ({ page }) => {
    await page.goto('/');
    if (theme === 'light') await page.locator('#theme-toggle').click();
    for (const summary of await page.locator('details > summary').all()) await summary.click();
    const accessibility = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    expect(accessibility.violations).toEqual([]);
  });
}

test('静态内容与原生详情独立运行', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4173/');
  await expect(page.locator('h1')).toBeVisible();
  await expect(page.locator('[data-result-row]')).toHaveCount(10);
  await expect(page.locator('#case-s3')).toBeVisible();
  await expect(page.locator('#case-x1')).toBeVisible();
  await expect(page.locator('#case-x5')).toBeVisible();
  const detail = page.locator('details').first();
  await detail.locator('summary').click();
  await expect(detail.locator('.detail-content')).toBeVisible();
  for (const filename of ['stegarena-report.md', 'results.json']) {
    await expect(page.locator(`a[download][href="${filename}"]`).first()).toBeVisible();
    expect((await context.request.get(`http://127.0.0.1:4173/${filename}`)).status()).toBe(200);
  }
  await context.close();
});
