"use client";
import {PANEL_LINKS,PANEL_ORIGIN} from "../../Core/panel";
import { useState } from "react";
import FavoriteBorderRoundedIcon from "@mui/icons-material/FavoriteBorderRounded";
import FavoriteRoundedIcon from "@mui/icons-material/FavoriteRounded";
import BedOutlinedIcon from "@mui/icons-material/BedOutlined";
import SquareFootRoundedIcon from "@mui/icons-material/SquareFootRounded";
import MoreHorizRoundedIcon from "@mui/icons-material/MoreHorizRounded";
import showcase from "./showcase.module.css";
import VirtualTourModal from "./VirtualTourModal";
import * as React from "react";
import {
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  IconButton,
  Stack,
  Typography,
  Button,
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
import { useRouter } from "next/navigation";
import { PropertyType } from "@/app/Core/types";
import { getPropertyTypeIcon } from "./PropertyTypeIcon";
import VisitRequestModal from "./VisitRequestModal";
import {
  formatNumber,
  getCoverImage,
  getDisplayArea,
  getFormattedLocation,
  getPersonName,
  getPriceInfo,
} from "./cardFileUtils";

export interface CardFileProps {
  data: PropertyType;
  appearance?: "default" | "showcase";
  badgeLabel?: string;
  initialBookmarked?: boolean;
  isVerified?: boolean;
  onBookmarkToggle?: (bookmarked: boolean) => void;
  onDetailsClick?: (data: PropertyType) => void;
  /** ثبت بازدید (فقط در mode="file") */
  onVisitRequest?: (data: PropertyType) => void;
  /** من دارم (فقط در mode="request") */
  onIHave?: (data: PropertyType) => void;
  mode?: "request" | "file";
}

/* ------------------------------ Sub-components ----------------------------- */

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column" }}>
      <Typography variant="caption" sx={{ color: "text.muted", fontSize: 11 }}>
        {label}
      </Typography>
      <Typography
        variant="body2"
        sx={{ fontWeight: 700, color: "text.primary" }}
      >
        {value}
      </Typography>
    </Box>
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
    <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
      {icon}
      <Typography
        variant="caption"
        sx={{ fontSize: 11, color: "text.secondary" }}
      >
        {label}
      </Typography>
      <Typography
        variant="caption"
        sx={{
          fontSize: 11,
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

export default function CardFile({
  data,
  appearance = "default",
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
  const [virtualTourModalOpen, setVirtualTourModalOpen] = useState(false);

  const handleViewProperty = () => {
    setVirtualTourModalOpen(true);
  };
  const router = useRouter();

  const coverImage = React.useMemo(() => getCoverImage(data), [data]);
  const hasImages = !!data.images && data.images.length > 0;
  const price = getPriceInfo(data);
  const personName = getPersonName(data);

  // const virtualTourUrl: string | undefined =
  //   (data).virtualTourUrl;

  const handleBookmarkClick = (e: React.MouseEvent) => {
    e.stopPropagation();window.location.assign(PANEL_ORIGIN+'/favorites?property='+data.id)
  };

  const handleDetails = () => {
    if (onDetailsClick) onDetailsClick(data);
    else router.push(`/property/${data.id ?? 1}`);
  };

  // const handleViewProperty = () => {
  //   if (virtualTourUrl) {
  //     window.open(virtualTourUrl, "_blank", "noopener,noreferrer");
  //   } else {
  //     router.push(`/property/${data.id ?? 1}`);
  //   }
  // };

  const handleVisitRequest = () => {window.location.assign(PANEL_ORIGIN+'/visits?property='+data.id)};

  if (appearance === "showcase") return <>
    <article className={showcase.card}>
      <div className={showcase.cover}>
        <button type="button" className={showcase.imageLink} onClick={handleDetails} aria-label={`جزئیات ${data.propertyType} در ${Array.isArray(data.neighborhood) ? data.neighborhood.join("، ") : data.neighborhood}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={coverImage ?? "/images/properties/hero.webp"} alt={`${data.propertyType} در ${data.city}`} />
        </button>
        <span className={`${showcase.badge} ${data.contractType === "پیش‌فروش" ? showcase.presale : data.contractType === "رهن و اجاره" ? showcase.rent : ""}`}>{data.contractType === "رهن و اجاره" ? "اجاره" : data.contractType}</span>
        <button type="button" className={showcase.favorite} onClick={handleBookmarkClick} aria-label={bookmarked ? "حذف از علاقه‌مندی‌ها" : "افزودن به علاقه‌مندی‌ها"} aria-pressed={bookmarked}>{bookmarked ? <FavoriteRoundedIcon /> : <FavoriteBorderRoundedIcon />}</button>
      </div>
      <div className={showcase.body}>
        <button type="button" className={showcase.title} onClick={handleDetails}>{data.propertyType} {data.buildYear ? "نوساز " : ""}در {Array.isArray(data.neighborhood) ? data.neighborhood.join("، ") : data.neighborhood}</button>
        <p className={showcase.location}><LocationOnRoundedIcon />{data.city}، {Array.isArray(data.neighborhood) ? data.neighborhood.join("، ") : data.neighborhood}</p>
        <div className={showcase.metrics}><span><BedOutlinedIcon />{formatNumber(data.roomCount)} خواب</span><span><SquareFootRoundedIcon />{getDisplayArea(data)}</span></div>
        <div className={showcase.footer}>
          <button type="button" onClick={handleDetails} className={showcase.price}>{price.value} <span>تومان</span>{data.monthlyRent > 0 && <small> / {formatNumber(data.monthlyRent)} ماهانه</small>}</button>
          <div className={showcase.advisor}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/profile.webp" alt={personName} title={personName} />
            <details className={showcase.more}><summary aria-label="عملیات ملک"><MoreHorizRoundedIcon /></summary><div className={showcase.menu}><button type="button" onClick={handleDetails}>مشاهده جزئیات</button><button type="button" onClick={handleViewProperty}>تور مجازی ملک</button><button type="button" onClick={handleVisitRequest}>ثبت درخواست بازدید</button></div></details>
          </div>
        </div>
      </div>
    </article>
    <VisitRequestModal key={visitModalOpen ? "open" : "closed"} open={visitModalOpen} onClose={() => setVisitModalOpen(false)} property={data} onSubmit={async () => { window.location.assign(PANEL_ORIGIN+'/visits?property='+data.id); }} />
    <VirtualTourModal open={virtualTourModalOpen} onClose={() => setVirtualTourModalOpen(false)} links={data.virtualTourUrl} />
  </>;

  return (
    <>
      <Card
        elevation={0}
        sx={{
          width: "100%",
          maxWidth: 360,
          borderRadius: "12px",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          bgcolor: "background.default",
          border: "1px solid #eef0f4",
          boxShadow: "0 4px 20px rgba(20, 30, 60, 0.06)",
          transition: "box-shadow 0.3s ease, transform 0.3s ease",
          "&:hover": {
            boxShadow: "0 12px 28px rgba(20,68,147,0.14)",
            transform: "translateY(-3px)",
          },
        }}
      >
        {/* تصویر و بج‌ها */}
        <Box
          sx={{
            position: "relative",
            height: 200,
            width: "100%",
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
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
              src={coverImage ?? "/images/placeholder.jpg"}
              alt={data.propertyType || "ملک"}
              sx={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                transition: "transform 0.5s ease",
                ".MuiCard-root:hover &": { transform: "scale(1.05)" },
              }}
            />
          ) : (
            <Stack
              spacing={1}
              sx={{
                alignItems: "center",
                justifyContent: "center",
                color: "primary.main",
                p: 2,
                textAlign: "center",
              }}
            >
              {getPropertyTypeIcon(data.propertyType, {
                sx: { fontSize: 64, opacity: 0.85 },
              })}
              <Typography
                variant="caption"
                sx={{ fontWeight: 700, color: "text.secondary", fontSize: 13 }}
              >
                {data.propertyType || "درخواست ملک"}
              </Typography>
            </Stack>
          )}

          <Stack
            direction="row"
            spacing={1}
            sx={{ position: "absolute", top: 12, left: 12, zIndex: 1 }}
          >
            {badgeLabel && (
              <Chip
                size="small"
                label={badgeLabel}
                sx={{
                  bgcolor: "warning.main",
                  color: "warning.contrastText",
                  fontWeight: 700,
                  fontSize: 11,
                }}
              />
            )}
            {data.contractType && (
              <Chip
                size="small"
                label={data.contractType}
                sx={{
                  bgcolor: alpha("#FFFFFF", 0.9),
                  backdropFilter: "blur(4px)",
                  color: "primary.dark",
                  fontWeight: 700,
                  fontSize: 11,
                }}
              />
            )}
          </Stack>

          <IconButton
            onClick={handleBookmarkClick}
            aria-label="نشان کردن ملک"
            size="small"
            sx={{
              position: "absolute",
              top: 10,
              right: 10,
              zIndex: 1,
              bgcolor: alpha("#FFFFFF", 0.85),
              backdropFilter: "blur(4px)",
              color: bookmarked ? "primary.main" : "text.secondary",
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
                bottom: 10,
                right: 10,
                px: 1,
                py: 0.3,
                borderRadius: "6px",
                bgcolor: alpha("#000000", 0.65),
                color: "#FFFFFF",
                gap: 0.5,
                backdropFilter: "blur(2px)",
              }}
            >
              <PhotoCameraRoundedIcon sx={{ fontSize: 13 }} />
              <Typography
                variant="caption"
                sx={{ fontSize: 11, fontWeight: 600 }}
              >
                {formatNumber(data.images!.length)}
              </Typography>
            </Stack>
          )}
        </Box>

        {/* محتوای اصلی کارت */}
        <CardContent
          sx={{
            p: 2,
            display: "flex",
            flexDirection: "column",
            gap: 1.25,
            flex: 1,
          }}
        >
          {/* موقعیت و عنوان */}
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
            }}
          >
            <Stack
              direction="row"
              spacing={0.5}
              sx={{ color: "text.muted", mb: 0.5, alignItems: "center" }}
            >
              <LocationOnRoundedIcon
                sx={{ fontSize: 18, color: "primary.main" }}
              />
              <Typography variant="caption" sx={{ fontSize: 12 }}>
                {getFormattedLocation(data)}
              </Typography>
            </Stack>
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 700,
                color: "text.title",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                width: "100%",
              }}
            >
              {`${data.propertyType} ${
                data.contractType ? `- ${data.contractType}` : ""
              }`}
            </Typography>
          </Box>

          {/* متریک‌ها */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 0.5,
              bgcolor: "#F1F5F9",
              borderRadius: "8px",
              p: 1,
              textAlign: "center",
            }}
          >
            <Metric label="متراژ" value={getDisplayArea(data)} />
            <Metric
              label="اتاق"
              value={
                data.roomCount
                  ? `${formatNumber(data.roomCount)} خواب`
                  : "نامشخص"
              }
            />
            <Metric
              label="طبقه"
              value={data.totalFloor ? formatNumber(data.totalFloor) : "نامشخص"}
            />
          </Box>

          {/* قیمت */}
          <Box
            sx={{
              pt: 1,
              borderTop: "1px solid",
              borderColor: "background.border",
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
            }}
          >
            <Typography
              variant="caption"
              sx={{ color: "text.muted", fontSize: 12 }}
            >
              {price.label}
            </Typography>
            <Stack
              direction="row"
              sx={{
                alignItems: "baseline",
                justifyContent: "space-between",
                width: "100%",
              }}
            >
              <Typography
                variant="h6"
                sx={{ fontWeight: 800, color: "primary.main" }}
              >
                {price.value}
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: "text.secondary", fontWeight: 600 }}
              >
                تومان
              </Typography>
            </Stack>
          </Box>

          {/* اطلاعات متقاضی (درخواست) */}
          {(data.requesterName || data.requesterPhone) && (
            <Stack
              spacing={0.5}
              sx={{
                p: 1,
                borderRadius: "8px",
                bgcolor: alpha("#1976d2", 0.05),
              }}
            >
              {data.requesterName && (
                <InfoRow
                  icon={
                    <PersonOutlineRoundedIcon
                      sx={{ fontSize: 15, color: "primary.main" }}
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
                      sx={{ fontSize: 15, color: "primary.main" }}
                    />
                  }
                  label="تماس:"
                  value={data.requesterPhone}
                  ltr
                />
              )}
            </Stack>
          )}

          <Divider sx={{ borderColor: "background.border", my: 0.5 }} />

          {/* نام مشاور / تایید */}
          <Stack
            direction="row"
            sx={{
              alignItems: "center",
              justifyContent: "space-between",
              gap: 1,
            }}
          >
            <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
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
                sx={{
                  color: "text.secondary",
                  fontSize: 12,
                  fontWeight: 600,
                  maxWidth: 180,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {personName}
              </Typography>
            </Stack>

            {mode === "request" && (
              <Chip
                size="small"
                label="درخواست"
                sx={{
                  height: 20,
                  fontSize: 10,
                  fontWeight: 700,
                  bgcolor: alpha("#1976d2", 0.1),
                  color: "primary.main",
                }}
              />
            )}
          </Stack>

          {/* دکمه‌ها */}
          <Stack spacing={1} sx={{ mt: 0.5 }}>
            <Button
              fullWidth
              onClick={handleDetails}
              variant="contained"
              startIcon={<VisibilityRoundedIcon sx={{ fontSize: 18 }} />}
              sx={{
                borderRadius: "10px",
                fontWeight: 700,
                fontSize: 13,
                py: 1,
                boxShadow: "0 4px 12px rgba(25,118,210,0.25)",
                transition: "all 0.2s ease",
                "&:hover": {
                  boxShadow: "0 6px 16px rgba(25,118,210,0.35)",
                  transform: "translateY(-1px)",
                },
              }}
            >
              مشاهده جزئیات
            </Button>

            <Stack direction="row" spacing={1}>
              {mode === "file" ? (
                <>
                  <Button
                    fullWidth
                    onClick={handleViewProperty}
                    variant="outlined"
                    startIcon={<TourRoundedIcon sx={{ fontSize: 16 }} />}
                    sx={{
                      borderRadius: "10px",
                      fontWeight: 700,
                      fontSize: 12,
                      py: 0.9,
                      borderColor: alpha("#1976d2", 0.4),
                      color: "primary.main",
                      "&:hover": {
                        borderColor: "primary.main",
                        bgcolor: alpha("#1976d2", 0.06),
                      },
                    }}
                  >
                    مشاهده ملک
                  </Button>
                  <Button
                    fullWidth
                    onClick={handleVisitRequest}
                    variant="outlined"
                    color="success"
                    startIcon={
                      <EventAvailableRoundedIcon sx={{ fontSize: 16 }} />
                    }
                    sx={{
                      borderRadius: "10px",
                      fontWeight: 700,
                      fontSize: 12,
                      py: 0.9,
                      borderColor: alpha("#10B981", 0.5),
                      color: "#059669",
                      "&:hover": {
                        borderColor: "#10B981",
                        bgcolor: alpha("#10B981", 0.08),
                      },
                    }}
                  >
                    ثبت بازدید
                  </Button>
                </>
              ) : (
                <Button
                  fullWidth
                  onClick={() => window.location.assign(PANEL_LINKS.createFile)}
                  variant="outlined"
                  color="secondary"
                  startIcon={<HandshakeRoundedIcon sx={{ fontSize: 16 }} />}
                  sx={{
                    borderRadius: "10px",
                    fontWeight: 700,
                    fontSize: 12,
                    py: 0.9,
                    borderColor: alpha("#9c27b0", 0.5),
                    color: "#7b1fa2",
                    "&:hover": {
                      borderColor: "#9c27b0",
                      bgcolor: alpha("#9c27b0", 0.08),
                    },
                  }}
                >
                  من دارم
                </Button>
              )}
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {/* مودال ثبت بازدید — با key برای ریست خودکار state */}
      <VisitRequestModal
        key={visitModalOpen ? "open" : "closed"}
        open={visitModalOpen}
        onClose={() => setVisitModalOpen(false)}
        property={data}
        onSubmit={async () => {
          // اینجا به API وصل کن
          window.location.assign(PANEL_ORIGIN+'/visits?property='+data.id);
        }}
      />
      <VirtualTourModal
        open={virtualTourModalOpen}
        onClose={() => setVirtualTourModalOpen(false)}
        links={data.virtualTourUrl}
      />
    </>
  );
}
