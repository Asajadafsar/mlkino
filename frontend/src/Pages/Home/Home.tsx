import {FavoritesProvider} from '../../Core/FavoritesContext'
import {lazy,Suspense} from 'react'
import {authEntry} from '../../Core/AuthDestination'
import api from '../../Core/Request'
import {canAccessUserRoute} from '../../Core/AccessControl'
import {PanelSettingsProvider,usePanelSettings} from '../../Core/PanelSettingsContext'
import {RealtimeProvider} from '../../Core/RealtimeContext'
import ChatPage from '../Chats/ChatPage'
import {CurrentUserContext} from '../../Core/CurrentUser'
import {UsersType} from '../User/Users'
import {ACCOUNTS_URL} from '../../Core/APP_URL'
import {getImpersonationStatus, impersonationError} from '../../Core/Impersonation'
import {setImpersonation, setImpersonationError, clearImpersonation} from '../../redux/ImpersonationSlice'
import type {RootState} from '../../redux/store'
import {ImpersonationBanner} from '../../Components/Impersonation/ImpersonationBanner'
import Box from '@mui/material/Box'
import {useEffect, useState} from 'react'
import {Route, Routes, useLocation, useNavigate} from 'react-router-dom'
import MainLayout from '../../Components/MainLayout'

import DashboardLayout from '../Dashboard/DashboardLayout'
import Profile from '../Profile/Profile'
import {LogsList} from '../Logs/List/LogsList'
import UserPage from '../User/UserPage'
import {AnnouncementCreate} from '../Announcement/Create/AnnouncementCreate'
import {AnnouncementList} from '../Announcement/List/AnnouncementList'
import {AnnouncementEdit} from '../Announcement/Edit/AnnouncementEdit'
import PanelSettings from '../Settings/PanelSettings'
import {FilesCreate} from '../Files/Create/FilesCreate'
import {RecordList} from '../Files/RecordList'
import {RecordEdit} from '../Files/RecordEdit'
import {FilesList} from '../Files/List/FilesList'
import {FilesEdit} from '../Files/Edit/FilesEdit'
import {RequestCreate} from '../Request/Create/RequestCreate'
import {RequestEdit} from '../Request/Edit/RequestEdit'
import {RequestList} from '../Request/List/RequestList'
import {ReminderCreate} from '../Reminder/Create/ReminderCreate'
import {ReminderList} from '../Reminder/List/ReminderList'
import {ReminderEdit} from '../Reminder/Edit/ReminderEdit'
import {CustomersList} from '../Customers/List/CustomersList'
import {CustomersEdit} from '../Customers/Edit/CustomersEdit'
import {AdvertisementsCreate} from '../Advertisements/Create/AdvertisementsCreate'
import {AdvertisementsList} from '../Advertisements/List/AdvertisementsList'
import {AdvertisementsEdit} from '../Advertisements/Edit/AdvertisementsEdit'
import {OwnersList} from '../Owners/List/OwnersList'
import {OwnersEdit} from '../Owners/Edit/OwnersEdit'
import {PartnersList} from '../Partners/List/PartnersList'
import {PartnersEdit} from '../Partners/Edit/PartnersEdit'
import {SuperUsersList} from '../SuperUsers/List/SuperUsersList'
import {SuperUsersCreate} from '../SuperUsers/Create/SuperUsersCreate'
import {SuperUsersEdit} from '../SuperUsers/Edit/SuperUsersEdit'
import {AgencyCreate} from '../Agency/Create/AgencyCreate'
import {AgencyList} from '../Agency/List/AgencyList'
import {AgencyEdit} from '../Agency/Edit/AgencyEdit'
import {UsersCreate} from '../User/Create/UsersCreate'
import {UsersList} from '../User/List/UsersList'
import {UsersEdit} from '../User/Edit/UsersEdit'
import {ExpertCreate} from '../Expert/Create/ExpertCreate'
import {ExpertList} from '../Expert/List/ExpertList'
import {ExpertEdit} from '../Expert/Edit/ExpertEdit'
import {LessorsList} from '../Lessors/List/LessorsList'
import {LessorsEdit} from '../Lessors/Edit/LessorsEdit'
import {TenantsList} from '../Tenants/List/TenantsList'
import {TenantsEdit} from '../Tenants/Edit/TenantsEdit'
import RoleSelectPage from '../Lessors/RoleCard'
import {TicketsList} from '../Tickets/List/TicketsList'
import {TicketsEdit} from '../Tickets/Edit/TicketsEdit'
import {TicketsCreate} from '../Tickets/Create/TicketsCreate'
import {Alert, Button, CircularProgress, Stack} from '@mui/material'
import {OwnersRequestCreate} from '../OwnersRequest/Create/OwnersRequestCreate'
import {OwnersRequestList} from '../OwnersRequest/List/OwnersRequestList'
import {OwnersRequestEdit} from '../OwnersRequest/Edit/OwnersRequestEdit'
import {CustomersRequestList} from '../CustomersRequest/List/CustomersRequestList'
import {CustomersRequestEdit} from '../CustomersRequest/Edit/CustomersRequestEdit'
import {ViewsList} from '../Views/List/ViewsList'
import {ViewsEdit} from '../Views/Edit/ViewsEdit'
import {FollowUpsList} from '../FollowUps/List/FollowUpsList'
import {FollowUpsEdit} from '../FollowUps/Edit/FollowUpsEdit'
import {ContractsList} from '../Contracts/List/ContractsList'
import {ContractsEdit} from '../Contracts/Edit/ContractsEdit'
import {ArchivesList} from '../Archives/List/ArchivesList'
import {ArchivesEdit} from '../Archives/Edit/ArchivesEdit'
import {TasksCreate} from '../Tasks/Create/TasksCreate'
import {TasksEdit} from '../Tasks/Edit/TasksEdit'
import {TasksList} from '../Tasks/List/TasksList'
import {clearRole, setRole, UserRole} from '../../redux/RoleSlice'
import {useDispatch, useStore} from 'react-redux'
import axios from 'axios'
import { LogsEdit } from '../Logs/Edit/LogsEdit'

