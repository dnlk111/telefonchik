# 📘 Туториал: как загрузить «Телефончик» на Cloudflare

Пошаговая инструкция по развёртыванию игры на **Cloudflare Pages** (фронт) и **Cloudflare Workers** (бэкенд с Durable Objects и WebSocket).

---

## Что понадобится

- **Node.js** 18+ и **npm**
- Аккаунт **Cloudflare** (бесплатный): [dash.cloudflare.com](https://dash.cloudflare.com)
- Терминал (PowerShell, cmd или Git Bash на Windows)

---

## Шаг 1. Установка зависимостей

Откройте терминал в папке проекта `telefonchik` и установите зависимости для клиента и воркера:

```powershell
cd client
npm install
cd ..\worker
npm install
cd ..
```

---

## Шаг 2. Вход в Cloudflare (Wrangler)

Установите Wrangler глобально (если ещё не установлен) и войдите в аккаунт Cloudflare:

```powershell
npm install -g wrangler
wrangler login
```

Откроется браузер — войдите в Cloudflare. После успешного входа в терминале появится подтверждение.

---

## Шаг 3. Деплой Worker (бэкенд с комнатами и WebSocket)

Worker отвечает за комнаты, WebSocket и Durable Objects. Деплой из папки `worker`:

```powershell
cd worker
wrangler deploy
cd ..
```

В конце команды вы увидите что-то вроде:

```
Published telefonchik-worker (X.XX sec)
  https://telefonchik-worker.ВАШ-ПОДДОМЕН.workers.dev
```

**Скопируйте этот URL** — он понадобится для настройки фронта. Это адрес вашего бэкенда (например: `https://telefonchik-worker.abc123.workers.dev`).

---

## Шаг 4. Настройка URL Worker для фронта

Фронт должен подключаться к Worker по WebSocket. Нужно указать его адрес при сборке.

1. В папке **client** создайте файл **`.env.production`** (если его нет):

```powershell
cd client
```

2. Откройте файл `.env.production` в редакторе и добавьте строку (подставьте **свой** URL воркера):

```
VITE_WS_URL=wss://telefonchik-worker.ВАШ-ПОДДОМЕН.workers.dev
```

Важно:
- Используйте **wss://** (не ws://), так как на Cloudflare всё идёт по HTTPS.
- Без пробелов и кавычек: `VITE_WS_URL=wss://...`

Пример:
```
VITE_WS_URL=wss://telefonchik-worker.abc123.workers.dev
```

Сохраните файл и выйдите из папки client:

```powershell
cd ..
```

---

## Шаг 5. Сборка фронта

Соберите production-версию клиента:

```powershell
cd client
npm run build
cd ..
```

В папке `client/dist` появится готовый сайт (HTML, CSS, JS).

---

## Шаг 6. Деплой на Cloudflare Pages

### Вариант A: через Wrangler (быстро, с вашего компьютера)

Из корня проекта:

```powershell
cd client
wrangler pages deploy dist --project-name=telefonchik
cd ..
```

При **первом** деплое Wrangler спросит:

```
? Create the project "telefonchik"? (y/n)
```

Введите **y** и нажмите Enter.

После деплоя вы увидите URL вида:

```
Successfully deployed telefonchik
  https://telefonchik.ВАШ-ПОДДОМЕН.pages.dev
```

Это и есть адрес вашей игры.

---

### Вариант B: через Git (автодеплой при push)

1. Заливайте проект в **GitHub** (или GitLab).
2. Зайдите в [Cloudflare Dashboard](https://dash.cloudflare.com) → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
3. Выберите репозиторий и нажмите **Begin setup**.
4. Укажите настройки сборки:
   - **Project name:** `telefonchik` (или любое)
   - **Production branch:** `main` (или ваша основная ветка)
   - **Build command:** `cd client && npm install && npm run build`
   - **Build output directory:** `client/dist`
5. В **Environment variables** добавьте переменную:
   - **Variable name:** `VITE_WS_URL`
   - **Value:** `wss://telefonchik-worker.ВАШ-ПОДДОМЕН.workers.dev`
   - **Environment:** Production (и при желании Preview)
6. Нажмите **Save and Deploy**.

При следующих push в выбранную ветку Pages будет собирать и деплоить проект автоматически.

---

## Шаг 7. Проверка

1. Откройте в браузере URL Pages: `https://telefonchik.ВАШ-ПОДДОМЕН.pages.dev`
2. Введите ник и цвет, нажмите «Продолжить».
3. Нажмите «Создать комнату» — должен появиться код комнаты и лобби.
4. Откройте ту же ссылку в другой вкладке (или на телефоне), введите тот же код и нажмите «Войти».
5. В лобби нажмите «Начать игру» — должна начаться игра с таймером и холстом.

Если что-то не работает — см. раздел «Частые проблемы» ниже.

---

## Шаг 8. (По желанию) Свой домен

### Домен для сайта (Pages)

1. В Dashboard: **Workers & Pages** → ваш проект **telefonchik** (Pages).
2. Вкладка **Custom domains** → **Set up a custom domain**.
3. Введите домен (например `igra.ваш-сайт.ru`) и следуйте подсказкам (DNS записи Cloudflare предложит добавить сам, если домен на Cloudflare).

### Домен для Worker (если нужен один домен для всего)

Можно сделать так, чтобы и сайт, и API/WebSocket были на одном домене (например `telefonchik.ваш-сайт.ru`). Для этого нужно настроить маршруты и, при необходимости, один Worker, который отдаёт статику и проксирует запросы в Durable Objects. Это уже продвинутая настройка; для начала достаточно двух URL: отдельно Pages и отдельно Worker.

---

## Обновление проекта

### Обновить только фронт

```powershell
cd client
npm run build
wrangler pages deploy dist --project-name=telefonchik
cd ..
```

### Обновить только Worker

```powershell
cd worker
wrangler deploy
cd ..
```

### Обновить всё

```powershell
cd client
npm run build
cd ..\worker
wrangler deploy
cd ..\client
wrangler pages deploy dist --project-name=telefonchik
cd ..
```

---

## Частые проблемы

### «Ошибка подключения» / WebSocket не подключается

- Убедитесь, что в **client** при сборке задана переменная **VITE_WS_URL** с **wss://** и вашим URL воркера (без слэша в конце).
- Пересоберите фронт после изменения `.env.production`: `npm run build`, затем снова задеплойте Pages.

### «Invalid room code» / комната не находится

- Убедитесь, что деплой Worker прошёл без ошибок (`wrangler deploy` в папке `worker`).
- Проверьте, что в консоли браузера (F12 → Network → WS) запрос уходит на ваш Worker (wss://...workers.dev).

### После деплоя старый вариант сайта

- Сделайте жёсткое обновление страницы: **Ctrl+Shift+R** (или Cmd+Shift+R на Mac).
- В Pages при деплое через Git подождите 1–2 минуты после push.

### Wrangler просит платный план

- Durable Objects на бесплатном плане имеют лимиты, но для разработки и небольших игр их обычно хватает.
- Если появятся ограничения — в Dashboard в разделе Workers & Pages будет указано, что нужно включить.

---

## Краткая шпаргалка команд

| Действие              | Команда |
|-----------------------|--------|
| Вход в Cloudflare     | `wrangler login` |
| Деплой Worker         | `cd worker` → `wrangler deploy` |
| Сборка фронта         | `cd client` → `npm run build` |
| Деплой Pages          | `cd client` → `wrangler pages deploy dist --project-name=telefonchik` |

После выполнения шагов 1–7 игра будет доступна по ссылке вашего проекта на Cloudflare Pages.
