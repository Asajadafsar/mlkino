import React, {useEffect, useState} from 'react'
import {Box, Container, Typography, ButtonBase, useTheme, alpha} from '@mui/material'
import {useNavigate} from 'react-router-dom'

// ---------------------------------------------------------------------------
// Global keyframes
// ---------------------------------------------------------------------------
const GLOBAL_CSS = `
@keyframes floatBlobA {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(-24px, 18px) scale(1.06); }
}
@keyframes floatBlobB {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(20px, -16px) scale(1.08); }
}
@keyframes lineGrow {
  from { transform: scaleX(0); opacity: 0; }
  to { transform: scaleX(1); opacity: 1; }
}
@keyframes keyTurn {
  0%   { transform: rotate(0deg); }
  35%  { transform: rotate(-22deg); }
  60%  { transform: rotate(10deg); }
  80%  { transform: rotate(-5deg); }
  100% { transform: rotate(0deg); }
}
@keyframes doorSwing {
  0%   { transform: rotate(0deg); }
  100% { transform: rotate(-32deg); }
}
@keyframes sheen {
  0%   { transform: translateX(-130%) skewX(-12deg); }
  100% { transform: translateX(230%) skewX(-12deg); }
}
@keyframes ping {
  0%   { transform: scale(0.6); opacity: .5; }
  70%  { transform: scale(1.9); opacity: 0; }
  100% { transform: scale(1.9); opacity: 0; }
}

.card-shell {
  position: relative;
  transition: transform .45s cubic-bezier(.22,1,.36,1), box-shadow .45s cubic-bezier(.22,1,.36,1), border-color .45s ease;
}

.card-shell:hover {
  transform: translateY(-10px);
}

.card-shell .sheen {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  border-radius: inherit;
}

.card-shell .sheen::after {
  content: "";
  position: absolute;
  top: -40%;
  bottom: -40%;
  left: 0;
  width: 35%;
  background: linear-gradient(75deg, transparent, rgba(255,255,255,0.55), transparent);
  transform: translateX(-130%) skewX(-12deg);
}

.card-shell:hover .sheen::after {
  animation: sheen 1s ease forwards;
}

.icon-key-group {
  transform-origin: 32px 34px;
}

.card-shell.landlord:hover .icon-key-group {
  animation: keyTurn .85s cubic-bezier(.22,1,.36,1);
}

.icon-door {
  transform-origin: 41px 63px;
}

.card-shell.tenant:hover .icon-door {
  animation: doorSwing .55s cubic-bezier(.22,1,.36,1) forwards;
}

.icon-glow {
  opacity: 0;
  transition: opacity .5s ease;
}

.card-shell.tenant:hover .icon-glow {
  opacity: 1;
}

.pulse-ring {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  border: 1px solid currentColor;
  opacity: 0;
}

.card-shell:hover .pulse-ring {
  animation: ping 1.1s cubic-bezier(.2,.7,.3,1);
}
`

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------
function KeyIcon({color}: {color: string}) {
    return (
        <Box
            component="svg"
            viewBox="0 0 100 100"
            sx={{
                width: 48,
                height: 48,
                color,
                overflow: 'visible',
                display: 'block',
            }}
        >
            <g className="icon-key-group">
                <circle
                    cx="32"
                    cy="34"
                    r="13"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="6.5"
                />
                <line
                    x1="44.5"
                    y1="34"
                    x2="82"
                    y2="34"
                    stroke="currentColor"
                    strokeWidth="6"
                    strokeLinecap="round"
                />
                <line
                    x1="66"
                    y1="34"
                    x2="66"
                    y2="47"
                    stroke="currentColor"
                    strokeWidth="6"
                    strokeLinecap="round"
                />
                <line
                    x1="77"
                    y1="34"
                    x2="77"
                    y2="44"
                    stroke="currentColor"
                    strokeWidth="6"
                    strokeLinecap="round"
                />
            </g>
        </Box>
    )
}

function HouseIcon({color, glow = color}: {color: string; glow?: string}) {
    return (
        <Box
            component="svg"
            viewBox="0 0 100 100"
            sx={{
                width: 48,
                height: 48,
                color,
                overflow: 'visible',
                display: 'block',
            }}
        >
            <path
                d="M10 48 L50 14 L90 48"
                fill="none"
                stroke="currentColor"
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <rect
                x="20"
                y="48"
                width="60"
                height="42"
                rx="3"
                fill="none"
                stroke="currentColor"
                strokeWidth="6"
            />
            <rect className="icon-glow" x="43" y="65" width="16" height="23" rx="1" fill={glow} />
            <rect
                className="icon-door"
                x="41"
                y="63"
                width="20"
                height="27"
                rx="1"
                fill="none"
                stroke="currentColor"
                strokeWidth="5"
            />
            <circle cx="56" cy="77" r="1.7" fill="currentColor" />
        </Box>
    )
}

type Role = 'landlord' | 'tenant'

