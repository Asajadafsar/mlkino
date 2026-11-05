"use client";

import React, { useMemo, useState } from "react";
import {
  Box,
  ClickAwayListener,
  Divider,
  IconButton,
  InputBase,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Typography,
} from "@mui/material";

import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";

export type SearchSuggestion = {
  id: string | number;
  title: string;
  subtitle?: string;
};

type SearchBoxProps = {
  placeholder?: string;
  suggestions?: SearchSuggestion[];
  trending?: string[];
  maxHistory?: number;
  storageKey?: string;
  onSearch?: (query: string) => void;
  onFilterClick?: () => void;
};

const DEFAULT_TRENDING = [
  "آپارتمان در تهران",
  "آپارتمان سعادت آباد",
  "خانه در شمال",
  "ملک تجاری",
  "آپارتمان نیاوران",
];

const DEFAULT_SUGGESTIONS: SearchSuggestion[] = [
  {
    id: 1,
    title: "سعادت آباد",
    subtitle: "تهران · منطقه ۲",
  },
  {
    id: 2,
    title: "نیاوران",
    subtitle: "تهران · منطقه ۱",
  },
  {
    id: 3,
    title: "پونک",
    subtitle: "تهران · منطقه ۵",
  },
  {
    id: 4,
    title: "آپارتمان در تهران",
    subtitle: "املاک مسکونی",
  },
  {
    id: 5,
    title: "ملک تجاری در تهران",
    subtitle: "املاک تجاری",
  },
];

function readHistory(storageKey: string): string[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const stored = window.localStorage.getItem(storageKey);

    if (!stored) {
      return [];
    }

    const parsed: unknown = JSON.parse(stored);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((item): item is string => typeof item === "string");
  } catch {
    return [];
  }
}

