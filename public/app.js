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
    "loading.message": "読み込み中…",
    "upload.parseError": "Excelの解析に失敗しました: {msg}",
    "upload.presetDividerText": "または",
    "filters.side": "陣営",
    "filters.sideAll": "すべて",
    "filters.sideAria": "陣営フィルター",
    "filters.server": "サーバー",
    "filters.serverAll": "すべて",
    "filters.focusAlliance": "フォーカス連盟",
    "filters.focusNone": "（選択なし）",
    "filters.summary": "{shown} / {total} 連盟を表示中",
    "tabs.overview": "概況",
    "tabs.ranking": "連盟ランキング",
    "tabs.members": "メンバー参加度（リーダー向け）",
    "unknown": "不明",
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
    "overview.showTable": "表で見る",
    "overview.timeColumn": "時刻",
    "ranking.title": "連盟 総合貢献度スコア",
    "ranking.sub": "表示中の連盟をスコア降順に表示。バーの色は陣営（下の凡例）を表します。",
    "ranking.formulaPrefix": "総合スコア = ",
    "ranking.formulaSuffix": "（3項目それぞれを「このファイル内の上位3連盟の平均を100点」として換算し、その3つのスコアを合計します（合計はおおむね300点前後が上限）。1位を単純な基準にすると突出した連盟1つで他全員の点数が圧縮されてしまうため、上位3連盟の平均を基準にしています。1位が2位・3位を大きく引き離している場合は100点を超えることもあります。参加人数が多い連盟ほど各項目の合計が自然に大きくなり、点数も上がりやすくなります。参加人数そのものはスコアの項目には含めていません）。",
    "ranking.formulaNote2": "拠点アクションは capitol と canon×4 を種別を問わず均等に合算しています（capitolだけを特別扱いしていません）。瓦礫解体は座標データがないため距離は考慮していません（単純な解体数です）。テレポート回数は参加のアクティブさを示す指標であり、戦闘への貢献とは別軸のためスコアには含めていません。",
    "ranking.chartMetric": "グラフに表示するデータ",
    "ranking.noAlliances": "表示できる連盟がありません。",
    "ranking.detailTitle": "連盟別 詳細データ",
    "ranking.detailSub": "列見出しをクリックすると並び替えできます。「拠点アクション」は capitol・canon×4 の合計（内訳は上のグラフのツールチップ参照）。",
    "ranking.structureContestTitle": "施設ごとの争奪状況",
    "ranking.structureContestSub": "点の大きさ・色はその施設での活動量／優勢な連盟を表します。クリックすると、その施設で防衛・攻撃を合わせたアクション数が多い連盟の上位8件を表示します。",
    "ranking.structureContestTotal": "合計アクション数",
    "tt.totalScore": "総合スコア",
    "tt.structureActionsTotal": "拠点アクション合計",
    "tt.breakdown": "　内訳: {structure}",
    "tt.baseAttacksWinRate": "基地攻撃",
    "tt.rubbleClears": "瓦礫解体",
    "tt.participants": "参加人数",
    "tt.refTeleports": "（参考）テレポート回数",
    "col.alliance": "連盟",
    "col.side": "陣営",
    "col.server": "サーバー",
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
    "members.searchPlaceholder": "プレイヤー名で検索",
    "members.csvExport": "CSVエクスポート",
    "export.textExport": "テキスト出力",
    "export.countPlaceholder": "件数（空欄で全件）",
    "export.copy": "コピー",
    "export.copied": "コピーしました",
    "export.copyManual": "選択しました。Ctrl/Cmd+Cでコピーしてください",
    "export.rankingTitle": "{metric} ランキング",
    "export.includeDetail": "順位・数値を含める",
    "export.lineWithValue": "{rank}位 {name}　{value}",
    "unit.points": "点",
    "unit.times": "回",
    "unit.people": "人",
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
    "col.refRalliesOpened": "（参考）集結開始回数",
    "col.refRalliesJoined": "（参考）集結参加回数",
    "col.refRallyActions": "（参考）集結関連行動回数",
    "struct.capitol": "capitol",
    "struct.canon_NE": "canon_NE",
    "struct.canon_NW": "canon_NW",
    "struct.canon_SE": "canon_SE",
    "struct.canon_SW": "canon_SW",
    "struct.node": "拠点（node）",
    "struct.tower": "塔（tower）",
    "struct.special_objective": "特殊目標",
    "side.camp_1": "防衛陣営",
    "side.camp_2": "攻撃陣営",
    "col.rubbleMarches": "行軍数",
    "col.attackScore": "攻撃スコア",
    "col.avgAttackDistance": "平均対象距離",
    "col.avgAttackScorePerHit": "1回あたり平均獲得ポイント",
    "attackScore.note": "攻撃スコアの計算式：① 距離 = 攻撃対象の座標とcapitolの座標との直線距離。② 重み = max(0, 1 − 距離 ÷ このファイルで記録された攻撃対象の中の最大距離)。③ 攻撃スコア = 基地攻撃1件ごとの重み（②）を合計したもの（勝敗を問わず、着弾した攻撃はすべて対象）。capitolのすぐそばを攻撃するほど1件あたり最大1.0点に近づき、記録上もっとも遠い場所を攻撃すると1件あたり0点に近づきます。総合活動スコア・基地攻撃数と見比べることで、戦域の外側の無防備な基地ばかり狙って数字を稼いでいないかを確認できます。",
    "attackScore.noDistance": "このファイルには攻撃対象の座標データが含まれていないため、距離による重み付けはできません。代わりに、着弾した基地攻撃の回数（勝敗は問いません）をそのまま攻撃スコアとして使用しています。",
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
    "loading.message": "Loading…",
    "upload.parseError": "Failed to parse the Excel file: {msg}",
    "upload.presetDividerText": "or",
    "filters.side": "Side",
    "filters.sideAll": "All",
    "filters.sideAria": "Side filter",
    "filters.server": "Server",
    "filters.serverAll": "All",
    "filters.focusAlliance": "Focus alliance",
    "filters.focusNone": "(none selected)",
    "filters.summary": "Showing {shown} / {total} alliances",
    "tabs.overview": "Overview",
    "tabs.ranking": "Alliance ranking",
    "tabs.members": "Member participation (for leaders)",
    "unknown": "Unknown",
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
    "overview.showTable": "View as table",
    "overview.timeColumn": "Time",
    "ranking.title": "Alliance contribution score",
    "ranking.sub": "Alliances shown, sorted by score descending. Bar color shows side (see legend below).",
    "ranking.formulaPrefix": "Total score = ",
    "ranking.formulaSuffix": " (each of the 3 is scaled so that 100 = the average of the top 3 alliances in this file on that one axis, then the three scores are added — roughly capped around 300. Using the top-3 average instead of a plain #1 keeps one outlier alliance from compressing everyone else toward 0; if #1 is well clear of #2/#3 it can score above 100. An alliance with more active members naturally scores higher on each axis, since every extra contributing member adds to the total. Participant count itself isn't a scored component).",
    "ranking.formulaNote2": "Structure actions combine capitol and all 4 canons equally, regardless of type (capitol gets no special bonus). Rubble clears aren't distance-weighted since the log has no coordinates for them (it's a plain clear count). Teleport-in count reflects presence/activity, not combat contribution, so it is excluded from the score.",
    "ranking.chartMetric": "Chart metric",
    "ranking.noAlliances": "No alliances to display.",
    "ranking.detailTitle": "Alliance detail table",
    "ranking.detailSub": "Click a column header to sort. \"Structure actions\" is the total across capitol and all 4 canons (see the chart tooltip above for the breakdown).",
    "ranking.structureContestTitle": "Contest by structure",
    "ranking.structureContestSub": "Dot size/color show each structure's activity level and which alliance leads there. Click one to see its top 8 alliances by combined defense + attack actions.",
    "ranking.structureContestTotal": "Total actions",
    "tt.totalScore": "Total score",
    "tt.structureActionsTotal": "Structure actions (total)",
    "tt.breakdown": "　breakdown: {structure}",
    "tt.baseAttacksWinRate": "Base attacks",
    "tt.rubbleClears": "Rubble clears",
    "tt.participants": "Participants",
    "tt.refTeleports": "(reference) Teleport-ins",
    "col.alliance": "Alliance",
    "col.side": "Side",
    "col.server": "Server",
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
    "members.searchPlaceholder": "Search player name",
    "members.csvExport": "Export CSV",
    "export.textExport": "Text export",
    "export.countPlaceholder": "Count (blank = all)",
    "export.copy": "Copy",
    "export.copied": "Copied",
    "export.copyManual": "Selected — press Ctrl/Cmd+C to copy",
    "export.rankingTitle": "{metric} Ranking",
    "export.includeDetail": "Include rank & value",
    "export.lineWithValue": "{rank}. {name} - {value}",
    "unit.points": " pts",
    "unit.times": "",
    "unit.people": "",
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
    "col.refRalliesOpened": "(reference) Rallies opened",
    "col.refRalliesJoined": "(reference) Rallies joined",
    "col.refRallyActions": "(reference) Rally-related actions",
    "struct.capitol": "capitol",
    "struct.canon_NE": "canon (NE)",
    "struct.canon_NW": "canon (NW)",
    "struct.canon_SE": "canon (SE)",
    "struct.canon_SW": "canon (SW)",
    "struct.node": "Node",
    "struct.tower": "Tower",
    "struct.special_objective": "Special objective",
    "side.camp_1": "Defense camp",
    "side.camp_2": "Attack camp",
    "col.rubbleMarches": "Marches",
    "col.attackScore": "Attack score",
    "col.avgAttackDistance": "Avg. target distance",
    "col.avgAttackScorePerHit": "Avg. points per attack",
    "attackScore.note": "How the attack score is calculated: ① distance = the straight-line distance between the attack target's coordinates and the capitol's coordinates. ② weight = max(0, 1 − distance ÷ the farthest recorded attack-target distance in this file). ③ attack score = the sum of the weight (②) for every landed base attack, win or lose. A hit right next to capitol is worth close to 1.0 point; a hit at the farthest recorded distance is worth close to 0. Compare it against total activity score / base attack count to spot players racking up numbers by hitting undefended bases far from the front line.",
    "attackScore.noDistance": "This file has no target coordinate data, so distance weighting isn't possible. The attack score instead falls back to a plain count of landed base attacks (win or lose).",
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
    "loading.message": "加载中…",
    "upload.parseError": "Excel解析失败：{msg}",
    "upload.presetDividerText": "或",
    "filters.side": "阵营",
    "filters.sideAll": "全部",
    "filters.sideAria": "阵营筛选",
    "filters.server": "服务器",
    "filters.serverAll": "全部",
    "filters.focusAlliance": "关注联盟",
    "filters.focusNone": "（未选择）",
    "filters.summary": "显示 {shown} / {total} 个联盟",
    "tabs.overview": "概况",
    "tabs.ranking": "联盟排名",
    "tabs.members": "成员参与度（领导视角）",
    "unknown": "未知",
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
    "overview.showTable": "查看表格",
    "overview.timeColumn": "时间",
    "ranking.title": "联盟综合贡献度评分",
    "ranking.sub": "按评分从高到低显示当前联盟。柱状图颜色代表阵营（见下方图例）。",
    "ranking.formulaPrefix": "综合评分 = ",
    "ranking.formulaSuffix": "（将3个项目分别以「本文件中前3名联盟的平均值」定为100分进行换算，再把这3项分数相加（合计上限大致在300分左右）。以前3名平均值为基准，而不是单纯的第1名，是为了避免某一个突出的联盟把其他所有联盟的分数都压低。如果第1名明显领先第2、3名，该项分数也可能超过100分。参与人数越多的联盟，各项合计自然越高，分数也更容易上升。参与人数本身不作为评分项目）。",
    "ranking.formulaNote2": "据点行动将capitol与canon×4不分种类均等合计（不特别优待capitol）。瓦砾清除没有坐标数据，因此不考虑距离（只是单纯的清除数量）。传送次数体现的是活跃度而非战斗贡献，因此不计入评分。",
    "ranking.chartMetric": "图表显示的数据",
    "ranking.noAlliances": "没有可显示的联盟。",
    "ranking.detailTitle": "各联盟详细数据",
    "ranking.detailSub": "点击列标题可排序。「据点行动」为capitol・canon×4的合计（明细请查看上方图表的提示框）。",
    "ranking.structureContestTitle": "按设施划分的争夺情况",
    "ranking.structureContestSub": "圆点大小/颜色表示该设施的活跃程度及占优势的联盟。点击可查看该设施防守+攻击动作数最多的前8个联盟。",
    "ranking.structureContestTotal": "总动作数",
    "tt.totalScore": "综合评分",
    "tt.structureActionsTotal": "据点行动合计",
    "tt.breakdown": "　明细：{structure}",
    "tt.baseAttacksWinRate": "基地攻击",
    "tt.rubbleClears": "瓦砾清除",
    "tt.participants": "参与人数",
    "tt.refTeleports": "（参考）传送次数",
    "col.alliance": "联盟",
    "col.side": "阵营",
    "col.server": "服务器",
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
    "members.searchPlaceholder": "按玩家名搜索",
    "members.csvExport": "导出CSV",
    "export.textExport": "导出文本",
    "export.countPlaceholder": "件数（留空为全部）",
    "export.copy": "复制",
    "export.copied": "已复制",
    "export.copyManual": "已选中，请按Ctrl/Cmd+C复制",
    "export.rankingTitle": "{metric}排行榜",
    "export.includeDetail": "包含排名和数值",
    "export.lineWithValue": "第{rank}名 {name}　{value}",
    "unit.points": "分",
    "unit.times": "次",
    "unit.people": "人",
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
    "col.refRalliesOpened": "（参考）集结开始次数",
    "col.refRalliesJoined": "（参考）集结加入次数",
    "col.refRallyActions": "（参考）集结相关行动次数",
    "struct.capitol": "capitol",
    "struct.canon_NE": "canon（东北）",
    "struct.canon_NW": "canon（西北）",
    "struct.canon_SE": "canon（东南）",
    "struct.canon_SW": "canon（西南）",
    "struct.node": "据点（node）",
    "struct.tower": "塔（tower）",
    "struct.special_objective": "特殊目标",
    "side.camp_1": "防守阵营",
    "side.camp_2": "进攻阵营",
    "col.rubbleMarches": "行军数",
    "col.attackScore": "攻击评分",
    "col.avgAttackDistance": "目标平均距离",
    "col.avgAttackScorePerHit": "每次攻击平均得分",
    "attackScore.note": "攻击评分的计算方法：①距离 = 攻击目标坐标与capitol坐标之间的直线距离。②权重 = max(0, 1 − 距离 ÷ 本文件中记录的攻击目标最大距离)。③攻击评分 = 每次命中的基地攻击的权重（②）之和（不论输赢，全部计入）。越靠近capitol攻击，单次最高可接近1.0分；攻击本文件记录中最远的位置，则接近0分。可与综合活动评分・基地攻击数对比，识别是否有人只靠攻击远离前线的无防守基地来刷数据。",
    "attackScore.noDistance": "此文件不包含目标坐标数据，因此无法进行距离加权。攻击评分改为直接使用命中的基地攻击次数（不论输赢）。",
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

