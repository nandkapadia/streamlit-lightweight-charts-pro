# Code Recipes

Quick copy-paste code recipes for common use cases.

## Table of Contents

- [Basic Charts](#basic-charts)
- [Data Preparation](#data-preparation)
- [Styling](#styling)
- [Multiple Series](#multiple-series)
- [Indicators](#indicators)
- [Trading Visualizations](#trading-visualizations)
- [Real-Time Updates](#real-time-updates)
- [Performance](#performance)
- [Integration](#integration)

## Basic Charts

### Simple Line Chart

```python
import streamlit as st
from streamlit_lightweight_charts_pro import renderChart
import pandas as pd
import numpy as np

# Generate data
dates = pd.date_range('2023-01-01', periods=100)
values = 100 + np.cumsum(np.random.randn(100))

data = pd.DataFrame({'time': dates, 'value': values})

# Render
renderChart(data, title="Line Chart", height=400)
```

### Candlestick Chart

```python
# Generate OHLC data
dates = pd.date_range('2023-01-01', periods=100)
ohlc_data = []
base = 100

for date in dates:
    open_price = base + np.random.randn()
    close_price = open_price + np.random.randn() * 2
    high_price = max(open_price, close_price) + abs(np.random.randn())
    low_price = min(open_price, close_price) - abs(np.random.randn())

    ohlc_data.append({
        'time': date,
        'open': open_price,
        'high': high_price,
        'low': low_price,
        'close': close_price
    })
    base = close_price

df = pd.DataFrame(ohlc_data)
renderChart(df, seriesType='candlestick', height=500)
```

### Area Chart with Gradient

```python
renderChart(
    data,
    seriesType='area',
    lineColor='#2962FF',
    topColor='rgba(41, 98, 255, 0.4)',
    bottomColor='rgba(41, 98, 255, 0.0)',
    lineWidth=2,
    height=400
)
```

### Volume Histogram

```python
volume_data = pd.DataFrame({
    'time': dates,
    'value': np.random.randint(1000, 10000, 100),
    'color': ['#26a69a' if i % 2 == 0 else '#ef5350' for i in range(100)]
})

renderChart(volume_data, seriesType='histogram', height=200)
```

## Data Preparation

### Load from CSV

```python
# Read CSV
df = pd.read_csv('data.csv')

# Convert time column
df['time'] = pd.to_datetime(df['time'])

# Rename columns if needed
df = df.rename(columns={'date': 'time', 'price': 'value'})

renderChart(df)
```

### Resample Data (Downsample)

```python
# Resample 1-minute data to 1-hour
df_hourly = df.set_index('time').resample('1H').agg({
    'open': 'first',
    'high': 'max',
    'low': 'min',
    'close': 'last',
    'volume': 'sum'
}).reset_index()

renderChart(df_hourly, seriesType='candlestick')
```

### Filter Date Range

```python
# Filter to last 30 days
start_date = pd.Timestamp.now() - pd.Timedelta(days=30)
df_filtered = df[df['time'] >= start_date]

renderChart(df_filtered)
```

### Handle Missing Data

```python
# Forward fill missing values
df['value'] = df['value'].fillna(method='ffill')

# Or drop NaN rows
df_clean = df.dropna()

renderChart(df_clean)
```

## Styling

### Dark Theme

```python
renderChart(
    data,
    title="Dark Theme",
    height=500,
    layout={
        'background': {'color': '#1e222d'},
        'textColor': '#d1d4dc'
    },
    grid={
        'vertLines': {'color': 'rgba(42, 46, 57, 0.5)'},
        'horzLines': {'color': 'rgba(42, 46, 57, 0.5)'}
    },
    priceScale={'borderColor': '#2b2b43'},
    timeScale={'borderColor': '#2b2b43'}
)
```

### Custom Colors

```python
renderChart(
    data,
    seriesType='candlestick',
    upColor='#00ff00',
    downColor='#ff0000',
    borderUpColor='#00ff00',
    borderDownColor='#ff0000',
    wickUpColor='#00ff00',
    wickDownColor='#ff0000'
)
```

### Remove Grid Lines

```python
renderChart(
    data,
    grid={
        'vertLines': {'visible': False},
        'horzLines': {'visible': False}
    }
)
```

### Custom Font

```python
renderChart(
    data,
    layout={
        'fontFamily': 'Monaco, Courier, monospace',
        'fontSize': 14
    }
)
```

## Multiple Series

### Two Line Series

```python
series1 = pd.DataFrame({'time': dates, 'value': values1})
series2 = pd.DataFrame({'time': dates, 'value': values2})

renderChart(
    series1,
    lineColor='#2962FF',
    additionalSeries=[{
        'data': series2,
        'type': 'line',
        'options': {'color': '#FF6D00'}
    }]
)
```

### Price + Volume

```python
# Price chart
renderChart(df_ohlc, seriesType='candlestick', height=400, title="Price")

# Volume chart (separate)
renderChart(df_volume, seriesType='histogram', height=150, title="Volume")
```

### Three Series with Different Types

```python
renderChart(
    price_data,
    seriesType='line',
    additionalSeries=[
        {
            'data': ma_data,
            'type': 'line',
            'options': {'color': '#FF6D00', 'lineWidth': 1}
        },
        {
            'data': volume_data,
            'type': 'histogram',
            'options': {'priceScaleId': 'right'}
        }
    ]
)
```

## Indicators

### Simple Moving Average

```python
# Calculate SMA
df['sma_20'] = df['close'].rolling(20).mean()

# Create series
price = pd.DataFrame({'time': df['time'], 'value': df['close']})
sma = pd.DataFrame({'time': df['time'], 'value': df['sma_20']})

# Render
renderChart(
    price,
    lineColor='#2962FF',
    additionalSeries=[{
        'data': sma,
        'type': 'line',
        'options': {'color': '#FF6D00'}
    }]
)
```

### Bollinger Bands

```python
# Calculate Bollinger Bands
df['sma'] = df['close'].rolling(20).mean()
df['std'] = df['close'].rolling(20).std()
df['upper'] = df['sma'] + (df['std'] * 2)
df['lower'] = df['sma'] - (df['std'] * 2)

# Create series
price = pd.DataFrame({'time': df['time'], 'value': df['close']})
upper = pd.DataFrame({'time': df['time'], 'value': df['upper']})
middle = pd.DataFrame({'time': df['time'], 'value': df['sma']})
lower = pd.DataFrame({'time': df['time'], 'value': df['lower']})

# Render
renderChart(
    price,
    lineColor='#2962FF',
    additionalSeries=[
        {'data': upper, 'type': 'line', 'options': {'color': '#ef5350'}},
        {'data': middle, 'type': 'line', 'options': {'color': '#FF9800'}},
        {'data': lower, 'type': 'line', 'options': {'color': '#26a69a'}}
    ]
)
```

### RSI Indicator

```python
def calculate_rsi(prices, period=14):
    delta = prices.diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
    rs = gain / loss
    rsi = 100 - (100 / (1 + rs))
    return rsi

# Calculate
df['rsi'] = calculate_rsi(df['close'])

# Render RSI chart
rsi_data = pd.DataFrame({'time': df['time'], 'value': df['rsi']})

renderChart(
    rsi_data,
    title="RSI (14)",
    height=150,
    seriesType='line',
    lineColor='#9C27B0',
    priceScale={'scaleMargins': {'top': 0.1, 'bottom': 0.1}}
)
```

### MACD

```python
# Calculate MACD
df['ema_12'] = df['close'].ewm(span=12).mean()
df['ema_26'] = df['close'].ewm(span=26).mean()
df['macd'] = df['ema_12'] - df['ema_26']
df['signal'] = df['macd'].ewm(span=9).mean()
df['histogram'] = df['macd'] - df['signal']

# Render
macd_line = pd.DataFrame({'time': df['time'], 'value': df['macd']})
signal_line = pd.DataFrame({'time': df['time'], 'value': df['signal']})
hist = pd.DataFrame({'time': df['time'], 'value': df['histogram']})

renderChart(
    macd_line,
    title="MACD",
    height=150,
    lineColor='#2962FF',
    additionalSeries=[
        {'data': signal_line, 'type': 'line', 'options': {'color': '#FF6D00'}},
        {'data': hist, 'type': 'histogram', 'options': {'color': '#26a69a'}}
    ]
)
```

## Trading Visualizations

### Buy/Sell Signals

```python
# Define signals
signals = [
    {
        'time': df['time'].iloc[10],
        'position': 'belowBar',
        'color': '#26a69a',
        'shape': 'arrowUp',
        'text': 'BUY'
    },
    {
        'time': df['time'].iloc[30],
        'position': 'aboveBar',
        'color': '#ef5350',
        'shape': 'arrowDown',
        'text': 'SELL'
    }
]

renderChart(df, markers=signals, seriesType='candlestick')
```

### Support/Resistance Lines

```python
support_level = df['low'].min()
resistance_level = df['high'].max()

renderChart(
    df,
    seriesType='candlestick',
    priceLines=[
        {
            'price': support_level,
            'color': '#26a69a',
            'lineWidth': 2,
            'lineStyle': 'dashed',
            'title': 'Support'
        },
        {
            'price': resistance_level,
            'color': '#ef5350',
            'lineWidth': 2,
            'lineStyle': 'dashed',
            'title': 'Resistance'
        }
    ]
)
```

### P&L Visualization

```python
# Calculate cumulative P&L
df['returns'] = df['close'].pct_change()
df['cumulative_returns'] = (1 + df['returns']).cumprod() - 1
df['pnl'] = df['cumulative_returns'] * 10000  # Starting capital

pnl_data = pd.DataFrame({'time': df['time'], 'value': df['pnl']})

renderChart(
    pnl_data,
    title="Cumulative P&L",
    height=300,
    seriesType='area',
    lineColor='#26a69a',
    topColor='rgba(38, 166, 154, 0.4)',
    bottomColor='rgba(38, 166, 154, 0.0)'
)
```

## Real-Time Updates

### Simple Real-Time Chart

```python
import time

placeholder = st.empty()
data = df.iloc[:50].copy()  # Start with 50 rows

for i in range(50, len(df)):
    # Add new row
    data = pd.concat([data, df.iloc[[i]]])

    # Update chart
    with placeholder:
        renderChart(data, height=400)

    time.sleep(0.1)  # 100ms delay
```

### Real-Time with External Data

```python
import requests
import time

def fetch_latest_price():
    # Your API call here
    response = requests.get('https://api.example.com/price')
    return response.json()

placeholder = st.empty()
data_buffer = []

while True:
    # Fetch new data
    new_price = fetch_latest_price()

    data_buffer.append({
        'time': pd.Timestamp.now(),
        'value': new_price
    })

    # Keep last 100 points
    if len(data_buffer) > 100:
        data_buffer.pop(0)

    # Render
    df = pd.DataFrame(data_buffer)
    with placeholder:
        renderChart(df, height=400)

    time.sleep(1)  # 1 second updates
```

### Streaming WebSocket Data

```python
import websocket
import json
import threading

data_queue = []

def on_message(ws, message):
    price_data = json.loads(message)
    data_queue.append({
        'time': pd.Timestamp.now(),
        'value': price_data['price']
    })

# Start WebSocket in background
ws = websocket.WebSocketApp(
    "wss://stream.example.com",
    on_message=on_message
)
ws_thread = threading.Thread(target=ws.run_forever)
ws_thread.daemon = True
ws_thread.start()

# Render loop
placeholder = st.empty()
while True:
    if data_queue:
        df = pd.DataFrame(data_queue[-100:])  # Last 100 points
        with placeholder:
            renderChart(df, height=400)
    time.sleep(0.1)
```

## Performance

### Downsample Large Dataset

```python
# For datasets > 10,000 points
if len(df) > 10000:
    # Resample to hourly
    df = df.set_index('time').resample('1H').agg({
        'open': 'first',
        'high': 'max',
        'low': 'min',
        'close': 'last'
    }).reset_index()

renderChart(df, seriesType='candlestick')
```

### Pagination

```python
# Show last N points
N = 1000
df_recent = df.tail(N)

renderChart(df_recent)
```

### Conditional Rendering

```python
# Only render when data changes
if 'last_data_hash' not in st.session_state:
    st.session_state.last_data_hash = None

data_hash = hash(df.values.tobytes())

if data_hash != st.session_state.last_data_hash:
    renderChart(df)
    st.session_state.last_data_hash = data_hash
else:
    st.info("Using cached chart")
```

## Integration

### With Streamlit Sidebar

```python
# Sidebar controls
symbol = st.sidebar.selectbox("Symbol", ["AAPL", "GOOGL", "MSFT"])
timeframe = st.sidebar.selectbox("Timeframe", ["1D", "1W", "1M"])
chart_type = st.sidebar.radio("Chart Type", ["Line", "Candlestick"])

# Load data based on selection
df = load_data(symbol, timeframe)

# Render
series_type = 'line' if chart_type == "Line" else 'candlestick'
renderChart(df, seriesType=series_type, title=f"{symbol} - {timeframe}")
```

### With Streamlit Columns

```python
col1, col2 = st.columns([2, 1])

with col1:
    renderChart(df, height=500, title="Main Chart")

with col2:
    st.metric("Last Price", f"${df['close'].iloc[-1]:.2f}")
    st.metric("Change", f"{df['close'].pct_change().iloc[-1]*100:.2f}%")
    st.metric("Volume", f"{df['volume'].iloc[-1]:,.0f}")
```

### With Streamlit Tabs

```python
tab1, tab2, tab3 = st.tabs(["Chart", "Data", "Stats"])

with tab1:
    renderChart(df, height=500)

with tab2:
    st.dataframe(df)

with tab3:
    st.write("Statistics")
    st.write(df.describe())
```

### Multi-Page App

```python
# pages/chart.py
import streamlit as st
from streamlit_lightweight_charts_pro import renderChart

st.title("Charts")

# Use unique key
renderChart(df, height=500, key="chart_page_main")
```

## More Recipes

See also:
- [Trading Indicators](Trading-Indicators)
- [Real-Time Updates](Real-Time-Updates)
- [Performance Optimization](Performance-Optimization)
- [User Examples](User-Examples)
