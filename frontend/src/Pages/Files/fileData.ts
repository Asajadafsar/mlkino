import {useEffect,useState} from 'react'
import {DataProvider} from '../../Core/DataProvider'
import {useFavorites} from '../../Core/FavoritesContext'
import {fileDemoStore,FILE_DEMO_CHANGED} from './fileDemoStore'
import type {FileRecord} from './filePresentation'
export async function getFile(id:number,demo:boolean){return demo?fileDemoStore.get(id):(await DataProvider.get<FileRecord>(`files/${id}/`)).data}
export async function updateFile(file:FileRecord,patch:Partial<FileRecord>){return file.demo?fileDemoStore.update(file.id,patch):(await DataProvider.patch<FileRecord>(`files/${file.id}/`,{data:patch})).data}
export async function archiveFile(file:FileRecord){if(file.demo)return fileDemoStore.update(file.id,{archived:!file.archived,...(!file.archived?{publication_state:'draft'}:{})});await DataProvider.post('workflows/archive/',{data:{entity_type:'property',id:file.id,archived:!file.archived}});return {...file,archived:!file.archived,...(!file.archived?{publication_state:'draft'}:{})}}
export async function pinFile(file:FileRecord,pinned:boolean){if(file.demo)return fileDemoStore.update(file.id,{pinned});if(pinned)await DataProvider.post(`workflows/properties/${file.id}/pin/`,{data:{}});else await DataProvider.delete(`workflows/properties/${file.id}/pin/`)}
export async function fileVisits(file:Pick<FileRecord,'id'|'demo'>){return file.demo?fileDemoStore.visits(file.id):(await DataProvider.get<{results:any[]}>(`workflows/visits/?property_id=${file.id}&page_size=20`)).data.results}
export function useFileFavorites(demo:boolean){const real=useFavorites(),[demoIds,setDemoIds]=useState<Set<number>>(()=>demo?new Set(fileDemoStore.favorites()):new Set());useEffect(()=>{if(!demo)return;const refresh=()=>setDemoIds(new Set(fileDemoStore.favorites()));refresh();window.addEventListener(FILE_DEMO_CHANGED,refresh);return()=>window.removeEventListener(FILE_DEMO_CHANGED,refresh)},[demo]);return {ids:demo?demoIds:real.ids,loading:demo?false:real.loading,toggle:async(id:number)=>{if(demo)fileDemoStore.toggleFavorite(id);else await real.toggle(id)}}}
