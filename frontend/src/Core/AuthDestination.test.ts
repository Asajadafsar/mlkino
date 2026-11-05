import {authDestination,authEntry,safeAuthDestination} from './AuthDestination'
test('keeps local file/request intents, filters and anchors across auth screens',()=>{
 const next='/files/create?city=%D9%82%D9%85#images';expect(authDestination('?next='+encodeURIComponent(next))).toBe(next);expect(authDestination(authEntry('/signup',next).split('?')[1])).toBe(next);expect(authDestination('?next=%2Frequests%2Fcreate')).toBe('/requests/create')
})
test.each(['https://evil.example','//evil.example','/\\evil.example','/login?next=/signup','/signup','/LOGIN','/%6cogin','/%2f%2fevil.example','/%5cevil.example','/files\n/evil','javascript:alert(1)',null])('rejects external or looping destination %s',value=>expect(safeAuthDestination(value)).toBe('/dashboard'))
