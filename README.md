# HowardAI_Studio SaaS

HowardAI_Studio 是一個以 **前後端分離** 建置的 SaaS 專案，目前提供登入入口頁面（SSO 與一般帳號流程）與後端 API 基礎骨架，方便後續擴充 Microsoft 365/Sentinel 相關能力。

## 功能說明（目前版本）

### 前端（Next.js）
- 提供 HowardAI Studio 登入頁。
- 支援 **Microsoft Entra ID SSO 登入流程入口**：
  - 可在 UI 中輸入 Tenant ID、Client ID、Client Secret、Redirect URI。
  - 依設定即時組合 Microsoft OAuth2 authorize URL。
- 支援 **一般帳號（Trial）登入表單**（目前為前端模擬成功流程）。
- 以 Tailwind CSS 建置介面、以 React state 管理 modal 與表單狀態。

### 後端（NestJS）
- 提供基礎 API 服務骨架。
- 目前包含一個根路由 `GET /`，回傳 `Hello World!` 供健康確認與開發驗證。
- 啟動時監聽 `0.0.0.0` 與 `PORT`（預設 3001），可直接相容 Docker / Cloud Run。

## 專案架構

```text
.
├── frontend/                  # Next.js 前端應用
│   ├── src/app/
│   │   ├── page.tsx           # 登入頁（SSO + 一般帳號）
│   │   ├── layout.tsx         # 全域版型
│   │   └── globals.css        # 全域樣式
│   └── package.json
├── backend/                   # NestJS 後端 API
│   ├── src/
│   │   ├── main.ts            # 服務啟動入口（0.0.0.0:PORT）
│   │   ├── app.module.ts      # 模組組裝
│   │   ├── app.controller.ts  # HTTP 路由
│   │   └── app.service.ts     # 業務邏輯（示例）
│   └── package.json
├── docker-compose.yml         # 本地整包啟動（前後端 + DB + Redis）
├── start.sh                   # macOS/Linux 啟動腳本
└── start.bat                  # Windows 啟動腳本
```

## 技術棧
- Frontend: Next.js (App Router), React, TypeScript, Tailwind CSS
- Backend: NestJS, TypeScript
- Data/Infra（local）: MongoDB、Redis（透過 Docker Compose）

## 如何在本機測試（Local Testing）

你可以用 **Docker 整包啟動**，或 **分開啟動前後端**。

### 方式 A：Docker Compose（推薦）

#### 1) 啟動
- Windows
  ```bash
  start.bat
  ```
- macOS / Linux
  ```bash
  ./start.sh
  ```
- 或手動
  ```bash
  docker-compose up --build
  ```

#### 2) 驗證服務
- Frontend: http://localhost:3000
- Backend: http://localhost:3001
- API smoke test:
  ```bash
  curl http://localhost:3001/
  ```
  預期回傳：`Hello World!`

### 方式 B：分開啟動（不透過 Docker）

#### 1) 前端
```bash
cd frontend
npm install
npm run dev
```
預設網址： http://localhost:3000

#### 2) 後端
```bash
cd backend
npm install
npm run start:dev
```
預設網址： http://localhost:3001

#### 3) 本地測試指令（建議）
- 前端 Lint
  ```bash
  cd frontend
  npm run lint
  ```
- 後端單元測試
  ```bash
  cd backend
  npm run test
  ```
- 後端 E2E 測試
  ```bash
  cd backend
  npm run test:e2e
  ```

## 部署策略（現況）

目前以 **Google Cloud Run** 為主要部署目標：
1. `frontend` 採用 Next.js standalone 方式縮小映像體積。
2. `backend` 以 NestJS 多階段建置，並監聽 `0.0.0.0` 以符合容器平台需求。
