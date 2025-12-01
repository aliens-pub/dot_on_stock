import React, { useEffect, useState } from 'react';
import {
  ComposedChart,
  Line,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import stockApi from '../services/stockApi';
import { StockChartProps, TransactionMarker, ChartDataPoint } from '../types';
import './StockChart.css';

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
}

const StockChart: React.FC<StockChartProps> = ({ data, loading, isAuthenticated, refreshTrigger }) => {
  const [transactionMarkers, setTransactionMarkers] = useState<TransactionMarker[]>([]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchTransactionMarkers();
    }
  }, [isAuthenticated, refreshTrigger]);

  const fetchTransactionMarkers = async (): Promise<void> => {
    try {
      const transactions = await stockApi.getTransactions();

      const markers: TransactionMarker[] = transactions.map(t => ({
        id: t.id,
        ticker: t.ticker,
        type: t.transaction_type,
        quantity: t.quantity,
        price: t.price,
        date: t.date,
        close: parseFloat(t.price)
      }));

      setTransactionMarkers(markers);
    } catch (err) {
      console.error('Error fetching transaction markers:', err);
    }
  };

  const processTransactions = (): TransactionMarker[] => {
    if (!data || data.length === 0) return [];

    const tickers = data.map(stock => stock.ticker);
    return transactionMarkers.filter(marker => {
      return tickers.includes(marker.ticker) && data.some(stock => {
        return stock.data.some(point => point.date === marker.date);
      });
    });
  };

  const processedMarkers = processTransactions();

  // Debug: Log transaction markers
  if (processedMarkers.length > 0) {
    console.log('거래 마커:', processedMarkers);
  }

  // Merge all data points with transaction markers
  const mergeDataWithTransactions = (): ChartDataPoint[] => {
    const allDates = new Set<string>();
    data.forEach(stock => {
      stock.data.forEach(point => allDates.add(point.date));
    });

    return Array.from(allDates).sort().map(date => {
      const point: ChartDataPoint = { date };

      // Add stock prices
      data.forEach(stock => {
        const stockPoint = stock.data.find(d => d.date === date);
        if (stockPoint) {
          point[stock.ticker] = stockPoint.close;
        }
      });

      // Add transaction markers
      const buyMarker = processedMarkers.find(m => m.date === date && m.type === 'BUY');
      const sellMarker = processedMarkers.find(m => m.date === date && m.type === 'SELL');

      if (buyMarker) {
        point.buyMarker = buyMarker.close;
        point.buyInfo = buyMarker;
      }
      if (sellMarker) {
        point.sellMarker = sellMarker.close;
        point.sellInfo = sellMarker;
      }

      return point;
    });
  };

  const chartData = mergeDataWithTransactions();

  // Debug: Check if buy/sell markers exist in chartData
  const buyCount = chartData.filter(d => d.buyMarker != null).length;
  const sellCount = chartData.filter(d => d.sellMarker != null).length;
  if (buyCount > 0 || sellCount > 0) {
    console.log(`차트 데이터에 매수 마커 ${buyCount}개, 매도 마커 ${sellCount}개 포함됨`);
  }

  const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as ChartDataPoint;

      // Check if this point has a transaction
      const buyInfo = data.buyInfo;
      const sellInfo = data.sellInfo;

      return (
        <div className="custom-tooltip">
          <p className="tooltip-date">{data.date}</p>
          {payload.map((entry, index) => {
            // Skip scatter plot entries (매수/매도 markers)
            if (entry.dataKey === 'buyMarker' || entry.dataKey === 'sellMarker') {
              return null;
            }

            // Only show if value is a valid number
            if (typeof entry.value === 'number' && !isNaN(entry.value)) {
              return (
                <p key={index} style={{ color: entry.color }}>
                  {entry.name}: ${entry.value.toFixed(2)}
                </p>
              );
            }
            return null;
          })}
          {buyInfo && (
            <div className="tooltip-transaction buy">
              <p><strong>매수</strong> - {buyInfo.ticker}</p>
              <p>{buyInfo.quantity}주 @ ${parseFloat(buyInfo.price).toFixed(2)}</p>
            </div>
          )}
          {sellInfo && (
            <div className="tooltip-transaction sell">
              <p><strong>매도</strong> - {sellInfo.ticker}</p>
              <p>{sellInfo.quantity}주 @ ${parseFloat(sellInfo.price).toFixed(2)}</p>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  // Custom diamond shape with larger size
  const renderDiamond = (props: any): React.ReactElement => {
    const { cx, cy, fill } = props;

    const size = 12; // Increased from default ~6-8 to 12

    // Check if coordinates are valid - return empty fragment instead of null
    if (cx == null || cy == null || isNaN(cx) || isNaN(cy)) {
      return <></>;
    }

    return (
      <path
        d={`M ${cx},${cy - size} L ${cx + size},${cy} L ${cx},${cy + size} L ${cx - size},${cy} Z`}
        fill={fill}
        stroke="#fff"
        strokeWidth={2}
      />
    );
  };

  return (
    <div className="chart-container">
      <ResponsiveContainer width="100%" height={500}>
        <ComposedChart
          data={chartData}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            type="category"
          />
          <YAxis />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          {data.map((stock, index) => (
            <Line
              key={stock.ticker}
              type="monotone"
              dataKey={stock.ticker}
              stroke={colors[index % colors.length]}
              name={stock.ticker}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6 }}
              connectNulls
            />
          ))}
          {processedMarkers.length > 0 && (
            <>
              <Scatter
                name="매수"
                dataKey="buyMarker"
                fill="#dc3545"
                shape={renderDiamond as any}
                legendType="diamond"
              />
              <Scatter
                name="매도"
                dataKey="sellMarker"
                fill="#007bff"
                shape={renderDiamond as any}
                legendType="diamond"
              />
            </>
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1', '#d084d0', '#a4de6c'];

export default StockChart;
