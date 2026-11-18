# TC-006-RESET_PRICE_SORTING

## Title

User resets the price sorting in the catalog

## Preconditions

- Application is available.
- A valid user account exists (credentials are in .env: LOGIN_EMAIL, LOGIN_PASSWORD).
- User authenticated.
- User on the Catalog page.
- The "Price: High to Low" sorting is applied (the product order differs from the default).

## Steps

1. User select the "Price: Low to High" option in the Price filter dropdown
2. User check the sorting result

## Expected Results

- The shop page heading is visible
- There are products in the Catalog
- The Price filter dropdown is displayed and enabled
- The "Price: High to Low" option is selected before the reset
- User can change the filter back to "Price: Low to High"
- The "Price: Low to High" option is selected after the reset
- The product order is restored to the initial (default) order
- The product prices are sorted from low to high

## Constraints

- Use actual DOM elements.
- Do not invent selectors.