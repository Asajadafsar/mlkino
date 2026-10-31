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
import {Home} from './Pages/Home/Home'
import {store} from './redux/store'
import {RTL} from './RTL'
import {AppTheme} from './Theme'
import LoginPage from './Pages/Auth/Login/LoginPage'
import SignupPage from './Pages/Auth/Signup/SignupPage'
import ChangePassword from './Pages/Auth/ChangePassword/ChangePassword'
import ChangePasswordPage from './Pages/Auth/ChangePassword/ChangePasswordPage'
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
                                <Routes>
                                    <Route path="/*" element={<Home />} />
                                    <Route path="login" element={<LoginPage />} />
                                    <Route path="signup" element={<SignupPage />} />
                                    <Route path="change-password" element={<ChangePasswordPage />} />
                                </Routes>
                            </QueryParamProvider>
                        </Provider>
                    </ThemeProvider>
                </BrowserRouter>
            </LocalizationProvider>
        </RTL>
    )
}

export default App
