# Create .env file with RAPID_API_KEY variable, take it via link:
https://rapidapi.com/GeocodeSupport/api/forward-reverse-geocoding/
# Build 
docker build -t weather-app .
# Run
docker run -d -p 3000:3000 --name weather-server weather-app
# Test
docker exec weather-server npm test
