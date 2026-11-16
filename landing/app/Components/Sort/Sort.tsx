import React, { useState, useEffect } from "react";
import {
  Box,
  Stack,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  ButtonBase,
  TextField,
  MenuItem,
} from "@mui/material";
import SortIcon from "@mui/icons-material/Sort";
import GridViewOutlinedIcon from "@mui/icons-material/GridViewOutlined";
import TableRowsOutlinedIcon from "@mui/icons-material/TableRowsOutlined";

export type SortValue = "newest" | "cheapest" | "expensive" | "popular";
export type ViewValue = "list" | "grid";

interface SortOption {
  value: SortValue;
  label: string;
}

const SORT_OPTIONS: SortOption[] = [
  { value: "newest", label: "جدیدترین فایل‌ها" },
  { value: "cheapest", label: "ارزان‌ترین" },
  { value: "expensive", label: "گران‌ترین" },
];

export interface FileToolbarProps {
  total?: number;
  from?: number;
  to?: number;
  defaultSort?: SortValue;
  defaultView?: ViewValue;
  sortValue?: SortValue;
  viewValue?: ViewValue;
  onSortChange?: (sort: SortValue) => void;
  onViewChange?: (view: ViewValue) => void;
}

const toPersianDigits = (n: number): string => n.toLocaleString("fa-IR");

export default function FileToolbar({
  total = 1240,
  from = 1,
  to = 6,
  defaultSort = "newest",
  defaultView = "grid",
  sortValue,
  viewValue,
  onSortChange,
  onViewChange,
}: FileToolbarProps): React.JSX.Element {
  // Controlled + Uncontrolled support
  const [sort, setSort] = useState<SortValue>(sortValue ?? defaultSort);
  const [view, setView] = useState<ViewValue>(viewValue ?? defaultView);

  useEffect(() => {
    if (sortValue !== undefined) setSort(sortValue);
  }, [sortValue]);

  useEffect(() => {
    if (viewValue !== undefined) setView(viewValue);
  }, [viewValue]);

  const handleSortChange = (newSort: SortValue): void => {
    if (sortValue === undefined) setSort(newSort);
    onSortChange?.(newSort);
  };

  const handleViewChange = (
    _event: React.MouseEvent<HTMLElement>,
    newView: ViewValue | null,
  ): void => {
    if (newView !== null) {
      if (viewValue === undefined) setView(newView);
      onViewChange?.(newView);
    }
  };

  return (
    <Box
      className="file-toolbar"
      dir="rtl"
      sx={{
        width: "100%",
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 2,
        px: 2,
        py: 1.25,
        borderRadius: 3,
        border: "1px solid #eef0f4",
        boxShadow: "0 4px 20px rgba(20, 30, 60, 0.06)",
        bgcolor: "background.paper",
      }}
    >
      <TextField select label="مرتب‌سازی" value={sort} onChange={event => handleSortChange(event.target.value as SortValue)} size="small" slotProps={{select:{inputProps:{"aria-label":"مرتب‌سازی فایل‌ها"}}}} sx={{display:{xs:"inline-flex",md:"none"},minWidth:150,"& .MuiOutlinedInput-root":{borderRadius:2,fontSize:12}}}>
        {SORT_OPTIONS.map(option => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}
      </TextField>
      {/* Right side (RTL start): sort */}
      <Stack
        sx={{
          display: { xs: "none", md: "flex" },
          flexDirection: "row",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 0.5,
        }}
      >
        <Stack
          sx={{
            display: "flex",
            alignItems: "center",
            flexDirection: "row",
            gap: 0.75,
            ml: 1,
          }}
        >
          <SortIcon color="primary" fontSize="small" />
          <Typography
            variant="body2"
            sx={{ color: "text.secondary", whiteSpace: "nowrap" }}
          >
            مرتب‌سازی بر اساس:
          </Typography>
        </Stack>

        {SORT_OPTIONS.map((opt) => {
          const selected = sort === opt.value;
          return (
            <ButtonBase
              key={opt.value}
              onClick={() => handleSortChange(opt.value)}
              aria-pressed={selected}
              sx={{
                px: 1.75,
                py: 0.75,
                borderRadius: 2,
                fontFamily: "inherit",
                fontSize: "0.8125rem",
                fontWeight: selected ? 700 : 400,
                whiteSpace: "nowrap",
                color: selected ? "primary.main" : "text.secondary",
                bgcolor: selected ? "action.selected" : "transparent",
                transition: "background-color .15s, color .15s",
                "&:hover": {
                  bgcolor: selected ? "action.selected" : "action.hover",
                },
              }}
            >
              {opt.label}
            </ButtonBase>
          );
        })}
      </Stack>

      {/* Left side (RTL end): result count + view toggle */}
      <Stack
        sx={{
          gap: 2,
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <Typography
          variant="body2"
          sx={{ color: "text.secondary", whiteSpace: "nowrap", display: {xs: "none", lg: "block"} }}
        >
          نمایش{" "}
          <Box component="b" sx={{ color: "text.primary", fontWeight: 700 }}>
            {toPersianDigits(from)}
          </Box>{" "}
          تا{" "}
          <Box component="b" sx={{ color: "text.primary", fontWeight: 700 }}>
            {toPersianDigits(to)}
          </Box>{" "}
          از{" "}
          <Box component="b" sx={{ color: "text.primary", fontWeight: 700 }}>
            {toPersianDigits(total)}
          </Box>{" "}
          فایل
        </Typography>

        <ToggleButtonGroup
          value={view}
          exclusive
          onChange={handleViewChange}
          size="small"
          aria-label="حالت نمایش"
          sx={{
            p: 0.5,
            gap: 0.5,
            borderRadius: 2,
            bgcolor: "action.hover",
            "& .MuiToggleButtonGroup-grouped": {
              border: "1px solid transparent",
              borderRadius: "8px !important",
              width: 44,
              height: 44,
              color: "text.disabled",
              "&:not(:first-of-type)": { marginLeft: 0 },
              "&.Mui-selected": {
                bgcolor: "background.paper",
                color: "primary.main",
                borderColor: "primary.light",
                "&:hover": { bgcolor: "background.paper" },
              },
            },
          }}
        >
          <ToggleButton value="grid" aria-label="نمای شبکه‌ای">
            <GridViewOutlinedIcon fontSize="small" />
          </ToggleButton>
          <ToggleButton value="list" aria-label="نمای لیستی">
            <TableRowsOutlinedIcon fontSize="small" />
          </ToggleButton>
        </ToggleButtonGroup>
      </Stack>
    </Box>
  );
}
