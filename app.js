'use strict';
const $=id=>document.getElementById(id), KEY='feifei-python-club-2026-v1'+(new URLSearchParams(location.search).has('qa')?'-qa':'');
let meta,questions=[],current=null,editor=null,fallback=null,monacoReady=false,editorQuestionId=null,language='en',chapter='lecture1',topic='all',type='all',level=0,review='all',search='',answerOpen=false,selected=null,checked=false,worker=null,busy=false,timer=null,runID=0,filtered=[],cuteFontId='zcool-kuaile',enFontId='default',speedMode=false,examPaper=null,examIndex=0,examAnswers={},examSubmitted=false,examResultData=null;
let saved={version:1,records:{},drafts:{},notes:{},language:'en',chapter:'lecture1',last:{},resetAt:0,speedMode:false};
try{const x=JSON.parse(localStorage.getItem(KEY)||'null');if(x&&x.version===1&&x.records&&x.drafts)saved={...saved,...x};}catch{}
if(!saved.notes||typeof saved.notes!=='object')saved.notes={};
language=saved.language==='zh'?'zh':'en';chapter=saved.chapter||chapter;
const bilingual=(value)=>typeof value==='string'?value:(value?.[language]??value?.en??'');
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const labels={1:'基础',2:'进阶',3:'挑战'};
const CUTE_FONTS=[{id:'zcool-kuaile',name:'站酷快乐体',short:'快乐体',family:'FeifeiFont0',desc:'ZCOOL KuaiLe'},{id:'zcool-qingke-huangyou',name:'站酷庆科黄油体',short:'黄油体',family:'FeifeiFont1',desc:'ZCOOL QingKe HuangYou'},{id:'wdxl-lubrifont',name:'WD-XL 滑油字',short:'滑油字',family:'FeifeiFont2',desc:'WD-XL Lubrifont'},{id:'chiron-goround',name:'昭源环方',short:'环方',family:'FeifeiFont3',desc:'Chiron GoRound'},{id:'lxgw-975-yuan',name:'霞鹜975圆体',short:'975圆',family:'FeifeiFont4',desc:'LXGW 975 Yuan'},{id:'chill-round-gothic',name:'寒蝉全圆体',short:'寒蝉圆',family:'FeifeiFont5',desc:'Chill Round Gothic'},{id:'lxgw-wenkai',name:'霞鹜文楷',short:'文楷',family:'FeifeiFont6',desc:'LXGW WenKai'},{id:'lxgw-wenkai-mono',name:'霞鹜文楷等宽',short:'文楷等宽',family:'FeifeiFont7',desc:'LXGW WenKai Mono'},{id:'lxgw-marker-gothic',name:'霞鹜马克体',short:'马克体',family:'FeifeiFont8',desc:'LXGW Marker Gothic'},{id:'smiley-sans',name:'得意黑',short:'得意黑',family:'FeifeiFont9',desc:'Smiley Sans'},{id:'ma-shan-zheng',name:'马善政毛笔楷书',short:'毛笔楷',family:'FeifeiFont10',desc:'Ma Shan Zheng'},{id:'long-cang',name:'龙藏体',short:'龙藏',family:'FeifeiFont11',desc:'Long Cang'},{id:'zhi-mang-xing',name:'志莽行书',short:'行书',family:'FeifeiFont12',desc:'Zhi Mang Xing'},{id:'liu-jian-mao-cao',name:'刘建毛草',short:'毛草',family:'FeifeiFont13',desc:'Liu Jian Mao Cao'},{id:'zcool-xiaowei',name:'站酷小薇体',short:'小薇体',family:'FeifeiFont14',desc:'ZCOOL XiaoWei'},{id:'chocolate-classical-sans',name:'朱古力黑体',short:'朱古力',family:'FeifeiFont15',desc:'Chocolate Classical Sans'},{id:'cactus-classical-serif',name:'仙人掌明体',short:'仙人掌',family:'FeifeiFont16',desc:'Cactus Classical Serif'}];
const EN_FONTS=[{id:'baloo-2',name:'Baloo 2',family:'FeifeiEn0'},{id:'fredoka',name:'Fredoka',family:'FeifeiEn1'},{id:'nunito',name:'Nunito',family:'FeifeiEn2'},{id:'quicksand',name:'Quicksand',family:'FeifeiEn3'},{id:'comic-neue',name:'Comic Neue',family:'FeifeiEn4'},{id:'patrick-hand',name:'Patrick Hand',family:'FeifeiEn5'},{id:'gochi-hand',name:'Gochi Hand',family:'FeifeiEn6'},{id:'gloria-hallelujah',name:'Gloria Hallelujah',family:'FeifeiEn7'},{id:'bubblegum-sans',name:'Bubblegum Sans',family:'FeifeiEn8'}];
cuteFontId=migrateCuteFont(saved.cuteFont);enFontId=migrateEnFont(saved.enFont);applyFontState();
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
// --- Explanation keywords: bold names that the question code uses again. ---
const PY_KEYWORDS=new Set('False None True and as assert async await break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield'.split(' '));
const PY_BUILTINS=new Set('abs all any ascii bin bool bytearray bytes callable chr classmethod compile complex delattr dict dir divmod enumerate eval exec filter float format frozenset getattr globals hasattr hash help hex id input int isinstance issubclass iter len list locals map max memoryview min next object oct open ord pow print property range repr reversed round set setattr slice sorted staticmethod str sum super tuple type vars zip __import__'.split(' '));
const STRING_STOPWORDS=new Set('the a an and or not is are was were be been being to of in on at for with from by as it its this that these those then than so if but do does did done can could should would will may might must use used using new old same different first second next last one two three true false none yes no ok hello world text string number numbers data value values result results item items function functions code file files line lines word words name names list lists print input output type int str float bool dict set tuple empty example sample'.split(' '));
// In English, a bare variable named "a" can collide with the article "a".
// Only bold it when the neighbouring words show it is used as a name.
const EN_VAR_NEXT=new Set('removes receives refers remains still can could is was are has had holds becomes points takes gets updates alone afterwards before and or then equals would will does do not first without creates returns keeps carries stores names gives goes'.split(' '));
function pythonTokens(code){const idents=new Set(),words=new Set(),text=String(code??'');for(let i=0;i<text.length;){const c=text[i];if(c==='#'){const j=text.indexOf('\n',i);i=j<0?text.length:j;continue;}const sm=/^[rRbBuUfF]{0,2}(?:'''|"""|'|")/.exec(text.slice(i));if(sm){const delim=/'''|"""|'|"/.exec(sm[0])[0];let k=i+sm[0].length;if(delim.length===3){while(k<text.length&&!text.startsWith(delim,k))k++;}else{while(k<text.length){if(text[k]==='\\'){k+=2;continue;}if(text[k]===delim)break;k++;}}for(const w of text.slice(i+sm[0].length,k).match(/[A-Za-z_]\w*/g)||[])words.add(w);i=k+delim.length;continue;}const im=/^[A-Za-z_]\w*/.exec(text.slice(i));if(im){idents.add(im[0]);i+=im[0].length;continue;}i++;}return {idents,words};}
function markdownCodeChunks(text){const chunks=[];const rest=String(text??'').replace(/```(?:\w+)?\n?([\s\S]*?)```/g,(match,code)=>{chunks.push(code);return '\u0000';});for(const m of rest.matchAll(/`([^`\n]+)`/g))chunks.push(m[1]);return chunks;}
function questionCodeSources(q){const sources=[];for(const lang of ['en','zh'])sources.push(...markdownCodeChunks(q.prompt?.[lang]));if(q.type==='mcq'&&Array.isArray(q.options)){for(const option of q.options)for(const lang of ['en','zh']){const text=option?.[lang]||'';if(text&&isCodeOption(text,q.id))sources.push(text);}}else if(q.type==='code')sources.push(q.starter||'',q.solution||'');return sources;}
function explanationTerms(q){if(!q)return [];if(q.__explanationTerms)return q.__explanationTerms;const idents=new Set(),words=new Set();for(const code of questionCodeSources(q)){const tokenized=pythonTokens(code);for(const v of tokenized.idents)idents.add(v);for(const v of tokenized.words)words.add(v);}const terms=new Set();for(const id of idents){if(PY_KEYWORDS.has(id)||id.startsWith('__'))continue;terms.add(id);}for(const word of words){if(word.length<2||PY_KEYWORDS.has(word)||PY_BUILTINS.has(word)||word.startsWith('__')||STRING_STOPWORDS.has(word.toLowerCase()))continue;terms.add(word);}q.__explanationTerms=[...terms];return q.__explanationTerms;}
function termPattern(terms,flags=''){const parts=[...new Set(terms)].sort((a,b)=>b.length-a.length).map(t=>t.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'));return new RegExp('(^|[^A-Za-z0-9_])('+parts.join('|')+')(?![A-Za-z0-9_])','g'+flags);}
function bareAIsVariable(text,index){const after=text.slice(index+1).replace(/\*\*/g,'');const first=(/^\s*(.)/.exec(after)||[])[1];if(!first)return true;if(/[.,;:!?)\]}"'#]/.test(first)||/[=+\-*/%<>!&|^~]/.test(first))return true;const nextWord=/^\s+([A-Za-z]+)/.exec(after);return !!(nextWord&&EN_VAR_NEXT.has(nextWord[1]));}
function highlightedExplanation(q){const text=bilingual(q.explanation),terms=explanationTerms(q);if(!terms.length)return md(text);const multi=terms.filter(t=>t.length>1),single=terms.filter(t=>t.length===1),multiPattern=multi.length?termPattern(multi,'i'):null,singlePattern=single.length?termPattern(single):null;return md(text.split(/(```[\s\S]*?```|`[^`\n]+`)/g).map((part,index)=>{if(index%2)return part;let out=part;if(multiPattern)out=out.replace(multiPattern,(match,prefix,term)=>prefix+'**'+term+'**');if(singlePattern)out=out.replace(singlePattern,(match,prefix,term,offset,whole)=>{if(language==='en'&&term==='a'&&!bareAIsVariable(whole,offset+prefix.length))return match;return prefix+'**'+term+'**';});return out;}).join(''));}
function save(){saved.language=language;saved.chapter=chapter;saved.cuteFont=cuteFontId;saved.enFont=enFontId;try{localStorage.setItem(KEY,JSON.stringify(saved));}catch{toast('浏览器存储空间不足，请导出学习记录。');}}
function migrateCuteFont(value){if(value===false||value==='default')return 'default';if(value===true||value===undefined)return 'zcool-kuaile';if(typeof value==='string'&&CUTE_FONTS.some(f=>f.id===value))return value;return 'zcool-kuaile';}
function fontById(id){return CUTE_FONTS.find(f=>f.id===id);}
function fontLabel(id){if(id==='default')return '默认字体';const f=fontById(id);return f?f.name:'站酷快乐体';}
function migrateEnFont(value){if(typeof value==='string'&&EN_FONTS.some(f=>f.id===value))return value;return 'default';}
function enFontById(id){return EN_FONTS.find(f=>f.id===id);}
function enFontLabel(id){if(id==='default')return '默认字体';const f=enFontById(id);return f?f.name:'默认字体';}
function applyFontState(){const cnOn=cuteFontId!=='default',enOn=enFontId!=='default';document.documentElement.classList.toggle('cute-font',cnOn||enOn);if(cnOn)document.documentElement.setAttribute('data-font-id',cuteFontId);else document.documentElement.removeAttribute('data-font-id');if(enOn)document.documentElement.setAttribute('data-en-font-id',enFontId);else document.documentElement.removeAttribute('data-en-font-id');}
function updateFontPicker(){const b=$('fontPickerBtn'),label=$('fontPickerLabel');if(!b)return;const name=fontLabel(cuteFontId);if(label)label.textContent=name;b.classList.toggle('is-active',cuteFontId!=='default');b.title='中文字体：'+name+'（点击切换）';b.setAttribute('aria-label','选择中文字体，当前：'+name);}
function updateEnFontPicker(){const b=$('enFontPickerBtn'),label=$('enFontPickerLabel');if(!b)return;const name=enFontLabel(enFontId);if(label)label.textContent=name;b.classList.toggle('is-active',enFontId!=='default');b.title='英文字体：'+name+'（点击切换）';b.setAttribute('aria-label','选择英文字体，当前：'+name);}
function pickerItemHtml(o,sample,selectedId){return `<button class="fp-item" type="button" role="option" data-font-id="${o.id}" aria-selected="${o.id===selectedId}"><span class="fp-sample${o.family?'':' fp-sample-default'}"${o.family?` style="font-family:${o.family}"`:''}>${sample}</span><span class="fp-name">${esc(o.name)}</span><span class="fp-check">${o.id===selectedId?'✓':''}</span></button>`;}
function renderFontMenu(){const menu=$('fontPickerMenu');if(!menu)return;const options=[{id:'default',name:'默认字体',family:''}].concat(CUTE_FONTS);menu.innerHTML=options.map(o=>pickerItemHtml(o,'跟着飞飞老师',cuteFontId)).join('');}
function renderEnFontMenu(){const menu=$('enFontPickerMenu');if(!menu)return;const options=[{id:'default',name:'默认字体',family:''}].concat(EN_FONTS);menu.innerHTML=options.map(o=>pickerItemHtml(o,'Hello, 2026!',enFontId)).join('');}
function toggleFontMenu(open){const menu=$('fontPickerMenu'),b=$('fontPickerBtn');if(!menu||!b)return;const next=typeof open==='boolean'?open:menu.hidden;if(next){renderFontMenu();toggleEnFontMenu(false);}menu.hidden=!next;b.setAttribute('aria-expanded',String(next));if(next){const sel=menu.querySelector('[aria-selected="true"]');(sel||menu.querySelector('.fp-item'))?.focus();}}
function toggleEnFontMenu(open){const menu=$('enFontPickerMenu'),b=$('enFontPickerBtn');if(!menu||!b)return;const next=typeof open==='boolean'?open:menu.hidden;if(next){renderEnFontMenu();toggleFontMenu(false);}menu.hidden=!next;b.setAttribute('aria-expanded',String(next));if(next){const sel=menu.querySelector('[aria-selected="true"]');(sel||menu.querySelector('.fp-item'))?.focus();}}
function applyCuteFont(id,notify=true){cuteFontId=id==='default'||fontById(id)?id:'zcool-kuaile';applyFontState();saved.cuteFont=cuteFontId;save();updateFontPicker();if(notify)toast('中文字体：'+fontLabel(cuteFontId));}
function applyEnFont(id,notify=true){enFontId=id==='default'||enFontById(id)?id:'default';applyFontState();saved.enFont=enFontId;save();updateEnFontPicker();if(notify)toast('英文字体：'+enFontLabel(enFontId));}
function bindMenuKeys(menuId){const menu=$(menuId);if(!menu)return;menu.addEventListener('keydown',e=>{if(e.key!=='ArrowDown'&&e.key!=='ArrowUp')return;e.preventDefault();const items=[...menu.querySelectorAll('[data-font-id]')];const i=items.indexOf(document.activeElement);const next=items[(i+(e.key==='ArrowDown'?1:-1)+items.length)%items.length];next?.focus();});}
function currentNote(){return current?(saved.notes[current.id]||''):'';}
function updateNoteUI(){const input=$('noteInput');if(!input)return;const note=currentNote();if(input.value!==note)input.value=note;if($('noteCount'))$('noteCount').textContent=note.length+' 字';if($('noteStatus'))$('noteStatus').textContent='自动保存到本机';}
function saveNote(){if(!current){return;}const input=$('noteInput');if(!input)return;saved.notes[current.id]=input.value;save();if($('noteCount'))$('noteCount').textContent=input.value.length+' 字';if($('noteStatus'))$('noteStatus').textContent='已自动保存';clearTimeout(saveNote.timer);saveNote.timer=setTimeout(()=>{if($('noteStatus'))$('noteStatus').textContent='自动保存到本机';},1800);}
function record(id=current?.id){return saved.records[id]||{};}
function toast(text){$('toast').textContent=text;$('toast').classList.add('show');clearTimeout(toast.timeout);toast.timeout=setTimeout(()=>$('toast').classList.remove('show'),3300);}
function chapterItems(){return questions.filter(q=>q.chapter===chapter);}
function updateFilters(){filtered=chapterItems().filter(q=>(type==='all'||q.type===type)&&(!level||q.difficulty===level)&&(topic==='all'||q.topic===topic)&&(review==='all'||review==='wrong'&&record(q.id).wrong||review==='favorite'&&record(q.id).favorite||review==='unseen'&&!record(q.id).attempted)&&(!search||[q.id,q.title.en,q.title.zh,q.prompt.en,q.prompt.zh,q.topicLabel.en,q.topicLabel.zh].join(' ').toLowerCase().includes(search)));}
function renderSidebar(){const totals={};questions.forEach(q=>{totals[q.chapter]??={total:0,done:0};totals[q.chapter].total++;if(record(q.id).solved)totals[q.chapter].done++;});$('chapterNav').innerHTML=meta.chapters.map(c=>`<button class="chapter-button ${c.id===chapter?'active':''}" data-chapter="${c.id}" aria-current="${c.id===chapter?'page':'false'}"><span class="nav-code">${c.code}</span><span><b>${esc(c.name.zh)}</b><small>${totals[c.id]?.total||0} 题 · ${esc(c.name.en)}</small></span>${totals[c.id]?.done===totals[c.id]?.total?'<span class="nav-dot"></span>':''}</button>`).join('');const done=questions.filter(q=>record(q.id).solved).length;$('overallCount').textContent=`${done} / ${questions.length}`;$('overallBar').style.width=`${done/questions.length*100}%`;$('totalCount').textContent=questions.length;}
function renderHeader(){const c=meta.chapters.find(c=>c.id===chapter);const items=chapterItems(),done=items.filter(q=>record(q.id).solved).length,total=items.length;$('chapterKicker').textContent=(c.code.startsWith('T')?'PRACTICE ':'CHAPTER ')+c.code;$('chapterTitle').innerHTML=esc(c.name.zh)+` <span>${esc(c.name.en)}</span>`;$('chapterDesc').textContent=c.description.zh;$('chapterSolved').textContent=done;$('chapterTotal').textContent=' / '+total;if($('topProgress'))$('topProgress').textContent='已通过 '+done+' / '+total;$('langEn').classList.toggle('active',language==='en');$('langZh').classList.toggle('active',language==='zh');$('langEn').setAttribute('aria-pressed',language==='en');$('langZh').setAttribute('aria-pressed',language==='zh');}
function renderTopics(){const topics=new Map();chapterItems().forEach(q=>topics.set(q.topic,q.topicLabel));$('topicFilters').innerHTML=`<button data-topic="all" class="${topic==='all'?'active':''}">全部知识点</button>`+[...topics.entries()].map(([key,name])=>`<button data-topic="${esc(key)}" class="${topic===key?'active':''}">${esc(name.zh)}</button>`).join('');}
function renderGrid(){const total=chapterItems().length;const hasFilter=type!=='all'||level>0||topic!=='all'||review!=='all'||!!search;const done=filtered.filter(q=>record(q.id).solved).length;$('filteredCount').textContent=hasFilter?'筛选 '+filtered.length+' / '+total:'已通过 '+done+' / '+total;$('questionGrid').innerHTML=filtered.map(q=>{const r=record(q.id);return `<button data-question="${q.id}" title="${esc(bilingual(q.title))}" aria-label="${esc(q.id+' '+bilingual(q.title))}" class="${current?.id===q.id?'active ':''}${r.solved?'done ':r.wrong?'wrong ':''}${r.favorite?'fav':''}">${q.id.split('-').pop().replace(/^0+/,'')}</button>`;}).join('');}
function disposeEditor(){if(editor){const model=editor.getModel();editor.dispose();model?.dispose();editor=null;}fallback=null;editorQuestionId=null;}
function saveDraft(){if(!editorQuestionId)return;const value=editor?editor.getValue():fallback?.value;if(value!==undefined){saved.drafts[editorQuestionId]=value;save();}}
function revealQuestionCard(){const card=$('questionCard');if(!card)return;const rect=card.getBoundingClientRect();if(rect.top<90||rect.top>innerHeight*.55)card.scrollIntoView({behavior:'smooth',block:'start'});}
function selectQuestion(id){if(busy)cancelRun();saveDraft();current=filtered.find(q=>q.id===id)||filtered[0]||null;answerOpen=false;selected=current?(record().selection??null):null;checked=!!record().attempted; if(current){saved.last[chapter]=current.id;save();}renderQuestion();renderGrid();revealQuestionCard();}
function render(){if(busy)cancelRun();updateFilters();renderSidebar();renderHeader();renderTopics();if(!current||!filtered.some(q=>q.id===current.id)){current=filtered.find(q=>q.id===saved.last[chapter])||filtered[0]||null;answerOpen=false;selected=current?(record().selection??null):null;checked=!!record().attempted;}renderQuestion();renderGrid();}
function renderQuestion(){saveDraft();disposeEditor();if(!current){$('questionCard').innerHTML='<div class="empty-state"><p>这里还没有匹配的题目。<br>换一个知识点，或先把筛选放宽一点吧。</p><button class="button secondary" data-action="clear">重置筛选</button></div>';return;}
 const q=current,r=record(),i=filtered.findIndex(x=>x.id===q.id);
 const nextLabel=i===filtered.length-1?'回到第一题 ↺':'下一题 →';
 const answerLabel=q.type==='mcq'?(answerOpen?'收起答案与解析':'查看答案与解析'):(answerOpen?'收起解析':'查看答案与解析');
 let content=`<div class="question-top"><div class="question-meta"><span class="q-id">${q.id}</span><span class="badge level${q.difficulty}">${labels[q.difficulty]}</span><span>${q.type==='mcq'?'单项选择':'动手编程'} · ${esc(bilingual(q.topicLabel))}</span></div><div class="question-tools"><label class="speed-toggle" title="极速刷题：点击选项立即判分并显示解析"><input type="checkbox" id="speedModeToggle" role="switch" aria-checked="${speedMode}" ${speedMode?'checked':''}><span class="speed-toggle-track"><span class="speed-toggle-knob"></span></span><span class="speed-toggle-label">极速刷题</span></label><button class="random-chip" data-action="random" title="随机来一题" aria-label="随便练练，随机来一题">随便练练</button><button class="bookmark ${r.favorite?'active':''}" data-action="favorite" aria-label="${r.favorite?'取消收藏':'收藏题目'}" aria-pressed="${!!r.favorite}">${r.favorite?'★':'☆'}</button></div></div><h3>${esc(bilingual(q.title))}</h3><div class="markdown prompt">${md(bilingual(q.prompt))}</div>`;
 if(q.type==='mcq'){
  const locked=checked&&selected!==null,good=selected===q.answer;
  content+='<div class="options">'+q.options.map((o,n)=>`<button class="option ${n===selected?'selected ':''}${checked&&n===q.answer?'correct ':''}${checked&&n===selected&&n!==q.answer?'incorrect ':''}${locked?'locked ':''}${bilingual(o).length>90||isCodeOption(bilingual(o),q.id)?'wide ':''}${isCodeOption(bilingual(o),q.id)?'code-option':''}" data-option="${n}" aria-pressed="${n===selected}"${locked?' aria-disabled="true"':''}><span class="option-letter">${String.fromCharCode(65+n)}</span><span class="markdown">${optionMarkdown(bilingual(o),q.id)}</span></button>`).join('')+'</div>';
  if(locked)content+=`<div class="feedback ${good?'ok':'error'}" role="status"><span class="feedback-text"><b>${good?'就是它！':'差半步，再想一想。'}</b>${good?'答对啦！用自己的话把理由说一遍，这题就真的会了。':'先回到题干，把最关键的一行再读一遍，然后点「再试一次」。'}</span></div>`;
  content+='<div class="question-actions">';
  if(locked&&good)content+=`<button class="button" data-action="next">${nextLabel}</button><button class="button secondary" data-action="answer">${answerLabel}</button>`;
  else if(locked)content+=`<button class="button" data-action="retry">再试一次</button><button class="button secondary" data-action="answer">${answerLabel}</button>`;
  else content+=`<button class="button" data-action="check">检查答案</button><button class="button secondary" data-action="answer">${answerLabel}</button>`;
  content+='</div>';
 } else {
  content+=`<div class="editor-shell"><div class="editor-header"><span>◦ &nbsp; main.py</span><span>Python 3.12</span></div><div class="editor-host" id="codeEditor" aria-label="Python代码编辑器"></div><div class="editor-tools"><button data-action="reset">↻ 重置代码</button><button data-action="download">↓ 下载 .py</button></div></div><p class="test-hint">⌘ / Ctrl + Enter 运行 · Tab 缩进 · ${esc(bilingual(q.testHint))}</p><div class="question-actions"><button class="button" data-action="run" ${busy?'disabled':''}>▷ 运行代码</button><button class="button secondary" data-action="test" ${busy?'disabled':''}>✓ 检查测试</button><button class="button secondary" data-action="answer">${answerLabel}</button><button class="button stop" id="stopRun" data-action="stop" ${busy?'':'hidden'}>停止</button></div><div id="outputPanel" class="output-panel" ${busy?'':'hidden'}><div class="output-title"><span id="outputTitle">PYTHON OUTPUT</span><span id="runtimeStatus">${busy?'运行中…':''}</span></div><pre id="codeOutput">${busy?'正在准备 Python 环境…':''}</pre></div>`;
 }
 if(answerOpen){content+=`<section class="answer-panel"><div class="answer-heading"><span>✦</span>${q.type==='mcq'?'参考答案：'+String.fromCharCode(65+q.answer):'参考答案与思路'}</div>`;if(q.type==='code')content+=`<div class="markdown">${md('```python\n'+q.solution+'\n```')}</div>`;content+=`<div class="markdown">${highlightedExplanation(q)}</div>`;if(q.type==='code')content+=`<details class="source-box"><summary>查看本题测试样例</summary><div class="markdown">${md('```python\n'+q.tests+'\n```')}</div></details>`;content+=`<details class="source-box"><summary>参考与出题依据 · 教学变式</summary><p>${esc(q.source.label)}</p><p>${esc(bilingual(q.source.note))}</p>${/^https?:\/\//.test(q.source.url)?`<a href="${esc(q.source.url)}" target="_blank" rel="noreferrer">查看参考来源 ↗</a>`:''}</details></section>`;}
 content+=`<div class="question-pagination"><span>第 ${i+1} / ${filtered.length} 题</span><div class="page-buttons"><button data-action="prev" ${i===0?'disabled':''}>← 上一题</button><button data-action="next" ${i===filtered.length-1?'disabled':''}>下一题 →</button></div></div>`;
 $('questionCard').innerHTML=content;if(q.type==='code')mountEditor(q);colorize();updateNoteUI();}
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
const EDITOR_MIN_HEIGHT=150,EDITOR_MAX_HEIGHT=340,EDITOR_LINE=24;
function editorTargetHeight(text){const lines=Math.max(1,String(text??'').split('\n').length);return Math.max(EDITOR_MIN_HEIGHT,Math.min(EDITOR_MAX_HEIGHT,lines*EDITOR_LINE+34));}
function fitEditorHeight(){const host=$('codeEditor');if(!host)return;const text=editor?.getModel()?.getValue()??fallback?.value??'';host.style.height=editorTargetHeight(text)+'px';if(fallback)fallback.style.height='100%';if(editor)editor.layout();}
function mountEditor(q){const host=$('codeEditor');if(!host)return;if(editor)disposeEditor();host.innerHTML='';editorQuestionId=q.id;const value=saved.drafts[q.id]??q.starter;
 if(monacoReady){editor=monaco.editor.create(host,{value,language:'python',theme:'feifei',fontSize:14,lineHeight:24,fontFamily:'"SFMono-Regular", Consolas, "Liberation Mono", monospace',minimap:{enabled:false},scrollBeyondLastLine:false,automaticLayout:true,tabSize:4,insertSpaces:true,wordWrap:'on',padding:{top:14,bottom:10},lineNumbersMinChars:3,renderLineHighlight:'all',overviewRulerLanes:0,hideCursorInOverviewRuler:true,bracketPairColorization:{enabled:true},quickSuggestions:{other:true,comments:false,strings:false},suggestOnTriggerCharacters:true});fitEditorHeight();editor.onDidChangeModelContent(()=>{saved.drafts[q.id]=editor.getValue();save();fitEditorHeight();});editor.addCommand(monaco.KeyMod.CtrlCmd|monaco.KeyCode.Enter,()=>runCode(false));}
 else{host.innerHTML='<textarea class="fallback-editor" spellcheck="false" aria-label="Python代码编辑器"></textarea>';fallback=host.querySelector('textarea');fallback.value=value;fallback.addEventListener('input',()=>{saveDraft();fitEditorHeight();});fallback.addEventListener('keydown',e=>{if(e.key==='Tab'){e.preventDefault();const a=fallback.selectionStart;fallback.setRangeText('    ',a,fallback.selectionEnd,'end');saveDraft();fitEditorHeight();}if((e.ctrlKey||e.metaKey)&&e.key==='Enter'){e.preventDefault();runCode(false);}});fitEditorHeight();}}
function checkMCQ(){if(selected===null){toast('先选一个你认为正确的选项吧。');return;}const good=selected===current.answer;saved.records[current.id]={...record(),selection:selected,attempted:true,solved:good,wrong:!good};checked=true;if(speedMode)answerOpen=true;save();renderSidebar();renderHeader();renderQuestion();renderGrid();}
function changeChapter(id){saveDraft();chapter=id;current=null;clearFilters();save();$('sidebar').classList.remove('open');$('mobileShade').classList.remove('active');revealQuestionCard();}
function changeLanguage(lang){saveDraft();language=lang;save();renderHeader();renderQuestion();renderGrid();}
function clearFilters(){topic='all';type='all';level=0;review='all';search='';$('searchInput').value='';document.querySelectorAll('[data-review]').forEach(b=>{const on=b.dataset.review==='all';b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on));});document.querySelectorAll('[data-type]').forEach(b=>b.classList.toggle('active',b.dataset.type==='all'));document.querySelectorAll('[data-level]').forEach(b=>b.classList.toggle('active',b.dataset.level==='0'));render();}
function replaceStudyRecords(nextState){
 // Stop queued execution and detach the editor before clearing drafts.
 runID++;
 cancelRun();
 disposeEditor();
 saved=nextState;
 cuteFontId=migrateCuteFont(saved.cuteFont);enFontId=migrateEnFont(saved.enFont);applyFontState();updateFontPicker();updateEnFontPicker();
 selected=null;
 checked=false;
 answerOpen=false;
 current=null;
 clearFilters();
}
function clearStudyRecords(){
 replaceStudyRecords({version:1,records:{},drafts:{},last:{},language,chapter,cuteFont:cuteFontId,enFont:enFontId,notes:{...saved.notes},speedMode,resetAt:Date.now()});
 save();
 toast('做题记录已清空，可以重新开始练习了。');
}
function download(text,name,mime='application/json'){const blob=new Blob([text],{type:mime});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);}
function cancelRun(reason='已停止运行。可以修改代码后再试。'){clearTimeout(timer);worker?.terminate();worker=null;busy=false;document.querySelectorAll('[data-action="run"],[data-action="test"]').forEach(b=>b.disabled=false);$('stopRun')?.setAttribute('hidden','');if($('codeOutput')){$('codeOutput').textContent=reason;$('runtimeStatus').textContent='已停止';}}
function ensureWorker(){if(!worker){worker=new Worker('pyworker.js');worker.onerror=e=>{showOutput('Python 环境未能启动：'+e.message,true);finishRun();worker?.terminate();worker=null;};worker.onmessage=event=>{const data=event.data;if(data.id!==runID)return;if(data.status){if($('runtimeStatus'))$('runtimeStatus').textContent=data.status;if(data.phase==='running'){clearTimeout(timer);timer=setTimeout(()=>cancelRun('代码运行超过8秒，已自动停止。请检查循环是否有结束条件，或缩小输入。'),8000);}return;}clearTimeout(timer);if(data.kind==='result'){const q=questions.find(q=>q.id===data.questionId);if(data.check){saved.records[q.id]={...record(q.id),attempted:true,solved:data.ok,wrong:!data.ok};save();renderSidebar();renderHeader();renderGrid();}if(current?.id===data.questionId){let message=data.stdout||'';if(data.ok)message+=(message?'\n':'')+(data.check?'✓ 本题样例测试通过。写法限制请结合题干自行核对；也可以设计一个新输入再检查。':'✓ 运行完成。'+(!data.stdout?'代码没有打印内容；函数返回值可用 print(...) 查看。':''));else message+=(message?'\n':'')+friendlyError(data.error)+'\n\n'+data.error;showOutput(message,!data.ok,data.check?'测试结果':'运行结果');}finishRun();}};}return worker;}
function friendlyError(s){if(/AssertionError/.test(s))return '有测试结果与题目要求不同。先检查边界输入、返回值和输出格式。';if(/SyntaxError|IndentationError|TabError/.test(s))return 'Python 没有读懂这段写法。检查冒号、引号、括号和缩进。';if(/NameError/.test(s))return '有名称尚未定义。检查变量拼写、函数名，或是否遗漏 import。';if(/TypeError/.test(s))return '某个值的类型与操作不匹配。检查字符串和数字是否需要转换。';if(/NotImplementedError/.test(s))return '起步代码还没有完成。把 pass 或 NotImplementedError 换成你的实现吧。';if(/EOFError/.test(s))return '本页不使用交互式 input()。请按题目给定的函数参数接收数据。';return '出现了一点小问题。先读最后一行错误，再回到对应代码检查。';}
function showOutput(text,error=false,title='运行结果'){const panel=$('outputPanel');if(!panel)return;panel.hidden=false;panel.classList.toggle('error',error);$('codeOutput').textContent=text;$('runtimeStatus').textContent=error?'再检查一下':'完成';$('outputTitle').textContent=title;}
function finishRun(){clearTimeout(timer);busy=false;document.querySelectorAll('[data-action="run"],[data-action="test"]').forEach(b=>b.disabled=false);$('stopRun')?.setAttribute('hidden','');}
function runCode(check){if(busy||!current||current.type!=='code')return;saveDraft();busy=true;runID++;const q=current;document.querySelectorAll('[data-action="run"],[data-action="test"]').forEach(b=>b.disabled=true);$('stopRun').hidden=false;$('outputPanel').hidden=false;$('outputPanel').classList.remove('error');$('codeOutput').textContent='正在准备 Python 环境，第一次运行稍等片刻…';$('runtimeStatus').textContent='准备中…';timer=setTimeout(()=>cancelRun('Python 环境准备超时。请重新点击运行；如果持续出现，请刷新页面或检查网络后重试。'),60000);ensureWorker().postMessage({id:runID,questionId:q.id,code:saved.drafts[q.id]??q.starter,setup:q.setup||'',tests:q.tests||'',packages:q.packages||[],check});}
const EXAM_SIZE=40;
function chapterName(id){const c=meta?.chapters.find(c=>c.id===id);return c?c.name.zh:'';}
function buildExamPaper(){const pools=meta.chapters.map(c=>({items:questions.filter(q=>q.chapter===c.id&&q.type==='mcq')}));pools.forEach(p=>{for(let i=p.items.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[p.items[i],p.items[j]]=[p.items[j],p.items[i]];}});const total=pools.reduce((n,p)=>n+p.items.length,0);const target=Math.min(EXAM_SIZE,total);const active=pools.filter(p=>p.items.length).map(p=>({...p,used:0}));const drawn=[];let rounds=0;while(drawn.length<target&&active.length&&rounds<100){let progressed=false;for(const p of active){if(p.used<p.items.length){drawn.push(p.items[p.used]);p.used++;progressed=true;if(drawn.length>=target)break;}}if(!progressed)break;rounds++;}examPaper=drawn.sort(()=>Math.random()-.5);examIndex=0;examAnswers={};examSubmitted=false;examResultData=null;}
function examAnsweredCount(){return examPaper?examPaper.filter(q=>examAnswers[q.id]!==undefined).length:0;}
function openExam(){if(!meta)return;if(!examPaper||examSubmitted)buildExamPaper();if(!examPaper||!examPaper.length){toast('当前题库中没有选择题，无法进行模拟考试。');return;}$('examOverlay').hidden=false;document.body.classList.add('exam-open');renderExam();}
function closeExam(){const o=$('examOverlay');if(!o)return;o.hidden=true;document.body.classList.remove('exam-open');}
function examOptionMarkup(q){return '<div class="options exam-options">'+q.options.map((o,n)=>{const sel=examAnswers[q.id]===n,code=isCodeOption(bilingual(o),q.id),wide=bilingual(o).length>90||code;return `<button class="option ${sel?'selected ':''}${wide?'wide ':''}${code?'code-option':''}" type="button" data-exam-option="${n}" aria-pressed="${sel}"><span class="option-letter">${String.fromCharCode(65+n)}</span><span class="markdown">${optionMarkdown(bilingual(o),q.id)}</span></button>`;}).join('')+'</div>';}
function renderExamQuestion(){const q=examPaper[examIndex];if(!q){$('examQuestion').innerHTML='';return;}$('examQuestion').innerHTML=`<div class="exam-q-meta"><span class="q-id">${q.id}</span><span class="badge level${q.difficulty}">${labels[q.difficulty]}</span><span>${esc(chapterName(q.chapter))} · ${esc(bilingual(q.topicLabel))}</span></div><h3>${esc(bilingual(q.title))}</h3><div class="markdown prompt">${md(bilingual(q.prompt))}</div>${examOptionMarkup(q)}`;colorize();}
function renderExamGrid(){const grid=$('examGrid');if(!grid||!examPaper)return;grid.innerHTML=examPaper.map((q,i)=>{const answered=examAnswers[q.id]!==undefined;let cls='';if(examSubmitted)cls=answered?(examAnswers[q.id]===q.answer?'correct':'wrong'):'skipped';else if(answered)cls='answered';return `<button type="button" class="${cls}${i===examIndex?' active':''}" data-exam-jump="${i}" aria-label="第 ${i+1} 题">${i+1}</button>`;}).join('');if($('examSideCount'))$('examSideCount').textContent=`${examAnsweredCount()} / ${examPaper.length}`;}
function examGrade(){const result={total:examPaper.length,correct:0,chapters:{},wrong:[]};examPaper.forEach(q=>{const c=q.chapter;result.chapters[c]??={total:0,correct:0};result.chapters[c].total++;const ok=examAnswers[q.id]===q.answer;if(ok){result.correct++;result.chapters[c].correct++;}else result.wrong.push(q);});result.percent=Math.round(result.correct/result.total*100);return result;}
function renderExamResult(){const r=examResultData||examGrade();const rows=meta.chapters.filter(c=>r.chapters[c.id]).map(c=>{const s=r.chapters[c.id],pct=s.total?Math.round(s.correct/s.total*100):0;return `<div class="exam-chapter"><span>${esc(c.name.zh)}</span><b>${s.correct} / ${s.total}</b><i style="width:${pct}%"></i></div>`;}).join('');const wrong=r.wrong.length?r.wrong.map(q=>{const chosen=examAnswers[q.id],chosenText=chosen===undefined?'未作答':String.fromCharCode(65+chosen);return `<details class="exam-wrong"><summary><span class="exam-wrong-id">${q.id}</span>${esc(bilingual(q.title))}<em>你选 ${chosenText} · 正确 ${String.fromCharCode(65+q.answer)}</em></summary><div class="markdown exam-wrong-body">${md(bilingual(q.explanation))}</div></details>`;}).join(''):'<p class="exam-all-correct">全部答对，漂亮！</p>';$('examResult').innerHTML=`<div class="exam-score"><span>本次得分</span><b>${r.correct}</b><span>/ ${r.total}</span><em>${r.percent}%</em></div><div class="exam-score-line">正确 ${r.correct} 题 · 错误 ${r.total-r.correct} 题</div><div class="exam-chapters">${rows}</div><div class="exam-actions"><button type="button" class="button" data-exam-action="retry">再考一次</button><button type="button" class="button secondary" data-exam-action="close">关闭</button></div><h3 class="exam-wrong-title">错题回顾${r.wrong.length?'（'+r.wrong.length+'）':''}</h3>${wrong}`;}
function renderExam(){if(!examPaper||!examPaper.length)return;const answered=examAnsweredCount();$('examSub').textContent=examSubmitted?'本次模拟考试已交卷，可以查看错题解析。':`从每个章节随机抽取选择题，共 ${examPaper.length} 题；交卷后自动打分。已答 ${answered} / ${examPaper.length}`;$('examProgressText').textContent=examSubmitted?'已交卷':`第 ${examIndex+1} / ${examPaper.length} 题`;$('examAnsweredText').textContent=`已答 ${answered} / ${examPaper.length}`;$('examNavBtns').hidden=examSubmitted;$('examQuestion').hidden=examSubmitted;$('examResult').hidden=!examSubmitted;if($('examTip'))$('examTip').textContent=examSubmitted?'绿色=答对，红色=答错，灰色=未作答；点「错题回顾」展开解析。':'已答题目为绿色；当前题带深色描边；交卷后可查看错题解析。';renderExamGrid();if(examSubmitted)renderExamResult();else renderExamQuestion();}
function submitExam(){if(!examPaper||examSubmitted)return;const left=examPaper.length-examAnsweredCount();if(left>0&&!confirm(`还有 ${left} 道题未作答，确定交卷吗？`))return;examSubmitted=true;examResultData=examGrade();renderExam();toast(`模拟考试得分：${examResultData.correct} / ${examResultData.total}（${examResultData.percent}%）`);}

/* ------------------------------------------------------------------ *
 * Question bank: Excel template / import / export (IndexedDB storage)
 * ------------------------------------------------------------------ */
const BANK_TEMPLATE_PATH='assets/question-bank-template.xlsx';
const BANK_CHAPTER_COLS=['章节ID','章节编号','章节中文名','章节英文名','章节描述(中文)','章节描述(英文)','图标(可选)'];
const BANK_QUESTION_COLS=['题目ID','章节ID','题型','难度','知识点(中文)','知识点(英文)','题目标题(中文)','题目标题(英文)','题干(中文)','题干(英文)','选项A(中文)','选项A(英文)','选项B(中文)','选项B(英文)','选项C(中文)','选项C(英文)','选项D(中文)','选项D(英文)','正确答案','解析(中文)','解析(英文)','起始代码','参考答案代码','测试代码','运行提示(中文)','运行提示(英文)','环境设置代码','依赖包','来源标签','来源说明(中文)','来源说明(英文)','来源链接','备注'];
const BANK_DIFFICULTY={'基础':1,'进阶':2,'挑战':3,'1':1,'2':2,'3':3};
let bankIsCustom=false;
const bankStr=v=>String(v??'').trim();
const bankPair=(zh,en)=>{const z=bankStr(zh),e=bankStr(en);return {zh:z||e,en:e||z};};
function bankSheetRows(wb,names){const name=(wb.SheetNames||[]).find(n=>names.includes(String(n).trim()));if(!name)return null;return XLSX.utils.sheet_to_json(wb.Sheets[name],{header:1,raw:false,defval:''});}
function bankHeaderMap(rows,anchor){for(let i=0;i<Math.min(rows.length,15);i++){const cells=(rows[i]||[]).map(bankStr);if(cells.includes(anchor)){const map={};cells.forEach((c,idx)=>{if(c&&map[c]===undefined)map[c]=idx;});return {index:i,map};}}return null;}
function bankCell(row,map,name){const idx=map[name];if(idx===undefined)return '';return bankStr(row[idx]);}
function parseBankWorkbook(wb){
 const errors=[];
 const mark=(sheet,row,message)=>errors.push({sheet,row,message});
 const questRows=bankSheetRows(wb,['题目','题库','questions','Questions']);
 if(!questRows){return {bank:null,errors:[{sheet:'工作簿',row:0,message:'缺少「题目」工作表，请使用下载的题库模板。'}]};}
 const qh=bankHeaderMap(questRows,'题目ID');
 if(!qh){return {bank:null,errors:[{sheet:'题目',row:0,message:'未找到表头「题目ID」，请使用下载的题库模板。'}]};}
 const essential=['题目ID','章节ID','题型','难度','题目标题(中文)','题目标题(英文)','题干(中文)','题干(英文)'];
 const miss=essential.filter(c=>!(c in qh.map));
 if(miss.length){return {bank:null,errors:[{sheet:'题目',row:qh.index+1,message:'缺少必需列：'+miss.join('、')}]};}
 let chapters=[];const chapterMap=new Map();
 const chapterRows=bankSheetRows(wb,['章节','chapters','Chapters']);
 if(chapterRows){
   const ch=bankHeaderMap(chapterRows,'章节ID');
   if(ch){
     for(let i=ch.index+1;i<chapterRows.length;i++){
       const row=chapterRows[i]||[];
       const id=bankCell(row,ch.map,'章节ID');
       if(!id||/^(示例|example)/i.test(id))continue;
       if(chapterMap.has(id)){mark('章节',i+1,'章节ID重复：'+id);continue;}
       const nameZh=bankCell(row,ch.map,'章节中文名'),nameEn=bankCell(row,ch.map,'章节英文名');
       const c={id,code:bankCell(row,ch.map,'章节编号')||String(chapters.length+1).padStart(2,'0'),name:bankPair(nameZh,nameEn),file:'',icon:bankCell(row,ch.map,'图标(可选)')||'book',description:bankPair(bankCell(row,ch.map,'章节描述(中文)'),bankCell(row,ch.map,'章节描述(英文)'))};
       if(!c.name.zh){mark('章节',i+1,'缺少章节中文名（或英文名）');continue;}
       chapters.push(c);chapterMap.set(id,c);
     }
   }else mark('章节',1,'未找到表头「章节ID」');
 }
 const questions=[],qids=new Set();
 for(let i=qh.index+1;i<questRows.length;i++){
   const row=questRows[i]||[];
   const id=bankCell(row,qh.map,'题目ID');
   if(!id||/^(示例|example)/i.test(id))continue;
   if(qids.has(id)){mark('题目',i+1,'题目ID重复：'+id);continue;}
   const chapterId=bankCell(row,qh.map,'章节ID');
   const typeRaw=bankCell(row,qh.map,'题型');
   const type=/选择|单选|mcq/i.test(typeRaw)?'mcq':(/编程|代码|code/i.test(typeRaw)?'code':'');
   const difficulty=BANK_DIFFICULTY[bankCell(row,qh.map,'难度')]||0;
   if(!chapterId){mark('题目',i+1,'缺少章节ID');continue;}
   if(!chapterMap.has(chapterId)){mark('题目',i+1,'章节ID不存在：'+chapterId+'（请先在「章节」表定义）');continue;}
   if(!type){mark('题目',i+1,'题型必须填「选择题」或「编程题」');continue;}
   if(!difficulty){mark('题目',i+1,'难度必须填「基础/进阶/挑战」或 1/2/3');continue;}
   const titleZh=bankCell(row,qh.map,'题目标题(中文)'),titleEn=bankCell(row,qh.map,'题目标题(英文)');
   const promptZh=bankCell(row,qh.map,'题干(中文)'),promptEn=bankCell(row,qh.map,'题干(英文)');
   if(!titleZh&&!titleEn){mark('题目',i+1,'缺少题目标题');continue;}
   if(!promptZh&&!promptEn){mark('题目',i+1,'缺少题干');continue;}
   const topicZh=bankCell(row,qh.map,'知识点(中文)'),topicEn=bankCell(row,qh.map,'知识点(英文)');
   const q={id,chapter:chapterId,topic:topicZh||topicEn||'综合',topicLabel:bankPair(topicZh,topicEn),difficulty,title:bankPair(titleZh,titleEn),prompt:bankPair(promptZh,promptEn),explanation:bankPair(bankCell(row,qh.map,'解析(中文)'),bankCell(row,qh.map,'解析(英文)')),source:{kind:'adapted',label:bankCell(row,qh.map,'来源标签')||'自定义题库',url:/^https?:\/\//i.test(bankCell(row,qh.map,'来源链接'))?bankCell(row,qh.map,'来源链接'):'',note:bankPair(bankCell(row,qh.map,'来源说明(中文)'),bankCell(row,qh.map,'来源说明(英文)'))},type};
   if(type==='mcq'){
     const options=[];
     ['A','B','C','D'].forEach(L=>{const zh=bankCell(row,qh.map,'选项'+L+'(中文)'),en=bankCell(row,qh.map,'选项'+L+'(英文)');if(zh||en)options.push(bankPair(zh,en));});
     if(options.length<2){mark('题目',i+1,'选择题至少需要 2 个选项（选项A-D）');continue;}
     const ansRaw=bankCell(row,qh.map,'正确答案').toUpperCase();
     const ans='ABCD'.indexOf(ansRaw.charAt(0));
     if(ans<0||ans>=options.length){mark('题目',i+1,'正确答案必须填 A/B/C/D，且在已填选项范围内');continue;}
     q.options=options;q.answer=ans;
   }else{
     q.starter=bankCell(row,qh.map,'起始代码');
     q.solution=bankCell(row,qh.map,'参考答案代码');
     q.tests=bankCell(row,qh.map,'测试代码');
     q.setup=bankCell(row,qh.map,'环境设置代码');
     q.packages=bankCell(row,qh.map,'依赖包').split(/[,，、;；\s]+/).filter(Boolean);
     q.testHint=bankPair(bankCell(row,qh.map,'运行提示(中文)'),bankCell(row,qh.map,'运行提示(英文)'));
     if(!q.testHint.zh)q.testHint=bankPair('检查样例与边界输入。','Check examples and boundary inputs.');
   }
   qids.add(id);questions.push(q);
 }
 if(!questions.length&&!errors.length)errors.push({sheet:'题目',row:qh.index+1,message:'没有找到可导入的题目（示例行会被跳过，请填写真实题目）。'});
 const usedChapters=new Set(questions.map(q=>q.chapter));
 chapters=chapters.filter(c=>usedChapters.has(c.id));
 if(questions.length&&!chapters.length&&!errors.length)errors.push({sheet:'章节',row:1,message:'没有找到与题目对应的章节，请检查「章节ID」。'});
 return {bank:errors.length?null:{chapters,questions},errors};
}
function mergeBankIntoCurrent(imported){
 const chapters=meta.chapters.map(c=>({...c}));
 const chapterMap=new Map(chapters.map(c=>[c.id,c]));
 imported.chapters.forEach(c=>{if(!chapterMap.has(c.id)){chapters.push(c);chapterMap.set(c.id,c);}});
 const merged=questions.map(q=>({...q}));
 const idMap=new Map(merged.map((q,i)=>[q.id,i]));
 imported.questions.forEach(q=>{const idx=idMap.get(q.id);if(idx===undefined){idMap.set(q.id,merged.length);merged.push(q);}else merged[idx]={...q};});
 return {chapters,questions:merged};
}
function retainKnownRecords(){
 const ids=new Set(questions.map(q=>q.id));
 ['records','drafts','notes'].forEach(key=>{const obj=saved[key];if(!obj||typeof obj!=='object')return;Object.keys(obj).forEach(id=>{if(!ids.has(id))delete obj[id];});});
}
function updateBankMeta(){const el=$('bankMeta');if(!el||!meta)return;el.textContent=(bankIsCustom?'自定义题库':'默认题库')+` · ${meta.chapters.length} 章 / ${questions.length} 题`;}
async function openBankDb(){
 return new Promise((resolve,reject)=>{
   if(!('indexedDB' in window))return reject(new Error('no indexedDB'));
   const req=indexedDB.open('feifei-question-bank',1);
   req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains('bank'))db.createObjectStore('bank');};
   req.onsuccess=()=>resolve(req.result);
   req.onerror=()=>reject(req.error||new Error('indexedDB open failed'));
 });
}
async function loadStoredBank(){
 try{const db=await openBankDb();return await new Promise((res,rej)=>{const tx=db.transaction('bank','readonly');const rq=tx.objectStore('bank').get('current');rq.onsuccess=()=>res(rq.result||null);rq.onerror=()=>rej(rq.error);});}
 catch(e){try{const raw=localStorage.getItem(KEY+'-bank');return raw?JSON.parse(raw):null;}catch(e2){return null;}}
}
async function putStoredBank(bank){
 try{const db=await openBankDb();await new Promise((res,rej)=>{const tx=db.transaction('bank','readwrite');tx.objectStore('bank').put(bank,'current');tx.oncomplete=res;tx.onerror=()=>rej(tx.error);});}
 catch(e){try{localStorage.setItem(KEY+'-bank',JSON.stringify(bank));}catch(err){throw new Error('浏览器存储空间不足，题库未能保存');}}
}
async function applyImportedBank(imported,mode){
 const bank=mode==='replace'?imported:mergeBankIntoCurrent(imported);
 await putStoredBank(bank);
 meta={title:'飞飞老师的题库',chapters:bank.chapters};
 questions=bank.questions;
 bankIsCustom=true;
 examPaper=null;examIndex=0;examAnswers={};examSubmitted=false;examResultData=null;
 if($('examOverlay')&&!$('examOverlay').hidden)closeExam();
 if(mode==='replace'){
   retainKnownRecords();
   saved.last={};
   chapter=meta.chapters[0]?.id||'';
   current=null;answerOpen=false;
   clearFilters();
 }else{
   if(!meta.chapters.some(c=>c.id===chapter)){chapter=meta.chapters[0]?.id||'';current=null;clearFilters();}
   else render();
 }
 save();updateBankMeta();updateNoteUI();
}
function exportBankWorkbook(){
 if(!window.XLSX){toast('Excel 组件未加载，请刷新页面后重试。');return;}
 const wb=XLSX.utils.book_new();
 const intro=[['飞飞老师的题库 · 题库导出'],[''],['说明：本文件由网站「导出题库」生成，可再次通过「导入题库」导入本站。'],['「章节」「题目」工作表结构与导入模板一致，第 1 行为列名。'],['导入方式：左侧「导入题库」→ 选择本文件 → 追加到现有题库 / 清空原题库后导入。'],['如需备份练习记录，请使用「导出学习记录」按钮。']];
 XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(intro),'说明');
 const chapterRows=[BANK_CHAPTER_COLS,...meta.chapters.map(c=>[c.id,c.code,c.name.zh,c.name.en,c.description.zh,c.description.en,c.icon||'book'])];
 const chSheet=XLSX.utils.aoa_to_sheet(chapterRows);chSheet['!cols']=[{wch:16},{wch:8},{wch:20},{wch:24},{wch:42},{wch:42},{wch:10}];
 XLSX.utils.book_append_sheet(wb,chSheet,'章节');
 const questionRows=[BANK_QUESTION_COLS,...questions.map(q=>{
  const opts=q.options||[];
  const opt=(n,lang)=>opts[n]?opts[n][lang]:'';
  return [q.id,q.chapter,q.type==='mcq'?'选择题':'编程题',({1:'基础',2:'进阶',3:'挑战'})[q.difficulty]||String(q.difficulty||''),q.topicLabel?.zh||'',q.topicLabel?.en||'',q.title?.zh||'',q.title?.en||'',q.prompt?.zh||'',q.prompt?.en||'',opt(0,'zh'),opt(0,'en'),opt(1,'zh'),opt(1,'en'),opt(2,'zh'),opt(2,'en'),opt(3,'zh'),opt(3,'en'),q.type==='mcq'?String.fromCharCode(65+q.answer):'',q.explanation?.zh||'',q.explanation?.en||'',q.starter||'',q.solution||'',q.tests||'',q.testHint?.zh||'',q.testHint?.en||'',q.setup||'',(q.packages||[]).join(', '),q.source?.label||'',q.source?.note?.zh||'',q.source?.note?.en||'',q.source?.url||'',''];
 })];
 const qSheet=XLSX.utils.aoa_to_sheet(questionRows);qSheet['!cols']=[{wch:16},{wch:16},{wch:9},{wch:8},{wch:18},{wch:20},{wch:22},{wch:24},{wch:40},{wch:40},{wch:14},{wch:14},{wch:14},{wch:14},{wch:14},{wch:14},{wch:14},{wch:14},{wch:10},{wch:40},{wch:40},{wch:36},{wch:36},{wch:40},{wch:24},{wch:24},{wch:24},{wch:14},{wch:22},{wch:36},{wch:36},{wch:24},{wch:20}];
 XLSX.utils.book_append_sheet(wb,qSheet,'题目');
 XLSX.writeFile(wb,'飞飞老师的题库-'+new Date().toISOString().slice(0,10)+'.xlsx');
}
function resetBankImportDialog(){const inp=$('bankFileInput');if(inp)inp.value='';const name=$('bankFileName');if(name)name.textContent='未选择文件';}
function showBankErrors(errors){
 $('bankErrorIntro').textContent=`共 ${errors.length} 个问题，请修正 Excel 后重试：`;
 $('bankErrorList').innerHTML=errors.slice(0,60).map(e=>`<li>${esc(e.sheet||'文件')}${e.row?' 第 '+e.row+' 行':''}：${esc(e.message)}</li>`).join('')+(errors.length>60?'<li>…还有 '+(errors.length-60)+' 个问题未显示</li>':'');
 $('bankErrorDialog').showModal();
}
async function startBankImport(mode){
 const file=$('bankFileInput')?.files?.[0];
 if(!file){toast('请先选择 Excel 文件。');return;}
 if(!window.XLSX){toast('Excel 组件未加载，请刷新页面后重试。');return;}
 const buttons=[$('bankAppendBtn'),$('bankReplaceBtn')];
 buttons.forEach(b=>{if(b)b.disabled=true;});
 try{
  const wb=XLSX.read(await file.arrayBuffer(),{type:'array'});
  const parsed=parseBankWorkbook(wb);
  if(parsed.errors.length){showBankErrors(parsed.errors);return;}
  await applyImportedBank(parsed.bank,mode);
  $('importBankDialog').close();
  $('clearBankDialog').close();
  toast((mode==='replace'?'已清空并导入题库：':'已追加题库：')+`${parsed.bank.chapters.length} 章 / ${parsed.bank.questions.length} 题`);
 }catch(err){showBankErrors([{sheet:'文件',row:0,message:err?.message||String(err)}]);}
 finally{buttons.forEach(b=>{if(b)b.disabled=false;});}
}

function initEvents(){
 $('chapterNav').addEventListener('click',e=>{const b=e.target.closest('[data-chapter]');if(b)changeChapter(b.dataset.chapter);});
 $('langEn').onclick=()=>changeLanguage('en');$('langZh').onclick=()=>changeLanguage('zh');
 $('fontPickerBtn').onclick=e=>{e.stopPropagation();toggleFontMenu();};
 $('examBtn').onclick=()=>{saveDraft();openExam();};
 $('examClose').onclick=closeExam;
 $('examOverlay').addEventListener('click',e=>{if(e.target===$('examOverlay'))closeExam();});
 $('examPrev').onclick=()=>{if(examSubmitted||!examPaper)return;examIndex=Math.max(0,examIndex-1);renderExam();};
 $('examNext').onclick=()=>{if(examSubmitted||!examPaper)return;examIndex=Math.min(examPaper.length-1,examIndex+1);renderExam();};
 $('examSubmit').onclick=submitExam;
 $('examQuestion').addEventListener('click',e=>{const b=e.target.closest('[data-exam-option]');if(!b||examSubmitted)return;examAnswers[examPaper[examIndex].id]=Number(b.dataset.examOption);renderExam();});
 $('examGrid').addEventListener('click',e=>{const b=e.target.closest('[data-exam-jump]');if(!b||!examPaper)return;examIndex=Number(b.dataset.examJump);renderExam();});
 $('examResult').addEventListener('click',e=>{const b=e.target.closest('[data-exam-action]');if(!b)return;if(b.dataset.examAction==='retry'){buildExamPaper();renderExam();}else if(b.dataset.examAction==='close')closeExam();});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('examOverlay').hidden)closeExam();});
 $('fontPickerMenu').onclick=e=>{const item=e.target.closest('[data-font-id]');if(!item)return;applyCuteFont(item.dataset.fontId);toggleFontMenu(false);$('fontPickerBtn').focus();};
 $('enFontPickerBtn').onclick=e=>{e.stopPropagation();toggleEnFontMenu();};
 $('enFontPickerMenu').onclick=e=>{const item=e.target.closest('[data-font-id]');if(!item)return;applyEnFont(item.dataset.fontId);toggleEnFontMenu(false);$('enFontPickerBtn').focus();};
 bindMenuKeys('fontPickerMenu');bindMenuKeys('enFontPickerMenu');
 document.addEventListener('click',e=>{if(!e.target.closest('#fontPicker'))toggleFontMenu(false);if(!e.target.closest('#enFontPicker'))toggleEnFontMenu(false);});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'){toggleFontMenu(false);toggleEnFontMenu(false);}});
 updateFontPicker();updateEnFontPicker();
 $('typeTabs').onclick=e=>{const b=e.target.closest('[data-type]');if(!b)return;saveDraft();type=b.dataset.type;document.querySelectorAll('[data-type]').forEach(x=>x.classList.toggle('active',x===b));render();};
 $('levelFilter').onclick=e=>{const b=e.target.closest('[data-level]');if(!b)return;saveDraft();level=Number(b.dataset.level);document.querySelectorAll('[data-level]').forEach(x=>x.classList.toggle('active',x===b));render();};
 $('topicFilters').onclick=e=>{const b=e.target.closest('[data-topic]');if(b){saveDraft();topic=b.dataset.topic;render();}};
 $('reviewFilter').onclick=e=>{const b=e.target.closest('[data-review]');if(!b)return;saveDraft();review=b.dataset.review;document.querySelectorAll('[data-review]').forEach(x=>{const on=x===b;x.classList.toggle('active',on);x.setAttribute('aria-pressed',String(on));});render();};$('searchInput').oninput=e=>{saveDraft();search=e.target.value.trim().toLowerCase();render();};
 $('questionGrid').onclick=e=>{const b=e.target.closest('[data-question]');if(b)selectQuestion(b.dataset.question);};
 $('questionCard').addEventListener('change',e=>{if(e.target.id!=='speedModeToggle')return;speedMode=!!e.target.checked;saved.speedMode=speedMode;save();toast(speedMode?'极速刷题已开启：点击选项立即判分并显示解析':'极速刷题已关闭');});
 $('questionCard').onclick=e=>{const option=e.target.closest('[data-option]');if(option){if(checked){toast('本题已作答，点「再试一次」可以重做。');return;}selected=Number(option.dataset.option);if(speedMode){checkMCQ();}else{renderQuestion();}return;}const b=e.target.closest('[data-action]');if(!b)return;const action=b.dataset.action,i=filtered.findIndex(q=>q.id===current?.id);switch(action){case'check':checkMCQ();break;case'retry':checked=false;selected=null;renderQuestion();break;case'answer':answerOpen=!answerOpen;renderQuestion();break;case'favorite':saved.records[current.id]={...record(),favorite:!record().favorite};save();renderQuestion();renderGrid();break;case'prev':selectQuestion(filtered[i-1]?.id);break;case'next':selectQuestion(filtered[i+1]?.id);break;case'random':{const pool=filtered.filter(q=>q.id!==current.id);if(pool.length)selectQuestion(pool[Math.floor(Math.random()*pool.length)].id);break;}case'clear':clearFilters();break;case'run':runCode(false);break;case'test':runCode(true);break;case'stop':cancelRun();break;case'reset':if(editor)editor.setValue(current.starter);else if(fallback){fallback.value=current.starter;saveDraft();}toast('已恢复起步代码。');break;case'download':saveDraft();download(saved.drafts[current.id]??current.starter,current.id+'.py','text/x-python');break;}};
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
 $('noteInput').addEventListener('input',saveNote);
 $('exportBtn').onclick=()=>{saveDraft();download(JSON.stringify(saved,null,2),'飞飞编程学习记录-'+new Date().toISOString().slice(0,10)+'.json');toast('学习记录已导出，记得保管好。');};
 $('importInput').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{if(f.size>5000000)throw Error('文件过大');const data=JSON.parse(await f.text());if(data.version!==1||!data.records||!data.drafts)throw Error('文件格式不匹配');const ids=new Set(questions.map(q=>q.id));for(const [id,r]of Object.entries(data.records))if(ids.has(id)&&r&&typeof r==='object')saved.records[id]={...record(id),...r};for(const[id,code]of Object.entries(data.drafts))if(ids.has(id)&&typeof code==='string')saved.drafts[id]=code;for(const[id,note]of Object.entries(data.notes||{}))if(ids.has(id)&&typeof note==='string')saved.notes[id]=note;save();disposeEditor();render();toast('已合并导入学习记录。');}catch(err){toast('无法导入：'+err.message);}e.target.value='';};
 $('importBankBtn').onclick=()=>{resetBankImportDialog();$('importBankDialog').showModal();};
 $('closeBankImport').onclick=$('cancelBankImport').onclick=()=>$('importBankDialog').close();
 $('bankFileInput').onchange=e=>{const f=e.target.files[0];$('bankFileName').textContent=f?f.name:'未选择文件';};
 $('bankAppendBtn').onclick=()=>startBankImport('append');
 $('bankReplaceBtn').onclick=()=>{if(!$('bankFileInput').files[0]){toast('请先选择 Excel 文件。');return;}$('clearBankDialog').showModal();};
 $('closeClearBank').onclick=$('cancelClearBank').onclick=()=>$('clearBankDialog').close();
 $('confirmClearBank').onclick=()=>{$('clearBankDialog').close();startBankImport('replace');};
 $('closeBankErrors').onclick=$('confirmBankErrors').onclick=()=>$('bankErrorDialog').close();
 $('downloadTemplateBtn').onclick=()=>{const a=document.createElement('a');a.href=BANK_TEMPLATE_PATH;a.download='飞飞老师的题库模板.xlsx';document.body.appendChild(a);a.click();a.remove();};
 $('exportBankBtn').onclick=exportBankWorkbook;
 $('menuBtn').onclick=()=>{$('sidebar').classList.toggle('open');$('mobileShade').classList.toggle('active');};$('mobileShade').onclick=()=>{$('sidebar').classList.remove('open');$('mobileShade').classList.remove('active');};window.addEventListener('beforeunload',saveDraft);
}
function loadMonaco(){if(typeof require==='undefined')return;require.config({paths:{vs:'vendor/monaco/vs'}});window.MonacoEnvironment={getWorkerUrl:()=>new URL('vendor/monaco/vs/base/worker/workerMain.js',location.href).href};require(['vs/editor/editor.main'],()=>{monaco.editor.defineTheme('feifei',{base:'vs',inherit:true,rules:[{token:'comment',foreground:'7e8c6c',fontStyle:'italic'},{token:'keyword',foreground:'8d6ca7'},{token:'string',foreground:'6b8f52'},{token:'number',foreground:'b9793f'},{token:'identifier',foreground:'3f4a3e'},{token:'delimiter',foreground:'8a8068'}],colors:{'editor.background':'#fbf6ea','editor.foreground':'#3f4a3e','editorLineNumber.foreground':'#c2b7a0','editorLineNumber.activeForeground':'#8a7a5c','editor.lineHighlightBackground':'#f3ecdd','editorCursor.foreground':'#6e8f58','editor.selectionBackground':'#dce9cf','editor.inactiveSelectionBackground':'#eaf0df','editorIndentGuide.background1':'#e9dec9','editorWidget.background':'#fcf8ee'}});monaco.editor.setTheme('feifei');monacoReady=true;if(current?.type==='code'){saveDraft();disposeEditor();mountEditor(current);}colorize();},()=>toast('高亮编辑器未能加载，已使用基础输入框。'));}
async function boot(){try{let stored=null;try{stored=await loadStoredBank();}catch(e){}if(stored&&Array.isArray(stored.chapters)&&Array.isArray(stored.questions)&&stored.chapters.length&&stored.questions.length){meta={title:'飞飞老师的题库',chapters:stored.chapters};questions=stored.questions;bankIsCustom=true;}else{meta=await(await fetch('data/chapters.json')).json();const chunks=await Promise.all(meta.chapters.map(async c=>{const r=await fetch('data/'+c.id+'.json');if(!r.ok)throw Error(c.id+' 题目文件未找到');return r.json();}));questions=chunks.flat();}speedMode=saved.speedMode===true;if(!meta.chapters.some(c=>c.id===chapter))chapter=meta.chapters[0]?.id||'lecture1';initEvents();updateBankMeta();render();loadMonaco();}catch(e){$('questionCard').innerHTML='<div class="empty-state"><p>题库暂时未能载入。请刷新页面或检查网络后重试。</p><pre>'+esc(e.message)+'</pre><button class="button" onclick="location.reload()">重新载入</button></div>';}}
boot();
