import {Navigate,useLocation} from 'react-router-dom'

export const LANDING_URL=process.env.REACT_APP_LANDING_URL||(process.env.NODE_ENV==='production'?'https://mlkino.com':'http://localhost:3001')

export default function LandingEntry(){
 const location=useLocation()
 return <Navigate to={{pathname:'/dashboard',search:location.search,hash:location.hash}} replace />
}
