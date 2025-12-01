from rest_framework import serializers
from .models import User, Transaction
import yfinance as yf
from datetime import datetime


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'date_joined']
        read_only_fields = ['id', 'date_joined']


class TransactionSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = Transaction
        fields = ['id', 'user', 'ticker', 'transaction_type', 'date', 'quantity', 'price', 'created_at', 'updated_at']
        read_only_fields = ['id', 'price', 'created_at', 'updated_at']

    def validate(self, data):
        """
        Validate transaction data and automatically fetch price from yfinance
        """
        ticker = data.get('ticker')
        date = data.get('date')

        if ticker and date:
            try:
                # Fetch stock data for the given date
                stock = yf.Ticker(ticker)
                # Get data around the transaction date
                hist = stock.history(start=date, end=date, interval='1d')

                if hist.empty:
                    # If no data on exact date, try to get the nearest available date
                    from datetime import timedelta
                    start_date = date - timedelta(days=7)
                    hist = stock.history(start=start_date, end=date, interval='1d')

                    if hist.empty:
                        raise serializers.ValidationError(
                            f"No stock data available for {ticker} around {date}"
                        )

                # Get the closing price
                data['price'] = round(hist['Close'].iloc[-1], 2)

            except Exception as e:
                raise serializers.ValidationError(
                    f"Failed to fetch price for {ticker}: {str(e)}"
                )

        return data


class TransactionCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating transactions without requiring user field in request
    """
    class Meta:
        model = Transaction
        fields = ['ticker', 'transaction_type', 'date', 'quantity']

    def validate(self, data):
        """
        Validate and fetch price
        """
        ticker = data.get('ticker')
        date = data.get('date')

        if ticker and date:
            try:
                stock = yf.Ticker(ticker)
                hist = stock.history(start=date, end=date, interval='1d')

                if hist.empty:
                    from datetime import timedelta
                    start_date = date - timedelta(days=7)
                    hist = stock.history(start=start_date, end=date, interval='1d')

                    if hist.empty:
                        raise serializers.ValidationError(
                            f"No stock data available for {ticker} around {date}"
                        )

                data['price'] = round(hist['Close'].iloc[-1], 2)

            except Exception as e:
                raise serializers.ValidationError(
                    f"Failed to fetch price for {ticker}: {str(e)}"
                )

        return data
