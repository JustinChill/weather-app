import './index.css'

// DOM Elements
const searchForm = document.getElementById('search-form') as HTMLFormElement;
const searchInput = document.getElementById('search-input') as HTMLInputElement;
const todayContainer = document.querySelector('#today') as HTMLDivElement;
const forecastContainer = document.querySelector('#forecast') as HTMLDivElement;
const searchHistoryContainer = document.getElementById('history') as HTMLDivElement;
const heading = document.getElementById('search-title') as HTMLHeadingElement;
const weatherIcon = document.getElementById('weather-img') as HTMLImageElement;
const tempEl = document.getElementById('temp') as HTMLParagraphElement;
const windEl = document.getElementById('wind') as HTMLParagraphElement;
const humidityEl = document.getElementById('humidity') as HTMLParagraphElement;

// API Calls
const fetchWeather = async (cityName: string) => {
  try {
    const response = await fetch('/api/weather/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cityName }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch weather data');
    }

    const weatherData = await response.json();
    
    if (!Array.isArray(weatherData) || weatherData.length === 0) {
      throw new Error('Invalid weather data received');
    }

    renderCurrentWeather(weatherData[0]);
    renderForecast(weatherData.slice(1));
  } catch (error) {
    console.error('Error fetching weather:', error);
    // Show error to user
    if (todayContainer) {
      todayContainer.innerHTML = `<div class="alert alert-danger">${error instanceof Error ? error.message : 'Failed to fetch weather data'}</div>`;
    }
    if (forecastContainer) {
      forecastContainer.innerHTML = '';
    }
  }
};

