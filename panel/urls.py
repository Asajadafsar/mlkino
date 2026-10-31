
from django.urls import path
from panel import views
from .settings_api import PanelSettingsView

app_name = "panel"

from .settings_api import PanelAppearanceView

urlpatterns = [
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
