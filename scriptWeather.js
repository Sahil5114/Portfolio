// Global variables
let currentCity = '';
let autoRefreshInterval = null;
let refreshCountdown = 30;

// Search functionality
document.getElementById('searchBtn').addEventListener('click', getWeather);
document.getElementById('locationBtn').addEventListener('click', getCurrentLocationWeather);
document.getElementById('cityInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        getWeather();
    }
});

function getWeather() {
    const city = document.getElementById('cityInput').value.trim();
    const resultDiv = document.getElementById('weatherResult');
    const alertDiv = document.getElementById('weatherAlert');
    
    if (!city) {
        resultDiv.innerHTML = '<p>Please enter a city name.</p>';
        return;
    }
    
    currentCity = city;
    resultDiv.innerHTML = '<p>Loading...</p>';
    alertDiv.style.display = 'none';
    
    fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=097f35c9ad3adf6b6dd0cb2a075a93a9&units=metric`)
        .then(async response => {
            if (!response.ok) {
                let errorMsg = 'City not found';
                try {
                    const errorData = await response.json();
                    if (errorData && errorData.message) {
                        errorMsg = errorData.message;
                    }
                } catch (e) {}
                throw new Error(errorMsg);
            }
            return response.json();
        })
        .then(data => {
            displayWeather(data);
            startAutoRefresh();
            updateWeatherAnimations(data.weather[0].main);
        })
        .catch(err => {
            resultDiv.innerHTML = `<p>Error: ${err.message}</p>`;
            stopAutoRefresh();
        });
}

function getCurrentLocationWeather() {
    const locationBtn = document.getElementById('locationBtn');
    const resultDiv = document.getElementById('weatherResult');
    const alertDiv = document.getElementById('weatherAlert');
    
    // Disable button and show loading
    locationBtn.disabled = true;
    locationBtn.textContent = '⏳';
    resultDiv.innerHTML = '<p>Getting your location...</p>';
    alertDiv.style.display = 'none';
    
    if (!navigator.geolocation) {
        resultDiv.innerHTML = '<p>Geolocation is not supported by your browser.</p>';
        locationBtn.disabled = false;
        locationBtn.textContent = '📍';
        return;
    }
    
    navigator.geolocation.getCurrentPosition(
        function(position) {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            
            resultDiv.innerHTML = '<p>Loading weather for your location...</p>';
            
            // Get weather by coordinates
            fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=097f35c9ad3adf6b6dd0cb2a075a93a9&units=metric`)
                .then(async response => {
                    if (!response.ok) {
                        let errorMsg = 'Failed to get weather data';
                        try {
                            const errorData = await response.json();
                            if (errorData && errorData.message) {
                                errorMsg = errorData.message;
                            }
                        } catch (e) {}
                        throw new Error(errorMsg);
                    }
                    return response.json();
                })
                .then(data => {
                    currentCity = data.name;
                    document.getElementById('cityInput').value = data.name;
                    displayWeather(data);
                    startAutoRefresh();
                    updateWeatherAnimations(data.weather[0].main);
                    locationBtn.disabled = false;
                    locationBtn.textContent = '📍';
                })
                .catch(err => {
                    resultDiv.innerHTML = `<p>Error: ${err.message}</p>`;
                    stopAutoRefresh();
                    locationBtn.disabled = false;
                    locationBtn.textContent = '📍';
                });
        },
        function(error) {
            let errorMessage = 'Unable to get your location.';
            switch(error.code) {
                case error.PERMISSION_DENIED:
                    errorMessage = 'Location access denied. Please allow location access and try again.';
                    break;
                case error.POSITION_UNAVAILABLE:
                    errorMessage = 'Location information unavailable.';
                    break;
                case error.TIMEOUT:
                    errorMessage = 'Location request timed out.';
                    break;
                case error.UNKNOWN_ERROR:
                    errorMessage = 'An unknown error occurred while getting location.';
                    break;
            }
            resultDiv.innerHTML = `<p>${errorMessage}</p>`;
            locationBtn.disabled = false;
            locationBtn.textContent = '📍';
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000
        }
    );
}

