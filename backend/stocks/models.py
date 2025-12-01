from django.db import models
from django.contrib.auth.models import AbstractUser


class User(AbstractUser):
    """
    Custom User model for simple username-based authentication
    """
    # Using Django's built-in username field
    # No password required for this simple implementation

    def __str__(self):
        return self.username

    class Meta:
        db_table = 'users'


class Transaction(models.Model):
    """
    Model for storing stock transactions (buy/sell)
    """
    TRANSACTION_TYPES = [
        ('BUY', 'Buy'),
        ('SELL', 'Sell'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='transactions')
    ticker = models.CharField(max_length=10)
    transaction_type = models.CharField(max_length=4, choices=TRANSACTION_TYPES)
    date = models.DateField()
    quantity = models.IntegerField()
    price = models.DecimalField(max_digits=10, decimal_places=2)  # Price per share (automatically fetched)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} - {self.transaction_type} {self.quantity} {self.ticker} @ ${self.price}"

    class Meta:
        db_table = 'transactions'
        ordering = ['-date', '-created_at']
        indexes = [
            models.Index(fields=['user', 'ticker']),
            models.Index(fields=['user', 'date']),
        ]
