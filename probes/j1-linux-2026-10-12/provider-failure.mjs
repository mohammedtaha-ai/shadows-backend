// Provider HTTP evidence only. A proxy CONNECT refusal is a separate transport failure.
export function classifyRouterFailure(status, error = {}) {
  const message = String(error.message ?? '').toLowerCase();
  if (status === 401) return 'authentication_rejected';
  if (status === 402) return 'credits_required';
  if (status === 429) {
    if (/daily|per.day|free.*quota|free.*limit.*reached/.test(message)) return 'explicit_daily_or_free_quota';
    return 'rate_limited_unspecified_window';
  }
  if (/no endpoints|no.*provider|unavailable|capacity/.test(message)) return 'model_or_provider_unavailable';
  if (/not supported|unsupported|invalid.*param/.test(message)) return 'request_parameter_rejected';
  return status >= 500 ? 'upstream_or_service_failure' : 'request_rejected_other';
}
