# ICF-Anything

Tauri-приложение для поиска соответствий диагнозов с ICF-кодами, шкалами оценки (Scale) и процедурами (Procedures).

## Архитектура

- **Бэкенд**: Rust + Tauri v2 + SQLite (rusqlite)
- **Фронтенд**: TypeScript + React 19 + Vite

## Таблицы БД

| Таблица       | Поля                          |
|---------------|-------------------------------|
| `DiaToICF`    | Diagnosis, ICF                |
| `ICFToProcs`  | ICF, Diagnosis, Procedures    |
| `ICFToScale`  | ICF, Scale                    |

## Сборка и запуск

```bash
npm install
npm run tauri dev      # разработка
npm run tauri build    # продакшен-сборка
```

## Использование

1. При первом запуске `seed.db` со схемой таблиц встраивается в бинарник и автоматически распаковывается в директорию приложения.
2. Введите название диагноза в поле поиска — выпадающий список отфильтрует совпадения по мере ввода.
3. Выберите диагноз — отобразится таблица с ICF-кодами, шкалами и процедурами.

## Замена базы данных

Чтобы использовать свою БД, замените файл по пути:
- **Linux**: `~/.local/share/icf-anything/db/icf.db`
- **macOS**: `~/Library/Application Support/com.fqinglars.icf-anything/db/icf.db`
- **Windows**: `C:\Users\<user>\AppData\Roaming\com.fqinglars.icf-anything\db\icf.db`

Файл должен быть SQLite-базой с таблицами `DiaToICF`, `ICFToProcs`, `ICFToScale`.
