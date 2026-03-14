# 🚂 Деплой на Railway (без Cloudflare)

Один сервер (Node.js): раздаёт сайт и держит WebSocket-комнаты. Никаких токенов и Durable Objects — только Railway.

---

## Вариант 1: Локальный запуск (проверить перед деплоем)

```powershell
cd "c:\Users\kim67\OneDrive\Рабочий стол\telefonchik"

# Собрать клиент
cd client
npm install
npm run build
cd ..

# Установить зависимости сервера и запустить
cd server
npm install
cd ..
node server/server.js
```

Откройте в браузере: **http://localhost:3000** — игра должна открыться, можно создать комнату и зайти с другой вкладки.

---

## Вариант 2: Деплой на Railway

### Шаг 1. Аккаунт Railway

- Зайдите на [railway.app](https://railway.app), войдите через GitHub (бесплатно).

### Шаг 2. Новый проект

1. **New Project** → **Deploy from GitHub repo**.
2. Выберите репозиторий с проектом «Телефончик» (если нет — сначала залейте код на GitHub).
3. Если репозитория нет — выберите **Empty Project**, потом подключите GitHub или загрузите через **Railway CLI**.

### Шаг 3. Настройки сборки и запуска

В настройках сервиса (Settings → Build / Deploy) укажите:

| Поле | Значение |
|------|----------|
| **Build Command** | `npm run build:railway` |
| **Start Command** | `npm start` |
| **Root Directory** | оставьте пустым |

Корневой `package.json` уже содержит эти скрипты: они соберут клиент, установят зависимости сервера и запустят его.

### Шаг 4. Переменные окружения

Обычно не нужны. Порт Railway подставит сам через `process.env.PORT`.

### Шаг 5. Деплой

- При деплое из GitHub — просто сделайте **push** в ветку, с которой связан проект.
- Railway соберёт проект и запустит `node server/server.js`.
- В разделе **Settings** → **Networking** нажмите **Generate Domain** — получите ссылку вида `https://ваш-проект.up.railway.app`.

### Шаг 6. Проверка

Откройте выданный URL в браузере: должен открыться «Телефончик», создание комнаты и вход по коду работают через тот же домен (WebSocket идёт на тот же хост).

---

## Если репозитория на GitHub ещё нет

1. Создайте репозиторий на GitHub.
2. В папке проекта выполните:
   ```powershell
   cd "c:\Users\kim67\OneDrive\Рабочий стол\telefonchik"
   git init
   git add .
   git commit -m "Telefonchik"
   git branch -M main
   git remote add origin https://github.com/ВАШ_ЛОГИН/telefonchik.git
   git push -u origin main
   ```
3. В Railway выберите **Deploy from GitHub** и этот репозиторий.

---

## Кратко

- **Локально:** собрать клиент, запустить `node server/server.js` — игра на http://localhost:3000.
- **Railway:** один проект, Build = сборка клиента + установка server, Start = `node server/server.js`, выдать домен — игра в интернете по одной ссылке, без Cloudflare и токенов.
