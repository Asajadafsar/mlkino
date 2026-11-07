from django.core.management.base import BaseCommand
from panel.workflow_services import expire_due,expire_visit_due
class Command(BaseCommand):
    help='Expire due estate referrals and atomically advance the routing queue.'
    def add_arguments(self,parser):parser.add_argument('--limit',type=int,default=200)
    def handle(self,*args,**options):
        if not 1<=options['limit']<=5000:raise ValueError('limit must be between 1 and 5000')
        referrals=expire_due(options['limit']);visits=expire_visit_due(options['limit'])
        self.stdout.write(f"Expired and advanced {referrals} referrals and {visits} visit assignments")