/** Full-screen spinner for the read -> parse -> render stretch after picking a file, which
 *  can take a few seconds for a large export. Idempotent both ways, so every exit path
 *  (success, error, early return) can just call hideLoading() without tracking state. */
function showLoading() {
  const host = $("#loading-overlay");
  if (!host) return;
  $("#loading-message").textContent = t("loading.message");
  host.hidden = false;
}
function hideLoading() {
  const host = $("#loading-overlay");
  if (host) host.hidden = true;
}
/** Resolves after the browser has actually painted the current DOM. The parse below is
 *  synchronous and blocks the main thread, so without this the spinner would be queued
 *  but never drawn before that work starts. */
function nextPaint() {
  return new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
}

function handleFile(file) {
  uploadError.style.display = "none";
  if (!/\.xlsx$/i.test(file.name)) {
    showUploadError(t("upload.invalidFile"));
    return;
  }
  showLoading();
  const reader = new FileReader();
  reader.onerror = () => { hideLoading(); showUploadError(t("upload.readError")); };
  reader.onload = (e) => loadWorkbookArrayBuffer(e.target.result, file.name);
  reader.readAsArrayBuffer(file);
}

/** Shared by both manual upload (via handleFile/FileReader above) and the bundled-preset
 *  button below — same parse-and-boot path either way, just a different source for the
 *  raw bytes. */
