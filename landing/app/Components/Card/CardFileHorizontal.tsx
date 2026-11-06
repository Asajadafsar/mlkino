"use client";
import {PANEL_LINKS,PANEL_ORIGIN} from "../../Core/panel";

import type {Theme} from "@mui/material/styles";
import * as React from "react";
import {
  Box,
  Button,
  Card,
  Chip,
  Divider,
  IconButton,
  Stack,
  Typography,
  alpha,
} from "@mui/material";
import LocationOnRoundedIcon from "@mui/icons-material/LocationOnRounded";
import BookmarkRoundedIcon from "@mui/icons-material/BookmarkRounded";
import BookmarkBorderRoundedIcon from "@mui/icons-material/BookmarkBorderRounded";
import PhotoCameraRoundedIcon from "@mui/icons-material/PhotoCameraRounded";
import VerifiedRoundedIcon from "@mui/icons-material/VerifiedRounded";
import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";
import PhoneInTalkRoundedIcon from "@mui/icons-material/PhoneInTalkRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import TourRoundedIcon from "@mui/icons-material/TourRounded";
import EventAvailableRoundedIcon from "@mui/icons-material/EventAvailableRounded";
import HandshakeRoundedIcon from "@mui/icons-material/HandshakeRounded";
import StraightenRoundedIcon from "@mui/icons-material/StraightenRounded";
import KingBedRoundedIcon from "@mui/icons-material/KingBedRounded";
import LayersRoundedIcon from "@mui/icons-material/LayersRounded";
import { useRouter } from "next/navigation";
import { getPropertyTypeIcon } from "./PropertyTypeIcon";
import VisitRequestModal from "./VisitRequestModal";
import type { CardFileProps } from "./CardFile";
import {
  formatNumber,
  getCoverImage,
  getDisplayArea,
  getFormattedLocation,
  getPersonName,
  getPriceInfo,
} from "./cardFileUtils";

/* ------------------------------ Shared styles ------------------------------ */

/**
 * استایل مشترک دکمه‌های اکشن.
 * در موبایل فقط آیکون نمایش داده می‌شود و دکمه‌ها فضای موجود را مساوی تقسیم می‌کنند.
 */
const actionButtonSx = (theme: Theme) => ({
  flex: { xs: "1 1 0", md: "0 0 auto" },
  minWidth: { xs: 0, sm: "auto" },
  height: { xs: 34, sm: 34 },
  px: { xs: 0.75, sm: 1.5 },
  borderRadius: "10px",
  fontWeight: 700,
  fontSize: { xs: 12, sm: 12.5 },
  whiteSpace: "nowrap" as const,
  [theme.breakpoints.down("sm")]: {
    "& .MuiButton-startIcon": { margin: 0 },
  },
  "& .MuiButton-startIcon svg": { fontSize: { xs: 17, sm: 16 } },
});

/** متن دکمه‌ها که در موبایل پنهان می‌شود */
function BtnLabel({ children }: { children: React.ReactNode }) {
  return (
    <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
      {children}
    </Box>
  );
}

/* ------------------------------ Sub-components ----------------------------- */

function Metric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Stack
      direction="row"
      spacing={{ xs: 0.5, sm: 1 }}
      sx={{ alignItems: "center", minWidth: 0 }}
    >
      <Box
        sx={{
          width: { xs: 26, sm: 32 },
          height: { xs: 26, sm: 32 },
          borderRadius: "8px",
          display: "grid",
          placeItems: "center",
          flexShrink: 0,
          bgcolor: alpha("#1976d2", 0.08),
          color: "primary.main",
          "& svg": { fontSize: { xs: 15, sm: 18 } },
        }}
      >
        {icon}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography
          variant="caption"
          sx={{
            display: "block",
            color: "text.muted",
            fontSize: { xs: 9, sm: 11 },
            lineHeight: 1.4,
          }}
        >
          {label}
        </Typography>
        <Typography
          variant="body2"
          noWrap
          sx={{
            fontWeight: 700,
            color: "text.primary",
            lineHeight: 1.4,
            fontSize: { xs: 10.5, sm: 13 },
          }}
        >
          {value}
        </Typography>
      </Box>
    </Stack>
  );
}

