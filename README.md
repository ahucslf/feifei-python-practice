# 跟着飞飞老师突击编程

按5份章节讲义和2份Tutorial编写的420道Python双语练习：每章60题，36道选择题、24道编程题。

练习网站：https://pythonpra.netlify.app/ （同步发布：https://ahucslf.github.io/feifei-python-practice/）

## 功能
- 默认英文题目，可切换中文题干、选项和解析；首页标题使用站酷快乐体（ZCOOL KuaiLe，OFL 1.1）子集字体，页头插画加高并完整显示 Python 标志。
- 右上角「可爱字体」按钮可切换标题与按钮字体（站酷快乐体子集，默认开启，选择保存在浏览器）；题目正文、解析与代码保持默认字体和等宽字体。
- 按章节、知识点、题型与难度筛选，支持错题和收藏。
- Monaco代码编辑器；选择题代码选项和题干均支持Python高亮与缩进显示，代码选项的A/B/C/D字母与代码块垂直居中。
- 答案解析中与题目代码相关的变量名、函数名和字符串会自动加粗，方便把文字说明和代码对照起来。
- Pyodide浏览器Python运行与样例测试；NumPy、pandas和相关依赖随网站提供。
- 代码草稿和学习进度保存在当前浏览器，可导出、导入备份。
- 清空做题记录需二次确认；清除全部章节的结果、收藏和草稿，保留语言与当前章节。

## 题目来源
题目为依据课程讲义及公开教材知识点编写的教学练习和变式，不代表UvA官方题库或考试真题。逐题依据见网页答案下方及[data/question-sources.csv](data/question-sources.csv)。参考资料包括Al Sweigart的Python Programming Exercises, Gently Explained、Software Carpentry公开工作坊、spcourse/pandas-dp和Jake VanderPlas的Python Data Science Handbook。

## 运行与部署
这是纯静态网站。GitHub Pages使用main分支根目录发布，.nojekyll禁用Jekyll处理。也可在此目录运行 `python3 -m http.server 8000`，访问本机8000端口。

Python在浏览器Worker内运行。样例测试主要检查给定输入的结果，不证明程序对所有输入均正确；指定写法仍需结合题干核对。首次加载Python及数据分析组件需要等待网络传输完成。

## 组件与素材
Monaco Editor 0.52.2（MIT；许可证见vendor/monaco/LICENSE）；站酷快乐体 ZCOOL KuaiLe（SIL OFL 1.1，子集文件与许可证见assets/fonts/）；Pyodide 0.27.7（MPL-2.0）；NumPy 2.0.2、pandas 2.2.3及依赖的原始许可证保留在相应组件中。网页卡通配图使用内置imagegen生成。
