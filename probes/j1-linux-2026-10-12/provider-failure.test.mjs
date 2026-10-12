import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyRouterFailure } from './provider-failure.mjs';

test('rate limiting alone does not establish an exhausted daily quota', () => {
  assert.equal(classifyRouterFailure(429, { message: 'Too many requests' }), 'rate_limited_unspecified_window');
  assert.equal(classifyRouterFailure(429, { message: 'Daily free quota exceeded' }), 'explicit_daily_or_free_quota');
});

test('HTTP evidence distinguishes authentication, credits, capacity and other refusals', () => {
  assert.equal(classifyRouterFailure(401), 'authentication_rejected');
  assert.equal(classifyRouterFailure(402), 'credits_required');
  assert.equal(classifyRouterFailure(503, { message: 'No endpoints available' }), 'model_or_provider_unavailable');
  assert.equal(classifyRouterFailure(400, { message: 'Unsupported parameter' }), 'request_parameter_rejected');
  assert.equal(classifyRouterFailure(403), 'request_rejected_other');
});
