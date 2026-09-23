# NUMBER HUNT（数字ハント）

Version 3.0

スマートフォンのブラウザだけで遊べる数字判断ゲームです。
画面上部の条件を読み、9個の数字の中から条件に合う数字を全部タップします。

Ver.3では、**FEVER（爆発的な得点タイム）**・**SPECIAL CHALLENGE（4種の特殊問題）**・
**BONUS TARGET（★の隠しボーナス）**・**DAILY CHALLENGE（日替わり固定問題）**・
**RANK / MISSION / 実績**を追加し、「通常 → 緊張 → 特殊イベント → FEVER → 結果 → 再挑戦」
という波のあるゲーム性へ進化しました。

## 遊び方

1. **30 SEC / 60 SEC** を選んで **START**（初期は30秒）、または **DAILY CHALLENGE** で日替わり固定問題に挑戦
2. 条件（例：「7より大きい数字」）に合う数字をすべてタップ
3. 全部見つけると次の問題へ（約8〜12問ごとに **SPECIAL CHALLENGE** が発生）
4. 時間切れで終了。**もう一度** で同じモードに再挑戦、**タイトルへ** でモード変更

| 操作 | 結果 |
| --- | --- |
| 正解タップ | +100点 × コンボ倍率（FEVER中はさらに×2） |
| ★ BONUS TARGET タップ | 通常加点 +200点（不正解セルには絶対に出現しません） |
| 不正解タップ | −50点・残り時間 −1秒・コンボリセット・FEVERゲージ−10 |
| 10・20・30…コンボ到達 | COMBO BONUS +300（通常点とは別） |

**コンボ倍率**：0〜4 ×1.0 / 5〜9 ×1.2 / 10〜14 ×1.5 / 15〜19 ×2.0 / 20〜 ×2.5

**レベル**（正解タップ数で上昇。LEVEL UP時に何が追加されたか表示）

| LEVEL | 正解数 | 主な条件 | 数字の範囲 |
| --- | --- | --- | --- |
| 1 | 0〜9 | 〇より大きい / 小さい | 1〜20 |
| 2 | 10〜19 | 偶数 / 奇数（EVEN / ODD） | 1〜20 |
| 3 | 20〜34 | 3・4・5の倍数（MULTIPLES） | 1〜30 |
| 4 | 35〜 | 奇数かつ〇以上 など（COMBINATION） | 1〜30 |

レベル2以降は下のレベルの条件も一定確率で混ざります。初回プレイの最初の1問は、
必ずLEVEL1の単純条件（〇より大きい/小さい）から始まります。

## FEVER

正解のたびにFEVERゲージが上昇し（+4、5コンボ到達+5、10コンボ到達+10、SPECIAL成功+20、
不正解−10）、100に到達すると5秒間のFEVERが自動発動します。FEVER中は正解スコアが
コンボ倍率に加えてさらに×2になり、背景・数字パネルの演出とFEVER専用音が入ります。
5秒経過で自動終了し、ゲージは0に戻ります。

## SPECIAL CHALLENGE

8〜12問ごとにランダムで発生する特殊問題です（連続発生はしません）。

| 種類 | 内容 | 成功時 |
| --- | --- | --- |
| ONE TARGET | 9個の中から1つだけ（最大/最小など）を選ぶ | +500 |
| SPEED | 3秒以内に条件に合う数字を全部タップ（本体タイマーとは別管理） | +500 |
| MEMORY | 数字を1秒表示→「？」に変化。位置を記憶してタップ | +700 |
| REVERSE | 条件に**合わない**数字を全部タップ（画面上に明示） | +600 |

## BONUS TARGET / DAILY CHALLENGE / RANK / MISSION / 実績

- **BONUS TARGET**：通常問題中10〜15%の確率で正解の1つが★になり、追加で+200点
- **DAILY CHALLENGE**：ローカル日付をシードに、同じ日なら誰が遊んでも同じ問題順（30秒固定）。
  通常BESTとは別に日付ごとのBEST（`numberHuntDailyBest_YYYY-MM-DD`）を保持
- **RANK**：30秒通常モードのBESTスコアに応じて BRONZE〜MASTER を表示。過去BESTのランクを
  超えると RANK UP！ 演出
- **MISSION**：「10 COMBO」「NO MISS」「LEVEL 4」の3種。日付が変わるとリセット
- **実績**：FIRST HUNT / COMBO 20 / NO MISS / MASTER の4種をlocalStorageへ永続保存

## ファイル構成

```
index.html   画面構造（タイトル / ゲーム / カウントダウン / SPECIAL演出 / 結果）
style.css    スマホ縦画面向けスタイル（DIGITAL HUNT/RADAR系の背景演出含む）
script.js    ゲームロジック（CONFIG で設定を一元管理）
README.md    このファイル
```

## 一般ブラウザで遊ぶ

### 公開URL

