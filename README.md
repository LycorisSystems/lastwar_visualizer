# SVS War Report Visualizer

このファイルは日本語 / English / 中文 の3言語で書かれています。該当する言語のセクションまでスクロールしてください。
This file is written in Japanese / English / Chinese. Scroll to your language's section.
本文件包含日语 / 英语 / 中文三种语言，请滚动到对应语言的部分。

---
---

## 日本語

### これは何？

ゲーム内のSVS（State vs State）戦争ログ（Excel形式）をアップロードすると、連盟ごとの貢献度・参加率や、メンバー個人の活動状況をグラフとテーブルで可視化するツールです。すべての処理はブラウザ内で完結し、アップロードしたファイルはどこにも送信されません（インターネット接続すら不要です）。

### 使い方

1. **`index.html` をダブルクリックしてブラウザで開く**（Chrome / Edge / Safari など）。インストールや専用サーバーは不要です。
2. 表示された画面に、SVSログの `.xlsx` ファイルをドラッグ＆ドロップ（またはクリックして選択）します。
3. 4つのタブでデータを確認できます。
   - **概況**: 全体のKPIと、Capitol（首都拠点）を巡る攻防の時間帯別アクティビティ
   - **連盟ランキング**: 連盟ごとの総合貢献度スコア（算出方法は画面に常時表示されています）と詳細データ表
   - **戦場マップ**: プレイヤーがテレポートで入城した座標を陣営・連盟ごとに色分け表示
   - **メンバー参加度（リーダー向け）**: 連盟を選んでメンバー個人の活動を一覧表示。上位10%は「MVP候補」、活動記録0件は「要フォロー」として自動で色分けされます。CSVエクスポートも可能です。
4. 画面右上の **陣営フィルター** と **フォーカス連盟** で表示を絞り込めます。
5. 画面右上の **日本語 / English / 中文** ボタンで表示言語を切り替えられます（次回開いたときも記憶されます）。
6. 🌓ボタンでダーク/ライト表示を切り替えられます。
7. 別のファイルを見たい場合は「別のファイルを読み込む」ボタンから再アップロードしてください。

### 対応しているExcelの形式

以下のシート（フィルター済みの集計ログ）を含む `.xlsx` ファイルを想定しています。シート名は多少違っていても（例: "movements" と "Movement"）自動認識します。

- `movements`（移動ログ）
- `structures`（施設防衛・攻撃ログ）
- `base_hits`（基地攻撃ログ）
- `rubbles`（瓦礫解体ログ）
- `teleports`（連盟別テレポート人数の集計）
- `marches`（連盟別マーチ数の集計。シート名に「marches」を含んでいれば自動認識）

### 連盟スコア・個人スコアの算出方法

- **連盟スコア** ＝ 拠点アクション数40% ＋ 基地攻撃数25% ＋ 瓦礫解体数20% ＋ 参加人数15%（各項目は表示中の連盟内の最大値を100%として正規化）。拠点アクションは capitol と canon×4 を種別を問わず均等に合算しており、特定の施設だけを優遇していません。テレポート回数は参加のアクティブさの指標であり、戦闘への貢献とは別軸のためスコアには含めていません。
- **個人の総合活動スコア** ＝ 拠点アクション（防衛/増援＋攻撃、全施設合計） ＋ 基地攻撃数 ＋ 瓦礫解体数×2。こちらもテレポート回数・移動回数はスコアに含めず、参考情報として表示するのみです。

いずれの計算式も、画面上の該当タブに常に日本語で明記されています。

### 注意点

- ログの収集ツール側の都合で、まれにプレイヤー名（例: 「6/3」のような数字と記号だけの名前）がExcel上で日付として自動変換されてしまうことがあります。その場合は `(日付化した名前:2026/6/3)` のように表示されます。元の名前はファイルから復元できないため、心当たりのあるメンバーがいれば教えてあげてください。
- データは1日単位のSVSイベントを想定しています。タイムスタンプが日付をまたぐ場合、時刻のみで集計されることがあります。
- `index.html` / `styles.css` / `app.js` / `vendor/xlsx.full.min.js` の4点はセットで動作します。フォルダ構成を保ったまま配布してください（`vendor` フォルダの中身も必要です）。

---
---

## English

### What is this?

Upload an in-game SVS (State vs State) war log (Excel file) and this tool visualizes each alliance's contribution/participation and individual members' activity as charts and tables. Everything runs entirely inside your browser — the uploaded file is never sent anywhere, and no internet connection is required to use it.

### How to use

1. **Double-click `index.html`** to open it in your browser (Chrome, Edge, Safari, etc.). No installation or server needed.
2. Drag and drop your SVS log `.xlsx` file onto the page (or click to choose a file).
3. Explore the data across 4 tabs:
   - **Overview**: headline KPIs and capitol contest activity over time
   - **Alliance ranking**: each alliance's contribution score (the formula is always shown on screen) plus a sortable detail table
   - **Battlefield map**: teleport-in coordinates plotted and colored by side/alliance
   - **Member participation (for leaders)**: pick an alliance to see a sortable table of every member's activity. The top 10% are auto-flagged as "MVP candidates" and anyone with zero recorded activity is flagged as "needs follow-up." CSV export is available.
