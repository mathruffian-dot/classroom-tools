# Classroom 自動化工具（clasp + Apps Script）

用 Google Apps Script 接 Google Classroom API，讓「列課程／列學生／貼公告／建作業」都能自動化。
由 Claude Code 於 2026-07-07 建立。

## 這是什麼

- 本機資料夾：`G:\我的雲端硬碟\classroom-tools`
- 雲端 Apps Script 專案：`https://script.google.com/d/<你的 scriptId>/edit`
- 程式：`Code.js`（4 個範例函式）；設定：`appsscript.json`（已啟用 Classroom 進階服務與 OAuth 範圍）

## 一次性設定（只有你能做的授權步驟）

1. **啟用 Classroom API（GCP）**
   - 開啟上方 Apps Script 專案 → 左側「專案設定」⚙ → 記下「GCP 專案編號」。
   - 若第一次執行時報「Classroom API has not been used／未啟用」，到該 GCP 專案的 API Library 搜尋 **Google Classroom API** 並按「啟用」。
   - （多數情況下推送進階服務後會自動啟用，遇到才需手動。）

2. **首次授權**
   - 在 Apps Script 編輯器上方函式選 `listCourses` → 按「執行」。
   - Google 跳出授權視窗 → 選你的**教師帳號** → 「進階／允許」。
   - 授權完成後，「執行記錄」會列出你所有課程與 courseId。

3. **操作其他函式**
   - 把 `Code.js` 裡的 `COURSE_ID` 換成上一步查到的課程 id，再執行 `listStudents` / `postAnnouncement` / `createAssignment`。

## 開發流程（clasp）

```bash
cd classroom-tools
clasp pull      # 從雲端拉最新
clasp push      # 把本機改動推上雲端
clasp open-script   # 用瀏覽器開啟編輯器
```

> Claude Code 可直接幫你改 `Code.js` 再 `clasp push`；但「執行／授權」一定要你在編輯器點（涉及 Google 帳號同意）。

## 安全提醒

- 這支腳本能讀學生名單與 email、能改課程內容，請勿把授權給不信任的程式。
- 學生個資請遵守校內規範，不要外流到第三方。
