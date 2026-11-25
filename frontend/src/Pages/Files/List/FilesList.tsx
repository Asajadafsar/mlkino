import {useSearchParams} from 'react-router-dom'
import FilesWorkspace from '../FilesWorkspace'
import AdvancedPropertyResults from '../AdvancedPropertyResults'
export function FilesList(){const [params]=useSearchParams();return params.get('advanced')==='1'?<AdvancedPropertyResults/>:<FilesWorkspace/>}