async function loadWorkbookArrayBuffer(arrayBuffer, fileName) {
  showLoading();
  try {
    await nextPaint();
    const wb = XLSX.read(arrayBuffer, { type: "array", cellDates: true });
    const raw = normalizeWorkbook(wb);
    bootDashboard(raw, fileName);
  } catch (err) {
    console.error(err);
    showUploadError(t("upload.parseError", { msg: err && err.message ? err.message : String(err) }));
  } finally {
    hideLoading();
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
        showLoading();
        try {
          const fileRes = await fetch(`/api/files/${encodeURIComponent(entry.name)}`);
          if (!fileRes.ok) throw new Error(`HTTP ${fileRes.status}`);
          const buf = await fileRes.arrayBuffer();
          await loadWorkbookArrayBuffer(buf, entry.name);
        } catch (err) {
          console.error(err);
          showUploadError(t("upload.parseError", { msg: err && err.message ? err.message : String(err) }));
        } finally {
          hideLoading();
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
  // 12 rows, not 5: the "Final Players" sheet leads with a title + a couple of prose
  // description rows plus a one-row summary table before its real per-player header.
  for (let i = 0; i < Math.min(rows.length, 12); i++) {
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
/** Boolean-ish flag columns (attacker_won, completion, isbattlefail, …) come through as a
 *  real boolean in some exports and as a string in others — and the string's casing isn't
 *  even consistent across exporters ("TRUE", "True"), so compare case-insensitively rather
 *  than against one exact string. */
function isTrueFlag(v) { return v === true || (typeof v === "string" && v.trim().toUpperCase() === "TRUE"); }
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

/** "Goldvein" events (as opposed to SVS) pool many servers into 2 "camps" and use an
 *  entirely different export shape — detected by the presence of an "all_observed" sheet,
 *  which has no SVS equivalent. Note this is purely about which *sheets* to read (the only
 *  parser that understands "all_observed"/"structures_actions"/etc. at all); see
 *  isGoldveinCampFile below for the separate question of which *display* behavior to use —
 *  a plain two-side SVS war can be exported in this same sheet shape too. */
function isGoldveinFormat(wb) {
  return !!findSheetName(wb, ["all_observed"]);
}

/** Whether to treat this file as a true multi-server "camp" event for display purposes
 *  (the per-server filter/column, chiefly) rather than a plain two-side SVS war that
 *  happens to share Goldvein's sheet shape — decided by filename, per the alliance: a
 *  "svs-..."-named file is a simple pairing even when its export has incidental stray
 *  rows from a handful of other servers (allied reinforcements, scouts, etc.), which would
 *  otherwise populate model.meta.servers and show a working-but-misleading Server filter.
 *  Only meaningful when isGoldveinFormat(wb) is also true — ignored for the classic SVS
 *  sheet shape, which never sets a server field regardless. */
function isGoldveinCampFile(fileName) {
  return /^goldvein/i.test((fileName || "").trim());
}

/** Goldvein's own data has no human-readable structure names, only raw coordinates — this
 *  map (target_x,target_y -> in-game name) was worked out by hand against an actual
 *  export, given directly by the alliance. Node coordinates cover all 24 of the "A/B/G/H"
 *  point clusters; tower coordinates cover all 8 "*C-*" points. Keyed by "x,y" using
 *  whatever exact numbers this file's own structures_actions sheet contains — if a future
 *  export shifts these slightly, an unmapped point still shows fine (see
 *  normalizeGoldveinWorkbook), just under its raw structure id instead of a friendly name. */
const GOLDVEIN_STRUCTURE_NAMES = {
  "100,99": "G-4", "200,99": "G-5", "300,99": "G-6",
  "100,199": "G-3", "200,199": "G-1",
  "100,299": "G-2",
  "100,699": "A-6",
  "100,799": "A-5", "200,799": "A-1",
  "100,899": "A-2", "200,899": "A-3", "300,899": "A-4",
  "700,99": "H-4", "800,99": "H-5", "900,99": "H-6",
  "800,199": "H-1", "900,199": "H-3",
  "900,299": "H-2",
  "700,899": "B-2", "800,899": "B-3", "900,899": "B-4",
  "800,799": "B-1", "900,799": "B-5",
  "900,699": "B-6",
  "200,183": "GC-1", "200,215": "GC-2",
  "200,783": "AC-2", "200,815": "AC-1",
  "800,183": "HC-2", "800,215": "HC-1",
  "800,783": "BC-2", "800,815": "BC-1",
  // Confirmed for the 9/12 event, whose map uses an entirely different coordinate layout
  // from 9/5's above — these keys only ever match that file, harmlessly falling through
  // to the raw structure id for any other file (see the comment on this map's use below).
  // Coordinates as given by the alliance are consistently 1 less on x than this export's
  // own target_x (y always matched exactly) — confirmed repeatedly (FI-1 at "583,399"
  // read in-game vs. this file's actual 584,399; then again across all 18 points below),
  // so every x here is the given value + 1.
  "584,599": "DI-1", "384,599": "CI-1", "384,399": "EI-1", "584,399": "FI-1",
  // D/C/E/F zones' remaining node/canon points (mirrors the G/H/A/B zones' own
  // node-cluster-plus-canon-pair shape above), given 9/12 only so far.
  "300,399": "E2", "300,299": "E3", "400,399": "E1", "400,299": "E4",
  "400,415": "EC-1", "400,383": "EC-2",
  "300,699": "C2", "300,599": "C4", "400,699": "C3", "400,599": "C1",
  "400,615": "CC-1", "400,583": "CC-2",
  "600,599": "D-1", "600,615": "DC-1", "600,583": "DC-2",
  "600,399": "F-1", "600,415": "FC-1", "600,383": "FC-2",
  "600,699": "D2", "700,699": "D3", "700,599": "D4",
  "700,399": "F2", "700,299": "F4", "600,299": "F3",
  // Center of the map, given for the final-week event (same x+1 rule as above). This is
  // the ordinary capitol (not a distinct named landmark, despite how the alliance first
  // described it) — using the literal string "capitol" here, same as the classic SVS
  // shape, is what lets buildModel's capitol-detection (distance-weighted attack score,
  // the capitol contest-over-time chart) recognize it; struct.capitol already translates
  // it for display.
  "500,499": "capitol",
  "509,508": "LC-2", "491,508": "LC-1", "491,490": "LC-3", "509,490": "LC-4",
  "475,474": "LI-2", "525,524": "LI-1",
};

/** Coordinates confirmed by the alliance to be a different, unrelated event's boss
 *  ("special_objective" in structure_type, same as the real structures above it shares
 *  that type with) rather than a real inter-alliance contest point — excluded entirely
 *  from structures parsing below, one file's boss coordinate at a time. structure_type
 *  alone isn't a safe way to detect this: the 9/12 event tagged 4 *real* contest
 *  structures (see DI-1/CI-1/EI-1/FI-1 above) with the exact same "special_objective"
 *  type as its boss, so only the specific coordinate is trustworthy. */
const GOLDVEIN_BOSS_COORDS = new Set(["526,670", "501,670"]);

/** Known limitations versus the SVS format, found by inspecting an actual export: no
 *  reliable wall-clock time anywhere (every timestamp-shaped column turned out to be
 *  either a relative mm:ss-style string or one identical placeholder value repeated on
 *  every row, not real elapsed/clock time) — so every *Minute field here is null, and the
 *  Overview tab's time-of-day activity chart and the event's reported time range won't be
 *  meaningful for these files. There's also no old-name/rename-tracking sheet at all
 *  (unlike SVS's Final Players/combatants/rallies old_name columns), so a renamed player
 *  can't be resolved here the way one can for SVS — names are taken at face value.
 *  Structures are many small "tower"/"node" points scattered per server rather than one
 *  shared capitol, so no capitol coordinate is ever set here — attack score therefore
 *  always falls back to a plain landed-attack count for these files, the same fallback an
 *  SVS file with no coordinates gets (see hasCoordinateData in buildModel). */
function normalizeGoldveinWorkbook(wb) {
  const movSheet = findSheetName(wb, ["base_movements"]);
  const structSheet = findSheetName(wb, ["structures_actions"]);
  const hitsSheet = findSheetName(wb, ["base_attack_results"]);
  const rubbleSheet = findSheetName(wb, ["rubble_hits"]);
  const marchSheet = findSheetName(wb, ["base_attack_marches"]);

  const movements = rowsToObjects(sheetToRows(wb, movSheet), ["event", "player_name"]).map(r => ({
    time: null,
    minute: null,
    event: normStr(r.event),
    player: normName(r.player_name),
    alliance: normStr(r.alliance),
    side: normStr(r.camp),
    server: sideStr(r.server),
    x: Number(r.to_x), y: Number(r.to_y),
  }));

  // See GOLDVEIN_BOSS_COORDS — drops just that one unrelated-event boss point, never
  // counted toward structureActions or the per-structure breakdown, while keeping every
  // other row (including same-typed real structures at other coordinates).
  const structures = rowsToObjects(sheetToRows(wb, structSheet), ["player_name", "structure"])
    .filter(r => !GOLDVEIN_BOSS_COORDS.has(`${Number(r.target_x)},${Number(r.target_y)}`))
    .map(r => {
      const targetX = Number(r.target_x), targetY = Number(r.target_y);
      return {
        dispatchMinute: null,
        player: normName(r.player_name),
        alliance: normStr(r.alliance),
        side: normStr(r.camp),
        server: sideStr(r.server),
        // The specific point (e.g. "G-1", "AC-2") when known — see
        // GOLDVEIN_STRUCTURE_NAMES — else the raw structure id as a fallback.
        structure: GOLDVEIN_STRUCTURE_NAMES[`${targetX},${targetY}`] || normStr(r.structure),
        // "reinforce" (defense) / "attack", "rally_attack" (offense) / "scout"
        // (uncounted) — recognized alongside the SVS action strings in buildModel's
        // isDefense/isAttack.
        action: normStr(r.action),
        targetX, targetY,
        arriveMinute: null,
        endMinute: null,
        outcome: null,
        isBattleFail: false,
      };
    });

  const baseHits = rowsToObjects(sheetToRows(wb, hitsSheet), ["victim_name", "attacker_name"]).map(r => ({
    minute: null,
    victim: normName(r.victim_name),
    victimAlliance: normStr(r.victim_alliance),
    victimSide: normStr(r.victim_camp),
    victimServer: sideStr(r.victim_server),
    targetX: r.target_x != null ? Number(r.target_x) : null,
    targetY: r.target_y != null ? Number(r.target_y) : null,
    attacker: normName(r.attacker_name),
    attackerAlliance: normStr(r.attacker_alliance),
    attackerSide: normStr(r.attacker_camp),
    attackerServer: sideStr(r.attacker_server),
    attackerX: r.start_x != null ? Number(r.start_x) : null,
    attackerY: r.start_y != null ? Number(r.start_y) : null,
    attackerWon: isTrueFlag(r.attacker_won),
  }));

  // rubble_hits is one row per durability-removal tick, not one row per player like the
  // SVS rubbles sheet — aggregate it into that same per-player shape here.
  // "clearingMarches" has no direct equivalent in this format; the tick count stands in
  // for it (a reference-only field — it isn't scored — so the imprecision is harmless).
  const rubbleByPlayer = new Map();
  rowsToObjects(sheetToRows(wb, rubbleSheet), ["alliance", "player_name"]).forEach(r => {
    const alliance = normStr(r.alliance);
    const player = normName(r.player_name);
    if (!alliance || !player) return;
    const key = alliance + "||" + player;
    if (!rubbleByPlayer.has(key)) {
      rubbleByPlayer.set(key, { player, alliance, side: normStr(r.camp), server: sideStr(r.server), clearingMarches: 0, completedClears: 0 });
    }
    const acc = rubbleByPlayer.get(key);
    acc.clearingMarches += 1;
    if (isTrueFlag(r.completion)) acc.completedClears += 1;
  });

  // Rally-tagged base-attack marches: by far the bulk of rally involvement in this format
  // (hundreds per event, vs. a handful of rally_attack rows on structures) — one row per
  // participant, with no starter/joiner distinction. Feeds buildModel's rallyActions.
  const rallyMarches = rowsToObjects(sheetToRows(wb, marchSheet), ["attack_type", "player_name"])
    .filter(r => normStr(r.attack_type) === "rally_attack")
    .map(r => ({ player: normName(r.player_name), alliance: normStr(r.alliance) }));

  // No rallies/teleports/marches summary sheets exist in this export format.
  return { movements, structures, baseHits, rubbles: Array.from(rubbleByPlayer.values()), teleports: [], marches: [], rallies: [], rallyMarches };
}

function normalizeWorkbook(wb) {
  if (isGoldveinFormat(wb)) return normalizeGoldveinWorkbook(wb);

  const movSheet = findSheetName(wb, ["movements", "movement"]);
  const structSheet = findSheetName(wb, ["structures", "structure"]);
  const hitsSheet = findSheetName(wb, ["base_hits", "base hits", "hits"]);
  const rubbleSheet = findSheetName(wb, ["rubbles", "rubble"]);
  const teleSheet = findSheetName(wb, ["teleports", "teleport"]);
  const marchSheet = findSheetName(wb, ["marches", "march"]);
  const finalPlayersSheet = findSheetName(wb, ["final players"]);
  const ralliesSheet = findSheetName(wb, ["rallies"]);
  const rallies1Sheet = findSheetName(wb, ["rallies1"]);
  // "combatants" (older) / "combatants_v2" (current) are the successors to the "Final
  // Players" summary sheet in newer exports of this log — same old_name/current_name/
  // alliance shape, different sheet name and column headers. Both are tried (in addition
  // to "final players") since either might be the one present in a given export.
  const combatantsSheets = [findSheetName(wb, ["combatants_v2"]), findSheetName(wb, ["combatants"])].filter(Boolean);

  // --- Name canonicalization -------------------------------------------------------
  // Some SVS events end in a mass rename: everyone switches to an unreadable string of
  // lookalike characters for the final push on capitol, so a player's early-game rows
  // and late-game rows would otherwise land under two different name strings and get
  // counted as two different people. The current export format directly names the
  // culprit on the affected row itself — movements/structures/base_hits/rallies each
  // carry their own player_old_name (or victim_old_name / attacker_old_name /
  // starter_old_name / join_N_old_name) column, which is ground truth for that one row
  // and always wins over any inferred mapping below. Older exports don't have that column
  // at all, so this whole block is a fallback for them: wherever a summary sheet ("Final
  // Players", "combatants"/"combatants_v2", or rallies1) already recorded an old<->new
  // pair, or wherever any row above did, learn it so any OTHER occurrence of the same
  // new/garbled name (e.g. on the rubbles sheet, which has no old_name column of its own
  // in any known export) still resolves. Only pairs where both names are known and differ
  // are recorded; a name with no known old form is left as-is (it's genuinely
  // unrecoverable from this file, not a bug).
  const nameCanon = new Map();
  function learnName(oldName, newName) {
    const o = normStr(oldName), n = normStr(newName);
    if (o && n && o !== n) nameCanon.set(n, o);
  }
  const finalPlayersRows = rowsToObjects(sheetToRows(wb, finalPlayersSheet), ["old name", "new name"]);
  finalPlayersRows.forEach(r => learnName(r["old name"], r["new name"]));
  const combatantsRows = combatantsSheets.flatMap(name => rowsToObjects(sheetToRows(wb, name), ["old_name", "current_name"]));
  combatantsRows.forEach(r => learnName(r.old_name, r.current_name));
  const ralliesRows = rowsToObjects(sheetToRows(wb, ralliesSheet), ["starter_name"]);
  ralliesRows.forEach(r => {
    learnName(r.starter_old_name, r.starter_name);
    for (let i = 1; i <= 5; i++) learnName(r[`join_${i}_old_name`], r[`join_${i}`]);
  });
  const rallies1Rows = rowsToObjects(sheetToRows(wb, rallies1Sheet), ["player_old_name"]);
  rallies1Rows.forEach(r => learnName(r.player_old_name, r.player));
  const movementsRows = rowsToObjects(sheetToRows(wb, movSheet), ["event", "player"]);
  movementsRows.forEach(r => learnName(r.player_old_name, r.player_name));
  const structuresRows = rowsToObjects(sheetToRows(wb, structSheet), ["player", "structure"]);
  structuresRows.forEach(r => learnName(r.player_old_name, r.player_name));
  const baseHitsRows = rowsToObjects(sheetToRows(wb, hitsSheet), ["victim", "attacker"]);
  baseHitsRows.forEach(r => {
    learnName(r.victim_old_name, r.victim_name);
    learnName(r.attacker_old_name, r.attacker_name);
  });

  // A player's numeric ID, used as their display name, can get *doubly* mangled: Excel
  // stores the raw number, then a later export step (seen on the rubbles sheet) renders
  // it in scientific notation as plain text (e.g. "1.42E+15"), keeping only ~3 significant
  // digits. "Final Players" and rallies1 sometimes have the same identity at full
  // precision (as an actual number, paired with a real old name and an alliance) — round
  // it the same way Excel would and, where exactly one known player rounds to a given
  // string, learn that string as another alias for them. Where two different players
  // round to the same string, try their alliance as a tiebreaker instead (the rubbles row
  // carries its own alliance too): if only one of the colliding candidates shares that
  // alliance, it's still a safe match. Only when even that's ambiguous (two colliding
  // candidates in the same alliance) is it left alone, rather than risking crediting the
  // wrong person.
  function excelSci2(n) {
    return typeof n === "number" && isFinite(n) && Math.abs(n) >= 1e10 ? n.toExponential(2).toUpperCase() : null;
  }
  const sciByAlliance = new Map(); // rounded string -> Map(alliance -> Set of candidate old names)
  function noteSciCandidates(old, alliance, values) {
    if (!old) return;
    values.forEach(val => {
      const sci = excelSci2(val);
      if (!sci) return;
      if (!sciByAlliance.has(sci)) sciByAlliance.set(sci, new Map());
      const byAlliance = sciByAlliance.get(sci);
      if (!byAlliance.has(alliance)) byAlliance.set(alliance, new Set());
      byAlliance.get(alliance).add(old);
    });
  }
  finalPlayersRows.forEach(r => {
    noteSciCandidates(normStr(r["old name"]), normStr(r["alliance"]), [r["old name"], r["new name"]]);
  });
  combatantsRows.forEach(r => {
    noteSciCandidates(normStr(r.old_name), normStr(r.alliance), [r.old_name, r.current_name]);
  });
  rallies1Rows.forEach(r => {
    noteSciCandidates(normStr(r.player_old_name), normStr(r.alliance), [r.player_old_name, r.player]);
  });
  movementsRows.forEach(r => {
    noteSciCandidates(normStr(r.player_old_name), normStr(r.alliance), [r.player_old_name, r.player_name]);
  });
  structuresRows.forEach(r => {
    noteSciCandidates(normStr(r.player_old_name), normStr(r.alliance), [r.player_old_name, r.player_name]);
  });
  baseHitsRows.forEach(r => {
    noteSciCandidates(normStr(r.victim_old_name), normStr(r.victim_alliance), [r.victim_old_name, r.victim_name]);
    noteSciCandidates(normStr(r.attacker_old_name), normStr(r.attacker_alliance), [r.attacker_old_name, r.attacker_name]);
  });
  const sciAllianceCanon = new Map(); // "alliance||rounded string" -> old name
  sciByAlliance.forEach((byAlliance, sci) => {
    const allOld = new Set();
    byAlliance.forEach(names => names.forEach(n => allOld.add(n)));
    if (allOld.size === 1) { learnName(Array.from(allOld)[0], sci); return; }
    byAlliance.forEach((names, alliance) => {
      if (names.size === 1 && alliance) sciAllianceCanon.set(alliance + "||" + sci, Array.from(names)[0]);
    });
  });

  function canon(name, alliance) {
    if (name == null) return name;
    if (nameCanon.has(name)) return nameCanon.get(name);
    if (alliance) {
      const resolved = sciAllianceCanon.get(alliance + "||" + name);
      if (resolved) return resolved;
    }
    return name;
  }

  // A row's own *_old_name column (where the export format has one) is ground truth for
  // that specific row and always wins; canon() — the inferred, cross-sheet map built
  // above — is only a fallback for rows/sheets that don't carry their own old_name at all
  // (e.g. every row of the rubbles sheet, in every export seen so far).
  function resolveName(rawVal, oldVal, alliance) {
    const old = normStr(oldVal);
    return old || canon(normName(rawVal), alliance);
  }

  const movements = movementsRows.map(r => {
    const alliance = normStr(r.alliance);
    return {
      time: toDateOrNull(r.time_local),
      minute: timeOfDayMinutes(r.time_local),
      event: normStr(r.event),
      player: resolveName(r.player_name, r.player_old_name, alliance),
      alliance,
      side: sideStr(r.side),
      x: Number(r.x ?? r["x"]), y: Number(r.y ?? r["y"]),
    };
  });

  const structures = structuresRows.map(r => {
    const alliance = normStr(r.alliance);
    return {
      dispatchMinute: timeOfDayMinutes(r.dispatch_time),
      player: resolveName(r.player_name, r.player_old_name, alliance),
      alliance,
      side: sideStr(r.side),
      structure: normStr(r.structure),
      action: normStr(r.action),
      targetX: Number(r.target_x), targetY: Number(r.target_y),
      arriveMinute: timeOfDayMinutes(r.arrive_time),
      endMinute: timeOfDayMinutes(r.end_time),
      outcome: normStr(r.outcome),
      isBattleFail: isTrueFlag(r.isbattlefail),
    };
  });

  // target_x/target_y (the victim base's coordinates) and attacker_x/attacker_y are a
  // newer addition to this sheet — older exports won't have them, so these come through
  // as null and every distance-based feature below degrades to "unknown" rather than
  // erroring.
  const baseHits = baseHitsRows.map(r => {
    const victimAlliance = normStr(r.victim_alliance);
    const attackerAlliance = normStr(r.attacker_alliance);
    return {
      minute: timeOfDayMinutes(r.time_local),
      victim: resolveName(r.victim_name, r.victim_old_name, victimAlliance),
      victimAlliance,
      victimSide: sideStr(r.victim_side),
      targetX: r.target_x != null ? Number(r.target_x) : null,
      targetY: r.target_y != null ? Number(r.target_y) : null,
      attacker: resolveName(r.attacker_name, r.attacker_old_name, attackerAlliance),
      attackerAlliance,
      attackerSide: sideStr(r.attacker_side),
      attackerX: r.attacker_x != null ? Number(r.attacker_x) : null,
      attackerY: r.attacker_y != null ? Number(r.attacker_y) : null,
      attackerWon: isTrueFlag(r.attacker_won),
    };
  });

  // The rubbles sheet's columns have been renamed across exports of this log (older
  // files used name/clearing_marches/completed_clears; newer ones use
  // player/marches_sent/completions plus extra detail columns) — read either name so
  // both old and new files work. Only "alliance" is required to find the header row,
  // since the name column itself is the part that renamed. No known export of this sheet
  // has its own old_name column, so it always relies on canon() (built above from every
  // other sheet's old_name data, plus any summary sheet).
  const rubbles = rowsToObjects(sheetToRows(wb, rubbleSheet), ["alliance"]).map(r => {
    const alliance = normStr(r.alliance);
    return {
      player: canon(normName(r.name ?? r.player), alliance),
      alliance,
      side: sideStr(r.side),
      clearingMarches: Number(r.clearing_marches ?? r.marches_sent) || 0,
      completedClears: Number(r.completed_clears ?? r.completions) || 0,
    };
  });

  // rallies: reference-only stats (see buildModel) — a rally's starter carries an
  // alliance, but joiners don't get their own alliance column in this sheet, so joiners
  // are attributed to the starter's alliance (rallies are alliance-internal groups).
  // Only the first 5 named joiners are ever recorded by this log format; participantCount
  // on the raw sheet still reflects the true total.
  const rallies = ralliesRows.map(r => {
    const starterAlliance = normStr(r.starter_alliance);
    const joiners = [];
    for (let i = 1; i <= 5; i++) {
      const name = resolveName(r[`join_${i}`], r[`join_${i}_old_name`], starterAlliance);
      if (name) joiners.push(name);
    }
    return {
      minute: timeOfDayMinutes(r.start_time),
      starter: resolveName(r.starter_name, r.starter_old_name, starterAlliance),
      starterAlliance,
      side: sideStr(r.side),
      joiners,
    };
  });

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

  return { movements, structures, baseHits, rubbles, teleports, marches, rallies };
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

  // A Goldvein file's "side" (camp) pools several servers together (see isGoldveinFormat)
  // — this tracks the finer-grained server per alliance the same way allianceSide tracks
  // camp, so the UI can offer an optional server-level filter on top of the side one.
  // Stays null throughout for a format that never sets a server field (SVS), since vote()
  // is a no-op without one.
  const serverVotes = new Map();
  function voteServer(alliance, server) {
    if (!alliance || !server) return;
    if (!serverVotes.has(alliance)) serverVotes.set(alliance, {});
    const o = serverVotes.get(alliance);
    o[server] = (o[server] || 0) + 1;
  }
  raw.movements.forEach(m => voteServer(m.alliance, m.server));
  raw.structures.forEach(s => voteServer(s.alliance, s.server));
  raw.baseHits.forEach(b => { voteServer(b.attackerAlliance, b.attackerServer); voteServer(b.victimAlliance, b.victimServer); });
  raw.rubbles.forEach(r => voteServer(r.alliance, r.server));
  const allianceServer = new Map();
  serverVotes.forEach((o, alliance) => {
    const servers = Object.keys(o).sort((a, b) => o[b] - o[a]);
    allianceServer.set(alliance, servers[0] || null);
  });

  function newAllianceAcc(alliance) {
    return {
      alliance, side: allianceSide.get(alliance) || null, server: allianceServer.get(alliance) || null,
      participants: new Set(),
      defenseActions: 0, attackActions: 0, capitolActions: 0, withdraws: 0,
      attacksLanded: 0, attacksWon: 0, attacksTaken: 0, attacksTakenLost: 0,
      rubbleClears: 0, rubbleMarches: 0,
      teleportPlayers: 0, marchesTotal: 0, marchPlayers: 0,
      forcedRelocations: 0, teleportIns: 0,
      structureBreakdown: {},
      attackScore: 0, attackDistSum: 0, attackScoreHits: 0,
      ralliesOpened: 0, ralliesJoined: 0, rallyActions: 0,
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
      ralliesOpened: 0, ralliesJoined: 0, rallyActions: 0,
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
  // Some exports of base_hits carry no target coordinates at all (an older/reduced log
  // format, unrelated to whether names got renamed) — in that case every distance below
  // comes back null, and the attack score falls back to a flat +1 per landed attack
  // instead of silently scoring 0 for everyone. See hasAttackDistanceData in the returned
  // meta, and where it's added per-hit below.
  const hasCoordinateData = capitolX != null && raw.baseHits.some(b => b.targetX != null && b.targetY != null);
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

  let minMinute = Infinity, maxMinute = -Infinity;
  raw.movements.forEach(m => {
    if (m.minute != null) { minMinute = Math.min(minMinute, m.minute); maxMinute = Math.max(maxMinute, m.minute); }
    const aAcc = getAlliance(m.alliance);
    if (aAcc && m.player) aAcc.participants.add(m.player);
    const pAcc = getPlayer(m.alliance, m.player);
    if (m.event === "teleport_in") { if (aAcc) aAcc.teleportIns++; if (pAcc) pAcc.teleportIns++; }
    else if (m.event === "relocate") { if (pAcc) pAcc.relocates++; }
    else if (m.event === "forced_relocation") { if (aAcc) aAcc.forcedRelocations++; if (pAcc) pAcc.forcedRelocations++; }
  });

  const capitolTimelineBuckets = new Map();
  // First-seen coordinate per named structure — a structure's position is fixed all day,
  // so this is just "remember where each name is" for renderStructureContestCard's map.
  // Not every export has usable coordinates on every row (SVS structures always do;
  // Goldvein's do too, since target_x/target_y survive into normalizeGoldveinWorkbook).
  const structureCoords = new Map();
  raw.structures.forEach(s => {
    const aAcc = getAlliance(s.alliance);
    if (aAcc && s.player) aAcc.participants.add(s.player);
    const pAcc = getPlayer(s.alliance, s.player);
    // Action strings have varied across exports of this log ("garrison_hold"/"garrison",
    // "reinforce_in"/"reinforce", "rally_in"/"rally" for SVS; "attack"/"rally_attack"/
    // "special_objective_attack" for Goldvein) — recognize every form seen so far.
    const isDefense = s.action === "garrison_hold" || s.action === "garrison" || s.action === "reinforce_in" || s.action === "reinforce";
    const isAttack = s.action === "rally_in" || s.action === "rally" || s.action === "attack" || s.action === "rally_attack" || s.action === "special_objective_attack";
    if (isDefense) { if (aAcc) aAcc.defenseActions++; if (pAcc) pAcc.defenseActions++; }
    if (isAttack) { if (aAcc) aAcc.attackActions++; if (pAcc) pAcc.attackActions++; }
    if (s.action === "withdraw" && aAcc) aAcc.withdraws++;
    // Goldvein has no rallies sheet at all (see normalizeGoldveinWorkbook), so unlike SVS
    // there's no way to tell a rally's starter from its joiners — this is a reference-only
    // stand-in for ralliesOpened/ralliesJoined below, counting every "rally_attack"-tagged
    // structure action (already counted in attackActions above) plus, further down, every
    // rally-tagged base-attack march (the bulk of it) so the member table isn't left
    // showing a flat 0 for rally involvement on these files.
    if (s.action === "rally_attack") { if (aAcc) aAcc.rallyActions++; if (pAcc) pAcc.rallyActions++; }
    // Informational only — capitol and the 4 canon points all count equally toward the
    // score via structureActions above; this breakdown is never separately weighted.
    // (No distance weighting here — see the note on attackScoreWeight() above.)
    if (s.structure && (isDefense || isAttack)) {
      if (aAcc) aAcc.structureBreakdown[s.structure] = (aAcc.structureBreakdown[s.structure] || 0) + 1;
      if (s.structure === "capitol") { if (aAcc) aAcc.capitolActions++; if (pAcc) pAcc.capitolActions++; }
      if (s.structure && !structureCoords.has(s.structure) && isFinite(s.targetX) && isFinite(s.targetY)) {
        structureCoords.set(s.structure, { x: s.targetX, y: s.targetY });
      }
    }

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
    } else if (!hasCoordinateData) {
      // This file has no target coordinates anywhere, so distance weighting isn't
      // possible at all — fall back to a flat +1 per landed attack rather than leaving
      // the whole attack-score axis at 0 for everyone.
      if (attAcc) attAcc.attackScore += 1;
      if (attP) attP.attackScore += 1;
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

  // Rallies opened/joined are reference-only counts, shown alongside teleport-ins on the
  // member table — like teleport-ins, they reflect presence/coordination rather than a
  // measurable contribution (a rally's actual damage is already captured via
  // structureActions/attackScore), so they deliberately don't feed into either score.
  // Deliberately a *lookup*, not getAlliance()/getPlayer(): a rally join alone shouldn't
  // conjure a new roster entry for someone who otherwise left no trace in this file — it
  // only adds the count onto an alliance/player who already exists from movements/
  // structures/base_hits/rubbles, so files with no rallies sheet (or an untouched one)
  // show exactly the same participant/player counts as before.
  raw.rallies.forEach(r => {
    const startAcc = allianceMap.get(r.starterAlliance) || null;
    const startP = startAcc && r.starter ? playerMap.get(r.starterAlliance + "||" + r.starter) || null : null;
    if (startAcc) startAcc.ralliesOpened++;
    if (startP) startP.ralliesOpened++;

    r.joiners.forEach(joiner => {
      const joinAcc = allianceMap.get(r.starterAlliance) || null;
      const joinP = joinAcc && joiner ? playerMap.get(r.starterAlliance + "||" + joiner) || null : null;
      if (joinAcc) joinAcc.ralliesJoined++;
      if (joinP) joinP.ralliesJoined++;
    });
  });

  // Goldvein's rally-tagged base-attack marches — lookup only, like the rallies loop above.
  (raw.rallyMarches || []).forEach(m => {
    const aAcc = allianceMap.get(m.alliance) || null;
    const pAcc = aAcc && m.player ? playerMap.get(m.alliance + "||" + m.player) || null : null;
    if (aAcc) aAcc.rallyActions++;
    if (pAcc) pAcc.rallyActions++;
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

  return {
    meta: {
      fileName,
      sides: sidesPresent,
      // See isGoldveinCampFile: a non-"goldvein"-named file keeps this empty regardless of
      // whatever stray server values its rows carry, so the Server filter/column stay
      // hidden — this is meant to be a simple two-side war, not a multi-server campaign.
      servers: isGoldveinCampFile(fileName)
        ? Array.from(new Set(Array.from(allianceServer.values()).filter(Boolean))).sort()
        : [],
      minMinute: isFinite(minMinute) ? minMinute : 0,
      maxMinute: isFinite(maxMinute) ? maxMinute : 24 * 60,
      totalParticipants: new Set(players.map(p => p.player)).size,
      totalBaseHits: raw.baseHits.length,
      totalAttackerWins: raw.baseHits.filter(b => b.attackerWon).length,
      hasAttackDistanceData: hasCoordinateData,
      // See the rallyActions comment above — true only for a format (Goldvein) that has
      // no real rallies sheet, so the member table shows the rallyActions stand-in column
      // instead of the (always-0-here) ralliesOpened/ralliesJoined pair.
      hasRallyActionData: raw.structures.some(s => s.action === "rally_attack") || (raw.rallyMarches || []).length > 0,
    },
    allianceSide, sideColors, alliances, players, capitolTimeline,
    structurePositions: Array.from(structureCoords, ([name, xy]) => ({ name, ...xy })),
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
/** Display label for a "side" value. Most files use a plain server number ("472"),
 *  shown as-is; a Goldvein file's side is "camp_1"/"camp_2" (see isGoldveinFormat), which
 *  get a translated label the same way structureLabel() handles a structure id. */
function sideLabel(side) {
  if (!side) return t("unknown");
  const dict = I18N[currentLang] || I18N.ja;
  return dict["side." + side] || side;
}

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

/** Shared by renderSortableTable's own row order and by any chart that wants to mirror
 *  a table's current sort (e.g. the Ranking tab's bar chart) — one comparator so the two
 *  can never disagree on tie-breaking or locale-aware string ordering. */
function sortRowsBy(rows, key, dir) {
  return rows.slice().sort((a, b) => {
    const av = a[key], bv = b[key];
    let cmp;
    if (typeof av === "string" || typeof bv === "string") cmp = String(av ?? "").localeCompare(String(bv ?? ""), NUMBER_LOCALES[currentLang] || "ja");
    else cmp = (av ?? -Infinity) - (bv ?? -Infinity);
    return dir === "asc" ? cmp : -cmp;
  });
}

/* ================= SORTABLE TABLE ================= */
function renderSortableTable(container, { columns, rows, rowClassFn, initialSort, onSort }) {
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
        const nextDir = sortKey === col.key ? (sortDir === "asc" ? "desc" : "asc") : (col.text ? "asc" : "desc");
        const nextKey = col.key;
        // When the caller wants to know about (and drive other UI off of) the active sort
        // column — e.g. the Ranking tab's chart — it owns the re-render instead of us.
        if (onSort) { onSort(nextKey, nextDir); return; }
        sortKey = nextKey; sortDir = nextDir;
        build();
      });
      headRow.appendChild(th);
    });
    thead.appendChild(headRow);
    table.appendChild(thead);

    const sorted = sortRowsBy(rows, sortKey, sortDir);

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

/** Adds a "how many" number input, a "include rank & value" checkbox, and a text-export
 *  button to `toolbar`, plus an (initially hidden) copyable textarea to `outHost`. Meant
 *  for pasting straight into an in-game mail announcing rankings — one line per row, in
 *  whatever order the table/chart is currently sorted by, so nobody has to hand-type
 *  names off the screen. `getTitle()` supplies the one line above the list that says
 *  what's being ranked; `getValueCol()` (optional) supplies the currently-sorted column's
 *  {format, unit} for the checkbox — when it's off, or no column is given, each line is
 *  just the name. */
function attachTextExport(toolbar, outHost, { getRows, nameKey, getTitle, getValueCol }) {
  toolbar.innerHTML = "";
  const countInput = el("input", { type: "number", min: "1", placeholder: t("export.countPlaceholder"), style: "width:64px" });
  toolbar.appendChild(countInput);

  const detailId = "export-detail-" + Math.random().toString(36).slice(2, 8);
  const detailCheckbox = el("input", { type: "checkbox", id: detailId });
  const detailLabel = el("label", { for: detailId, style: "display:inline-flex;align-items:center;gap:4px" }, [
    detailCheckbox, document.createTextNode(t("export.includeDetail")),
  ]);
  toolbar.appendChild(detailLabel);

  const btn = el("button", { class: "muted-btn" }, [t("export.textExport")]);
  toolbar.appendChild(btn);

  outHost.innerHTML = "";
  const out = el("div", { class: "text-export-out", hidden: true });
  const textarea = el("textarea", { readonly: true, rows: "10" });
  const outToolbar = el("div", { class: "toolbar", style: "margin-top:6px" });
  const copyBtn = el("button", { class: "muted-btn" }, [t("export.copy")]);
  const copyStatus = el("span", { class: "note" }, []);
  outToolbar.appendChild(copyBtn);
  outToolbar.appendChild(copyStatus);
  out.appendChild(textarea);
  out.appendChild(outToolbar);
  outHost.appendChild(out);

  btn.addEventListener("click", () => {
    const rows = getRows();
    const n = parseInt(countInput.value, 10);
    const limited = n > 0 ? rows.slice(0, n) : rows;
    const col = getValueCol ? getValueCol() : null;
    const lines = limited.map((r, i) => {
      const name = r[nameKey];
      if (!name) return null;
      if (!detailCheckbox.checked || !col) return name;
      const value = (col.format ? col.format(r[col.key], r) : String(r[col.key] ?? "")) + (col.unit || "");
      return t("export.lineWithValue", { rank: i + 1, name, value });
    }).filter(Boolean);
    textarea.value = [getTitle(), ...lines].join("\n");
    out.hidden = false;
    textarea.focus();
    textarea.select();
  });
  copyBtn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(textarea.value);
      copyStatus.textContent = t("export.copied");
    } catch (err) {
      textarea.focus();
      textarea.select();
      copyStatus.textContent = t("export.copyManual");
    }
    setTimeout(() => { copyStatus.textContent = ""; }, 2500);
  });
}

/* ================= DASHBOARD BOOT & FILTERS ================= */

const uiState = { side: "all", server: "all", focusAlliance: null, membersAlliance: null, membersSearch: "", rankingSort: { key: "score", dir: "desc" }, membersSort: { key: "totalActivity", dir: "desc" } };

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
    const b = el("button", { type: "button", "aria-pressed": uiState.side === opt ? "true" : "false" }, [opt === "all" ? t("filters.sideAll") : sideLabel(opt)]);
    b.addEventListener("click", () => {
      uiState.side = opt;
      $$("#side-filter button").forEach(btn => btn.setAttribute("aria-pressed", "false"));
      b.setAttribute("aria-pressed", "true");
      renderActiveTab();
    });
    sideFilterEl.appendChild(b);
  });

  // Only meaningful for a format where "side" pools several servers together (a Goldvein
  // camp — see isGoldveinFormat); stays hidden for a file where every alliance's server
  // is unknown (SVS never sets one, so model.meta.servers is empty there).
  const servers = model.meta.servers || [];
  const serverLabel = $("#server-filter-label");
  serverLabel.hidden = servers.length === 0;
  if (servers.length) {
    const serverSel = $("#server-filter");
    serverSel.innerHTML = "";
    serverSel.appendChild(el("option", { value: "all" }, [t("filters.serverAll")]));
    servers.forEach(s => serverSel.appendChild(el("option", { value: s }, [s])));
    serverSel.value = uiState.server;
    serverSel.addEventListener("change", () => {
      uiState.server = serverSel.value;
      renderActiveTab();
    });
  }

  const focusSel = $("#focus-alliance");
  focusSel.innerHTML = "";
  focusSel.appendChild(el("option", { value: "" }, [t("filters.focusNone")]));
  model.alliances.forEach(a => focusSel.appendChild(el("option", { value: a.alliance } , [`${a.alliance} (${sideLabel(a.side)})`])));
  focusSel.value = uiState.focusAlliance || "";
  focusSel.addEventListener("change", () => {
    uiState.focusAlliance = focusSel.value || null;
    if (uiState.focusAlliance) uiState.membersAlliance = uiState.focusAlliance;
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
  const filteredAlliances = model.alliances.filter(a =>
    (uiState.side === "all" || a.side === uiState.side) && (uiState.server === "all" || a.server === uiState.server));
  $("#filter-summary").textContent = t("filters.summary", { shown: fmt.format(filteredAlliances.length), total: fmt.format(model.alliances.length) });
  const tab = activeTabName();
  if (tab === "overview") renderOverviewTab(model, filteredAlliances);
  else if (tab === "ranking") renderRankingTab(model, filteredAlliances);
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

  // No capitol timestamps at all (e.g. a Goldvein file — see isGoldveinFormat) means
  // there's nothing honest to plot here, so the whole card is skipped rather than shown
  // with an empty chart inside it.
  if (model.capitolTimeline.length) {
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
    renderTimeSeriesChart(chartHost, { rows: model.capitolTimeline, xKey: "minute", seriesKeys, seriesColors, seriesLabels });

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

  // Per-structure contest breakdown: a Goldvein-only feature (its interactive per-point
  // map was built for Goldvein's many named structures) — not shown for a plain SVS war
  // even when, as in some files, it happens to share Goldvein's sheet shape and map
  // coordinates. See isGoldveinCampFile.
  if (isGoldveinCampFile(model.meta.fileName)) {
    const contestCard = renderStructureContestCard(model, alliances);
    if (contestCard) root.appendChild(contestCard);
  }
}

/* ================= RANKING TAB ================= */
function renderRankingTab(model, alliances) {
  const root = $("#tab-ranking");
  root.innerHTML = "";

  // Single source of truth for the detail table's columns, reused for the chart's own
  // metric picker below — so the two never drift out of sync, and adding/renaming a
  // column only ever needs to happen in one place.
  //
  // Total score sits right after the identity columns (not buried at the far right),
  // immediately followed by the 3 raw columns that are actually summed to make it — both
  // highlighted (see .col-total-score / .col-score-part in styles.css) — so it's visually
  // obvious which columns are "the formula" and which are just context.
  // Units for the text-export "include rank & value" option below — blank where a unit
  // wouldn't read naturally (rates already carry a "%" from fmtPct; alliance/side aren't
  // values at all).
  const U = { pts: t("unit.points"), times: t("unit.times"), people: t("unit.people") };
  const columns = [
    { key: "alliance", label: t("col.alliance"), text: true },
    { key: "side", label: t("col.side"), format: (v) => sideLabel(v) },
    // Only meaningful for a format where "side" pools several servers together (a
    // Goldvein camp) — omitted otherwise, same as the server filter (see setupFilters).
    ...((model.meta.servers || []).length ? [{ key: "server", label: t("col.server") }] : []),
    { key: "score", label: t("col.score"), format: (v) => v.toFixed(1), className: "col-total-score", unit: U.pts },
    { key: "structureActionsPoints", label: "+ " + t("col.structureActionsPoints"), format: (v) => (v || 0).toFixed(1), className: "col-score-part", unit: U.pts },
    { key: "attackScorePoints", label: "+ " + t("col.attackScorePoints"), format: (v) => (v || 0).toFixed(1), className: "col-score-part", unit: U.pts },
    { key: "rubbleClearsPoints", label: "+ " + t("col.rubbleClearsPoints"), format: (v) => (v || 0).toFixed(1), className: "col-score-part", unit: U.pts },
    { key: "participantCount", label: t("col.participantCount"), unit: U.people },
    { key: "structureActions", label: t("col.structureActions"), unit: U.times },
    { key: "attacksLanded", label: t("col.attacksLanded"), unit: U.times },
    { key: "attackWinRate", label: t("col.attackWinRate"), format: (v) => fmtPct(v ?? 0) },
    { key: "attackScore", label: t("col.attackScore"), format: (v) => (v || 0).toFixed(1), unit: U.pts },
    { key: "attacksTaken", label: t("col.attacksTaken"), unit: U.times },
    { key: "defenseHoldRate", label: t("col.defenseHoldRate"), format: (v) => fmtPct(v ?? 0) },
    { key: "rubbleClears", label: t("col.rubbleClears"), unit: U.times },
  ];
  // "side"/"server" are technically non-text columns (no format-as-number issue) but
  // their values are identifiers, not magnitudes — plotting either as a bar height would
  // be meaningless, so both are excluded here even though they're legitimate things to
  // sort the table by.
  const chartColumns = columns.filter(c => !c.text && c.key !== "side" && c.key !== "server");

  function setRankingSort(key, dir) {
    uiState.rankingSort = { key, dir };
    renderRankingTab(model, alliances);
  }

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
    model.meta.hasAttackDistanceData ? t("attackScore.note") : t("attackScore.noDistance"),
  ]));
  if (presentSides.length > 1 || presentSides.length === 0) {
    const legendWrap = el("div", {});
    renderLegend(legendWrap, (model.meta.sides.length ? model.meta.sides : presentSides).map(s => ({ label: sideLabel(s), color: sideColorVar(s) })));
    card.appendChild(legendWrap);
  }

  // The chart's metric always matches whichever data column is currently driving the
  // table's sort below (the same column the table itself pulls to the front — see
  // displayColumns() in renderSortableTable) — and can also be changed directly from this
  // dropdown, which drives the table's sort the same way clicking that column header would.
  // The table may currently be sorted by a column the chart can't plot (e.g. "side") —
  // in that case the chart just keeps showing its last valid metric (falling back to
  // score) rather than forcing the table's sort back to match it.
  const activeChartCol = chartColumns.find(c => c.key === uiState.rankingSort.key)
    || chartColumns.find(c => c.key === "score") || chartColumns[0];
  const chartControls = el("div", { class: "toolbar", style: "margin-bottom:8px" });
  const metricLabel = el("label", {}, [t("ranking.chartMetric") + " "]);
  const metricSel = el("select", {});
  chartColumns.forEach(c => {
    const opt = el("option", { value: c.key }, [c.label.replace(/^\+\s*/, "")]);
    if (c.key === activeChartCol.key) opt.selected = true;
    metricSel.appendChild(opt);
  });
  metricSel.addEventListener("change", () => setRankingSort(metricSel.value, "desc"));
  metricLabel.appendChild(metricSel);
  chartControls.appendChild(metricLabel);
  card.appendChild(chartControls);

  const chartHost = el("div", {});
  card.appendChild(chartHost);
  if (alliances.length) {
    // Same row order as the table below (same key + direction), not just the same metric
    // — so "who's on top" in the chart always matches "who's on top" in the table.
    const chartRows = sortRowsBy(alliances, uiState.rankingSort.key, uiState.rankingSort.dir);
    renderHBarChart(chartHost, {
      data: chartRows.map(a => ({ label: a.alliance, value: Number(a[activeChartCol.key]) || 0, color: sideColorVar(a.side) })),
      valueFormat: activeChartCol.format || ((v) => fmt.format(v)),
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
  const exportToolbar = el("div", { class: "toolbar", style: "margin-bottom:8px" });
  tableCard.appendChild(exportToolbar);
  const exportOutHost = el("div", {});
  tableCard.appendChild(exportOutHost);
  const tblHost = el("div", {});
  renderSortableTable(tblHost, {
    columns,
    rows: alliances,
    rowClassFn: (r) => r.alliance === uiState.focusAlliance ? "row-focus" : "",
    initialSort: uiState.rankingSort,
    onSort: setRankingSort,
  });
  tableCard.appendChild(tblHost);
  root.appendChild(tableCard);

  // Text export mirrors the table's current sort exactly (same helper the chart above
  // uses for its own row order) — one alliance name per line, ready to paste into an
  // in-game mail.
  const sortedRankingCol = () => columns.find(c => c.key === uiState.rankingSort.key) || columns[0];
  attachTextExport(exportToolbar, exportOutHost, {
    getRows: () => sortRowsBy(alliances, uiState.rankingSort.key, uiState.rankingSort.dir),
    nameKey: "alliance",
    getValueCol: sortedRankingCol,
    getTitle: () => t("export.rankingTitle", { metric: sortedRankingCol().label.replace(/^\+\s*/, "") }),
  });
}

/** Pivots each alliance's own structureBreakdown (structure name -> action count) into
 *  structure name -> alliance -> count, so it reads as "who's fighting over this specific
 *  point" rather than "what did this alliance fight over" — the Overview tab's stand-in
 *  for a time-of-day chart on a file with no reliable time data (a Goldvein file; see
 *  isGoldveinFormat), placed right where that chart would otherwise go.
 *
 *  When structure positions are known (model.structurePositions — every structure has one
 *  in practice, but an older export might not), this draws them as a small clickable map
 *  laid out like the real point layout, sized/colored by how much action each one has
 *  seen; clicking a point swaps in its own top-8-alliance breakdown below the map. Falls
 *  back to a plain grid of the busiest 12 points' breakdowns (no map) when no positions
 *  are available at all. Returns null when there's nothing to show. */
function renderStructureContestCard(model, alliances) {
  const byStructure = new Map();
  alliances.forEach(a => {
    Object.entries(a.structureBreakdown || {}).forEach(([structure, count]) => {
      if (!byStructure.has(structure)) byStructure.set(structure, new Map());
      byStructure.get(structure).set(a.alliance, count);
    });
  });
  if (!byStructure.size) return null;

  const allianceBySide = new Map(alliances.map(a => [a.alliance, a.side]));
  const structureTotal = (structure) => Array.from(byStructure.get(structure).values()).reduce((s, v) => s + v, 0);
  const topAllianceOf = (structure) => Array.from(byStructure.get(structure).entries()).sort((a, b) => b[1] - a[1])[0][0];
  const structureNames = Array.from(byStructure.keys()).sort((a, b) => structureTotal(b) - structureTotal(a));

  const contestCard = el("div", { class: "card" });
  contestCard.appendChild(el("h3", {}, [t("ranking.structureContestTitle")]));
  contestCard.appendChild(el("div", { class: "card-sub" }, [t("ranking.structureContestSub")]));

  function renderBreakdown(host, structure) {
    host.innerHTML = "";
    host.appendChild(el("div", { class: "structure-contest-label" }, [structureLabel(structure)]));
    const top = Array.from(byStructure.get(structure).entries()).sort((a, b) => b[1] - a[1]).slice(0, 8);
    const chartHost = el("div", {});
    host.appendChild(chartHost);
    renderHBarChart(chartHost, {
      data: top.map(([name, count]) => ({ label: name, value: count, color: sideColorVar(allianceBySide.get(name)) })),
      valueFormat: (v) => fmt.format(v),
    });
  }

  const positionByName = new Map((model.structurePositions || []).map(p => [p.name, p]));
  const positioned = structureNames.filter(name => positionByName.has(name));

  // A raw fallback id (no confirmed friendly name yet, e.g. "node_600_399") is long
  // enough to crowd neighboring labels on the map — show just the bare coordinate there
  // instead; the tooltip and click-through breakdown panel still show the full id.
  function mapPointLabel(name) {
    const pos = positionByName.get(name);
    if (pos && /^(node|tower)_/.test(name)) return `${pos.x},${pos.y}`;
    return structureLabel(name);
  }

  if (positioned.length) {
    // Lane-based, not proportional: two points a few units apart in-game (a node and its
    // neighboring tower, say) get their own evenly-spaced row/column instead of being
    // squeezed to a couple of pixels apart the way true-to-scale coordinates would put
    // them. Each distinct x (or y) value present becomes its own lane, in ascending order.
    const xLanes = Array.from(new Set(positioned.map(n => positionByName.get(n).x))).sort((a, b) => a - b);
    const yLanes = Array.from(new Set(positioned.map(n => positionByName.get(n).y))).sort((a, b) => a - b);
    // Grows with the number of lanes (a denser map needs more room per lane to keep every
    // label clear) up to a cap; the wrap in styles.css scales the whole SVG down to fit.
    const pad = 40, minStep = 36;
    const size = Math.min(760, Math.max(560, pad * 2 + (Math.max(xLanes.length, yLanes.length) - 1) * minStep));
    const xStep = xLanes.length > 1 ? (size - pad * 2) / (xLanes.length - 1) : 0;
    const yStep = yLanes.length > 1 ? (size - pad * 2) / (yLanes.length - 1) : 0;
    const xScale = (x) => pad + xLanes.indexOf(x) * xStep;
    // Flipped so a larger in-game y (as given for this map's layout) sits higher on screen.
    const yScale = (y) => pad + (yLanes.length - 1 - yLanes.indexOf(y)) * yStep;
    const r = 8; // fixed — not scaled by activity
    const hitR = 15; // invisible, larger than the visible dot — easier to click/tap without changing how big it looks

    const mapHost = el("div", { class: "structure-contest-map-wrap" });
    const svg = svgEl("svg", { class: "chart-svg", viewBox: `0 0 ${size} ${size}` });
    const detailHost = el("div", { class: "structure-contest-detail" });

    function selectStructure(name, g) {
      svg.querySelectorAll(".structure-map-point.selected").forEach(node => node.classList.remove("selected"));
      if (g) g.classList.add("selected");
      renderBreakdown(detailHost, name);
    }

    // Some events pack points densely enough (several node/tower pairs sharing an x lane
    // a couple of y lanes apart) that no fixed above/below rule keeps every label clear —
    // so this places labels greedily, busiest structure first, trying just above the dot
    // then just below, then to either side, and leaves a point unlabeled (dot + hit area still fully
    // clickable/hoverable — see the tooltip below) rather than ever drawing overlapping
    // text. Width is a rough character-count estimate; good enough for collision purposes
    // at this font size without measuring real text metrics.
    const positionedInfo = positioned.map(name => {
      const pos = positionByName.get(name);
      return { name, cx: xScale(pos.x), cy: yScale(pos.y), total: structureTotal(name) };
    });
    function labelBox(cx, y, text, anchor) {
      // Full-width (CJK) glyphs are roughly twice as wide as Latin/digits at this size.
      const w = Array.from(text).reduce((sum, ch) => sum + (ch.charCodeAt(0) > 0x2e80 ? 10 : 5.3), 6);
      const x1 = anchor === "start" ? cx : anchor === "end" ? cx - w : cx - w / 2;
      return { x1, x2: x1 + w, y1: y - 9, y2: y + 2 };
    }
    function overlapsAny(box, placed) {
      return placed.some(b => box.x1 < b.x2 && box.x2 > b.x1 && box.y1 < b.y2 && box.y2 > b.y1);
    }
    // Every dot (not just already-placed labels) is an obstacle too, so a label never sits
    // on top of a neighboring point either.
    const placedBoxes = positionedInfo.map(({ cx, cy }) => ({ x1: cx - r - 1, x2: cx + r + 1, y1: cy - r - 1, y2: cy + r + 1 }));
    const labelSpot = new Map(); // name -> { x, y, anchor }, or absent if this point got no label
    positionedInfo.slice().sort((a, b) => b.total - a.total).forEach(({ name, cx, cy }) => {
      const text = mapPointLabel(name);
      const candidates = [
        { x: cx, y: cy - r - 4, anchor: "middle" },
        { x: cx, y: cy + r + 13, anchor: "middle" },
        { x: cx + r + 4, y: cy + 4, anchor: "start" },
        { x: cx - r - 4, y: cy + 4, anchor: "end" },
      ];
      for (const c of candidates) {
        const box = labelBox(c.x, c.y, text, c.anchor);
        if (!overlapsAny(box, placedBoxes)) { placedBoxes.push(box); labelSpot.set(name, c); return; }
      }
    });

    positionedInfo.forEach(({ name, cx, cy, total }) => {
      const g = svgEl("g", { class: "bar-hit structure-map-point", tabindex: "0" });
      const hitArea = svgEl("circle", { cx, cy, r: hitR, fill: "transparent", class: "structure-map-hit" });
      const dot = svgEl("circle", { cx, cy, r });
      dot.style.fill = sideColorVar(allianceBySide.get(topAllianceOf(name)));
      g.appendChild(hitArea); g.appendChild(dot);
      if (labelSpot.has(name)) {
        const spot = labelSpot.get(name);
        const label = svgEl("text", { x: spot.x, y: spot.y, "text-anchor": spot.anchor, class: "structure-map-label" });
        label.textContent = mapPointLabel(name);
        g.appendChild(label);
      }
      g.addEventListener("click", () => selectStructure(name, g));
      const show = (evt) => {
        const p = evt.touches ? evt.touches[0] : evt;
        showTooltip(p.clientX, p.clientY, (tt) => {
          tt.appendChild(ttTitle(structureLabel(name)));
          tt.appendChild(ttRow(t("ranking.structureContestTotal"), fmt.format(total)));
        });
      };
      g.addEventListener("pointerenter", show);
      g.addEventListener("pointermove", show);
      g.addEventListener("pointerleave", hideTooltip);
      svg.appendChild(g);
    });
    mapHost.appendChild(svg);
    const layout = el("div", { class: "structure-contest-layout" });
    layout.appendChild(mapHost);
    layout.appendChild(detailHost);
    contestCard.appendChild(layout);
    selectStructure(structureNames[0]); // default to the single busiest point
  } else {
    const grid = el("div", { class: "structure-contest-grid" });
    structureNames.slice(0, 12).forEach(structure => {
      const item = el("div", { class: "structure-contest-item" });
      renderBreakdown(item, structure);
      grid.appendChild(item);
    });
    contestCard.appendChild(grid);
  }
  return contestCard;
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
    model.meta.hasAttackDistanceData ? t("attackScore.note") : t("attackScore.noDistance"),
  ]));
  const exportToolbar = el("div", { class: "toolbar", style: "margin-bottom:8px" });
  card.appendChild(exportToolbar);
  const exportOutHost = el("div", {});
  card.appendChild(exportOutHost);
  const tblHost = el("div", {});
  card.appendChild(tblHost);
  root.appendChild(card);

  // Same "make the formula visible" ordering as the Ranking tab's alliance table: total
  // score right after identity, immediately followed by the 3 raw columns summed to make
  // it (each already rescaled 0–100 before being added — see members.formula1), both
  // highlighted; everything else is reference/context and comes after.
  // Units for the text-export "include rank & value" option below — see the same table
  // in renderRankingTab for why some columns are left blank.
  const U = { pts: t("unit.points"), times: t("unit.times") };
  const columns = [
    { key: "player", label: t("col.player"), text: true },
    { key: "alliance", label: t("col.alliance"), text: true },
    { key: "totalActivity", label: t("col.totalActivity"), format: (v) => (v || 0).toFixed(1), className: "col-total-score", unit: U.pts },
    { key: "structureActionsPoints", label: "+ " + t("col.structureActionsPoints"), format: (v) => (v || 0).toFixed(1), className: "col-score-part", unit: U.pts },
    { key: "attackScorePoints", label: "+ " + t("col.attackScorePoints"), format: (v) => (v || 0).toFixed(1), className: "col-score-part", unit: U.pts },
    { key: "rubbleClearsPoints", label: "+ " + t("col.rubbleClearsPoints"), format: (v) => (v || 0).toFixed(1), className: "col-score-part", unit: U.pts },
    { key: "structureActionsAll", label: t("col.structureActionsAll"), unit: U.times },
    { key: "attacksLanded", label: t("col.attacksLanded"), unit: U.times },
    { key: "attackWinRate", label: t("col.attackWinRate"), format: (v) => v == null ? "—" : fmtPct(v) },
    { key: "attackScore", label: t("col.attackScore"), format: (v) => (v || 0).toFixed(1), unit: U.pts },
    { key: "avgAttackScorePerHit", label: t("col.avgAttackScorePerHit"), format: (v) => v == null ? "—" : v.toFixed(2), unit: U.pts },
    { key: "avgAttackDistance", label: t("col.avgAttackDistance"), format: (v) => v == null ? "—" : v.toFixed(1) },
    { key: "attacksTaken", label: t("col.attacksTaken"), unit: U.times },
    { key: "attacksTakenLost", label: t("col.attacksTakenLost"), unit: U.times },
    { key: "rubbleClears", label: t("col.rubbleClears"), unit: U.times },
    { key: "teleportIns", label: t("col.refTeleportIns"), unit: U.times },
    // A format with no real rallies sheet (Goldvein) shows the rallyActions stand-in
    // instead of the (always-0-there) opened/joined pair — see the rallyActions comment
    // in buildModel for why the two can't be told apart there.
    ...(model.meta.hasRallyActionData
      ? [{ key: "rallyActions", label: t("col.refRallyActions"), unit: U.times }]
      : [
          { key: "ralliesOpened", label: t("col.refRalliesOpened"), unit: U.times },
          { key: "ralliesJoined", label: t("col.refRalliesJoined"), unit: U.times },
        ]),
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
      initialSort: uiState.membersSort,
      onSort: (key, dir) => { uiState.membersSort = { key, dir }; renderMembersBody(); },
    });

    const csvName = uiState.membersAlliance === ALL_ALLIANCES_VALUE ? "all" : uiState.membersAlliance;
    exportBtn.onclick = () => downloadCsv(`${csvName}_members.csv`, columns, players);

    // Text export mirrors the table's current sort exactly — one player name per line,
    // ready to paste into an in-game mail (see attachTextExport).
    const sortedMembersCol = () => columns.find(c => c.key === uiState.membersSort.key) || columns[0];
    attachTextExport(exportToolbar, exportOutHost, {
      getRows: () => sortRowsBy(players, uiState.membersSort.key, uiState.membersSort.dir),
      nameKey: "player",
      getValueCol: sortedMembersCol,
      getTitle: () => {
        const metric = sortedMembersCol().label.replace(/^\+\s*/, "");
        const scope = uiState.membersAlliance === ALL_ALLIANCES_VALUE ? null : uiState.membersAlliance;
        return t("export.rankingTitle", { metric: scope ? `${scope} ${metric}` : metric });
      },
    });
  }
  renderMembersBody();
}


/* ================= END OF PART 4 MARKER ================= */
