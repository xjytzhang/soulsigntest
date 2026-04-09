import type { VercelRequest, VercelResponse } from '@vercel/node';

const FIREBASE_PROJECT = 'soulsign-ba046';
const RESEND_API_KEY = process.env.RESEND_API_KEY;

function parseTimestamp(val: any): number {
  if (!val) return 0;
  if (typeof val === 'number') return val;
  if (typeof val === 'string') return new Date(val).getTime();
  if (val.timestampValue) return new Date(val.timestampValue).getTime();
  if (val.integerValue) return parseInt(val.integerValue) * 1000;
  return 0;
}

async function sendEmail(to: string, name: string, wallet: string, lastCheckIn: string) {
  if (!RESEND_API_KEY) {
    console.warn('[SoulSign] RESEND_API_KEY not set, skipping email');
    return;
  }

  const userName = name || 'Unknown';
  const html = `
    <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #0a0c10; color: #dfe2eb;">
      <div style="text-align: center; margin-bottom: 40px;">
        <h1 style="color: #c3f5ff; font-size: 28px; margin-bottom: 10px;">SoulSign</h1>
        <p style="color: #69ff87; font-size: 14px; text-transform: uppercase; letter-spacing: 2px;">Digital Life Guardian</p>
      </div>
      <div style="background: #12161b; border-radius: 16px; padding: 30px; margin-bottom: 24px; border: 1px solid rgba(255,255,255,0.06);">
        <p style="color: #dfe2eb; line-height: 1.8; font-size: 15px;">Hello.</p>
        <p style="color: #dfe2eb; line-height: 1.8; font-size: 15px;">
          Your friend <strong style="color: #ffc687;">${userName}</strong> has designated you as the emergency guardian of the SoulSign protocol. This means that you are one of the most trusted individuals in their digital life plan.
        </p>
        <p style="color: #dfe2eb; line-height: 1.8; font-size: 15px;">
          ${userName} has not shown any "vital signs" (blockchain sign-in) for 72 consecutive hours. Only then will you receive this alert.
        </p>
        <p style="color: #dfe2eb; line-height: 1.8; font-size: 15px;">
          This email is solely for confirming that the communication channel is unobstructed and to inform you of the existence of this trust.
        </p>
        <p style="color: #dfe2eb; line-height: 1.8; font-size: 15px;">
          Thank you for safeguarding its existence in the digital world.
        </p>
      </div>
      <div style="background: #161a1f; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        <p style="color: #bac9cc; font-size: 14px; margin: 6px 0;"><strong>Guardian:</strong> ${userName}</p>
        <p style="color: #bac9cc; font-size: 14px; margin: 6px 0;"><strong>Wallet:</strong> <code style="background: #0a0c10; padding: 2px 8px; border-radius: 4px; font-family: monospace;">${wallet}</code></p>
        <p style="color: #bac9cc; font-size: 14px; margin: 6px 0;"><strong>Last Check-in:</strong> ${lastCheckIn} (UTC)</p>
        <p style="color: #bac9cc; font-size: 14px; margin: 6px 0;"><strong>Alert Time:</strong> ${new Date().toUTCString()}</p>
      </div>
      <p style="color: #849396; font-size: 13px; text-align: center; line-height: 1.6;">
        -- SoulSign Protocol<br>
        <a href="https://soulsign.app" style="color: #c3f5ff;">Visit SoulSign</a>
      </p>
    </div>
  `;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'SoulSign <noreply@soulsign.app>',
      to: [to],
      subject: 'SoulSign - Emergency Guardian Alert',
      html,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('[SoulSign] Resend error:', err);
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Vercel Cron 验证
  if (req.headers['x-vercel-signature']) {
    // 生产环境验证
  }

  console.log('[SoulSign] Running 72h check...');

  const now = Date.now();
  const TEST_THRESHOLD_MS = 1 * 60 * 1000; // 测试用 1 分钟，生产改成 72 * 60 * 60 * 1000
  const seventyTwoHoursAgo = now - TEST_THRESHOLD_MS;

  try {
    // 查询 alerted72h = false 的用户
    const queryRes = await fetch(
      `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT}/databases/(default)/documents:runQuery`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          structuredQuery: {
            from: [{ collectionId: 'users' }],
            where: {
              compositeFilter: {
                op: 'AND',
                filters: [
                  { fieldFilter: { field: { fieldPath: 'hasSoulNFT' }, op: 'EQUAL', value: { booleanValue: true } } },
                  { fieldFilter: { field: { fieldPath: 'alerted72h' }, op: 'EQUAL', value: { booleanValue: false } } },
                  { fieldFilter: { field: { fieldPath: 'emergencyEmail' }, op: 'NOT_EQUAL', value: { stringValue: '' } } },
                ],
              },
            },
          },
        }),
      }
    );

    const results = await queryRes.json();
    let sentCount = 0;

    for (const result of results) {
      if (!result.document) continue;
      const fields = result.document.fields || {};
      const wallet = fields.wallet?.stringValue || '';
      const lastCheckInVal = fields.lastCheckIn?.timestampValue;
      const lastCheckInTime = parseTimestamp(lastCheckInVal);
      const email = fields.emergencyEmail?.stringValue || '';
      const name = fields.emergencyName?.stringValue || '';

      if (lastCheckInTime > 0 && lastCheckInTime < seventyTwoHoursAgo && email) {
        await sendEmail(email, name, wallet, new Date(lastCheckInTime).toUTCString());

        // 更新 alerted72h = true
        const docName = result.document.name.split('/').pop();
        await fetch(
          `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT}/databases/(default)/documents/users/${docName}`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fields: { alerted72h: { booleanValue: true } },
            }),
          }
        );

        sentCount++;
        console.log(`[SoulSign] Alert sent to ${email} for wallet ${wallet}`);
      }
    }

    console.log(`[SoulSign] 72h check complete. Sent ${sentCount} emails.`);
    return res.status(200).json({ success: true, sentCount });
  } catch (error: any) {
    console.error('[SoulSign] 72h check error:', error);
    return res.status(500).json({ error: error.message });
  }
}
