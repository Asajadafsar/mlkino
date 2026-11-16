import type { SvgIconComponent } from '@mui/icons-material';

import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import PersonIcon from '@mui/icons-material/Person';
import FavoriteBorderRoundedIcon from '@mui/icons-material/FavoriteBorderRounded';
import FavoriteRoundedIcon from '@mui/icons-material/FavoriteRounded';
import AddIcon from '@mui/icons-material/Add';
import NotificationsNoneRounded from '@mui/icons-material/NotificationsNoneRounded';
import HomeIcon from '@mui/icons-material/Home';
export type NavItem = {
  key: 'home' | 'submit' | 'support' | 'profile' | 'saved';
  label: string;
  href: string;
  icon: SvgIconComponent;
  activeIcon: SvgIconComponent;
  group: 'main' | 'account';
};

export const NAV_ITEMS: NavItem[] = [
  { key: 'home', label: 'خانه', href: '/', icon: HomeIcon, activeIcon: HomeIcon, group: 'main' },
  { key: 'saved', label: 'علاقه‌مندی‌ها', href: '/saved', icon: FavoriteBorderRoundedIcon, activeIcon: FavoriteRoundedIcon, group: 'account' },

  { key: 'submit', label: 'ثبت', href: '/vip', icon: AddIcon, activeIcon: AddIcon, group: 'main' },
  { key: 'support', label: 'یادآوری‌ها', href: '/reminders', icon: NotificationsNoneRounded, activeIcon: NotificationsNoneRounded, group: 'main' },
  { key: 'profile', label: 'پروفایل', href: 'https://panel.mlkino.com', icon: PersonOutlineOutlinedIcon, activeIcon: PersonIcon, group: 'account' },
];

export const MAIN_ITEMS = NAV_ITEMS.filter((i) => i.group === 'main');

export const isNavActive = (pathname: string | null, href: string) =>
  !!pathname && (pathname === href || pathname.startsWith(`${href}/`));
