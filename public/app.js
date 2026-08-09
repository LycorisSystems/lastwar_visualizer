"use strict";
/* SVS War Report Visualizer — all client-side, no network calls. */

/* ---------- small DOM helpers ---------- */
const $ = (sel, root) => (root || document).querySelector(sel);
const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
function el(tag, attrs, children) {
  const node = document.createElement(tag);
  if (attrs) for (const k in attrs) {
    if (k === "class") node.className = attrs[k];
    else if (k === "html") node.innerHTML = attrs[k];
    else node.setAttribute(k, attrs[k]);
  }
  (children || []).forEach(c => {
    if (c == null) return;
    node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
  });
  return node;
}
function svgEl(tag, attrs) {
  const node = document.createElementNS("http://www.w3.org/2000/svg", tag);
  if (attrs) for (const k in attrs) node.setAttribute(k, attrs[k]);
  return node;
}
const NUMBER_LOCALES = { ja: "ja-JP", en: "en-US", zh: "zh-CN" };
const fmt = { format: (v) => new Intl.NumberFormat(NUMBER_LOCALES[currentLang] || "ja-JP").format(v) };
const fmtPct = (v) => (isFinite(v) ? (v * 100).toFixed(1) + "%" : "—");
function pad2(n) { return String(n).padStart(2, "0"); }

/* ================= I18N ================= */

