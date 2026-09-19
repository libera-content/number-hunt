# NUMBER HUNT（数字ハント）

Version 2.1

スマートフォンのブラウザだけで遊べる、30秒 / 60秒の数字判断ゲームです。
画面上部の条件を読み、9個の数字の中から条件に合う数字を全部タップします。

## 遊び方

1. **30 SEC / 60 SEC** を選んで **START**（初期は30秒）→ 3・2・1 のカウントダウン後にスタート
2. 条件（例：「7より大きい数字」）に合う数字をすべてタップ
3. 全部見つけると次の問題へ
4. 時間切れで終了。**もう一度** で同じモードに再挑戦、**タイトルへ** でモード変更

| 操作 | 結果 |
| --- | --- |
| 正解タップ | +100点 × コンボ倍率 |
| 不正解タップ | −50点・残り時間 −1秒・コンボリセット |
| 10・20・30…コンボ到達 | COMBO BONUS +300（通常点とは別） |

**コンボ倍率**：0〜4 ×1.0 / 5〜9 ×1.2 / 10〜14 ×1.5 / 15〜19 ×2.0 / 20〜 ×2.5

**レベル**（正解タップ数で上昇）

| LEVEL | 正解数 | 主な条件 | 数字の範囲 |
| --- | --- | --- | --- |
| 1 | 0〜9 | 〇より大きい / 小さい | 1〜20 |
| 2 | 10〜19 | 偶数 / 奇数 | 1〜20 |
| 3 | 20〜34 | 3・4・5の倍数 | 1〜30 |
| 4 | 35〜 | 奇数かつ〇以上 など | 1〜30 |

レベル2以降は下のレベルの条件も一定確率で混ざります。

## ファイル構成

```
index.html   画面構造（タイトル / ゲーム / カウントダウン / 結果）
style.css    スマホ縦画面向けスタイル
script.js    ゲームロジック（CONFIG で設定を一元管理）
README.md    このファイル
```

## 一般ブラウザで遊ぶ

### 公開URL

```
https://<GitHubユーザー名>.github.io/number-hunt/
```

（公開後、実際のURLに書き換えてください）

iPhone Safari / Chrome、Android Chrome、PCブラウザで、このURLを開くだけで遊べます。LINE・X・メールなどでそのまま共有できます。

### GitHub Pages で公開する（ブラウザだけで完結・git不要）

1. GitHub にログインし、右上「＋」→ **New repository**
2. Repository name を `number-hunt`、公開範囲を **Public** にして作成
   （無料プランの GitHub Pages は Public リポジトリが必要です）
3. 作成直後の画面で **uploading an existing file** を選び、次の4ファイルをドラッグ＆ドロップ → **Commit changes**
   `index.html` / `style.css` / `script.js` / `README.md`
   ※ フォルダごとではなく、4ファイルがリポジトリ直下に並ぶようにします
4. **Settings → Pages** を開き、Source を **Deploy from a branch**、Branch を `main` と `/(root)` にして **Save**
5. 1〜3分待つと、Pages 設定画面の上部に公開URLが表示されます
   （進行状況は **Actions** タブの「pages-build-deployment」で確認できます）

git を使う場合：

```bash
git init && git add . && git commit -m "NUMBER HUNT v2.1"
git branch -M main
git remote add origin https://github.com/<ユーザー名>/number-hunt.git
git push -u origin main
```

### 更新方法

1. 変更したファイルを同じ手順で再アップロード（同名ファイルは上書き）→ Commit
2. CSS / JS を変えたときは、`index.html` の `?v=2.1` と `script.js` の `CONFIG.VERSION` を同じ値に上げる（例：`2.2`）
   → ブラウザが古いCSS/JSを使い続けるのを防げます
3. 反映まで1〜3分。GitHub Pages は HTML を最大10分程度キャッシュすることがあります

### Safari で音が出ない場合

- iPhone の **消音モード（マナースイッチ／消音モード表示がオン）** だと、Safari のWeb音声は鳴りません
- 本体の音量、Bluetoothイヤホンの接続先を確認
- タイトル画面右上が **SOUND ON** になっているか確認
- 音は **START をタップした後** から鳴る仕様です（ブラウザの制限）
- 他アプリから戻った直後に鳴らない場合は、ページを再読み込み

### 古い画面が表示される（キャッシュが残った）場合

