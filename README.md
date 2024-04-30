# Создаем образ
docker build -t weather-app .
# Запускаем контейнер
docker run -d -p 3000:3000 --name weather-server weather-app
# Запускам тесты
docker exec weather-server npm test