function displayWeather(data) {
    const weather = data.weather[0];
    const temp = data.main.temp;
    const humidity = data.main.humidity;
    const windSpeed = data.wind.speed;
    const pressure = data.main.pressure;
    
    const resultDiv = document.getElementById('weatherResult');
    const alertDiv = document.getElementById('weatherAlert');
    
    // Check for weather alerts
    let alertMessage = '';
    if (temp > 40) {
        alertMessage = '🌡️ High temperature alert! Stay hydrated.';
    } else if (temp < 0) {
        alertMessage = '❄️ Freezing temperature alert! Bundle up.';
    } else if (windSpeed > 20) {
        alertMessage = '💨 High wind alert! Be careful outdoors.';
    } else if (humidity > 80) {
        alertMessage = '💧 High humidity alert!';
    }
    
    if (alertMessage) {
        alertDiv.innerHTML = alertMessage;
        alertDiv.style.display = 'block';
    } else {
        alertDiv.style.display = 'none';
    }
    
    resultDiv.innerHTML = `
        <h2>${data.name}, ${data.sys.country}</h2>
        <p><img src="https://openweathermap.org/img/wn/${weather.icon}@2x.png" alt="${weather.description}"></p>
        <p><strong>${temp}&deg;C</strong></p>
        <p>${weather.main} - ${weather.description}</p>
        <div class="weather-details">
            <p>💧 Humidity: ${humidity}%</p>
            <p>💨 Wind: ${windSpeed} m/s</p>
            <p>📊 Pressure: ${pressure} hPa</p>
        </div>
    `;
}

function startAutoRefresh() {
    stopAutoRefresh(); // Clear any existing interval
    refreshCountdown = 30;
    updateRefreshStatus();
    
    autoRefreshInterval = setInterval(() => {
        refreshCountdown--;
        updateRefreshStatus();
        
        if (refreshCountdown <= 0) {
            if (currentCity) {
                getWeather();
            }
            refreshCountdown = 30;
        }
    }, 1000);
}

function stopAutoRefresh() {
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
        autoRefreshInterval = null;
    }
    document.getElementById('refreshStatus').textContent = 'Auto-refresh: Disabled';
}

function updateRefreshStatus() {
    document.getElementById('refreshStatus').textContent = `Auto-refresh: ${refreshCountdown}s`;
}

function updateWeatherAnimations(weatherType) {
    // Clear existing animations
    clearWeatherAnimations();
    
    // Add animations based on weather type
    switch(weatherType.toLowerCase()) {
        case 'rain':
        case 'drizzle':
            createRainAnimation();
            break;
        case 'snow':
            createSnowAnimation();
            break;
        case 'clouds':
        case 'mist':
        case 'fog':
            createCloudAnimation();
            break;
        default:
            // Clear weather for clear/sunny conditions
            break;
    }
}

function clearWeatherAnimations() {
    const rainContainer = document.getElementById('rainContainer');
    const snowContainer = document.getElementById('snowContainer');
    const cloudContainer = document.getElementById('cloudContainer');
    
    rainContainer.innerHTML = '';
    snowContainer.innerHTML = '';
    cloudContainer.innerHTML = '';
}

function createRainAnimation() {
    const container = document.getElementById('rainContainer');
    for (let i = 0; i < 50; i++) {
        const raindrop = document.createElement('div');
        raindrop.className = 'raindrop';
        raindrop.style.left = Math.random() * 100 + '%';
        raindrop.style.animationDelay = Math.random() * 2 + 's';
        container.appendChild(raindrop);
    }
}

function createSnowAnimation() {
    const container = document.getElementById('snowContainer');
    for (let i = 0; i < 30; i++) {
        const snowflake = document.createElement('div');
        snowflake.className = 'snowflake';
        snowflake.style.left = Math.random() * 100 + '%';
        snowflake.style.animationDelay = Math.random() * 3 + 's';
        container.appendChild(snowflake);
    }
}

function createCloudAnimation() {
    const container = document.getElementById('cloudContainer');
    for (let i = 0; i < 5; i++) {
        const cloud = document.createElement('div');
        cloud.className = 'cloud';
        cloud.style.top = Math.random() * 50 + 10 + '%';
        cloud.style.animationDelay = Math.random() * 8 + 's';
        container.appendChild(cloud);
    }
} 