const Reports=lazy(()=>import('../Workflows/Reports').then(m=>({default:m.Reports})))
const WorkflowPage=lazy(()=>import('../Workflows/WorkflowPage').then(m=>({default:m.WorkflowPage})))
const WorkflowOverview=lazy(()=>import('../Workflows/WorkflowOverview').then(m=>({default:m.WorkflowOverview})))
const RoutingSettings=lazy(()=>import('../Workflows/RoutingSettings').then(m=>({default:m.RoutingSettings})))
const FinancialSettings=lazy(()=>import('../Workflows/FinancialSettings').then(m=>({default:m.FinancialSettings})))
const WorkspaceRoles=lazy(()=>import('../Workflows/WorkspaceRoles').then(m=>({default:m.WorkspaceRoles})))
function FeatureRouteGuard({children}:{children:React.ReactNode}){
 const {settings,loading}=usePanelSettings(),location=useLocation();const key=location.pathname.split('/')[1];
 if(loading)return <Stack alignItems="center" p={5}><CircularProgress aria-label="دریافت تنظیمات دسترسی"/></Stack>
 if(key==='advertisements')return <ComingSoon/>
 const feature=({views:'visits','landlord-tenant':'landlordTenant'} as Record<string,string>)[key]||key
 if(key!=='settings'&&settings.features[feature]===false)return <Alert severity="info">این قابلیت توسط مدیر سامانه غیرفعال شده است. اطلاعات قبلی محفوظ است.</Alert>
 return <>{children}</>
}
function ComingSoon(){return <Alert severity="info">دیوارکوب — به‌زودی. این بخش هنوز برای استفاده عمومی فعال نشده است.</Alert>}

