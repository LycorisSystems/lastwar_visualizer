Put .xlsx SVS log files in this folder.

On the tool's upload screen, click "配置済みのExcelから選ぶ" (Choose from prepared Excel
files) and select this "files" folder in the dialog that opens — every .xlsx file in here
will then show up as a clickable button.

This one-time folder selection is a browser security requirement, not a tool limitation:
a page opened via file:// (double-clicking index.html) has no way to read a folder's
contents without you explicitly picking that folder first. See the main README.md for
details.

.xlsx files placed here are excluded from git by .gitignore — they often contain other
alliances' player names and other data you may not want committed or redistributed by
default.
