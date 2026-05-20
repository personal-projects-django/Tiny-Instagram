# maktab119-TinyInstagram
python -m venv venv.
source venv/bin/activate.
venv\Scripts\activate .
pip install django djangorestframework pillow.
pip install -r requirements.txt .

django_project.

python manage.py makemigrations.
python manage.py migrate.
python manage.py createsuperuser.

run:

sudo systemctl start redis-server.
redis-cli ping.
celery -A src worker -l info.
frontend/npm run dev.
daphne -b 0.0.0.0 -p 8000 src.asgi:application.