const fetchSearchHistory = async () => {
  const response = await fetch('/api/weather/history', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  return response;
};

const deleteCityFromHistory = async (id: string) => {
  await fetch(`/api/weather/history/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  });
};

// Render Functions
const renderCurrentWeather = (weatherData: any) => {
  if (!weatherData) {
    console.error('No weather data provided');
    return;
  }

  const {
    city = 'Unknown City',
    date = 'Unknown Date',
    icon = '',
    iconDescription = 'Weather icon',
    tempF = 0,
    windSpeed = 0,
    humidity = 0
  } = weatherData;

  heading.textContent = `${city} (${date})`;
  weatherIcon.setAttribute('src', `https://openweathermap.org/img/w/${icon}.png`);
  weatherIcon.setAttribute('alt', iconDescription);
  weatherIcon.setAttribute('class', 'weather-img');
  heading.append(weatherIcon);
  tempEl.textContent = `Temp: ${tempF}°F`;
  windEl.textContent = `Wind: ${windSpeed} MPH`;
  humidityEl.textContent = `Humidity: ${humidity} %`;

  if (todayContainer) {
    todayContainer.innerHTML = '';
    todayContainer.append(heading, tempEl, windEl, humidityEl);
  }
};

const renderForecast = (forecast: any) => {
  const headingCol = document.createElement('div');
  const heading = document.createElement('h4');
  headingCol.setAttribute('class', 'col-12 items-start text-left');
  heading.textContent = '5-Day Forecast:';
  headingCol.append(heading);

  if (forecastContainer) {
    forecastContainer.innerHTML = '';
    forecastContainer.append(headingCol);
  }

  forecast.forEach(renderForecastCard);
};

const renderForecastCard = (weatherData: any) => {
  if (!weatherData) {
    console.error('No forecast data provided');
    return;
  }

  const {
    date = 'Unknown Date',
    icon = '',
    iconDescription = 'Weather icon',
    tempF = 0,
    windSpeed = 0,
    humidity = 0
  } = weatherData;

  const { col, cardTitle, weatherIcon, tempEl, windEl, humidityEl } = createForecastCard();

  cardTitle.textContent = date;
  weatherIcon.setAttribute('src', `https://openweathermap.org/img/w/${icon}.png`);
  weatherIcon.setAttribute('alt', iconDescription);
  tempEl.textContent = `Temp: ${tempF} °F`;
  windEl.textContent = `Wind: ${windSpeed} MPH`;
  humidityEl.textContent = `Humidity: ${humidity} %`;

  if (forecastContainer) {
    forecastContainer.append(col);
  }
};

const renderSearchHistory = async (searchHistory: any) => {
  const historyList = await searchHistory.json();

  if (searchHistoryContainer) {
    searchHistoryContainer.innerHTML = '';

    if (!historyList.length) {
      searchHistoryContainer.innerHTML = '<p class="text-center">No Previous Search History</p>';
    }

    historyList.reverse().forEach((city: any) => {
      const historyItem = buildHistoryListItem(city);
      searchHistoryContainer.append(historyItem);
    });
  }
};

// Helper Functions
const createForecastCard = () => {
  const col = document.createElement('div');
  const card = document.createElement('div');
  const cardBody = document.createElement('div');
  const cardTitle = document.createElement('h5');
  const weatherIcon = document.createElement('img');
  const tempEl = document.createElement('p');
  const windEl = document.createElement('p');
  const humidityEl = document.createElement('p');

  col.append(card);
  card.append(cardBody);
  cardBody.append(cardTitle, weatherIcon, tempEl, windEl, humidityEl);

  col.classList.add('col-auto');
  card.classList.add('forecast-card', 'card', 'text-white', 'bg-primary', 'grid');
  cardBody.classList.add('card-body', 'p-2');
  cardTitle.classList.add('card-title');
  tempEl.classList.add('card-text', 'text-base');
  windEl.classList.add('card-text', 'text-base');
  humidityEl.classList.add('card-text', 'text-base');

  return { col, cardTitle, weatherIcon, tempEl, windEl, humidityEl };
};

const createHistoryButton = (city: string) => {
  const btn = document.createElement('button');
  btn.setAttribute('type', 'button');
  btn.setAttribute('aria-controls', 'today forecast');
  btn.classList.add('history-btn', 'btn', 'btn-secondary', 'col-10');
  btn.textContent = city;
  return btn;
};

const createDeleteButton = () => {
  const delBtnEl = document.createElement('button');
  delBtnEl.setAttribute('type', 'button');
  delBtnEl.classList.add('fas', 'fa-trash-alt', 'delete-city', 'btn', 'btn-danger', 'col-2', 'ml-2');
  delBtnEl.addEventListener('click', handleDeleteHistoryClick);
  return delBtnEl;
};

const createHistoryDiv = () => {
  const div = document.createElement('div');
  div.classList.add('display-flex', 'gap-2', 'col-12', 'm-1');
  return div;
};

const buildHistoryListItem = (city: any) => {
  const newBtn = createHistoryButton(city.name);
  const deleteBtn = createDeleteButton();
  deleteBtn.dataset.city = JSON.stringify(city);
  const historyDiv = createHistoryDiv();
  historyDiv.append(newBtn, deleteBtn);
  return historyDiv;
};

// Event Handlers
const handleSearchFormSubmit = (event: Event) => {
  event.preventDefault();

  if (!searchInput.value) {
    throw new Error('City cannot be blank');
  }

  const search = searchInput.value.trim();
  fetchWeather(search).then(getAndRenderHistory);
  searchInput.value = '';
};

const handleSearchHistoryClick = (event: Event) => {
  const target = event.target as HTMLElement;
  if (target.matches('.history-btn')) {
    const city = target.textContent;
    if (city) {
      fetchWeather(city).then(getAndRenderHistory);
    }
  }
};

const handleDeleteHistoryClick = (event: Event) => {
  event.stopPropagation();
  const target = event.target as HTMLElement;
  const cityID = JSON.parse(target.getAttribute('data-city')!).id;
  deleteCityFromHistory(cityID).then(getAndRenderHistory);
};

// Initial Render
const getAndRenderHistory = () => fetchSearchHistory().then(renderSearchHistory);

searchForm?.addEventListener('submit', handleSearchFormSubmit);
searchHistoryContainer?.addEventListener('click', handleSearchHistoryClick);

getAndRenderHistory();