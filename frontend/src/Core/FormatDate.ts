export const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'تاریخ موجود نیست'
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return 'تاریخ نامعتبر'
    let preferences={timezone:'Asia/Tehran',dateFormat:'jalali'}
    try {preferences={...preferences,...JSON.parse(localStorage.getItem('mlkino:date-settings')||'{}')}} catch {}
    try {return new Intl.DateTimeFormat(preferences.dateFormat==='gregorian'?'fa-IR-u-ca-gregory':'fa-IR', {
        timeZone:preferences.timezone,year:'numeric',month:'long',day:'numeric',hour:'2-digit',minute:'2-digit',
    }).format(date)} catch {return date.toLocaleString('fa-IR')}
}
