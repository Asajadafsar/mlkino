import type { NextConfig } from "next";
import {PANEL_ORIGIN,PANEL_LINKS} from "./app/Core/panel";


const nextConfig: NextConfig = {
  output: 'standalone',
  async redirects() {
    return [
      {source:'/panel',destination:PANEL_LINKS.dashboard,permanent:false},
      {source:'/panel/:path*',destination:PANEL_ORIGIN+'/:path*',permanent:false},
      {source:'/login',destination:PANEL_LINKS.login,permanent:false},
      {source:'/signup',destination:PANEL_LINKS.signup,permanent:false},
      {source:'/register',destination:PANEL_LINKS.signup,permanent:false},
      {source:'/reminders',destination:PANEL_LINKS.reminders,permanent:false},
      {source:'/support',destination:PANEL_LINKS.chats,permanent:false},
    ]
  },
  images: {
    unoptimized: true,
  },
};


export default nextConfig;
