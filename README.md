# Todo

シンプルなタスク管理アプリです。タスクの「追加・完了チェック・削除」ができます。
データはブラウザ内（localStorage）に保存されるため、サーバーやデータベースは不要です。

## 技術構成

- [Next.js 15](https://nextjs.org/)（App Router）
- React 19 / TypeScript
- 永続化：ブラウザの localStorage

## ローカルで動かす

```bash
npm install
npm run dev
```

ブラウザで http://localhost:3000 を開きます。

## Vercel へのデプロイ

1. このフォルダを GitHub のリポジトリにプッシュします。
2. [Vercel](https://vercel.com/) にログインし「Add New… → Project」から
   リポジトリをインポートします。
3. フレームワークは自動で **Next.js** と認識されます。設定はそのまま
   「Deploy」を押すだけで公開されます。

> Vercel CLI を使う場合は `npm i -g vercel` のあと、このフォルダで
> `vercel` を実行してください。
