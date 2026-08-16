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

1. **`public/index.html` をダブルクリックしてブラウザで開く**（Chrome / Edge / Safari など）。インストールや専用サーバーは不要です。
2. 表示された画面に、SVSログの `.xlsx` ファイルをドラッグ＆ドロップ（またはクリックして選択）します。あらかじめ用意されたファイルがあれば、その下に一覧が自動で表示され、クリックするだけで開けます（後述）。
3. 4つのタブでデータを確認できます。
   - **概況**: 全体のKPIと、Capitol（首都拠点）を巡る攻防の時間帯別アクティビティ
   - **連盟ランキング**: 連盟ごとの総合貢献度スコア（算出方法は画面に常時表示されています）と詳細データ表
   - **戦場マップ**: プレイヤーがテレポートで入城した座標を陣営・連盟ごとに色分け表示
   - **メンバー参加度（リーダー向け）**: 連盟を選んでメンバー個人の活動を一覧表示。連盟選択で「全員」を選ぶと、表示中の全連盟のメンバーを横断してソートできます（サーバー全体のPvP・瓦礫解体ランキングとしても使えます）。CSVエクスポートも可能です。
4. 画面上部の **陣営フィルター** と **フォーカス連盟** で表示を絞り込めます。
5. 画面右上の **日本語 / English / 中文** ボタンで表示言語を切り替えられます（次回開いたときも記憶されます）。
6. 🌓ボタンでダーク/ライト表示を切り替えられます。
7. 別のファイルを見たい場合は「別のファイルを読み込む」ボタンから再アップロードしてください。
8. 各テーブルは列見出しをクリックして並び替えできます。ソート中の列は自動的に左寄せに移動します。

### 対応しているExcelの形式

以下のシート（フィルター済みの集計ログ）を含む `.xlsx` ファイルを想定しています。シート名は多少違っていても（例: "movements" と "Movement"）自動認識します。

- `movements`（移動ログ）
- `structures`（施設防衛・攻撃ログ）
- `base_hits`（基地攻撃ログ。`target_x`/`target_y` 列（攻撃対象の座標）があると攻撃スコアの距離重み付けが有効になります）
- `rubbles`（瓦礫解体ログ）
- `teleports`（連盟別テレポート人数の集計）
- `marches`（連盟別マーチ数の集計。シート名に「marches」を含んでいれば自動認識）

### 連盟スコア・個人スコアの算出方法

連盟スコア・個人の総合活動スコアはどちらも同じ考え方です。

```
総合スコア = 拠点アクション数 + 攻撃スコア + 瓦礫解体数
```

- **拠点アクション数**: capitol・canon×4への駐屯/増援/攻撃の合計回数。施設の種別は問わず均等に扱います。
- **攻撃スコア**: 基地攻撃1件ごとに「攻撃対象がcapitolに近いほど高い」重みをつけて合計したもの（勝敗は問いません）。distance = 対象座標とcapitol座標の直線距離、weight = max(0, 1 − distance ÷ ファイル内の最大距離)。遠くの無防備な基地ばかり狙って数字を稼ぐケースを補正します。
- **瓦礫解体数**: 完了した解体件数（現状のログ形式には座標データがないため、距離は考慮していません）。

上記3項目はそれぞれ「ファイル内の上位3者（連盟／プレイヤー）の平均を100点」として換算してから合計します（1位が突出している場合は100点を超えることもあります）。参加人数はスコアの項目には含めていません — 連盟スコアはメンバー全員分の値をそのまま合計したものなので、参加人数が多い連盟ほど自然に高くなります。

計算式は画面上の該当タブに常に明記されています。

**役割で比較する場合の注意**: このツールは「誰が拠点防衛・基地攻撃・瓦礫解体のどれを担当していたか」までは把握できません。総合スコアは役割を問わず幅広く活動した人ほど高くなるため、担当が決まっているメンバー同士を比べる場合は、総合スコアではなく担当分野に対応する列（例：攻撃担当なら「攻撃スコア」列）でソートして比較してください。

### 配置済みのExcelから選ぶ機能

アップロード画面の「または」の下に、あらかじめ用意されたExcelファイルの一覧がボタンで表示されることがあります。表示されている場合はクリックするだけで、手動アップロードなしにそのデータを開けます（表示されていない場合は、通常のドラッグ＆ドロップでアップロードしてください）。

### 注意点

