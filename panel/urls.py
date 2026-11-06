from .reporting_api import WorkflowReportsView
from .public_api import PublicCatalogView, PublicConfigView, PublicLocationsView, PublicMapTileView
from .workflow_api import (ContactsView, AssignmentsView, AssignmentRespondView, AssignmentReferView, OwnerSubmissionView, PropertyPublishView, FavoritesView, VisitSlotsView, VisitsView, OffersView, PropertyChatView, ArchiveView, RoutingSettingsView, BusinessRolesView, WorkflowOverviewView, ActivityAttachmentView, SavedFiltersView, PropertyContactView)
from .finance_api import FinancialSettingsView, CommissionCalculateView, FinancialDocumentView, FinancialPostView, LedgerView, FinancialReceiptView
from .role_api import UserRoleView
from .dashboard_estate_api import DashboardEstateView
from .analytics_api import EstateAnalyticsView
from .geography_admin import GeographyAdminView
from .estate_activity_api import EstateActivityListView, EstateActivityDetailView
from .geography_api import IranLocationsView, GeocodeView, MapTileView
from .property_api import PropertyListView, PropertyDetailView
from .call_config import CallConfigView

from django.urls import path
from panel import views
from .settings_api import PanelSettingsView

app_name = "panel"

from .settings_api import PanelAppearanceView

