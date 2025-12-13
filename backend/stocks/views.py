from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from rest_framework import viewsets
from rest_framework.decorators import action
import yfinance as yf
from datetime import datetime, timedelta
import pandas as pd
from django.contrib.auth import login, logout
from django.db.models import Sum, Q
from django.http import HttpResponse
from decimal import Decimal
import csv
from .models import User, Transaction
from .serializers import UserSerializer, TransactionSerializer, TransactionCreateSerializer


@api_view(['GET'])
def get_stock_info(request, ticker):
    """
    Get basic stock information for a given ticker
    """
    try:
        stock = yf.Ticker(ticker)
        info = stock.info

        # Extract relevant information
        data = {
            'ticker': ticker.upper(),
            'name': info.get('longName', ticker),
            'currentPrice': info.get('currentPrice') or info.get('regularMarketPrice'),
            'previousClose': info.get('previousClose'),
            'open': info.get('open') or info.get('regularMarketOpen'),
            'dayHigh': info.get('dayHigh') or info.get('regularMarketDayHigh'),
            'dayLow': info.get('dayLow') or info.get('regularMarketDayLow'),
            'volume': info.get('volume') or info.get('regularMarketVolume'),
            'marketCap': info.get('marketCap'),
            'currency': info.get('currency', 'USD'),
        }

        # Calculate change and change percentage
        if data['currentPrice'] and data['previousClose']:
            data['change'] = data['currentPrice'] - data['previousClose']
            data['changePercent'] = (data['change'] / data['previousClose']) * 100

        return Response(data, status=status.HTTP_200_OK)

    except Exception as e:
        return Response(
            {'error': f'Failed to fetch stock data: {str(e)}'},
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['GET'])
def get_stock_history(request, ticker):
    """
    Get historical stock data for a given ticker
    Query parameters:
    - period: 1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max (default: 1y)
    - interval: 1d, 1wk, 1mo (default: 1d)
    """
    try:
        period = request.GET.get('period', '1y')
        interval = request.GET.get('interval', '1d')

        stock = yf.Ticker(ticker)
        hist = stock.history(period=period, interval=interval)

        if hist.empty:
            return Response(
                {'error': 'No data available for this ticker'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Convert DataFrame to list of dictionaries
        data = []
        for index, row in hist.iterrows():
            data.append({
                'date': index.strftime('%Y-%m-%d'),
                'open': round(row['Open'], 2),
                'high': round(row['High'], 2),
                'low': round(row['Low'], 2),
                'close': round(row['Close'], 2),
                'volume': int(row['Volume']),
            })

        return Response({
            'ticker': ticker.upper(),
            'period': period,
            'interval': interval,
            'data': data
        }, status=status.HTTP_200_OK)

    except Exception as e:
        return Response(
            {'error': f'Failed to fetch historical data: {str(e)}'},
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['POST'])
def compare_stocks(request):
    """
    Compare multiple stocks
    Request body: {
        "tickers": ["AAPL", "GOOGL", "MSFT"],
        "period": "1y",
        "interval": "1d"
    }
    """
    try:
        tickers = request.data.get('tickers', [])
        period = request.data.get('period', '1y')
        interval = request.data.get('interval', '1d')

        if not tickers:
            return Response(
                {'error': 'No tickers provided'},
                status=status.HTTP_400_BAD_REQUEST
            )

        result = []

        for ticker in tickers:
            try:
                stock = yf.Ticker(ticker)
                hist = stock.history(period=period, interval=interval)
                info = stock.info

                if not hist.empty:
                    data = []
                    for index, row in hist.iterrows():
                        data.append({
                            'date': index.strftime('%Y-%m-%d'),
                            'close': round(row['Close'], 2),
                        })

                    result.append({
                        'ticker': ticker.upper(),
                        'name': info.get('longName', ticker),
                        'data': data
                    })
            except Exception as e:
                # Skip failed tickers
                continue

        if not result:
            return Response(
                {'error': 'No valid data found for provided tickers'},
                status=status.HTTP_404_NOT_FOUND
            )

        return Response({
            'period': period,
            'interval': interval,
            'stocks': result
        }, status=status.HTTP_200_OK)

    except Exception as e:
        return Response(
            {'error': f'Failed to compare stocks: {str(e)}'},
            status=status.HTTP_400_BAD_REQUEST
        )


# Authentication APIs
@api_view(['POST'])
def simple_login(request):
    """
    Simple login - just username, creates user if doesn't exist
    """
    username = request.data.get('username')

    if not username:
        return Response(
            {'error': 'Username is required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Get or create user
    user, created = User.objects.get_or_create(username=username)

    # Store user_id in session
    request.session['user_id'] = user.id

    serializer = UserSerializer(user)
    return Response({
        'user': serializer.data,
        'message': 'Logged in successfully' if not created else 'User created and logged in'
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
def get_current_user(request):
    """
    Get current logged-in user
    """
    user_id = request.session.get('user_id')

    if not user_id:
        return Response(
            {'error': 'Not logged in'},
            status=status.HTTP_401_UNAUTHORIZED
        )

    try:
        user = User.objects.get(id=user_id)
        serializer = UserSerializer(user)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except User.DoesNotExist:
        return Response(
            {'error': 'User not found'},
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['POST'])
def simple_logout(request):
    """
    Logout user
    """
    request.session.flush()
    return Response({'message': 'Logged out successfully'}, status=status.HTTP_200_OK)


# Transaction APIs
@api_view(['GET', 'POST'])
def transaction_list(request):
    """
    GET: List all transactions for logged-in user
    POST: Create a new transaction
    """
    user_id = request.session.get('user_id')

    if not user_id:
        return Response(
            {'error': 'Not logged in'},
            status=status.HTTP_401_UNAUTHORIZED
        )

    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response(
            {'error': 'User not found'},
            status=status.HTTP_404_NOT_FOUND
        )

    if request.method == 'GET':
        # Get all transactions for user
        ticker = request.GET.get('ticker')
        if ticker:
            transactions = Transaction.objects.filter(user=user, ticker=ticker.upper())
        else:
            transactions = Transaction.objects.filter(user=user)

        serializer = TransactionSerializer(transactions, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    elif request.method == 'POST':
        # Create new transaction
        serializer = TransactionCreateSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save(user=user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
def transaction_detail(request, pk):
    """
    GET: Retrieve a transaction
    PUT: Update a transaction
    DELETE: Delete a transaction
    """
    user_id = request.session.get('user_id')

    if not user_id:
        return Response(
            {'error': 'Not logged in'},
            status=status.HTTP_401_UNAUTHORIZED
        )

    try:
        transaction = Transaction.objects.get(pk=pk, user_id=user_id)
    except Transaction.DoesNotExist:
        return Response(
            {'error': 'Transaction not found'},
            status=status.HTTP_404_NOT_FOUND
        )

    if request.method == 'GET':
        serializer = TransactionSerializer(transaction)
        return Response(serializer.data, status=status.HTTP_200_OK)

    elif request.method == 'PUT':
        serializer = TransactionCreateSerializer(transaction, data=request.data, partial=True)

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        transaction.delete()
        return Response({'message': 'Transaction deleted'}, status=status.HTTP_204_NO_CONTENT)


@api_view(['GET'])
def portfolio_summary(request):
    """
    Get portfolio summary for logged-in user
    """
    user_id = request.session.get('user_id')

    if not user_id:
        return Response(
            {'error': 'Not logged in'},
            status=status.HTTP_401_UNAUTHORIZED
        )

    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response(
            {'error': 'User not found'},
            status=status.HTTP_404_NOT_FOUND
        )

    # Get all transactions
    transactions = Transaction.objects.filter(user=user)

    # Calculate holdings by ticker
    holdings = {}
    for txn in transactions:
        if txn.ticker not in holdings:
            holdings[txn.ticker] = {
                'ticker': txn.ticker,
                'quantity': 0,
                'total_cost': Decimal('0.00'),
                'transactions': []
            }

        if txn.transaction_type == 'BUY':
            holdings[txn.ticker]['quantity'] += txn.quantity
            holdings[txn.ticker]['total_cost'] += Decimal(str(txn.price)) * txn.quantity
        else:  # SELL
            holdings[txn.ticker]['quantity'] -= txn.quantity
            holdings[txn.ticker]['total_cost'] -= Decimal(str(txn.price)) * txn.quantity

        holdings[txn.ticker]['transactions'].append({
            'id': txn.id,
            'type': txn.transaction_type,
            'date': txn.date,
            'quantity': txn.quantity,
            'price': float(txn.price)
        })

    # Calculate current values and prepare response
    portfolio = []
    total_invested = Decimal('0.00')
    total_current_value = Decimal('0.00')

    for ticker, holding in holdings.items():
        if holding['quantity'] > 0:  # Only include stocks still owned
            avg_price = holding['total_cost'] / holding['quantity'] if holding['quantity'] > 0 else Decimal('0.00')

            # Fetch current price
            try:
                stock = yf.Ticker(ticker)
                info = stock.info
                current_price = Decimal(str(info.get('currentPrice') or info.get('regularMarketPrice', 0)))
            except:
                current_price = Decimal('0.00')

            current_value = current_price * holding['quantity']
            profit_loss = current_value - holding['total_cost']
            profit_loss_percent = (profit_loss / holding['total_cost'] * 100) if holding['total_cost'] > 0 else Decimal('0.00')

            portfolio.append({
                'ticker': ticker,
                'quantity': holding['quantity'],
                'avg_price': float(avg_price),
                'current_price': float(current_price),
                'total_cost': float(holding['total_cost']),
                'current_value': float(current_value),
                'profit_loss': float(profit_loss),
                'profit_loss_percent': float(profit_loss_percent),
            })

            total_invested += holding['total_cost']
            total_current_value += current_value

    total_profit_loss = total_current_value - total_invested
    total_profit_loss_percent = (total_profit_loss / total_invested * 100) if total_invested > 0 else Decimal('0.00')

    return Response({
        'portfolio': portfolio,
        'summary': {
            'total_invested': float(total_invested),
            'total_current_value': float(total_current_value),
            'total_profit_loss': float(total_profit_loss),
            'total_profit_loss_percent': float(total_profit_loss_percent),
        }
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
def export_portfolio_csv(request):
    """
    Export portfolio data to CSV format
    """
    user_id = request.session.get('user_id')

    if not user_id:
        return Response(
            {'error': 'Not logged in'},
            status=status.HTTP_401_UNAUTHORIZED
        )

    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response(
            {'error': 'User not found'},
            status=status.HTTP_404_NOT_FOUND
        )

    # Get all transactions
    transactions = Transaction.objects.filter(user=user)

    # Calculate holdings by ticker
    holdings = {}
    for txn in transactions:
        if txn.ticker not in holdings:
            holdings[txn.ticker] = {
                'ticker': txn.ticker,
                'quantity': 0,
                'total_cost': Decimal('0.00'),
            }

        if txn.transaction_type == 'BUY':
            holdings[txn.ticker]['quantity'] += txn.quantity
            holdings[txn.ticker]['total_cost'] += Decimal(str(txn.price)) * txn.quantity
        else:  # SELL
            holdings[txn.ticker]['quantity'] -= txn.quantity
            holdings[txn.ticker]['total_cost'] -= Decimal(str(txn.price)) * txn.quantity

    # Create CSV response
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = f'attachment; filename="portfolio_{user.username}_{datetime.now().strftime("%Y%m%d")}.csv"'

    writer = csv.writer(response)
    writer.writerow(['Ticker', 'Quantity', 'Avg Price', 'Current Price', 'Total Cost', 'Current Value', 'Profit/Loss', 'Profit/Loss %'])

    for ticker, holding in holdings.items():
        if holding['quantity'] > 0:  # Only include stocks still owned
            avg_price = holding['total_cost'] / holding['quantity'] if holding['quantity'] > 0 else Decimal('0.00')

            # Fetch current price
            try:
                stock = yf.Ticker(ticker)
                info = stock.info
                current_price = Decimal(str(info.get('currentPrice') or info.get('regularMarketPrice', 0)))
            except:
                current_price = Decimal('0.00')

            current_value = current_price * holding['quantity']
            profit_loss = current_value - holding['total_cost']
            profit_loss_percent = (profit_loss / holding['total_cost'] * 100) if holding['total_cost'] > 0 else Decimal('0.00')

            writer.writerow([
                ticker,
                holding['quantity'],
                f"{float(avg_price):.2f}",
                f"{float(current_price):.2f}",
                f"{float(holding['total_cost']):.2f}",
                f"{float(current_value):.2f}",
                f"{float(profit_loss):.2f}",
                f"{float(profit_loss_percent):.2f}"
            ])

    return response
