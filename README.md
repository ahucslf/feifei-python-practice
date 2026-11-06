# 跟着飞飞老师突击编程

按5份章节讲义和2份Tutorial编写的420道Python双语练习：每章60题，36道选择题、24道编程题。

练习网站：https://pythonpra.netlify.app/ （同步发布：https://ahucslf.github.io/feifei-python-practice/）

## 功能
- 页面里的老师/反馈头像每次打开都会从 32 个动物头像中随机抽取（素材来自 assets/animals1–3 的动物图集）。
- 默认英文题目，可切换中文题干、选项和解析；首页标题使用站酷快乐体（ZCOOL KuaiLe，OFL 1.1）子集字体，页头插画加高并完整显示 Python 标志。
- 右上角有中英两个字体下拉框：中文字体 17 款、英文字体 9 款（各含默认字体）。两者相互独立——改中文字体不影响英文，改英文字体不影响中文，数字跟随英文字体；可切换标题、按钮，以及面包屑、难度标签、题目标题、题干、侧栏足迹/寄语、题号分页、老师便签等关键阅读区域。代码块、行内代码与代码编辑器保持等宽字体，选项与答案解析保持默认字体。字体为 OFL 1.1 自托管子集，逐款许可见 assets/fonts/LICENSES.md。
- 按章节、知识点、题型与难度筛选，支持错题和收藏。
- Monaco代码编辑器；选择题代码选项和题干均支持Python高亮与缩进显示，代码选项的A/B/C/D字母与代码块垂直居中。
- 答案解析中与题目代码相关的变量名、函数名和字符串会自动加粗，方便把文字说明和代码对照起来。
- Pyodide浏览器Python运行与样例测试；NumPy、pandas和相关依赖随网站提供。
- 代码草稿和学习进度保存在当前浏览器，可导出、导入备份。
- 清空做题记录需二次确认；清除全部章节的结果、收藏和草稿，保留语言与当前章节。
- 答题界面：奶油暖色主题与 sticky 章节进度；选择题选中态使用奶油黄（绿色只表示答对/已通过），答对/答错用 ✓/✕ 双编码；判分后小兔/小猫反馈气泡，答对主按钮变「下一题 →」、答错「再试一次」并锁定选项；右栏题号地图 sticky，已通过/待复习/当前/收藏/未练习五态图例；移动端保留老师便签。

## 题目来源
题目为依据课程讲义及公开教材知识点编写的教学练习和变式，不代表UvA官方题库或考试真题。逐题依据见网页答案下方及[data/question-sources.csv](data/question-sources.csv)。参考资料包括Al Sweigart的Python Programming Exercises, Gently Explained、Software Carpentry公开工作坊、spcourse/pandas-dp和Jake VanderPlas的Python Data Science Handbook。

## 运行与部署
这是纯静态网站。GitHub Pages使用main分支根目录发布，.nojekyll禁用Jekyll处理。也可在此目录运行 `python3 -m http.server 8000`，访问本机8000端口。

Python在浏览器Worker内运行。样例测试主要检查给定输入的结果，不证明程序对所有输入均正确；指定写法仍需结合题干核对。首次加载Python及数据分析组件需要等待网络传输完成。

## 组件与素材
Monaco Editor 0.52.2（MIT；许可证见vendor/monaco/LICENSE）；17 款中文可爱字体子集（均为 SIL OFL 1.1，逐款来源与版权见assets/fonts/LICENSES.md，许可全文见assets/fonts/OFL-1.1.txt）；Pyodide 0.27.7（MPL-2.0）；NumPy 2.0.2、pandas 2.2.3及依赖的原始许可证保留在相应组件中。网页卡通配图使用内置imagegen生成。
