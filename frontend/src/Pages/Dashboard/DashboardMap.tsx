import {useEffect, useRef, useState} from 'react'
import {Alert, Box, Button} from '@mui/material'
import OpenInFullRoundedIcon from '@mui/icons-material/OpenInFullRounded'
import * as L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import {PANEL_URL} from '../../Core/APP_URL'

export type CityPoint = {
    city: string; province: string; id?: number | string; title?: string; district?: string; neighborhood?: string
    precision?: string; office?: string; kind?: string; count: number; latitude: number; longitude: number
    propertyType?: string; area?: number; contractType?: string; totalPrice?: number; mortgagePrice?: number
    online?: number | boolean
}

const precisionLabels: Record<string, string> = {
    city: 'مرکز تقریبی شهر', district: 'محدوده تقریبی منطقه', neighborhood: 'محدوده تقریبی محله',
    record: 'موقعیت ثبت‌شده', demo: 'موقعیت نمونه',
}
const iran: L.LatLngExpression = [34.2, 51.5]

export default function DashboardMap({points, onSelect, matching, mapped, onExpand}: {
    points: CityPoint[]; onSelect: (point: CityPoint) => void; matching: number; mapped: number; onExpand?: () => void
}) {
    const container = useRef<HTMLDivElement>(null)
    const map = useRef<L.Map>()
    const layer = useRef<L.LayerGroup>()
    const select = useRef(onSelect)
    select.current = onSelect
    const [expanded, setExpanded] = useState(false)
    const [tileError, setTileError] = useState(false)

    useEffect(() => {
        if (!container.current) return
        const instance = L.map(container.current, {
            zoomControl: false, scrollWheelZoom: false, minZoom: 5, maxZoom: 17, maxBounds: [[23, 42], [42, 65]],
        }).setView(iran, 6)
        map.current = instance
        layer.current = L.layerGroup().addTo(instance)
        L.control.zoom({position: 'topleft'}).addTo(instance)
        L.tileLayer(`${PANEL_URL}/locations/tiles/{z}/{x}/{y}.png`, {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
            minZoom: 5, maxZoom: 17, crossOrigin: 'use-credentials',
        }).on('tileerror', () => setTileError(true)).addTo(instance)
        let frame = 0
        const observer = new ResizeObserver(() => {
            cancelAnimationFrame(frame)
            frame = requestAnimationFrame(() => instance.invalidateSize())
        })
        observer.observe(container.current)
        return () => {
            cancelAnimationFrame(frame)
            observer.disconnect()
            instance.remove()
            map.current = undefined
            layer.current = undefined
        }
    }, [])

    useEffect(() => {
        const instance = map.current
        const markers = layer.current
        if (!instance || !markers) return
        markers.clearLayers()
        const groups = new Map<string, CityPoint[]>()
        for (const point of points) {
            const key = point.latitude + ':' + point.longitude
            const samePlace = groups.get(key) || []
            samePlace.push(point)
            groups.set(key, samePlace)
        }
        for (const group of Array.from(groups.values())) {
            const first = group[0]
            const count = group.reduce((total, point) => total + point.count, 0)
            const label = count.toLocaleString('fa-IR')
            const icon = L.divIcon({className: 'dashboard-city-marker', html: `<span>${label}</span>`,
                iconSize: [42, 48], iconAnchor: [21, 45]})
            const marker = L.marker([first.latitude, first.longitude], {icon, title: first.city + '، ' + label + ' مورد'}).addTo(markers)
            const popup = document.createElement('div')
            popup.className = 'dashboard-map-popup'
            for (const point of group.slice(0, 30)) {
                const title = document.createElement('strong')
                title.textContent = point.title || point.city
                const details = document.createElement('p')
                details.textContent = [point.province, point.city, point.district, point.neighborhood, point.office,
                    precisionLabels[point.precision || '']].filter(Boolean).join(' · ')
                popup.append(title, details)
                if (point.precision !== 'demo') {
                    const button = document.createElement('button')
                    button.textContent = point.id ? 'مشاهده جزئیات' : 'مشاهده فایل‌های این شهر'
                    button.addEventListener('click', () => select.current(point))
                    popup.appendChild(button)
                }
            }
            marker.bindPopup(popup, {maxHeight: 340})
        }
        if (points.length) {
            const bounds = L.latLngBounds(points.map(point => L.latLng(point.latitude, point.longitude)))
            instance.fitBounds(bounds, {padding: [45, 35], maxZoom: points.some(point => point.precision !== 'city') ? 16 : 11, animate: false})
        } else {
            instance.setView(iran, 6)
        }
    }, [points])

    return <>
        <Box className={`dashboard-live-map${expanded ? ' is-expanded' : ''}`}>
            <div ref={container} aria-label="نقشه ملکینو" role="region"/>
            <Button className="dashboard-map-expand" size="small" aria-label={expanded ? 'کوچک کردن نقشه' : 'بزرگ کردن نقشه'} onClick={() => onExpand ? onExpand() : setExpanded(value => !value)}><OpenInFullRoundedIcon fontSize="small"/>{expanded ? 'بستن نقشه' : 'نمایش نقشه کامل'}</Button>
            {!matching && <div className="dashboard-map-empty">موردی با این فیلتر ثبت نشده است.</div>}
        </Box>
        <div className="dashboard-map-caption">{mapped.toLocaleString('fa-IR')} مورد روی نقشه · مختصات ثبت‌شده یا تقریبی در جزئیات نشانگر مشخص است.
            {matching > mapped && ` ${(matching - mapped).toLocaleString('fa-IR')} مورد دیگر در فهرست قابل بررسی است.`}</div>
        {tileError && <Alert severity="info" sx={{m: 1}}>کاشی‌های نقشه دریافت نشدند. فهرست همچنان در دسترس است.</Alert>}
    </>
}