function InfoRow({
  icon,
  label,
  value,
  ltr = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  ltr?: boolean;
}) {
  return (
    <Stack direction="row" spacing={0.5} sx={{ alignItems: "center", minWidth: 0 }}>
      {icon}
      <Typography
        variant="caption"
        sx={{ fontSize: { xs: 10, sm: 11 }, color: "text.secondary", flexShrink: 0 }}
      >
        {label}
      </Typography>
      <Typography
        variant="caption"
        noWrap
        sx={{
          fontSize: { xs: 10, sm: 11 },
          fontWeight: 700,
          color: "text.primary",
          ...(ltr && { direction: "ltr" }),
        }}
      >
        {value}
      </Typography>
    </Stack>
  );
}

/* -------------------------------- Component -------------------------------- */

export default function CardFileHorizontal({
  data,
  badgeLabel,
  initialBookmarked = false,
  isVerified = false,
  onBookmarkToggle,
  onDetailsClick,
  onVisitRequest,
  onIHave,
  mode = "file",
}: CardFileProps) {
  const [bookmarked, setBookmarked] = React.useState(initialBookmarked);
  const [visitModalOpen, setVisitModalOpen] = React.useState(false);
  const router = useRouter();

  const coverImage = React.useMemo(() => getCoverImage(data), [data]);
  const hasImages = !!data.images && data.images.length > 0;
  const price = getPriceInfo(data);
  const personName = getPersonName(data);

  const virtualTourUrl: string | undefined =
    data.virtualTourUrl?.telegram || data.virtualTourUrl?.instagram || data.virtualTourUrl?.eitaa;

  const handleBookmarkClick = (e: React.MouseEvent) => {
    e.stopPropagation();window.location.assign(PANEL_ORIGIN+'/favorites?property='+data.id)
  };

  const handleDetails = () => {
    if (onDetailsClick) onDetailsClick(data);
    else router.push(`/property/${data.id ?? 1}`);
  };

  const handleViewProperty = () => {
    if (virtualTourUrl) {
      window.open(virtualTourUrl, "_blank", "noopener,noreferrer");
    } else {
      router.push(`/property/${data.id ?? 1}`);
    }
  };

  const handleVisitRequest = () => {window.location.assign(PANEL_ORIGIN+'/visits?property='+data.id)};

  /* --------------------------- بج‌ها (قابل استفاده مجدد) -------------------------- */
  const badges = (
    <>
      {badgeLabel && (
        <Chip
          size="small"
          label={badgeLabel}
          sx={{
            height: { xs: 20, sm: 24 },
            fontSize: { xs: 10, sm: 11 },
            fontWeight: 700,
            bgcolor: "warning.main",
            color: "warning.contrastText",
            "& .MuiChip-label": { px: { xs: 0.75, sm: 1 } },
          }}
        />
      )}
      {data.contractType && (
        <Chip
          size="small"
          label={data.contractType}
          sx={{
            height: { xs: 20, sm: 24 },
            fontSize: { xs: 10, sm: 11 },
            fontWeight: 700,
            bgcolor: alpha("#FFFFFF", 0.9),
            backdropFilter: "blur(4px)",
            color: "primary.dark",
            "& .MuiChip-label": { px: { xs: 0.75, sm: 1 } },
          }}
        />
      )}
    </>
  );

  return (
    <>
      <Card
        elevation={0}
        sx={{
          width: "100%",
          display: "flex",
          flexDirection: "row",
          // ✅ در موبایل تصویر کشیده نمی‌شود، در sm به بالا کشیده می‌شود
          alignItems: { xs: "flex-start", sm: "stretch" },
          borderRadius: { xs: "12px", sm: "14px" },
          overflow: "hidden",
          bgcolor: "background.default",
          border: "1px solid #eef0f4",
          boxShadow: "0 4px 20px rgba(20, 30, 60, 0.06)",
          transition: "box-shadow 0.3s ease, transform 0.3s ease",
          "&:hover": {
            boxShadow: "0 12px 28px rgba(20,68,147,0.14)",
            transform: { xs: "none", sm: "translateY(-3px)" },
          },
          "&:hover .card-cover-img": { transform: { xs: "none", sm: "scale(1.05)" } },
        }}
      >
        {/* ------------------------------- تصویر ------------------------------ */}
        <Box
          sx={{
            position: "relative",
            flexShrink: 0,
            width: { xs: 120, sm: 210, md: 240, lg: 280 },
            // ✅ در موبایل ارتفاع ثابت → تصویر مربعی/کوتاه و مرتب
            height: { xs: 140, sm: "auto" },
            minHeight: { xs: 140, sm: 240 },
            alignSelf: { xs: "flex-start", sm: "stretch" },
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderTopLeftRadius: "inherit",
            borderBottomLeftRadius: { xs: 0, sm: "inherit" },
            // در موبایل یک گوشه‌ی راست پایین هم گرد می‌کنیم تا زیبا شود
            borderBottomRightRadius: { xs: "12px", sm: 0 },
            background: hasImages
              ? "none"
              : (theme) =>
                  `linear-gradient(135deg, ${alpha(
                    theme.palette.primary.main,
                    0.08,
                  )} 0%, ${alpha(theme.palette.primary.main, 0.2)} 100%)`,
          }}
        >
          {hasImages ? (
            <Box
              component="img"
              className="card-cover-img"
              src={coverImage ?? "/images/placeholder.jpg"}
              alt={data.propertyType || "ملک"}
              sx={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                transition: "transform 0.5s ease",
              }}
            />
          ) : (
            <Stack
              spacing={0.5}
              sx={{
                alignItems: "center",
                color: "primary.main",
                p: { xs: 0.5, sm: 2 },
                textAlign: "center",
              }}
            >
              {getPropertyTypeIcon(data.propertyType, {
                sx: { fontSize: { xs: 32, sm: 64 }, opacity: 0.85 },
              })}
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 700,
                  color: "text.secondary",
                  fontSize: { xs: 9.5, sm: 13 },
                  lineHeight: 1.4,
                }}
              >
                {data.propertyType || "درخواست ملک"}
              </Typography>
            </Stack>
          )}

          {/* بج‌ها فقط از سایز sm به بالا روی تصویر */}
          <Stack
            direction="row"
            spacing={0.75}
            sx={{
              position: "absolute",
              top: { xs: 8, sm: 12 },
              left: { xs: 8, sm: 12 },
              zIndex: 1,
              display: { xs: "none", sm: "flex" },
              flexWrap: "wrap",
              gap: 0.75,
            }}
          >
            {badges}
          </Stack>

          <IconButton
            onClick={handleBookmarkClick}
            aria-label="نشان کردن ملک"
            size="small"
            sx={{
              position: "absolute",
              top: { xs: 6, sm: 10 },
              right: { xs: 6, sm: 10 },
              zIndex: 1,
              width: { xs: 26, sm: 32 },
              height: { xs: 26, sm: 32 },
              bgcolor: alpha("#FFFFFF", 0.85),
              backdropFilter: "blur(4px)",
              color: bookmarked ? "primary.main" : "text.secondary",
              "& svg": { fontSize: { xs: 15, sm: 18 } },
              "&:hover": { bgcolor: "#FFFFFF" },
            }}
          >
            {bookmarked ? (
              <BookmarkRoundedIcon fontSize="small" />
            ) : (
              <BookmarkBorderRoundedIcon fontSize="small" />
            )}
          </IconButton>

          {hasImages && (
            <Stack
              direction="row"
              sx={{
                alignItems: "center",
                position: "absolute",
                bottom: { xs: 6, sm: 10 },
                right: { xs: 6, sm: 10 },
                px: { xs: 0.6, sm: 1 },
                py: 0.3,
                borderRadius: "6px",
                bgcolor: alpha("#000000", 0.65),
                color: "#FFFFFF",
                gap: 0.4,
                zIndex: 1,
              }}
            >
              <PhotoCameraRoundedIcon sx={{ fontSize: { xs: 11, sm: 13 } }} />
              <Typography
                variant="caption"
                sx={{ fontSize: { xs: 9.5, sm: 11 }, fontWeight: 600 }}
              >
                {formatNumber(data.images!.length)}
              </Typography>
            </Stack>
          )}
        </Box>

        {/* ------------------------------ محتوا ------------------------------- */}
        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            p: { xs: 1.25, sm: 2, md: 2.5 },
            display: "flex",
            flexDirection: "column",
            gap: { xs: 1, sm: 1.5, md: 2 },
          }}
        >
          {/* ردیف بالا: عنوان + مشاور */}
          <Stack
            direction="row"
            sx={{
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: { xs: 0.75, sm: 2 },
            }}
          >
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography
                variant="subtitle1"
                noWrap
                sx={{
                  fontWeight: 800,
                  color: "text.title",
                  fontSize: { xs: 13, sm: 15, md: 16 },
                  lineHeight: 1.5,
                }}
              >
                {`${data.propertyType}${
                  data.contractType ? ` - ${data.contractType}` : ""
                }`}
              </Typography>

              <Stack
                direction="row"
                spacing={0.5}
                sx={{ alignItems: "center", color: "text.muted", mt: 0.25, minWidth: 0 }}
              >
                <LocationOnRoundedIcon
                  sx={{
                    fontSize: { xs: 14, sm: 17 },
                    color: "primary.main",
                    flexShrink: 0,
                  }}
                />
                <Typography
                  variant="caption"
                  noWrap
                  sx={{ fontSize: { xs: 10.5, sm: 12 } }}
                >
                  {getFormattedLocation(data)}
                </Typography>
              </Stack>

              {/* بج‌ها در موبایل زیر عنوان */}
              <Stack
                direction="row"
                sx={{
                  display: { xs: "flex", sm: "none" },
                  flexWrap: "wrap",
                  gap: 0.5,
                  mt: 0.75,
                }}
              >
                {badges}
              </Stack>
            </Box>

            <Stack
              direction="row"
              spacing={1}
              sx={{ alignItems: "center", flexShrink: 0 }}
            >
              {mode === "request" && (
                <Chip
                  size="small"
                  label="درخواست"
                  sx={{
                    height: { xs: 18, sm: 22 },
                    fontSize: { xs: 9.5, sm: 10 },
                    fontWeight: 700,
                    bgcolor: alpha("#1976d2", 0.1),
                    color: "primary.main",
                    "& .MuiChip-label": { px: { xs: 0.6, sm: 1 } },
                  }}
                />
              )}

              <Stack
                direction="row"
                spacing={0.75}
                sx={{
                  alignItems: "center",
                  display: { xs: "none", md: "flex" },
                }}
              >
                {isVerified ? (
                  <VerifiedRoundedIcon sx={{ fontSize: 18, color: "#10B981" }} />
                ) : (
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      bgcolor: "#10B981",
                      boxShadow: "0 0 0 3px rgba(16,185,129,0.15)",
                    }}
                  />
                )}
                <Typography
                  variant="caption"
                  noWrap
                  sx={{
                    maxWidth: 140,
                    color: "text.secondary",
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  {personName}
                </Typography>
              </Stack>
            </Stack>
          </Stack>

          {/* متریک‌ها */}
          <Stack
            direction="row"
            divider={
              <Divider
                orientation="vertical"
                flexItem
                sx={{ display: { xs: "none", sm: "block" } }}
              />
            }
            sx={{
              flexWrap: "wrap",
              rowGap: { xs: 0.75, sm: 1.5 },
              columnGap: { xs: 1.25, sm: 2.5 },
              bgcolor: "#F8FAFC",
              border: "1px solid #eef0f4",
              borderRadius: "10px",
              px: { xs: 1, sm: 2 },
              py: { xs: 0.75, sm: 1.25 },
            }}
          >
            <Metric
              icon={<StraightenRoundedIcon />}
              label="متراژ"
              value={getDisplayArea(data)}
            />
            <Metric
              icon={<KingBedRoundedIcon />}
              label="اتاق"
              value={data.roomCount ? `${formatNumber(data.roomCount)} خواب` : "نامشخص"}
            />
            <Metric
              icon={<LayersRoundedIcon />}
              label="طبقه"
              value={data.totalFloor ? formatNumber(data.totalFloor) : "نامشخص"}
            />
          </Stack>

          {/* اطلاعات متقاضی */}
          {(data.requesterName || data.requesterPhone) && (
            <Stack
              direction="row"
              sx={{
                flexWrap: "wrap",
                columnGap: { xs: 1.5, sm: 3 },
                rowGap: 0.5,
                px: { xs: 1, sm: 1.25 },
                py: { xs: 0.5, sm: 0.75 },
                borderRadius: "8px",
                bgcolor: alpha("#1976d2", 0.05),
              }}
            >
              {data.requesterName && (
                <InfoRow
                  icon={
                    <PersonOutlineRoundedIcon
                      sx={{ fontSize: { xs: 13, sm: 15 }, color: "primary.main" }}
                    />
                  }
                  label="متقاضی:"
                  value={data.requesterName}
                />
              )}
              {data.requesterPhone && (
                <InfoRow
                  icon={
                    <PhoneInTalkRoundedIcon
                      sx={{ fontSize: { xs: 13, sm: 15 }, color: "primary.main" }}
                    />
                  }
                  label="تماس:"
                  value={data.requesterPhone}
                  ltr
                />
              )}
            </Stack>
          )}

          {/* فوتر: قیمت + دکمه‌ها */}
          <Stack
            direction={{ xs: "column", md: "row" }}
            sx={{
              mt: "auto",
              pt: { xs: 1, sm: 1.5 },
              borderTop: "1px dashed #e3e7ee",
              justifyContent: "space-between",
              alignItems: { xs: "stretch", md: "center" },
              gap: { xs: 1.25, sm: 1.5 },
            }}
          >
            {/* قیمت */}
            <Box sx={{ minWidth: 0, flexShrink: 0 }}>
              <Typography
                variant="caption"
                sx={{
                  display: "block",
                  color: "text.muted",
                  fontSize: { xs: 10, sm: 12 },
                  lineHeight: 1.6,
                }}
              >
                {price.label}
              </Typography>
              <Stack direction="row" spacing={0.5} sx={{ alignItems: "baseline" }}>
                <Typography
                  variant="h6"
                  noWrap
                  sx={{
                    fontWeight: 800,
                    color: "primary.main",
                    lineHeight: 1.3,
                    fontSize: { xs: 14.5, sm: 18, md: 20 },
                  }}
                >
                  {price.value}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: "text.secondary",
                    fontWeight: 600,
                    fontSize: { xs: 10, sm: 12 },
                    flexShrink: 0,
                  }}
                >
                  تومان
                </Typography>
              </Stack>
            </Box>

            {/* دکمه‌ها */}
            <Stack
              direction="row"
              sx={{
                flexWrap: { xs: "nowrap", sm: "wrap" },
                gap: { xs: 0.75, sm: 1 },
                justifyContent: { xs: "stretch", md: "flex-end" },
                alignItems: "center",
                width: { xs: "100%", md: "auto" },
              }}
            >
              {mode === "file" ? (
                <>
                  <Button
                    onClick={handleViewProperty}
                    variant="outlined"
                    size="small"
                    aria-label="مشاهده ملک"
                    startIcon={<TourRoundedIcon />}
                    sx={(theme) => ({
                      ...actionButtonSx(theme),
                      borderColor: alpha("#1976d2", 0.4),
                      color: "primary.main",
                      "&:hover": {
                        borderColor: "primary.main",
                        bgcolor: alpha("#1976d2", 0.06),
                      },
                    })}
                  >
                    <BtnLabel>مشاهده ملک</BtnLabel>
                  </Button>

                  <Button
                    onClick={handleVisitRequest}
                    variant="outlined"
                    size="small"
                    aria-label="ثبت بازدید"
                    startIcon={<EventAvailableRoundedIcon />}
                    sx={(theme) => ({
                      ...actionButtonSx(theme),
                      borderColor: alpha("#10B981", 0.5),
                      color: "#059669",
                      "&:hover": {
                        borderColor: "#10B981",
                        bgcolor: alpha("#10B981", 0.08),
                      },
                    })}
                  >
                    <BtnLabel>ثبت بازدید</BtnLabel>
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => window.location.assign(PANEL_LINKS.createFile)}
                  variant="outlined"
                  size="small"
                  aria-label="من دارم"
                  startIcon={<HandshakeRoundedIcon />}
                  sx={(theme) => ({
                    ...actionButtonSx(theme),
                    borderColor: alpha("#9c27b0", 0.5),
                    color: "#7b1fa2",
                    "&:hover": {
                      borderColor: "#9c27b0",
                      bgcolor: alpha("#9c27b0", 0.08),
                    },
                  })}
                >
                  <BtnLabel>من دارم</BtnLabel>
                </Button>
              )}

              <Button
                onClick={handleDetails}
                variant="contained"
                size="small"
                aria-label="مشاهده جزئیات"
                startIcon={<VisibilityRoundedIcon />}
                sx={(theme) => ({
                  ...actionButtonSx(theme),
                  fontSize: { xs: 12, sm: 13 },
                  boxShadow: "0 4px 12px rgba(25,118,210,0.25)",
                  "&:hover": { boxShadow: "0 6px 16px rgba(25,118,210,0.35)" },
                })}
              >
                <BtnLabel>مشاهده جزئیات</BtnLabel>
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Card>

      <VisitRequestModal
        key={visitModalOpen ? "open" : "closed"}
        open={visitModalOpen}
        onClose={() => setVisitModalOpen(false)}
        property={data}
        onSubmit={async () => {
          window.location.assign(PANEL_ORIGIN+'/visits?property='+data.id);
        }}
      />
    </>
  );
}