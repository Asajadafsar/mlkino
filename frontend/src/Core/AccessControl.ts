import {UserRole} from '../redux/RoleSlice'

export function canAccessUserRoute(role: UserRole | string | null, pathname: string) {
    if (pathname === '/settings' || pathname.startsWith('/settings/')) return role === UserRole.SUPERADMIN
    if (pathname === '/tasks/create') return role === UserRole.SUPERADMIN || role === UserRole.AGENCY
    if (!pathname.startsWith('/users')) return true
    if (role === UserRole.SUPERADMIN) return true
    return role === UserRole.AGENCY && (pathname === '/users' || pathname === '/users/expert' || pathname.startsWith('/users/expert/'))
}
