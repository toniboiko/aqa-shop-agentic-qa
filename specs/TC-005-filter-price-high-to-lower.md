# TC-005 User filters products from high to low in the catalog

## Application Overview

Plan for TC-005 (test-cases/TC-005-filter-price-high-to-lower.md): an authenticated user on the Catalog (shop) page selects 'Price: High to Low' in the price control and checks that the product order changed accordingly. Credentials come from .env (LOGIN_EMAIL, LOGIN_PASSWORD); values are never written here. Reuse: pages/LoginPage.ts (goto, login), pages/ShopPage.ts (heading, productNames, firstProductPrice), test-data/login.ts (validUser), seed tests/seed.spec.ts. Login is a precondition done in setup, not asserted. Constraints (TC-005): use actual DOM elements, do not invent selectors. Plan only: no spec, Page Object, helper or test data is created here.

Discovered locators (live DOM, https://aqa-app.vercel.app; re-checked 2026-11-18). The browser tool session was logged in via the public 'Use demo account' button for discovery only; the page structure is the same for any user.
- Shop heading: getByRole('heading', { name: '🛍️ Welcome to Our Shop' }) (ShopPage.heading, exists).
- Products: product names are level-3 headings, ShopPage.productNames = getByRole('heading', { level: 3 }) (exists); 6 products on the page. Prices are <p> elements with text like '$50', located by getByText(/^\$\d+(\.\d+)?$/) (ShopPage.firstProductPrice uses the .first() of it). A new ShopPage.productPrices (the same locator without .first()) is to be added by the generator; it matched exactly the 6 prices.
- There are exactly TWO comboboxes (both native <select>):
  a) 'Filter by price' (id catalog-filter-price): options 'All prices', 'Under $100', '$100 - $500', 'Over $500'. Default: 'All prices'. Not used.
  b) 'Sort by price' (id sort-products): options 'Price: Low to High' and 'Price: High to Low'. Default: 'Price: Low to High'.
- Price control (owner decision 1): ShopPage.sortSelect = getByRole('combobox', { name: 'Sort by price' }) (new, to be added). Options: sortSelect.getByRole('option') (2 matched on the live page).
- Selecting: sortSelect.selectOption({ label: 'Price: High to Low' }); the page re-sorts live (no submit). On the live page the product order became Vintage Camera, Coffee Machine, Tablet, Smartwatch, Sunglasses, Leather Wallet (prices $630, $570, $420, $380, $90, $50).

Locator for 'the selected option' (re-checked on the live page; owner decision 3). Exact proposed form, to be exposed through ShopPage (sortSelect is the ShopPage locator):
  sortSelect.getByRole('option', { name: 'Price: High to Low', selected: true })
  and, for the default, the same with name 'Price: Low to High'. Assert with the web-first matcher toHaveCount(1), e.g. await expect(shopPage.sortSelect.getByRole('option', { name: 'Price: High to Low', selected: true })).toHaveCount(1).
  Live results: on load (default) the option 'Price: Low to High' with selected: true matched 1 and 'Price: High to Low' with selected: true matched 0; after selectOption('Price: High to Low') it flipped (High 1, Low 0). getByRole('option', { selected: true }) alone returned exactly one text, the name of the selected option.
  toHaveCount(1) is used instead of toBeVisible, because native <option> elements are not reliably 'visible'.
  Verified alternative: sortSelect.locator('option:checked') with toHaveText(...); not proposed, because it is a CSS selector and lower in the project locator priority than getByRole.
  NOT working on the live page: locator.isChecked() on an <option> returned false even for the selected option, so toBeChecked() must not be used for this check. toHaveValue is not used (owner decision 3). Note: the web-first matchers themselves (expect) could not be run in the discovery tool; the locator counts above were verified live, the matcher is the standard retrying toHaveCount.

