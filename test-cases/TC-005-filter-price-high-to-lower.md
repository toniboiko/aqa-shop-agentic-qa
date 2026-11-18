# TC-005-FILTER_PRODUCT_FROM_HIGH_TO_LOW

## Title

User filer product from high to low in the catalog

## Preconditions

- Application is available.
- A valid user account exists (credentials are in .env: LOGIN_EMAIL, LOGIN_PASSWORD).
- User authenticated.
- User on the Catalog page

## Steps

1. User select the "Price: High to Low" filter in the Price filter dropdown
2. User check the filtering result

## Expected Results

- The shop page heading is visible
- There are products in the Catalog
- The Price filter dropdown is displayed and enabled
- Two Price filter option is displayed(Price: Low to High and Price: High to Low)
- User can change the filetr to Price: High to Low
- The product order is changed according to the Price filter High to Low

## Constraints

- Use actual DOM elements.
- Do not invent selectors.
