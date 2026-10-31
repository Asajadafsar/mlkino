import {createSlice} from '@reduxjs/toolkit'
import {RootState} from './store'
interface UtilSlice {
    open: boolean
    message: string
    severity: 'success' | 'info' | 'warning' | 'error'
    loading: boolean
}
const initialState: UtilSlice = {
    open: false,
    message: '',
    severity: 'success',
    loading: false,
}

const utilSlice = createSlice({
    name: 'util',
    initialState: initialState,
    reducers: {
        setUtil(state, action) {
            for (const key in action.payload) state[key] = action.payload[key]
            return state
        },
    },
})

export const {setUtil} = utilSlice.actions
export const util = (state: RootState) => state.util

export default utilSlice.reducer