const I18N = {
  ja: {
    "app.title": "SVS 戦争レポート ビジュアライザー",
    "header.subtitleDefault": "Excelをアップロードして開始",
    "header.subtitleLoaded": "{file} ・ 連盟数 {allianceCount} ・ 参加者数 {participants}",
    "header.reload": "別のファイルを読み込む",
    "header.themeToggle": "表示テーマを切り替え",
    "upload.dropzoneAria": "Excelファイルを選択してアップロード",
    "upload.title": "戦争データ (.xlsx) をアップロード",
    "upload.dragHint": "ここにファイルをドラッグ＆ドロップ、またはクリックして選択してください。",
    "upload.formatHint": "movements / structures / base_hits / rubbles / teleports / marches シートを含む集計済みSVSログを想定しています。",
    "upload.notesTitle": "このツールについて",
    "upload.note1": "すべての処理はブラウザ内で完結します。ファイルはどこにも送信されません。",
    "upload.note2": "連盟ごとの貢献度・参加率のランキングと、連盟内メンバーの活動状況を可視化します。",
    "upload.note3": "データは1日単位のSVSイベントを想定しています（タイムスタンプが日付を跨ぐ場合、時刻のみで集計されることがあります）。",
    "upload.invalidFile": "xlsx形式のファイルを選択してください。",
    "upload.readError": "ファイルの読み込みに失敗しました。",
    "upload.parseError": "Excelの解析に失敗しました: {msg}",
    "upload.presetDividerText": "または",
    "upload.pickFolderHint": "リポジトリの \"files\" フォルダに置かれているExcelファイルです。",
    "filters.side": "陣営",
    "filters.sideAll": "すべて",
    "filters.sideAria": "陣営フィルター",
    "filters.focusAlliance": "フォーカス連盟",
    "filters.focusNone": "（選択なし）",
    "filters.summary": "{shown} / {total} 連盟を表示中",
    "tabs.overview": "概況",
    "tabs.ranking": "連盟ランキング",
    "tabs.map": "戦場マップ",
    "tabs.members": "メンバー参加度（リーダー向け）",
    "unknown": "不明",
    "unknownPlayer": "(不明)",
    "mangledName": "(日付化した名前:{y}/{m}/{d})",
    "component.structureActions": "拠点アクション数（capitol・canon×4 合計、種別を問わず均等）",
    "component.attackScore": "攻撃スコア",
    "component.rubbleClears": "瓦礫解体数",
    "kpi.visibleAlliances": "表示中の連盟数",
    "kpi.visibleAlliancesSub": "全 {total} 連盟中",
    "kpi.participants": "参加人数",
    "kpi.participantsSub": "movements/structures/base_hits/rubblesで検出",
    "kpi.structureActions": "拠点アクション数",
    "kpi.structureActionsSub": "うち capitol: {n}",
    "kpi.baseAttacks": "基地攻撃数",
    "kpi.baseAttacksSub": "突破成功率 {pct}",
    "kpi.rubbleClears": "瓦礫解体数",
    "kpi.rubbleClearsSub": "completed_clears 合計",
    "overview.capitolChartTitle": "Capitol 攻防アクティビティ（時間帯別）",
    "overview.capitolChartSub": "15分ごとの garrison_hold / reinforce_in / rally_in 件数（capitol構造物のみ）",
    "overview.noCapitolData": "capitolの時系列データが見つかりませんでした。",
    "overview.showTable": "表で見る",
    "overview.timeColumn": "時刻",
    "ranking.title": "連盟 総合貢献度スコア",
    "ranking.sub": "表示中の連盟をスコア降順に表示。バーの色は陣営（下の凡例）を表します。",
    "ranking.formulaPrefix": "総合スコア = ",
    "ranking.formulaSuffix": "（3項目それぞれを「このファイル内の上位3連盟の平均を100点」として換算し、その3つのスコアを合計します（合計はおおむね300点前後が上限）。1位を単純な基準にすると突出した連盟1つで他全員の点数が圧縮されてしまうため、上位3連盟の平均を基準にしています。1位が2位・3位を大きく引き離している場合は100点を超えることもあります。参加人数が多い連盟ほど各項目の合計が自然に大きくなり、点数も上がりやすくなります。参加人数そのものはスコアの項目には含めていません）。",
    "ranking.formulaNote2": "拠点アクションは capitol と canon×4 を種別を問わず均等に合算しています（capitolだけを特別扱いしていません）。瓦礫解体は座標データがないため距離は考慮していません（単純な解体数です）。テレポート回数は参加のアクティブさを示す指標であり、戦闘への貢献とは別軸のためスコアには含めていません。",
    "ranking.noAlliances": "表示できる連盟がありません。",
    "ranking.detailTitle": "連盟別 詳細データ",
    "ranking.detailSub": "列見出しをクリックすると並び替えできます。「拠点アクション」は capitol・canon×4 の合計（内訳は上のグラフのツールチップ参照）。",
    "tt.totalScore": "総合スコア",
    "tt.structureActionsTotal": "拠点アクション合計",
    "tt.breakdown": "　内訳: {structure}",
    "tt.baseAttacks": "基地攻撃",
    "tt.baseAttacksWinRate": "基地攻撃",
    "tt.rubbleClears": "瓦礫解体",
    "tt.participants": "参加人数",
    "tt.refTeleports": "（参考）テレポート回数",
    "tt.alliance": "連盟",
    "tt.side": "陣営",
    "tt.time": "時刻",
    "tt.sideAction": "{side} のアクション",
    "col.alliance": "連盟",
    "col.side": "陣営",
    "col.participantCount": "参加人数",
    "col.structureActions": "拠点アクション(全施設)",
    "col.attacksLanded": "基地攻撃",
    "col.attackWinRate": "突破成功率",
    "col.attacksTaken": "被攻撃数",
    "col.defenseHoldRate": "防衛成功率",
    "col.rubbleClears": "瓦礫解体",
    "col.structureActionsPoints": "拠点アクション(点)",
    "col.attackScorePoints": "攻撃スコア(点)",
    "col.rubbleClearsPoints": "瓦礫解体(点)",
    "col.score": "総合スコア",
    "map.title": "戦場マップ（テレポート入城座標）",
    "map.sub": "◆ は capitol / canon の座標。最大3連盟まで強調表示できます（未選択時は陣営で色分け）。",
    "map.other": "その他",
    "map.noPoints": "表示できる座標データがありません。",
    "map.pointCount": "表示中のポイント数: {n}",
    "members.searchPlaceholder": "プレイヤー名で検索",
    "members.csvExport": "CSVエクスポート",
    "members.formula1": "総合活動スコア = 拠点アクション（防衛/増援+攻撃、capitol・canon×4合計、種別を問わず均等） + 攻撃スコア（基地攻撃を、勝敗を問わず対象がcapitolに近いほど高くなるよう重み付け） + 瓦礫解体数（座標データがないため距離は未考慮）。3項目それぞれを「このファイル内の上位3人の平均を100点」として換算してから合計します（1位が突出していると100点を超えることもあります）。",
    "members.formula2": "テレポート回数・移動回数は参加のアクティブさの記録として表には出しますが、戦闘への貢献とは別軸のためスコアには含めていません。総合活動スコアは役割を問わず幅広く活動した人ほど高くなるため、拠点防衛・基地攻撃・瓦礫解体など担当が決まっているメンバー同士を比べる場合は、総合スコアではなく担当分野に対応する列（例：攻撃担当なら「攻撃スコア」列）でソートして比較してください。",
    "members.noAlliances": "表示できる連盟がありません。",
    "members.allAlliances": "全員",
    "members.allAlliancesSub": "表示中の{n}連盟すべて",
    "members.memberCount": "メンバー数",
    "members.activeCount": "活動あり",
    "members.activeCountSub": "{pct} が何らかの活動を記録",
    "col.player": "プレイヤー",
    "col.structureActionsAll": "拠点アクション(全施設)",
    "col.attacksTakenLost": "うち突破された",
    "col.totalActivity": "総合活動スコア",
    "col.refTeleportIns": "（参考）テレポート回数",
    "struct.capitol": "capitol",
    "struct.canon_NE": "canon_NE",
    "struct.canon_NW": "canon_NW",
    "struct.canon_SE": "canon_SE",
    "struct.canon_SW": "canon_SW",
    "col.rubbleMarches": "行軍数",
    "col.attackScore": "攻撃スコア",
    "col.avgAttackDistance": "平均対象距離",
    "col.avgAttackScorePerHit": "1回あたり平均獲得ポイント",
    "attackScore.note": "攻撃スコアの計算式：① 距離 = 攻撃対象の座標とcapitolの座標との直線距離。② 重み = max(0, 1 − 距離 ÷ このファイルで記録された攻撃対象の中の最大距離)。③ 攻撃スコア = 基地攻撃1件ごとの重み（②）を合計したもの（勝敗を問わず、着弾した攻撃はすべて対象）。capitolのすぐそばを攻撃するほど1件あたり最大1.0点に近づき、記録上もっとも遠い場所を攻撃すると1件あたり0点に近づきます。総合活動スコア・基地攻撃数と見比べることで、戦域の外側の無防備な基地ばかり狙って数字を稼いでいないかを確認できます。",
    "attackScore.unavailable": "このファイルには攻撃対象の座標データが含まれていないため、攻撃スコアは計算できません（base_hitsシートにtarget_x/target_y列がある形式のログが必要です）。",
  },
  en: {
    "app.title": "SVS War Report Visualizer",
    "header.subtitleDefault": "Upload an Excel file to begin",
    "header.subtitleLoaded": "{file} · {allianceCount} alliances · {participants} participants",
    "header.reload": "Load another file",
    "header.themeToggle": "Toggle color theme",
    "upload.dropzoneAria": "Select an Excel file to upload",
    "upload.title": "Upload war data (.xlsx)",
    "upload.dragHint": "Drag and drop a file here, or click to choose one.",
    "upload.formatHint": "Expects an aggregated SVS log with movements / structures / base_hits / rubbles / teleports / marches sheets.",
    "upload.notesTitle": "About this tool",
    "upload.note1": "Everything runs entirely in your browser. The file is never uploaded anywhere.",
    "upload.note2": "Visualizes each alliance's contribution/participation ranking and member-level activity.",
    "upload.note3": "Assumes a single-day SVS event (if timestamps cross midnight, they may be aggregated by time-of-day only).",
    "upload.invalidFile": "Please choose a .xlsx file.",
    "upload.readError": "Failed to read the file.",
    "upload.parseError": "Failed to parse the Excel file: {msg}",
    "upload.presetDividerText": "or",
    "upload.pickFolderHint": "Excel files currently in the repo's \"files\" folder.",
    "filters.side": "Side",
    "filters.sideAll": "All",
    "filters.sideAria": "Side filter",
    "filters.focusAlliance": "Focus alliance",
    "filters.focusNone": "(none selected)",
    "filters.summary": "Showing {shown} / {total} alliances",
    "tabs.overview": "Overview",
    "tabs.ranking": "Alliance ranking",
    "tabs.map": "Battlefield map",
    "tabs.members": "Member participation (for leaders)",
    "unknown": "Unknown",
    "unknownPlayer": "(unknown)",
    "mangledName": "(date-mangled name: {y}/{m}/{d})",
    "component.structureActions": "Structure actions (capitol + 4 canons combined, weighted equally)",
    "component.attackScore": "Attack score",
    "component.rubbleClears": "Rubble clears",
    "kpi.visibleAlliances": "Alliances shown",
    "kpi.visibleAlliancesSub": "out of {total} total",
    "kpi.participants": "Participants",
    "kpi.participantsSub": "Detected across movements/structures/base_hits/rubbles",
    "kpi.structureActions": "Structure actions",
    "kpi.structureActionsSub": "of which capitol: {n}",
    "kpi.baseAttacks": "Base attacks",
    "kpi.baseAttacksSub": "Breach rate {pct}",
    "kpi.rubbleClears": "Rubble clears",
    "kpi.rubbleClearsSub": "Sum of completed_clears",
    "overview.capitolChartTitle": "Capitol contest activity (over time)",
    "overview.capitolChartSub": "garrison_hold / reinforce_in / rally_in counts per 15-minute bucket (capitol structure only)",
    "overview.noCapitolData": "No capitol time-series data found.",
    "overview.showTable": "View as table",
    "overview.timeColumn": "Time",
    "ranking.title": "Alliance contribution score",
    "ranking.sub": "Alliances shown, sorted by score descending. Bar color shows side (see legend below).",
    "ranking.formulaPrefix": "Total score = ",
    "ranking.formulaSuffix": " (each of the 3 is scaled so that 100 = the average of the top 3 alliances in this file on that one axis, then the three scores are added — roughly capped around 300. Using the top-3 average instead of a plain #1 keeps one outlier alliance from compressing everyone else toward 0; if #1 is well clear of #2/#3 it can score above 100. An alliance with more active members naturally scores higher on each axis, since every extra contributing member adds to the total. Participant count itself isn't a scored component).",
    "ranking.formulaNote2": "Structure actions combine capitol and all 4 canons equally, regardless of type (capitol gets no special bonus). Rubble clears aren't distance-weighted since the log has no coordinates for them (it's a plain clear count). Teleport-in count reflects presence/activity, not combat contribution, so it is excluded from the score.",
    "ranking.noAlliances": "No alliances to display.",
    "ranking.detailTitle": "Alliance detail table",
    "ranking.detailSub": "Click a column header to sort. \"Structure actions\" is the total across capitol and all 4 canons (see the chart tooltip above for the breakdown).",
    "tt.totalScore": "Total score",
    "tt.structureActionsTotal": "Structure actions (total)",
    "tt.breakdown": "　breakdown: {structure}",
    "tt.baseAttacks": "Base attacks",
    "tt.baseAttacksWinRate": "Base attacks",
    "tt.rubbleClears": "Rubble clears",
    "tt.participants": "Participants",
    "tt.refTeleports": "(reference) Teleport-ins",
    "tt.alliance": "Alliance",
    "tt.side": "Side",
    "tt.time": "Time",
    "tt.sideAction": "{side} actions",
    "col.alliance": "Alliance",
    "col.side": "Side",
    "col.participantCount": "Participants",
    "col.structureActions": "Structure actions (all)",
    "col.attacksLanded": "Base attacks",
    "col.attackWinRate": "Breach rate",
    "col.attacksTaken": "Attacks taken",
    "col.defenseHoldRate": "Hold rate",
    "col.rubbleClears": "Rubble clears",
    "col.structureActionsPoints": "Structure actions (pts)",
    "col.attackScorePoints": "Attack score (pts)",
    "col.rubbleClearsPoints": "Rubble clears (pts)",
    "col.score": "Total score",
    "map.title": "Battlefield map (teleport-in coordinates)",
    "map.sub": "◆ marks capitol / canon coordinates. Emphasize up to 3 alliances at once (colored by side when none selected).",
    "map.other": "Other",
    "map.noPoints": "No coordinate data to display.",
    "map.pointCount": "Points shown: {n}",
    "members.searchPlaceholder": "Search player name",
    "members.csvExport": "Export CSV",
    "members.formula1": "Total activity score = structure actions (defense/reinforce + attack, capitol + 4 canons combined, weighted equally) + attack score (base attacks, win or lose, weighted higher the closer the target was to capitol) + rubble clears (not distance-weighted — no coordinate data for it). Each of the 3 is scaled so 100 = the average of the top 3 players in this file on that axis, before being summed (can exceed 100 on an axis if #1 is well clear of #2/#3).",
    "members.formula2": "Teleport-in and relocate counts are shown for reference as activity records, but are excluded from the score since they're a separate axis from combat contribution. The total activity score rewards broad activity across all 3 axes regardless of role, so when comparing members who were assigned a specific job (structure defense, base attacks, rubble clearing, etc.), sort by that job's own column instead of the total score — e.g. sort by \"attack score\" for someone assigned to attack.",
    "members.noAlliances": "No alliances to display.",
    "members.allAlliances": "Everyone",
    "members.allAlliancesSub": "All {n} alliances shown",
    "members.memberCount": "Members",
    "members.activeCount": "Active",
    "members.activeCountSub": "{pct} have some recorded activity",
    "col.player": "Player",
    "col.structureActionsAll": "Structure actions (all)",
    "col.attacksTakenLost": "of which breached",
    "col.totalActivity": "Total activity score",
    "col.refTeleportIns": "(reference) Teleport-ins",
    "struct.capitol": "capitol",
    "struct.canon_NE": "canon (NE)",
    "struct.canon_NW": "canon (NW)",
    "struct.canon_SE": "canon (SE)",
    "struct.canon_SW": "canon (SW)",
    "col.rubbleMarches": "Marches",
    "col.attackScore": "Attack score",
    "col.avgAttackDistance": "Avg. target distance",
    "col.avgAttackScorePerHit": "Avg. points per attack",
    "attackScore.note": "How the attack score is calculated: ① distance = the straight-line distance between the attack target's coordinates and the capitol's coordinates. ② weight = max(0, 1 − distance ÷ the farthest recorded attack-target distance in this file). ③ attack score = the sum of the weight (②) for every landed base attack, win or lose. A hit right next to capitol is worth close to 1.0 point; a hit at the farthest recorded distance is worth close to 0. Compare it against total activity score / base attack count to spot players racking up numbers by hitting undefended bases far from the front line.",
    "attackScore.unavailable": "This file has no target coordinate data, so the attack score can't be calculated (requires a log with target_x/target_y columns on the base_hits sheet).",
  },
  zh: {
    "app.title": "SVS 战争报告可视化工具",
    "header.subtitleDefault": "上传Excel文件以开始",
    "header.subtitleLoaded": "{file}・联盟数 {allianceCount}・参与人数 {participants}",
    "header.reload": "加载其他文件",
    "header.themeToggle": "切换显示主题",
    "upload.dropzoneAria": "选择要上传的Excel文件",
    "upload.title": "上传战争数据 (.xlsx)",
    "upload.dragHint": "将文件拖放到此处，或点击选择文件。",
    "upload.formatHint": "需要包含 movements / structures / base_hits / rubbles / teleports / marches 工作表的汇总SVS日志。",
    "upload.notesTitle": "关于此工具",
    "upload.note1": "所有处理均在浏览器内完成，文件不会上传到任何地方。",
    "upload.note2": "可视化各联盟的贡献度/参与度排名，以及联盟内成员的活动情况。",
    "upload.note3": "数据假定为单日SVS活动（如时间戳跨越午夜，可能仅按时间进行汇总）。",
    "upload.invalidFile": "请选择 .xlsx 格式的文件。",
    "upload.readError": "文件读取失败。",
    "upload.parseError": "Excel解析失败：{msg}",
    "upload.presetDividerText": "或",
    "upload.pickFolderHint": "仓库 \"files\" 文件夹中当前的Excel文件。",
    "filters.side": "阵营",
    "filters.sideAll": "全部",
    "filters.sideAria": "阵营筛选",
    "filters.focusAlliance": "关注联盟",
    "filters.focusNone": "（未选择）",
    "filters.summary": "显示 {shown} / {total} 个联盟",
    "tabs.overview": "概况",
    "tabs.ranking": "联盟排名",
    "tabs.map": "战场地图",
    "tabs.members": "成员参与度（领导视角）",
    "unknown": "未知",
    "unknownPlayer": "（未知）",
    "mangledName": "（被识别为日期的名字：{y}/{m}/{d}）",
    "component.structureActions": "据点行动数（capitol・canon×4合计，种类均等）",
    "component.attackScore": "攻击评分",
    "component.rubbleClears": "瓦砾清除数",
    "kpi.visibleAlliances": "当前显示联盟数",
    "kpi.visibleAlliancesSub": "共 {total} 个联盟",
    "kpi.participants": "参与人数",
    "kpi.participantsSub": "根据movements/structures/base_hits/rubbles统计",
    "kpi.structureActions": "据点行动数",
    "kpi.structureActionsSub": "其中capitol：{n}",
    "kpi.baseAttacks": "基地攻击数",
    "kpi.baseAttacksSub": "攻破成功率 {pct}",
    "kpi.rubbleClears": "瓦砾清除数",
    "kpi.rubbleClearsSub": "completed_clears 合计",
    "overview.capitolChartTitle": "Capitol 攻防活跃度（按时间段）",
    "overview.capitolChartSub": "每15分钟的 garrison_hold / reinforce_in / rally_in 次数（仅capitol据点）",
    "overview.noCapitolData": "未找到capitol的时间序列数据。",
    "overview.showTable": "查看表格",
    "overview.timeColumn": "时间",
    "ranking.title": "联盟综合贡献度评分",
    "ranking.sub": "按评分从高到低显示当前联盟。柱状图颜色代表阵营（见下方图例）。",
    "ranking.formulaPrefix": "综合评分 = ",
    "ranking.formulaSuffix": "（将3个项目分别以「本文件中前3名联盟的平均值」定为100分进行换算，再把这3项分数相加（合计上限大致在300分左右）。以前3名平均值为基准，而不是单纯的第1名，是为了避免某一个突出的联盟把其他所有联盟的分数都压低。如果第1名明显领先第2、3名，该项分数也可能超过100分。参与人数越多的联盟，各项合计自然越高，分数也更容易上升。参与人数本身不作为评分项目）。",
    "ranking.formulaNote2": "据点行动将capitol与canon×4不分种类均等合计（不特别优待capitol）。瓦砾清除没有坐标数据，因此不考虑距离（只是单纯的清除数量）。传送次数体现的是活跃度而非战斗贡献，因此不计入评分。",
    "ranking.noAlliances": "没有可显示的联盟。",
    "ranking.detailTitle": "各联盟详细数据",
    "ranking.detailSub": "点击列标题可排序。「据点行动」为capitol・canon×4的合计（明细请查看上方图表的提示框）。",
    "tt.totalScore": "综合评分",
    "tt.structureActionsTotal": "据点行动合计",
    "tt.breakdown": "　明细：{structure}",
    "tt.baseAttacks": "基地攻击",
    "tt.baseAttacksWinRate": "基地攻击",
    "tt.rubbleClears": "瓦砾清除",
    "tt.participants": "参与人数",
    "tt.refTeleports": "（参考）传送次数",
    "tt.alliance": "联盟",
    "tt.side": "阵营",
    "tt.time": "时间",
    "tt.sideAction": "{side} 的行动",
    "col.alliance": "联盟",
    "col.side": "阵营",
    "col.participantCount": "参与人数",
    "col.structureActions": "据点行动（全部）",
    "col.attacksLanded": "基地攻击",
    "col.attackWinRate": "攻破成功率",
    "col.attacksTaken": "被攻击数",
    "col.defenseHoldRate": "防守成功率",
    "col.rubbleClears": "瓦砾清除",
    "col.structureActionsPoints": "据点行动（分）",
    "col.attackScorePoints": "攻击评分（分）",
    "col.rubbleClearsPoints": "瓦砾清除（分）",
    "col.score": "综合评分",
    "map.title": "战场地图（传送进入坐标）",
    "map.sub": "◆ 表示 capitol / canon 坐标。最多可同时突出显示3个联盟（未选择时按阵营着色）。",
    "map.other": "其他",
    "map.noPoints": "没有可显示的坐标数据。",
    "map.pointCount": "当前显示点数：{n}",
    "members.searchPlaceholder": "按玩家名搜索",
    "members.csvExport": "导出CSV",
    "members.formula1": "综合活动评分 = 据点行动（防守/增援+攻击，capitol・canon×4合计，种类均等） + 攻击评分（基地攻击，不论输赢，目标离capitol越近权重越高） + 瓦砾清除数（无坐标数据，不考虑距离）。将3个项目分别以「本文件中前3名玩家的平均值」定为100分进行换算后再相加（若第1名明显领先第2、3名，该项可能超过100分）。",
    "members.formula2": "传送次数・移动次数仅作为参与活跃度的参考显示，因与战斗贡献属于不同维度，故不计入评分。综合活动评分对不分职责、广泛参与各类活动的人更有利，因此在比较被分配了特定职责（据点防守、基地攻击、瓦砾清除等）的成员时，请不要用综合评分，而是按其对应职责的那一列排序（例如负责攻击的成员请按「攻击评分」列排序）。",
    "members.noAlliances": "没有可显示的联盟。",
    "members.allAlliances": "全部",
    "members.allAlliancesSub": "当前显示的全部{n}个联盟",
    "members.memberCount": "成员数",
    "members.activeCount": "有活动记录",
    "members.activeCountSub": "{pct} 有任何活动记录",
    "col.player": "玩家",
    "col.structureActionsAll": "据点行动（全部）",
    "col.attacksTakenLost": "其中被攻破",
    "col.totalActivity": "综合活动评分",
    "col.refTeleportIns": "（参考）传送次数",
    "struct.capitol": "capitol",
    "struct.canon_NE": "canon（东北）",
    "struct.canon_NW": "canon（西北）",
    "struct.canon_SE": "canon（东南）",
    "struct.canon_SW": "canon（西南）",
    "col.rubbleMarches": "行军数",
    "col.attackScore": "攻击评分",
    "col.avgAttackDistance": "目标平均距离",
    "col.avgAttackScorePerHit": "每次攻击平均得分",
    "attackScore.note": "攻击评分的计算方法：①距离 = 攻击目标坐标与capitol坐标之间的直线距离。②权重 = max(0, 1 − 距离 ÷ 本文件中记录的攻击目标最大距离)。③攻击评分 = 每次命中的基地攻击的权重（②）之和（不论输赢，全部计入）。越靠近capitol攻击，单次最高可接近1.0分；攻击本文件记录中最远的位置，则接近0分。可与综合活动评分・基地攻击数对比，识别是否有人只靠攻击远离前线的无防守基地来刷数据。",
    "attackScore.unavailable": "此文件不包含目标坐标数据，因此无法计算攻击评分（需要base_hits表中包含target_x/target_y列的日志）。",
  },
};

