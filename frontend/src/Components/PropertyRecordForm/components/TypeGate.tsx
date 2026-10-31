import {keyframes} from '@emotion/react'
import {Box, Paper, Stack, Typography} from '@mui/material'
import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import SellRoundedIcon from '@mui/icons-material/SellRounded'
import VpnKeyRoundedIcon from '@mui/icons-material/VpnKeyRounded'

const GATE_OPTIONS = [
    {value: 'فروش', title: 'فروش', Icon: SellRoundedIcon},
    {value: 'رهن و اجاره', title: 'رهن و اجاره', Icon: VpnKeyRoundedIcon},
] as const

const fadeInUp = keyframes`
    from {
        opacity: 0;
        transform: translateY(14px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
`

const pulseGlow = keyframes`
    0% {
        box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.35);
    }
    70% {
        box-shadow: 0 0 0 10px rgba(255, 255, 255, 0);
    }
    100% {
        box-shadow: 0 0 0 0 rgba(255, 255, 255, 0);
    }
`

const popIn = keyframes`
    0% {
        opacity: 0;
        transform: scale(0.3);
    }
    60% {
        opacity: 1;
        transform: scale(1.25);
    }
    100% {
        transform: scale(1);
    }
`

export function TypeGate({
    value,
    title,
    onSelect,
}: {
    value: string
    title: string
    onSelect: (value: string) => void
}) {
    return (
        <Stack spacing={4} alignItems="center" sx={{py: {xs: 4, sm: 7}}}>
            <Typography
                variant="h6"
                fontWeight={700}
                sx={{animation: `${fadeInUp} .45s ease both`}}
            >
                {title}
            </Typography>

            <Stack
                direction={{xs: 'column', sm: 'row'}}
                spacing={2.5}
                sx={{width: '100%', maxWidth: 520}}
            >
                {GATE_OPTIONS.map(({value: optionValue, title: optionTitle, Icon}, index) => {
                    const isSelected = value === optionValue

                    return (
                        <Paper
                            key={optionValue}
                            onClick={() => onSelect(optionValue)}
                            elevation={0}
                            sx={{
                                position: 'relative',
                                flex: 1,
                                cursor: 'pointer',
                                userSelect: 'none',
                                textAlign: 'center',
                                py: 5,
                                px: 3,
                                overflow: 'hidden',
                                borderRadius: 3,
                                border: '2px solid',
                                borderColor: isSelected ? 'primary.main' : 'divider',
                                backgroundColor: isSelected ? 'primary.main' : 'background.paper',
                                color: isSelected ? 'primary.contrastText' : 'text.primary',
                                boxShadow: isSelected ? 6 : 0,
                                animation: `${fadeInUp} .45s ease both`,
                                animationDelay: `${index * 90}ms`,
                                transition:
                                    'transform .2s ease, box-shadow .2s ease, border-color .2s ease, background-color .2s ease',

                                '&:hover': {
                                    borderColor: 'primary.main',
                                    transform: 'translateY(-6px) scale(1.02)',
                                    boxShadow: 8,
                                },

                                '&:active': {
                                    transform: 'translateY(-2px) scale(0.99)',
                                },
                            }}
                        >
                            {isSelected && (
                                <Box
                                    sx={{
                                        position: 'absolute',
                                        top: 10,
                                        insetInlineEnd: 10,
                                        width: 22,
                                        height: 22,
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        backgroundColor: 'rgba(255,255,255,0.22)',
                                        animation: `${popIn} .35s cubic-bezier(.34,1.56,.64,1)`,
                                    }}
                                >
                                    <CheckRoundedIcon sx={{fontSize: 16}} />
                                </Box>
                            )}

                            <Box
                                sx={{
                                    width: 64,
                                    height: 64,
                                    mx: 'auto',
                                    mb: 2,
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backgroundColor: isSelected
                                        ? 'rgba(255,255,255,0.18)'
                                        : 'action.hover',
                                    transition: 'transform .2s ease',
                                    animation: isSelected ? `${pulseGlow} 1.6s ease-out 1` : 'none',

                                    '.MuiPaper-root:hover &': {
                                        transform: 'scale(1.08) rotate(-4deg)',
                                    },
                                }}
                            >
                                <Icon
                                    sx={{
                                        fontSize: 32,
                                        color: isSelected ? 'inherit' : 'primary.main',
                                    }}
                                />
                            </Box>

                            <Typography variant="subtitle1" fontWeight={700}>
                                {optionTitle}
                            </Typography>
                        </Paper>
                    )
                })}
            </Stack>
        </Stack>
    )
}
