import {canAccessDrawerItem, drawerItems} from './DrawerItems'
import {UserRole} from '../../redux/RoleSlice'

test.each([UserRole.USER, UserRole.EXPERT])('users management is hidden from %s', role => {
    const item = drawerItems.find(item => item.link === 'users')!
    expect(canAccessDrawerItem(item, role)).toBe(false)
})

test.each([UserRole.SUPERADMIN])('users management remains available to %s', role => {
    expect(canAccessDrawerItem(drawerItems.find(item => item.link === 'users')!, role)).toBe(true)
})

test.each(Object.values(UserRole))('tickets are accessible for %s', role => {
    expect(canAccessDrawerItem(drawerItems.find(item => item.link === 'tickets')!, role)).toBe(true)
})


test('agency sees only the dedicated expert entry, not general user management', () => {
    expect(canAccessDrawerItem(drawerItems.find(item => item.link === 'users')!, UserRole.AGENCY)).toBe(false)
    expect(canAccessDrawerItem(drawerItems.find(item => item.link === 'users/expert')!, UserRole.AGENCY)).toBe(true)
})

test.each([UserRole.USER,UserRole.EXPERT,UserRole.AGENCY])('settings are hidden from %s',role=>{expect(canAccessDrawerItem(drawerItems.find(item=>item.link==='settings')!,role)).toBe(false)})
