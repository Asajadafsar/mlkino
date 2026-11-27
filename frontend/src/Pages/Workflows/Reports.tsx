import {geographyEnabled,geographyLabels,geographyLevels,geographyPatch,useGeographyFilters} from '../../Components/Location/useGeographyFilters'
import {useCallback, useContext, useEffect, useMemo, useState} from 'react'
import {Alert, Autocomplete, Button, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, InputAdornment, LinearProgress, Menu, MenuItem, Pagination, Table, TableBody, TableCell, TableHead, TableRow, ToggleButton, ToggleButtonGroup, Tooltip} from '@mui/material'
import BarChartRoundedIcon from '@mui/icons-material/BarChartRounded'
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined'
import PrintOutlinedIcon from '@mui/icons-material/PrintOutlined'
import FilterListRoundedIcon from '@mui/icons-material/FilterListRounded'
import BookmarkBorderRoundedIcon from '@mui/icons-material/BookmarkBorderRounded'
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import LayersOutlinedIcon from '@mui/icons-material/LayersOutlined'
import MailOutlineRoundedIcon from '@mui/icons-material/MailOutlineRounded'
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded'
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded'
import TableChartOutlinedIcon from '@mui/icons-material/TableChartOutlined'
import UnfoldMoreRoundedIcon from '@mui/icons-material/UnfoldMoreRounded'
import {Link,useSearchParams} from 'react-router-dom'
import {CurrentUserContext} from '../../Core/CurrentUser'
import api from '../../Core/Request'
import FileInput from '../Files/FileInput'
import DatePickerFilter from '../../Components/Filter/DatePicker'
import {AdvancedReportFilters} from './AdvancedReportFilters'
import ReportCharts from './ReportCharts'
import {dateTime, persianNumber, unpack, workflowError, WorkflowRow} from './workflowClient'
import {csvCell, initialReportFilters, numericReportInput, reportCell, ReportData, ReportFilters, ReportGroup, reportLink, reportLabel, reportQuery, reportTitles, ReportType, reportValidation} from './reportPresentation'
import '../Files/filesWorkspace.css'
import './reports.css'

const emptyData: ReportData = {results: [], total_results: 0}
const statusOptions = [['', 'همه وضعیت‌ها'], ['active', 'فعال'], ['published', 'منتشرشده'], ['pending', 'در انتظار'], ['draft', 'پیش‌نویس'], ['accepted', 'پذیرفته‌شده'], ['rejected', 'ردشده'], ['expired', 'منقضی‌شده'], ['inactive', 'غیرفعال'], ['posted', 'ثبت قطعی'], ['reversed', 'برگشت‌شده']]
const fallbackColumns = [{key:'id',label:'شناسه'},{key:'title',label:'عنوان'},{key:'type',label:'نوع رکورد'},{key:'status',label:'وضعیت'},{key:'province',label:'استان'},{key:'city',label:'شهر'},{key:'district',label:'منطقه'},{key:'neighborhood',label:'محله'},{key:'agency',label:'دفتر املاک'},{key:'expert',label:'کارشناس'},{key:'price',label:'قیمت (تومان)'},{key:'area',label:'متراژ (متر مربع)'},{key:'created_at',label:'تاریخ ثبت'}]
const download = (blob: Blob, name: string) => {const url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000)}
const recordFilters = (filters: string, type: string) => {try {return JSON.stringify({op:'and',rules:[...(filters ? [JSON.parse(filters)] : []),{field:'type',op:'eq',value:type}]})} catch {return filters}}