- **iPhone Safari**：アドレスバー右の再読み込みボタン。直らなければURL末尾に `?r=1` などを付けて開く
- **iPhone / Android Chrome**：メニュー → 再読み込み。直らなければ同様に `?r=1` を付ける
- **PC**：Windows は `Ctrl + Shift + R`、Mac は `Cmd + Shift + R`
- 最終手段：ブラウザ設定から `github.io` のサイトデータを削除（**BESTスコアも消えます**）

## ローカルでの起動

外部ライブラリもビルドも不要です。

- いちばん簡単：`index.html` をブラウザで開く
- スマホ実機で試す場合は簡易サーバーを立てます

```bash
cd number-hunt
python3 -m http.server 8000
```

PCとスマホを同じWi-Fiにつなぎ、スマホで `http://<PCのIPアドレス>:8000` を開きます。
（PCのIPは Mac: `ipconfig getifaddr en0`、Windows: `ipconfig` で確認）

PCのChromeでは DevTools（F12）→ デバイスツールバー（Ctrl+Shift+M）で iPhone SE（375×667）などを選ぶとスマホ表示を確認できます。

## 保存データ（localStorage）

| キー | 内容 |
| --- | --- |
| `numberHuntBestScore30` | 30秒モードのBEST |
| `numberHuntBestScore60` | 60秒モードのBEST（MVP版の `numberHuntBestScore` があれば初回に引き継ぎ） |
| `numberHuntSoundEnabled` | サウンド設定（`1`=ON / `0`=OFF） |

localStorage が使えない環境でも、ゲームは保存なしで動作します。

## 検証用セッションデータ

ページを開いている間だけ保持します（画面表示なし、リロードでリセット）。ブラウザのコンソールで確認できます。

```js
NumberHunt.getSessionStats()
// totalPlays / retries / titleStarts / completedPlays / retryRate
// averageScore / averageAccuracy / overallAccuracy / averageMaxCombo / averageMaxLevel
// 累積値（totalScore など）/ byMode['30'], byMode['60']（モード別の同じ項目）/ version
NumberHunt.getPlayHistory()   // 直近10プレイ: mode, score, correct, miss, accuracy, maxCombo, maxLevel, playedAt ほか
```

- 平均値は **セッション全体の累積**（playHistory の直近10件ではない）。分母は結果画面まで到達したプレイ数（completedPlays）
- `retryRate = retries / totalPlays`（totalPlays が0なら0）
- `averageAccuracy` は各プレイの正答率の平均、`overallAccuracy` は全タップ合算の正答率

## 設計メモ（拡張しやすくするための構造）

- **結果画面の RECENT SCORE**：同じモードの直近5プレイを棒グラフ表示（30秒と60秒はスコア水準が違うため混ぜない）。前回比は同モードの直前プレイと比較
- **CONFIG**：制限時間（`GAME_DURATIONS`）・得点・コンボボーナス・カウントダウン秒数（`COUNTDOWN_DURATION` / `RETRY_COUNTDOWN_DURATION`＝初回3秒・リトライ1秒、0で即開始）・問題切替の間（`QUESTION_TRANSITION_DELAY`）・音量などを集約
- **効果音**：Web Audio API で生成（音声ファイルなし）。AudioContext は1つだけ、START等のタップ時に初期化。未対応環境では無音で動作
- **CONDITIONS**：レベルごとに「条件を作る関数」の配列。掛け算・計算問題モードは新しい条件関数を追加する形で拡張できます
- **問題生成**：先に正解数（2〜5個）を決め、正解候補と不正解候補から抽選するため、正解ゼロ・全部正解の問題は発生しません
- **タイマー**：終了時刻（`performance.now()` 基準）を保持する方式。ミス時は終了時刻を1秒前倒し
- タイマーIDは一元管理し、リトライ時にすべて解除

## 今後追加できる機能

- 10秒モード、難易度選択
- デイリーチャレンジ（日付をシードにした同一問題）
- ランキング（オンライン）
- 子ども向けモード（数字の範囲を狭く・ペナルティなし）
- 掛け算モード、計算問題モード（「3×4 になる数字」など）
- BGM
- 広告・リワード広告（例：コンティニューで+5秒）
- SNSシェア（結果画像の生成）
- PWA化（ホーム画面追加・オフライン動作）