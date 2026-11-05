import test from 'node:test';import assert from 'node:assert/strict';
import {PANEL_LINKS,PANEL_ORIGIN,panelSearch} from '../app/Core/panel.ts';
test('every landing CTA targets the existing panel origin and real panel routes',()=>{
 assert.equal(new URL(PANEL_ORIGIN).pathname,'/');
 for(const [key,path] of Object.entries({dashboard:'/dashboard',login:'/login',signup:'/signup',createFile:'/files/create',createRequest:'/requests/create',chats:'/chats',tickets:'/tickets',profile:'/profile'})){
  const url=new URL(PANEL_LINKS[key]);assert.equal(url.origin,PANEL_ORIGIN);assert.equal(url.pathname,path)
 }
})

test('navbar search safely forwards Persian search text to the real panel filter',()=>{const url=new URL(panelSearch('  قم & خانه  '));assert.equal(url.pathname,'/files');assert.equal(url.searchParams.get('search'),'قم & خانه');assert.equal(url.origin,PANEL_ORIGIN)})