How the order is checked (no hard-coded prices, no loops over assertions, no conditionals):
- Price format: '$' followed by an integer (observed: $50, $90, $380, $420, $570, $630; no thousands separators, no decimals). Parse with a shared helper (new, in utils/, e.g. parsePrice(text) = Number(text.replace(/[^0-9.]/g, ''))); a pure function used with Array.map, not a loop of assertions.
- Before selecting: read and save the product names (shopPage.productNames.allTextContents()) as savedNames. The default is 'Price: Low to High' and the products are listed ascending by price.
- After selecting, two assertions (owner decision 4):
  (a) order of names changed: expect.poll(() => shopPage.productNames.allTextContents()).not.toEqual(savedNames).
  (b) order matches the High to Low filter: the parsed prices list equals the same list sorted descending, in one retrying assertion on the whole list, e.g. expect.poll(async () => { const prices = (await shopPage.productPrices.allTextContents()).map(parsePrice); return prices.join() === [...prices].sort((a, b) => b - a).join(); }).toBe(true), or a helper returning { actual, expectedDesc } compared with toEqual. Expected list is derived from the same page data; no hard-coded prices, no loop.

## Owner decisions (2026-11-18)

1. 'Price filter dropdown' in the test case = the 'Sort by price' control (getByRole('combobox', { name: 'Sort by price' })). Confirmed.
2. Option check: exactly two options (toHaveCount(2)) with the names 'Price: Low to High' and 'Price: High to Low'; no assertion on their order or visibility. Confirmed.
3. Selected-option check: before selecting, assert the currently selected option is the default 'Price: Low to High'; then select 'Price: High to Low'; then assert 'Price: High to Low' is the selected option. The internal value 'desc' is not used; toHaveValue is not used. Web-first assertions on the real DOM (locator form: see 'Locator for the selected option' above).
4. The test reads the default (ascending) product names before selecting, and after selecting asserts BOTH: (a) the names order differs from the saved order; (b) the parsed prices list equals the same list sorted descending (matches the High to Low filter). No hard-coded prices, no loops over assertions, no conditional logic.
5. Equal prices: accepted for now (the names-differ check may fail if prices ever become equal); kept as a note.
6. ER 1 and ER 2 (shop heading visible, products present) are checked both before and after selecting.

## Remaining notes (not blocking)

- Equal prices (owner decision 5): today all six prices are distinct; if two products ever share a price, check (a) may fail while check (b), being non-strict, still holds.
- New open question: the plan asserts the default selected option ('Price: Low to High') before selecting (owner decision 3), but TC-005 does not state that default. If the default sort ever changes, this assertion fails. Confirm the default is a stable, intended behavior.
- New open question: confirm the selected-option locator getByRole('option', { name, selected: true }) + toHaveCount(1) is acceptable (toBeChecked does not work on options).

## Possible product defect or outdated test case

- Test case wording 'Price filter dropdown' / 'Two Price filter option' vs real DOM names 'Sort by price' and a separate 'Filter by price' control with four options; the wording is likely outdated or informal. Locators use the real names.
- Typos in the test case are noted only and not edited: 'filer' (title), 'filetr' (ER 5), 'option' for 'options' (ER 4), 'lower' in the file name and 'FILTER_PRODUCT_FROM_HIGH_TO_LOW' in the heading. Locators use the real DOM names.

## Observed, not in requirements - needs the owner's decision

- The other combobox 'Filter by price' (All prices, Under $100, $100 - $500, Over $500) exists and is not used or asserted.
- The 'N of M products' counter ('6 of 6 products'), Search field, Reset button and header links (Catalog, Cart (N), My Account) exist; not asserted.
- The default sort is 'Price: Low to High' (ascending); not stated in the test case (now asserted per owner decision 3).
- The page has no data-testid attributes; the select elements have ids (catalog-filter-price, sort-products) and aria-labels, so role+name locators suffice and ids are not needed.
- Not verified: whether the sort persists after reload or when combined with the Search/price filter.

## Test Scenarios

### 1. TC-005 Filter products from high to low

