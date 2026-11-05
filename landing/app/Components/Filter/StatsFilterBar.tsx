"use client";
import React, { useEffect, useRef, useState } from "react";
import { Box, Button, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";

type FilterItemBase<T extends string> = {
  key: T;
  value: string;
  color?: string;
};

type FilterItemWithIcon<T extends string> = FilterItemBase<T> & {
  icon: React.ElementType;
  count?: never;
};

type FilterItemWithCount<T extends string> = FilterItemBase<T> & {
  count: string | number;
  icon?: never;
};

type FilterItemPlain<T extends string> = FilterItemBase<T> & {
  icon?: never;
  count?: never;
};

export type FilterItem<T extends string = string> =
  | FilterItemWithIcon<T>
  | FilterItemWithCount<T>
  | FilterItemPlain<T>;

type Props<T extends string = string> = {
  items: FilterItem<T>[];
  value?: T;
  defaultValue?: T;
  onChange?: (key: T) => void;
  ariaLabel?: string;
};

const ACTIVE_TEXT = "#1a4fa3";
const IDLE_TEXT = "#5b6472";
const FALLBACK_COLORS = ["#d99a1e", "#2563c9", "#7b3fb0", "#0f9d74", "#d1495b"];

export default function StatsFilterBar<T extends string = string>({
  items,
  value,
  defaultValue,
  onChange,
  ariaLabel = "فیلتر فایل‌ها",
}: Props<T>) {
  const theme = useTheme();
  const isRtl = theme.direction === "rtl";

  const isControlled = value !== undefined;
  const [inner, setInner] = useState<T | undefined>(defaultValue ?? items[0]?.key);
  const active = isControlled ? value : inner;

  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const select = (key: T) => {
    if (!isControlled) setInner(key);
    onChange?.(key);
  };

  useEffect(() => {
    if (active === undefined) return;
    tabRefs.current[active]?.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }, [active]);

  const onKeyDown = (e: React.KeyboardEvent, index: number) => {
    let next = index;
    if (e.key === "ArrowRight") next = isRtl ? index - 1 : index + 1;
    else if (e.key === "ArrowLeft") next = isRtl ? index + 1 : index - 1;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = items.length - 1;
    else return;

    e.preventDefault();
    const target = items[(next + items.length) % items.length];
    select(target.key);
    tabRefs.current[target.key]?.focus();
  };

  return (
    <Box
      sx={{
        width: "100%",
        boxSizing: "border-box",
        backgroundColor: "#fff",
        borderRadius: 3,
        border: "1px solid #eef0f4",
        boxShadow: "0 4px 20px rgba(20, 30, 60, 0.06)",
        p: { xs: 0.75, sm: 1, md: 1.25 },
        display: "flex",
        flexDirection: { xs: "column", lg: "row" },
        alignItems: { xs: "stretch", lg: "center" },
        gap: { xs: 1.5, lg: 2 },
        minWidth: 0,
      }}
    >
      <Box
        role="tablist"
        aria-label={ariaLabel}
        sx={{
          backgroundColor: "transparent",
          borderRadius: "14px",
          p: 0.5,
          display: "flex",
          gap: 0.5,
          minWidth: 0,
          width: "100%",
          maxWidth: "100%",
          boxSizing: "border-box",
          overflowX: "auto",
          overscrollBehaviorX: "contain",
          scrollSnapType: "x proximity",
          WebkitOverflowScrolling: "touch",
          scrollbarWidth: "none",
          "&::-webkit-scrollbar": { display: "none" },
        }}
      >
        {items.map((item, index) => {
          const isActive = active === item.key;
          const Icon = item.icon;
          const hasCount = !Icon && item.count !== undefined;
          const color = item.color ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length];

          return (
            <Button
              key={item.key}
              ref={(el) => {
                tabRefs.current[item.key] = el;
              }}
              role="tab"
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              disableRipple
              onClick={() => select(item.key)}
              onKeyDown={(e) => onKeyDown(e, index)}
              sx={{
                flex: "1 1 0",
                scrollSnapAlign: "center",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: { xs: 0.75, md: 1 },
                minHeight: { xs: 44, md: "auto" },
                px: { xs: 1.5, md: 2.25 },
                py: { xs: 0.9, md: 1.1 },
                borderRadius: "10px",
                whiteSpace: "nowrap",
                fontSize: { xs: "0.78rem", md: "0.875rem" },
                fontWeight: isActive ? 800 : 600,
                color: isActive ? "#fff" : IDLE_TEXT,
                backgroundColor: isActive ? "#1667ff" : "transparent",
                boxShadow: isActive ? "0 2px 8px rgba(20, 30, 60, 0.1)" : "none",
                WebkitTapHighlightColor: "transparent",
                transition:
                  "background-color 0.2s ease, box-shadow 0.2s ease, color 0.2s ease",
                "&:hover": {
                  backgroundColor: isActive ? "#125be5" : "rgba(22,103,255,0.05)",
                },
                "&:focus-visible": {
                  outline: `2px solid ${ACTIVE_TEXT}`,
                  outlineOffset: 2,
                },
              }}
            >
              {Icon && (
                <Icon
                  sx={{
                    flexShrink: 0,
                    fontSize: { xs: 18, md: 20 },
                    color: isActive ? "#fff" : "#8b93a1",
                  }}
                />
              )}

              <Box component="span">{item.value}</Box>

              {hasCount && (
                <Box
                  component="span"
                  sx={{
                    px: 1,
                    py: 0.2,
                    borderRadius: "7px",
                    fontSize: { xs: "0.68rem", md: "0.72rem" },
                    fontWeight: 700,
                    lineHeight: 1.6,
                    backgroundColor: isActive ? alpha(color, 0.15) : "#e4e7ed",
                    color: isActive ? color : IDLE_TEXT,
                  }}
                >
                  {item.count}
                </Box>
              )}
            </Button>
          );
        })}
      </Box>
    </Box>
  );
}