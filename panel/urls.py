
from django.urls import path
from panel import views

app_name = "panel"

urlpatterns = [
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
    path("activity-logs/", views.ActivityLogListView.as_view(), name="activity-log-list"),
    path("activity-logs/<int:log_id>/", views.ActivityLogDetailView.as_view(), name="activity-log-detail"),
]
