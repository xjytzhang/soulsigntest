import type { VercelRequest, VercelResponse } from '@vercel/node';

const FIREBASE_PROJECT = 'soulsign-ba046';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).send('');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const wallet = req.query.wallet as string;
    if (!wallet) return res.status(400).json({ error: 'wallet is required' });

    const walletLower = wallet.toLowerCase();

    const docRes = await fetch(
      `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT}/databases/(default)/documents/users/${walletLower}`
    );

    if (docRes.status === 404) {
      return res.status(404).json({ error: 'User not found' });
    }

    const doc = await docRes.json();

    return res.status(200).json({
      wallet: doc.fields?.wallet?.stringValue || walletLower,
      hasSoulNFT: doc.fields?.hasSoulNFT?.booleanValue || false,
      lastCheckIn: doc.fields?.lastCheckIn?.timestampValue || null,
      emergencyEmail: doc.fields?.emergencyEmail?.stringValue || '',
      emergencyName: doc.fields?.emergencyName?.stringValue || '',
      alerted72h: doc.fields?.alerted72h?.booleanValue || false,
      createdAt: doc.fields?.createdAt?.timestampValue || null,
    });
  } catch (error: any) {
    console.error('[SoulSign] Get user error:', error);
    return res.status(500).json({ error: error.message });
  }
}
