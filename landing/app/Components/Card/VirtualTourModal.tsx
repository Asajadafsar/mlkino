'use client';

import React from 'react';
import {
  Modal,
  Box,
  IconButton,
  Typography,
  Stack,
  Button,
} from '@mui/material';

import CloseIcon from '@mui/icons-material/Close';
import TelegramIcon from '@mui/icons-material/Telegram';
import InstagramIcon from '@mui/icons-material/Instagram';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';

type VirtualTourLinks = {
  telegram?: string;
  instagram?: string;
  eitaa?: string;
};

interface VirtualTourModalProps {
  open: boolean;
  onClose: () => void;
  links?: VirtualTourLinks;
}

// آیکون اختصاصی ایتا
const EitaaIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    width="24"
    height="24"
    viewBox="5.312 -.192 501.099 512.323"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="m127.317 510.763a141.312 141.312 0 0 1 -49.749-17.707c-34.56-19.819-60.352-55.317-68.629-94.421-3.221-15.296-3.627-34.624-3.2-153.749.405-128.193.106-121.579 6.208-142.699 3.029-10.517 11.456-28.587 17.557-37.696 22.507-33.494 55.616-54.998 96.64-62.784 8.192-1.557 20.053-1.707 129.195-1.707 133.355 0 128.96-.192 150.741 6.699a145.216 145.216 0 0 1 92.032 89.259c7.04 19.989 7.381 23.189 7.872 75.84l.427 47.573-8.341 5.717c-11.904 8.128-27.52 22.613-49.408 45.867-25.216 26.795-50.688 51.627-63.616 62.016-27.925 22.421-53.504 35.221-79.488 39.765-13.525 2.347-35.883 1.429-49.109-2.027-11.797-3.072-11.029-3.584-15.488 9.899a135.573 135.573 0 0 0 -6.784 32.981l-.661 8.683-3.115-.64c-25.92-5.141-51.605-27.413-61.525-53.333a76.437 76.437 0 0 1 -5.547-26.005l-.341-7.253-6.592-6.059c-13.739-12.587-22.677-27.989-25.493-43.968-4.523-25.451 7.253-54.229 32.811-80.128 26.965-27.371 66.709-48.853 105.664-57.173 14.037-2.987 38.784-3.776 51.264-1.6 24.277 4.224 44.096 16.491 56.427 34.965 3.883 5.781 4.16 6.613 3.776 11.84a17.323 17.323 0 0 1 -3.904 10.517c-9.92 13.888-39.424 28.757-71.168 35.84-56 12.48-91.605-3.029-86.037-37.525.555-3.477.853-6.485.661-6.677-.683-.683-6.251 2.219-12.267 6.4-10.219 7.125-19.264 20.992-22.4 34.283-.768 3.328-1.067 8.661-.725 13.867.427 7.061 1.131 9.685 4.096 15.701 1.963 3.968 5.867 9.6 8.704 12.565l5.12 5.355-2.048 2.603a103.36 103.36 0 0 0 -14.443 25.963 77.547 77.547 0 0 0 -2.24 38.72c2.197 9.835 8.981 23.36 15.765 31.317 5.163 6.08 17.003 16.299 18.901 16.299.512 0 .939-1.024.939-2.261.021-4.907 3.925-20.757 6.955-28.309 9.024-22.571 28.821-41.813 60.16-58.453 5.227-2.773 20.309-10.027 33.536-16.149 29.013-13.44 44.864-21.653 53.568-27.84 25.088-17.771 40.597-44.053 45.653-77.333 1.835-12.16 1.835-34.859 0-47.083-7.851-52.011-46.827-87.381-102.784-93.227-62.4-6.549-141.824 41.664-190.763 115.776-23.808 36.053-39.893 76.053-46.656 116.117-2.624 15.531-3.605 44.373-1.984 58.667 4.117 36.352 17.536 65.664 40.597 88.661a139.328 139.328 0 0 0 39.893 28.011c50.517 24.107 106.453 24.64 155.627 1.515 21.248-10.005 42.112-25.515 64.491-48 21.76-21.867 36.48-40.107 76.629-95.104 22.187-30.357 39.765-50.517 48.469-55.573l3.2-1.835-.405 65.941c-.384 63.851-.469 66.283-2.624 75.968-12.8 57.131-54.187 98.901-110.827 111.829l-9.984 2.283-123.2.213c-100.992.171-124.8-.043-132.053-1.195z"
      fill="currentColor"
    />
  </svg>
);

