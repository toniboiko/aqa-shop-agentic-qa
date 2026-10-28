# TC-002-LOGIN-VALID

## Title

User logs in with valid credentials

## Preconditions

- Application is available.
- User is not authenticated.
- A valid user account exists (credentials are in .env: LOGIN_EMAIL, LOGIN_PASSWORD).

## Steps

1. Navigate to /login.
2. Enter the valid email in the email field.
3. Enter the valid password in the password field.
4. Click the login button.

## Expected Results

- The user is redirected to the shop page (URL is the site root `/`).
- The shop page heading is visible.

## Constraints

- Use actual DOM elements.
- Do not invent selectors.