export function Home(props) {
    const reduxStore = useStore<RootState>()
    const navigate = useNavigate()
    const location = useLocation()
    const [data, setData] = useState({})
    const dispatch = useDispatch()
    const [authStatus, setAuthStatus] = useState<'loading' | 'auth' | 'unauth' | 'error'>('loading')
    const [user, setUser] = useState<UsersType>({} as UsersType)
    const [attempt, setAttempt] = useState(0)
    useEffect(() => {if (location.pathname.endsWith('/create')) setData({})}, [location.pathname])

    useEffect(() => {
        let active = true
        dispatch(clearImpersonation())

        const getProfile = async () => {
            try {
                const response = await api.get(`${ACCOUNTS_URL}/profile/`, {
                    withCredentials: true,
                    headers: {
                        'Accept-Language': 'fa',
                    },
                })

                if (!active) return

                const user = response.data.data

                if (!user || !Object.values(UserRole).includes(user.role)) {
                    throw new Error('Invalid user role')
                }

                setUser(user)
                dispatch(setRole(user.role as UserRole))
                setAuthStatus('auth')
                try {
                    const session = await getImpersonationStatus()
                    if (!active) return
                    dispatch(setImpersonation({session, actorId: session.active ? session.actor_id! : user.id}))
                    if (session.active) dispatch(setRole(session.target_role!))
                } catch (statusError) {
                    if (!active) return
                    if (axios.isAxiosError(statusError) && [401, 403].includes(statusError.response?.status ?? 0) && reduxStore.getState().role.role !== UserRole.SUPERADMIN) {
                        dispatch(setImpersonation({session: {active: false}, actorId: user.id}))
                    } else {
                        dispatch(setImpersonationError(impersonationError(statusError, 'خطا در بررسی ورود مدیریتی')))
                    }
                }
            } catch (error) {
                if (!active) return

                if (axios.isAxiosError(error) && error.response?.status === 401) {
                    dispatch(clearRole())
                    dispatch(clearImpersonation())
                    setAuthStatus('unauth')
                } else {
                    setAuthStatus('error')
                }
            }
        }

        getProfile()
        window.addEventListener('focus',getProfile)

        return () => {
            window.removeEventListener('focus',getProfile)
            active = false
        }
    }, [dispatch, reduxStore, attempt])

    useEffect(() => {
        if (authStatus === 'loading' || authStatus === 'error') return

        if (authStatus === 'unauth') {
            navigate(authEntry('/login',location.pathname+location.search+location.hash), {replace: true})
            return
        }

        if (user.registration_required === true) {
            navigate(authEntry('/signup',location.pathname+location.search+location.hash), {replace: true, state: {completion: {phone: user.phone, first_name: user.first_name, last_name: user.last_name}}})
            return
        }

        if (location.pathname === '/') {
            navigate('/dashboard', {replace: true})
        }
    }, [authStatus, navigate, location.pathname, location.search, location.hash, user])

    useEffect(() => {
        const onStorage = (event: StorageEvent) => {
            if (event.key === 'mlkino:identity-change') window.location.reload()
        }
        window.addEventListener('storage', onStorage)
        return () => window.removeEventListener('storage', onStorage)
    }, [])

    if (authStatus === 'loading') {
        return <Stack alignItems="center" sx={{p: 4}}><CircularProgress aria-label="دریافت اطلاعات حساب" /></Stack>
    }

    if (authStatus === 'error') {
        return <Alert severity="error" action={<Button onClick={() => {setAuthStatus('loading'); setAttempt(value => value + 1)}}>تلاش مجدد</Button>}>دریافت اطلاعات حساب انجام نشد. اتصال به سرور را بررسی کنید.</Alert>
    }

    if (authStatus === 'unauth' || user.registration_required === true) {
        return null
    }

    if (!canAccessUserRoute(user.role, location.pathname,user.permissions)) {
        return <Alert severity="warning" action={<Button onClick={() => navigate('/dashboard')}>پیشخوان</Button>}>دسترسی به این بخش ندارید.</Alert>
    }

    return (
        <CurrentUserContext.Provider value={{user, setUser}}>
        <PanelSettingsProvider><FavoritesProvider><RealtimeProvider><MainLayout><FeatureRouteGuard>
            <Box
                flexGrow={1}
                mt="5.25rem"
                sx={{px: {xs: 1.5, sm: 3}, pb: 4, pt: 2}}
            >
                <ImpersonationBanner />
                <Box
                    sx={{minWidth: 0}}
                >
                    <Suspense fallback={<Stack alignItems="center" p={5}><CircularProgress aria-label="بارگذاری صفحه"/></Stack>}><Routes>
                        <Route path="reports" element={<Reports/>}/>
                        <Route path="workflows" element={<WorkflowOverview/>}/>
                        <Route path="crm" element={<WorkflowPage section="contacts"/>}/>
                        <Route path="assignments" element={<WorkflowPage section="assignments"/>}/>
                        <Route path="seller-requests" element={<WorkflowPage section="assignments" assignmentKind="file" assignmentSource="landing" title="درخواست فروشندگان"/>}/>
                        <Route path="favorites" element={<WorkflowPage section="favorites"/>}/>
                        <Route path="visits" element={<WorkflowPage section="visits"/>}/>
                        <Route path="visit-slots" element={<WorkflowPage section="visit-slots"/>}/>
                        <Route path="finance" element={<WorkflowPage section="finance"/>}/>
                        <Route path="financial-settings" element={<FinancialSettings/>}/>
                        <Route path="offers" element={<WorkflowPage section="offers"/>}/>
                        <Route path="routing-settings" element={<RoutingSettings/>}/>
                        <Route path="workspace-roles" element={<WorkspaceRoles/>}/>

                        <Route path="chats" element={<ChatPage />} />
                        <Route path="dashboard" element={<DashboardLayout />} />
                        <Route path="/profile" element={<Profile />} />
                        {/* ...........super users.......... */}
                        <Route
                            path="users/super-users/create"
                            element={<SuperUsersCreate data={data} setData={setData} />}
                        />
                        <Route path="users/super-users" element={<SuperUsersList />} />
                        <Route path="users/super-users/:id" element={<SuperUsersEdit />} />
                        {/* ...........agencies.......... */}
                        <Route
                            path="users/agencies/create"
                            element={<AgencyCreate data={data} setData={setData} />}
                        />
                        <Route path="users/agencies" element={<AgencyList />} />
                        <Route path="users/agencies/:id" element={<AgencyEdit />} />
                        {/* ...........user.......... */}
                        <Route
                            path="users/user/create"
                            element={<UsersCreate data={data} setData={setData} />}
                        />
                        <Route path="users/user" element={<UsersList />} />
                        <Route path="users/user/:id" element={<UsersEdit />} />
                        {/* ...........expert.......... */}
                        <Route
                            path="users/expert/create"
                            element={
                                <ExpertCreate
                                    title="افزودن کارشناس"
                                    data={data}
                                    setData={setData}
                                />
                            }
                        />
                        <Route
                            path="users/expert"
                            element={<ExpertList title="لیست کارشناسان" />}
                        />
                        <Route
                            path="users/expert/:id"
                            element={<ExpertEdit title="ویرایش کارشناس" />}
                        />

                      

                        <Route path="users" element={<UserPage />} />

                        {/* ...........logs.......... */}

                        <Route path="logs" element={<LogsList />} />
                         <Route path="logs/:id" element={<LogsEdit />} />
                        {/* ...........Announcemen.......... */}
                        <Route
                            path="announcements/create"
                            element={<AnnouncementCreate data={data} setData={setData} />}
                        />
                        <Route path="announcements" element={<AnnouncementList />} />
                        <Route path="announcements/:id" element={<AnnouncementEdit />} />
                        {/* ...........Settings.......... */}
                        <Route path="settings" element={<PanelSettings />} />
                        {/* ...........files.......... */}
                        <Route
                            path="files/create"
                            element={<FilesCreate data={data} setData={setData} />}
                        />
                        <Route path="files" element={<FilesList />} />
                        <Route path="files/:id" element={<FilesEdit />} />
                        {/* ...........requests.......... */}
                        <Route
                            path="requests/create"
                            element={<RequestCreate data={data} setData={setData} />}
                        />
                        <Route path="requests" element={<RequestList />} />
                        <Route path="requests/:id" element={<RequestEdit />} />
                        {/* ...........Reminders.......... */}
                        <Route
                            path="reminders/create"
                            element={<ReminderCreate data={data} setData={setData} />}
                        />
                        <Route path="reminders" element={<ReminderList />} />
                        <Route path="reminders/:id" element={<ReminderEdit />} />
                        {/* ...........Customers.......... */}

                        <Route path="customers" element={<WorkflowPage section="contacts" contactRole="buyer" title="مدیریت خریداران"/>} />
                        <Route path="customers/:id" element={<WorkflowPage section="contacts"/>} />
                        {/* ...........Owners.......... */}

                        <Route path="owners" element={<WorkflowPage section="contacts" contactRole="owner" title="مدیریت مالکان"/>} />
                        <Route path="owners/:id" element={<WorkflowPage section="contacts"/>} />
                        {/* ...........advertisements.......... */}
                        <Route
                            path="advertisements/create"
                            element={<ComingSoon/>}
                        />
                        <Route path="advertisements" element={<ComingSoon/>} />
                        <Route path="advertisements/:id" element={<ComingSoon/>} />
                        {/* ...........Partners.......... */}

                        <Route path="partners" element={<PartnersList />} />
                        <Route path="partners/:id" element={<PartnersEdit />} />
                        {/* ...........lessors.......... */}

                        <Route path="landlord-tenant/lessors" element={<WorkflowPage section="contacts" contactRole="landlord" title="مدیریت موجران"/>} />
                        <Route path="landlord-tenant/lessors/:id" element={<WorkflowPage section="contacts"/>} />
                        {/* ...........tenants.......... */}

                        <Route path="landlord-tenant/tenants" element={<WorkflowPage section="contacts" contactRole="tenant" title="مدیریت مستأجران"/>} />
                        <Route path="landlord-tenant/tenants/:id" element={<WorkflowPage section="contacts"/>} />
                        <Route path="landlord-tenant" element={<RoleSelectPage />} />

                        {/* ...........tickets.......... */}

                        <Route path="tickets" element={<TicketsList />} />
                        <Route path="tickets/:id" element={<TicketsEdit />} />
                        <Route
                            path="tickets/create"
                            element={<TicketsCreate data={data} setData={setData} />}
                        />
                        {/* ...........owners-requests.......... */}
                        <Route
                            path="owners-requests/create"
                            element={<OwnersRequestCreate data={data} setData={setData} />}
                        />
                        <Route path="owners-requests" element={<RecordList mode="request" requesterType="owner"/>} />
                        <Route path="owners-requests/:id" element={<RecordEdit mode="request"/>} />
                        {/* ...........customers-requests.......... */}

                        <Route path="customers-requests" element={<RecordList mode="request" requesterType="customer"/>} />
                        <Route path="customers-requests/:id" element={<RecordEdit mode="request"/>} />

                        {/* ...........Views.......... */}

                        <Route path="views" element={<WorkflowPage section="visits"/>} />
                        <Route path="views/:id" element={<WorkflowPage section="visits"/>} />
                        {/* ...........follow-ups.......... */}

                        <Route path="follow-ups" element={<FollowUpsList />} />
                        <Route path="follow-ups/:id" element={<FollowUpsEdit />} />
                        {/* ...........Contracts.......... */}

                        <Route path="contracts" element={<ContractsList />} />
                        <Route path="contracts/:id" element={<ContractsEdit />} />
                        {/* ...........archives.......... */}

                        <Route path="archives" element={<WorkflowPage section="archive"/>} />
                        <Route path="archives/:id" element={<WorkflowPage section="archive"/>} />
                        {/* ...........Tasks.......... */}
                        <Route
                            path="tasks/create"
                            element={<TasksCreate data={data} setData={setData} />}
                        />
                        <Route path="tasks" element={<TasksList />} />
                        <Route path="tasks/:id" element={<TasksEdit />} />
                    <Route path="*" element={<Alert severity="info" action={<Button onClick={()=>navigate('/dashboard')}>پیشخوان</Button>}>صفحه موردنظر پیدا نشد. مسیر را بررسی کنید.</Alert>}/></Routes></Suspense>
                </Box>
            </Box>
        </FeatureRouteGuard></MainLayout></RealtimeProvider></FavoritesProvider></PanelSettingsProvider>
        </CurrentUserContext.Provider>
    )
}
