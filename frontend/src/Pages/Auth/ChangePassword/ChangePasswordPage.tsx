import {Stack,Typography,Button} from '@mui/material'
import {Link} from 'react-router-dom'
import {AuthShell} from '../Shared/AuthShell'
import ChangePassword from './ChangePassword'
export default function ChangePasswordPage(){return <AuthShell title="دوباره به خانه برگردید" subtitle="با تأیید شماره همراه، رمز حساب خود را بازیابی کنید."><Stack spacing={3}><Typography component="h1" fontSize={25} fontWeight={900}>بازیابی رمز عبور</Typography><ChangePassword/><Button component={Link} to="/login">بازگشت به ورود</Button></Stack></AuthShell>}
