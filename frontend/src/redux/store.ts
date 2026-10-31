
import { configureStore } from '@reduxjs/toolkit'
import UtilSlice from './UtilSlice'
import RoleSlice from './RoleSlice'
import ImpersonationSlice from './ImpersonationSlice'
import {
    useDispatch,
    useSelector,
    type TypedUseSelectorHook,
} from 'react-redux'

export const store = configureStore({
    reducer: {
        util: UtilSlice,
        role: RoleSlice,
        impersonation: ImpersonationSlice,
    },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

export const useAppDispatch: () => AppDispatch = useDispatch
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector
