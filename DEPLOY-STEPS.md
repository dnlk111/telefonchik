# Быстрый деплой с API-токеном

Токен **никогда не коммитьте и не вставляйте в код** — только в переменную окружения в терминале.

---

## 1. Задать токен (в этом окне PowerShell)

```powershell
$env:CLOUDFLARE_API_TOKEN = "ВСТАВЬТЕ_СЮДА_НОВЫЙ_ТОКЕН"
```

Проверка входа:
```powershell
wrangler whoami
```
Должны увидеть свой email Cloudflare.

---

## 2. Задеплоить Worker

```powershell
cd "c:\Users\kim67\OneDrive\Рабочий стол\telefonchik\worker"
wrangler deploy
```

В конце будет строка вида:
```
https://telefonchik-worker.XXXX.workers.dev
```
**Скопируйте этот URL** (с https://).

---

## 3. Создать .env.production у клиента

В папке `client` создайте файл **.env.production** с одной строкой (подставьте свой URL из шага 2, замените https на wss):

```
VITE_WS_URL=wss://telefonchik-worker.XXXX.workers.dev
```

Без пробелов, без кавычек, без слэша в конце.

---

## 4. Собрать и загрузить сайт (Pages)

```powershell
cd "c:\Users\kim67\OneDrive\Рабочий стол\telefonchik\client"
npm run build
wrangler pages deploy dist --project-name=telefonchik
```

При первом деплое на вопрос "Create the project?" ответьте **y**.

В конце будет ссылка вида:
```
https://telefonchik.XXXX.pages.dev
```
Это и есть ваша игра — откройте в браузере.

---

## Важно

- Токен действует только в **текущей сессии** терминала. Закрыли окно — для следующего деплоя снова выполните шаг 1.
- Если токен был показан кому-то (например в чате) — отзовите его в [Cloudflare API Tokens](https://dash.cloudflare.com/profile/api-tokens) и создайте новый.
