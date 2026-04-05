# M365 Sentinel Platform

> Microsoft 365 企業資安治理儀表板 — 帳號清查、權限審查、安全評分、合規監控一站式管理。

---

## 情境背景

企業導入 Microsoft 365 後，隨著使用者增加、Teams 頻道擴展、SharePoint 站台增生，管理者往往面臨以下挑戰：

- **帳號失控**：員工離職後帳號未停用、Guest 帳號長期存在、服務帳號無人管理
- **權限蔓延**：SharePoint 站台對外部帳號開放讀寫、匿名連結無法追蹤、Teams Owner 過多
- **合規盲點**：無法快速回答「哪些帳號能存取機密文件」、「是否有匿名分享連結」
- **稽核困難**：稽核人員需跨多個 M365 管理介面手動彙整，耗時且容易遺漏

**M365 Sentinel Platform** 將上述稽核工作集中到單一儀表板，提供結構化的帳號與權限清查視圖，協助 IT 管理員、資安長（CISO）與合規團隊快速掌握風險。

---

## 功能介紹

### 1. 安全評分總覽 (Dashboard)
- 即時顯示 Microsoft Secure Score 趨勢圖（過去 30 天）
- 風險事件統計：高風險登入次數、MFA 未啟用比例、條件式存取覆蓋率
- 合規狀態卡片：授權使用率、非作用中帳號比例、Guest 帳號佔比
- 快速跳轉至各功能模組

### 2. 帳號清查 (Account Audit)

#### 成員清查
| 子模組 | 說明 |
|--------|------|
| **Teams 成員** | 列出所有 Teams 的成員清單，標示角色（Owner/Member/Guest）、活躍天數、停用風險 |
| **SharePoint 成員** | 各 SPO 站台的成員清單，標示存取類型與最後活動時間 |
| **外部來賓** | 僅列出 Guest 帳號，顯示受邀日期、所屬組織網域、風險等級 |
| **群組管理** | M365 群組與 Distribution List 成員明細，標示空群組與高風險群組 |
| **待審核** | 符合停用條件（超過 N 天未登入、角色異常）的帳號，可批次匯出 |

每個子模組表格均支援**欄位篩選**，可依使用者名稱、Team、角色、使用者類型、停用天數、風險等級快速過濾。

#### 權限清查
| 子模組 | 說明 |
|--------|------|
| **Teams 權限** | 顯示每位成員在各 Teams 的角色（Owner/Member）、權限等級（Full Control / Edit / Read）、頻道存取範圍、是否可分享 |
| **SPO 權限** | 顯示每位成員在各 SharePoint 站台的權限等級、指派方式（直接指派 / 透過群組）、分享範圍（組織內部 / 特定外部帳號 / 匿名連結） |

**權限等級色碼**：
- 🔴 Full Control（完整控制）
- 🟠 Edit（可讀寫）
- 🟢 Read（唯讀）
- ⚫ Limited Access（有限存取）

**分享範圍識別**：
- 🔗 匿名連結（Anonymous Link）— 高風險，任何人可存取
- 👤 特定外部帳號（Specific External）— 中風險，已知外部使用者
- 🏢 組織內部（Organization Internal）— 低風險

### 3. 安全事件 (Security Events)
- 異常登入事件清單（不可能旅行、陌生裝置、可疑 IP）
- 條件式存取政策觸發記錄
- 每筆事件附帶風險分數與建議處置

### 4. 合規報告 (Compliance)
- ISO 27001 / NIST CSF 控制項對應矩陣
- 自動偵測不符合項目並標示缺口
- 可匯出合規報告（CSV / PDF）

### 5. 授權管理 (Licenses)
- 各 M365 授權 SKU 使用量統計
- 未使用授權清單（可回收節省成本）
- 授權指派變更歷史

### 6. 設定 (Settings)
- **語系切換**：繁體中文 / English
- **Microsoft 365 API 設定**：Tenant ID、Client ID、Client Secret、Redirect URI（儲存後可測試連線）
- 主題、通知、安全性偏好設定

---

## Demo 模式

首次進入系統可選擇「**體驗 Demo 模式**」，載入模擬資料（44 筆 Teams 權限、52 筆 SPO 權限、50+ 個模擬帳號），無需真實 M365 憑證即可體驗完整功能。

實際部署時，透過「**使用 Microsoft 帳號登入**」進行 Azure AD OAuth2 (PKCE) 驗證，所有資料改由 Microsoft Graph API 即時拉取。

---

## 技術架構

```
admindropu/
├── backend/               # FastAPI (Python 3.11+)
│   ├── main.py            # 應用程式進入點，路由掛載
│   ├── mock_data.py       # 模擬資料產生器（帳號、Teams、SPO 權限）
│   ├── routers/
│   │   ├── account_audit.py   # /api/account-audit/*
│   │   ├── security.py        # /api/security/*
│   │   ├── compliance.py      # /api/compliance/*
│   │   ├── licenses.py        # /api/licenses/*
│   │   ├── settings.py        # /api/settings/m365
│   │   └── auth.py            # /api/auth/login, /callback, /me
│   └── requirements.txt
│
└── frontend/              # React 18 + TypeScript + Vite
    └── src/
        ├── contexts/
        │   ├── AuthContext.tsx      # 三種模式：unauthenticated / demo / authenticated
        │   └── LanguageContext.tsx  # zh-TW / en 語系切換
        ├── pages/
        │   ├── Login.tsx           # SSO + Demo 登入頁
        │   ├── Dashboard.tsx       # 安全評分總覽
        │   ├── AccountAudit.tsx    # 帳號清查（成員 + 權限）
        │   ├── Security.tsx        # 安全事件
        │   ├── Compliance.tsx      # 合規報告
        │   ├── Licenses.tsx        # 授權管理
        │   └── Settings.tsx        # 系統設定
        └── services/
            └── api.ts              # Axios + React Query API 層
```

**前端技術棧**：React 18、TypeScript、Vite、Tailwind CSS、Recharts、React Query、Lucide Icons

**後端技術棧**：FastAPI、Pydantic v2、Uvicorn、Python 3.11+

---

## 快速啟動

### Windows — 一鍵啟動

雙擊 `start.bat`，後端（port 8000）與前端（port 5173）會在獨立視窗中啟動。

### 手動啟動

**後端**
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
- API 文件：http://localhost:8000/docs

**前端**
```bash
cd frontend
npm install
npm run dev
```
- 應用程式：http://localhost:5173

---

## 環境需求

| 項目 | 版本 |
|------|------|
| Python | 3.11+ |
| Node.js | 18+ |
| npm | 9+ |

---

## M365 API 設定（真實模式）

1. 在 [Azure Portal](https://portal.azure.com) 註冊應用程式
2. 授予 Microsoft Graph API 權限：`User.Read.All`、`Directory.Read.All`、`Sites.Read.All`、`Team.ReadBasic.All`
3. 複製 Tenant ID、Client ID，產生 Client Secret
4. 在系統「設定 → Microsoft 365 API」頁面填入上述資訊並儲存
5. 點選「測試連線」確認連線成功後，以 Microsoft 帳號登入即可使用真實資料
