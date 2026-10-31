import {Box, Grid, Stack, Typography} from '@mui/material'
import {PieChart} from '@mui/x-charts/PieChart'
import {useTheme} from '@mui/material/styles'

interface ServerResources {
    cpu: number // فقط درصد
    ram: {
        total_gb: number
        used_gb: number
        free_gb: number
        percent: number
    }
    disk: {
        total_gb: number
        used_gb: number
        free_gb: number
        percent: number
    }
}

interface Props {
    data: ServerResources
}

const RESOURCE_CONFIG = [
    {key: 'cpu' as const, label: 'CPU', unit: '%', total: 100},
    {key: 'ram' as const, label: 'RAM', unit: 'GB'},
    {key: 'disk' as const, label: 'Disk', unit: 'GB'},
]

export default function ServerResourceCharts({data}: Props) {
    const theme = useTheme()

    const colors = [
        theme.palette.primary.main,
        theme.palette.success.main,
        theme.palette.error.main,
    ]

    const getResourceData = (key: 'cpu' | 'ram' | 'disk') => {
        if (key === 'cpu') {
            const total = 100
            const used = data.cpu || 0
            return {
                used,
                total,
                free: Math.max(0, total - used),
                percent: used
            }
        }
        
        if (key === 'ram') {
            return {
                used: data.ram.used_gb,
                total: data.ram.total_gb,
                free: data.ram.free_gb,
                percent: data.ram.percent
            }
        }
        
        // disk
        return {
            used: data.disk.used_gb,
            total: data.disk.total_gb,
            free: data.disk.free_gb,
            percent: data.disk.percent
        }
    }

    return (
        <Grid container spacing={2}>
            {RESOURCE_CONFIG.map((resource, index) => {
                const {used, total, free, percent} = getResourceData(resource.key)
                const displayPercent = percent.toFixed(1)

                return (
                    <Grid item xs={12} sm={4} key={resource.key}>
                        <Stack
                            bgcolor="background.paper"
                            borderRadius={3}
                            px={3}
                            py={3}
                            alignItems="center"
                            gap={1}
                            sx={{
                                boxShadow: theme.shadows[1],
                                height: '100%',
                            }}
                        >
                            <Typography
                                variant="subtitle2"
                                sx={{
                                    fontWeight: 'bold',
                                    letterSpacing: '0.06em',
                                    color: 'text.secondary',
                                    textTransform: 'uppercase',
                                }}
                            >
                                {resource.label}
                            </Typography>

                            <Box sx={{position: 'relative', width: 150, height: 150}}>
                                <PieChart
                                    width={150}
                                    height={150}
                                    series={[
                                        {
                                            data: [
                                                {
                                                    id: 'used',
                                                    value: used,
                                                    label: 'استفاده شده',
                                                    color: colors[index],
                                                },
                                                {
                                                    id: 'free',
                                                    value: free,
                                                    label: 'آزاد',
                                                    color: theme.palette.action.hover,
                                                },
                                            ],
                                            innerRadius: 52,
                                            outerRadius: 70,
                                            paddingAngle: 2,
                                            cornerRadius: 4,
                                        },
                                    ]}
                                    slotProps={{legend: {hidden: true}}}
                                    margin={{top: 0, bottom: 0, left: 0, right: 0}}
                                />

                                <Stack
                                    sx={{
                                        position: 'absolute',
                                        top: '50%',
                                        left: '50%',
                                        transform: 'translate(-50%, -50%)',
                                        alignItems: 'center',
                                        pointerEvents: 'none',
                                    }}
                                >
                                    <Typography variant="h6" sx={{fontWeight: 'bold', lineHeight: 1}}>
                                        {used}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {resource.unit}
                                    </Typography>
                                </Stack>
                            </Box>

                            <Typography variant="body2" color="text.secondary">
                                {displayPercent}٪ از {total} {resource.unit}
                            </Typography>
                        </Stack>
                    </Grid>
                )
            })}
        </Grid>
    )
}