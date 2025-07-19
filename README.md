# ImgifyBot

PDF、Word、PowerPointファイルを画像に変換するDiscord Botです。

## 機能

- PDFファイルを画像に変換
- Word文書（.docx, .doc）を画像に変換
- PowerPointプレゼンテーション（.pptx, .ppt）を画像に変換
- 変換結果を専用スレッドで送信
- 進行状況をリアクションで表示

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env`ファイルを作成し、以下を設定：

```
DISCORD_TOKEN=your_bot_token_here
```

### 3. LibreOfficeのインストール

Word・PowerPointファイルの変換にはLibreOfficeが必要です：

- **Windows**: [LibreOffice公式サイト](https://www.libreoffice.org/)からダウンロード・インストール
- **Ubuntu/Debian**: `sudo apt-get install libreoffice`
- **macOS**: `brew install --cask libreoffice`

## Discord Bot設定

### 必要な権限（Bot Permissions）

Discord Developer Portalでbotを作成する際、以下の権限を設定してください：

#### テキスト権限
- ✅ **Read Messages** - メッセージを読み取るため
- ✅ **Send Messages** - スレッドでメッセージを送信するため
- ✅ **Add Reactions** - 進行状況のリアクションを追加するため
- ✅ **Manage Messages** - リアクションを削除するため
- ✅ **Create Public Threads** - 変換結果を送信するスレッドを作成するため
- ✅ **Send Messages in Threads** - 作成したスレッドに画像を送信するため
- ✅ **Attach Files** - 変換された画像ファイルを送信するため

#### Gateway Intents
アプリケーション設定で以下を有効化：
- ✅ **Server Members Intent**
- ✅ **Message Content Intent**

## 使用方法

### 起動

```bash
npm start
```

開発時（ファイル変更の自動検知）：

```bash
npm run dev
```

### Discordでの使用

1. サポートファイル（.pdf, .docx, .doc, .pptx, .ppt）をチャンネルにアップロード
2. Bot が⏳リアクションで処理開始を通知
3. 変換完了後、✅リアクションと共に専用スレッドが作成される
4. スレッド内に変換された画像が送信される
5. エラー時は❌リアクションが表示される

## サポートファイル形式

- PDF (.pdf)
- Microsoft Word (.docx, .doc)
- Microsoft PowerPoint (.pptx, .ppt)

## 技術仕様

- **Node.js**: ES Modules使用
- **Discord.js**: v14
- **pdf-to-img**: PDF→画像変換
- **libreoffice-convert**: Office文書→PDF変換