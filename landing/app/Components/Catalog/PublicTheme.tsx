"use client";
import {useEffect,useMemo,type ReactNode} from 'react';
import {ThemeProvider,createTheme} from '@mui/material/styles';
import {theme} from '../../theme';
import type {PublicConfig} from '../../Core/catalog';
import {usePublic} from './usePublic';
const valid=(color:unknown,fallback:string)=>typeof color==='string'&&/^#[\da-f]{6}$/i.test(color)?color:fallback;
export default function PublicTheme({children}:{children:ReactNode}){const {data}=usePublic<PublicConfig>('config/');const primary=valid(data?.theme?.primary,theme.palette.primary.main),secondary=valid(data?.theme?.secondary,theme.palette.secondary.main);const configured=useMemo(()=>createTheme(theme,{palette:{primary:{main:primary},secondary:{main:secondary}}}),[primary,secondary]);useEffect(()=>{document.documentElement.style.setProperty('--melkino-primary',primary);document.documentElement.style.setProperty('--melkino-secondary',secondary)},[primary,secondary]);return <ThemeProvider theme={configured}>{children}</ThemeProvider>}