// ---------------------------------------------------------------------------
// Role card
// ---------------------------------------------------------------------------
function RoleCard({
    role,
    title,
    description,
    accent,
    accentSoft,
    Icon,
    mounted,
    delay,
    onSelect,
}: {
    role: Role
    title: string
    description: string
    accent: string
    accentSoft: string
    Icon: (props: {color: string; glow?: string}) => React.ReactElement
    mounted: boolean
    delay: number
    onSelect: () => void
}) {
    const theme = useTheme()

    return (
        <ButtonBase
            onClick={onSelect}
            className={`card-shell ${role}`}
            sx={{
                width: {xs: '100%', sm: 260},
                borderRadius: '20px',
                p: {xs: 3.5, sm: 4},
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
                bgcolor: 'background.paper',
                border: `1px solid ${theme.palette.divider}`,
                color: accent,
                opacity: mounted ? 1 : 0,
                transform: mounted ? 'translateY(0) scale(1)' : 'translateY(22px) scale(.95)',
                transition: `opacity .6s cubic-bezier(.22,1,.36,1) ${delay}ms, transform .6s cubic-bezier(.22,1,.36,1) ${delay}ms, box-shadow .45s ease, border-color .45s ease`,
                '&:hover': {
                    borderColor: accent,
                    boxShadow: `0 20px 40px -18px ${alpha(
                        accent,
                        0.35,
                    )}, 0 0 0 1px ${alpha(accent, 0.15)}`,
                },
            }}
        >
            <span className="pulse-ring" style={{color: accent}} />

            <span className="sheen" />

            <Box
                sx={{
                    width: 78,
                    height: 78,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: alpha(accent, 0.1),
                }}
            >
                <Icon color={accent} glow={accentSoft} />
            </Box>

            <Typography
                variant="titleLg"
                sx={{
                    color: 'text.primary',
                    fontWeight: 700,
                }}
            >
                {title}
            </Typography>

            <Typography
                variant="bodySm"
                sx={{
                    color: 'text.secondary',
                    lineHeight: 1.9,
                }}
            >
                {description}
            </Typography>
        </ButtonBase>
    )
}

function RoleSelectContent() {
    const theme = useTheme()
    const navigate = useNavigate()

    const [mounted, setMounted] = useState(false)
    const [lineReady, setLineReady] = useState(false)

    useEffect(() => {
        const t1 = setTimeout(() => setLineReady(true), 120)
        const t2 = setTimeout(() => setMounted(true), 380)

        return () => {
            clearTimeout(t1)
            clearTimeout(t2)
        }
    }, [])

    return (
        <Box
            dir="rtl"
            sx={{
                minHeight: '100vh',
                bgcolor: 'background.default',
                position: 'relative',
                overflow: 'hidden',
                borderRadius: '15px',
            }}
        >
            <style>{GLOBAL_CSS}</style>

            <Box
                sx={{
                    position: 'absolute',
                    width: 420,
                    height: 420,
                    borderRadius: '50%',
                    top: -120,
                    right: -100,
                    background: `radial-gradient(circle, ${alpha(
                        theme.palette.primary.main,
                        0.14,
                    )}, transparent 70%)`,
                    animation: 'floatBlobA 14s ease-in-out infinite',
                    pointerEvents: 'none',
                }}
            />

            <Box
                sx={{
                    position: 'absolute',
                    width: 380,
                    height: 380,
                    borderRadius: '50%',
                    bottom: -140,
                    left: -100,
                    background: `radial-gradient(circle, ${alpha(
                        theme.palette.secondary.main,
                        0.16,
                    )}, transparent 70%)`,
                    animation: 'floatBlobB 16s ease-in-out infinite',
                    pointerEvents: 'none',
                }}
            />

            <Box
                sx={{
                    position: 'relative',
                    zIndex: 1,
                }}
            >
                <Container
                    maxWidth="md"
                    sx={{
                        minHeight: '100vh',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        py: 8,
                        textAlign: 'center',
                    }}
                >
                    <Typography
                        variant="headLineMd"
                        sx={{
                            color: 'text.primary',
                            fontWeight: 800,
                            mb: 1.5,
                        }}
                    >
                        شما موجر هستید یا مستاجر؟
                    </Typography>

                    <Box
                        sx={{
                            width: 64,
                            height: 3,
                            borderRadius: 2,
                            background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                            transform: lineReady ? 'scaleX(1)' : 'scaleX(0)',
                            transition: 'transform .7s cubic-bezier(.22,1,.36,1)',
                            mb: 2,
                        }}
                    />

                    <Typography
                        variant="bodyMd"
                        sx={{
                            color: 'text.secondary',
                            mb: 6,
                        }}
                    >
                        برای ادامه یکی از گزینه‌ها رو انتخاب کنید
                    </Typography>

                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: {
                                xs: 'column',
                                sm: 'row',
                            },
                            gap: {
                                xs: 3,
                                sm: 4,
                            },
                            alignItems: 'stretch',
                            justifyContent: 'center',
                            width: '100%',
                        }}
                    >
                        <RoleCard
                            role="landlord"
                            title="موجر"
                            description="می‌خوام ملکم رو اجاره بدم"
                            accent={theme.palette.primary.main}
                            accentSoft={theme.palette.primary.light}
                            Icon={KeyIcon}
                            mounted={mounted}
                            delay={0}
                            onSelect={() => navigate('/landlord-tenant/lessors')}
                        />

                        <RoleCard
                            role="tenant"
                            title="مستاجر"
                            description="دنبال یه ملک برای اجاره‌ام"
                            accent={theme.palette.secondary.main}
                            accentSoft={theme.palette.secondary.light}
                            Icon={HouseIcon}
                            mounted={mounted}
                            delay={130}
                            onSelect={() => navigate('/landlord-tenant/tenants')}
                        />
                    </Box>
                </Container>
            </Box>
        </Box>
    )
}

export default function RoleSelectPage() {
    return <RoleSelectContent />
}
