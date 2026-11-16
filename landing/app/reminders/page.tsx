import type { Metadata } from "next";
import Link from "next/link";
import NotificationsNoneRounded from "@mui/icons-material/NotificationsNoneRounded";

export const metadata: Metadata = { title: "یادآوری‌ها | ملکینو" };
export default function RemindersPage() {
  return <section style={{maxWidth:680,margin:"32px auto",padding:"32px 24px",textAlign:"center",color:"#13224e"}}><NotificationsNoneRounded sx={{fontSize:56,color:"#ffa900",mb:2}} /><h1>یادآوری‌ها</h1><p style={{lineHeight:2,marginTop:16,color:"#74809e"}}>برای مشاهده و مدیریت یادآوری‌های خود وارد پنل ملکینو شوید.</p><Link href="https://panel.mlkino.com" style={{display:"inline-flex",alignItems:"center",justifyContent:"center",minHeight:48,marginTop:24,padding:"12px 24px",background:"#ffb600",borderRadius:16,fontWeight:750}}>ورود به پنل ملکینو</Link></section>;
}