urlpatterns = [
    path('public/catalog/',PublicCatalogView.as_view()),
    path('public/catalog/<int:pk>/',PublicCatalogView.as_view()),
    path('public/config/',PublicConfigView.as_view()),
    path('public/locations/',PublicLocationsView.as_view()),
    path('public/tiles/<int:z>/<int:x>/<int:y>.png',PublicMapTileView.as_view()),
    path('workflows/reports/',WorkflowReportsView.as_view()),
    path('workflows/',WorkflowOverviewView.as_view()),
    path('workflows/activities/<int:pk>/attachment/',ActivityAttachmentView.as_view()),
    path('workflows/saved-filters/',SavedFiltersView.as_view()),
    path('workflows/saved-filters/<int:pk>/',SavedFiltersView.as_view()),
    path('workflows/contacts/',ContactsView.as_view()),
    path('workflows/contacts/<int:pk>/',ContactsView.as_view()),
    path('workflows/assignments/',AssignmentsView.as_view()),
    path('workflows/assignments/<int:pk>/respond/',AssignmentRespondView.as_view()),
    path('workflows/assignments/<int:pk>/refer/',AssignmentReferView.as_view()),
    path('workflows/owner-submissions/',OwnerSubmissionView.as_view()),
    path('workflows/properties/<int:pk>/publish/',PropertyPublishView.as_view()),
    path('workflows/properties/<int:pk>/contact/',PropertyContactView.as_view()),
    path('workflows/properties/<int:pk>/chat/',PropertyChatView.as_view()),
    path('workflows/favorites/',FavoritesView.as_view()),
    path('workflows/favorites/<int:pk>/',FavoritesView.as_view()),
    path('workflows/visit-slots/',VisitSlotsView.as_view()),
    path('workflows/visits/',VisitsView.as_view()),
    path('workflows/visits/<int:pk>/',VisitsView.as_view()),
    path('workflows/offers/',OffersView.as_view()),
    path('workflows/archive/',ArchiveView.as_view()),
    path('workflows/settings/',RoutingSettingsView.as_view()),
    path('workflows/roles/',BusinessRolesView.as_view()),
    path('workflows/financial-settings/',FinancialSettingsView.as_view()),
    path('workflows/commission/calculate/',CommissionCalculateView.as_view()),
    path('workflows/finance/',FinancialDocumentView.as_view()),
    path('workflows/finance/<int:pk>/',FinancialDocumentView.as_view()),
    path('workflows/finance/<int:pk>/post/',FinancialPostView.as_view()),
    path('workflows/finance/<int:pk>/receipt/',FinancialReceiptView.as_view()),
    path('workflows/ledger/',LedgerView.as_view()),

    path('users/<int:user_id>/role/',UserRoleView.as_view(),name='user-role-change'),
    path('dashboard/estate-overview/',DashboardEstateView.as_view(),name='dashboard-estate-overview'),
    path('dashboard/estate-analytics/',EstateAnalyticsView.as_view(),name='estate-analytics'),
    path('locations/manage/',GeographyAdminView.as_view(),name='geography-manage'),
    path('follow-ups/', EstateActivityListView.as_view(), {'kind':'follow-ups'}, name='estate-followups'),
    path('follow-ups/<int:pk>/', EstateActivityDetailView.as_view(), {'kind':'follow-ups'}, name='estate-followup'),
    path('contracts/', EstateActivityListView.as_view(), {'kind':'contracts'}, name='estate-contracts'),
    path('contracts/<int:pk>/', EstateActivityDetailView.as_view(), {'kind':'contracts'}, name='estate-contract'),
    path('locations/', IranLocationsView.as_view(), name='iran-locations'),
    path('locations/geocode/', GeocodeView.as_view(), name='geocode'),
    path('locations/tiles/<int:z>/<int:x>/<int:y>.png', MapTileView.as_view(), name='map-tile'),
    path('files/', PropertyListView.as_view(), {'kind':'file'}, name='property-files'),
    path('files/<int:pk>/', PropertyDetailView.as_view(), {'kind':'file'}, name='property-file'),
    path('requests/', PropertyListView.as_view(), {'kind':'request'}, name='property-requests'),
    path('requests/<int:pk>/', PropertyDetailView.as_view(), {'kind':'request'}, name='property-request'),
    path('appearance/', PanelAppearanceView.as_view(),name='panel-appearance'),
    path("settings/", PanelSettingsView.as_view(), name="panel-settings"),
    # اطلاعیه‌ها
    path(
        "announcements/",
        views.AnnouncementListCreateView.as_view(),
        name="announcement-list-create",
    ),
    path(
        "announcements/<int:announcement_id>/",
        views.AnnouncementDetailView.as_view(),
        name="announcement-detail",
    ),

    # مدیریت کاربران
    path(
        "users/groups/",
        views.PanelUserGroupsView.as_view(),
        name="user-groups",
    ),
    path(
        "users/",
        views.PanelUserListView.as_view(),
        name="user-list",
    ),
    path(
        "users/<int:user_id>/",
        views.PanelUserDetailView.as_view(),
        name="user-detail",
    ),

    # کارهای مهم امروز
    path(
        "tasks/recipients/",
        views.AgencyExpertsView.as_view(),
        name="task-recipients",
    ),
    path(
        "tasks/agency-experts/",
        views.AgencyExpertLinkView.as_view(),
        name="task-agency-expert-link",
    ),
    path(
        "tasks/agency-experts/<int:link_id>/",
        views.AgencyExpertLinkView.as_view(),
        name="task-agency-expert-delete",
    ),
    path(
        "tasks/",
        views.ImportantTaskListCreateView.as_view(),
        name="task-list-create",
    ),
    path(
        "tasks/assignments/<int:assignment_id>/",
        views.TaskAssignmentStatusView.as_view(),
        name="task-assignment-status",
    ),
    path(
        "tasks/<int:task_id>/",
        views.ImportantTaskDetailView.as_view(),
        name="task-detail",
    ),
    
path(
    "dashboard/",
    views.DashboardView.as_view(),
    name="panel-dashboard",
),

path(
    "dashboard/tasks/<int:assignment_id>/toggle/",
    views.DashboardTaskToggleView.as_view(),
    name="dashboard-task-toggle",
),

    path("users/<int:user_id>/impersonate/", views.StartImpersonationView.as_view(), name="impersonation-start"),
    path("impersonation/status/", views.ImpersonationStatusView.as_view(), name="impersonation-status"),
    path("impersonation/exit/", views.StopImpersonationView.as_view(), name="impersonation-exit"),
    path("impersonation/csrf/", views.ImpersonationCsrfView, name="impersonation-csrf"),
    # یادآوری‌های شخصی کاربر
    path("reminders/", views.ReminderListCreateView.as_view(), name="reminder-list-create"),
    path("reminders/<int:reminder_id>/", views.ReminderDetailView.as_view(), name="reminder-detail"),
    path("tickets/", views.TicketListCreateView.as_view(), name="ticket-list-create"),
    path("tickets/<int:ticket_id>/", views.TicketDetailView.as_view(), name="ticket-detail"),
    path("tickets/<int:ticket_id>/replies/", views.TicketReplyView.as_view(), name="ticket-reply"),
    path("tickets/<int:ticket_id>/status/", views.TicketStatusView.as_view(), name="ticket-status"),
    path("tickets/<int:ticket_id>/assign/", views.TicketAssignView.as_view(), name="ticket-assign"),
    path("activity-logs/", views.ActivityLogListView.as_view(), name="activity-log-list"),
    path("activity-logs/<int:log_id>/", views.ActivityLogDetailView.as_view(), name="activity-log-detail"),
    path('chats/call-config/', CallConfigView.as_view(), name='chat-call-config'),
    path('chats/contacts/', views.ChatContactsView.as_view(), name='chat-contacts'),
    path('chats/', views.ChatConversationListView.as_view(), name='chat-list'),
    path('chats/<int:chat_id>/', views.ChatConversationDetailView.as_view(), name='chat-detail'),
    path('chats/<int:chat_id>/messages/', views.ChatMessagesView.as_view(), name='chat-messages'),
    path('chats/<int:chat_id>/read/', views.ChatReadView.as_view(), name='chat-read'),
    path('chats/<int:chat_id>/messages/<int:message_id>/', views.ChatDeleteMessageView.as_view(), name='chat-message-delete'),
    path('chats/<int:chat_id>/messages/<int:message_id>/attachment/', views.ChatAttachmentDownloadView.as_view(), name='chat-attachment'),
    path('chats/<int:chat_id>/report/', views.ChatReportView.as_view(), name='chat-report'),
    path('chats/users/<int:user_id>/block/', views.ChatBlockView.as_view(), name='chat-block'),
    path('chats/reports/', views.AdminChatReportsView.as_view(), name='chat-reports'),
]
