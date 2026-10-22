# FxmlKino для TizenBrew

[English version](README.md)

**FxmlKino** показывает два киносайта, [HDRezka](https://kz.rezka.biz/) и [Kinogo](https://sim.kinogo.tm/),
на телевизорах Samsung Smart TV в виде страниц [Fork browser](https://wiki.forkbrowser.top/wiki/FXML) (FXML).

- Без рекламы и без регистрации.
- Выбор сезона, серии и озвучки, а также качества вплоть до 1080p, как на сайте.
- Сайты читает **сам телевизор**: ни компьютер, ни сервер не нужны. Если сайты открываются у вас
  на компьютере, то должны работать и на телевизоре.

Этот репозиторий — FxmlKino в виде **модуля [TizenBrew](https://github.com/reisxd/TizenBrew)**. С
TizenBrew не нужны ни подпись, ни ID устройства: модуль работает на любом телевизоре Samsung,
который поддерживает TizenBrew (2017 года и новее).

## Установка

1. **Установите TizenBrew** на телевизор (один раз) с помощью
   [TizenBrew Installer](https://github.com/reisxd/TizenBrewInstaller/releases/latest), по
   [инструкции TizenBrew](https://github.com/reisxd/TizenBrew/blob/main/docs/README.md).
2. **Откройте TizenBrew** на телевизоре и нажмите **зелёную** кнопку: откроется менеджер модулей.
3. Выберите **Add GitHub Module** и введите:
   ```
   bizhuka/FxmlKino-TizenBrew
   ```
4. На главном экране TizenBrew откройте **FxmlKino**.

TizenBrew запускает парсер FxmlKino в фоне при открытии модуля. Чтобы FxmlKino открывался сразу при
запуске TizenBrew, выберите его в **Settings → Autolaunch** TizenBrew.

## Без TizenBrew

Отдельное приложение со своим установщиком для Windows: [FxmlKino-TV](https://github.com/bizhuka/FxmlKino-TV).

## Файлы

| Файл | Назначение |
|---|---|
| `package.json` | Описание модуля для TizenBrew: страница приложения, сервис-парсер, кнопки пульта. |
| `index.html`, `js/`, `static/`, `icon.png` | Приложение: загрузчик Fork browser. |
| `service/index.js` | Парсер, который TizenBrew запускает на телевизоре (отвечает на `http://127.0.0.1:8787/`). |

Этот репозиторий собирается инструментом автора. Исходный код парсера здесь не публикуется.
