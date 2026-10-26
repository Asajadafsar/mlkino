from rest_framework import serializers

from accounts.models import Announcement


class AnnouncementListSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    created_by_name = serializers.CharField(source="created_by.full_name", read_only=True)
    created_by_role = serializers.CharField(source="created_by.role", read_only=True)
    created_by_role_display = serializers.CharField(
        source="created_by.get_role_display", read_only=True
    )
    updated_by_name = serializers.CharField(source="updated_by.full_name", read_only=True)
    updated_by_role = serializers.CharField(source="updated_by.role", read_only=True)
    updated_by_role_display = serializers.CharField(
        source="updated_by.get_role_display", read_only=True
    )

    class Meta:
        model = Announcement
        fields = [
            "id",
            "title",
            "status",
            "status_display",
            "created_by_name",
            "created_by_role",
            "created_by_role_display",
            "updated_by_name",
            "updated_by_role",
            "updated_by_role_display",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields


class AnnouncementDetailSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    created_by_name = serializers.CharField(source="created_by.full_name", read_only=True)
    created_by_role = serializers.CharField(source="created_by.role", read_only=True)
    created_by_role_display = serializers.CharField(
        source="created_by.get_role_display", read_only=True
    )
    updated_by_name = serializers.CharField(source="updated_by.full_name", read_only=True)
    updated_by_role = serializers.CharField(source="updated_by.role", read_only=True)
    updated_by_role_display = serializers.CharField(
        source="updated_by.get_role_display", read_only=True
    )

    class Meta:
        model = Announcement
        fields = [
            "id",
            "title",
            "description",
            "link",
            "status",
            "status_display",
            "created_by_name",
            "created_by_role",
            "created_by_role_display",
            "updated_by_name",
            "updated_by_role",
            "updated_by_role_display",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "created_by_name",
            "created_by_role",
            "created_by_role_display",
            "updated_by_name",
            "updated_by_role",
            "updated_by_role_display",
            "created_at",
            "updated_at",
        ]


class AnnouncementCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Announcement
        fields = ["title", "description", "link", "status"]

    def validate_title(self, value):
        value = value.strip()
        if len(value) < 3:
            raise serializers.ValidationError("عنوان باید حداقل ۳ کاراکتر باشد.")
        return value

    def validate_description(self, value):
        value = value.strip()
        if len(value) < 5:
            raise serializers.ValidationError("توضیحات باید حداقل ۵ کاراکتر باشد.")
        return value


class AnnouncementUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Announcement
        fields = ["title", "description", "link", "status"]
        extra_kwargs = {
            "title": {"required": False},
            "description": {"required": False},
            "link": {"required": False},
            "status": {"required": False},
        }