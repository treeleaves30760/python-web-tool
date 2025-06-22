# Python Web IDE

一個基於 Nuxt.js 的網頁版 Python 開發環境，類似於 VSCode 的介面設計，完全運行在瀏覽器中，無需安裝任何軟體。

## 功能特色

### 🚀 核心功能

- **檔案管理區塊**: 支援多檔案編輯，新增、刪除檔案
- **程式碼編輯區塊**: 使用 Monaco Editor（VSCode 編輯器核心）
- **執行結果區塊**: 可收合的輸出面板，即時顯示 Python 程式執行結果

### 💡 技術亮點

- **純靜態**: 無需後端服務器，完全運行在瀏覽器中
- **Python 執行**: 使用 Pyodide 在瀏覽器中執行 Python 程式碼
- **現代化介面**: 暗色主題，類似 VSCode 的使用體驗
- **響應式設計**: 支援桌面和行動裝置

## 技術架構

- **前端框架**: Nuxt.js 3
- **程式碼編輯器**: Monaco Editor
- **Python 引擎**: Pyodide
- **UI 框架**: Vue 3 + 原生 CSS
- **部署方式**: 靜態網站生成 (SSG)

## 快速開始

### 安裝依賴

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install
```

### 開發服務器

啟動開發服務器在 `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev
```

### 靜態構建

構建用於生產的靜態網站：

```bash
# npm
npm run generate

# pnpm
pnpm generate

# yarn
yarn generate
```

構建完成後，所有檔案將在 `dist/` 目錄中，可以直接部署到任何靜態網站服務。

## 使用說明

### 基本操作

1. **檔案管理**
   - 點擊左側檔案清單選擇檔案
   - 點擊「+ 新增檔案」創建新的 Python 檔案
   - 點擊檔案項目的 ×  按鈕刪除檔案

2. **程式碼編輯**
   - 在中央編輯區編寫 Python 程式碼
   - 支援語法高亮、自動完成等功能
   - 可以透過標籤頁快速切換檔案

3. **執行程式碼**
   - 點擊右上角「執行程式碼」按鈕
   - 結果將顯示在右側輸出面板
   - 點擊輸出面板標頭可以收合/展開

### 範例程式碼

預設提供的範例包含：

- 基本的 Hello World
- 數據計算範例
- 迴圈操作範例

## 部署選項

由於這是一個純靜態應用，可以部署到任何支援靜態網站的平台：

- **Netlify**: 直接連接 Git 自動部署
- **Vercel**: 支援 Nuxt.js 的原生部署
- **GitHub Pages**: 免費的靜態網站託管
- **Cloudflare Pages**: 全球 CDN 加速
- **任何 CDN 或靜態檔案服務**

## 技術限制

由於使用 Pyodide 在瀏覽器中執行 Python：

- 初次載入需要下載 Python 運行環境（約 10-20MB）
- 某些 Python 套件可能不支援
- 執行效能比原生 Python 稍慢
- 無法執行需要系統權限的操作

## 瀏覽器支援

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## 開發團隊

這個專案使用現代化的 Web 技術堆疊，適合作為：

- Python 學習工具
- 程式碼原型開發
- 線上程式教學
- 輕量級開發環境

## 授權

MIT License
