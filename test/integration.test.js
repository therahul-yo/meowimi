import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {spawn} from 'node:child_process';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {setTimeout as delay} from 'node:timers/promises';

test('streamed reply is saved with dated conversation and citations', async t=>{
 let captured;
 const upstream=createServer(async(req,res)=>{let body='';for await(const chunk of req)body+=chunk;captured=JSON.parse(body);res.writeHead(200,{'Content-Type':'text/event-stream'});const events=[{type:'response.output_text.delta',delta:'It is $10.'},{type:'response.completed',response:{status:'completed',output:[{type:'message',content:[{type:'output_text',text:'It is $10.',annotations:[{type:'url_citation',url:'https://example.com/pricing',title:'Pricing',end_index:10}]}]}]}}];for(const e of events)res.write(`event: ${e.type}\ndata: ${JSON.stringify(e)}\n\n`);res.end('data: [DONE]\n\n')});
 await new Promise(r=>upstream.listen(0,'127.0.0.1',r));
 const dir=await mkdtemp(join(tmpdir(),'search-chat-'));const port=31000+Math.floor(Math.random()*20000);
 const server=spawn(process.execPath,[resolve('server.js')],{cwd:dir,env:{...process.env,PORT:String(port),OPENAI_API_KEY:'test',OPENAI_BASE_URL:`http://127.0.0.1:${upstream.address().port}/v1`},stdio:'ignore'});
 t.after(async()=>{server.kill();upstream.close();await rm(dir,{recursive:true,force:true})});
 let ready=false;for(let i=0;i<50;i++){try{await fetch(`http://127.0.0.1:${port}/api/messages`);ready=true;break}catch{await delay(100)}}assert.ok(ready,'server starts');
 const response=await fetch(`http://127.0.0.1:${port}/api/chat`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({message:'What is the price?',timeZone:'Asia/Kolkata'})});const stream=await response.text();assert.match(stream,/event: delta/);assert.match(stream,/event: done/);assert.equal(captured.tools[0].type,'web_search');assert.match(captured.input[0].content,/Asia\/Kolkata/);
 const messages=await (await fetch(`http://127.0.0.1:${port}/api/messages`)).json();assert.equal(messages.length,2);assert.equal(messages[0].content,'What is the price?');assert.match(messages[1].content,/\[1\]\(https:\/\/example.com\/pricing\)/);assert.equal(messages[1].citations[0].title,'Pricing');
});
