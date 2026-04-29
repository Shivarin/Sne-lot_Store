# Снэплот на сервере Ubuntu (продакшен)

Краткая схема: **PostgreSQL** на той же машине (или отдельный хост), **uvicorn** слушает только `127.0.0.1`, снаружи — **nginx** (TLS, прокси на приложение). Статика и API отдаёт один процесс FastAPI из `app.main` (корень сайта = репозиторий `market/`).

## 1. Системные пакеты

```bash
sudo apt update
sudo apt install -y python3-venv python3-pip nginx postgresql postgresql-contrib certbot python3-certbot-nginx git
```

При желании вместо системного Postgres можно поднять только Docker на сервере — тогда достаточно `docker compose` из `backend/docker-compose.yml` и в `.env` указать `DATABASE_URL` на этот инстанс.

## 2. Код и виртуальное окружение

Пример пути: `/opt/snaplot/market` (владелец — отдельный пользователь, не root).

```bash
sudo mkdir -p /opt/snaplot
sudo chown "$USER":"$USER" /opt/snaplot
cd /opt/snaplot
git clone <ваш-репозиторий> market
cd market/backend
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

## 3. PostgreSQL (системный сервис)

```bash
sudo -u postgres psql -c "CREATE USER snaplot WITH PASSWORD 'сильный-пароль';"
sudo -u postgres psql -c "CREATE DATABASE snaplot OWNER snaplot;"
```

В `backend/.env`:

```env
DATABASE_URL=postgresql+psycopg://snaplot:сильный-пароль@127.0.0.1:5432/snaplot
SECRET_KEY=длинная-случайная-строка
STORE_PASSWORD=...
ADMIN_PASSWORD=...
```

Проверка миграции схемы: при первом запуске приложения выполняется `create_all` + `seed_if_empty`.

## 4. systemd (uvicorn без `--reload`)

Файл `/etc/systemd/system/snaplot-api.service` (пути поправьте под себя):

```ini
[Unit]
Description=Снэплот API + статика
After=network.target postgresql.service

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/opt/snaplot/market/backend
EnvironmentFile=/opt/snaplot/market/backend/.env
ExecStart=/opt/snaplot/market/backend/.venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000 --workers 2
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now snaplot-api
sudo systemctl status snaplot-api
```

`User=www-data` имеет смысл, если каталог `market` читаем для www-data (или заведите пользователя `snaplot` и выставьте права).

## 5. nginx

Проксирование всего трафика на uvicorn (и `/api/v1`, и статику). Пример сервера: `deploy/nginx-snaplot.conf.example`.

```bash
sudo cp /opt/snaplot/market/deploy/nginx-snaplot.conf.example /etc/nginx/sites-available/snaplot
sudo ln -sf /etc/nginx/sites-available/snaplot /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

TLS:

```bash
sudo certbot --nginx -d ваш-домен.ru
```

## 6. CORS и фронт

Если браузер открывает **тот же домен**, что и API (типичный случай с nginx → uvicorn), отдельная настройка CORS часто не нужна: запросы same-origin.

Если фронт на другом origin, задайте список в `backend/app/config.py` (`cors_origins`) или расширьте `Settings` под чтение из `.env` (в pydantic-settings для `list[str]` обычно задают JSON-массив в переменной окружения — см. документацию вашей версии).

Для отдельного API-поддомена в HTML можно задать `<meta name="api-base" content="https://api.ваш-домен.ru">` — см. `assets/js/core/api.js`.

## 7. Обновление релиза

```bash
cd /opt/snaplot/market
git pull
cd backend && source .venv/bin/activate && pip install -r requirements.txt
sudo systemctl restart snaplot-api
```

При смене моделей SQLAlchemy без Alembic: на проде лучше заранее прогнать миграции/скрипт изменения схемы; текущий проект создаёт таблицы через `create_all` при старте (новые таблицы появятся, изменение колонок вручную).
