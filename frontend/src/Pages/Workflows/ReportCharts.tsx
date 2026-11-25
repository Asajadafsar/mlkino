import {ReactNode} from 'react'
import {BarChart} from '@mui/x-charts/BarChart'
import {LineChart} from '@mui/x-charts/LineChart'
import {PieChart} from '@mui/x-charts/PieChart'
import BarChartRoundedIcon from '@mui/icons-material/BarChartRounded'
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded'
import DonutSmallRoundedIcon from '@mui/icons-material/DonutSmallRounded'
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined'
import {dateTime, persianNumber} from './workflowClient'
import {ReportData, ReportGroup, reportLabel} from './reportPresentation'
const palette = ['#3477ff', '#ffab35', '#9b6af3', '#b9c9fa', '#16af94', '#e77fb8']
function ChartPanel({title, icon, children, empty}: {title: string; icon: ReactNode; children: ReactNode; empty: boolean}) {
  return <section className="report-chart"><h3>{icon}{title}</h3>{empty ? <div className="report-chart-empty">داده‌ای برای این نمودار موجود نیست.</div> : children}</section>
}
export default function ReportCharts({data, province, status, loading, fileData, contractData}: {data: ReportData; province: ReportGroup[]; status: ReportGroup[]; loading: boolean; fileData?: ReportData; contractData?: ReportData}) {
  const metricTrend = !!fileData && !!contractData
  const cities = (data.comparison || []).filter(x => x.current > 0).slice(0, 5)
  const states = status.filter(x => x.current > 0)
  const total = states.reduce((sum, x) => sum + x.current, 0)
  const provinces = province.filter(x => x.current > 0)
  const provinceTotal = provinces.reduce((sum, x) => sum + x.current, 0)
  const topProvinces = provinces.slice(0, 4)
  const rest = provinces.slice(4).reduce((sum, x) => sum + x.current, 0)
  const distribution = [...topProvinces, ...(rest ? [{label: 'سایر استان‌ها', current: rest, previous: 0}] : [])]
  return <div className={`report-charts ${loading ? 'is-loading' : ''}`} aria-busy={loading}>
    <ChartPanel title="پراکندگی رکوردها بر اساس استان" icon={<LocationOnOutlinedIcon/>} empty={!distribution.length}>
      <div className="report-geography"><svg className="report-iran-map" viewBox="0 0 180 190" aria-hidden="true"><defs><linearGradient id="report-map-blue" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#e1e9ff"/><stop offset="1" stopColor="#adc5ff"/></linearGradient><clipPath id="report-map-clip"><path d="M17 8L26 14L27 25L37 21L45 35L60 38L72 33L86 41L98 37L109 28L119 34L128 31L140 42L150 44L154 57L164 60L158 78L169 91L164 105L158 111L159 131L171 141L165 155L172 163L157 171L143 166L135 173L125 166L111 163L101 152L92 148L80 144L72 133L63 135L57 126L46 121L44 111L35 108L38 95L29 89L27 79L19 71L22 60L17 50L23 44L16 35L18 26L12 20Z"/></clipPath></defs><g clipPath="url(#report-map-clip)" fill="url(#report-map-blue)"><path d="M0 0H180V190H0Z"/><path d="M0 12L48 0L64 49L39 69L0 47Z" fill="#d5e1ff"/><path d="M39 69L64 49L95 53L83 78L53 89Z" fill="#94b4ff"/><path d="M95 53L127 24L146 62L121 91L83 78Z" fill="#cbdaff"/><path d="M53 89L83 78L121 91L111 120L75 125Z" fill="#c0d3ff"/><path d="M0 47L39 69L53 89L28 109L0 83Z" fill="#b8ceff"/><path d="M28 109L53 89L75 125L62 151L26 140Z" fill="#c8d9ff"/><path d="M75 125L111 120L135 152L106 180L62 151Z" fill="#b2caff"/><path d="M121 91L180 70L180 142L135 152L111 120Z" fill="#d7e2ff"/><g fill="none" stroke="#fff" strokeWidth=".8" opacity=".8"><path d="M18 26L44 40L39 69L27 79M44 40L64 49L72 33M39 69L53 89L28 109M64 49L95 53L109 28M95 53L83 78L53 89L75 125L62 151M146 62L121 91L83 78M121 91L111 120L75 125M121 91L164 105M111 120L135 152L171 141M135 152L125 166"/></g></g></svg><div className="report-provinces">{distribution.map(row => <div key={row.label} className="report-province-row"><span>{row.label}</span><div><i style={{width: `${row.current / provinceTotal * 100}%`}}/></div><strong>{persianNumber(Math.round(row.current / provinceTotal * 100))}٪</strong><small>{persianNumber(row.current)} رکورد</small></div>)}</div></div>
    </ChartPanel>
    <ChartPanel title={metricTrend ? "روند ثبت فایل‌ها و قراردادها" : "روند ثبت رکوردها در بازه انتخابی"} icon={<TrendingUpRoundedIcon/>} empty={!data.total_results || !data.trend?.length}>
      {metricTrend && <div className="report-trend-legend"><span>فایل‌ها<i/></span><span>قراردادها<i/></span></div>}<LineChart height={metricTrend ? 213 : 235} margin={{top: 22, left: 38, right: 15, bottom: 42}} xAxis={[{scaleType: 'point', data: (data.trend || []).map(x => x.date), valueFormatter: value => dateTime(value).split('،')[0], tickLabelStyle: {fontSize: 11}}]} series={metricTrend ? [{data: (fileData?.trend || []).map(x => x.count), label: 'فایل‌ها', color: '#3477ff', valueFormatter: value => persianNumber(value || 0)}, {data: (contractData?.trend || []).map(x => x.count), label: 'قراردادها', color: '#ff9b24', valueFormatter: value => persianNumber(value || 0)}] : [{data: (data.trend || []).map(x => x.count), label: 'رکوردهای ثبت‌شده', color: '#3477ff', area: true, valueFormatter: value => persianNumber(value || 0)}]} grid={{horizontal: true}} slotProps={{legend: {hidden: true}}}/>
    </ChartPanel>
    <ChartPanel title="توزیع وضعیت رکوردها" icon={<DonutSmallRoundedIcon/>} empty={!total}>
      <div className="report-donut"><div className="report-donut-graphic"><PieChart height={155} margin={{top: 5, bottom: 5, left: 5, right: 5}} series={[{data: states.map((row, index) => ({id: row.label, label: reportLabel(row.label), value: row.current, color: palette[index % palette.length]})), innerRadius: 45, outerRadius: 70, paddingAngle: 1, valueFormatter: row => persianNumber(row.value)}]} slotProps={{legend: {hidden: true}}}/><span><strong>{persianNumber(total)}</strong><small>رکورد</small></span></div><ul>{states.map((row, index) => <li key={row.label}><i style={{background: palette[index % palette.length]}}/><span>{reportLabel(row.label)}</span><strong>{persianNumber(Math.round(row.current / total * 100))}٪</strong><small>({persianNumber(row.current)})</small></li>)}</ul></div>
    </ChartPanel>
    <ChartPanel title="مقایسه تعداد رکوردها بر اساس شهر" icon={<BarChartRoundedIcon/>} empty={!cities.length}>
      <BarChart height={235} margin={{top: 20, left: 38, right: 12, bottom: 42}} xAxis={[{scaleType: 'band', data: cities.map(x => x.label), tickLabelStyle: {fontSize: 11}}]} series={[{data: cities.map(x => x.current), label: 'تعداد رکورد', color: '#5289ff', valueFormatter: value => persianNumber(value || 0)}]} grid={{horizontal: true}} borderRadius={5} slotProps={{legend: {hidden: true}}}/>
    </ChartPanel>
  </div>
}
