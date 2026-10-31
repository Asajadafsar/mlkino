import {canAccessUserRoute} from './AccessControl'
import {UserRole} from '../redux/RoleSlice'

test.each(['/users', '/users/user', '/users/agencies/42', '/users/super-users/create', '/users/expert/42'])('superadmin can manage %s', path => {
    expect(canAccessUserRoute(UserRole.SUPERADMIN, path)).toBe(true)
})
test.each(['/users', '/users/expert', '/users/expert/create', '/users/expert/42'])('agency can open only its expert area: %s', path => {
    expect(canAccessUserRoute(UserRole.AGENCY, path)).toBe(true)
})
test.each(['/users/user', '/users/agencies', '/users/super-users/create'])('agency cannot open another management category: %s', path => {
    expect(canAccessUserRoute(UserRole.AGENCY, path)).toBe(false)
})
test.each([UserRole.USER, UserRole.EXPERT, null])('role %s cannot enter user management', role => {
    expect(canAccessUserRoute(role, '/users')).toBe(false)
    expect(canAccessUserRoute(role, '/users/expert')).toBe(false)
})
