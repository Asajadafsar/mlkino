import {Box,Button,Stack,Typography} from '@mui/material'
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded'
import HomeRoundedIcon from '@mui/icons-material/HomeRounded'
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined'
import SupportAgentRoundedIcon from '@mui/icons-material/SupportAgentRounded'
export function AuthShell({children,title='خانه رؤیاها، نزدیک‌تر از همیشه',subtitle='خرید، فروش و اجاره انواع املاک؛ با تجربه‌ای امن، سریع و مطمئن'}:{children:React.ReactNode;title?:string;subtitle?:string}){
 return <Box sx={{minHeight:'100dvh',bgcolor:'#f1f6ff',display:'grid',placeItems:'center',p:{xs:0,md:4},backgroundImage:'radial-gradient(ellipse at 20% 10%,#dceaff,transparent 55%)'}}>
  <Box style={{direction:'ltr'}} sx={{width:'100%',maxWidth:1080,display:'grid',gridTemplateColumns:{xs:'minmax(0,1fr)',md:'46% minmax(0,1fr)'},direction:'ltr',borderRadius:{xs:0,md:'28px'},p:{xs:0,md:1.25},bgcolor:'#fff',border:{md:'1px solid #dfebff'},boxShadow:{md:'0 24px 70px #3764a11c'},minHeight:{md:740},overflow:'hidden'}}>
   <Box sx={{position:'relative',minHeight:{xs:255,md:720},borderRadius:{xs:0,md:'20px'},overflow:'hidden',direction:'rtl',backgroundImage:'linear-gradient(180deg,#062e5c10 10%,#071a2880 55%,#071b24ee 100%),url(/assets/auth-villa.png)',backgroundSize:'cover',backgroundPosition:'center'}}>
    <Box component="img" style={{left:24,right:'auto'}} src="/assets/melkino-logo-hd.png" alt="ملکینو" sx={{position:'absolute',top:{xs:22,md:30},left:{xs:22,md:30},width:{xs:62,md:84},height:{xs:62,md:84},objectFit:'contain',borderRadius:3}}/>
    <Stack sx={{position:'absolute',inset:0,p:{xs:3,md:4},justifyContent:'flex-end',color:'#fff'}}><Typography fontSize={{xs:25,md:36}} fontWeight={900} lineHeight={1.6} sx={{maxWidth:330}}>{title}</Typography><Typography fontSize={{xs:12,md:15}} lineHeight={2} sx={{mt:1,mb:{xs:0,md:3},maxWidth:320,color:'#edf3ff'}}>{subtitle}</Typography>
     <Stack spacing={1} sx={{display:{xs:'none',md:'flex'}}}>{[{icon:<HomeRoundedIcon/>,title:'همه‌چیز برای مدیریت املاک',text:'پرونده‌ها و کارهای روزانه در یک جا'},{icon:<VerifiedUserOutlinedIcon/>,title:'ورود امن و حساب شخصی',text:'دسترسی متناسب با نقش شما'},{icon:<SupportAgentRoundedIcon/>,title:'همراه شما در هر مرحله',text:'ارتباط مستقیم با پشتیبانی ملکینو'}].map(item=><Stack direction="row" gap={1.5} key={item.title} sx={{p:1.5,bgcolor:'#ffffff12',backdropFilter:'blur(14px)',borderRadius:3,border:'1px solid #ffffff0f'}}><Box sx={{p:1,bgcolor:'#ffffff18',display:'flex',borderRadius:2,height:'fit-content'}}>{item.icon}</Box><Box><Typography fontSize={13} fontWeight={700}>{item.title}</Typography><Typography fontSize={11} sx={{mt:.5,color:'#e2eafa'}}>{item.text}</Typography></Box></Stack>)}</Stack>
    </Stack>
   </Box>
   <Stack dir="rtl" sx={{minWidth:0,p:{xs:3,sm:5,md:5},borderRadius:{xs:'24px 24px 0 0',md:0},mt:{xs:-2,md:0},bgcolor:'#fff',position:'relative'}} spacing={3}>
    <Button component="a" href="https://mlkino.com" size="small" startIcon={<ArrowForwardRoundedIcon fontSize="small"/>} sx={{alignSelf:'flex-start',fontSize:11,mb:{xs:0,md:1}}}>بازگشت به سایت</Button>
    {children}
   </Stack>
  </Box>
 </Box>
}
