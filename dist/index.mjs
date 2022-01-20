import e from"fs";import t from"url";import r from"lodash";import o from"path";import a from"sharp";import n from"chalk";import i from"mustache";import{createWorker as s}from"tesseract.js";const c={CHANNEL:"blue",SEPARATOR:175,REFLECT:false},f=o.resolve(t.fileURLToPath(import.meta.url),"..","..");let l=true;const h={info:n.gray,success:n.green,error:n.red,debug:n.yellow},d=(e,t,...o)=>{l&&console.log(h[e](`${(new Date).toISOString()}`,`[${r.upperFirst(t)}]`,...o))},m=(t,{channel:n="blue",separator:c=175,reflect:h=false,log:m=true}={})=>{l=m;const p=Date.now();return d("info","butcher","Starting"),new Promise((async(l,m)=>{try{const m=await(async(e,{channel:t="blue",separator:r=175}={})=>{const o=Date.now();d("info","cleaner","Starting");try{const n=a(e).extractChannel(t).raw();d("info","cleaner","Extracted",t,"channel");const{data:i,info:s}=await n.toBuffer({resolveWithObject:!0}),{width:c,height:f,channels:l}=s;let h=!1;const m=new Uint8ClampedArray(i.buffer).map(((e,t)=>(t%c==c-1&&e>5&&(h=!0),h&&e>r?0:255))),p=a(m,{raw:{width:c,height:f,channels:l}});d("info","cleaner","Cleaned pixels");const w=await p.trim().toBuffer({resolveWithObject:!0});d("info","cleaner","Trimed edges");const g={buffer:new Uint8ClampedArray(w.data.buffer),raw:{width:w.info.width,height:w.info.height,channels:w.info.channels},offset:{top:w.info.trimOffsetTop,left:w.info.trimOffsetLeft}},u={top:10,bottom:10,left:10,right:10,background:{r:255,g:255,b:255}},b=a(g.buffer,{raw:g.raw}).extend(u);d("info","cleaner","Extended edges");const y=await b.png().removeAlpha().toBuffer();return d("success","cleaner","Done at",(Date.now()-o)/1e3+"ms."),{buffer:y,width:c,height:f,crop:{top:Math.abs(g.offset.top)-u.top,left:Math.abs(g.offset.left)-u.left,width:g.raw.width+u.left+u.right,height:g.raw.height+u.top+u.bottom}}}catch(e){throw d("error","cleaner",e.message),e}})(t,{channel:n,separator:c}),w=await(async e=>{const t=Date.now();d("info","extractor","Starting");try{const o=s();await o.load(),await o.loadLanguage("eng"),await o.initialize("eng"),d("info","extractor","Prepared worker"),await o.setParameters({user_defined_dpi:"70"});const a=await o.recognize(e);d("info","extractor","Recognized data"),await o.terminate();const n={pair:/^\w+(\s?)\/(\s?)\w+$/,entry:/^(enter|between|(\d+((\.\d+)?)))/i,stop:/^(stop|(\d+((\.\d+)?)))/i,targets:/^(target|(\d+((\.\d+)?)))/i},i=e=>e.match(/(\w+)/g),c=e=>{const t=e.match(/(\d+((\.\d+)?))/g);if(t)return r.filter(r.sortBy(r.map(t,(e=>r.toNumber(e)))))},f=r.reduce(a.data.lines,((e,t)=>(r.each(t.words,(o=>{const a=r.trim(o.text);r.each(e.patterns,((n,s)=>{if(a.match(n)){r.each(o.symbols,(({bbox:{x0:t,y0:r,x1:o,y1:a}})=>{e.coordinates.push({left:t,top:r,right:o,bottom:a})}));const n="pair"===s?i(a):c(a);if(n)return e.lines[s]=n,e.confidence.push(t.confidence),e.patterns=r.omit(e.patterns,[s]),!1}}))})),e)),{patterns:n,lines:{},coordinates:[],confidence:[]});return d("success","extractor","Done at",(Date.now()-t)/1e3+"ms."),{signal:f.lines,coordinates:f.coordinates,confidence:r.toSafeInteger(r.round(r.mean(f.confidence)))}}catch(e){throw d("error","extractor",e.message),e}})(m.buffer),g=[w.signal.pair,w.signal.entry,w.signal.stop,w.signal.targets];if(r.some(g,r.isEmpty))throw d("error","extractor","Invalid input"),new Error("Invalid input");const u={signal:w.signal,confidence:w.confidence};if(h){const n=await(async(t,{cleaned:n,extracted:s,reflect:c})=>{const l=Date.now();d("info","reflector","Starting");try{const h=o.resolve(f,"src","mask.mustache"),m=r.toString(e.readFileSync(h));d("info","reflector","Loading mask template");const p=r.map(s.coordinates,(({top:e,left:t,right:r,bottom:o})=>({top:n.crop.top+e,left:n.crop.left+t,width:r-t,height:o-e}))),w={top:r.min(r.map(p,"top")),left:r.min(r.map(p,"left")),bottom:r.max(r.map(p,(({top:e,height:t})=>e+t))),right:r.max(r.map(p,(({left:e,width:t})=>e+t)))},g=i.render(m,{width:n.width,height:n.height,coordinates:p});d("info","reflector","Rendred mask template");const u=[{input:new Buffer.from(g)}],b=await a(t).grayscale().composite(u).toBuffer();d("info","reflector","Composited mask layer");const y=await a(b).resize({width:680}).toBuffer({resolveWithObject:!0});d("info","reflector","Resized masked");const x=e=>r.floor(e*y.info.width/n.width),D=[{input:o.resolve(f,"src","tape.svg"),top:x(w.bottom)+20,left:0},{input:o.resolve(f,"src","butcher.svg"),top:y.info.height-280,left:x(w.right)+20}],v=await a(y.data).composite(D).sharpen().toBuffer();if(d("info","reflector","Composited ui layer"),r.isBoolean(c))return d("success","reflector","Done at",(Date.now()-l)/1e3+"ms."),v;const S=o.resolve(c);return e.writeFileSync(S,v),d("success","reflector","Done at",(Date.now()-l)/1e3+"ms."),S}catch(e){throw d("error","reflector",e.message),e}})(t,{cleaned:m,extracted:w,reflect:h});r.set(u,"reflect",n)}d("success","butcher","Done at",(Date.now()-p)/1e3+"ms."),l(u)}catch(e){d("error","butcher",e.message),m(e)}}))};export{c as CONST,m as butcher};