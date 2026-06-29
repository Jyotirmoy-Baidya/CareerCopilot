// Runs before every test file — sets env vars that services/lib code reads at import time
process.env.JWT_SECRET    = 'test-secret-min-32-chars-long-xxxx';
process.env.DATABASE_URL  = 'postgresql://test:test@localhost:5432/test_db';
process.env.NEXTAUTH_SECRET = 'test-nextauth-secret';
