'use strict';
let runtimePromise=null;
function runtime(){if(!runtimePromise){importScripts('vendor/pyodide/pyodide.js');runtimePromise=loadPyodide({indexURL:new URL('vendor/pyodide/',self.location.href).href});}return runtimePromise;}
self.onmessage=async event=>{const job=event.data;try{postMessage({id:job.id,status:'准备 Python 环境…'});const py=await runtime();if(job.packages.length){postMessage({id:job.id,status:'准备 '+job.packages.join(' / ')+'…'});await py.loadPackage(job.packages);}postMessage({id:job.id,status:'运行中…',phase:'running'});py.globals.set('__feifei_payload_json',JSON.stringify(job));const result=await py.runPythonAsync(`
import json as __json, io as __io, contextlib as __context, traceback as __traceback, os as __os, shutil as __shutil
__job = __json.loads(__feifei_payload_json)
class __LimitedOutput(__io.StringIO):
    def write(self, value):
        if self.tell() + len(value) > 16000:
            raise RuntimeError('Too much output. Check whether your loop has a stopping condition.')
        return super().write(value)
__out = __LimitedOutput()
__err = __LimitedOutput()
__folder = '/home/pyodide/feifei_practice'
__os.chdir('/home/pyodide')
if __os.path.exists(__folder):
    __shutil.rmtree(__folder)
__os.makedirs(__folder)
__os.chdir(__folder)
__scope = {'__name__': '__main__'}
__okay = True
__error = ''
try:
    with __context.redirect_stdout(__out), __context.redirect_stderr(__err):
        exec(compile(__job['setup'], 'question_data.py', 'exec'), __scope)
        exec(compile(__job['code'], 'main.py', 'exec'), __scope)
        if __job['check']:
            exec(compile(__job['tests'], 'question_tests.py', 'exec'), __scope)
except BaseException:
    __okay = False
    __error = __traceback.format_exc()
__json.dumps({'ok': __okay, 'stdout': __out.getvalue() + __err.getvalue(), 'error': __error})
`);postMessage({kind:'result',id:job.id,questionId:job.questionId,check:job.check,...JSON.parse(result)});}catch(error){postMessage({kind:'result',id:job.id,questionId:job.questionId,check:job.check,ok:false,stdout:'',error:String(error)});}};
