# Stock Viewer Backend API

Django REST API for fetching stock market data using Yahoo Finance.

## Features

- Get real-time stock information (price, volume, market cap, etc.)
- Fetch historical stock data (daily, weekly, monthly)
- Compare multiple stocks
- CORS enabled for frontend integration

## API Endpoints

### 1. Get Stock Information
```
GET /api/stocks/info/<ticker>/
```
Returns current stock information including price, volume, market cap, etc.

Example:
```bash
curl http://localhost:8000/api/stocks/info/NVDA/
```

Response:
```json
{
  "ticker": "NVDA",
  "name": "NVIDIA Corporation",
  "currentPrice": 190.17,
  "previousClose": 186.86,
  "change": 3.31,
  "changePercent": 1.77,
  "open": 182.86,
  "dayHigh": 191.01,
  "dayLow": 180.58,
  "volume": 186591856,
  "marketCap": 4637781917696,
  "currency": "USD"
}
```

### 2. Get Historical Data
```
GET /api/stocks/history/<ticker>/?period=<period>&interval=<interval>
```

Query Parameters:
- `period`: 1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max (default: 1y)
- `interval`: 1d, 1wk, 1mo (default: 1d)

Example:
```bash
curl "http://localhost:8000/api/stocks/history/NVDA/?period=1y&interval=1d"
```

Response:
```json
{
  "ticker": "NVDA",
  "period": "1y",
  "interval": "1d",
  "data": [
    {
      "date": "2024-01-15",
      "open": 184.8,
      "high": 184.87,
      "low": 177.29,
      "close": 179.83,
      "volume": 214450500
    },
    ...
  ]
}
```

### 3. Compare Multiple Stocks
```
POST /api/stocks/compare/
```

Request Body:
```json
{
  "tickers": ["NVDA", "AAPL", "GOOGL"],
  "period": "1y",
  "interval": "1d"
}
```

Example:
```bash
curl -X POST http://localhost:8000/api/stocks/compare/ \
  -H "Content-Type: application/json" \
  -d '{"tickers": ["NVDA", "AAPL"], "period": "1mo", "interval": "1wk"}'
```

Response:
```json
{
  "period": "1mo",
  "interval": "1wk",
  "stocks": [
    {
      "ticker": "NVDA",
      "name": "NVIDIA Corporation",
      "data": [
        {"date": "2024-10-13", "close": 183.22},
        {"date": "2024-10-20", "close": 186.26},
        ...
      ]
    },
    ...
  ]
}
```

## Installation

1. Create and activate virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Run migrations:
```bash
python manage.py migrate
```

4. Start the development server:
```bash
python manage.py runserver
```

The API will be available at `http://localhost:8000/`

## Configuration

### CORS Settings
By default, CORS is configured to allow requests from:
- `http://localhost:3000`
- `http://127.0.0.1:3000`

To modify CORS settings, edit `config/settings.py`:
```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
```

## Dependencies

- Django 5.2.8
- Django REST Framework 3.16.1
- django-cors-headers 4.9.0
- yfinance 0.2.66
- pandas 2.3.3

## Notes

- This API uses Yahoo Finance data through the `yfinance` library
- Data is fetched in real-time from Yahoo Finance (no caching)
- Free to use, no API key required
- Rate limiting depends on Yahoo Finance's policies
