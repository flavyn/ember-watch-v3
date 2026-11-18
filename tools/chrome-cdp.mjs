import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url)).replaceAll('\\','/');
const pages=await (await fetch('http://127.0.0.1:9334/json/list')).json();
const page=pages.find(p=>p.type==='page');
const ws=new WebSocket(page.webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));
let serial=0;const pending=new Map();const errors=[],requests=[];
ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);if(p){pending.delete(m.id);m.error?p.reject(m.error):p.resolve(m.result);}}else{if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails);if(m.method==='Log.entryAdded'&&m.params.entry.level==='error')errors.push(m.params.entry);if(m.method==='Network.requestWillBeSent')requests.push(m.params.request.url);}});
export const call=(method,params={})=>new Promise((resolve,reject)=>{const id=++serial;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});
export const evaluate=async expression=>{const r=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw r.exceptionDetails;return r.result.value;};
export async function ready(url){await call('Page.navigate',{url});for(let i=0;i<150;i++){if(await evaluate(`location.href===${JSON.stringify(url)}&&window.__shotReady===true`))return;await new Promise(r=>setTimeout(r,100));}throw Error('Shot not ready');}
export {ws,errors,requests};
await call('Page.enable');await call('Runtime.enable');await call('Log.enable');await call('Network.enable');await call('Emulation.setDeviceMetricsOverride',{width:1280,height:720,deviceScaleFactor:1,mobile:false});
if(process.argv[2]==='capture'){
  for(const [i,name] of ['start','play','upgrade','end'].entries()){
    await ready(`http://localhost:8083/?shot=${name}&seed=19`);
    const r=await call('Page.captureScreenshot',{format:'jpeg',quality:87,fromSurface:true});
    const data=Buffer.from(r.data,'base64');await writeFile(`${root}screenshots/${i+1}-${name}.jpg`,data);
    console.log({scene:name,bytes:data.length,state:await evaluate('({ready:__shotReady,frame:__ember.game.renderer.info.render.frame})')});
  }
  console.log({errors,external:requests.filter(u=>!u.startsWith('http://localhost:8083/')&&!u.startsWith('data:'))});ws.close();
}
