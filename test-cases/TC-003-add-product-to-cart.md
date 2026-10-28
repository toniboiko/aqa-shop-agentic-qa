# TC-003-ADD-PRODUCT-TO-CART

## Title

User adds one product to the cart

## Preconditions

- Application is available.
- A valid user account exists (credentials are in .env: LOGIN_EMAIL, LOGIN_PASSWORD).
- User authenticated.

## Steps

1. User on the Welcome to Our Shop page
2. Save the price for Leather Wallet product
3. Click Add to cart button for Leather Wallet product. Add one product.
4. Navigate to Cart at the header
5. Check the product in the cart
6. Check product price and name
7. Check product quantity

## Expected Results

- The shop page heading is visible.
- Processing text is displayed after clicking the Add to cart button.
- The Cart button in the header has a number of added product.
- Product is displayed in the cart.
- Price, name and quantity is matched

## Constraints

- Use actual DOM elements.
- Do not invent selectors.
