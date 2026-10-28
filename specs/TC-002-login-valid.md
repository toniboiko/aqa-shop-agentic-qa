# TC-002 User logs in with valid credentials

## Application Overview

Plan for TC-002 (test-cases/TC-002-login-valid.md): a user with a valid account logs in and lands on the shop page. Credentials come from .env (LOGIN_EMAIL, LOGIN_PASSWORD); both keys are present and non-empty. Values are never written here. Only the scenario in the test case is planned. Existing reusable assets: pages/LoginPage.ts (goto, emailInput, passwordInput, loginButton, login), pages/ShopPage.ts (heading), test-data/login.ts (validUser, expectedUrls.shop), tests/login-valid.spec.ts (existing spec for this case).

Observed, not in requirements - needs the owner's decision:
- The login page shows a "Demo account" side panel with a "Use demo account" button and visible demo credentials. TC-002 does not mention it; not used and not asserted.
- The login page also has a "Register" button and a footer with links. Not part of TC-002; not asserted.

Possible product defect or outdated test case:
- None found. The login page locators (heading, email textbox, password textbox, Login button) matched the live DOM. The post-login redirect and the shop heading were not exercised in the browser because the credential values are secret and were not read; they are to be confirmed by running the spec.

## Test Scenarios

### 1. TC-002 Login with valid credentials

**Seed:** `tests/seed.spec.ts`

#### 1.1. user can log in with valid credentials

**File:** `tests/login-valid.spec.ts`

**Steps:**
  1. Precondition: application is available, user is not authenticated (fresh browser context), and .env contains LOGIN_EMAIL and LOGIN_PASSWORD. If .env or a key is missing, stop and report; do not invent values. (TC-002, Preconditions)
    - expect: Test data is read through test-data/login.ts (validUser) from the env var names only; no credential values appear in the spec or plan.
  2. Step 1: Navigate to /login using LoginPage.goto() (relative path, baseURL from config). (TC-002, Steps 1)
    - expect: The login form is reachable; loginPage.emailInput (getByRole textbox, name 'Enter your email') is available for input. Locator discovered in live DOM.
  3. Step 2: Enter the valid email (validUser.email, from LOGIN_EMAIL) into loginPage.emailInput. (TC-002, Steps 2)
    - expect: Email field accepts the input.
  4. Step 3: Enter the valid password (validUser.password, from LOGIN_PASSWORD) into loginPage.passwordInput (getByRole textbox, name 'Enter your password'). (TC-002, Steps 3)
    - expect: Password field accepts the input.
  5. Step 4: Click loginPage.loginButton (getByRole button, name 'Login'). Steps 2-4 may be done via LoginPage.login(email, password). (TC-002, Steps 4)
    - expect: The user is redirected to the shop page; URL is the site root '/' (use expectedUrls.shop from test-data/login.ts). (TC-002, Expected Result 1)
    - expect: The shop page heading is visible (assert shopPage.heading with toBeVisible()). (TC-002, Expected Result 2)
