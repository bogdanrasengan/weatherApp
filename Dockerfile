# Используем официальный образ Node.js как базовый образ
FROM node:16

# Установливаем рабочую директорию в контейнере
WORKDIR /usr/src/app

# Копируем файлы package.json и package-lock.json
COPY package*.json ./

# Установливаем зависимости
RUN npm install

# Копируем все файлы проекта в рабочую директорию
COPY . .

# Открываем порт
EXPOSE 3000

# Запуск приложения или тестов
CMD ["npm", "start"]
