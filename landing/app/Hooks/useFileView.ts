"use client";
import {useSyncExternalStore} from "react";
const key="files-view-mode",event="melkino:files-view";
function subscribe(listener:()=>void){window.addEventListener("storage",listener);window.addEventListener(event,listener);return()=>{window.removeEventListener("storage",listener);window.removeEventListener(event,listener)}}
function snapshot():"grid"|"list"{try{return localStorage.getItem(key)==="list"?"list":"grid"}catch{return "grid"}}
export function useFileView(){const view=useSyncExternalStore(subscribe,snapshot,()=>"grid" as const);return [view,(next:string)=>{try{localStorage.setItem(key,next);window.dispatchEvent(new Event(event))}catch{}}] as const}