**Seed:** `tests/seed.spec.ts`

#### 1.1. user sorts the catalog products by price from high to low

**File:** `tests/filter-price-high-to-low.spec.ts`

**Steps:**
  1. Precondition: application is available, a valid account exists, and .env contains LOGIN_EMAIL and LOGIN_PASSWORD (if missing, stop and report; do not invent values). Authenticate via LoginPage.goto() and LoginPage.login(validUser.email, validUser.password) using test-data/login.ts. The user lands on the Catalog page. (TC-005, Preconditions)
    - expect: User is authenticated and on the Catalog page (no extra assertion beyond the precondition; login is covered by TC-002).
  2. Check the Catalog page BEFORE selecting the option: heading, product list, and the sort control (ShopPage.sortSelect = getByRole combobox 'Sort by price', to be added). (TC-005, Preconditions: User on the Catalog page)
    - expect: shopPage.heading (getByRole heading '🛍️ Welcome to Our Shop') is visible. (TC-005, Expected Result 1; owner decision 6)
    - expect: At least one product is displayed: expect(shopPage.firstProductName).toBeVisible(), no hard-coded count. (TC-005, Expected Result 2; owner decision 6)
    - expect: The sort control is visible and enabled: expect(shopPage.sortSelect).toBeVisible() and toBeEnabled(). (TC-005, Expected Result 3; owner decision 1)
    - expect: The sort control has exactly two options: expect(shopPage.sortSelect.getByRole('option')).toHaveCount(2), and options named 'Price: Low to High' and 'Price: High to Low' exist (each getByRole('option', { name }) toHaveCount(1)). No assertion on their order or visibility. (TC-005, Expected Result 4; owner decision 2)
  3. Assert the currently selected option BEFORE selecting (the default): expect(shopPage.sortSelect.getByRole('option', { name: 'Price: Low to High', selected: true })).toHaveCount(1). (TC-005, Expected Result 5; owner decision 3)
    - expect: 'Price: Low to High' is the currently selected option before the change. (TC-005, Expected Result 5; owner decision 3)
  4. Read and save the initial order from the page: shopPage.productNames.allTextContents() into savedNames. Do not hard-code. (TC-005, Step 2 / Expected Result 6; owner decision 4)
    - expect: The pre-selection names list is captured in a variable for the later comparison; no hard-coded values.
  5. Step 1: Select 'Price: High to Low' in the sort control: shopPage.sortSelect.selectOption({ label: 'Price: High to Low' }). The page re-sorts live; no submit button. (TC-005, Step 1)
    - expect: expect(shopPage.sortSelect.getByRole('option', { name: 'Price: High to Low', selected: true })).toHaveCount(1): 'Price: High to Low' is now the selected option; value 'desc', toHaveValue and toBeChecked are not used. (TC-005, Expected Result 5; owner decision 3)
  6. Step 2: Check the filtering result: heading and product list AFTER selecting. (TC-005, Step 2)
    - expect: shopPage.heading is still visible. (TC-005, Expected Result 1; owner decision 6)
    - expect: At least one product is still shown: expect(shopPage.firstProductName).toBeVisible(). (TC-005, Expected Result 2; owner decision 6)
  7. Step 2: Check the product order with two assertions. (a) expect.poll(() => shopPage.productNames.allTextContents()).not.toEqual(savedNames). (b) Read prices with shopPage.productPrices.allTextContents(), parse each with the shared parsePrice helper (Array.map) and assert in one retrying assertion that the parsed list equals the same list sorted descending. No loop of assertions, no hard-coded prices, no if/else. (TC-005, Step 2)
    - expect: The order of product names is different from the saved pre-selection order, so the order changed. (TC-005, Expected Result 6; owner decision 4a)
    - expect: The order of product prices on the page matches the filter: the parsed prices list equals itself sorted descending, so the product order corresponds to price and the High to Low filter. (TC-005, Expected Result 6; owner decision 4b)