```
https://libera-content.github.io/number-hunt/
```

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
git init && git add . && git commit -m "NUMBER HUNT v3.0"
git branch -M main
git remote add origin https://github.com/libera-content/number-hunt.git
git push -u origin main
```

### 更新方法

1. 変更したファイルを同じ手順で再アップロード（同名ファイルは上書き）→ Commit
2. CSS / JS を変えたときは、`index.html` の `?v=3.0` と `script.js` の `CONFIG.VERSION` を同じ値に上げる（例：`3.1`）
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
- 最終手段：ブラウザ設定から `github.io` のサイトデータを削除（**BEST・実績・ミッションも消えます**）

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
| `numberHuntDailyBest_YYYY-MM-DD` | DAILY CHALLENGEのその日のBEST（通常BESTとは分離） |
| `numberHuntTutorialSeen` | 初回チュートリアル表示済みフラグ |
| `numberHuntAchievements` | 解除済み実績のIDリスト（JSON配列） |
| `numberHuntMissionState` / `numberHuntMissionDate` | 当日のミッション達成状況（日付が変わるとリセット） |

localStorage が使えない環境でも、ゲームは保存なしで動作します（メモリ上のフォールバックで継続）。

## 検証用セッションデータ

ページを開いている間だけ保持します（画面表示なし、リロードでリセット）。ブラウザのコンソールで確認できます。

```js
NumberHunt.getSessionStats()
// totalPlays / retries / titleStarts / completedPlays / retryRate
// averageScore / averageAccuracy / overallAccuracy / averageMaxCombo / averageMaxLevel
// feverCount / specialAttempts / specialSuccesses / specialSuccessRate / dailyPlays / rankDistribution
// 累積値（totalScore など）/ byMode['30'], byMode['60']（モード別の同じ項目）/ version
NumberHunt.getPlayHistory()     // 直近10プレイ: mode, score, correct, miss, accuracy, maxCombo, maxLevel, rank, dailyMode ほか（DAILYはplayHistoryに含めません）
NumberHunt.getAchievements()    // 解除済み実績IDの配列
```

- 平均値は **セッション全体の累積**（playHistory の直近10件ではない）。分母は結果画面まで到達したプレイ数（completedPlays）
- `retryRate = retries / totalPlays`（totalPlays が0なら0）
- `averageAccuracy` は各プレイの正答率の平均、`overallAccuracy` は全タップ合算の正答率
- `specialSuccessRate = specialSuccesses / specialAttempts`

## 設計メモ（拡張しやすくするための構造）

- **結果画面の RECENT SCORE**：同じモードの直近5プレイを棒グラフ表示（30秒と60秒はスコア水準が違うため混ぜない。DAILYは含めない）
- **CONFIG**：制限時間・得点・コンボボーナス・カウントダウン秒数・FEVER関連値・SPECIAL間隔と得点・
  BONUS TARGET確率、RANK閾値、DAILY設定などを一元集約
- **効果音**：Web Audio API で生成（音声ファイルなし）。AudioContext は1つだけ、START等のタップ時に初期化。未対応環境では無音で動作
- **CONDITIONS**：レベルごとに「条件を作る関数」の配列。SPECIAL問題もこの条件生成器を再利用（REVERSEは反転、SPEEDはそのまま、MEMORYは正解数を絞って再利用）
- **問題生成**：先に正解数（2〜5個）を決め、正解候補と不正解候補から抽選するため、正解ゼロ・全部正解の問題は発生しません
- **決定的乱数（DAILY用）**：`mulberry32` + 日付文字列のハッシュシードで、同じ日は常に同じ問題順を再現。通常プレイは `Math.random` のまま
- **タイマー**：終了時刻（`performance.now()` 基準）を保持する方式。ミス時は終了時刻を1秒前倒し。SPEEDの3秒は別途 `specialEndTime` で独立管理
- タイマーIDは一元管理し、リトライ時にすべて解除

## Ver.2.1 → Ver.3.0 での主な変更点

- 追加：FEVER / SPECIAL CHALLENGE（4種）/ BONUS TARGET / DAILY CHALLENGE / RANK / MISSION / 実績
- 追加：スコアポップ、コンボ節目演出、LEVEL UP詳細表示、背景演出（グリッド・レーダー・粒子）、
  問題切替時のスキャン演出、SPECIAL専用の視覚テーマ、初回チュートリアル
- 維持：CONFIG構造・問題生成ロジック・タイマー方式・localStorageキー体系・Web Audio・
  sessionStats/playHistory・UI構造・Safari/dvh/safe-area対応・GitHub Pages対応

## 今回実装しないもの（Ver.3のスコープ外）

Firebase / GA4 / ログイン / オンラインランキング / 課金 / 広告 / SNSシェア / PWA化 /
サーバー・データベース / 10秒モード / スキン購入 / コイン

## 今後追加できる機能

- 難易度選択、掛け算モード・計算問題モード（「3×4 になる数字」など）
- BGM、SPECIALの種類追加
- オンラインランキング・PWA化・SNSシェア（サーバー構成が前提になるため今回は見送り）