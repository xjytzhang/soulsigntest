# SoulSign 部署指南

## 项目结构

```
stitch/
├── contracts/
│   └── SoulSign.sol        # 智能合约
├── scripts/
│   └── deploy.js           # 部署脚本
├── hardhat.config.js       # Hardhat 配置
├── package.json
├── firebase.json           # Firebase 配置
├── firestore.rules         # Firestore 安全规则
├── functions/              # Firebase Cloud Functions
│   ├── index.js            # 所有云函数
│   └── package.json
└── index/, sign/, setting/, mint/
    └── code.html           # 前端页面（已对接合约）
```

---

## 第一步：部署智能合约

### 1. 安装依赖
```bash
npm install
```

### 2. 创建 `.env` 文件
```bash
cp .env.example .env
```

编辑 `.env`，填入你的私钥：
```
PRIVATE_KEY=0xYourPrivateKeyHere
```

**获取私钥**：MetaMask → 账户详情 → 显示私钥

### 3. 获取测试币
去 https://www.coinbase.com/faucets/base-sepolia-faucet 免费领取 Base Sepolia 测试 ETH

### 4. 部署合约
```bash
npm run deploy:baseSepolia
```

部署成功后会生成 `deployments.json`，包含合约地址。

### 5. 更新前端合约地址
部署完成后，打开以下文件，把 `0x0000000000000000000000000000000000000000` 替换成实际合约地址：

- `mint/code.html`
- `sign/code.html`
- `setting/code.html`

```javascript
const CONTRACT_ADDRESS = '0x你的合约地址'; // 例如：0x1234...
```

---

## 第二步：搭建 Firebase 后端

### 1. 创建 Firebase 项目
1. 打开 https://console.firebase.google.com
2. 点击 "Add project" → 输入项目名 → 继续
3. 关闭 Google Analytics（可选）→ 创建项目

### 2. 启用 Firestore Database
1. Build → Firestore Database → Create database
2. 选择 "Start in test mode" → 继续
3. 选择区域（us-central1）

### 3. 启用 Cloud Functions（需要升级到 Blaze 付费计划）
1. Project Settings → Usage and billing → Modify plan → 选择 Blaze（Pay as you go）
2. 免费额度足够个人使用

### 4. 配置 SendGrid
1. 注册 https://signup.sendgrid.com
2. Settings → API Keys → Create API Key → 选择 Full Access
3. 复制 API Key

### 5. 设置 Firebase 环境变量
```bash
npm install -g firebase-tools
firebase login
cd functions
firebase functions:config:set sendgrid.key="YOUR_SENDGRID_API_KEY"
```

### 6. 更新前端 API 地址
打开以下文件，把 `YOUR_FIREBASE_PROJECT` 替换成你的 Firebase 项目 ID：

- `mint/code.html`
- `sign/code.html`
- `setting/code.html`

```javascript
const API_BASE = 'https://us-central1-YOUR_FIREBASE_PROJECT.cloudfunctions.net';
```

项目 ID 在：Firebase Console → Project Settings → General → Project ID

### 7. 部署 Cloud Functions
```bash
cd functions
npm install
firebase deploy --only functions
```

---

## 第三步：测试

### 本地测试
```bash
python3 -m http.server 8080
```
然后访问 http://localhost:8080

### 测试流程
1. 打开首页 → 连接钱包
2. Mint 页面 → Mint Soul NFT（付 Gas）
3. Sign 页面 → Hold to Pulse 签到
4. Setting 页面 → 设置紧急联系人
5. 检查 Firestore → 应该看到用户数据
6. 测试 72h 邮件（改 Firestore 里 lastCheckIn 时间手动模拟）

---

## 第四步：部署到生产

### 前端部署（Netlify）
1. https://netlify.com 注册
2. Drag & drop 上传整个项目文件夹
3. 访问分配的 URL 测试

### 切换到 Base 主网
部署到主网后，修改合约地址和网络 Chain ID：
- `mint/sign/setting` 页面的 `BASE_SEPOLIA_CHAIN_ID`
- `hardhat.config.js` 添加主网配置

---

## 常见问题

**Q: 钱包连不上？**
A: 确保用 HTTP 访问（不是 file://），确保钱包扩展已安装

**Q: Mint 失败？**
A: 检查钱包是否切换到 Base Sepolia 网络，检查账户余额是否够付 Gas

**Q: Firebase 部署失败？**
A: 确保升级到 Blaze 计划，确保 .firebaserc 配置正确

**Q: 收不到邮件？**
A: 检查 SendGrid API Key 是否正确，检查 Firebase Functions 日志
