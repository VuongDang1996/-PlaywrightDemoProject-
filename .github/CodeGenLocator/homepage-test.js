const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: false
  });
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('http://www.automationpractice.pl/index.php?');
  await page.getByRole('textbox', { name: 'Search' }).click();
  await page.getByRole('textbox', { name: 'Search' }).fill('dress');
  await page.getByRole('button', { name: '' }).click();
  await page.locator('#color_34').dblclick();
  await page.getByRole('link', { name: 'Yellow' }).click();
  await page.getByRole('link', { name: 'Green' }).dblclick();
  await page.getByRole('link', { name: 'Yellow' }).click();
  await page.goto('http://www.automationpractice.pl/index.php?controller=search&orderby=position&orderway=desc&search_query=dress&submit_search=');
  await page.locator('.ajax_block_product.col-xs-12.col-sm-6.col-md-4.last-in-line.last-item-of-tablet-line > .product-container > .right-block > .button-container').click();
  await page.getByRole('link', { name: 'T-shirts', exact: true }).click();
  await page.getByRole('link', { name: 'Faded Short Sleeve T-shirts' }).first().click();
  await page.locator('#color_1').click();
  await page.getByRole('link', { name: 'Blue' }).click();
  await page.getByRole('link', { name: 'Dresses', exact: true }).click();
  await page.getByRole('link', { name: 'T-shirts', exact: true }).click();
  await page.locator('#block_top_menu').getByRole('link', { name: 'Women' }).click();
  await page.locator('#center_column').getByRole('link', { name: 'Printed Summer Dress' }).first().click();
  await page.locator('#color_21').click();
  await page.getByRole('link', { name: 'Blue' }).click();
  await page.getByRole('link', { name: 'Yellow' }).click();
  await page.getByRole('link', { name: 'Blue' }).click();
  await page.getByRole('link', { name: 'Orange' }).click();
  await page.locator('#color_to_pick_list').getByRole('listitem').nth(1).dblclick();
  await page.getByRole('link', { name: 'Dresses', exact: true }).click();
  await page.getByRole('link', { name: 'T-shirts', exact: true }).click();
  await page.locator('#color_2').click();
  await page.close();

  // ---------------------
  await context.close();
  await browser.close();
})();