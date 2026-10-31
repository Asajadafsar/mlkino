import {createSlice, type PayloadAction} from '@reduxjs/toolkit'
import type {RootState} from './store'
import type {ImpersonationStatus} from '../Core/Impersonation'

type ImpersonationState = {
    session: ImpersonationStatus | null
    actorId: number | null
    checked: boolean
    error: string | null
    pending: boolean
}
const initialState: ImpersonationState = {session: null, actorId: null, checked: false, error: null, pending: false}
const slice = createSlice({
    name: 'impersonation', initialState,
    reducers: {
        setImpersonation(state, action: PayloadAction<{session: ImpersonationStatus; actorId?: number}>) {
            state.session = action.payload.session
            state.actorId = action.payload.actorId ?? action.payload.session.actor_id ?? state.actorId
            state.checked = true
            state.error = null
        },
        setImpersonationError(state, action: PayloadAction<string>) {
            state.error = action.payload
            state.checked = false
        },
        setImpersonationPending(state, action: PayloadAction<boolean>) {state.pending = action.payload},
        clearImpersonation: () => initialState,
    },
})
export const {setImpersonation, setImpersonationError, setImpersonationPending, clearImpersonation} = slice.actions
export const selectImpersonation = (state: RootState) => state.impersonation
export default slice.reducer