4. Use the **side filter** and **focus alliance** controls at the top to narrow down what's shown.
5. Use the **日本語 / English / 中文** buttons at the top right to switch language (your choice is remembered for next time).
6. Use the 🌓 button to toggle dark/light mode.
7. Click "Load another file" to upload a different log.

### Expected Excel format

The file should contain these sheets (sheet names are matched loosely, e.g. "movements" or "Movement" both work):

- `movements` — player movement log
- `structures` — structure defense/attack log
- `base_hits` — base attack log
- `rubbles` — rubble-clearing log
- `teleports` — per-alliance teleport-in headcount summary
- `marches` — per-alliance march-count summary (any sheet name containing "marches" is recognized)

### How the scores are calculated

- **Alliance score** = structure actions 40% + base attacks 25% + rubble clears 20% + participants 15% (each component normalized to the highest value among the alliances currently shown). Structure actions combine capitol and all 4 canons equally — no structure gets special treatment. Teleport-in count reflects activity/presence rather than combat contribution, so it's excluded from the score.
- **Per-player total activity score** = structure actions (defense/reinforce + attack, all structures combined) + base attacks + rubble clears×2. Teleport-in and relocate counts are excluded from the score and shown only for reference.

Both formulas are always spelled out in the relevant tab of the app itself.

### Notes

- Due to a quirk in how the source log was collected, a player name that looks like a date fragment (e.g. "6/3") can get silently auto-converted into an actual date by Excel. When that happens, the name shows as `(date-mangled name: 2026/6/3)`. The original text can't be recovered from the file — if you recognize who this might be, let them know.
- The tool assumes a single-day SVS event. If timestamps cross midnight, they may be aggregated by time-of-day only.
- `index.html`, `styles.css`, `app.js`, and `vendor/xlsx.full.min.js` must stay together in the same folder structure — please distribute the whole folder, including the `vendor` subfolder.

---
---

## 中文

### 这是什么？

上传游戏内SVS（跨服战）的战争日志（Excel文件），此工具会将各联盟的贡献度/参与度排名以及成员个人的活动情况以图表和表格形式可视化。所有处理均在浏览器内完成，上传的文件不会发送到任何地方，甚至无需联网即可使用。

### 使用方法

1. **双击 `index.html`**，用浏览器打开（Chrome、Edge、Safari 等均可）。无需安装，也无需服务器。
2. 将SVS日志的 `.xlsx` 文件拖放到页面上（或点击选择文件）。
3. 可通过4个标签页查看数据：
   - **概况**：整体关键指标，以及围绕Capitol（主城据点）的攻防活跃度随时间的变化
   - **联盟排名**：各联盟的综合贡献度评分（计算方法始终显示在页面上）以及可排序的详细数据表
   - **战场地图**：按阵营/联盟着色显示玩家传送进入战场的坐标
   - **成员参与度（领导视角）**：选择一个联盟，查看每位成员活动情况的可排序表格。综合活动评分前10%会自动标记为"MVP候选"，活动记录为0的会标记为"需要关注"。支持导出CSV。
4. 使用页面上方的**阵营筛选**和**关注联盟**可以缩小显示范围。
5. 使用右上角的 **日本語 / English / 中文** 按钮切换显示语言（下次打开时会记住您的选择）。
6. 使用🌓按钮切换深色/浅色主题。
7. 如需查看其他文件，点击"加载其他文件"重新上传即可。

### 支持的Excel格式

文件应包含以下工作表（表名匹配比较宽松，例如"movements"或"Movement"均可识别）：

- `movements`（移动日志）
- `structures`（据点防守/攻击日志）
- `base_hits`（基地攻击日志）
- `rubbles`（瓦砾清除日志）
- `teleports`（各联盟传送人数汇总）
- `marches`（各联盟行军次数汇总，表名中包含"marches"即可识别）

### 评分计算方法

- **联盟评分** = 据点行动数40% + 基地攻击数25% + 瓦砾清除数20% + 参与人数15%（各项以当前显示联盟中的最大值为100%进行归一化）。据点行动将capitol与canon×4不分种类均等合计，不会特别优待某个据点。传送次数体现的是活跃度而非战斗贡献，因此不计入评分。
- **个人综合活动评分** = 据点行动（防守/增援+攻击，全部据点合计） + 基地攻击数 + 瓦砾清除数×2。同样，传送次数与移动次数不计入评分，仅作为参考显示。

以上两个计算公式均会在应用对应的标签页中始终以文字说明显示。

### 注意事项

- 由于日志采集工具的原因，极少数情况下，形似日期的玩家名字（例如"6/3"）可能会被Excel自动识别并转换为真实日期。此时会显示为 `（被识别为日期的名字：2026/6/3）`。原始名字无法从文件中恢复，如果您认得这可能是哪位成员，请提醒对方。
- 本工具假定数据为单日SVS活动。如时间戳跨越午夜，可能仅按时间（不含日期）进行汇总。
- `index.html`、`styles.css`、`app.js`、`vendor/xlsx.full.min.js` 这四者需要保持在同一文件夹结构下才能正常工作，请连同 `vendor` 子文件夹一起分发整个文件夹。