const LANG_STORAGE_KEY = "svs-lang";
function detectDefaultLang() {
  const nav = (navigator.language || "ja").toLowerCase();
  if (nav.startsWith("zh")) return "zh";
  if (nav.startsWith("ja")) return "ja";
  if (nav.startsWith("en")) return "en";
  return "ja";
}
let currentLang = localStorage.getItem(LANG_STORAGE_KEY) || detectDefaultLang();

function t(key, vars) {
  const dict = I18N[currentLang] || I18N.ja;
  let s = dict[key] ?? I18N.ja[key] ?? key;
  if (vars) Object.keys(vars).forEach(k => { s = s.split("{" + k + "}").join(vars[k]); });
  return s;
}
/** Display label for a structure id coming straight from the data (e.g. "capitol",
 *  "canon_NE"). Known ids get a translated label; anything unrecognized (a future
 *  file might use different structure names) falls back to the raw id unchanged. */
function structureLabel(structure) {
  const key = "struct." + structure;
  const dict = I18N[currentLang] || I18N.ja;
  return dict[key] || structure;
}

function applyI18n() {
  document.title = t("app.title");
  $$("[data-i18n]").forEach(elm => { elm.textContent = t(elm.getAttribute("data-i18n")); });
  $$("[data-i18n-title]").forEach(elm => {
    const label = t(elm.getAttribute("data-i18n-title"));
    elm.setAttribute("title", label);
    elm.setAttribute("aria-label", label);
  });
  $$("[data-i18n-attr-aria-label]").forEach(elm => { elm.setAttribute("aria-label", t(elm.getAttribute("data-i18n-attr-aria-label"))); });
  const searchInput = $("#tab-members input[type=search]");
  if (searchInput) searchInput.placeholder = t("members.searchPlaceholder");
  if (window.MODEL) {
    updateHeaderSubtitle(window.MODEL);
    setupFilters(window.MODEL);
    renderActiveTab();
  }
  updateLangButtons();
}

function updateLangButtons() {
  $$("#lang-switch button").forEach(b => b.setAttribute("aria-pressed", b.dataset.lang === currentLang ? "true" : "false"));
}

(function initLangSwitch() {
  const host = $("#lang-switch");
  if (!host) return;
  const LANGS = [["ja", "日本語"], ["en", "English"], ["zh", "中文"]];
  LANGS.forEach(([code, label]) => {
    const b = el("button", { type: "button", "aria-pressed": code === currentLang ? "true" : "false", "data-lang": code }, [label]);
    b.addEventListener("click", () => {
      currentLang = code;
      localStorage.setItem(LANG_STORAGE_KEY, code);
      document.documentElement.setAttribute("lang", code);
      applyI18n();
    });
    host.appendChild(b);
  });
  document.documentElement.setAttribute("lang", currentLang);
  applyI18n();
})();

/* ---------- theme ---------- */
(function initTheme() {
  const saved = localStorage.getItem("svs-theme");
  if (saved) document.documentElement.setAttribute("data-theme", saved);
  $("#btn-theme")?.addEventListener("click", () => {
    const cur = document.documentElement.getAttribute("data-theme");
    const next = cur === "dark" ? "light" : (cur === "light" ? null : (matchMedia("(prefers-color-scheme: dark)").matches ? "light" : "dark"));
    if (next) { document.documentElement.setAttribute("data-theme", next); localStorage.setItem("svs-theme", next); }
    else { document.documentElement.removeAttribute("data-theme"); localStorage.removeItem("svs-theme"); }
  });
})();

/* ---------- tooltip (shared singleton) ---------- */
const tooltipEl = $("#tooltip");
function showTooltip(x, y, buildFn) {
  tooltipEl.innerHTML = "";
  buildFn(tooltipEl);
  tooltipEl.style.display = "block";
  const pad = 14;
  let left = x + pad, top = y + pad;
  const rect = tooltipEl.getBoundingClientRect();
  if (left + rect.width > innerWidth - 8) left = x - rect.width - pad;
  if (top + rect.height > innerHeight - 8) top = y - rect.height - pad;
  tooltipEl.style.left = Math.max(8, left) + "px";
  tooltipEl.style.top = Math.max(8, top) + "px";
}
function hideTooltip() { tooltipEl.style.display = "none"; }
function ttTitle(text) { const d = document.createElement("div"); d.className = "tt-title"; d.textContent = text; return d; }
function ttRow(label, value, strokeColor) {
  const row = document.createElement("div"); row.className = "tt-row";
  const key = document.createElement("div"); key.className = "tt-key";
  if (strokeColor) {
    const s = document.createElement("span"); s.className = "tt-stroke"; s.style.background = strokeColor;
    key.appendChild(s);
  }
  const kt = document.createElement("span"); kt.textContent = label;
  key.appendChild(kt);
  const val = document.createElement("div"); val.className = "tt-value"; val.textContent = value;
  row.appendChild(key); row.appendChild(val);
  return row;
}

/* ---------- upload / dropzone wiring ---------- */
const fileInput = $("#file-input");
const dropzone = $("#dropzone");
const uploadError = $("#upload-error");

dropzone.addEventListener("click", () => fileInput.click());
dropzone.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fileInput.click(); } });
["dragenter", "dragover"].forEach(evt => dropzone.addEventListener(evt, (e) => { e.preventDefault(); dropzone.classList.add("dragover"); }));
["dragleave", "drop"].forEach(evt => dropzone.addEventListener(evt, (e) => { e.preventDefault(); dropzone.classList.remove("dragover"); }));
dropzone.addEventListener("drop", (e) => { const f = e.dataTransfer.files && e.dataTransfer.files[0]; if (f) handleFile(f); });
fileInput.addEventListener("change", (e) => { const f = e.target.files && e.target.files[0]; if (f) handleFile(f); });

$("#btn-reload")?.addEventListener("click", () => {
  $("#dashboard").hidden = true;
  $("#header-controls").hidden = true;
  $("#upload-screen").hidden = false;
  window.MODEL = null;
  $("#header-subtitle").textContent = t("header.subtitleDefault");
  fileInput.value = "";
});

function showUploadError(msg) {
  uploadError.textContent = msg;
  uploadError.style.display = "block";
}

function handleFile(file) {
  uploadError.style.display = "none";
  if (!/\.xlsx$/i.test(file.name)) {
    showUploadError(t("upload.invalidFile"));
    return;
  }
  const reader = new FileReader();
  reader.onerror = () => showUploadError(t("upload.readError"));
  reader.onload = (e) => loadWorkbookArrayBuffer(e.target.result, file.name);
  reader.readAsArrayBuffer(file);
}

/** Shared by both manual upload (via handleFile/FileReader above) and the bundled-preset
 *  button below — same parse-and-boot path either way, just a different source for the
 *  raw bytes. */
function loadWorkbookArrayBuffer(arrayBuffer, fileName) {
  try {
    const wb = XLSX.read(arrayBuffer, { type: "array", cellDates: true });
    const raw = normalizeWorkbook(wb);
    bootDashboard(raw, fileName);
  } catch (err) {
    console.error(err);
    showUploadError(t("upload.parseError", { msg: err && err.message ? err.message : String(err) }));
  }
}

/** "Open a pre-placed Excel file" shortcut on the upload screen: lists whatever .xlsx
 *  files are currently committed to the files/ folder of this project's GitHub repo, and
 *  loads whichever one is clicked. This only makes sense because this page is deployed
 *  online (e.g. via Cloudflare Pages, redeploying automatically on every push) rather
 *  than opened locally via file:// — anyone visiting the page is on a different machine
 *  from wherever files/ actually lives, so the only way for their browser to know what's
 *  in that folder is to ask something that can see the repo.
 *
 *  Goes through this site's own /api/files* endpoints (Cloudflare Pages Functions — see
 *  functions/api/files/) rather than calling GitHub's API directly: the GitHub repo is
 *  private, so listing/reading it needs a token, and a token embedded in this
 *  client-side JS would be visible to anyone who opens dev tools — the whole point of
 *  making the repo private. The Function holds that token server-side instead; this code
 *  only ever talks to same-origin URLs and never sees the token at all. See README.md for
 *  the one-time Cloudflare Pages setup (creating the token, adding it as GITHUB_TOKEN).
 *
 *  If the Function isn't set up yet (fresh clone, no token configured), the fetch just
 *  fails and this section quietly stays hidden — falling back to plain upload is always
 *  fine, so there's nothing to alarm the user about here. */
(async function loadRepoFileList() {
  const section = $("#preset-section");
  const list = $("#files-list");
  if (!section || !list) return;
  try {
    const res = await fetch("/api/files");
    if (!res.ok) return;
    const files = await res.json();
    const xlsxEntries = (Array.isArray(files) ? files : [])
      .filter(e => e && typeof e.name === "string" && /\.xlsx$/i.test(e.name))
      .sort((a, b) => a.name.localeCompare(b.name, NUMBER_LOCALES[currentLang] || "ja"));
    if (!xlsxEntries.length) return;

    xlsxEntries.forEach(entry => {
      const btn = el("button", { class: "btn file-list-item" }, [entry.name]);
      btn.addEventListener("click", async () => {
        uploadError.style.display = "none";
        btn.disabled = true;
        try {
          const fileRes = await fetch(`/api/files/${encodeURIComponent(entry.name)}`);
          if (!fileRes.ok) throw new Error(`HTTP ${fileRes.status}`);
          const buf = await fileRes.arrayBuffer();
          loadWorkbookArrayBuffer(buf, entry.name);
        } catch (err) {
          console.error(err);
          showUploadError(t("upload.parseError", { msg: err && err.message ? err.message : String(err) }));
        } finally {
          btn.disabled = false;
        }
      });
      list.appendChild(btn);
    });
    section.hidden = false;
  } catch (err) {
    // Offline, the /api/files Function isn't deployed yet, GITHUB_TOKEN isn't configured,
    // etc. — not worth surfacing to the user when plain upload still works fine; just
    // leave the section hidden.
    console.warn("Could not load the repo's files/ listing:", err);
  }
})();

/* ================= SHEET PARSING ================= */

function findSheetName(wb, keywords) {
  const names = wb.SheetNames;
  for (const n of names) {
    const low = n.toLowerCase().trim();
    if (keywords.some(k => low === k)) return n;
  }
  for (const n of names) {
    const low = n.toLowerCase().trim();
    if (keywords.some(k => low.includes(k))) return n;
  }
  return null;
}

function sheetToRows(wb, sheetName) {
  if (!sheetName) return [];
  const ws = wb.Sheets[sheetName];
  if (!ws) return [];
  return XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: null });
}

function normHeader(h) { return (h == null ? "" : String(h)).trim().toLowerCase(); }

function rowsToObjects(rows, requiredHeaderSubstr) {
  if (!rows.length) return [];
  let headerIdx = 0;
  for (let i = 0; i < Math.min(rows.length, 5); i++) {
    const joined = (rows[i] || []).map(normHeader).join("|");
    if (requiredHeaderSubstr.every(s => joined.includes(s))) { headerIdx = i; break; }
  }
  const headers = (rows[headerIdx] || []).map((h, i) => normHeader(h) || ("col_" + i));
  const out = [];
  for (let r = headerIdx + 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.every(v => v == null || v === "")) continue;
    const obj = {};
    headers.forEach((h, i) => { obj[h] = row[i] === undefined ? null : row[i]; });
    out.push(obj);
  }
  return out;
}

