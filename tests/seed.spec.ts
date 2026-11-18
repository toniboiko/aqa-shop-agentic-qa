import { test } from "../fixtures/pages";

// Seed for the Playwright test agents: puts the browser on the starting page.
test.describe("Seed", () => {
  test("seed: open the login page", async ({ loginPage }) => {
    await loginPage.goto();
  });
});
