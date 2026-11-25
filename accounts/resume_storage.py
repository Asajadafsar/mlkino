from pathlib import Path

from django.conf import settings
from django.core.files.storage import FileSystemStorage
from django.utils.deconstruct import deconstructible
from django.utils.functional import cached_property


@deconstructible
class PrivateResumeStorage(FileSystemStorage):
    @cached_property
    def base_location(self):
        return str(Path(settings.MEDIA_ROOT).resolve().parent / 'private-resumes')

    def url(self, name):
        raise NotImplementedError('Resumes are delivered through the authenticated application endpoint.')
