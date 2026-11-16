"use client";

import Link from "next/link";
import { Box, Button, Typography } from "@mui/material";
import HomeRounded from "@mui/icons-material/HomeRounded";
import BookmarkRounded from "@mui/icons-material/BookmarkRounded";
import VisibilityRounded from "@mui/icons-material/VisibilityRounded";
import FavoriteRounded from "@mui/icons-material/FavoriteRounded";
import AddRounded from "@mui/icons-material/AddRounded";
import ApartmentOutlined from "@mui/icons-material/ApartmentOutlined";
import CottageOutlined from "@mui/icons-material/CottageOutlined";
import LandscapeOutlined from "@mui/icons-material/LandscapeOutlined";
import BusinessOutlined from "@mui/icons-material/BusinessOutlined";
import StorefrontOutlined from "@mui/icons-material/StorefrontOutlined";
import ArrowBackRounded from "@mui/icons-material/ArrowBackRounded";

export function HomeOverview() {
  return <>
    <Box className="home-banner">
      <Box className="home-banner-copy">
        <Typography component="h1">خانه رو راحت‌تر پیدا کن</Typography>
        <Typography component="p">آگهی‌های به‌روز، واقعی و مطمئن</Typography>
        <Button component={Link} href="https://panel.mlkino.com/files/create" variant="contained" disableElevation startIcon={<AddRounded />}>ثبت فایل جدید</Button>
      </Box>
      <Box className="home-banner-image" role="img" aria-label="خانه مدرن در فضای سبز" />
    </Box>
    <Box className="home-stats">
      {[{ Icon: HomeRounded, value: '۲۸۶', label: 'کل فایل‌ها', color: '#1667ff' }, { Icon: BookmarkRounded, value: '۱۲', label: 'فایل‌های ویژه', color: '#ff941f' }, { Icon: VisibilityRounded, value: '۱.۲K', label: 'بازدید امروز', color: '#22ac5b' }, { Icon: FavoriteRounded, value: '۴۸', label: 'مشتریان علاقه‌مند', color: '#a346ed' }].map(({Icon, value, label, color}) => <Box className="home-stat" key={label}><Box className="home-stat-icon" sx={{color, bgcolor: `${color}0d`}}><Icon /></Box><Typography component="strong">{value}</Typography><Typography component="span">{label}</Typography></Box>)}
    </Box>
  </>;
}

export function HomeCategories() {
  return <Box className="home-categories">
    <Box className="home-section-heading"><Typography component="h2"><ApartmentOutlined color="primary" /> دسته‌بندی‌ها</Typography><Link href="/categories" aria-label="مشاهده همه دسته‌بندی‌ها">مشاهده همه <ArrowBackRounded /></Link></Box>
    <Box className="home-category-list">{[{Icon: ApartmentOutlined, label: 'آپارتمان'}, {Icon: CottageOutlined, label: 'ویلا'}, {Icon: LandscapeOutlined, label: 'زمین'}, {Icon: BusinessOutlined, label: 'اداری'}, {Icon: StorefrontOutlined, label: 'تجاری'}].map(({Icon,label}) => <Button component={Link} href="/files" key={label}><Icon /><span>{label}</span></Button>)}</Box>
  </Box>;
}
