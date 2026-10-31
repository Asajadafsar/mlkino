import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from './store'

export enum UserRole {
    SUPERADMIN = 'superadmin',
    USER = 'user',
    AGENCY = 'agency',
    EXPERT = 'expert',
}

interface RoleState {
    role: UserRole | null
}

const initialState: RoleState = {
    role: null,
}

const roleSlice = createSlice({
    name: 'role',
    initialState,
    reducers: {
        setRole: (state, action: PayloadAction<UserRole>) => {
            state.role = action.payload
        },

        clearRole: (state) => {
            state.role = null
        },
    },
})

export const { setRole, clearRole } = roleSlice.actions

export const selectRole = (state: RootState): UserRole | null =>
    state.role.role

export const selectIsSuperAdmin = (state: RootState): boolean =>
    state.role.role === UserRole.SUPERADMIN

export const selectIsUser = (state: RootState): boolean =>
    state.role.role === UserRole.USER

export const selectIsAgency = (state: RootState): boolean =>
    state.role.role === UserRole.AGENCY

export const selectIsExpert = (state: RootState): boolean =>
    state.role.role === UserRole.EXPERT

export default roleSlice.reducer