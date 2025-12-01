# Stock Viewer Frontend

React-based frontend for the Stock Viewer application. Allows users to search, compare, and visualize stock market data.

## Features

- Search and add multiple stocks by ticker symbol
- View real-time stock information (price, volume, market cap)
- Interactive stock price charts
- Compare multiple stocks on the same chart
- Switch between different time periods (1 month to max)
- Toggle between daily, weekly, and monthly data intervals

## Components

### Main Components
- **App.js**: Main application component with state management
- **SearchBar**: Input field for adding stock tickers
- **StockList**: Display list of selected stocks with remove functionality
- **StockInfo**: Show detailed information for each selected stock
- **TimeframeSelector**: Controls for selecting time period and interval
- **StockChart**: Recharts-based line chart for visualizing stock data

### Services
- **stockApi.js**: API service layer for communicating with Django backend

## Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

The app will open at `http://localhost:3000/`

## Usage

1. Enter a stock ticker symbol (e.g., NVDA, AAPL, GOOGL) in the search bar
2. Click "Add Stock" to add the stock to your watchlist
3. View detailed stock information in the stock cards
4. Use the timeframe selector to adjust the chart period and interval
5. Compare multiple stocks by adding more tickers
6. Remove stocks by clicking the × button

## Configuration

### Backend API URL
The frontend connects to the Django backend at `http://localhost:8000`. To change this, edit the `API_BASE_URL` in `src/services/stockApi.js`:

```javascript
const API_BASE_URL = 'http://localhost:8000/api/stocks';
```

## Dependencies

- **react**: ^18.x
- **axios**: HTTP client for API requests
- **recharts**: Chart library for data visualization

## Available Scripts

### `npm start`
Runs the app in development mode at [http://localhost:3000](http://localhost:3000)

### `npm run build`
Builds the app for production to the `build` folder

### `npm test`
Launches the test runner in interactive watch mode

## Notes

- Make sure the Django backend is running at `http://localhost:8000` before using the frontend
- Stock data is fetched from Yahoo Finance through the backend API
- The application uses CORS, which is configured in the Django backend settings
