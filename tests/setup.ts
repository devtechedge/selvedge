try {
  process.loadEnvFile();
} catch {
  // Unit tests need no environment. Integration tests load .env or CI env.
}