import {createContext} from 'react'
export const FieldScope = createContext('')

export function fieldVisible(fields:Record<string,boolean>,scope:string,key:string) {
 const base=scope.split('.')[0]
 return (fields?.[`${scope}.${key}`]??fields?.[`${base}.${key}`])!==false
}