- ログの収集ツール側の都合で、まれにプレイヤー名（例: 「6/3」のような数字と記号だけの名前）がExcel上で日付として自動変換されてしまうことがあります。その場合は `(日付化した名前:2026/6/3)` のように表示されます。元の名前はファイルから復元できないため、心当たりのあるメンバーがいれば教えてあげてください。
- データは1日単位のSVSイベントを想定しています。タイムスタンプが日付をまたぐ場合、時刻のみで集計されることがあります。
- ローカルで使う場合は、`index.html` と同じフォルダ構成（`styles.css` / `app.js` / `vendor/` を含む）を保ったまま配布してください。

---
---

## English

### What is this?

Upload an in-game SVS (State vs State) war log (Excel file) and this tool visualizes each alliance's contribution/participation and individual members' activity as charts and tables. Everything runs entirely inside your browser — the uploaded file is never sent anywhere, and no internet connection is required to use it.

### How to use

1. **Double-click `public/index.html`** to open it in your browser (Chrome, Edge, Safari, etc.). No installation or server needed.
2. Drag and drop your SVS log `.xlsx` file onto the page (or click to choose a file). If any prepared files are available, they're listed automatically below the drop zone — click one to load it (see below).
3. Explore the data across 4 tabs:
   - **Overview**: headline KPIs and capitol contest activity over time
   - **Alliance ranking**: each alliance's contribution score (the formula is always shown on screen) plus a sortable detail table
   - **Battlefield map**: teleport-in coordinates plotted and colored by side/alliance
   - **Member participation (for leaders)**: pick an alliance to see a sortable table of every member's activity. Choose "Everyone" in the alliance dropdown to sort across every alliance currently shown at once (doubles as a server-wide PvP / rubble leaderboard). CSV export is available.
4. Use the **side filter** and **focus alliance** controls at the top to narrow down what's shown.
5. Use the **日本語 / English / 中文** buttons at the top right to switch language (your choice is remembered for next time).
6. Use the 🌓 button to toggle dark/light mode.
7. Click "Load another file" to upload a different log.
8. Click any table's column header to sort by it — the sorted column moves to the left automatically so you don't have to scroll to check its values.

### Expected Excel format

The file should contain these sheets (sheet names are matched loosely, e.g. "movements" or "Movement" both work):

- `movements` — player movement log
- `structures` — structure defense/attack log
- `base_hits` — base attack log (a `target_x`/`target_y` column pair, the attack's target coordinates, enables the attack score's distance weighting)
- `rubbles` — rubble-clearing log
- `teleports` — per-alliance teleport-in headcount summary
- `marches` — per-alliance march-count summary (any sheet name containing "marches" is recognized)

### How the scores are calculated

Both the alliance score and the per-player total activity score work the same way:

```
Total score = structure actions + attack score + rubble clears
```

- **Structure actions**: total garrison/reinforce/attack actions on capitol and all 4 canons combined, weighted equally regardless of which structure.
- **Attack score**: the sum, over every landed base attack (win or lose), of a weight that's higher the closer the target was to the capitol. distance = straight-line distance between the target's coordinates and the capitol's; weight = max(0, 1 − distance ÷ the farthest recorded target distance in the file). This corrects for padding your numbers by hitting undefended bases far from the front line.
- **Rubble clears**: completed clears (not distance-weighted — this log format has no coordinates for where a clear happened).

