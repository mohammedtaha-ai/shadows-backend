// NON-PRODUCT synthetic remote owner's durable idempotency operation.
// Same database engine, independent client/commit; not a real Shadows acceptance.
export async function applyOrReplayRemote(client, id, fingerprint) {
  await client.query('INSERT INTO probe_remote_effect VALUES ($1,$2,1) ON CONFLICT (id) DO NOTHING', [id, fingerprint]);
  const prior = (await client.query('SELECT * FROM probe_remote_effect WHERE id=$1', [id])).rows[0];
  if (prior.fingerprint !== fingerprint) throw new Error('synthetic fingerprint conflict');
  return { outcome: 'applied', fingerprint: prior.fingerprint };
}
