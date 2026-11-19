// Serve a dedicated production build and proxy to the isolated Django fixture.
const http=require('http');
const fs=require('fs');
const path=require('path');
const {createLocalApiProxy}=require('../../frontend/src/setupProxy');
const build=path.resolve(process.env.MLKINO_QA_FRONTEND_BUILD||'');
if(!build.startsWith('/private/tmp/mlkino-auth-qa-')||!fs.existsSync(path.join(build,'index.html')))throw Error('A dedicated QA build in /private/tmp/mlkino-auth-qa-* is required');
const proxy=createLocalApiProxy('http://127.0.0.1:8104');
const types={'.js':'application/javascript','.css':'text/css','.html':'text/html','.png':'image/png','.webp':'image/webp','.woff2':'font/woff2'};
http.createServer((req,res)=>proxy(req,res,()=>{
 const relative=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
 let file=path.resolve(build,'.'+relative);
 if(!file.startsWith(build+path.sep)){res.writeHead(403);return res.end()}
 if(!fs.existsSync(file)||!fs.statSync(file).isFile())file=path.join(build,'index.html');
 res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});
 fs.createReadStream(file).pipe(res);
})).listen(3002,'127.0.0.1',()=>console.log('Isolated auth frontend ready on http://127.0.0.1:3002'));
