import type { VercelRequest, VercelResponse } from '@vercel/node';

const FIREBASE_PROJECT = 'soulsign-ba046';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).send('');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { wallet, name, email } = req.body;
    if (!wallet || !email) return res.status(400).json({ error: 'wallet and email are required' });

    const walletLower = wallet.toLowerCase();
    const now = new Date().toISOString();

    await fetch(
      `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT}/databases/(default)/documents/users/${walletLower}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields: {
            emergencyEmail: { stringValue: email },
            emergencyName: { stringValue: name || '' },
            updatedAt: { timestampValue: now },
          },
        }),
      }
    );

    console.log(`[SoulSign] Emergency contact set for ${walletLower}`);
    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('[SoulSign] Set emergency contact error:', error);
    return res.status(500).json({ error: error.message });
  }
}
