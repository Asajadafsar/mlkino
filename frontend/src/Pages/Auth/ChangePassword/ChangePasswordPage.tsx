import {authDestination,authEntry} from '../../../Core/AuthDestination'
import {useLocation} from 'react-router-dom'
import {Stack,Typography,Button} from '@mui/material'
import {Link} from 'react-router-dom'
import {AuthShell} from '../Shared/AuthShell'
import ChangePassword from './ChangePassword'
export default function ChangePasswordPage(){const location=useLocation();return <AuthShell title="دوباره به خانه برگردید" subtitle="با تأیید شماره همراه، رمز حساب خود را بازیابی کنید."><Stack spacing={3}><Typography component="h1" fontSize={25} fontWeight={900}>بازیابی رمز عبور</Typography><ChangePassword/><Button component={Link} to={authEntry('/login',authDestination(location.search))}>بازگشت به ورود</Button></Stack></AuthShell>}
