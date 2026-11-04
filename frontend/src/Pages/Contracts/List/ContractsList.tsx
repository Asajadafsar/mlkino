import {EstateActivityList} from '../../../Components/Estate/EstateActivityList'
import {useEstateActivities} from '../../../Components/Estate/useEstateActivities'
export function ContractsList() {
 const {rows,loading,error,reload,save,canWrite}=useEstateActivities('contracts')
 return <EstateActivityList kind="contracts" rows={rows} loading={loading} error={error} onRetry={reload} onSave={canWrite?save:undefined}/>
}