Each of the 3 is scaled so 100 = the average of the top 3 (alliances or players) in the file on that one axis, then summed (can exceed 100 on an axis if #1 is well clear of #2/#3). Participant count is not a scored component — an alliance's score is just the sum of its own members, so an alliance with more active members scores higher automatically.

The formula is always spelled out in the relevant tab of the app itself.

**A caution when comparing by role**: this tool has no way to know who was assigned to structure defense vs. base attacks vs. rubble clearing. The total score rewards broad activity across all 3 axes regardless of role, so when comparing members with a specific assignment, sort by that axis's own column (e.g. "attack score" for someone assigned to attack) instead of the total score.

### "Choose from prepared Excel files" option

Below the "or" divider on the upload screen, you may see a list of buttons for pre-loaded Excel files. If it's there, just click one to open that data without uploading anything manually. (If nothing shows up, regular drag-and-drop upload always works.)

### Notes

- Due to a quirk in how the source log was collected, a player name that looks like a date fragment (e.g. "6/3") can get silently auto-converted into an actual date by Excel. When that happens, the name shows as `(date-mangled name: 2026/6/3)`. The original text can't be recovered from the file — if you recognize who this might be, let them know.
- The tool assumes a single-day SVS event. If timestamps cross midnight, they may be aggregated by time-of-day only.
- For local use, keep `index.html` together with its `styles.css`, `app.js`, and `vendor/` folder — don't move it out on its own.

---
---

## 中文

### 这是什么？

上传游戏内SVS（跨服战）的战争日志（Excel文件），此工具会将各联盟的贡献度/参与度排名以及成员个人的活动情况以图表和表格形式可视化。所有处理均在浏览器内完成，上传的文件不会发送到任何地方，甚至无需联网即可使用。

### 使用方法

1. **双击 `public/index.html`**，用浏览器打开（Chrome、Edge、Safari 等均可）。无需安装，也无需服务器。
2. 将SVS日志的 `.xlsx` 文件拖放到页面上（或点击选择文件）。如果已内置预设数据，拖放区下方会出现「打开……」按钮，一键加载（见下文）。
3. 可通过4个标签页查看数据：
   - **概况**：整体关键指标，以及围绕Capitol（主城据点）的攻防活跃度随时间的变化
   - **联盟排名**：各联盟的综合贡献度评分（计算方法始终显示在页面上）以及可排序的详细数据表
   - **战场地图**：按阵营/联盟着色显示玩家传送进入战场的坐标
   - **成员参与度（领导视角）**：选择一个联盟，查看每位成员活动情况的可排序表格。联盟下拉框选择「全部」可以跨所有当前显示的联盟一起排序（也可当作服务器整体的PvP/瓦砾清除排行榜使用）。支持导出CSV。
4. 使用页面上方的**阵营筛选**和**关注联盟**可以缩小显示范围。
5. 使用右上角的 **日本語 / English / 中文** 按钮切换显示语言（下次打开时会记住您的选择）。
6. 使用🌓按钮切换深色/浅色主题。
7. 如需查看其他文件，点击"加载其他文件"重新上传即可。
8. 点击任意表格的列标题即可按该列排序，排序中的列会自动移到左侧，无需来回滚动查看数值。

### 支持的Excel格式

文件应包含以下工作表（表名匹配比较宽松，例如"movements"或"Movement"均可识别）：

- `movements`（移动日志）
- `structures`（据点防守/攻击日志）
- `base_hits`（基地攻击日志。若包含`target_x`/`target_y`列（攻击目标坐标），攻击评分的距离加权将自动生效）
- `rubbles`（瓦砾清除日志）
- `teleports`（各联盟传送人数汇总）
- `marches`（各联盟行军次数汇总，表名中包含"marches"即可识别）

### 评分计算方法

联盟评分与个人综合活动评分采用相同的计算方式：

```
综合评分 = 据点行动数 + 攻击评分 + 瓦砾清除数
```

- **据点行动数**：对capitol与canon×4的驻守/增援/攻击总次数，不分据点种类，一律均等计算。
- **攻击评分**：对每一次命中的基地攻击（不论输赢），按「目标离capitol越近权重越高」计算后求和。distance = 目标坐标与capitol坐标的直线距离；weight = max(0, 1 − distance ÷ 本文件中记录的最大距离)。用于修正只攻击远离前线的无防守基地来刷数据的情况。
- **瓦砾清除数**：完成的清除次数（不考虑距离——此日志格式没有记录清除发生的坐标）。

以上3项分别以「本文件中前3名（联盟或玩家）的平均值」定为100分进行换算，再相加（若第1名明显领先第2、3名，该项可能超过100分）。参与人数本身不是评分项目——联盟评分只是把其成员各自的数值直接相加，因此参与人数越多的联盟评分自然越高。

计算公式始终会显示在应用对应的标签页中。

**按职责比较时的注意事项**：本工具无法得知谁被分配负责据点防守、基地攻击还是瓦砾清除。综合评分对不分职责、广泛参与各类活动的人更有利，因此在比较被分配了特定职责的成员时，请按其对应职责的那一列排序（例如负责攻击的成员请按"攻击评分"列排序），而不是用综合评分。

### "从已放置的Excel中选择"功能

上传界面的"或"分隔线下方，有时会显示预先准备好的Excel文件按钮列表。如果显示了，点击即可直接打开对应数据，无需手动上传。（如果没有显示，正常的拖放上传方式始终可用。）

### 注意事项

- 由于日志采集工具的原因，极少数情况下，形似日期的玩家名字（例如"6/3"）可能会被Excel自动识别并转换为真实日期。此时会显示为 `（被识别为日期的名字：2026/6/3）`。原始名字无法从文件中恢复，如果您认得这可能是哪位成员，请提醒对方。
- 本工具假定数据为单日SVS活动。如时间戳跨越午夜，可能仅按时间（不含日期）进行汇总。
- 本地使用时，请将 `index.html` 与其 `styles.css`、`app.js`、`vendor/` 文件夹保持在一起，不要单独移动。
