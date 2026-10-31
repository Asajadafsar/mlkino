import {
    Box,
    Grid,
    MenuItem,
    Select,
    SelectChangeEvent,
    Skeleton,
    Stack,
    Typography,
    useMediaQuery,
} from '@mui/material'
import { LineChart } from '@mui/x-charts/LineChart'
import { Dispatch, SetStateAction } from 'react'
import { FilterState } from './DashboardLayout'
import CsvExportButton from '../Logs/List/CsvExportButton'

const MONTHS = [
    { label: 'همه ماه‌ها', value: '' },
    { label: 'فروردین', value: '01' },
    { label: 'اردیبهشت', value: '02' },
    { label: 'خرداد', value: '03' },
    { label: 'تیر', value: '04' },
    { label: 'مرداد', value: '05' },
    { label: 'شهریور', value: '06' },
    { label: 'مهر', value: '07' },
    { label: 'آبان', value: '08' },
    { label: 'آذر', value: '09' },
    { label: 'دی', value: '10' },
    { label: 'بهمن', value: '11' },
    { label: 'اسفند', value: '12' },
]

const YEARS = Array.from({ length: 5 }, (_, i) => 1405 - i)

export interface BuySellChartData {
    month?: string
    day?: number
    buy: number
    sell: number
}

interface Props {
    data: BuySellChartData[]
    loading?: boolean
    filter: FilterState
    setFilter: Dispatch<SetStateAction<FilterState>>
}

type NormalizedPoint = {
    label: string | undefined
    buy: number
    sell: number
}

interface CustomMarkProps {
    x?: string | number
    y?: string | number
    color?: string
    dataIndex?: number
    normalizedData: NormalizedPoint[]
    seriesIndex: number
}

function CustomMark({
    x,
    y,
    color,
    dataIndex,
    normalizedData,
    seriesIndex,
}: CustomMarkProps) {
    const numX = Number(x)
    const numY = Number(y)

    if (x == null || y == null || dataIndex == null) return null

    const point = normalizedData[dataIndex]
    if (!point) return null

    const isTied = point.buy === point.sell

    if (isTied) {
        if (seriesIndex === 0) {
            return (
                <circle
                    cx={numX}
                    cy={numY}
                    r={9}
                    fill="none"
                    stroke="#4CAF50"
                    strokeWidth={2.5}
                />
            )
        }
        return (
            <circle
                cx={numX}
                cy={numY}
                r={4.5}
                fill="none"
                stroke="#F44336"
                strokeWidth={2.5}
            />
        )
    }

    return (
        <circle
            cx={numX}
            cy={numY}
            r={4.5}
            fill="none"
            stroke={color}
            strokeWidth={2.5}
        />
    )
}

const valueFormatter = (value: number | null) => {
    if (value == null) return ''
    return (
        new Intl.NumberFormat('fa-IR', {
            useGrouping: true,
        }).format(value) + ' تومان'
    )
}

export default function BuySellChart({
    data,
    loading,
    filter,
    setFilter,
}: Props) {
    const mdScreen = useMediaQuery('(min-width:900px)')
    const smScreen = useMediaQuery('(min-width:600px)')

    const chartHeight = mdScreen ? 450 : smScreen ? 350 : 280

    const isDailyData = filter.month !== ''

    const normalizedData: NormalizedPoint[] = data.map((item) => ({
        label: isDailyData ? String(item.day) : item.month,
        buy: item.buy,
        sell: item.sell,
    }))

    const title = isDailyData
        ? 'نمودار خرید و فروش روزانه'
        : 'نمودار خرید و فروش ماهانه'

    const handleYearChange = (e: SelectChangeEvent<number>) => {
        setFilter({ ...filter, year: Number(e.target.value) })
    }

    const handleMonthChange = (e: SelectChangeEvent<string>) => {
        setFilter({ ...filter, month: e.target.value })
    }

    return (
        <Grid item xs={12}>
            <Stack
                bgcolor="background.main"
                borderRadius={3}
                px={{ xs: 2, sm: 3 }}
                py={3}
                width="100%"
            >
          <Stack
  direction={{ xs: 'column', sm: 'row' }}
  alignItems={{ xs: 'flex-start', sm: 'center' }}
  justifyContent="space-between"
  gap={2}
  mb={5}
>
  {/* Title + Filters */}
  <Stack
    direction={{ xs: 'column', sm: 'row' }}
    alignItems={{ xs: 'flex-start', sm: 'center' }}
    gap={2}
    flex={1}
  >
    {loading ? (
      <Skeleton variant="text" width={220} height={30} />
    ) : (
      <Typography
        variant="h6"
        sx={{ fontSize: '17px !important', fontWeight: 'bold' }}
      >
        {title}
      </Typography>
    )}

    <Stack direction="row" gap={1.5} flexWrap="wrap">
      {loading ? (
        <>
          <Skeleton variant="rectangular" width={110} height={40} sx={{ borderRadius: 1 }} />
          <Skeleton variant="rectangular" width={150} height={40} sx={{ borderRadius: 1 }} />
        </>
      ) : (
        <>
          <Select
            size="small"
            value={filter.year}
            onChange={handleYearChange}
            sx={{ minWidth: 110 }}
          >
            {YEARS.map((year) => (
              <MenuItem key={year} value={year}>
                {year}
              </MenuItem>
            ))}
          </Select>

          <Select
            size="small"
            value={filter.month}
            onChange={handleMonthChange}
            sx={{ minWidth: 150 }}
            displayEmpty
          >
            {MONTHS.map((month) => (
              <MenuItem key={month.value} value={month.value}>
                {month.label}
              </MenuItem>
            ))}
          </Select>
        </>
      )}
    </Stack>
  </Stack>

  {/* CSV Button */}
  <CsvExportButton
    exportType="chart"
    data={(data as any) || []}
    fileName="chart.csv"
  />
</Stack>
                {loading ? (
                    <Skeleton
                        animation="wave"
                        variant="rectangular"
                        width="100%"
                        height={chartHeight}
                        sx={{ borderRadius: 2 }}
                    />
                ) : (
                    <Box sx={{ overflowX: 'auto', width: '100%' }}>
                        <Box sx={{ minWidth: isDailyData ? '900px' : '700px' }}>
                            <LineChart
                                dataset={normalizedData}
                                xAxis={[
                                    {
                                        scaleType: 'point',
                                        dataKey: 'label',
                                    },
                                ]}
                                series={[
                                    {
                                        dataKey: 'buy',
                                        label: 'خرید',
                                        showMark: true,
                                        valueFormatter,
                                    },
                                    {
                                        dataKey: 'sell',
                                        label: 'فروش',
                                        showMark: true,
                                        valueFormatter,
                                    },
                                ]}
                                colors={['#4CAF50', '#F44336']}
                                grid={{
                                    horizontal: true,
                                    vertical: false,
                                }}
                                margin={{
                                    top: 20,
                                    right: 30,
                                    bottom: 30,
                                    left: 120,
                                }}
                                height={chartHeight}
                                slots={{
                                    mark: (props) => {
                                        const seriesIndex =
                                            props.color === '#4CAF50' ? 0 : 1
                                        return (
                                            <CustomMark
                                                {...props}
                                                normalizedData={normalizedData}
                                                seriesIndex={seriesIndex}
                                            />
                                        )
                                    },
                                }}
                            />
                        </Box>
                    </Box>
                )}
            </Stack>
        </Grid>
    )
}