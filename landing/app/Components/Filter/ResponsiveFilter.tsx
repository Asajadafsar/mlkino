'use client'
import {
  Box,
  Button,
  Drawer,
  Grid,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import React, { useState } from "react";
import AdvancedFilterPanel from "./AdvancedFilterPanel";
import TuneIcon from "@mui/icons-material/Tune";

export default function ResponsiveFilter({ desktopFrom = "md" }: { desktopFrom?: "md" | "lg" }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down(desktopFrom));
  const [filterOpen, setFilterOpen] = useState(false);
  return (
    <>
      {isMobile ? (
        <>
          <Grid size={12}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<TuneIcon />}
              onClick={() => setFilterOpen(true)}
              sx={{ py: 1.2, borderRadius: "10px", fontWeight: 700 }}
            >
              فیلترهای پیشرفته
            </Button>
          </Grid>

          <Drawer
            anchor="bottom"
            open={filterOpen}
            onClose={() => setFilterOpen(false)}
            keepMounted
            slotProps={{
              paper: {
                sx: {
                  borderTopLeftRadius: 20,
                  borderTopRightRadius: 20,
                  maxHeight: "90dvh",
                  pb: "env(safe-area-inset-bottom)",
                },
              },
            }}
          >
            <AdvancedFilterPanel
              embedded
              onClose={() => setFilterOpen(false)}
              onApply={() => setFilterOpen(false)}
            />
          </Drawer>
        </>
      ) : (
        <Grid size={desktopFrom === "lg" ? { lg: 4, xl: 3 } : { md: 4, lg: 3 }}>
          <Box sx={{ position: "sticky", top: 16 }}>
            <AdvancedFilterPanel />
          </Box>
        </Grid>
      )}
    </>
  );
}
