import {UserRole} from '../redux/RoleSlice'

export function canAccessUserRoute(role: UserRole | string | null, pathname: string) {
    if (!pathname.startsWith('/users')) return true
    if (role === UserRole.SUPERADMIN) return true
    return role === UserRole.AGENCY && (pathname === '/users' || pathname === '/users/expert' || pathname.startsWith('/users/expert/'))
}
