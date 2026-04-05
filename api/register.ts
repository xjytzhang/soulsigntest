import type { VercelRequest, VercelResponse } from '@vercel/node';

const FIREBASE_PROJECT = 'soulsign-ba046';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).send('');
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { wallet, txHash, chainId } = req.body;

    if (!wallet) {
      return res.status(400).json({ error: 'wallet is required' });
    }

    const walletLower = wallet.toLowerCase();
    const now = new Date().toISOString();

    // 写入 Firestore via REST API
    const docData = {
      wallet: walletLower,
      hasSoulNFT: true,
      lastCheckIn: now,
      emergencyEmail: '',
      emergencyName: '',
      alerted72h: false,
      createdAt: now,
      txHash: txHash || '',
      chainId: chainId || 84532,
    };

    const docRes = await fetch(
      `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT}/databases/(default)/documents/users/${walletLower}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields: {
            wallet: { stringValue: walletLower },
            hasSoulNFT: { booleanValue: true },
            lastCheckIn: { timestampValue: now },
            emergencyEmail: { stringValue: '' },
            emergencyName: { stringValue: '' },
            alerted72h: { booleanValue: false },
            createdAt: { timestampValue: now },
            txHash: { stringValue: txHash || '' },
            chainId: { integerValue: chainId || 84532 },
          },
        }),
      }
    );

    // 也记录 mint 日志
    await fetch(
      `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT}/databases/(default)/documents/mint_logs`,
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

    if (!docRes.ok) {
      const err = await docRes.text();
      console.error('[SoulSign] Firestore error:', err);
    }

    console.log(`[SoulSign] User registered: ${walletLower}`);
    return res.status(200).json({ success: true, wallet: walletLower });
  } catch (error: any) {
    console.error('[SoulSign] Register error:', error);
    return res.status(500).json({ error: error.message });
  }
}
