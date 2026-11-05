import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import { Box, CssBaseline, ThemeProvider } from "@mui/material";
import { cacheRtlOptions, theme } from "./theme";
import Navbar from "./Components/Navbar/Navbar";

const vazirmatn = localFont({
  src: "../node_modules/@fontsource-variable/vazirmatn/files/vazirmatn-arabic-wght-normal.woff2",
  weight: "100 900",
  display: "swap",
  variable: "--font-vazirmatn",
});

export const metadata: Metadata = {
  title: "ملکینو",
  description: "سایت خرید و فروش آنلاین ملک",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa" dir="rtl" className={vazirmatn.variable}>
      <body style={{ margin: 0 }}>
        <AppRouterCacheProvider options={cacheRtlOptions}>
          <ThemeProvider theme={theme}>
            <CssBaseline />

            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                minHeight: "100vh",
              }}
            >
              <Navbar />

              <Box component="main" sx={{ flexGrow: 1, pb: { xs: "calc(104px + env(safe-area-inset-bottom))", lg: 0 } }}>
                {children}
              </Box>

            </Box>
          </ThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}