export function Reports() {
  const {user} = useContext(CurrentUserContext)
  const allowed = useMemo(() => user.role === 'superadmin' ? Object.keys(reportTitles) as ReportType[] : user.role === 'agency' ? ['operations','experts','finance'] as ReportType[] : ['finance'] as ReportType[], [user.role])
  const [routeQuery] = useSearchParams()
  const requestedReport = routeQuery.get('report') as ReportType
  const [report, setReport] = useState<ReportType>(allowed.includes(requestedReport) ? requestedReport : allowed[0])
  const [filters, setFilters] = useState<ReportFilters>({...initialReportFilters})
  const [page, setPage] = useState(1), [pageSize, setPageSize] = useState(10), [view, setView] = useState('chart')
  const [data, setData] = useState<ReportData>(emptyData), [loading, setLoading] = useState(true)
  const [error, setError] = useState(''), [savedFilterError, setFilterError] = useState(''), [notice, setNotice] = useState(''), [retry, setRetry] = useState(0)
  const [groups, setGroups] = useState<{province: ReportGroup[]; status: ReportGroup[]}>({province:[],status:[]})
  const [trends, setTrends] = useState<{files?: ReportData; contracts?: ReportData}>({})
  const [chartsLoading, setChartsLoading] = useState(true), [chartsError, setChartsError] = useState('')
  const [saved, setSaved] = useState<WorkflowRow[]>([]), [savedOpen, setSavedOpen] = useState(false), [savedName, setSavedName] = useState(''), [saving, setSaving] = useState(false)
  const [columnsAnchor, setColumnsAnchor] = useState<HTMLElement|null>(null), [hiddenColumns, setHiddenColumns] = useState<string[]>([])
  const [exporting, setExporting] = useState(false), [exportProgress, setExportProgress] = useState(0)
  const validation = reportValidation(filters)
  const query = useMemo(() => reportQuery(filters), [filters]), key = JSON.stringify(query)
  const chartKey = JSON.stringify({...query, ordering: '-created_at'})
  const columns = useMemo(() => data.columns?.length ? data.columns.map(c => ({key:c.key || c.field || '',label:c.label})).filter(c => c.key) : report === 'operations' ? fallbackColumns : [{key:'id',label:'شناسه'},{key:'created_at',label:'تاریخ ثبت'}], [data.columns,report])
  const visibleColumns = columns.filter(c => !hiddenColumns.includes(c.key))

  useEffect(() => {
    let active = true
    setLoading(true); setError(''); setData(emptyData)
    if (validation) {setLoading(false); return}
    const timer = setTimeout(async () => {
      try {
        const result = unpack<ReportData>(await api.get('workflows/reports/', {params:{report,...JSON.parse(key),page,page_size:pageSize,group_by:'city'}}))
        if (active) {setData(result); const last = Math.max(1,Math.ceil(result.total_results / pageSize)); if (page > last) setPage(last)}
      } catch (e) {if (active) setError(workflowError(e))} finally {if (active) setLoading(false)}
    }, 300)
    return () => {active = false; clearTimeout(timer)}
  }, [report,key,page,pageSize,retry,validation])

  useEffect(() => {
    let active = true
    setGroups({province:[],status:[]}); setTrends({}); setChartsError(''); setChartsLoading(true)
    if (validation) {setChartsLoading(false); return}
    const timer = setTimeout(async () => {
      const params = {report,...JSON.parse(chartKey),page:1,page_size:1}
      const requests = [{key:'province',params:{...params,group_by:'province'}},{key:'status',params:{...params,group_by:'status'}},...(report === 'operations' ? [
        {key:'files',params:{...params,group_by:'status',filters:recordFilters(params.filters || '', 'فایل ملکی')}},
        {key:'contracts',params:{...params,filters:recordFilters(params.filters || '', 'قرارداد')}},
      ] : [])]
      const results = await Promise.allSettled(requests.map(async item => ({key:item.key,data:unpack<ReportData>(await api.get('workflows/reports/',{params:item.params}))})))
      if (!active) return
      const nextGroups = {province:[] as ReportGroup[],status:[] as ReportGroup[]}, nextTrends: {files?:ReportData;contracts?:ReportData} = {}
      results.forEach(result => {if (result.status === 'fulfilled') {const {key,data} = result.value; if (key === 'province' || key === 'status') nextGroups[key] = data.comparison || []; else if (key === 'files' || key === 'contracts') nextTrends[key] = data} else setChartsError('دریافت بخشی از نمودارها ناموفق بود. برای دریافت دوباره تلاش کنید.')})
      setGroups(nextGroups); setTrends(nextTrends); setChartsLoading(false)
    }, 350)
    return () => {active = false; clearTimeout(timer)}
  }, [report,chartKey,retry,validation])

  const loadSaved = useCallback(async () => {try {const result = unpack<any>(await api.get('workflows/saved-filters/')); setSaved(result.results || [])} catch (e) {setFilterError(workflowError(e))}}, [])
  useEffect(() => {void loadSaved()}, [loadSaved])
  const {options,error:geographyError}=useGeographyFilters(filters)
  const filterError=savedFilterError||geographyError
  const change = (field: string, value: string) => {
    const level=geographyLevels.find(item=>item===field)
    setPage(1)
    setFilters(current => ({...current,...(level?geographyPatch(level,value):{[field]:value})}))
  }
  const changeReport = (value: ReportType) => {
    setReport(value); setPage(1); setHiddenColumns([])
    setFilters(current => ({...initialReportFilters,period:current.period,date_from:current.date_from,date_to:current.date_to,...Object.fromEntries(geographyLevels.map(level=>[level,current[level]]))}))
  }
  const sort = (field: string) => change('ordering', filters.ordering === field ? '-' + field : field)
  const saveFilter = async () => {
    if (!savedName.trim() || validation) return
    setSaving(true); setError('')
    try {await api.post('workflows/saved-filters/',{name:savedName.trim(),report,filters}); setSavedOpen(false); setSavedName(''); await loadSaved(); setNotice('فیلتر در حساب شما ذخیره شد.')} catch (e) {setError(workflowError(e))} finally {setSaving(false)}
  }
  const exportRows = async (format: 'csv'|'xlsx') => {
    setExporting(true); setExportProgress(0); setError('')
    try {
      if (validation) throw Error(validation)
      if (data.total_results > 10000) throw Error('برای خروجی مرورگر، گزارش را با فیلترها به حداکثر ۱۰ هزار ردیف محدود کنید.')
      const exportColumns = [...visibleColumns], exportReport = report, params = {...query}
      let rows: WorkflowRow[] = []
      for (let cursor = 1; cursor <= Math.max(1,Math.ceil(data.total_results / 100)); cursor++) {
        const result = unpack<ReportData>(await api.get('workflows/reports/',{params:{report:exportReport,...params,page:cursor,page_size:100}}))
        rows.push(...result.results); setExportProgress(result.total_results ? Math.min(100,rows.length / result.total_results * 100) : 100)
        if (!result.results.length || rows.length >= result.total_results) break
      }
      if (format === 'csv') {
        const lines = [exportColumns.map(c => csvCell(c.label)).join(','),...rows.map(row => exportColumns.map(c => csvCell(reportCell(row,c.key))).join(','))]
        download(new Blob(['\ufeff' + lines.join('\r\n')],{type:'text/csv;charset=utf-8'}),`mlkino-${exportReport}.csv`)
      } else {
        const Excel = await import('exceljs'), workbook = new Excel.Workbook(), sheet = workbook.addWorksheet(reportTitles[exportReport],{views:[{rightToLeft:true}]})
        sheet.columns = exportColumns.map(c => ({header:c.label,key:c.key,width:c.key === 'title' ? 40 : 24}))
        rows.forEach(row => sheet.addRow(Object.fromEntries(exportColumns.map(c => [c.key,reportCell(row,c.key)]))))
        sheet.getRow(1).font = {bold:true,color:{argb:'FFFFFFFF'}}; sheet.getRow(1).fill = {type:'pattern',pattern:'solid',fgColor:{argb:'FF0755FF'}}
        const buffer = await workbook.xlsx.writeBuffer()
        download(new Blob([buffer],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}),`mlkino-${exportReport}.xlsx`)
      }
    } catch (e) {setError(workflowError(e))} finally {setExporting(false)}
  }
  const stateCount = (status: string) => groups.status.find(x => x.label === status)?.current || 0
  const summary = data.summary || {}
  const stats = report === 'operations' ? [
    {key:'files',title:'فایل‌ها',value:summary.files || 0,icon:<DescriptionOutlinedIcon/>,tone:'blue'},
    {key:'requests',title:'درخواست‌ها',value:summary.requests || 0,icon:<MailOutlineRoundedIcon/>,tone:'purple'},
    {key:'visits',title:'بازدیدها',value:summary.visits || 0,icon:<VisibilityOutlinedIcon/>,tone:'teal'},
    {key:'contracts',title:'قراردادها',value:summary.contracts || 0,icon:<DescriptionOutlinedIcon/>,tone:'blue'},
    {key:'active',title:'فعال',value:summary.active || 0,icon:<CheckCircleOutlineRoundedIcon/>,tone:'green'},
    {key:'pending',title:'در انتظار',value:summary.pending || 0,icon:<AccessTimeRoundedIcon/>,tone:'amber'},
    {key:'published',title:'منتشرشده',value:stateCount('published'),icon:<LayersOutlinedIcon/>,tone:'purple'},
  ] : Object.entries(summary).filter(([key,value]) => ['records','agencies','experts','files','requests','contracts','active','pending','debit','credit','balance','draft','posted','outstanding'].includes(key) && value != null).map(([key,value],index) => ({key,title:({records:'کل رکوردها',agencies:'دفاتر',experts:'کارشناسان',files:'فایل‌ها',requests:'درخواست‌ها',contracts:'قراردادها',active:'فعال',pending:'در انتظار',debit:'بدهکار (تومان)',credit:'بستانکار (تومان)',balance:'مانده (تومان)',draft:'پیش‌نویس',posted:'ثبت قطعی',outstanding:'مانده صورتحساب'} as Record<string,string>)[key],value,icon:<DescriptionOutlinedIcon/>,tone:['blue','purple','teal','green','amber'][index % 5]}))
  const busy = loading || exporting || !!validation || !!error
  const range = (title: string, from: string, to: string) => <div className="report-range"><span>{title}</span><div><FileInput label={`حداقل ${title}`} placeholder="از مقدار" value={filters[from]} onChange={e => change(from,numericReportInput(e.target.value))} inputProps={{inputMode:'decimal'}}/><span>تا</span><FileInput label={`حداکثر ${title}`} placeholder="تا مقدار" value={filters[to]} onChange={e => change(to,numericReportInput(e.target.value))} inputProps={{inputMode:'decimal'}}/></div></div>
  const stateBadge = (value: string) => <span className={`report-badge ${['active','accepted','posted','confirmed','completed'].includes(value) ? 'is-green' : ['pending','draft'].includes(value) ? 'is-amber' : value === 'published' ? 'is-purple' : 'is-muted'}`}>{value === 'pending' ? <AccessTimeRoundedIcon/> : value === 'published' ? <LayersOutlinedIcon/> : ['active','accepted'].includes(value) ? <CheckCircleOutlineRoundedIcon/> : null}{reportLabel(value)}</span>

  return <main className="reports-workspace workflow-reports" dir="rtl">
    <header className="report-hero" style={{'--report-hero-image':"url('/assets/estate-hero-v1.webp')"} as React.CSSProperties}><div className="report-hero-title"><span><BarChartRoundedIcon/></span><div><h1>گزارش‌ها و آمار مدیریتی</h1><p>تحلیل داده‌های واقعی از فایل‌ها، درخواست‌ها، بازدیدها، قراردادها و عملکرد تیم</p></div></div><div className="report-hero-actions report-no-print"><Button variant="contained" startIcon={<FileDownloadOutlinedIcon/>} disabled={busy} onClick={() => exportRows('xlsx')}>خروجی Excel</Button><Button variant="outlined" startIcon={<DescriptionOutlinedIcon/>} disabled={busy} onClick={() => exportRows('csv')}>خروجی CSV</Button><Button variant="outlined" startIcon={<PrintOutlinedIcon/>} disabled={loading || !!validation || !!error} onClick={() => window.print()}>چاپ گزارش</Button></div></header>
    {notice && <Alert severity="success" onClose={() => setNotice('')}>{notice}</Alert>}
    {error && <Alert severity="error" action={<Button onClick={() => setRetry(x => x + 1)}>تلاش مجدد</Button>}>{error}</Alert>}
    {filterError && <Alert severity="warning" onClose={() => setFilterError('')}>{filterError}</Alert>}
    <section className="report-panel report-filters report-no-print" aria-label="فیلترهای گزارش">
      <div className="report-filter-heading"><div><h2><FilterListRoundedIcon/>فیلترهای پیشرفته گزارش</h2><p>نوع گزارش و بازه زمانی را مشخص کرده و برای تحلیل دقیق‌تر، فیلترهای مورد نظر را اعمال کنید.</p></div><div className="report-saved-actions"><Button startIcon={<RestartAltRoundedIcon/>} onClick={() => {setPage(1); setFilters({...initialReportFilters}); setFilterError('')}}>پاک‌کردن فیلترها</Button><Button startIcon={<BookmarkBorderRoundedIcon/>} onClick={() => setSavedOpen(true)} disabled={!!validation}>ذخیره فیلتر</Button><FileInput select label="فیلترهای ذخیره‌شده" value="" onChange={e => {const row = saved.find(r => String(r.id) === e.target.value); if (row && allowed.includes(row.report)) {setPage(1); setReport(row.report); setHiddenColumns([]); setFilters({...initialReportFilters,...row.filters})}}}><MenuItem value="">انتخاب فیلتر ذخیره‌شده</MenuItem>{saved.filter(row => allowed.includes(row.report)).map(row => <MenuItem key={row.id} value={String(row.id)}>{row.name}</MenuItem>)}</FileInput></div></div>
      <div className="report-filter-grid">
        <FileInput select label="نوع گزارش" value={report} onChange={e => changeReport(e.target.value as ReportType)}>{allowed.map(key => <MenuItem key={key} value={key}>{reportTitles[key]}</MenuItem>)}</FileInput>
        <FileInput select label="بازه زمانی" value={filters.period} onChange={e => change('period',e.target.value)}>{[['today','امروز'],['yesterday','دیروز'],['week','هفته جاری'],['month','ماه جاری'],['previous_month','ماه گذشته'],['year','سال جاری'],['custom','بازه دلخواه']].map(([key,text]) => <MenuItem key={key} value={key}>{text}</MenuItem>)}</FileInput>
        <FileInput label="کد دفتر" placeholder="کد دفتر املاک" value={filters.agency} onChange={e => change('agency',numericReportInput(e.target.value))} inputProps={{inputMode:'numeric'}}/>
        <FileInput label="کد کارشناس" placeholder="کد کارشناس" value={filters.expert} onChange={e => change('expert',numericReportInput(e.target.value))} inputProps={{inputMode:'numeric'}}/>
        {geographyLevels.map(level => <Autocomplete key={level} options={options[level]||[]} disabled={!geographyEnabled(level,filters)} value={filters[level]||null} onChange={(_,value)=>change(level,value||'')} renderInput={params=><FileInput {...params} label={geographyLabels[level]}/>}/>)}
        {filters.period === 'custom' && <><div className="report-date"><DatePickerFilter mode="controlled" item={{label:'از تاریخ'}} value={filters.date_from || null} onChange={value => change('date_from',value || '')}/></div><div className="report-date"><DatePickerFilter mode="controlled" item={{label:'تا تاریخ'}} value={filters.date_to || null} onChange={value => change('date_to',value || '')}/></div></>}

        <FileInput select label="وضعیت" value={filters.status} onChange={e => change('status',e.target.value)}>{statusOptions.map(([key,text]) => <MenuItem key={key} value={key}>{text}</MenuItem>)}</FileInput>
        {report === 'operations' && <>{range('قیمت (تومان)','priceFrom','priceTo')}{range('متراژ (متر مربع)','areaFrom','areaTo')}</>}
        {report === 'agencies' && <><FileInput select label="وضعیت پروانه" value={filters.license} onChange={e => change('license',e.target.value)}>{[['','همه دفاتر'],['with','دارای پروانه'],['without','بدون پروانه'],['expired','پروانه منقضی']].map(([key,text]) => <MenuItem key={key} value={key}>{text}</MenuItem>)}</FileInput>{range('تعداد کارشناس','expertCountFrom','expertCountTo')}</>}
      </div>
      <div className="report-filter-bottom"><AdvancedReportFilters report={report} value={filters.filters} onChange={value => change('filters',value)}/><span>فیلترها به‌صورت خودکار اعمال می‌شوند.</span>{saved.length > 0 && <Button size="small" onClick={() => setSavedOpen(true)}>مدیریت فیلترهای ذخیره‌شده</Button>}</div>
      {validation && <Alert severity="warning">{validation}</Alert>}
    </section>
    {(loading || exporting) && <LinearProgress aria-label={exporting ? 'تهیه خروجی گزارش' : 'دریافت گزارش'} variant={exporting ? 'determinate' : 'indeterminate'} value={exportProgress}/>}
    <div className={`report-stats ${report !== 'operations' ? 'is-fluid' : ''}`} aria-label="خلاصه گزارش">{stats.map(stat => <article key={stat.key} className={`report-stat is-${stat.tone}`}><span className="report-stat-icon">{stat.icon}</span><div><span>{stat.title}</span><strong>{loading || validation || error || (stat.key === 'published' && (chartsLoading || !!chartsError)) ? '—' : persianNumber(stat.value)}</strong></div></article>)}</div>
    <section className="report-panel report-visuals" aria-label="نمودارهای مدیریتی"><div className="report-visual-toolbar report-no-print"><ToggleButtonGroup exclusive value={view} onChange={(_,value) => value && setView(value)} size="small" aria-label="نمای گزارش"><ToggleButton value="chart"><BarChartRoundedIcon/>نمودار</ToggleButton><ToggleButton value="table"><TableChartOutlinedIcon/>جدول</ToggleButton></ToggleButtonGroup>{data.date_from && <small>{dateTime(data.date_from).split('،')[0]} تا {dateTime(data.date_to).split('،')[0]}</small>}</div>{chartsError && <Alert severity="warning" action={<Button onClick={() => setRetry(x => x + 1)}>تلاش مجدد</Button>}>{chartsError}</Alert>}{view === 'chart' ? <ReportCharts data={data} province={groups.province} status={groups.status} loading={chartsLoading || loading} fileData={report === 'operations' ? trends.files : undefined} contractData={report === 'operations' ? trends.contracts : undefined}/> : <div className="report-summary-table"><Table size="small"><TableHead><TableRow><TableCell>شهر</TableCell><TableCell>دوره جاری</TableCell><TableCell>دوره قبل</TableCell></TableRow></TableHead><TableBody>{(data.comparison || []).map(row => <TableRow key={row.label}><TableCell>{row.label}</TableCell><TableCell>{persianNumber(row.current)}</TableCell><TableCell>{persianNumber(row.previous)}</TableCell></TableRow>)}</TableBody></Table>{!data.comparison?.length && <div className="report-empty">داده مقایسه موجود نیست.</div>}</div>}</section>
    <section className="report-panel report-records" aria-label="جدول گزارش"><p className="report-print-caption">گزارش صفحه {persianNumber(page)}؛ {persianNumber(data.results.length)} ردیف از {persianNumber(data.total_results)} نتیجه</p>
      <div className="report-table-toolbar report-no-print"><div className="report-table-search"><FileInput placeholder="جستجو در گزارش..." label="جستجو در گزارش" value={filters.search} onChange={e => change('search',e.target.value)} InputProps={{startAdornment:<InputAdornment position="start"><SearchRoundedIcon/></InputAdornment>}}/><small>{loading ? 'در حال دریافت...' : `${persianNumber(data.total_results)} نتیجه یافت شد`}</small></div><div className="report-table-options"><FileInput select label="مرتب‌سازی" value={columns.some(c => c.key === filters.ordering.replace(/^-/,'')) ? filters.ordering : '-created_at'} onChange={e => change('ordering',e.target.value)}>{columns.flatMap(column => [<MenuItem key={column.key} value={column.key}>{column.label} (صعودی)</MenuItem>,<MenuItem key={'-'+column.key} value={'-'+column.key}>{column.label} (نزولی)</MenuItem>])}</FileInput><Button variant="outlined" startIcon={<SettingsOutlinedIcon/>} onClick={e => setColumnsAnchor(e.currentTarget)}>ستون‌ها</Button></div></div>
      <div className="report-table-scroll"><Table size="small" className="report-table"><TableHead><TableRow>{visibleColumns.map(column => <TableCell key={column.key}><button onClick={() => sort(column.key)} aria-label={`مرتب‌سازی بر اساس ${column.label}`}>{column.label}<UnfoldMoreRoundedIcon fontSize="inherit"/>{filters.ordering.replace(/^-/, '') === column.key && <span className="report-sort-direction">{filters.ordering.startsWith('-') ? '↓' : '↑'}</span>}</button></TableCell>)}<TableCell className="report-row-actions report-no-print">عملیات</TableCell></TableRow></TableHead><TableBody>{!loading && !validation && data.results.map((row,index) => <TableRow key={row.key || `${row.id}-${index}`}>{visibleColumns.map(column => <TableCell key={column.key}>{column.key === 'status' ? stateBadge(row.status) : column.key === 'type' ? <span className={`report-badge ${row.type === 'درخواست ملک' ? 'is-purple' : 'is-blue'}`}><MailOutlineRoundedIcon/>{reportCell(row,column.key)}</span> : reportCell(row,column.key)}</TableCell>)}<TableCell className="report-row-actions report-no-print">{reportLink(row,report) ? <Tooltip title="مشاهده جزئیات"><IconButton aria-label={`مشاهده ${row.title || row.name || row.id}`} component={Link} to={reportLink(row,report)} size="small"><VisibilityOutlinedIcon fontSize="small"/></IconButton></Tooltip> : '—'}</TableCell></TableRow>)}</TableBody></Table>{!loading && !data.results.length && <div className="report-empty">{validation ? 'برای نمایش گزارش، فیلترها را اصلاح کنید.' : error ? 'دریافت گزارش ناموفق بود.' : 'رکوردی با این فیلترها پیدا نشد.'}</div>}{loading && <div className="report-empty">در حال دریافت گزارش…</div>}</div>
      <footer className="report-pagination report-no-print"><Pagination showFirstButton showLastButton count={Math.max(1,Math.ceil(data.total_results / pageSize))} page={page} onChange={(_,value) => setPage(value)} disabled={loading || !!validation} shape="rounded" color="primary"/><span>صفحه {persianNumber(page)} از {persianNumber(Math.max(1,Math.ceil(data.total_results / pageSize)))}</span><FileInput select label="نمایش در هر صفحه" value={pageSize} onChange={e => {setPage(1);setPageSize(Number(e.target.value))}}>{[10,25,50,100].map(size => <MenuItem key={size} value={size}>{persianNumber(size)} ردیف در صفحه</MenuItem>)}</FileInput></footer>
    </section>
    <Menu anchorEl={columnsAnchor} open={!!columnsAnchor} onClose={() => setColumnsAnchor(null)}>{columns.map(column => <MenuItem key={column.key} onClick={() => setHiddenColumns(current => current.includes(column.key) ? current.filter(key => key !== column.key) : visibleColumns.length > 1 ? [...current,column.key] : current)}><Checkbox size="small" checked={!hiddenColumns.includes(column.key)}/>{column.label}</MenuItem>)}</Menu>
    <Dialog open={savedOpen} onClose={() => !saving && setSavedOpen(false)} fullWidth maxWidth="sm" PaperProps={{className:'report-save-dialog'}}><DialogTitle>ذخیره و مدیریت فیلترهای گزارش</DialogTitle><DialogContent><FileInput autoFocus label="نام فیلتر" value={savedName} onChange={e => setSavedName(e.target.value)} inputProps={{maxLength:100}}/>{saved.filter(row => allowed.includes(row.report)).map(row => <div className="report-saved-row" key={row.id}><span>{row.name}<small>{reportTitles[row.report as ReportType]}</small></span><Button color="error" disabled={saving} onClick={async () => {setSaving(true);try {await api.delete(`workflows/saved-filters/${row.id}/`);await loadSaved()} catch (e) {setFilterError(workflowError(e))} finally {setSaving(false)}}}>حذف</Button></div>)}{filterError && <Alert severity="error">{filterError}</Alert>}</DialogContent><DialogActions><Button disabled={saving} onClick={() => setSavedOpen(false)}>بستن</Button><Button variant="contained" disabled={saving || !savedName.trim() || !!validation} onClick={saveFilter}>{saving ? 'در حال ذخیره…' : 'ذخیره فیلتر جاری'}</Button></DialogActions></Dialog>
  </main>
}
