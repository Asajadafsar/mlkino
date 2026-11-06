from django.core.management.base import BaseCommand
from panel.workflow_services import expire_due
class Command(BaseCommand):
    help='Expire due estate referrals and atomically advance the routing queue.'
    def add_arguments(self,parser):parser.add_argument('--limit',type=int,default=200)
    def handle(self,*args,**options):
        if not 1<=options['limit']<=5000:raise ValueError('limit must be between 1 and 5000')
        self.stdout.write(f"Expired and advanced {expire_due(options['limit'])} referrals")
