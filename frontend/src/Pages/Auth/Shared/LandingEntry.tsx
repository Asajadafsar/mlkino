import {useEffect} from 'react'
export const LANDING_URL=process.env.REACT_APP_LANDING_URL||(process.env.NODE_ENV==='production'?'https://mlkino.com':'http://localhost:3001')
export default function LandingEntry(){useEffect(()=>{window.location.replace(LANDING_URL)},[]);return <a href={LANDING_URL}>رفتن به صفحه اصلی ملکینو</a>}
