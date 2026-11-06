import {redirect} from 'next/navigation';
import {PANEL_ORIGIN} from '../Core/panel';
export default function SavedPage(){redirect(PANEL_ORIGIN+'/favorites')}
