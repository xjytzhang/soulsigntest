const functions = require("firebase-functions");
const admin = require("firebase-admin");
const sgMail = require("@sendgrid/mail");

admin.initializeApp();
const db = admin.firestore();

// SendGrid API Key (设置在 Firebase Console 环境变量中)
if (functions.config().sendgrid && functions.config().sendgrid.key) {
  sgMail.setApiKey(functions.config().sendgrid.key);
}

// ============================================
// HTTP API 接口（供前端调用）
// ============================================

/**
 * 用户 Mint NFT 后调用此接口
 * POST /api/register
 * Body: { wallet: "0x...", txHash: "0x...", chainId: 84532 }
 */
exports.register = functions.https.onRequest(async (req, res) => {
  // CORS 头
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).send("");
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { wallet, txHash, chainId, emergencyName, emergencyEmail } = req.body;

    if (!wallet) {
      return res.status(400).json({ error: "wallet is required" });
    }

    const walletLower = wallet.toLowerCase();
    const now = admin.firestore.Timestamp.now();

    await db.collection("users").doc(walletLower).set(
      {
        wallet: walletLower,
        hasSoulNFT: true,
        lastCheckIn: now,
        emergencyEmail: emergencyEmail || "",
        emergencyName: emergencyName || "",
        alerted72h: false,
        createdAt: now,
        txHash: txHash || "",
        chainId: chainId || 84532,
      },
      { merge: true }
    );

    // 记录 mint 日志
    await db.collection("mint_logs").add({
      wallet: walletLower,
      txHash: txHash || "",
      timestamp: now,
    });

    console.log(`[SoulSign] User registered: ${walletLower}`);
    return res.status(200).json({ success: true, wallet: walletLower });
  } catch (error) {
    console.error("[SoulSign] Register error:", error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * 用户签到后调用此接口
 * POST /api/checkin
 * Body: { wallet: "0x...", txHash: "0x..." }
 */
exports.checkin = functions.https.onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).send("");
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { wallet, txHash } = req.body;

    if (!wallet) {
      return res.status(400).json({ error: "wallet is required" });
    }

    const walletLower = wallet.toLowerCase();
    const now = admin.firestore.Timestamp.now();

    // 更新最后签到时间，同时重置 72h 警报状态
    await db.collection("users").doc(walletLower).set(
      {
        lastCheckIn: now,
        alerted72h: false, // 用户回来签到，重置警报
      },
      { merge: true }
    );

    // 记录签到日志
    await db.collection("checkin_logs").add({
      wallet: walletLower,
      txHash: txHash || "",
      timestamp: now,
    });

    console.log(`[SoulSign] Check-in: ${walletLower}`);
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("[SoulSign] Checkin error:", error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * 设置紧急联系人
 * POST /api/setEmergencyContact
 * Body: { wallet: "0x...", name: "John", email: "john@example.com" }
 */
exports.setEmergencyContact = functions.https.onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).send("");
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { wallet, name, email } = req.body;

    if (!wallet || !email) {
      return res.status(400).json({ error: "wallet and email are required" });
    }

    const walletLower = wallet.toLowerCase();

    await db.collection("users").doc(walletLower).set(
      {
        emergencyEmail: email,
        emergencyName: name || "",
        updatedAt: admin.firestore.Timestamp.now(),
      },
      { merge: true }
    );

    console.log(`[SoulSign] Emergency contact set for ${walletLower}`);
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("[SoulSign] Set emergency contact error:", error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * 获取用户信息
 * GET /api/user/:wallet
 */
exports.getUser = functions.https.onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).send("");
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const wallet = req.params.wallet;
    if (!wallet) {
      return res.status(400).json({ error: "wallet is required" });
    }

    const walletLower = wallet.toLowerCase();
    const doc = await db.collection("users").doc(walletLower).get();

    if (!doc.exists) {
      return res.status(404).json({ error: "User not found" });
    }

    const data = doc.data();
    // 返回友好格式
    return res.status(200).json({
      wallet: data.wallet,
      hasSoulNFT: data.hasSoulNFT || false,
      lastCheckIn: data.lastCheckIn
        ? data.lastCheckIn.toDate().toISOString()
        : null,
      emergencyEmail: data.emergencyEmail || "",
      emergencyName: data.emergencyName || "",
      alerted72h: data.alerted72h || false,
      createdAt: data.createdAt ? data.createdAt.toDate().toISOString() : null,
    });
  } catch (error) {
    console.error("[SoulSign] Get user error:", error);
    return res.status(500).json({ error: error.message });
  }
});