/** Excel may give time-only cells as a Date on the 1899-12-30 epoch (cellDates:true). */
function timeOfDayMinutes(v) {
  if (v == null) return null;
  if (v instanceof Date) return v.getHours() * 60 + v.getMinutes() + v.getSeconds() / 60;
  if (typeof v === "number") { const totalMin = (v % 1) * 24 * 60; return totalMin; }
  if (typeof v === "string") {
    const m = v.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
    if (m) return (+m[1]) * 60 + (+m[2]) + (m[3] ? (+m[3]) / 60 : 0);
  }
  return null;
}
function toDateOrNull(v) { return v instanceof Date ? v : null; }
function sideStr(v) { return v == null || v === "" ? null : String(Math.trunc(Number(v))); }
/** The same player/alliance can show up with inconsistent internal whitespace across
 *  sheets (e.g. base_hits recording an extra space the other sheets don't have) —
 *  collapsing runs of whitespace (incl. full-width U+3000) to a single space keeps
 *  those from being treated as two different people. */
function normStr(v) {
  if (v == null) return null;
  return String(v).replace(/　/g, " ").trim().replace(/\s+/g, " ");
}
/** Some in-game names (e.g. "6/3") get silently auto-converted to a real date by Excel
 *  before the log is ever exported — the original text is unrecoverable from the file.
 *  Rather than showing the alarming full `Date.toString()`, show a compact date-like
 *  form and flag it, so it reads as "this name got mangled" instead of a real player. */
