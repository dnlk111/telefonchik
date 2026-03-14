# Телефончик

Клон игры **Gartic Phone** (2026) — рисуй и угадывай в реальном времени.

**Стек:** Cloudflare Pages (Vite + React 18 + TypeScript + Tailwind + Konva) + Cloudflare Workers + Durable Objects (WebSockets, состояние комнаты, таймеры).

📘 **Пошаговый туториал по загрузке на Cloudflare:** см. [TUTORIAL-CLOUDFLARE.md](./TUTORIAL-CLOUDFLARE.md)

---

## Структура проекта

```
telefonchik/
├── client/                 # Frontend (деплой на Cloudflare Pages)
│   ├── src/
│   │   ├── components/     # DrawingCanvas, DrawingToolbar, AdvancedSettingsModal
│   │   ├── screens/        # NickScreen, MenuScreen, LobbyScreen, GameScreen, GalleryScreen
│   │   ├── hooks/          # useRoomWs
│   │   ├── lib/            # ws URL helper
│   │   ├── types/          # game types
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── tsconfig.json
├── worker/                  # Backend (Cloudflare Workers + Durable Objects)
│   ├── src/
│   │   ├── index.ts        # Worker entry, маршрутизация /room/:code
│   │   ├── RoomDO.ts       # Durable Object: комната, WebSockets, таймеры, логика режимов
│   │   └── types.ts
│   ├── package.json
│   ├── wrangler.toml
│   └── tsconfig.json
├── package.json             # Корневой (скрипты dev/build/deploy)
└── README.md
```

---

## Как развернуть на Cloudflare Pages + Workers (пошагово 2026)

### 1. Установка зависимостей

```bash
cd telefonchik
npm install
cd client && npm install && cd ..
cd worker && npm install && cd ..
```

### 2. Локальная разработка

- Терминал 1 — Worker (WebSocket + DO):

```bash
cd worker
npx wrangler dev
```

Сервер поднимется на `http://localhost:8787`.

- Терминал 2 — клиент (Vite):

```bash
cd client
npm run dev
```

Клиент на `http://localhost:5173`. В `client/vite.config.ts` настроен proxy: запросы на `/room/*` и `/health` уходят на `localhost:8787`, поэтому WebSocket подключается к тому же хосту.

### 3. Вход в Cloudflare (Wrangler)

```bash
npx wrangler login
```

Откроется браузер для авторизации Cloudflare.

### 4. Деплой Worker (включая Durable Objects)

```bash
cd worker
npx wrangler deploy
```

После деплоя в выводе будет URL воркера, например:

`https://telefonchik-worker.<your-subdomain>.workers.dev`

Этот URL нужен для подключения WebSocket с фронта.

### 5. Bindings для Durable Objects

В `worker/wrangler.toml` уже задано:

```toml
[durable_objects]
bindings = [
  { name = "ROOMS", class_name = "RoomDO" }
]

[[migrations]]
tag = "v1"
new_classes = ["RoomDO"]
```

При первом `wrangler deploy` класс `RoomDO` создаётся. Менять `tag` и добавлять новые классы нужно только при миграциях.

### 6. Деплой клиента на Cloudflare Pages

**Вариант A — через Wrangler (рекомендуется для одного репо):**

```bash
cd client
npm run build
npx wrangler pages deploy dist --project-name=telefonchik
```

При первом деплое Wrangler спросит, создать ли проект Pages; укажите `yes`. Имя проекта задаётся как `telefonchik`.

**Вариант B — через Git (Cloudflare Dashboard):**

1. Залить репозиторий в GitHub/GitLab.
2. В [Cloudflare Dashboard](https://dash.cloudflare.com) → Pages → Create project → Connect to Git.
3. Выбрать репозиторий.
4. Настройки сборки:
   - **Root directory:** `client`
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
5. Сохранить и деплоить.

### 7. Custom domain (опционально)

- **Pages:** Dashboard → Pages → проект → Custom domains → Add domain.
- **Worker:** Workers & Pages → ваш worker → Triggers → Custom Domains → Add.

Если домен один и тот же (например `telefonchik.example.com`), настройте в DNS и в Workers роуты так, чтобы:
- `/*` вёл на Pages (или на Worker, который отдаёт статику и проксирует API/WS).

Либо оставьте два домена: отдельно Pages и Workers.

### 8. Переменная окружения для URL Worker (клиент)

Чтобы в продакшене клиент подключался к вашему Worker, задайте при сборке Pages переменную `VITE_WS_URL`:

- **Wrangler Pages:** в `wrangler.toml` для pages пока нельзя задать env для build; используйте `.env.production` в `client/`:
  ```
  VITE_WS_URL=wss://telefonchik-worker.<your-subdomain>.workers.dev
  ```
  и собирайте: `cd client && npm run build`.

- **Git + Dashboard:** в настройках проекта Pages → Settings → Environment variables → Add variable:
  - Name: `VITE_WS_URL`
  - Value: `wss://telefonchik-worker.<your-subdomain>.workers.dev`
  - Environment: Production (и Preview при необходимости).

В коде клиента (`client/src/lib/ws.ts`) используется:

`const WS_BASE = import.meta.env.VITE_WS_URL || (location.protocol === "https:" ? "wss:" : "ws:") + "//" + location.host`

То есть при наличии `VITE_WS_URL` WebSocket идёт на Worker; без неё — на тот же хост (удобно для dev с proxy).

### 9. Обновление после изменений

- **Только фронт:** заново собрать и задеплоить Pages (см. п. 6).
- **Только Worker/DO:** из папки `worker` выполнить `npx wrangler deploy`.
- **Всё сразу (из корня):**

```bash
npm run build
cd worker && npx wrangler deploy && cd ..
cd client && npx wrangler pages deploy dist --project-name=telefonchik
```

### 10. Проверка

1. Открыть URL Pages (или custom domain).
2. Ввести ник и цвет, создать комнату.
3. Скопировать код комнаты, открыть вторую вкладку/устройство и присоединиться по коду.
4. В лобби начать игру и убедиться, что ходы, таймер и галерея работают.

---

## Режимы игры (15)

| Режим | Кратко |
|-------|--------|
| **Normal** | Текст → рисунок → текст по цепочке. |
| **Knock-Off** | Только рисование, копирование предыдущего, таймер ускоряется. |
| **Animation** | Каждый добавляет кадр, в конце — воспроизведение (frame exposure и т.д.). |
| **Icebreaker** | Один вопрос, все рисуют ответ, галерея. |
| **Exquisite Corpse** | 3–4 части (голова/тело/ноги). |
| **Complement** | Один общий рисунок, по очереди дополняют. |
| **Masterpiece** | Один ход без таймера. |
| **Story** | Только текст по цепочке; опционально озвучка (Web Speech API). |
| **Missing Piece** | Неполный рисунок, добавляем и стираем части. |
| **Secret** | Ничего не видно до конца раунда. |
| **Co-op** | Все рисуют на одном холсте. |
| **Score** | Классика + очки/голосование. |
| **Sandwich** | Текст → несколько рисований → текст. |
| **Background** | Сначала общий фон, потом анимация. |
| **Solo** | Один игрок, анимация 5–20 кадров. |

Расширенные настройки (время хода, раунды, кол-во игроков, параметры режимов) задаются в лобби и сохраняются в комнате (DO).

---

## Лицензия

MIT.