// ============================================
// 定时任务：每小时检测 72 小时未签到
// ============================================
exports.check72Hours = functions.pubsub
  .schedule("every 1 minutes")
  .onRun(async (context) => {
    console.log("[SoulSign] Running 72h check...");

    const now = Date.now();
    const seventyTwoHoursAgo = now - 1 * 60 * 1000; // 测试用 1 分钟

    try {
      // 查找超过72小时未签到且未发送警报的用户
      const snapshot = await db
        .collection("users")
        .where("hasSoulNFT", "==", true)
        .where("alerted72h", "==", false)
        .get();

      let sentCount = 0;

      for (const doc of snapshot.docs) {
        const user = doc.data();
        const lastCheckInTime = user.lastCheckIn
          ? user.lastCheckIn.toDate().getTime()
          : 0;

        // 如果超过72小时未签到
        if (lastCheckInTime > 0 && lastCheckInTime < seventyTwoHoursAgo) {
          const email = user.emergencyEmail;
          const name = user.emergencyName || "Guardian";
          const wallet = user.wallet;

          if (email) {
            await sendEmergencyEmail(email, name, wallet, lastCheckInTime);

            // 更新警报状态
            await doc.ref.update({ alerted72h: true });

            sentCount++;
            console.log(
              `[SoulSign] Sent alert email to ${email} for wallet ${wallet}`
            );
          }
        }
      }

      console.log(`[SoulSign] 72h check complete. Sent ${sentCount} emails.`);
      return null;
    } catch (error) {
      console.error("[SoulSign] 72h check error:", error);
      return null;
    }
  });

// ============================================
// 发送紧急邮件
// ============================================
async function sendEmergencyEmail(email, name, wallet, lastCheckInTime) {
  if (!functions.config().sendgrid || !functions.config().sendgrid.key) {
    console.warn("[SoulSign] SendGrid not configured, skipping email");
    return;
  }

  const lastCheckInDate = new Date(lastCheckInTime).toLocaleString("en-US", {
    timeZone: "UTC",
  });

  const msg = {
    to: email,
    from: "noreply@soulsign.app", // 替换为你的发件邮箱
    subject: "⚠️ SoulSign Emergency Alert - Guardian Needs Attention",
    html: `
      <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #0a0c10; color: #dfe2eb;">
        <div style="text-align: center; margin-bottom: 40px;">
          <h1 style="color: #c3f5ff; font-size: 28px; margin-bottom: 10px;">⚠️ Emergency Alert</h1>
          <p style="color: #69ff87; font-size: 14px; text-transform: uppercase; letter-spacing: 2px;">SoulSign Digital Life Guardian</p>
        </div>

        <div style="background: #12161b; border-radius: 16px; padding: 30px; margin-bottom: 24px; border: 1px solid rgba(255,255,255,0.06);">
          <h2 style="color: #ffc687; font-size: 20px; margin-bottom: 20px;">Dear ${name},</h2>
          <p style="color: #dfe2eb; line-height: 1.8; font-size: 15px;">
            Your Guardian has <strong style="color: #ffc687;">not checked in for over 72 hours</strong>.
            This is an automated alert from SoulSign.
          </p>
        </div>

        <div style="background: #161a1f; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
          <h3 style="color: #c3f5ff; font-size: 14px; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 1px;">Guardian Details</h3>
          <p style="color: #bac9cc; font-size: 14px; margin: 6px 0;"><strong>Wallet:</strong> <code style="background: #0a0c10; padding: 2px 8px; border-radius: 4px; font-family: monospace;">${wallet}</code></p>
          <p style="color: #bac9cc; font-size: 14px; margin: 6px 0;"><strong>Last Check-in:</strong> ${lastCheckInDate} (UTC)</p>
          <p style="color: #bac9cc; font-size: 14px; margin: 6px 0;"><strong>Alert Time:</strong> ${new Date().toUTCString()}</p>
        </div>

        <p style="color: #849396; font-size: 13px; text-align: center; line-height: 1.6;">
          This is an automated message from SoulSign Protocol.<br>
          Please check on your Guardian's well-being.<br>
          <a href="https://soulsign.app" style="color: #c3f5ff;">Visit SoulSign</a>
        </p>
      </div>
    `,
  };

  try {
    await sgMail.send(msg);
  } catch (error) {
    console.error("[SoulSign] SendGrid error:", error);
    if (error.response) {
      console.error(error.response.body);
    }
  }
}