function normName(v) {
  if (v instanceof Date) {
    return t("mangledName", { y: v.getFullYear(), m: v.getMonth() + 1, d: v.getDate() });
  }
  return normStr(v);
}
function normAllianceName(v) {
  const s = normStr(v);
  if (!s) return null;
  const m = s.match(/^(.*?)\s*[\(（]/);
  return (m ? m[1] : s).trim() || null;
}

function normalizeWorkbook(wb) {
  const movSheet = findSheetName(wb, ["movements", "movement"]);
  const structSheet = findSheetName(wb, ["structures", "structure"]);
  const hitsSheet = findSheetName(wb, ["base_hits", "base hits", "hits"]);
  const rubbleSheet = findSheetName(wb, ["rubbles", "rubble"]);
  const teleSheet = findSheetName(wb, ["teleports", "teleport"]);
  const marchSheet = findSheetName(wb, ["marches", "march"]);

  const movements = rowsToObjects(sheetToRows(wb, movSheet), ["event", "player"]).map(r => ({
    time: toDateOrNull(r.time_local),
    minute: timeOfDayMinutes(r.time_local),
    event: normStr(r.event),
    player: normName(r.player_name),
    alliance: normStr(r.alliance),
    side: sideStr(r.side),
    x: Number(r.x ?? r["x"]), y: Number(r.y ?? r["y"]),
  }));

  const structures = rowsToObjects(sheetToRows(wb, structSheet), ["player", "structure"]).map(r => ({
    dispatchMinute: timeOfDayMinutes(r.dispatch_time),
    player: normName(r.player_name),
    alliance: normStr(r.alliance),
    side: sideStr(r.side),
    structure: normStr(r.structure),
    action: normStr(r.action),
    targetX: Number(r.target_x), targetY: Number(r.target_y),
    arriveMinute: timeOfDayMinutes(r.arrive_time),
    endMinute: timeOfDayMinutes(r.end_time),
    outcome: normStr(r.outcome),
    isBattleFail: r.isbattlefail === true || r.isbattlefail === "TRUE",
  }));

  // target_x/target_y (the victim base's coordinates) and attacker_x/attacker_y are a
  // newer addition to this sheet — older exports won't have them, so these come through
  // as null and every distance-based feature below degrades to "unknown" rather than
  // erroring.
  const baseHits = rowsToObjects(sheetToRows(wb, hitsSheet), ["victim", "attacker"]).map(r => ({
    minute: timeOfDayMinutes(r.time_local),
    victim: normName(r.victim_name),
    victimAlliance: normStr(r.victim_alliance),
    victimSide: sideStr(r.victim_side),
    targetX: r.target_x != null ? Number(r.target_x) : null,
    targetY: r.target_y != null ? Number(r.target_y) : null,
    attacker: normName(r.attacker_name),
    attackerAlliance: normStr(r.attacker_alliance),
    attackerSide: sideStr(r.attacker_side),
    attackerX: r.attacker_x != null ? Number(r.attacker_x) : null,
    attackerY: r.attacker_y != null ? Number(r.attacker_y) : null,
    attackerWon: r.attacker_won === true || r.attacker_won === "TRUE",
  }));

  // The rubbles sheet's columns have been renamed across exports of this log (older
  // files used name/clearing_marches/completed_clears; newer ones use
  // player/marches_sent/completions plus extra detail columns) — read either name so
  // both old and new files work. Only "alliance" is required to find the header row,
  // since the name column itself is the part that renamed.
  const rubbles = rowsToObjects(sheetToRows(wb, rubbleSheet), ["alliance"]).map(r => ({
    player: normName(r.name ?? r.player),
    alliance: normStr(r.alliance),
    side: sideStr(r.side),
    clearingMarches: Number(r.clearing_marches ?? r.marches_sent) || 0,
    completedClears: Number(r.completed_clears ?? r.completions) || 0,
  }));

  const teleportRows = rowsToObjects(sheetToRows(wb, teleSheet), ["alliance", "player"]);
  const teleports = teleportRows.map(r => ({
    alliance: normStr(r.alliance),
    players: Number(r.players) || 0,
  })).filter(r => r.alliance);

  // marches sheet: possibly several side-by-side "Alliance|Players|Marches" blocks
  const marchRawRows = sheetToRows(wb, marchSheet);
  const marches = [];
  if (marchRawRows.length) {
    const header = (marchRawRows[0] || []).map(normHeader);
    const blockStarts = [];
    header.forEach((h, i) => { if (h === "alliance") blockStarts.push(i); });
    for (let r = 1; r < marchRawRows.length; r++) {
      const row = marchRawRows[r] || [];
      blockStarts.forEach(ci => {
        const alliance = normStr(row[ci]);
        if (!alliance) return;
        marches.push({
          alliance,
          players: Number(row[ci + 1]) || 0,
          marchesCount: Number(row[ci + 2]) || 0,
        });
      });
    }
  }

  return { movements, structures, baseHits, rubbles, teleports, marches };
}

/* ================= METRICS MODEL ================= */

/** Single source of truth for both the alliance and per-player total score — a plain,
 *  unweighted sum of three raw totals, reused for both the calculation and the on-screen
 *  formula text so they can never drift apart:
 *
 *    total score = structure actions + attack score + rubble clears
 *
 *  No normalization, no percentages, no separate "participant count" term. An alliance's
 *  score is just the sum of its own members' scores (structure actions summed + attack
 *  score summed + rubble clears summed) — so an alliance with more active members scores
 *  higher automatically, because it has more individual contributions to add up. Turning
 *  participant count into its own normalized/weighted line item would double-count that
 *  effect and is harder to read, so it isn't one; participant count is still shown in the
 *  UI, but purely as context.
 *
 *  structureActions counts capitol AND all 4 canon points together, undifferentiated —
 *  every structure is "necessary" per the event notes, so none of them gets an extra
 *  bonus weight, and structure actions are never distance-weighted (see attackScoreWeight()
 *  in buildModel for why). capitol-specific counts are still shown separately in the UI,
 *  but only as context, never as a scored component.
 *
 *  attackScore replaces a plain "base attacks landed" count: it's the sum, over every one
 *  of this alliance's/player's landed attacks (win or lose), of how close that attack's
 *  target was to the capitol (1.0 for a hit right on capitol, fading to 0 at the farthest
 *  recorded target) — so hitting undefended bases on the map's edge earns far less than
 *  fighting near the front line, even at the same raw attack count. Falls back to 0
 *  (component drops out) on a log that has no base_hits coordinates.
 *
 *  rubbleClears has no coordinate data in this log format (the rubbles sheet doesn't
 *  record where each clear happened), so it stays a plain count — not distance-weighted.
 *
 *  Deliberately excluded: teleport-in count. It reflects presence/activity, not
 *  contribution to the fight, so it is shown in the UI for reference but does not
 *  feed into either score. */
// Labels for these come from I18N (t("component." + key)) at render time, not stored
// here, so the on-screen formula text follows the current language even after a file is
// loaded. Same three keys at both alliance and player level (player level additionally
// has structureActionsAll, which is just its own structureActions under a distinct name).
const SCORE_COMPONENTS = ["structureActions", "attackScore", "rubbleClears"];

function buildModel(raw, fileName) {
  const sideVotes = new Map();
  function vote(alliance, side) {
    if (!alliance || !side) return;
    if (!sideVotes.has(alliance)) sideVotes.set(alliance, {});
    const o = sideVotes.get(alliance);
    o[side] = (o[side] || 0) + 1;
  }
  raw.movements.forEach(m => vote(m.alliance, m.side));
  raw.structures.forEach(s => vote(s.alliance, s.side));
  raw.baseHits.forEach(b => { vote(b.attackerAlliance, b.attackerSide); vote(b.victimAlliance, b.victimSide); });
  raw.rubbles.forEach(r => vote(r.alliance, r.side));

  const allianceSide = new Map();
  sideVotes.forEach((o, alliance) => {
    const sides = Object.keys(o).sort((a, b) => o[b] - o[a]);
    allianceSide.set(alliance, sides[0] || null);
  });
  // Some SVS events include a handful of players/alliances from allied "guest" servers
  // (small reinforcement counts tagged with their own home-server side id). Order sides
  // by how much of the event they actually account for — not numerically or alphabetically —
  // so the two dominant sides always get the featured colors, and rare guest sides fold to gray.
  const sideEventTotals = new Map();
  sideVotes.forEach((o) => { Object.keys(o).forEach(s => sideEventTotals.set(s, (sideEventTotals.get(s) || 0) + o[s])); });
  const sidesPresent = Array.from(new Set(Array.from(allianceSide.values()).filter(Boolean)))
    .sort((a, b) => (sideEventTotals.get(b) || 0) - (sideEventTotals.get(a) || 0));
  const sideColorSlots = ["var(--series-side-a)", "var(--series-side-b)"];
  const sideColors = new Map(sidesPresent.map((s, i) => [s, sideColorSlots[i] || "var(--other-gray)"]));

  function newAllianceAcc(alliance) {
    return {
      alliance, side: allianceSide.get(alliance) || null,
      participants: new Set(),
      defenseActions: 0, attackActions: 0, capitolActions: 0, withdraws: 0,
      attacksLanded: 0, attacksWon: 0, attacksTaken: 0, attacksTakenLost: 0,
      rubbleClears: 0, rubbleMarches: 0,
      teleportPlayers: 0, marchesTotal: 0, marchPlayers: 0,
      forcedRelocations: 0, teleportIns: 0,
      structureBreakdown: {},
      attackScore: 0, attackDistSum: 0, attackScoreHits: 0,
    };
  }
  const allianceMap = new Map();
  function getAlliance(name) {
    if (!name) return null;
    if (!allianceMap.has(name)) allianceMap.set(name, newAllianceAcc(name));
    return allianceMap.get(name);
  }

  function newPlayerAcc(alliance, player) {
    return {
      alliance, player,
      teleportIns: 0, relocates: 0, forcedRelocations: 0,
      defenseActions: 0, attackActions: 0, capitolActions: 0,
      attacksLanded: 0, attacksWon: 0, attacksTaken: 0, attacksTakenLost: 0,
      rubbleClears: 0, rubbleMarches: 0,
      attackScore: 0, attackDistSum: 0, attackScoreHits: 0,
    };
  }
  const playerMap = new Map();
  function getPlayer(alliance, player) {
    if (!alliance || !player) return null;
    const key = alliance + "||" + player;
    if (!playerMap.has(key)) playerMap.set(key, newPlayerAcc(alliance, player));
    return playerMap.get(key);
  }

  // Distance-from-capitol weighting, feeding the "core-zone score" below: a hit near the
  // capitol matters more than mopping up an undefended base far from the front line.
  // Needs target_x/target_y on base_hits — an older export without those columns just
  // yields null distances everywhere, and the feature quietly reports "no data" rather
  // than breaking.
  let capitolX = null, capitolY = null;
  for (const s of raw.structures) {
    if (s.structure === "capitol" && isFinite(s.targetX) && isFinite(s.targetY)) { capitolX = s.targetX; capitolY = s.targetY; break; }
  }
  function distFromCapitol(x, y) {
    if (capitolX == null || x == null || y == null || !isFinite(x) || !isFinite(y)) return null;
    return Math.hypot(x - capitolX, y - capitolY);
  }
  let maxTargetDist = 1;
  raw.baseHits.forEach(b => {
    const d = distFromCapitol(b.targetX, b.targetY);
    if (d != null && d > maxTargetDist) maxTargetDist = d;
  });
  /** 1.0 right at the capitol, fading linearly to 0 at the farthest recorded PvP target
   *  in this file — so a hit next to capitol counts fully and one on the far edge of the
   *  map counts for ~nothing. Applied to every landed base_hits attack, win or lose:
   *  structure actions (capitol/canon garrison/reinforce/rally) are deliberately NOT
   *  distance-weighted —
   *  they already count equally regardless of which of the 5 structures it was, and
   *  weighting them by distance-to-capitol would just re-introduce a capitol bonus
   *  through the back door (every canon sits at the same distance from capitol, so it'd
   *  penalize all canon defense uniformly relative to capitol defense). */
  function attackScoreWeight(x, y) {
    const dist = distFromCapitol(x, y);
    if (dist == null) return null;
    return { dist, weight: Math.max(0, 1 - dist / maxTargetDist) };
  }

  const scatterPoints = [];
  let minMinute = Infinity, maxMinute = -Infinity;
  raw.movements.forEach(m => {
    if (m.minute != null) { minMinute = Math.min(minMinute, m.minute); maxMinute = Math.max(maxMinute, m.minute); }
    const aAcc = getAlliance(m.alliance);
    if (aAcc && m.player) aAcc.participants.add(m.player);
    const pAcc = getPlayer(m.alliance, m.player);
    if (m.event === "teleport_in") { if (aAcc) aAcc.teleportIns++; if (pAcc) pAcc.teleportIns++; }
    else if (m.event === "relocate") { if (pAcc) pAcc.relocates++; }
    else if (m.event === "forced_relocation") { if (aAcc) aAcc.forcedRelocations++; if (pAcc) pAcc.forcedRelocations++; }
    if (isFinite(m.x) && isFinite(m.y) && m.event === "teleport_in") {
      scatterPoints.push({ x: m.x, y: m.y, player: m.player, alliance: m.alliance, side: m.side, minute: m.minute });
    }
  });

  const capitolTimelineBuckets = new Map();
  const structureNodes = new Map();
  raw.structures.forEach(s => {
    const aAcc = getAlliance(s.alliance);
    if (aAcc && s.player) aAcc.participants.add(s.player);
    const pAcc = getPlayer(s.alliance, s.player);
    const isDefense = s.action === "garrison_hold" || s.action === "reinforce_in";
    const isAttack = s.action === "rally_in";
    if (isDefense) { if (aAcc) aAcc.defenseActions++; if (pAcc) pAcc.defenseActions++; }
    if (isAttack) { if (aAcc) aAcc.attackActions++; if (pAcc) pAcc.attackActions++; }
    if (s.action === "withdraw" && aAcc) aAcc.withdraws++;
    // Informational only — capitol and the 4 canon points all count equally toward the
    // score via structureActions above; this breakdown is never separately weighted.
    // (No distance weighting here — see the note on attackScoreWeight() above.)
    if (s.structure && (isDefense || isAttack)) {
      if (aAcc) aAcc.structureBreakdown[s.structure] = (aAcc.structureBreakdown[s.structure] || 0) + 1;
      if (s.structure === "capitol") { if (aAcc) aAcc.capitolActions++; if (pAcc) pAcc.capitolActions++; }
    }

    if (!structureNodes.has(s.structure) && isFinite(s.targetX) && isFinite(s.targetY)) {
      structureNodes.set(s.structure, { structure: s.structure, x: s.targetX, y: s.targetY, actions: {} });
    }
    const node = structureNodes.get(s.structure);
    if (node && s.side && (isDefense || isAttack)) node.actions[s.side] = (node.actions[s.side] || 0) + 1;

    if (s.structure === "capitol" && s.dispatchMinute != null && s.side && (isDefense || isAttack)) {
      const bucket = Math.floor(s.dispatchMinute / 15) * 15;
      if (!capitolTimelineBuckets.has(bucket)) capitolTimelineBuckets.set(bucket, {});
      const b = capitolTimelineBuckets.get(bucket);
      b[s.side] = (b[s.side] || 0) + 1;
    }
  });

  raw.baseHits.forEach(b => {
    const attAcc = getAlliance(b.attackerAlliance);
    if (attAcc && b.attacker) attAcc.participants.add(b.attacker);
    const attP = getPlayer(b.attackerAlliance, b.attacker);
    if (attAcc) attAcc.attacksLanded++;
    if (attP) attP.attacksLanded++;
    if (b.attackerWon) {
      if (attAcc) attAcc.attacksWon++;
      if (attP) attP.attacksWon++;
    }
    // Every landed attack counts toward the attack score, win or lose — not just wins.
    // Attacking a well-defended target near capitol and losing still reflects real
    // engagement with the front line; only rewarding wins would bias the score toward
    // whoever picks easy, guaranteed-win targets over contested ones.
    const prox = attackScoreWeight(b.targetX, b.targetY);
    if (prox) {
      if (attAcc) { attAcc.attackScore += prox.weight; attAcc.attackDistSum += prox.dist; attAcc.attackScoreHits += 1; }
      if (attP) { attP.attackScore += prox.weight; attP.attackDistSum += prox.dist; attP.attackScoreHits += 1; }
    }

    const vicAcc = getAlliance(b.victimAlliance);
    if (vicAcc && b.victim) vicAcc.participants.add(b.victim);
    const vicP = getPlayer(b.victimAlliance, b.victim);
    if (vicAcc) vicAcc.attacksTaken++;
    if (vicP) vicP.attacksTaken++;
    if (b.attackerWon) { if (vicAcc) vicAcc.attacksTakenLost++; if (vicP) vicP.attacksTakenLost++; }
  });

  raw.rubbles.forEach(r => {
    const aAcc = getAlliance(r.alliance);
    if (aAcc && r.player) aAcc.participants.add(r.player);
    if (aAcc) { aAcc.rubbleClears += r.completedClears; aAcc.rubbleMarches += r.clearingMarches; }
    const pAcc = getPlayer(r.alliance, r.player);
    if (pAcc) { pAcc.rubbleClears += r.completedClears; pAcc.rubbleMarches += r.clearingMarches; }
  });

  raw.teleports.forEach(t => {
    const aAcc = getAlliance(t.alliance);
    if (aAcc) aAcc.teleportPlayers = t.players;
  });

  const nameLookup = new Map();
  allianceMap.forEach((acc, name) => nameLookup.set(name.toLowerCase(), name));
  raw.marches.forEach(m => {
    const shortMatch = normAllianceName(m.alliance);
    const key = (shortMatch || m.alliance || "").toLowerCase();
    const resolved = nameLookup.get(key);
    const aAcc = getAlliance(resolved || shortMatch || m.alliance);
    if (aAcc) { aAcc.marchesTotal += m.marchesCount; aAcc.marchPlayers = Math.max(aAcc.marchPlayers, m.players); }
  });

  const alliances = Array.from(allianceMap.values()).map(a => ({
    ...a,
    participantCount: a.participants.size,
    structureActions: a.defenseActions + a.attackActions,
  }));

  // Each of the 3 raw totals is rescaled to a 0–100 point score, and the 3 scaled scores
  // are summed — so the total score maxes out at 300, not 100. See SCORE_COMPONENTS above
  // for why these are the 3 axes and why there's no separate participant-count term.
  //
  // 100 = the *average of the top 3* on that one axis (across the whole file — not just
  // whatever's currently filtered into view, so a score doesn't shift around when the side
  // filter changes) — not the single #1. A lone outlier no longer sets the ceiling and
  // compresses everyone else toward 0: #1 can still land a bit above 100 if they're well
  // clear of 2nd/3rd, which is an honest signal (they're actually ahead of the pack), while
  // a #1 that's basically tied with #2/#3 lands close to 100, same as before. Falls back to
  // an average of however many entries exist when there are fewer than 3.
  function scaleTo100(value, top3avg) { return top3avg > 0 ? (value / top3avg) * 100 : 0; }
  function top3Average(values) {
    const top3 = values.slice().sort((a, b) => b - a).slice(0, 3);
    return top3.length ? top3.reduce((s, v) => s + v, 0) / top3.length : 0;
  }

  const maxAllianceStructureActions = Math.max(1, top3Average(alliances.map(a => a.structureActions)));
  const maxAllianceAttackScore = Math.max(1, top3Average(alliances.map(a => a.attackScore)));
  const maxAllianceRubbleClears = Math.max(1, top3Average(alliances.map(a => a.rubbleClears)));
  alliances.forEach(a => {
    a.structureActionsPoints = scaleTo100(a.structureActions, maxAllianceStructureActions);
    a.attackScorePoints = scaleTo100(a.attackScore, maxAllianceAttackScore);
    a.rubbleClearsPoints = scaleTo100(a.rubbleClears, maxAllianceRubbleClears);
    a.score = a.structureActionsPoints + a.attackScorePoints + a.rubbleClearsPoints;
    a.attackWinRate = a.attacksLanded ? a.attacksWon / a.attacksLanded : null;
    a.defenseHoldRate = a.attacksTaken ? 1 - (a.attacksTakenLost / a.attacksTaken) : null;
    a.avgAttackDistance = a.attackScoreHits ? a.attackDistSum / a.attackScoreHits : null;
    a.avgAttackScorePerHit = a.attacksLanded ? a.attackScore / a.attacksLanded : null;
  });
  alliances.sort((x, y) => y.score - x.score);

  const playersRaw = Array.from(playerMap.values()).map(p => ({ ...p, structureActionsAll: p.defenseActions + p.attackActions }));
  const maxPlayerStructureActions = Math.max(1, top3Average(playersRaw.map(p => p.structureActionsAll)));
  const maxPlayerAttackScore = Math.max(1, top3Average(playersRaw.map(p => p.attackScore)));
  const maxPlayerRubbleClears = Math.max(1, top3Average(playersRaw.map(p => p.rubbleClears)));
  const players = playersRaw.map(p => {
    // Same idea as the alliance score above: structure actions + attack score
    // (distance-weighted, not a raw attack count — a win next to capitol is worth close
    // to a full 100-point axis, a win against an undefended base on the far edge of the
    // map is worth close to nothing) + rubble clears (flat count — no coordinate data for
    // rubble in this log format), each scaled 0–100 against the best player in the file,
    // then summed (max 300).
    const structureActionsPoints = scaleTo100(p.structureActionsAll, maxPlayerStructureActions);
    const attackScorePoints = scaleTo100(p.attackScore, maxPlayerAttackScore);
    const rubbleClearsPoints = scaleTo100(p.rubbleClears, maxPlayerRubbleClears);
    const totalActivity = structureActionsPoints + attackScorePoints + rubbleClearsPoints;
    const avgAttackDistance = p.attackScoreHits ? p.attackDistSum / p.attackScoreHits : null;
    // "How many attack-score points a single attack is worth on average" for this player.
    const avgAttackScorePerHit = p.attacksLanded ? p.attackScore / p.attacksLanded : null;
    return {
      ...p, structureActionsPoints, attackScorePoints, rubbleClearsPoints, totalActivity,
      avgAttackDistance, avgAttackScorePerHit, attackWinRate: p.attacksLanded ? p.attacksWon / p.attacksLanded : null,
    };
  });

  const capitolTimeline = Array.from(capitolTimelineBuckets.entries())
    .map(([minute, sides]) => ({ minute, ...sides }))
    .sort((a, b) => a.minute - b.minute);

  const structureNodesArr = Array.from(structureNodes.values());

  return {
    meta: {
      fileName,
      sides: sidesPresent,
      minMinute: isFinite(minMinute) ? minMinute : 0,
      maxMinute: isFinite(maxMinute) ? maxMinute : 24 * 60,
      totalParticipants: new Set(players.map(p => p.player)).size,
      totalBaseHits: raw.baseHits.length,
      totalAttackerWins: raw.baseHits.filter(b => b.attackerWon).length,
      hasAttackScoreData: capitolX != null && raw.baseHits.some(b => b.targetX != null && b.targetY != null),
    },
    allianceSide, sideColors, alliances, players, scatterPoints, structureNodes: structureNodesArr, capitolTimeline,
  };
}

/* ================= COLOR HELPERS ================= */

/** Side identifiers (server numbers) are read entirely from the uploaded file — never assumed.
 *  Colors are assigned by order of appearance (1st side -> slot1, 2nd side -> slot2, rest -> gray),
 *  computed once in buildModel() and stored on the model, so the same two sides always keep the
 *  same color for the whole session regardless of which file was uploaded. */
function sideColorVar(side) {
  const map = window.MODEL && window.MODEL.sideColors;
  if (side && map && map.has(side)) return map.get(side);
  return "var(--other-gray)";
}
function sideLabel(side) { return side || t("unknown"); }
const EMPHASIS_SLOTS = ["var(--alliance-1)", "var(--alliance-2)", "var(--alliance-3)"];

function renderLegend(container, items) {
  container.innerHTML = "";
  container.className = "legend";
  items.forEach(it => {
    const row = el("div", { class: "legend-item" }, [
      el("span", { class: it.shape === "line" ? "legend-line" : "legend-swatch", style: `background:${it.color}` }),
      document.createTextNode(it.label),
    ]);
    container.appendChild(row);
  });
}

function niceTicks(min, max, count) {
  if (max <= min) return [0, 1];
  const range = max - min;
  const rawStep = range / count;
  const mag = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const norm = rawStep / mag;
  let step;
  if (norm < 1.5) step = 1 * mag; else if (norm < 3) step = 2 * mag; else if (norm < 7) step = 5 * mag; else step = 10 * mag;
  const ticks = [];
  const start = Math.ceil(min / step) * step;
  for (let t = start; t <= max + step * 0.001; t += step) ticks.push(Math.round(t * 1000) / 1000);
  if (ticks.length === 0) ticks.push(0);
  return ticks;
}

function hBarPath(x0, y, w, h, r) {
  w = Math.max(0, w);
  r = Math.max(0, Math.min(r, h / 2, w / 2 || 0));
  const x1 = x0 + w;
  if (w < 1) return `M${x0},${y} L${x0},${y + h} Z`;
  return `M${x0},${y} H${x1 - r} Q${x1},${y} ${x1},${y + r} V${y + h - r} Q${x1},${y + h} ${x1 - r},${y + h} H${x0} Z`;
}

/* ================= BAR CHART ================= */
/** data: [{label, value, color, meta}] pre-sorted by caller. */
function renderHBarChart(container, { data, tooltipFn, valueFormat, xLabel }) {
  container.innerHTML = "";
  const rowH = 27, barH = 16;
  const leftPad = 96, rightPad = 58, topPad = 6, bottomPad = 22;
  const width = Math.max(360, container.clientWidth || 640);
  const plotW = Math.max(60, width - leftPad - rightPad);
  const height = topPad + data.length * rowH + bottomPad;
  const svg = svgEl("svg", { class: "chart-svg", viewBox: `0 0 ${width} ${height}` });
  const maxVal = Math.max(1, ...data.map(d => d.value));
  const ticks = niceTicks(0, maxVal, 4);
  const axisY = topPad + data.length * rowH;

  ticks.forEach(t => {
    const x = leftPad + (t / maxVal) * plotW;
    svg.appendChild(svgEl("line", { x1: x, x2: x, y1: topPad, y2: axisY, class: "grid-line" }));
    const tx = svgEl("text", { x, y: axisY + 15, class: "axis-label", "text-anchor": "middle" });
    tx.textContent = fmt.format(t);
    svg.appendChild(tx);
  });
  svg.appendChild(svgEl("line", { x1: leftPad, x2: leftPad, y1: topPad, y2: axisY, class: "axis-line" }));

  data.forEach((d, i) => {
    const y = topPad + i * rowH;
    const barY = y + (rowH - barH) / 2;
    const w = (d.value / maxVal) * plotW;

    const label = svgEl("text", { x: leftPad - 8, y: y + rowH / 2 + 4, class: "category-label", "text-anchor": "end" });
    label.textContent = d.label;
    svg.appendChild(label);

    const g = svgEl("g", { class: "bar-hit", tabindex: "0" });
    const hit = svgEl("rect", { x: leftPad, y, width: plotW, height: rowH, fill: "transparent" });
    const path = svgEl("path", { d: hBarPath(leftPad, barY, w, barH, 4) });
    path.style.fill = d.color;
    const val = svgEl("text", { x: leftPad + w + 6, y: y + rowH / 2 + 4, class: "bar-value-label" });
    val.textContent = valueFormat ? valueFormat(d.value) : fmt.format(Math.round(d.value));
    g.appendChild(hit); g.appendChild(path); g.appendChild(val);
    const onEnter = (evt) => {
      const p = evt.touches ? evt.touches[0] : evt;
      showTooltip(p.clientX, p.clientY, (tt) => tooltipFn ? tooltipFn(tt, d) : tt.appendChild(ttRow(d.label, val.textContent, d.color)));
    };
    g.addEventListener("pointermove", onEnter);
    g.addEventListener("pointerenter", onEnter);
    g.addEventListener("pointerleave", hideTooltip);
    g.addEventListener("focus", (evt) => { const r = g.getBoundingClientRect(); showTooltip(r.right, r.top, (tt) => tooltipFn ? tooltipFn(tt, d) : tt.appendChild(ttRow(d.label, val.textContent, d.color))); });
    g.addEventListener("blur", hideTooltip);
    svg.appendChild(g);
  });

  if (xLabel) {
    const lab = svgEl("text", { x: leftPad, y: height, class: "axis-label" });
    lab.textContent = xLabel;
    svg.appendChild(lab);
  }
  container.appendChild(svg);
}

/* ================= LINE CHART (time series, up to a few categorical series) ================= */
function minutesToLabel(min) {
  const h = Math.floor(min / 60) % 24, m = Math.round(min % 60);
  return pad2(h) + ":" + pad2(m);
}
function renderTimeSeriesChart(container, { rows, xKey, seriesKeys, seriesColors, seriesLabels }) {
  container.innerHTML = "";
  const width = Math.max(360, container.clientWidth || 640);
  const leftPad = 42, rightPad = 16, topPad = 10, bottomPad = 28;
  const height = 260;
  const plotW = width - leftPad - rightPad, plotH = height - topPad - bottomPad;
  const svg = svgEl("svg", { class: "chart-svg", viewBox: `0 0 ${width} ${height}` });

  if (!rows.length) {
    container.appendChild(svg);
    return;
  }
  const xMin = rows[0][xKey], xMax = rows[rows.length - 1][xKey];
  const xSpan = Math.max(1, xMax - xMin);
  const yMax = Math.max(1, ...rows.flatMap(r => seriesKeys.map(k => r[k] || 0)));
  const yTicks = niceTicks(0, yMax, 4);
  const xScale = (v) => leftPad + ((v - xMin) / xSpan) * plotW;
  const yScale = (v) => topPad + plotH - (v / yMax) * plotH;

  yTicks.forEach(t => {
    const y = yScale(t);
    svg.appendChild(svgEl("line", { x1: leftPad, x2: leftPad + plotW, y1: y, y2: y, class: "grid-line" }));
    const tx = svgEl("text", { x: leftPad - 6, y: y + 3, class: "axis-label", "text-anchor": "end" });
    tx.textContent = fmt.format(t);
    svg.appendChild(tx);
  });
  const xTickCount = Math.min(8, rows.length);
  for (let i = 0; i <= xTickCount; i++) {
    const v = xMin + (xSpan * i) / xTickCount;
    const x = xScale(v);
    const tx = svgEl("text", { x, y: topPad + plotH + 16, class: "axis-label", "text-anchor": "middle" });
    tx.textContent = minutesToLabel(v);
    svg.appendChild(tx);
  }
  svg.appendChild(svgEl("line", { x1: leftPad, x2: leftPad, y1: topPad, y2: topPad + plotH, class: "axis-line" }));
  svg.appendChild(svgEl("line", { x1: leftPad, x2: leftPad + plotW, y1: topPad + plotH, y2: topPad + plotH, class: "axis-line" }));

  seriesKeys.forEach((key, si) => {
    let d = "";
    rows.forEach((r, i) => {
      const x = xScale(r[xKey]), y = yScale(r[key] || 0);
      d += (i === 0 ? "M" : "L") + x + "," + y + " ";
    });
    const path = svgEl("path", { d, fill: "none", "stroke-width": 2, "stroke-linejoin": "round", "stroke-linecap": "round" });
    path.style.stroke = seriesColors[si];
    svg.appendChild(path);
  });

  const crosshair = svgEl("line", { y1: topPad, y2: topPad + plotH, class: "axis-line", stroke: "var(--text-muted)", visibility: "hidden" });
  svg.appendChild(crosshair);
  const hitOverlay = svgEl("rect", { x: leftPad, y: topPad, width: plotW, height: plotH, fill: "transparent" });
  hitOverlay.addEventListener("pointermove", (evt) => {
    const rect = svg.getBoundingClientRect();
    const svgX = ((evt.clientX - rect.left) / rect.width) * width;
    const frac = Math.max(0, Math.min(1, (svgX - leftPad) / plotW));
    const idx = Math.round(frac * (rows.length - 1));
    const row = rows[idx];
    if (!row) return;
    crosshair.setAttribute("x1", xScale(row[xKey]));
    crosshair.setAttribute("x2", xScale(row[xKey]));
    crosshair.setAttribute("visibility", "visible");
    showTooltip(evt.clientX, evt.clientY, (tt) => {
      tt.appendChild(ttTitle(minutesToLabel(row[xKey])));
      seriesKeys.forEach((key, si) => tt.appendChild(ttRow(seriesLabels[si], fmt.format(row[key] || 0), seriesColors[si])));
    });
  });
  hitOverlay.addEventListener("pointerleave", () => { crosshair.setAttribute("visibility", "hidden"); hideTooltip(); });
  svg.appendChild(hitOverlay);

  container.appendChild(svg);
}

/* ================= SCATTER (battlefield map) ================= */
function renderScatterMap(container, { points, structureNodes, colorFn, tooltipFn, structureTooltipFn }) {
  container.innerHTML = "";
  const size = Math.max(360, Math.min(720, container.clientWidth || 640));
  const pad = 24;
  const svg = svgEl("svg", { class: "chart-svg", viewBox: `0 0 ${size} ${size}` });

  const allX = points.map(p => p.x).concat(structureNodes.map(s => s.x));
  const allY = points.map(p => p.y).concat(structureNodes.map(s => s.y));
  if (!allX.length) { container.appendChild(svg); return; }
  const xMin = Math.min(...allX), xMax = Math.max(...allX);
  const yMin = Math.min(...allY), yMax = Math.max(...allY);
  const xSpan = Math.max(1, xMax - xMin), ySpan = Math.max(1, yMax - yMin);
  const plot = size - pad * 2;
  const xScale = (v) => pad + ((v - xMin) / xSpan) * plot;
  const yScale = (v) => pad + plot - ((v - yMin) / ySpan) * plot;

  svg.appendChild(svgEl("rect", { x: pad, y: pad, width: plot, height: plot, fill: "none", class: "axis-line" }));

  const ptsG = svgEl("g");
  points.forEach(p => {
    const cx = xScale(p.x), cy = yScale(p.y);
    const g = svgEl("g", { class: "bar-hit", tabindex: "0" });
    const hit = svgEl("circle", { cx, cy, r: 10, fill: "transparent" });
    const dot = svgEl("circle", { cx, cy, r: 2.6 });
    dot.style.fill = colorFn(p);
    g.appendChild(hit); g.appendChild(dot);
    const show = (evt) => { const pt = evt.touches ? evt.touches[0] : evt; showTooltip(pt.clientX, pt.clientY, (tt) => tooltipFn(tt, p)); };
    g.addEventListener("pointerenter", show);
    g.addEventListener("pointermove", show);
    g.addEventListener("pointerleave", hideTooltip);
    ptsG.appendChild(g);
  });
  svg.appendChild(ptsG);

  const nodesG = svgEl("g");
  structureNodes.forEach(s => {
    const cx = xScale(s.x), cy = yScale(s.y);
    const d = 9;
    const g = svgEl("g", { class: "bar-hit", tabindex: "0" });
    const diamond = svgEl("path", { d: `M${cx},${cy - d} L${cx + d},${cy} L${cx},${cy + d} L${cx - d},${cy} Z`, stroke: "var(--surface-1)", "stroke-width": 2 });
    diamond.style.fill = "var(--text-primary)";
    const label = svgEl("text", { x: cx, y: cy - d - 5, "text-anchor": "middle", class: "category-label" });
    label.textContent = structureLabel(s.structure);
    g.appendChild(diamond); g.appendChild(label);
    const show = (evt) => { const pt = evt.touches ? evt.touches[0] : evt; showTooltip(pt.clientX, pt.clientY, (tt) => structureTooltipFn(tt, s)); };
    g.addEventListener("pointerenter", show);
    g.addEventListener("pointermove", show);
    g.addEventListener("pointerleave", hideTooltip);
    nodesG.appendChild(g);
  });
  svg.appendChild(nodesG);

  container.appendChild(svg);
}

/* ================= SORTABLE TABLE ================= */
function renderSortableTable(container, { columns, rows, rowClassFn, initialSort }) {
  container.innerHTML = "";
  let sortKey = initialSort ? initialSort.key : columns[0].key;
  let sortDir = initialSort ? initialSort.dir : "desc";

  // Identity (text) columns always stay leftmost as anchors; among the remaining data
  // columns, whichever one is currently being sorted by moves to the front — so sorting
  // by a column that's normally off-screen to the right brings its values into view
  // instead of leaving the reader to scroll back and forth to check them. Built fresh
  // from the caller's original `columns` order every time, so repeated re-sorts never
  // compound — there's always exactly one canonical "before" order to reshuffle from.
  function displayColumns() {
    const textCols = columns.filter(c => c.text);
    const dataCols = columns.filter(c => !c.text);
    const activeIdx = dataCols.findIndex(c => c.key === sortKey);
    if (activeIdx > 0) {
      const [active] = dataCols.splice(activeIdx, 1);
      dataCols.unshift(active);
    }
    return [...textCols, ...dataCols];
  }

  function build() {
    container.innerHTML = "";
    const wrap = el("div", { class: "table-wrap" });
    const table = el("table", { class: "data-table" });
    const cols = displayColumns();
    const thead = el("thead");
    const headRow = el("tr");
    cols.forEach(col => {
      const cls = [col.text ? "text-col" : "", col.className || ""].filter(Boolean).join(" ");
      const th = el("th", { class: cls }, [document.createTextNode(col.label)]);
      if (col.key === sortKey) { th.classList.add("sorted"); th.setAttribute("data-arrow", sortDir === "asc" ? "▲" : "▼"); }
      th.addEventListener("click", () => {
        if (sortKey === col.key) sortDir = sortDir === "asc" ? "desc" : "asc";
        else { sortKey = col.key; sortDir = col.text ? "asc" : "desc"; }
        build();
      });
      headRow.appendChild(th);
    });
    thead.appendChild(headRow);
    table.appendChild(thead);

    const sorted = rows.slice().sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey];
      let cmp;
      if (typeof av === "string" || typeof bv === "string") cmp = String(av ?? "").localeCompare(String(bv ?? ""), NUMBER_LOCALES[currentLang] || "ja");
      else cmp = (av ?? -Infinity) - (bv ?? -Infinity);
      return sortDir === "asc" ? cmp : -cmp;
    });

    const tbody = el("tbody");
    sorted.forEach(r => {
      const tr = el("tr", { class: rowClassFn ? rowClassFn(r) : "" });
      cols.forEach(col => {
        const cls = [col.text ? "text-col" : "", col.className || ""].filter(Boolean).join(" ");
        const td = el("td", { class: cls });
        td.textContent = col.format ? col.format(r[col.key], r) : (r[col.key] ?? "—");
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    wrap.appendChild(table);
    container.appendChild(wrap);
  }
  build();
}

function downloadCsv(filename, columns, rows) {
  const esc = (v) => { const s = v == null ? "" : String(v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
  const lines = [columns.map(c => esc(c.label)).join(",")];
  rows.forEach(r => lines.push(columns.map(c => esc(c.format ? c.format(r[c.key], r) : r[c.key])).join(",")));
  const blob = new Blob(["﻿" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

/* ================= DASHBOARD BOOT & FILTERS ================= */

const uiState = { side: "all", focusAlliance: null, mapEmphasis: [], membersAlliance: null, membersSearch: "" };

function updateHeaderSubtitle(model) {
  $("#header-subtitle").textContent = t("header.subtitleLoaded", {
    file: model.meta.fileName,
    allianceCount: fmt.format(model.alliances.length),
    participants: fmt.format(model.meta.totalParticipants),
  });
}

function bootDashboard(raw, fileName) {
  const model = buildModel(raw, fileName);
  window.MODEL = model;
  $("#upload-screen").hidden = true;
  $("#dashboard").hidden = false;
  $("#header-controls").hidden = false;
  updateHeaderSubtitle(model);

  // No alliance is preselected — the uploaded file's alliance tags are arbitrary per event,
  // so the user always picks their own alliance explicitly via the focus-alliance dropdown.
  uiState.focusAlliance = null;
  uiState.membersAlliance = model.alliances[0] ? model.alliances[0].alliance : null;

  setupFilters(model);
  setupTabs();
  renderActiveTab();
}

/** Rebuilds the filter DOM to reflect the current language and uiState — safe to call
 *  again on a language switch since it only re-renders from uiState, never resets it. */
function setupFilters(model) {
  const sideFilterEl = $("#side-filter");
  sideFilterEl.innerHTML = "";
  sideFilterEl.setAttribute("aria-label", t("filters.sideAria"));
  const sides = model.meta.sides;
  ["all", ...sides].forEach(opt => {
    const b = el("button", { type: "button", "aria-pressed": uiState.side === opt ? "true" : "false" }, [opt === "all" ? t("filters.sideAll") : opt]);
    b.addEventListener("click", () => {
      uiState.side = opt;
      $$("#side-filter button").forEach(btn => btn.setAttribute("aria-pressed", "false"));
      b.setAttribute("aria-pressed", "true");
      renderActiveTab();
    });
    sideFilterEl.appendChild(b);
  });

  const focusSel = $("#focus-alliance");
  focusSel.innerHTML = "";
  focusSel.appendChild(el("option", { value: "" }, [t("filters.focusNone")]));
  model.alliances.forEach(a => focusSel.appendChild(el("option", { value: a.alliance } , [`${a.alliance} (${sideLabel(a.side)})`])));
  focusSel.value = uiState.focusAlliance || "";
  focusSel.addEventListener("change", () => {
    uiState.focusAlliance = focusSel.value || null;
    if (uiState.focusAlliance) uiState.membersAlliance = uiState.focusAlliance;
    uiState.mapEmphasis = uiState.focusAlliance ? [uiState.focusAlliance] : [];
    renderActiveTab();
  });
}

function setupTabs() {
  $$(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      $$(".tab-btn").forEach(b => b.setAttribute("aria-selected", "false"));
      btn.setAttribute("aria-selected", "true");
      $$(".tab-panel").forEach(p => p.classList.remove("active"));
      $("#tab-" + btn.dataset.tab).classList.add("active");
      renderActiveTab();
    });
  });
}

function activeTabName() {
  const btn = $(".tab-btn[aria-selected='true']");
  return btn ? btn.dataset.tab : "overview";
}

function renderActiveTab() {
  const model = window.MODEL;
  if (!model) return;
  const filteredAlliances = model.alliances.filter(a => uiState.side === "all" || a.side === uiState.side);
  $("#filter-summary").textContent = t("filters.summary", { shown: fmt.format(filteredAlliances.length), total: fmt.format(model.alliances.length) });
  const tab = activeTabName();
  if (tab === "overview") renderOverviewTab(model, filteredAlliances);
  else if (tab === "ranking") renderRankingTab(model, filteredAlliances);
  else if (tab === "map") renderMapTab(model, filteredAlliances);
  else if (tab === "members") renderMembersTab(model, filteredAlliances);
}

/* ================= OVERVIEW TAB ================= */
function renderOverviewTab(model, alliances) {
  const root = $("#tab-overview");
  root.innerHTML = "";

  const sum = (key) => alliances.reduce((s, a) => s + (a[key] || 0), 0);
  const totalParticipants = sum("participantCount");
  const totalStructureActions = sum("structureActions");
  const totalCapitolActions = sum("capitolActions");
  const totalAttacksLanded = sum("attacksLanded");
  const totalAttacksWon = sum("attacksWon");
  const totalRubbleClears = sum("rubbleClears");

  const kpiRow = el("div", { class: "kpi-row" });
  function kpi(label, value, sub) {
    return el("div", { class: "kpi-tile" }, [
      el("div", { class: "kpi-label" }, [label]),
      el("div", { class: "kpi-value" }, [value]),
      sub ? el("div", { class: "kpi-sub" }, [sub]) : null,
    ]);
  }
  kpiRow.appendChild(kpi(t("kpi.visibleAlliances"), fmt.format(alliances.length), t("kpi.visibleAlliancesSub", { total: fmt.format(model.alliances.length) })));
  kpiRow.appendChild(kpi(t("kpi.participants"), fmt.format(totalParticipants), t("kpi.participantsSub")));
  kpiRow.appendChild(kpi(t("kpi.structureActions"), fmt.format(totalStructureActions), t("kpi.structureActionsSub", { n: fmt.format(totalCapitolActions) })));
  kpiRow.appendChild(kpi(t("kpi.baseAttacks"), fmt.format(totalAttacksLanded), t("kpi.baseAttacksSub", { pct: fmtPct(totalAttacksWon / (totalAttacksLanded || 1)) })));
  kpiRow.appendChild(kpi(t("kpi.rubbleClears"), fmt.format(totalRubbleClears), t("kpi.rubbleClearsSub")));
  root.appendChild(kpiRow);

  const card = el("div", { class: "card" });
  card.appendChild(el("div", { class: "card-head" }, [
    el("h3", {}, [t("overview.capitolChartTitle")]),
  ]));
  card.appendChild(el("div", { class: "card-sub" }, [t("overview.capitolChartSub")]));

  const candidateKeys = uiState.side === "all" ? model.meta.sides : [uiState.side];
  // Only plot sides that actually have capitol activity in this slice — small "guest"
  // sides with a handful of events elsewhere often have zero capitol structure rows,
  // and a flat zero line only clutters the legend.
  const seriesKeys = candidateKeys.filter(k => model.capitolTimeline.some(r => (r[k] || 0) > 0));
  const seriesColors = seriesKeys.map(sideColorVar);
  const seriesLabels = seriesKeys.map(sideLabel);
  if (seriesKeys.length > 1) {
    const legendWrap = el("div", {});
    renderLegend(legendWrap, seriesKeys.map((k, i) => ({ label: seriesLabels[i], color: seriesColors[i], shape: "line" })));
    card.appendChild(legendWrap);
  }
  const chartHost = el("div", {});
  card.appendChild(chartHost);
  if (model.capitolTimeline.length) {
    renderTimeSeriesChart(chartHost, { rows: model.capitolTimeline, xKey: "minute", seriesKeys, seriesColors, seriesLabels });
  } else {
    chartHost.appendChild(el("div", { class: "empty-state" }, [t("overview.noCapitolData")]));
  }

  const details = el("details", {});
  details.appendChild(el("summary", { class: "muted-btn", style: "display:inline-block" }, [t("overview.showTable")]));
  const tblHost = el("div", { style: "margin-top:10px" });
  renderSortableTable(tblHost, {
    columns: [
      { key: "minute", label: t("overview.timeColumn"), format: (v) => minutesToLabel(v) },
      ...seriesKeys.map(k => ({ key: k, label: sideLabel(k), format: (v) => fmt.format(v || 0) })),
    ],
    rows: model.capitolTimeline,
    initialSort: { key: "minute", dir: "asc" },
  });
  details.appendChild(tblHost);
  card.appendChild(details);
  root.appendChild(card);
}

/* ================= RANKING TAB ================= */
function renderRankingTab(model, alliances) {
  const root = $("#tab-ranking");
  root.innerHTML = "";

  const presentSides = Array.from(new Set(alliances.map(a => a.side).filter(Boolean)));
  const card = el("div", { class: "card" });
  card.appendChild(el("div", { class: "card-head" }, [
    el("h3", {}, [t("ranking.title")]),
  ]));
  const formulaLine = t("ranking.formulaPrefix") + SCORE_COMPONENTS.map(key => t("component." + key)).join(" + ");
  card.appendChild(el("div", { class: "card-sub" }, [
    t("ranking.sub"),
  ]));
  card.appendChild(el("div", { class: "note", style: "margin-bottom:12px" }, [
    formulaLine + t("ranking.formulaSuffix"),
    el("br"),
    t("ranking.formulaNote2"),
    el("br"),
    model.meta.hasAttackScoreData ? t("attackScore.note") : t("attackScore.unavailable"),
  ]));
  if (presentSides.length > 1 || presentSides.length === 0) {
    const legendWrap = el("div", {});
    renderLegend(legendWrap, (model.meta.sides.length ? model.meta.sides : presentSides).map(s => ({ label: sideLabel(s), color: sideColorVar(s) })));
    card.appendChild(legendWrap);
  }
  const chartHost = el("div", {});
  card.appendChild(chartHost);
  if (alliances.length) {
    renderHBarChart(chartHost, {
      data: alliances.map(a => ({ label: a.alliance, value: a.score, color: sideColorVar(a.side) })),
      valueFormat: (v) => v.toFixed(1),
      tooltipFn: (tt, d) => {
        const a = alliances.find(x => x.alliance === d.label);
        tt.appendChild(ttTitle(`${a.alliance}（${sideLabel(a.side)}）`));
        tt.appendChild(ttRow(t("tt.totalScore"), a.score.toFixed(1)));
        tt.appendChild(ttRow(t("tt.structureActionsTotal"), fmt.format(a.structureActions)));
        Object.keys(a.structureBreakdown || {}).sort().forEach(structure => {
          tt.appendChild(ttRow(t("tt.breakdown", { structure: structureLabel(structure) }), fmt.format(a.structureBreakdown[structure])));
        });
        tt.appendChild(ttRow(t("tt.baseAttacksWinRate"), fmt.format(a.attacksLanded) + ` (${t("col.attackWinRate")} ${fmtPct(a.attackWinRate ?? 0)})`));
        tt.appendChild(ttRow(t("col.attackScore"), a.attackScore.toFixed(1)));
        tt.appendChild(ttRow(t("tt.rubbleClears"), fmt.format(a.rubbleClears)));
        tt.appendChild(ttRow(t("tt.participants"), fmt.format(a.participantCount)));
        tt.appendChild(ttRow(t("tt.refTeleports"), fmt.format(a.teleportIns)));
      },
    });
  } else {
    chartHost.appendChild(el("div", { class: "empty-state" }, [t("ranking.noAlliances")]));
  }
  root.appendChild(card);

  const tableCard = el("div", { class: "card" });
  tableCard.appendChild(el("h3", {}, [t("ranking.detailTitle")]));
  tableCard.appendChild(el("div", { class: "card-sub" }, [t("ranking.detailSub")]));
  const tblHost = el("div", {});
  renderSortableTable(tblHost, {
    // Total score sits right after the identity columns (not buried at the far right),
    // immediately followed by the 3 raw columns that are actually summed to make it —
    // both highlighted (see .col-total-score / .col-score-part in styles.css) — so it's
    // visually obvious which columns are "the formula" and which are just context.
    columns: [
      { key: "alliance", label: t("col.alliance"), text: true },
      { key: "side", label: t("col.side"), format: (v) => sideLabel(v) },
      { key: "score", label: t("col.score"), format: (v) => v.toFixed(1), className: "col-total-score" },
      { key: "structureActionsPoints", label: "+ " + t("col.structureActionsPoints"), format: (v) => (v || 0).toFixed(1), className: "col-score-part" },
      { key: "attackScorePoints", label: "+ " + t("col.attackScorePoints"), format: (v) => (v || 0).toFixed(1), className: "col-score-part" },
      { key: "rubbleClearsPoints", label: "+ " + t("col.rubbleClearsPoints"), format: (v) => (v || 0).toFixed(1), className: "col-score-part" },
      { key: "participantCount", label: t("col.participantCount") },
      { key: "structureActions", label: t("col.structureActions") },
      { key: "attacksLanded", label: t("col.attacksLanded") },
      { key: "attackWinRate", label: t("col.attackWinRate"), format: (v) => fmtPct(v ?? 0) },
      { key: "attackScore", label: t("col.attackScore"), format: (v) => (v || 0).toFixed(1) },
      { key: "attacksTaken", label: t("col.attacksTaken") },
      { key: "defenseHoldRate", label: t("col.defenseHoldRate"), format: (v) => fmtPct(v ?? 0) },
      { key: "rubbleClears", label: t("col.rubbleClears") },
    ],
    rows: alliances,
    rowClassFn: (r) => r.alliance === uiState.focusAlliance ? "row-focus" : "",
    initialSort: { key: "score", dir: "desc" },
  });
  tableCard.appendChild(tblHost);
  root.appendChild(tableCard);
}

/* ================= BATTLEFIELD MAP TAB ================= */
function renderMapTab(model, alliances) {
  const root = $("#tab-map");
  root.innerHTML = "";

  const card = el("div", { class: "card" });
  card.appendChild(el("div", { class: "card-head" }, [el("h3", {}, [t("map.title")])]));
  card.appendChild(el("div", { class: "card-sub" }, [t("map.sub")]));

  const allianceOptions = alliances.slice().sort((a, b) => b.participantCount - a.participantCount);
  const checklist = el("div", { class: "checkbox-list" });
  allianceOptions.forEach(a => {
    const checked = uiState.mapEmphasis.includes(a.alliance);
    const id = "map-emph-" + a.alliance.replace(/\W/g, "_");
    const cb = el("input", { type: "checkbox", id });
    cb.checked = checked;
    cb.disabled = !checked && uiState.mapEmphasis.length >= 3;
    cb.addEventListener("change", () => {
      if (cb.checked) uiState.mapEmphasis.push(a.alliance);
      else uiState.mapEmphasis = uiState.mapEmphasis.filter(x => x !== a.alliance);
      renderMapTab(model, alliances);
    });
    const label = el("label", { for: id }, [cb, document.createTextNode(`${a.alliance} (${sideLabel(a.side)})`)]);
    checklist.appendChild(label);
  });
  card.appendChild(checklist);

  const legendWrap = el("div", { style: "margin-top:10px" });
  if (uiState.mapEmphasis.length) {
    renderLegend(legendWrap, [
      ...uiState.mapEmphasis.map((name, i) => ({ label: name, color: EMPHASIS_SLOTS[i] })),
      { label: t("map.other"), color: "var(--other-gray)" },
    ]);
  } else {
    renderLegend(legendWrap, model.meta.sides.map(s => ({ label: sideLabel(s), color: sideColorVar(s) })));
  }
  card.appendChild(legendWrap);

  const allowedAlliances = new Set(alliances.map(a => a.alliance));
  const points = model.scatterPoints.filter(p => (uiState.side === "all" || p.side === uiState.side) && allowedAlliances.has(p.alliance));

  const chartHost = el("div", { style: "margin-top:10px" });
  card.appendChild(chartHost);
  if (points.length) {
    renderScatterMap(chartHost, {
      points,
      structureNodes: model.structureNodes,
      colorFn: (p) => {
        if (uiState.mapEmphasis.length) {
          const idx = uiState.mapEmphasis.indexOf(p.alliance);
          return idx >= 0 ? EMPHASIS_SLOTS[idx] : "var(--other-gray)";
        }
        return sideColorVar(p.side);
      },
      tooltipFn: (tt, p) => {
        tt.appendChild(ttTitle(p.player || t("unknownPlayer")));
        tt.appendChild(ttRow(t("tt.alliance"), p.alliance || "—"));
        tt.appendChild(ttRow(t("tt.side"), sideLabel(p.side)));
        if (p.minute != null) tt.appendChild(ttRow(t("tt.time"), minutesToLabel(p.minute)));
      },
      structureTooltipFn: (tt, s) => {
        tt.appendChild(ttTitle(structureLabel(s.structure)));
        Object.keys(s.actions).forEach(side => tt.appendChild(ttRow(t("tt.sideAction", { side: sideLabel(side) }), fmt.format(s.actions[side]), sideColorVar(side))));
      },
    });
  } else {
    chartHost.appendChild(el("div", { class: "empty-state" }, [t("map.noPoints")]));
  }
  card.appendChild(el("div", { class: "note" }, [t("map.pointCount", { n: fmt.format(points.length) })]));
  root.appendChild(card);
}

/* ================= MEMBERS TAB (leader view) ================= */
const ALL_ALLIANCES_VALUE = "__all__";

function renderMembersTab(model, alliances) {
  const root = $("#tab-members");
  root.innerHTML = "";

  if (!alliances.length) {
    root.appendChild(el("div", { class: "empty-state" }, [t("members.noAlliances")]));
    return;
  }
  if (!uiState.membersAlliance || (uiState.membersAlliance !== ALL_ALLIANCES_VALUE && !alliances.some(a => a.alliance === uiState.membersAlliance))) {
    uiState.membersAlliance = alliances[0].alliance;
  }

  const card = el("div", { class: "card" });
  const toolbar = el("div", { class: "toolbar" });
  const sel = el("select", {});
  const allOpt = el("option", { value: ALL_ALLIANCES_VALUE }, [t("members.allAlliances")]);
  if (uiState.membersAlliance === ALL_ALLIANCES_VALUE) allOpt.selected = true;
  sel.appendChild(allOpt);
  alliances.slice().sort((a, b) => a.alliance.localeCompare(b.alliance)).forEach(a => {
    const opt = el("option", { value: a.alliance }, [`${a.alliance} (${sideLabel(a.side)})`]);
    if (a.alliance === uiState.membersAlliance) opt.selected = true;
    sel.appendChild(opt);
  });
  sel.addEventListener("change", () => { uiState.membersAlliance = sel.value; renderMembersTab(model, alliances); });
  toolbar.appendChild(sel);

  const search = el("input", { type: "search", placeholder: t("members.searchPlaceholder") });
  search.value = uiState.membersSearch;
  search.addEventListener("input", () => { uiState.membersSearch = search.value; renderMembersBody(); });
  toolbar.appendChild(search);
  toolbar.appendChild(el("div", { class: "grow" }));
  const exportBtn = el("button", { class: "muted-btn" }, [t("members.csvExport")]);
  toolbar.appendChild(exportBtn);
  card.appendChild(toolbar);

  const summaryHost = el("div", { class: "kpi-row" });
  card.appendChild(summaryHost);
  card.appendChild(el("div", { class: "card-sub" }, [
    t("members.formula1"),
    el("br"),
    t("members.formula2"),
  ]));
  card.appendChild(el("div", { class: "note", style: "margin-bottom:12px" }, [
    model.meta.hasAttackScoreData ? t("attackScore.note") : t("attackScore.unavailable"),
  ]));
  const tblHost = el("div", {});
  card.appendChild(tblHost);
  root.appendChild(card);

  // Same "make the formula visible" ordering as the Ranking tab's alliance table: total
  // score right after identity, immediately followed by the 3 raw columns summed to make
  // it (each already rescaled 0–100 before being added — see members.formula1), both
  // highlighted; everything else is reference/context and comes after.
  const columns = [
    { key: "player", label: t("col.player"), text: true },
    { key: "alliance", label: t("col.alliance"), text: true },
    { key: "totalActivity", label: t("col.totalActivity"), format: (v) => (v || 0).toFixed(1), className: "col-total-score" },
    { key: "structureActionsPoints", label: "+ " + t("col.structureActionsPoints"), format: (v) => (v || 0).toFixed(1), className: "col-score-part" },
    { key: "attackScorePoints", label: "+ " + t("col.attackScorePoints"), format: (v) => (v || 0).toFixed(1), className: "col-score-part" },
    { key: "rubbleClearsPoints", label: "+ " + t("col.rubbleClearsPoints"), format: (v) => (v || 0).toFixed(1), className: "col-score-part" },
    { key: "structureActionsAll", label: t("col.structureActionsAll") },
    { key: "attacksLanded", label: t("col.attacksLanded") },
    { key: "attackWinRate", label: t("col.attackWinRate"), format: (v) => v == null ? "—" : fmtPct(v) },
    { key: "attackScore", label: t("col.attackScore"), format: (v) => (v || 0).toFixed(1) },
    { key: "avgAttackScorePerHit", label: t("col.avgAttackScorePerHit"), format: (v) => v == null ? "—" : v.toFixed(2) },
    { key: "avgAttackDistance", label: t("col.avgAttackDistance"), format: (v) => v == null ? "—" : v.toFixed(1) },
    { key: "attacksTaken", label: t("col.attacksTaken") },
    { key: "attacksTakenLost", label: t("col.attacksTakenLost") },
    { key: "rubbleClears", label: t("col.rubbleClears") },
    { key: "teleportIns", label: t("col.refTeleportIns") },
  ];

  function renderMembersBody() {
    const allowedAlliances = new Set(alliances.map(a => a.alliance));
    let players = uiState.membersAlliance === ALL_ALLIANCES_VALUE
      ? model.players.filter(p => allowedAlliances.has(p.alliance))
      : model.players.filter(p => p.alliance === uiState.membersAlliance);
    if (uiState.membersSearch.trim()) {
      const q = uiState.membersSearch.trim().toLowerCase();
      players = players.filter(p => (p.player || "").toLowerCase().includes(q));
    }

    summaryHost.innerHTML = "";
    const activeCount = players.filter(p => p.totalActivity > 0).length;
    function kpi(label, value, sub) {
      return el("div", { class: "kpi-tile" }, [
        el("div", { class: "kpi-label" }, [label]),
        el("div", { class: "kpi-value" }, [value]),
        sub ? el("div", { class: "kpi-sub" }, [sub]) : null,
      ]);
    }
    const scopeLabel = uiState.membersAlliance === ALL_ALLIANCES_VALUE
      ? t("members.allAlliancesSub", { n: fmt.format(allowedAlliances.size) })
      : uiState.membersAlliance;
    summaryHost.appendChild(kpi(t("members.memberCount"), fmt.format(players.length), scopeLabel));
    summaryHost.appendChild(kpi(t("members.activeCount"), fmt.format(activeCount), t("members.activeCountSub", { pct: fmtPct(activeCount / (players.length || 1)) })));

    renderSortableTable(tblHost, {
      columns,
      rows: players,
      initialSort: { key: "totalActivity", dir: "desc" },
    });

    const csvName = uiState.membersAlliance === ALL_ALLIANCES_VALUE ? "all" : uiState.membersAlliance;
    exportBtn.onclick = () => downloadCsv(`${csvName}_members.csv`, columns, players);
  }
  renderMembersBody();
}


/* ================= END OF PART 4 MARKER ================= */
