import {Alert} from '@mui/material'
import {useEstateActivities} from '../../../Components/Estate/useEstateActivities'
import {EstateActivityList} from '../../../Components/Estate/EstateActivityList'
import {Box, Button, IconButton, Modal, Stack, Typography} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import {useState} from 'react'

import {FollowUpsType} from '../FollowUps'

import {
    FollowUpStatusModal,
    FollowUpStatusData,
} from './FollowUpStatusModal'

import {
    NewVisitModal,
    NewVisitData,
} from './NewVisitModal'

const RESOURCE = 'follow-ups'

/* -------------------------------------------------------------------------- */
/* Custom Modal                                                               */
/* -------------------------------------------------------------------------- */

type CustomModalProps = {
    open: boolean
    onClose: () => void
    title: string
    subtitle?: string
    children: React.ReactNode
}

function CustomModal({
    open,
    onClose,
    title,
    subtitle,
    children,
}: CustomModalProps) {
    return (
        <Modal
            open={open}
            onClose={onClose}
            dir="rtl"
            sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                p: {
                    xs: 1.5,
                    sm: 2,
                },
            }}
        >
            <Box
                sx={{
                    width: '100%',
                    maxWidth: 560,
                    maxHeight: '90vh',
                    overflowY: 'auto',
                    bgcolor: 'background.paper',
                    borderRadius: {
                        xs: '16px',
                        sm: '20px',
                    },
                    boxShadow: 24,
                    outline: 'none',
                }}
            >
                {/* Header */}
                <Box
                    sx={{
                        px: {
                            xs: 2,
                            sm: 3,
                        },
                        py: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                    }}
                >
                    <Box>
                        <Typography
                            fontSize={{
                                xs: 16,
                                sm: 18,
                            }}
                            fontWeight={700}
                        >
                            {title}
                        </Typography>

                        {subtitle && (
                            <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{
                                    mt: 0.5,
                                    fontSize: {
                                        xs: 12,
                                        sm: 13,
                                    },
                                }}
                            >
                                {subtitle}
                            </Typography>
                        )}
                    </Box>

                    <IconButton
                        onClick={onClose}
                        size="small"
                        sx={{
                            width: 36,
                            height: 36,
                            borderRadius: '10px',
                            bgcolor: 'action.hover',
                            flexShrink: 0,

                            '&:hover': {
                                bgcolor: 'action.selected',
                            },
                        }}
                    >
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </Box>

                {/* Content */}
                <Box
                    sx={{
                        px: {
                            xs: 2,
                            sm: 3,
                        },
                        py: {
                            xs: 2,
                            sm: 3,
                        },
                    }}
                >
                    {children}
                </Box>
            </Box>
        </Modal>
    )
}

/* -------------------------------------------------------------------------- */
/* Table                                                                      */
/* -------------------------------------------------------------------------- */

