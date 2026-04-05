import type { VercelRequest, VercelResponse } from '@vercel/node';

const FIREBASE_PROJECT = 'soulsign-ba046';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).send('');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { wallet, txHash } = req.body;
    if (!wallet) return res.status(400).json({ error: 'wallet is required' });

    const walletLower = wallet.toLowerCase();
    const now = new Date().toISOString();

    // 更新 Firestore
    await fetch(
      `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT}/databases/(default)/documents/users/${walletLower}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields: {
            lastCheckIn: { timestampValue: now },
            alerted72h: { booleanValue: false },
          },
        }),
      }
    );

    // 记录签到日志
    await fetch(
      `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT}/databases/(default)/documents/checkin_logs`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields: {
            wallet: { stringValue: walletLower },
            txHash: { stringValue: txHash || '' },
            timestamp: { timestampValue: now },
          },
        }),
      }
    );

    console.log(`[SoulSign] Check-in: ${walletLower}`);
    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('[SoulSign] Checkin error:', error);
    return res.status(500).json({ error: error.message });
  }
}
