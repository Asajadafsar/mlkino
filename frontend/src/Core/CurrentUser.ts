import {createContext} from 'react'
import type {UsersType} from '../Pages/User/Users'

export const CurrentUserContext = createContext<{
    user: UsersType
    setUser: (user: UsersType) => void
}>({user: {} as UsersType, setUser: () => {}})