export default function SearchBox({
  placeholder = "جستجوی ملک، منطقه یا محله...",
  suggestions = DEFAULT_SUGGESTIONS,
  trending = DEFAULT_TRENDING,
  maxHistory = 6,
  storageKey = "melkino-search-history",
  onSearch,
  onFilterClick,
}: SearchBoxProps) {
  const [value, setValue] = useState("");
  const [open, setOpen] = useState(false);

  // بدون useEffect و بدون setState در effect
  const [history, setHistory] = useState<string[]>(() =>
    readHistory(storageKey),
  );

  const normalizedQuery = value.trim().toLowerCase();

  const filteredSuggestions = useMemo(() => {
    if (!normalizedQuery) {
      return [];
    }

    return suggestions.filter((item) => {
      const title = item.title.toLowerCase();
      const subtitle = item.subtitle?.toLowerCase() ?? "";

      return (
        title.includes(normalizedQuery) || subtitle.includes(normalizedQuery)
      );
    });
  }, [suggestions, normalizedQuery]);

  const persistHistory = (items: string[]) => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(items));
    } catch {
      // localStorage ممکن است در بعضی محیط‌ها در دسترس نباشد
    }
  };

  const saveHistory = (query: string) => {
    const cleanQuery = query.trim();

    if (!cleanQuery) {
      return;
    }

    const newHistory = [
      cleanQuery,
      ...history.filter(
        (item) => item.toLowerCase() !== cleanQuery.toLowerCase(),
      ),
    ].slice(0, maxHistory);

    setHistory(newHistory);
    persistHistory(newHistory);
  };

  const performSearch = (query: string) => {
    const cleanQuery = query.trim();

    if (!cleanQuery) {
      return;
    }

    saveHistory(cleanQuery);
    setValue(cleanQuery);
    setOpen(false);

    onSearch?.(cleanQuery);
  };

  const removeHistoryItem = (
    event: React.MouseEvent<HTMLButtonElement>,
    itemToRemove: string,
  ) => {
    event.stopPropagation();

    const newHistory = history.filter((item) => item !== itemToRemove);

    setHistory(newHistory);
    persistHistory(newHistory);
  };

  const clearHistory = () => {
    setHistory([]);

    try {
      window.localStorage.removeItem(storageKey);
    } catch {
      // ignore
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    performSearch(value);
  };

  const showHistory = open && !normalizedQuery && history.length > 0;

  const showTrending = open && !normalizedQuery && trending.length > 0;

  const showSuggestions =
    open && Boolean(normalizedQuery) && filteredSuggestions.length > 0;

  const showEmptyState =
    open && Boolean(normalizedQuery) && filteredSuggestions.length === 0;

  return (
    <ClickAwayListener onClickAway={() => setOpen(false)}>
      <Box
        sx={{
          position: "relative",
          width: "100%",
          maxWidth: 560,
        }}
      >
        {/* Search Input */}
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            width: "100%",
            height: 48,
            display: "flex",
            alignItems: "center",
            border: "1px solid",
            borderColor: open ? "primary.main" : "grey.300",
            borderRadius: 2.5,
            bgcolor: "#fff",
            px: 0.75,
            transition: "all .2s ease",
            boxShadow: open ? "0 0 0 3px rgba(25, 118, 210, 0.08)" : "none",

            "&:hover": {
              borderColor: open ? "primary.main" : "grey.400",
            },
          }}
        >
          <IconButton
            type="submit"
            aria-label="جستجو"
            sx={{
              width: 38,
              height: 38,
              color: "text.secondary",
              flexShrink: 0,

              "&:hover": {
                bgcolor: "grey.100",
                color: "primary.main",
              },
            }}
          >
            <SearchRoundedIcon sx={{ fontSize: 21 }} />
          </IconButton>

          <InputBase
            value={value}
            onChange={(event) => setValue(event.target.value)}
            onFocus={() => setOpen(true)}
            placeholder={placeholder}
            inputProps={{
              "aria-label": "جستجوی ملک",
            }}
            sx={{
              flex: 1,
              minWidth: 0,
              px: 1,
              fontSize: "0.88rem",
            }}
          />

          <IconButton
            type="button"
            aria-label="فیلتر جستجو"
            onClick={onFilterClick}
            sx={{
              width: 38,
              height: 38,
              color: "text.secondary",
              flexShrink: 0,

              "&:hover": {
                bgcolor: "grey.100",
                color: "primary.main",
              },
            }}
          >
            <TuneRoundedIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </Box>

        {/* Dropdown */}
        {open && (
          <Paper
            elevation={8}
            sx={{
              position: "absolute",
              top: "calc(100% + 8px)",
              left: 0,
              right: 0,
              zIndex: 1300,
              borderRadius: 3,
              overflow: "hidden",
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            {/* Suggestions */}
            {showSuggestions && (
              <Box sx={{ py: 1 }}>
                <Box
                  sx={{
                    px: 2,
                    pt: 1,
                    pb: 0.5,
                  }}
                >
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontWeight: 700 }}
                  >
                    پیشنهادها
                  </Typography>
                </Box>

                <List disablePadding>
                  {filteredSuggestions.map((item) => (
                    <ListItemButton
                      key={item.id}
                      onClick={() => performSearch(item.title)}
                      sx={{
                        px: 2,
                        py: 1,
                        gap: 1,

                        "&:hover": {
                          bgcolor: "grey.50",
                        },
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          minWidth: 38,
                          color: "text.secondary",
                        }}
                      >
                        <SearchRoundedIcon sx={{ fontSize: 20 }} />
                      </ListItemIcon>

                      <ListItemText
                        primary={
                          <Typography
                            variant="body2"
                            sx={{
                              fontSize: "0.88rem",
                              fontWeight: 600,
                            }}
                          >
                            {item.title}
                          </Typography>
                        }
                        secondary={
                          item.subtitle ? (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{
                                fontSize: "0.75rem",
                              }}
                            >
                              {item.subtitle}
                            </Typography>
                          ) : undefined
                        }
                      />
                    </ListItemButton>
                  ))}
                </List>
              </Box>
            )}

            {/* History */}
            {showHistory && (
              <Box sx={{ py: 1 }}>
                <Box
                  sx={{
                    px: 2,
                    pt: 1,
                    pb: 0.5,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontWeight: 700 }}
                  >
                    جستجوهای اخیر
                  </Typography>

                  <Typography
                    component="button"
                    type="button"
                    onClick={clearHistory}
                    sx={{
                      border: 0,
                      background: "transparent",
                      color: "primary.main",
                      cursor: "pointer",
                      fontSize: "0.72rem",
                      fontFamily: "inherit",
                      p: 0,
                    }}
                  >
                    پاک کردن همه
                  </Typography>
                </Box>

                <List disablePadding>
                  {history.map((item) => (
                    <ListItemButton
                      key={item}
                      onClick={() => performSearch(item)}
                      sx={{
                        px: 2,
                        py: 0.85,

                        "&:hover": {
                          bgcolor: "grey.50",
                        },
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          minWidth: 38,
                          color: "text.secondary",
                        }}
                      >
                        <HistoryRoundedIcon sx={{ fontSize: 20 }} />
                      </ListItemIcon>

                      <ListItemText
                        primary={
                          <Typography
                            variant="body2"
                            sx={{
                              fontSize: "0.85rem",
                            }}
                          >
                            {item}
                          </Typography>
                        }
                      />

                      <IconButton
                        size="small"
                        aria-label={`حذف ${item}`}
                        onClick={(event) => removeHistoryItem(event, item)}
                        sx={{
                          color: "grey.400",

                          "&:hover": {
                            color: "error.main",
                            bgcolor: "grey.100",
                          },
                        }}
                      >
                        <CloseRoundedIcon sx={{ fontSize: 17 }} />
                      </IconButton>
                    </ListItemButton>
                  ))}
                </List>
              </Box>
            )}

            {/* Divider */}
            {showHistory && showTrending && <Divider />}

            {/* Trending */}
            {showTrending && (
              <Box sx={{ py: 1 }}>
                <Box
                  sx={{
                    px: 2,
                    pt: 1,
                    pb: 0.5,
                  }}
                >
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontWeight: 700 }}
                  >
                    جستجوهای ترند
                  </Typography>
                </Box>

                <List disablePadding>
                  {trending.slice(0, 6).map((item, index) => (
                    <ListItemButton
                      key={`${item}-${index}`}
                      onClick={() => performSearch(item)}
                      sx={{
                        px: 2,
                        py: 0.85,

                        "&:hover": {
                          bgcolor: "grey.50",
                        },
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          minWidth: 38,
                          color: "secondary.main",
                        }}
                      >
                        <TrendingUpRoundedIcon sx={{ fontSize: 20 }} />
                      </ListItemIcon>

                      <ListItemText
                        primary={
                          <Typography
                            variant="body2"
                            sx={{
                              fontSize: "0.85rem",
                            }}
                          >
                            {item}
                          </Typography>
                        }
                      />
                    </ListItemButton>
                  ))}
                </List>
              </Box>
            )}

            {/* Empty */}
            {showEmptyState && (
              <Box
                sx={{
                  px: 2,
                  py: 3,
                  textAlign: "center",
                }}
              >
                <SearchRoundedIcon
                  sx={{
                    fontSize: 30,
                    color: "grey.400",
                    mb: 0.5,
                  }}
                />

                <Typography variant="body2" color="text.secondary">
                  پیشنهادی برای «{value}» پیدا نشد
                </Typography>

                <Typography variant="caption" color="text.secondary">
                  برای جستجو Enter را بزنید
                </Typography>
              </Box>
            )}
          </Paper>
        )}
      </Box>
    </ClickAwayListener>
  );
}
