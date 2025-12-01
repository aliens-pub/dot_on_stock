from django.urls import path
from . import views

urlpatterns = [
    # Stock data endpoints
    path('info/<str:ticker>/', views.get_stock_info, name='stock-info'),
    path('history/<str:ticker>/', views.get_stock_history, name='stock-history'),
    path('compare/', views.compare_stocks, name='stock-compare'),

    # Authentication endpoints
    path('auth/login/', views.simple_login, name='auth-login'),
    path('auth/me/', views.get_current_user, name='auth-me'),
    path('auth/logout/', views.simple_logout, name='auth-logout'),

    # Transaction endpoints
    path('transactions/', views.transaction_list, name='transaction-list'),
    path('transactions/<int:pk>/', views.transaction_detail, name='transaction-detail'),
    path('transactions/portfolio/', views.portfolio_summary, name='portfolio-summary'),
]
