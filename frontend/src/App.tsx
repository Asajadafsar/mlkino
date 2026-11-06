import LandingEntry from './Pages/Auth/Shared/LandingEntry'
import {CssBaseline, GlobalStyles} from '@mui/material'
import {ThemeProvider} from '@mui/material/styles'
import {AdapterMoment} from '@mui/x-date-pickers/AdapterMoment'
import {LocalizationProvider} from '@mui/x-date-pickers/LocalizationProvider'
import {Provider} from 'react-redux'
import {BrowserRouter, Route, Routes} from 'react-router-dom'
import {QueryParamProvider} from 'use-query-params'
import {ReactRouter6Adapter} from 'use-query-params/adapters/react-router-6'
import './App.css'
import {LoadingBackdrop} from './Components/Backdrop/Backdrop'
import {CustomizedSnackbars} from './Components/Snackbar/Snackbar'
import {lazy,Suspense} from 'react'
import {CircularProgress,Stack,Typography} from '@mui/material'
import {store} from './redux/store'
import {RTL} from './RTL'
import {AppTheme} from './Theme'
import LoginPage from './Pages/Auth/Login/LoginPage'
import SignupPage from './Pages/Auth/Signup/SignupPage'
import ChangePasswordPage from './Pages/Auth/ChangePassword/ChangePasswordPage'
const Home=lazy(()=>import('./Pages/Home/Home').then(module=>({default:module.Home})))
function App() {
    return (
        <RTL>
            <LocalizationProvider dateAdapter={AdapterMoment}>
                <BrowserRouter>
                    <ThemeProvider theme={AppTheme}>
                        <GlobalStyles
                            styles={{
                                '@keyframes mui-auto-fill': {from: {display: 'block'}},
                                '@keyframes mui-auto-fill-cancel': {from: {display: 'block'}},
                            }}
                        />
                        <CssBaseline />
                        <Provider store={store}>
                            <CustomizedSnackbars />
                            <LoadingBackdrop />
                            <QueryParamProvider adapter={ReactRouter6Adapter}>
                                <Suspense fallback={<Stack alignItems="center" gap={2} sx={{p:6}}><CircularProgress aria-label="بارگذاری پنل"/><Typography>در حال آماده‌سازی پنل…</Typography></Stack>}><Routes>
                                    <Route path="/" element={<LandingEntry/>} />
                                    <Route path="/*" element={<Home />} />
                                    <Route path="login" element={<LoginPage />} />
                                    <Route path="signup" element={<SignupPage />} />
                                    <Route path="change-password" element={<ChangePasswordPage />} />
                                </Routes></Suspense>
                            </QueryParamProvider>
                        </Provider>
                    </ThemeProvider>
                </BrowserRouter>
            </LocalizationProvider>
        </RTL>
    )
}

export default App