export function FollowUpsList() {
    /* ---------------------------------------------------------------------- */
    /* Status Modal                                                           */
    /* ---------------------------------------------------------------------- */

    const [
        selectedFollowUp,
        setSelectedFollowUp,
    ] = useState<FollowUpsType | null>(null)

    const [
        statusModalOpen,
        setStatusModalOpen,
    ] = useState(false)

    const [
        statusData,
        setStatusData,
    ] = useState<FollowUpStatusData>({
        visitStatus: '',
        nextStatus: '',
        description: '',
        statusDescription: '',
        archive: false,
    })

    /* ---------------------------------------------------------------------- */
    /* New Visit Modal                                                        */
    /* ---------------------------------------------------------------------- */

    const [
        selectedFile,
        setSelectedFile,
    ] = useState<FollowUpsType | null>(null)

    const [
        newVisitModalOpen,
        setNewVisitModalOpen,
    ] = useState(false)

   const [newVisitData, setNewVisitData] =
    useState<NewVisitData>({
        customerName: '',
        date: '',
    })

    /* ---------------------------------------------------------------------- */
    /* Persistent data                                                              */
    /* ---------------------------------------------------------------------- */

    const {rows,loading,error,reload,save,canWrite}=useEstateActivities('follow-ups')
    const [actionError,setActionError]=useState('')

    /* ---------------------------------------------------------------------- */
    /* Status Handlers                                                        */
    /* ---------------------------------------------------------------------- */

    const handleOpenStatusModal = (
        row: FollowUpsType,
    ) => {
        setSelectedFollowUp(row)

        setStatusData({
            visitStatus: '',
            nextStatus: '',
            description: '',
            statusDescription: '',
            archive: false,
        })

        setStatusModalOpen(true)
    }

    const handleCloseStatusModal = () => {
        setStatusModalOpen(false)
        setSelectedFollowUp(null)

        setStatusData({
            visitStatus: '',
            nextStatus: '',
            description: '',
            statusDescription: '',
            archive: false,
        })
    }

    const handleSubmitStatus = async () => {
        if (!selectedFollowUp) return

        try{await save({...selectedFollowUp,...statusData,status:statusData.archive||statusData.nextStatus==='contract'?'انجام شده':statusData.nextStatus==='cancelled'?'نیازمند اقدام':'در حال پیگیری'});setActionError('')}catch(e:any){setActionError(e.message);return}

        handleCloseStatusModal()
    }

    /* ---------------------------------------------------------------------- */
    /* New Visit Handlers                                                     */
    /* ---------------------------------------------------------------------- */

   const handleOpenNewVisitModal = (row: FollowUpsType) => {
    setSelectedFile(row)

    setNewVisitData({
        customerName: '',
        date: '',
    })

    setNewVisitModalOpen(true)
}

   const handleCloseNewVisitModal = () => {
    setNewVisitModalOpen(false)
    setSelectedFile(null)

    setNewVisitData({
        customerName: '',
        date: '',
    })
}

   const handleSubmitNewVisit = async () => {
    if (!selectedFile) return

    if (
        !newVisitData.customerName.trim() ||
        !newVisitData.date
    ) {
        return
    }

    try{await save({file_name:selectedFile.file_name,date:newVisitData.date,full_name:newVisitData.customerName,description:'بازدید مجدد',status:'در حال پیگیری'});setActionError('')}catch(e:any){setActionError(e.message);return}

    handleCloseNewVisitModal()
}

    /* ---------------------------------------------------------------------- */
    /* Shared                                                                 */
    /* ---------------------------------------------------------------------- */

    return (
        <>
            {actionError&&<Alert severity="error" onClose={()=>setActionError('')}>{actionError}</Alert>}
            <EstateActivityList kind="follow-ups" rows={rows} loading={loading} error={error} onRetry={reload} onStatus={canWrite?handleOpenStatusModal:undefined} onVisit={canWrite?handleOpenNewVisitModal:undefined} onSave={canWrite?save:undefined}/>


            {/* ---------------------------------------------------------------- */}
            {/* تغییر وضعیت                                                     */}
            {/* ---------------------------------------------------------------- */}

            <FollowUpStatusModal
                open={statusModalOpen}
                onClose={handleCloseStatusModal}
                followUp={selectedFollowUp}
                statusData={statusData}
                setStatusData={setStatusData}
                onSubmit={handleSubmitStatus}
                CustomModal={CustomModal}
            />

            {/* ---------------------------------------------------------------- */}
            {/* بازدید جدید                                                     */}
            {/* ---------------------------------------------------------------- */}

            <NewVisitModal
                open={newVisitModalOpen}
                onClose={handleCloseNewVisitModal}
                selectedFile={selectedFile}
                newVisitData={newVisitData}
                setNewVisitData={setNewVisitData}
                onSubmit={handleSubmitNewVisit}
                CustomModal={CustomModal}
            />
        </>
    )
}