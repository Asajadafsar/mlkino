import {UserRole} from '../redux/RoleSlice'

export function canAccessUserRoute(role: UserRole | string | null, pathname: string, permissions?: {can_finance?: boolean}) {
    if (['/routing-settings','/workspace-roles'].includes(pathname)) return role === UserRole.SUPERADMIN
    if(pathname==='/reports')return role===UserRole.SUPERADMIN||role===UserRole.AGENCY||permissions?.can_finance===true
    if (pathname==='/finance'||pathname.startsWith('/finance/')) return role===UserRole.SUPERADMIN||role===UserRole.AGENCY||permissions?.can_finance===true
    if (['/financial-settings'].some(path=>pathname===path||pathname.startsWith(path+'/'))) return role===UserRole.SUPERADMIN||role===UserRole.AGENCY
    if (['/crm','/visit-slots','/customers','/owners','/landlord-tenant','/archives'].some(path=>pathname===path||pathname.startsWith(path+'/'))) return role===UserRole.SUPERADMIN||role===UserRole.AGENCY||role===UserRole.EXPERT
    if (pathname === '/settings' || pathname.startsWith('/settings/')) return role === UserRole.SUPERADMIN
    if (pathname === '/tasks/create') return role === UserRole.SUPERADMIN || role === UserRole.AGENCY
    if (!pathname.startsWith('/users')) return true
    if (role === UserRole.SUPERADMIN) return true
    return role === UserRole.AGENCY && (pathname === '/users' || pathname === '/users/expert' || pathname.startsWith('/users/expert/'))
}
