# CLAUDE.md


## Stack
Playwright + TypeScript, @playwright/test runner, Node 20.
Use import/export only. require() is forbidden.


## Project structure
- test-cases/ — manual test cases (TC-*.md). READ-ONLY: never edit them. Expected values come from here.
- tests/      — specs (*.spec.ts)
- pages/      — Page Object classes
- fixtures/   — custom fixtures
- test-data/  — test data
- utils/      — shared helpers


## Test writing rules
- Locator priority: getByRole > getByLabel > getByPlaceholder > getByText > getByTestId.
  If an element has no role, label or text — use data-testid.
  XPath is forbidden.
- No page.waitForTimeout(). Web-first assertions only: await expect(locator).toBeVisible().
- No conditional logic in tests: no if/else, no loops over assertions, no try/catch.
- Every test is independent. No state is shared between tests.
- Test data lives in test-data/, never inline in a spec.
- Page interaction goes through Page Objects only. No raw locators in specs — this means no
  page.locator() calls in specs. Page Objects expose their locators so specs
  can assert on them.
- Import Page Objects at the top of the spec and instantiate them inside the test:
  const loginPage = new LoginPage(page). Not fixtures, not static methods.
- Test titles describe business behavior:
  test('user cannot log in with an invalid password').
- Do not invent selectors. Inspect the real DOM first.


## Environment
- baseURL is set in playwright.config.ts. Specs navigate with relative paths.
- If .env is missing or a key is absent, stop and ask. Do not invent values.


## Commands
- First run in a clean env: npx playwright install
- Run all tests: npx playwright test
- Run one file: npx playwright test tests/login.spec.ts
- Run by title: npx playwright test -g "invalid password"
- Debug interactively: npx playwright test --ui
- Report: npx playwright show-report
- Debug a failure with a trace: npx playwright test tests/login.spec.ts --trace on
- Open a recorded trace: npx playwright show-trace test-results/<dir>/trace.zip


## Restrictions
- Do not add npm dependencies without an explicit request.
- Do not modify playwright.config.ts unless explicitly asked.
- Never commit .env
- Do not rewrite existing helpers and fixtures — reuse what is in utils/ and fixtures/.


## Definition of done
Run the affected tests and report the actual result.


A failing test is a valid outcome. If the failure is caused by a product defect, report the
defect — do not make the test pass.


Never weaken an assertion, increase a timeout, add test.skip / test.fixme, wrap steps in
try/catch, or add retries in order to get a green run.


If you cannot tell whether it is a test bug or a product bug, say so and show the trace.
