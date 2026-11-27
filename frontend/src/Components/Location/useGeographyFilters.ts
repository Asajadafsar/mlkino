import {useEffect,useState} from 'react'
import api from '../../Core/Request'

export const geographyLevels = ['province','county','city','district','neighborhood'] as const
export type GeographyLevel = typeof geographyLevels[number]
export const geographyLabels = {province:'استان',county:'شهرستان',city:'شهر',district:'منطقه',neighborhood:'محله'}

export function geographyEnabled(level:GeographyLevel, values:Record<string,string>){
    if(level==='province') return true
    if(level==='county'||level==='city') return Boolean(values.province)
    return Boolean(values.province&&values.city)
}

export function geographyPatch(level:GeographyLevel,value:string){
    return {...Object.fromEntries(geographyLevels.slice(geographyLevels.indexOf(level)+1).map(key=>[key,''])),[level]:value}
}

export function useGeographyFilters(values:Record<string,string>, demo=false){
    const scope=JSON.stringify(Object.fromEntries(geographyLevels.slice(0,-1).map(level=>[level,values[level]||''])))
    const [state,setState]=useState<{scope:string;options:Partial<Record<GeographyLevel,string[]>>;error:string}>()
    useEffect(()=>{
        if(demo) return
        const controller=new AbortController()
        const parents:Record<string,string>=JSON.parse(scope)
        Promise.allSettled(geographyLevels.map(async(level,index)=>{
            if(!geographyEnabled(level,parents)) return [level,[]] as const
            const params={level,...Object.fromEntries(geographyLevels.slice(0,index).filter(key=>parents[key]).map(key=>[key,parents[key]]))}
            const response=await api.get('locations/',{params,signal:controller.signal})
            return [level,Array.from(new Set<string>(response.data.data.results.map((row:{name:string})=>row.name)))] as const
        })).then(results=>{
            if(controller.signal.aborted) return
            setState({
                scope,
                options:Object.fromEntries(results.flatMap(row=>row.status==='fulfilled'?[row.value]:[])),
                error:results.some(row=>row.status==='rejected')?'فهرست بخشی از موقعیت‌ها دریافت نشد.':'',
            })
        })
        return ()=>controller.abort()
    },[scope,demo])
    if(demo) return {options:{province:['قم'],county:['قم'],city:['قم'],district:['منطقه ۳'],neighborhood:['امام خمینی']},error:''}
    return state?.scope===scope?state:{options:{province:state?.options.province||[]},error:''}
}
