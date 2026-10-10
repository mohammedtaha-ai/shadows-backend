// NON-PRODUCT: proposed backend-owned device/session policy against disposable PG.
import { createHash } from 'node:crypto';
const hash = value => createHash('sha256').update(value).digest('hex');
export async function authenticateFixture(pool, handle) {
  const row = (await pool.query(`SELECT s.account, s.device FROM fixture_session s
    JOIN fixture_device d ON d.id=s.device AND d.account=s.account
    WHERE s.handle_hash=$1 AND s.revoked_at IS NULL AND d.revoked_at IS NULL
    AND s.expires_at > now()`, [hash(handle)])).rows[0];
  return row ?? null;
}
export async function revokeFixtureDevice(pool, account, device) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const updated = await client.query('UPDATE fixture_device SET revoked_at=now() WHERE id=$1 AND account=$2 RETURNING id', [device, account]);
    if (updated.rowCount !== 1) throw new Error('fixture foreign device refusal');
    await client.query('UPDATE fixture_session SET revoked_at=now() WHERE device=$1 AND account=$2', [device, account]);
    await client.query('COMMIT');
  } catch (e) { await client.query('ROLLBACK'); throw e; } finally { client.release(); }
}
export { hash };
