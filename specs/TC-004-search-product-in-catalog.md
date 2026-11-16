# TC-004 User searches a product in the catalog

## Application Overview

Plan for TC-004 (test-cases/TC-004-search-product-in-catalog.md): an authenticated user on the Catalog (shop) page takes the name of an existing product from the page itself, enters it into the Search field, and checks the search result. Credentials come from .env (LOGIN_EMAIL, LOGIN_PASSWORD); values are never written here. Reuse: pages/LoginPage.ts (goto, login), pages/ShopPage.ts (heading, firstProductName), test-data/login.ts (validUser), seed tests/seed.spec.ts. New Page Object members (e.g. ShopPage.searchInput, ShopPage.productNames) are to be added by the generator. Login is a precondition done in setup, not asserted. Constraints (TC-004): use actual DOM elements, do not invent selectors.

How 'existing product name' is obtained: it is NOT hard-coded. Before searching, the test reads the text of the first product heading on the shop page (existing ShopPage.firstProductName, getByRole('heading', { level: 3 }).first()) into a variable, then fills that value into the Search field. The same variable is used for the post-search comparison. (TC-004, Steps 1; Expected Result 5: 'matched with existing product before searching').

Discovered locators (live DOM, https://aqa-app.vercel.app; re-checked 2026-11-16). The browser tool could not read .env, so the live session was logged in via the public 'Use demo account' button for locator discovery only; page structure is the same for any user.
- Shop heading: getByRole('heading', { name: '🛍️ Welcome to Our Shop' }) (level 1; ShopPage.heading).
- Search field: getByRole('textbox', { name: 'Search products' }) (accessible name 'Search products', placeholder 'Search products...'; can also be reached by getByPlaceholder). Not yet in ShopPage; to be added.
- Product names: each product name is a level-3 heading. Proposed locator for 'all product names in the result' (ShopPage.productNames, to be added): getByRole('heading', { level: 3 }). Re-checked on the live page: before searching it matched exactly the 6 product-name headings and nothing else; after filling the Search field with the first product's name it matched exactly one heading with that same name. Existing ShopPage.firstProductName is the .first() of this locator.
- Search behaviour observed: typing filters the list live, with no submit button. Neighbouring controls (price filter combobox, sort combobox, Reset button) exist and are not used.

Owner decisions (2026-11-16), resolving the former ambiguities:
1. Expected Results 1 and 2 (shop heading visible, products in the Catalog) are checked BOTH before searching AND after searching. The after-search check proves the search worked and the page is still in the catalog state: heading visible, and at least one product shown.
2. ER 3: the Search field is 'displayed and clickable' = visible and enabled. Confirmed.
3. ER 5: the search result must be exactly the product whose name was searched: after searching, the product list contains one product only and its name equals the name captured before searching. Assert on the product-name headings of the result (ShopPage.productNames): exactly one (toHaveCount(1)) with the saved name (toHaveText(savedName)); no hard-coded values. The 'N of M products' counter stays out of scope unless the owner asks.
4. The test name was changed by the owner: the scenario title is 'user finds the searched product by its name in the catalog search'; file name stays tests/search-product-in-catalog.spec.ts.

Observed, not in requirements - needs the owner's decision:
- A result counter paragraph ('N of M products') is shown; TC-004 does not mention it, so it is not asserted (confirmed out of scope by owner decision 3).
- Search filters live (no submit/Enter needed); the test case does not say how the search is triggered.
- Price filter, sort, Reset controls and header links (Catalog, Cart (N), My Account) exist and are not asserted.
- The app has no data-testid attributes.

Remaining notes (not blocking):
- Step 2 'User check the searching result' defines no wait/trigger; all assertions are web-first (auto-retrying), with no waits.
- ER 3 in the test case contains the typo 'filed'; locators use the real DOM name 'Search products'.
- Open question: toHaveCount(1) plus toHaveText(savedName) assumes the first product's name is not a substring of another product's name in the catalog data (true on the live page today: the search of the first name returned one product). If the catalog data changes so that another product's name contains it, the test would fail on count; should the owner prefer a different product choice in that case?

## Test Scenarios

### 1. TC-004 Search product in catalog

**Seed:** `tests/seed.spec.ts`

#### 1.1. user finds the searched product by its name in the catalog search

**File:** `tests/search-product-in-catalog.spec.ts`

**Steps:**
  1. Precondition: application is available, a valid account exists, and .env contains LOGIN_EMAIL and LOGIN_PASSWORD (if missing, stop and report; do not invent values). Authenticate via LoginPage.goto() and LoginPage.login(validUser.email, validUser.password) using test-data/login.ts. The user lands on the Catalog page. (TC-004, Preconditions)
    - expect: User is authenticated and on the Catalog page (no extra assertion beyond the precondition; login is covered by TC-002).
  2. Check the Catalog page before searching: the shop heading, the product list, and the Search field. (TC-004, Preconditions: User on the Catalog page)
    - expect: shopPage.heading (getByRole heading '🛍️ Welcome to Our Shop') is visible. (TC-004, Expected Result 1; owner decision 1: checked before searching)
    - expect: At least one product is displayed in the Catalog (e.g. shopPage.firstProductName is visible; no hard-coded count). (TC-004, Expected Result 2; owner decision 1)
    - expect: shopPage.searchInput (getByRole textbox 'Search products') is visible and enabled. (TC-004, Expected Result 3; owner decision 2)
  3. Read and save the name of an existing product from the page itself: the text of shopPage.firstProductName (first level-3 product heading). Do not hard-code the name in the spec or in test-data. (TC-004, Steps 1)
    - expect: The product name is captured in a variable for later use; this is the 'existing product before searching'. (TC-004, Expected Result 5)
  4. Step 1: Enter the saved product name into the Search field (shopPage.searchInput.fill(savedName)); no submit button exists, filtering is live. (TC-004, Steps 1)
    - expect: The Search field contains the entered product name: expect(shopPage.searchInput).toHaveValue(savedName). (TC-004, Expected Result 4)
  5. Step 2: Check the Catalog page after searching: the shop heading and the product list. (TC-004, Steps 2)
    - expect: shopPage.heading is still visible. (TC-004, Expected Result 1; owner decision 1: checked after searching)
    - expect: At least one product is shown: expect(shopPage.productNames.first()).toBeVisible(), no hard-coded count. (TC-004, Expected Result 2; owner decision 1)
  6. Step 2: Check the search result: look at the product-name headings listed in the Catalog after searching (shopPage.productNames = getByRole('heading', { level: 3 })).
    - expect: Exactly one product is in the result: expect(shopPage.productNames).toHaveCount(1). (TC-004, Expected Result 5; owner decision 3)
    - expect: Its name equals the name captured before searching: expect(shopPage.productNames).toHaveText(savedName). No hard-coded values; the 'N of M products' counter is not asserted. (TC-004, Expected Result 5; owner decision 3)
