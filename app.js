'use strict';
const $=id=>document.getElementById(id), KEY='feifei-python-club-2026-v1'+(new URLSearchParams(location.search).has('qa')?'-qa':'');
let meta,questions=[],current=null,editor=null,fallback=null,monacoReady=false,editorQuestionId=null,language='en',chapter='lecture1',topic='all',type='all',level=0,review='all',search='',answerOpen=false,selected=null,checked=false,worker=null,busy=false,timer=null,runID=0,filtered=[];
let saved={version:1,records:{},drafts:{},language:'en',chapter:'lecture1',last:{},resetAt:0};
try{const x=JSON.parse(localStorage.getItem(KEY)||'null');if(x&&x.version===1&&x.records&&x.drafts)saved={...saved,...x};}catch{}
language=saved.language==='zh'?'zh':'en';chapter=saved.chapter||chapter;
const bilingual=(value)=>typeof value==='string'?value:(value?.[language]??value?.en??'');
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const labels={1:'基础',2:'进阶',3:'挑战'};
function md(text){return String(text??'').split(/```(?:\w+)?\n?([\s\S]*?)```/g).map((part,i)=>{if(i%2)return '<pre><code class="python-code">'+esc(part.replace(/\n$/,''))+'</code></pre>';let s=esc(part).replace(/`([^`\n]+)`/g,'<code>$1</code>').replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>');return s.split(/\n\n+/).filter(Boolean).map(p=>'<p>'+p.replace(/\n/g,'<br>')+'</p>').join('');}).join('');}
const CODE_CHOICE_QUESTIONS=new Set('L1-013 L1-015 L1-019 L1-026 L1-029 L1-031 L2-004 L2-005 L2-024 L2-026 L2-036 L3-002 L3-005 L3-007 L3-008 L3-025 L3-026 L3-036 L4-009 L4-019 L4-020 L4-022 T1-002 T1-012 T1-015 T1-021 T1-024 T1-031 T1-032 T1-051 T1-056 T2-001 T2-005 T2-008 T2-009 T2-012 T2-022 T2-028 T2-029 T2-034'.split(' '));
function isCodeOption(text,questionId=''){
 if(CODE_CHOICE_QUESTIONS.has(questionId))return true;
 const value=String(text??'').trim();
 if(!value)return false;
 if(value.includes('```')||/^`[\s\S]*`$/.test(value)||value.includes('\n'))return true;
 // Prose may mention functions or operators; keep such explanations as prose.
 const prose=value.replace(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g,'');
 if(/\b(?:always|may|must|returns?|becomes?|because|without|after|use|both|the|guarantees?|converts?)\b/i.test(prose)||/\bis (?:a|an|still|in)\b/i.test(prose))return false;
 return /^(?:[rubf]{1,2})?["'\[({]/i.test(value)
  || /^(?:True|False|None|[A-Za-z_]\w*(?:Error|Exception))$/.test(value)
  || /^[\d\s,()[\].+\-]+$/.test(value)
  || /^(?:if|elif|else|for|while|def|class|return|import|from|del|assert|not)\b/.test(value)
  || /^[A-Za-z_]\w*(?:\.[A-Za-z_]\w*)+$/ .test(value)
  || /^[A-Za-z_]\w*(?:\.[A-Za-z_]\w*)*\s*(?:\(|\[|[=<>+*/%@|&^~\-])/.test(value)
  || /^[-+]?(?:\d+(?:\.\d*)?|\.\d+)\s*[=!<>+*/%&|^\-]/.test(value);
}
function optionMarkdown(text,questionId=''){
 const value=String(text??'');
 if(value.includes('```'))return md(value);
 const trimmed=value.trim();
 const code=/^`[\s\S]*`$/.test(trimmed)?trimmed.slice(1,-1):value;
 if(code.includes('\n')&&!CODE_CHOICE_QUESTIONS.has(questionId))return '<pre><code class="plaintext-code">'+esc(code)+'</code></pre>';
 if(isCodeOption(value,questionId)){
  return '<pre><code class="python-code">'+esc(code)+'</code></pre>';
 }
 return md(value).replace(/<code>/g,'<code class="python-inline">');
}
function save(){saved.language=language;saved.chapter=chapter;try{localStorage.setItem(KEY,JSON.stringify(saved));}catch{toast('浏览器存储空间不足，请导出学习记录。');}}
function record(id=current?.id){return saved.records[id]||{};}
function toast(text){$('toast').textContent=text;$('toast').classList.add('show');clearTimeout(toast.timeout);toast.timeout=setTimeout(()=>$('toast').classList.remove('show'),3300);}
function chapterItems(){return questions.filter(q=>q.chapter===chapter);}
function updateFilters(){filtered=chapterItems().filter(q=>(type==='all'||q.type===type)&&(!level||q.difficulty===level)&&(topic==='all'||q.topic===topic)&&(review==='all'||review==='wrong'&&record(q.id).wrong||review==='favorite'&&record(q.id).favorite||review==='unseen'&&!record(q.id).attempted)&&(!search||[q.id,q.title.en,q.title.zh,q.prompt.en,q.prompt.zh,q.topicLabel.en,q.topicLabel.zh].join(' ').toLowerCase().includes(search)));}
function renderSidebar(){const totals={};questions.forEach(q=>{totals[q.chapter]??={total:0,done:0};totals[q.chapter].total++;if(record(q.id).solved)totals[q.chapter].done++;});$('chapterNav').innerHTML=meta.chapters.map(c=>`<button class="chapter-button ${c.id===chapter?'active':''}" data-chapter="${c.id}" aria-current="${c.id===chapter?'page':'false'}"><span class="nav-code">${c.code}</span><span><b>${esc(c.name.zh)}</b><small>${totals[c.id]?.total||0} 题 · ${esc(c.name.en)}</small></span>${totals[c.id]?.done===totals[c.id]?.total?'<span class="nav-dot"></span>':''}</button>`).join('');const done=questions.filter(q=>record(q.id).solved).length;$('overallCount').textContent=`${done} / ${questions.length}`;$('overallBar').style.width=`${done/questions.length*100}%`;$('totalCount').textContent=questions.length;}
function renderHeader(){const c=meta.chapters.find(c=>c.id===chapter);$('chapterKicker').textContent=(c.code.startsWith('T')?'PRACTICE ':'CHAPTER ')+c.code;$('chapterTitle').innerHTML=esc(c.name.zh)+` <span>${esc(c.name.en)}</span>`;$('chapterDesc').textContent=c.description.zh;$('chapterSolved').textContent=chapterItems().filter(q=>record(q.id).solved).length;$('chapterTotal').textContent=' / '+chapterItems().length;$('langEn').classList.toggle('active',language==='en');$('langZh').classList.toggle('active',language==='zh');$('langEn').setAttribute('aria-pressed',language==='en');$('langZh').setAttribute('aria-pressed',language==='zh');}
function renderTopics(){const topics=new Map();chapterItems().forEach(q=>topics.set(q.topic,q.topicLabel));$('topicFilters').innerHTML=`<button data-topic="all" class="${topic==='all'?'active':''}">全部知识点</button>`+[...topics.entries()].map(([key,name])=>`<button data-topic="${esc(key)}" class="${topic===key?'active':''}">${esc(name.zh)}</button>`).join('');}
function renderGrid(){$('filteredCount').textContent=filtered.length+' 题';$('questionGrid').innerHTML=filtered.map(q=>{const r=record(q.id);return `<button data-question="${q.id}" title="${esc(bilingual(q.title))}" aria-label="${esc(q.id+' '+bilingual(q.title))}" class="${current?.id===q.id?'active ':''}${r.solved?'done ':r.wrong?'wrong ':''}${r.favorite?'fav':''}">${q.id.split('-').pop().replace(/^0+/,'')}</button>`;}).join('');}
function disposeEditor(){if(editor){const model=editor.getModel();editor.dispose();model?.dispose();editor=null;}fallback=null;editorQuestionId=null;}
function saveDraft(){if(!editorQuestionId)return;const value=editor?editor.getValue():fallback?.value;if(value!==undefined){saved.drafts[editorQuestionId]=value;save();}}
function selectQuestion(id){if(busy)cancelRun();saveDraft();current=filtered.find(q=>q.id===id)||filtered[0]||null;answerOpen=false;selected=current?(record().selection??null):null;checked=!!record().attempted; if(current){saved.last[chapter]=current.id;save();}renderQuestion();renderGrid();}
function render(){if(busy)cancelRun();updateFilters();renderSidebar();renderHeader();renderTopics();if(!current||!filtered.some(q=>q.id===current.id)){current=filtered.find(q=>q.id===saved.last[chapter])||filtered[0]||null;answerOpen=false;selected=current?(record().selection??null):null;checked=!!record().attempted;}renderQuestion();renderGrid();}
function renderQuestion(){saveDraft();disposeEditor();if(!current){$('questionCard').innerHTML='<div class="empty-state"><span>❀</span><p>这里还没有匹配的题目。<br>换一个知识点，或先把筛选放宽一点吧。</p><button class="button secondary" data-action="clear">重置筛选</button></div>';return;}
 const q=current,r=record(),i=filtered.findIndex(x=>x.id===q.id);
 let content=`<div class="question-top"><div class="question-meta"><span class="q-id">${q.id}</span><span class="badge level${q.difficulty}">${labels[q.difficulty]}</span><span>${q.type==='mcq'?'单项选择':'动手编程'} · ${esc(bilingual(q.topicLabel))}</span></div><button class="bookmark ${r.favorite?'active':''}" data-action="favorite" aria-label="${r.favorite?'取消收藏':'收藏题目'}" aria-pressed="${!!r.favorite}">${r.favorite?'★':'☆'}</button></div><h3>${esc(bilingual(q.title))}</h3><div class="markdown prompt">${md(bilingual(q.prompt))}</div>`;
 if(q.type==='mcq')content+='<div class="options">'+q.options.map((o,n)=>`<button class="option ${n===selected?'selected ':''}${checked&&n===q.answer?'correct ':''}${checked&&n===selected&&n!==q.answer?'incorrect ':''}${bilingual(o).length>90||isCodeOption(bilingual(o),q.id)?'wide':''} ${isCodeOption(bilingual(o),q.id)?'code-option':''}" data-option="${n}" aria-pressed="${n===selected}"><span class="option-letter">${String.fromCharCode(65+n)}</span><span class="markdown">${optionMarkdown(bilingual(o),q.id)}</span></button>`).join('')+'</div><div class="question-actions"><button class="button" data-action="check">检查答案 ↗</button><button class="button secondary" data-action="answer">'+(answerOpen?'收起答案与解析':'查看答案与解析')+'</button></div>';
 else content+=`<div class="editor-shell"><div class="editor-header"><span>◦ &nbsp; main.py</span><span>Python 3.12</span></div><div class="editor-host" id="codeEditor" aria-label="Python代码编辑器"></div><div class="editor-tools"><button data-action="reset">↻ 重置代码</button><button data-action="download">↓ 下载 .py</button></div></div><p class="test-hint">⌘ / Ctrl + Enter 运行 · Tab 缩进 · ${esc(bilingual(q.testHint))}</p><div class="question-actions"><button class="button" data-action="run" ${busy?'disabled':''}>▷ 运行代码</button><button class="button secondary" data-action="test" ${busy?'disabled':''}>✓ 检查测试</button><button class="button secondary" data-action="answer">${answerOpen?'收起解析':'查看答案与解析'}</button><button class="button stop" id="stopRun" data-action="stop" ${busy?'':'hidden'}>停止</button></div><div id="outputPanel" class="output-panel" ${busy?'':'hidden'}><div class="output-title"><span id="outputTitle">PYTHON OUTPUT</span><span id="runtimeStatus">${busy?'运行中…':''}</span></div><pre id="codeOutput">${busy?'正在准备 Python 环境…':''}</pre></div>`;
 if(q.type==='mcq'&&checked&&selected!==null)content+=`<div class="feedback ${selected===q.answer?'':'error'}">${selected===q.answer?'✓ 答对了！试着说说为什么这个选项成立。':'再想一想也没关系。可以展开解析，看看是哪一步和预期不同。'}</div>`;
 if(answerOpen){content+=`<section class="answer-panel"><div class="answer-heading"><span>✦</span>${q.type==='mcq'?'参考答案：'+String.fromCharCode(65+q.answer):'参考答案与思路'}</div>`;if(q.type==='code')content+=`<div class="markdown">${md('```python\n'+q.solution+'\n```')}</div>`;content+=`<div class="markdown">${md(bilingual(q.explanation))}</div>`;if(q.type==='code')content+=`<details class="source-box"><summary>查看本题测试样例</summary><div class="markdown">${md('```python\n'+q.tests+'\n```')}</div></details>`;content+=`<details class="source-box"><summary>参考与出题依据 · 教学变式</summary><p>${esc(q.source.label)}</p><p>${esc(bilingual(q.source.note))}</p>${/^https?:\/\//.test(q.source.url)?`<a href="${esc(q.source.url)}" target="_blank" rel="noreferrer">查看参考来源 ↗</a>`:''}</details></section>`;}
 content+=`<div class="question-pagination"><span>筛选结果 ${i+1} / ${filtered.length}</span><div class="page-buttons"><button data-action="prev" ${i===0?'disabled':''}>← 上一题</button><button data-action="random">随便练练</button><button data-action="next" ${i===filtered.length-1?'disabled':''}>下一题 →</button></div></div>`;
 $('questionCard').innerHTML=content;if(q.type==='code')mountEditor(q);colorize();}
function colorize(){
 if(!monacoReady)return;
 document.querySelectorAll('code.python-code, code.python-inline').forEach(el=>{
  if(el.dataset.highlighted)return;
  const source=el.textContent;
  el.dataset.highlighted='pending';
  monaco.editor.colorize(source,'python',{tabSize:4}).then(html=>{
   if(!el.isConnected)return;
   el.innerHTML=el.classList.contains('python-inline')?html.replace(/(?:<br\s*\/?>\s*)+$/gi,''):html;
   el.dataset.highlighted='done';
  }).catch(()=>{delete el.dataset.highlighted;});
 });
}
function mountEditor(q){const host=$('codeEditor');if(!host)return;editorQuestionId=q.id;const value=saved.drafts[q.id]??q.starter;
 if(monacoReady){editor=monaco.editor.create(host,{value,language:'python',theme:'feifei',fontSize:13,lineHeight:23,fontFamily:'"SFMono-Regular", Consolas, "Liberation Mono", monospace',minimap:{enabled:false},scrollBeyondLastLine:false,automaticLayout:true,tabSize:4,insertSpaces:true,wordWrap:'on',padding:{top:14,bottom:10},lineNumbersMinChars:3,renderLineHighlight:'all',overviewRulerLanes:0,hideCursorInOverviewRuler:true,bracketPairColorization:{enabled:true},quickSuggestions:{other:true,comments:false,strings:false},suggestOnTriggerCharacters:true});editor.onDidChangeModelContent(()=>{saved.drafts[q.id]=editor.getValue();save();});editor.addCommand(monaco.KeyMod.CtrlCmd|monaco.KeyCode.Enter,()=>runCode(false));}
 else{host.innerHTML='<textarea class="fallback-editor" spellcheck="false" aria-label="Python代码编辑器"></textarea>';fallback=host.querySelector('textarea');fallback.value=value;fallback.addEventListener('input',saveDraft);fallback.addEventListener('keydown',e=>{if(e.key==='Tab'){e.preventDefault();const a=fallback.selectionStart;fallback.setRangeText('    ',a,fallback.selectionEnd,'end');saveDraft();}if((e.ctrlKey||e.metaKey)&&e.key==='Enter'){e.preventDefault();runCode(false);}});}}
function checkMCQ(){if(selected===null){toast('先选一个你认为正确的选项吧。');return;}const good=selected===current.answer;saved.records[current.id]={...record(),selection:selected,attempted:true,solved:good,wrong:!good};checked=true;save();renderSidebar();renderHeader();renderQuestion();renderGrid();}
function changeChapter(id){saveDraft();chapter=id;current=null;clearFilters();save();$('sidebar').classList.remove('open');$('mobileShade').classList.remove('active');}
function changeLanguage(lang){saveDraft();language=lang;save();renderHeader();renderQuestion();renderGrid();}
function clearFilters(){topic='all';type='all';level=0;review='all';search='';$('searchInput').value='';$('reviewSelect').value='all';document.querySelectorAll('[data-type]').forEach(b=>b.classList.toggle('active',b.dataset.type==='all'));document.querySelectorAll('[data-level]').forEach(b=>b.classList.toggle('active',b.dataset.level==='0'));render();}
function replaceStudyRecords(nextState){
 // Stop queued execution and detach the editor before clearing drafts.
 runID++;
 cancelRun();
 disposeEditor();
 saved=nextState;
 selected=null;
 checked=false;
 answerOpen=false;
 current=null;
 clearFilters();
}
function clearStudyRecords(){
 replaceStudyRecords({version:1,records:{},drafts:{},last:{},language,chapter,resetAt:Date.now()});
 save();
 toast('做题记录已清空，可以重新开始练习了。');
}
function download(text,name,mime='application/json'){const blob=new Blob([text],{type:mime});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);}
function cancelRun(reason='已停止运行。可以修改代码后再试。'){clearTimeout(timer);worker?.terminate();worker=null;busy=false;document.querySelectorAll('[data-action="run"],[data-action="test"]').forEach(b=>b.disabled=false);$('stopRun')?.setAttribute('hidden','');if($('codeOutput')){$('codeOutput').textContent=reason;$('runtimeStatus').textContent='已停止';}}
function ensureWorker(){if(!worker){worker=new Worker('python-worker.js');worker.onerror=e=>{showOutput('Python 环境未能启动：'+e.message,true);finishRun();worker?.terminate();worker=null;};worker.onmessage=event=>{const data=event.data;if(data.id!==runID)return;if(data.status){if($('runtimeStatus'))$('runtimeStatus').textContent=data.status;if(data.phase==='running'){clearTimeout(timer);timer=setTimeout(()=>cancelRun('代码运行超过8秒，已自动停止。请检查循环是否有结束条件，或缩小输入。'),8000);}return;}clearTimeout(timer);if(data.kind==='result'){const q=questions.find(q=>q.id===data.questionId);if(data.check){saved.records[q.id]={...record(q.id),attempted:true,solved:data.ok,wrong:!data.ok};save();renderSidebar();renderHeader();renderGrid();}if(current?.id===data.questionId){let message=data.stdout||'';if(data.ok)message+=(message?'\n':'')+(data.check?'✓ 本题样例测试通过。写法限制请结合题干自行核对；也可以设计一个新输入再检查。':'✓ 运行完成。'+(!data.stdout?'代码没有打印内容；函数返回值可用 print(...) 查看。':''));else message+=(message?'\n':'')+friendlyError(data.error)+'\n\n'+data.error;showOutput(message,!data.ok,data.check?'测试结果':'运行结果');}finishRun();}};}return worker;}
function friendlyError(s){if(/AssertionError/.test(s))return '有测试结果与题目要求不同。先检查边界输入、返回值和输出格式。';if(/SyntaxError|IndentationError|TabError/.test(s))return 'Python 没有读懂这段写法。检查冒号、引号、括号和缩进。';if(/NameError/.test(s))return '有名称尚未定义。检查变量拼写、函数名，或是否遗漏 import。';if(/TypeError/.test(s))return '某个值的类型与操作不匹配。检查字符串和数字是否需要转换。';if(/NotImplementedError/.test(s))return '起步代码还没有完成。把 pass 或 NotImplementedError 换成你的实现吧。';if(/EOFError/.test(s))return '本页不使用交互式 input()。请按题目给定的函数参数接收数据。';return '出现了一点小问题。先读最后一行错误，再回到对应代码检查。';}
function showOutput(text,error=false,title='运行结果'){const panel=$('outputPanel');if(!panel)return;panel.hidden=false;panel.classList.toggle('error',error);$('codeOutput').textContent=text;$('runtimeStatus').textContent=error?'再检查一下':'完成';$('outputTitle').textContent=title;}
function finishRun(){clearTimeout(timer);busy=false;document.querySelectorAll('[data-action="run"],[data-action="test"]').forEach(b=>b.disabled=false);$('stopRun')?.setAttribute('hidden','');}
function runCode(check){if(busy||!current||current.type!=='code')return;saveDraft();busy=true;runID++;const q=current;document.querySelectorAll('[data-action="run"],[data-action="test"]').forEach(b=>b.disabled=true);$('stopRun').hidden=false;$('outputPanel').hidden=false;$('outputPanel').classList.remove('error');$('codeOutput').textContent='正在准备 Python 环境，第一次运行稍等片刻…';$('runtimeStatus').textContent='准备中…';timer=setTimeout(()=>cancelRun('Python 环境准备超时。请重新点击运行；如果持续出现，请刷新页面或检查网络后重试。'),60000);ensureWorker().postMessage({id:runID,questionId:q.id,code:saved.drafts[q.id]??q.starter,setup:q.setup||'',tests:q.tests||'',packages:q.packages||[],check});}
function initEvents(){
 $('chapterNav').addEventListener('click',e=>{const b=e.target.closest('[data-chapter]');if(b)changeChapter(b.dataset.chapter);});
 $('langEn').onclick=()=>changeLanguage('en');$('langZh').onclick=()=>changeLanguage('zh');
 $('typeTabs').onclick=e=>{const b=e.target.closest('[data-type]');if(!b)return;saveDraft();type=b.dataset.type;document.querySelectorAll('[data-type]').forEach(x=>x.classList.toggle('active',x===b));render();};
 $('levelFilter').onclick=e=>{const b=e.target.closest('[data-level]');if(!b)return;saveDraft();level=Number(b.dataset.level);document.querySelectorAll('[data-level]').forEach(x=>x.classList.toggle('active',x===b));render();};
 $('topicFilters').onclick=e=>{const b=e.target.closest('[data-topic]');if(b){saveDraft();topic=b.dataset.topic;render();}};
 $('reviewSelect').onchange=e=>{saveDraft();review=e.target.value;render();};$('searchInput').oninput=e=>{saveDraft();search=e.target.value.trim().toLowerCase();render();};
 $('questionGrid').onclick=e=>{const b=e.target.closest('[data-question]');if(b)selectQuestion(b.dataset.question);};
 $('questionCard').onclick=e=>{const option=e.target.closest('[data-option]');if(option){selected=Number(option.dataset.option);checked=false;renderQuestion();return;}const b=e.target.closest('[data-action]');if(!b)return;const action=b.dataset.action,i=filtered.findIndex(q=>q.id===current?.id);switch(action){case'check':checkMCQ();break;case'answer':answerOpen=!answerOpen;renderQuestion();break;case'favorite':saved.records[current.id]={...record(),favorite:!record().favorite};save();renderQuestion();renderGrid();break;case'prev':selectQuestion(filtered[i-1]?.id);break;case'next':selectQuestion(filtered[i+1]?.id);break;case'random':{const pool=filtered.filter(q=>q.id!==current.id);if(pool.length)selectQuestion(pool[Math.floor(Math.random()*pool.length)].id);break;}case'clear':clearFilters();break;case'run':runCode(false);break;case'test':runCode(true);break;case'stop':cancelRun();break;case'reset':if(editor)editor.setValue(current.starter);else if(fallback){fallback.value=current.starter;saveDraft();}toast('已恢复起步代码。');break;case'download':saveDraft();download(saved.drafts[current.id]??current.starter,current.id+'.py','text/x-python');break;}};
 $('sourceBtn').onclick=()=>$('sourceDialog').showModal();$('closeSource').onclick=()=>$('sourceDialog').close();$('sourceDialog').onclick=e=>{if(e.target===$('sourceDialog')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close();}};
 $('clearRecordsBtn').onclick=()=>{$('clearRecordsDialog').showModal();$('cancelClearRecords').focus();};
 const closeClearRecords=()=>$('clearRecordsDialog').close();
 $('cancelClearRecords').onclick=closeClearRecords;
 $('closeClearRecords').onclick=closeClearRecords;
 $('confirmClearRecords').onclick=()=>{closeClearRecords();clearStudyRecords();};
 window.addEventListener('storage',event=>{
  if(event.key!==KEY||!event.newValue)return;
  try{
   const next=JSON.parse(event.newValue);
   if(next.version!==1||!next.records||!next.drafts||!(next.resetAt>(saved.resetAt||0)))return;
   replaceStudyRecords({...next,language,chapter});
   toast('做题记录已在另一个页面中清空。');
  }catch{}
 });
 $('exportBtn').onclick=()=>{saveDraft();download(JSON.stringify(saved,null,2),'飞飞编程学习记录-'+new Date().toISOString().slice(0,10)+'.json');toast('学习记录已导出，记得保管好。');};
 $('importInput').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{if(f.size>5000000)throw Error('文件过大');const data=JSON.parse(await f.text());if(data.version!==1||!data.records||!data.drafts)throw Error('文件格式不匹配');const ids=new Set(questions.map(q=>q.id));for(const [id,r]of Object.entries(data.records))if(ids.has(id)&&r&&typeof r==='object')saved.records[id]={...record(id),...r};for(const[id,code]of Object.entries(data.drafts))if(ids.has(id)&&typeof code==='string')saved.drafts[id]=code;save();disposeEditor();render();toast('已合并导入学习记录。');}catch(err){toast('无法导入：'+err.message);}e.target.value='';};
 $('menuBtn').onclick=()=>{$('sidebar').classList.toggle('open');$('mobileShade').classList.toggle('active');};$('mobileShade').onclick=()=>{$('sidebar').classList.remove('open');$('mobileShade').classList.remove('active');};window.addEventListener('beforeunload',saveDraft);
}
function loadMonaco(){if(typeof require==='undefined')return;require.config({paths:{vs:'vendor/monaco/vs'}});window.MonacoEnvironment={getWorkerUrl:()=>new URL('vendor/monaco/vs/base/worker/workerMain.js',location.href).href};require(['vs/editor/editor.main'],()=>{monaco.editor.defineTheme('feifei',{base:'vs',inherit:true,rules:[{token:'comment',foreground:'99a68d',fontStyle:'italic'},{token:'keyword',foreground:'8d6ca7'},{token:'string',foreground:'7b9866'},{token:'number',foreground:'c18a4f'},{token:'identifier',foreground:'486656'},{token:'delimiter',foreground:'8e9b81'}],colors:{'editor.background':'#fbfcf8','editor.foreground':'#476153','editorLineNumber.foreground':'#c1cab5','editorLineNumber.activeForeground':'#78916a','editor.lineHighlightBackground':'#f0f4e9','editorCursor.foreground':'#698b5b','editor.selectionBackground':'#dce9cf','editor.inactiveSelectionBackground':'#e8efdf','editorIndentGuide.background1':'#e5ebdd','editorWidget.background':'#f8faf4'}});monaco.editor.setTheme('feifei');monacoReady=true;if(current?.type==='code'){saveDraft();disposeEditor();mountEditor(current);}colorize();},()=>toast('高亮编辑器未能加载，已使用基础输入框。'));}
async function boot(){try{meta=await(await fetch('data/chapters.json')).json();const chunks=await Promise.all(meta.chapters.map(async c=>{const r=await fetch('data/'+c.id+'.json');if(!r.ok)throw Error(c.id+' 题目文件未找到');return r.json();}));questions=chunks.flat();if(!meta.chapters.some(c=>c.id===chapter))chapter='lecture1';initEvents();render();loadMonaco();}catch(e){$('questionCard').innerHTML='<div class="empty-state"><span>❀</span><p>题库暂时未能载入。请刷新页面或检查网络后重试。</p><pre>'+esc(e.message)+'</pre><button class="button" onclick="location.reload()">重新载入</button></div>';}}
boot();
