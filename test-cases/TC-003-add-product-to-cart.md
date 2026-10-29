# TC-003-ADD-PRODUCT-TO-CART

## Title

User adds one product to the cart

## Preconditions

- Application is available.
- A valid user account exists (credentials are in .env: LOGIN_EMAIL, LOGIN_PASSWORD).
- User authenticated.
- The cart is empty.

## Steps

1. User on the Welcome to Our Shop page
2. Save the name and price of the first product in the product list
3. Click Add to cart button for that product. Add one product.
4. Navigate to Cart at the header
5. Check the saved product is in the cart
6. Check product price and name
7. Check product quantity

## Expected Results

- The shop page heading is visible.
- Processing text is displayed after clicking the Add to cart button.
- The Cart button in the header shows the number of added products (0 before adding, the count of added products after).
- Product is displayed in the cart.
- Name and price match the saved values; quantity equals the number of times the product was added.

## Constraints

- Use actual DOM elements.
- Do not invent selectors.
