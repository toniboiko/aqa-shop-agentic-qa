# TC-003 User adds one product to the cart

## Application Overview

Plan for TC-003 (test-cases/TC-003-add-product-to-cart.md): an authenticated user saves the Leather Wallet price on the shop page, adds one Leather Wallet to the cart, checks the header Cart counter, opens the cart and verifies name, price and quantity match. Credentials come from .env (LOGIN_EMAIL, LOGIN_PASSWORD); both keys are present and non-empty; values are never written here. Reuse: pages/LoginPage.ts (goto, login), pages/ShopPage.ts (heading), test-data/login.ts (validUser, expectedUrls.shop), seed tests/seed.spec.ts. Login is done through LoginPage in the test setup (precondition), not asserted. New Page Object members (e.g. ShopPage.leatherWalletPrice/addToCartButton/processingText/cartLink, new CartPage) are to be added by the generator.

Discovered locators (live DOM, https://aqa-app.vercel.app). Note: the browser tool could not read .env, so the live session was logged in via the app's public "Use demo account" button for locator discovery only; the page structure is the same for any user.
- Shop heading: getByRole('heading', { name: '🛍️ Welcome to Our Shop' }) (level 1; already ShopPage.heading).
- Leather Wallet card: no role/testid on the card container; scope via the product heading getByRole('heading', { name: 'Leather Wallet', level: 3 }) and its ancestor (e.g. page.locator('div').filter({ has: heading })) inside the Page Object.
- Leather Wallet price on shop page: <p> with text "$50", no role/label/testid/id observed; getByText('$50') scoped to the Leather Wallet card.
- Add to cart button: getByRole('button', { name: 'Add to Cart' }) scoped to the Leather Wallet card (6 identical buttons on the page; Leather Wallet is first). Quantity stepper on the card: getByRole('button', { name: 'Increase quantity of Leather Wallet' }), default quantity 1 (getByLabel/title 'Quantity of Leather Wallet').
- Processing text: "Processing..." appeared right after the click (transient); locate with getByText('Processing...'). Its exact host element (button label vs separate element) was not isolated in the snapshot.
- Header Cart: it is a LINK not a button: getByRole('link', { name: 'Cart (0)' }) before, getByRole('link', { name: 'Cart (1)' }) after; href /cart. Counter is part of the link text; use a regex/name match such as getByRole('link', { name: /^Cart \(/ }).
- Cart page: heading getByRole('heading', { name: '🛒 Your Shopping Cart' }); item name getByRole('heading', { name: 'Leather Wallet', level: 3 }); item price <p id="cart-item-price-1"> text "$50" (no testid; getByText('$50') scoped to the item, or the id only if the owner allows, since CLAUDE.md lists testid not id); quantity <span id="cart-item-quantity-1"> text "1" (no role/label/testid; getByText('1', { exact: true }) scoped to the cart item).

Observed, not in requirements - needs the owner's decision:
- After add, the card button changes to "Remove from Cart" and the quantity stepper is hidden/collapsed.
- Cart page shows "Total: $50.00" heading, a "Proceed to Checkout" button, "-"/"+" quantity buttons and "Remove from Cart" button.
- Shop page has Search, price filter, sort, Reset controls and "6 of 6 products" text; header has Catalog and My Account links; login page has a Demo account panel and Register button. None are asserted.
- The app has no data-testid attributes; only ids on cart price/quantity (allowed, see owner decisions).

Owner decisions (confirmed by the user in chat after the first draft of this plan):
- Locating by `id` is allowed where an element has no role, label, text or data-testid (e.g. #cart-item-price-1, #cart-item-quantity-1). Prefer role/label/text first, per CLAUDE.md priority.
- "A number of added product" in the header Cart means the counter equals 1.
- The expected processing text is "Processing..." (assert getByText('Processing...')). The test case file itself does not state this string; the value comes from the owner.

Possible product defect or outdated test case:
- Test case says "Cart button" in the header and "Add to cart button"; the live DOM has a link named "Cart (N)" (role link, not button) and a button labelled "Add to Cart" (capital C). Locators must use link role / actual names; owner confirmed the live names "Cart (N)" (link) and "Add to Cart" (button) are correct; the test case wording is informal.
- The Processing text is transient; the assertion must be web-first and may be flaky if the request is fast (observed visible for over 1 second in discovery). If it proves flaky, report it; do not weaken the assertion.

## Test Scenarios

### 1. TC-003 Add product to cart

**Seed:** `tests/seed.spec.ts`

#### 1.1. user adds one product to the cart

**File:** `tests/add-product-to-cart.spec.ts`

**Steps:**
  1. Precondition: application is available, a valid account exists, and .env contains LOGIN_EMAIL and LOGIN_PASSWORD (if missing, stop and report; do not invent values). Authenticate via LoginPage.goto() and LoginPage.login(validUser.email, validUser.password) using test-data/login.ts. Cart starts empty (fresh context). (TC-003, Preconditions)
    - expect: User is authenticated and on the shop page (no extra assertion beyond the precondition; login itself is covered by TC-002).
  2. Step 1: User is on the Welcome to Our Shop page. (TC-003, Steps 1)
    - expect: shopPage.heading (getByRole heading '🛍️ Welcome to Our Shop') is visible. (TC-003, Expected Result 1)
  3. Step 2: Read and save the displayed price of the Leather Wallet product from its card (price text in the card scoped to the Leather Wallet heading). (TC-003, Steps 2)
    - expect: Price value is captured in a variable for later comparison; no hard-coded price in the spec.
  4. Step 3: Click the Add to Cart button in the Leather Wallet card once (quantity left at one). (TC-003, Steps 3)
    - expect: Processing text is displayed after clicking the button (getByText 'Processing...'). (TC-003, Expected Result 2)
    - expect: The header Cart link shows the number of added products, which is 1 for one added product (getByRole link name starting 'Cart ('). (TC-003, Expected Result 3)
  5. Step 4: Click the Cart link in the header. (TC-003, Steps 4)
    - expect: The cart page opens (cart item area available for the following checks).
  6. Step 5: Check the product in the cart. (TC-003, Steps 5)
    - expect: Leather Wallet is displayed in the cart (item heading 'Leather Wallet' is visible). (TC-003, Expected Result 4)
  7. Step 6: Check the product price and name in the cart. (TC-003, Steps 6)
    - expect: The cart item name equals the product name 'Leather Wallet' and the cart item price equals the price saved in step 3. (TC-003, Expected Result 5)
  8. Step 7: Check the product quantity in the cart. (TC-003, Steps 7)
    - expect: The cart item quantity matches the quantity added in step 3 (one product). (TC-003, Expected Result 5)