const platforms = [
  {
    key: 'eitaa',
    title: 'ایتا',
    description: 'مشاهده تور در ایتا',
    icon: <EitaaIcon />,
    color: '#E37600',
    background: '#FFF4E5',
  },
  {
    key: 'telegram',
    title: 'تلگرام',
    description: 'مشاهده تور در تلگرام',
    icon: <TelegramIcon />,
    color: '#229ED9',
    background: '#E9F5FC',
  },
  {
    key: 'instagram',
    title: 'اینستاگرام',
    description: 'مشاهده تصاویر و ویدئوها',
    icon: <InstagramIcon />,
    color: '#D9468D',
    background: '#FCECF3',
  },
] as const;

function normalizeUrl(url: string): string {
  const trimmedUrl = url.trim();

  if (/^https?:\/\//i.test(trimmedUrl)) {
    return trimmedUrl;
  }

  return `https://${trimmedUrl}`;
}

export default function VirtualTourModal({
  open,
  onClose,
  links,
}: VirtualTourModalProps) {
  const handleOpenLink = (url?: string) => {
    if (!url?.trim()) return;

    window.open(normalizeUrl(url), '_blank', 'noopener,noreferrer');
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="virtual-tour-modal-title"
      aria-describedby="virtual-tour-modal-description"
    >
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: { xs: 'calc(100% - 32px)', sm: 420 },
          maxHeight: 'calc(100dvh - 32px)',
          overflowY: 'auto',
          bgcolor: 'background.paper',
          borderRadius: 4,
          outline: 'none',
          boxShadow: '0 24px 80px rgba(15, 23, 42, 0.22)',
        }}
      >
        {/* سربرگ */}
        <Box
          sx={{
            position: 'relative',
            px: 3,
            pt: 3.5,
            pb: 3,
            color: '#fff',
            textAlign: 'left',
            background:
              'linear-gradient(135deg, #1E293B 0%, #334155 100%)',
          }}
        >
          <IconButton
            onClick={onClose}
            aria-label="بستن"
            sx={{
              position: 'absolute',
              top: 12,
              right: 12,
              color: 'rgba(255,255,255,0.8)',
              '&:hover': {
                color: '#fff',
                bgcolor: 'rgba(255,255,255,0.12)',
              },
            }}
          >
            <CloseIcon />
          </IconButton>

          <Typography
            component="h2"
            id="virtual-tour-modal-title"
            variant="h5"
            sx={{
              mt: 3,
              fontWeight: 800,
            }}
          >
            مشاهده ملک
          </Typography>

          <Typography
            component="p"
            id="virtual-tour-modal-description"
            variant="body2"
            sx={{
              color: 'rgba(255,255,255,0.72)',
            }}
          >
            برای دیدن تور مجازی، یکی از پلتفرم‌ها را انتخاب کنید.
          </Typography>
        </Box>

        {/* فهرست پلتفرم‌ها */}
        <Stack spacing={1.25} sx={{ p: 2.5 }}>
          {platforms.map((platform) => {
            const url = links?.[platform.key];
            const isDisabled = !url?.trim();

            return (
              <Button
                key={platform.key}
                fullWidth
                disabled={isDisabled}
                onClick={() => handleOpenLink(url)}
                sx={{
                  justifyContent: 'flex-start',
                  gap: 1.5,
                  minHeight: 72,
                  px: 1.5,
                  py: 1.25,
                  border: '1px solid',
                  borderColor: isDisabled
                    ? 'divider'
                    : `${platform.color}30`,
                  borderRadius: 3,
                  color: 'text.primary',
                  textAlign: 'left',
                  transition: 'all 180ms ease',
                  '&:hover': {
                    borderColor: platform.color,
                    bgcolor: platform.background,
                    transform: 'translateY(-1px)',
                  },
                  '&.Mui-disabled': {
                    opacity: 0.48,
                  },
                }}
              >
                <Box
                  sx={{
                    display: 'grid',
                    placeItems: 'center',
                    flexShrink: 0,
                    width: 44,
                    height: 44,
                    borderRadius: 2.5,
                    color: platform.color,
                    bgcolor: platform.background,
                    '& svg': {
                      fontSize: 24,
                    },
                  }}
                >
                  {platform.icon}
                </Box>

                <Box
                  sx={{
                    flex: 1,
                    minWidth: 0,
                  }}
                >
                  <Typography
                    component="span"
                    sx={{
                      display: 'block',
                      fontWeight: 700,
                      fontSize: 14,
                    }}
                  >
                    {platform.title}
                  </Typography>

                  <Typography
                    component="span"
                    variant="caption"
                    color="text.secondary"
                    sx={{
                      display: 'block',
                      mt: 0.25,
                    }}
                  >
                    {isDisabled
                      ? 'لینکی ثبت نشده است'
                      : platform.description}
                  </Typography>
                </Box>

                {!isDisabled && (
                  <ArrowBackRoundedIcon
                    sx={{
                      color: 'text.disabled',
                      fontSize: 20,
                      flexShrink: 0,
                    }}
                  />
                )}
              </Button>
            );
          })}
        </Stack>
      </Box>
    </Modal>
  );
}