'use client';

import { createTheme } from '@mui/material/styles';
import rtlPlugin from 'stylis-plugin-rtl';
import { prefixer } from 'stylis';

declare module '@mui/material/styles' {
  interface TypeText {
    title: string;
    subtitle: string;
    muted: string;
  }

  interface TypeBackground {
    border: string;
  }

  interface PaletteOptions {
    text?: Partial<TypeText>;
    background?: Partial<TypeBackground>;
  }
}

// تنظیمات RTL Cache برای AppRouterCacheProvider
export const cacheRtlOptions = {
  key: 'muirtl',
  stylisPlugins: [prefixer, rtlPlugin],
};

export const theme = createTheme({
  direction: 'rtl',
  typography: { fontFamily: 'var(--font-vazirmatn), Arial, sans-serif' },

  palette: {
    primary: {
      main: '#1667ff',
      light: '#4B83DC',
      dark: '#144493',
    },

    secondary: {
      main: '#ffa900',
      light: '#FBC268',
      dark: '#AF7A28',
    },

    background: {
      default: '#f7f7ff',
      paper: '#FFFFFF',
      border: '#D4D4D2',
      
    },

    text: {
      primary: '#111b40',
      secondary: '#8490ac',
      title: '#10100F',
      subtitle: '#757571',
      muted: '#575753',
    },
  },

  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1100,
      xl: 1536,
    },
  },

  components: {
    MuiCssBaseline: {
      styleOverrides: {
        '*': {
          scrollbarWidth: 'thin',
          scrollbarColor: '#CCCCCC #F1F1F1',

          '&::-webkit-scrollbar': {
            width: '7px',
            height: '7px',
          },

          '&::-webkit-scrollbar-track': {
            background: '#F1F1F1',
            borderRadius: '10px',
          },

          '&::-webkit-scrollbar-thumb': {
            background: '#CCCCCC',
            borderRadius: '10px',
          },

          '&::-webkit-scrollbar-thumb:hover': {
            background: '#AAAAAA',
          },
        },
      },
    },

    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: '8px',

          '& .MuiOutlinedInput-notchedOutline': {
            borderRadius: '8px',
          },
        },
      },
    },

    MuiFilledInput: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: '8px',

          '&.Mui-disabled': {
            backgroundColor: 'rgba(239, 238, 236, 0.8)',

            '& .MuiFilledInput-input': {
              color: theme.palette.text.primary,
              WebkitTextFillColor: theme.palette.text.primary,
            },
          },
        }),
      },
    },

    MuiSelect: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: '8px',

          '& .MuiOutlinedInput-notchedOutline': {
            borderRadius: '8px',
          },

          '& .MuiSelect-icon': {
            color: theme.palette.text.primary,
          },

          '&.Mui-disabled': {
            '& .MuiSelect-select': {
              color: theme.palette.text.primary,
            },

            '& .MuiSelect-icon': {
              color: theme.palette.text.primary,
            },
          },
        }),
      },
    },
  },
});