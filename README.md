# botjour
A telegram chatbot that allows students to save and view their homework

Using
------
1. Install latest  Node.JS and MongoDB community edition.
2. Create new bot in [Botfather](https://t.me/botfather). Create .env file in root folder and past this string: `TOKEN=you-token-here`.
3. If you database is not local, replace adress in modules>db_create.mjs on your database adress.
4. Check your contacts in index.mjs (function onMessageSwitcher).
5. Open Terminal in the root folder, enter `npm i`. When the installation complete, enter `npm start`.
6. Go to your bot and press start.

**WARNING!** Don't remove `node_modules` folder. It contains fixed `telegraf-media-group` module.

RU translation:
1. Установите последние версии Node.JS и MongoDB community edition.
2. Создайте нового бота в [Botfather](https://t.me/botfather). Создайте в корневой папке файл .env и вставьте следующую строку: `TOKEN=здесь-ваш-токен`.
3. Если база данных не локальная, замените адрес в modules>db_create.mjs на адрес базы данных.
4. Проверьте контактную информацию в index.mjs (function onMessageSwitcher).
5. Откройте терминал в корневой папке, введите `npm i`. Когда установка завершится, введите `npm start`.
6. Перейдите в бота и нажмите старт.

**ВНИМАНИЕ** Не удаляйте папку `node_modules`. Она содержит исправленный модуль `telegraf-media-group`.
