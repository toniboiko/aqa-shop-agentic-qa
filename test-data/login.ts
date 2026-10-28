function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name} in .env (see .env.example)`);
  }
  return value;
}

export const validUser = {
  email: requireEnv("LOGIN_EMAIL"),
  password: requireEnv("LOGIN_PASSWORD"),
};

export const expectedUrls = {
  shop: "/",
};
