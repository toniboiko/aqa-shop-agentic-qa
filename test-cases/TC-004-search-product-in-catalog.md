# TC-004-SEARCH_PRODUCT_VALID_CASE

## Title

User search product in the catalog after login

## Preconditions

- Application is available.
- A valid user account exists (credentials are in .env: LOGIN_EMAIL, LOGIN_PASSWORD).
- User authenticated.
- User on the Catalog page

## Steps

1. User enter the existing product name in the Catalog to the Search field
2. User check the searching result

## Expected Results

- The shop page heading is visible
- There are products in the Catalog
- The Search filed is displayed and clickable
- The entered product name is displayed in the Search field
- The product name in the search result is matched with existing product before searching

## Constraints

- Use actual DOM elements.
- Do not invent selectors.
