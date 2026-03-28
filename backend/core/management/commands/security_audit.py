from django.core.management import BaseCommand, call_command


class Command(BaseCommand):
    help = 'Runs baseline security checks for deployment readiness.'

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE('Running Django deployment security checks...'))
        call_command('check', '--deploy')

        self.stdout.write(self.style.NOTICE('Suggested recurring audit actions:'))
        self.stdout.write('- Run dependency vulnerability scans monthly (pip-audit or Safety).')
        self.stdout.write('- Review auth logs and failed login events weekly.')
        self.stdout.write('- Run external penetration testing before each major release.')
        self.stdout.write('- Verify GDPR requests (export/delete) SLA and evidence logs.')
        self.stdout.write(self.style.SUCCESS('Security audit command completed.'))
