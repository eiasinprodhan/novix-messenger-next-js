import { checkRateLimit } from '../src/lib/rateLimit';

async function testRateLimiter() {
  console.log('🧪 Testing Rate Limiter & Sliding Window Token Bucket...');

  const config = { limit: 5, windowMs: 2000 };
  const testIp = '192.168.1.100';

  // Make 5 requests (all should pass)
  for (let i = 1; i <= 5; i++) {
    const res = checkRateLimit(testIp, config);
    if (!res.success) {
      throw new Error(`Request ${i} was unexpectedly rate limited!`);
    }
    console.log(`   ✅ Request ${i}/5 accepted, remaining: ${res.remaining}`);
  }

  // 6th request must be blocked
  const blockedRes = checkRateLimit(testIp, config);
  if (blockedRes.success) {
    throw new Error('Request 6 should have been blocked by rate limiter!');
  }
  console.log(`   🛡️ Request 6 correctly BLOCKED with HTTP 429 semantics (Retry-After: ${blockedRes.retryAfterSeconds}s)`);

  // Wait for window to expire
  console.log('   Waiting 2.1s for rate limit window to reset...');
  await new Promise((r) => setTimeout(r, 2100));

  // Request after reset must pass
  const resetRes = checkRateLimit(testIp, config);
  if (!resetRes.success) {
    throw new Error('Request after reset window was blocked!');
  }
  console.log(`   ✅ Request after reset accepted, remaining: ${resetRes.remaining}`);

  console.log('🎉 Rate limiter verification SUCCESSFUL! 🚀');
  process.exit(0);
}

testRateLimiter().catch((err) => {
  console.error('❌ Rate limiter test failed:', err);
  process.exit(1);
});
