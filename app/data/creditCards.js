const creditCards=[
  {
    "bank": "HDFC",
    "cardName": "Millennia Credit Card",
    "network": "Visa",
    "cardType": "Cashback",
    "rewardType": "cashback",
    "baseRewardRate": 1,
    "categories": {
      "shopping": 5,
      "travel": 1,
      "fuel": 1,
      "dining": 2,
      "groceries": 2
    },
    "bestFor": ["Online Shopping", "Amazon", "Flipkart", "Myntra", "Cashback"],
    "rewardRateText": "5% cashback on Amazon, Flipkart, Myntra; 1% on all other spends",
    "perks": ["FUEL_WAIVER"],
    "fees": {
      "joining": 1000,
      "annual": 1000,
      "waiverSpend": 100000
    },
    "eligibility": {
      "minIncome": 35000,
      "minCreditScore": 700
    },
    "limits": {
      "max": 300000,
      "available": 300000
    },
    "billingDate": 5,
    "popularityScore": 95
  },
  {
    "bank": "HDFC",
    "cardName": "Regalia Gold",
    "network": "Visa",
    "cardType": "Travel",
    "rewardType": "points",
    "baseRewardRate": 4,
    "categories": {
      "shopping": 2,
      "travel": 4,
      "fuel": 1,
      "dining": 3,
      "groceries": 1
    },
    "bestFor": ["Travel", "Lounge Access", "International Travel", "Flight Bookings"],
    "rewardRateText": "4 reward points per ₹150 spent on travel; 2X on dining",
    "perks": ["LOUNGE_ACCESS", "TRAVEL_INSURANCE", "CONCIERGE"],
    "fees": {
      "joining": 2500,
      "annual": 2500,
      "waiverSpend": 300000
    },
    "eligibility": {
      "minIncome": 50000,
      "minCreditScore": 750
    },
    "limits": {
      "max": 600000,
      "available": 600000
    },
    "billingDate": 10,
    "popularityScore": 92
  },
  {
    "bank": "HDFC",
    "cardName": "Diners Club Black",
    "network": "Amex",
    "cardType": "Travel",
    "rewardType": "miles",
    "baseRewardRate": 5,
    "categories": {
      "shopping": 3,
      "travel": 5,
      "fuel": 2,
      "dining": 4,
      "groceries": 2
    },
    "bestFor": ["Premium Travel", "Luxury", "International Travel", "Miles"],
    "rewardRateText": "5X reward points on travel; 3X on dining & shopping",
    "perks": ["LOUNGE_ACCESS", "TRAVEL_INSURANCE", "CONCIERGE", "TRAVEL_VOUCHER"],
    "fees": {
      "joining": 10000,
      "annual": 10000,
      "waiverSpend": 800000
    },
    "eligibility": {
      "minIncome": 100000,
      "minCreditScore": 780
    },
    "limits": {
      "max": 1500000,
      "available": 1500000
    },
    "billingDate": 15,
    "popularityScore": 88
  },
  {
    "bank": "ICICI",
    "cardName": "Amazon Pay Credit Card",
    "network": "Visa",
    "cardType": "Shopping",
    "rewardType": "cashback",
    "baseRewardRate": 5,
    "categories": {
      "shopping": 5,
      "travel": 1,
      "fuel": 1,
      "dining": 1,
      "groceries": 2
    },
    "bestFor": ["Amazon", "Online Shopping", "Cashback", "Prime Members"],
    "rewardRateText": "5% cashback on Amazon; 1% on all other spends",
    "perks": ["AMAZON_PRIME"],
    "fees": {
      "joining": 0,
      "annual": 0,
      "waiverSpend": 0
    },
    "eligibility": {
      "minIncome": 18000,
      "minCreditScore": 650
    },
    "limits": {
      "max": 200000,
      "available": 200000
    },
    "billingDate": 7,
    "popularityScore": 98
  },
  {
    "bank": "ICICI",
    "cardName": "Coral Credit Card",
    "network": "Visa",
    "cardType": "Basic",
    "rewardType": "points",
    "baseRewardRate": 1,
    "categories": {
      "shopping": 1,
      "travel": 1,
      "fuel": 1,
      "dining": 1,
      "groceries": 1
    },
    "bestFor": ["First Time Users", "Basic Needs", "Low Income"],
    "rewardRateText": "1 reward point per ₹100 spent",
    "perks": [],
    "fees": {
      "joining": 0,
      "annual": 0,
      "waiverSpend": 0
    },
    "eligibility": {
      "minIncome": 15000,
      "minCreditScore": 600
    },
    "limits": {
      "max": 100000,
      "available": 100000
    },
    "billingDate": 12,
    "popularityScore": 75
  },
  {
    "bank": "ICICI",
    "cardName": "Emerald Private Metal",
    "network": "Visa",
    "cardType": "Travel",
    "rewardType": "miles",
    "baseRewardRate": 6,
    "categories": {
      "shopping": 4,
      "travel": 6,
      "fuel": 3,
      "dining": 5,
      "groceries": 3
    },
    "bestFor": ["Premium Travel", "Luxury", "International", "Miles"],
    "rewardRateText": "6X reward points on travel; 4X on dining & shopping",
    "perks": ["LOUNGE_ACCESS", "TRAVEL_INSURANCE", "CONCIERGE", "TRAVEL_VOUCHER", "BUSINESS_BENEFITS"],
    "fees": {
      "joining": 12500,
      "annual": 12500,
      "waiverSpend": 1000000
    },
    "eligibility": {
      "minIncome": 150000,
      "minCreditScore": 800
    },
    "limits": {
      "max": 2000000,
      "available": 2000000
    },
    "billingDate": 20,
    "popularityScore": 85
  },
  {
    "bank": "SBI",
    "cardName": "SimplyCLICK Credit Card",
    "network": "Visa",
    "cardType": "Shopping",
    "rewardType": "cashback",
    "baseRewardRate": 5,
    "categories": {
      "shopping": 5,
      "travel": 1,
      "fuel": 1,
      "dining": 2,
      "groceries": 3
    },
    "bestFor": ["Online Shopping", "Amazon", "Flipkart", "Cashback"],
    "rewardRateText": "5% cashback on online shopping; 1% on all other spends",
    "perks": ["MOVIE_OFFER"],
    "fees": {
      "joining": 499,
      "annual": 499,
      "waiverSpend": 100000
    },
    "eligibility": {
      "minIncome": 20000,
      "minCreditScore": 650
    },
    "limits": {
      "max": 150000,
      "available": 150000
    },
    "billingDate": 3,
    "popularityScore": 90
  },
  {
    "bank": "SBI",
    "cardName": "Elite Credit Card",
    "network": "Visa",
    "cardType": "Travel",
    "rewardType": "points",
    "baseRewardRate": 3,
    "categories": {
      "shopping": 2,
      "travel": 3,
      "fuel": 1,
      "dining": 2,
      "groceries": 1
    },
    "bestFor": ["Travel", "Lounge Access", "Domestic Travel"],
    "rewardRateText": "3 reward points per ₹100 spent on travel",
    "perks": ["LOUNGE_ACCESS", "TRAVEL_INSURANCE"],
    "fees": {
      "joining": 4999,
      "annual": 4999,
      "waiverSpend": 200000
    },
    "eligibility": {
      "minIncome": 60000,
      "minCreditScore": 750
    },
    "limits": {
      "max": 800000,
      "available": 800000
    },
    "billingDate": 8,
    "popularityScore": 87
  },
  {
    "bank": "SBI",
    "cardName": "BPCL Octane Credit Card",
    "network": "Visa",
    "cardType": "Fuel",
    "rewardType": "cashback",
    "baseRewardRate": 4,
    "categories": {
      "shopping": 1,
      "travel": 1,
      "fuel": 4,
      "dining": 1,
      "groceries": 1
    },
    "bestFor": ["Fuel", "BPCL", "Petrol", "Diesel", "Cashback"],
    "rewardRateText": "4% cashback on BPCL fuel; 0.25% on all other spends",
    "perks": ["FUEL_WAIVER"],
    "fees": {
      "joining": 0,
      "annual": 0,
      "waiverSpend": 0
    },
    "eligibility": {
      "minIncome": 25000,
      "minCreditScore": 650
    },
    "limits": {
      "max": 200000,
      "available": 200000
    },
    "billingDate": 18,
    "popularityScore": 82
  },
  {
    "bank": "Axis",
    "cardName": "Flipkart Axis Bank Credit Card",
    "network": "Visa",
    "cardType": "Shopping",
    "rewardType": "cashback",
    "baseRewardRate": 5,
    "categories": {
      "shopping": 5,
      "travel": 1,
      "fuel": 1,
      "dining": 1,
      "groceries": 2
    },
    "bestFor": ["Flipkart", "Online Shopping", "Cashback"],
    "rewardRateText": "5% cashback on Flipkart; 1.5% on other spends",
    "perks": [],
    "fees": {
      "joining": 500,
      "annual": 500,
      "waiverSpend": 20000
    },
    "eligibility": {
      "minIncome": 20000,
      "minCreditScore": 650
    },
    "limits": {
      "max": 150000,
      "available": 150000
    },
    "billingDate": 14,
    "popularityScore": 94
  },
  {
    "bank": "Axis",
    "cardName": "Magnus Credit Card",
    "network": "Visa",
    "cardType": "Travel",
    "rewardType": "miles",
    "baseRewardRate": 5,
    "categories": {
      "shopping": 3,
      "travel": 5,
      "fuel": 2,
      "dining": 4,
      "groceries": 2
    },
    "bestFor": ["Travel", "Lounge Access", "International", "Miles"],
    "rewardRateText": "5X reward points on travel; 3X on dining",
    "perks": ["LOUNGE_ACCESS", "TRAVEL_INSURANCE", "CONCIERGE"],
    "fees": {
      "joining": 10000,
      "annual": 10000,
      "waiverSpend": 1500000
    },
    "eligibility": {
      "minIncome": 180000,
      "minCreditScore": 780
    },
    "limits": {
      "max": 2000000,
      "available": 2000000
    },
    "billingDate": 22,
    "popularityScore": 89
  },
  {
    "bank": "Axis",
    "cardName": "Ace Credit Card",
    "network": "Visa",
    "cardType": "Cashback",
    "rewardType": "cashback",
    "baseRewardRate": 2,
    "categories": {
      "shopping": 2,
      "travel": 1,
      "fuel": 1,
      "dining": 2,
      "groceries": 2
    },
    "bestFor": ["Cashback", "Bill Payments", "Utilities", "Groceries"],
    "rewardRateText": "2% cashback on bill payments & utilities; 1% on other spends",
    "perks": [],
    "fees": {
      "joining": 0,
      "annual": 0,
      "waiverSpend": 0
    },
    "eligibility": {
      "minIncome": 15000,
      "minCreditScore": 600
    },
    "limits": {
      "max": 100000,
      "available": 100000
    },
    "billingDate": 6,
    "popularityScore": 80
  },
  {
    "bank": "Kotak",
    "cardName": "League Platinum Credit Card",
    "network": "Visa",
    "cardType": "Travel",
    "rewardType": "points",
    "baseRewardRate": 2,
    "categories": {
      "shopping": 2,
      "travel": 2,
      "fuel": 1,
      "dining": 2,
      "groceries": 1
    },
    "bestFor": ["Travel", "Lounge Access", "Domestic Travel"],
    "rewardRateText": "2 reward points per ₹100 spent",
    "perks": ["LOUNGE_ACCESS", "TRAVEL_INSURANCE"],
    "fees": {
      "joining": 1999,
      "annual": 1999,
      "waiverSpend": 150000
    },
    "eligibility": {
      "minIncome": 40000,
      "minCreditScore": 720
    },
    "limits": {
      "max": 500000,
      "available": 500000
    },
    "billingDate": 11,
    "popularityScore": 83
  },
  {
    "bank": "Kotak",
    "cardName": "PVR Platinum Credit Card",
    "network": "Visa",
    "cardType": "Shopping",
    "rewardType": "points",
    "baseRewardRate": 3,
    "categories": {
      "shopping": 3,
      "travel": 1,
      "fuel": 1,
      "dining": 2,
      "groceries": 1
    },
    "bestFor": ["Movies", "Entertainment", "PVR", "Shopping"],
    "rewardRateText": "3X reward points on PVR & entertainment; 1X on other spends",
    "perks": ["MOVIE_OFFER", "DINING_DISCOUNT"],
    "fees": {
      "joining": 500,
      "annual": 500,
      "waiverSpend": 50000
    },
    "eligibility": {
      "minIncome": 25000,
      "minCreditScore": 650
    },
    "limits": {
      "max": 200000,
      "available": 200000
    },
    "billingDate": 16,
    "popularityScore": 79
  },
  {
    "bank": "IDFC First",
    "cardName": "First Classic Credit Card",
    "network": "Visa",
    "cardType": "Basic",
    "rewardType": "cashback",
    "baseRewardRate": 1,
    "categories": {
      "shopping": 1,
      "travel": 1,
      "fuel": 1,
      "dining": 1,
      "groceries": 1
    },
    "bestFor": ["First Time Users", "Basic Needs", "Low Income"],
    "rewardRateText": "1% cashback on all spends",
    "perks": [],
    "fees": {
      "joining": 0,
      "annual": 0,
      "waiverSpend": 0
    },
    "eligibility": {
      "minIncome": 15000,
      "minCreditScore": 600
    },
    "limits": {
      "max": 100000,
      "available": 100000
    },
    "billingDate": 9,
    "popularityScore": 72
  },
  {
    "bank": "IDFC First",
    "cardName": "First Wealth Credit Card",
    "network": "Visa",
    "cardType": "Travel",
    "rewardType": "points",
    "baseRewardRate": 4,
    "categories": {
      "shopping": 3,
      "travel": 4,
      "fuel": 2,
      "dining": 3,
      "groceries": 2
    },
    "bestFor": ["Travel", "Lounge Access", "Premium Benefits"],
    "rewardRateText": "4 reward points per ₹100 spent on travel; 2X on dining",
    "perks": ["LOUNGE_ACCESS", "TRAVEL_INSURANCE", "CONCIERGE"],
    "fees": {
      "joining": 5000,
      "annual": 5000,
      "waiverSpend": 500000
    },
    "eligibility": {
      "minIncome": 75000,
      "minCreditScore": 750
    },
    "limits": {
      "max": 1000000,
      "available": 1000000
    },
    "billingDate": 13,
    "popularityScore": 86
  },
  {
    "bank": "Standard Chartered",
    "cardName": "Super Value Titanium Credit Card",
    "network": "Visa",
    "cardType": "Cashback",
    "rewardType": "cashback",
    "baseRewardRate": 2,
    "categories": {
      "shopping": 2,
      "travel": 1,
      "fuel": 1,
      "dining": 2,
      "groceries": 2
    },
    "bestFor": ["Cashback", "Groceries", "Dining", "Utilities"],
    "rewardRateText": "2% cashback on groceries & dining; 1% on other spends",
    "perks": [],
    "fees": {
      "joining": 0,
      "annual": 0,
      "waiverSpend": 0
    },
    "eligibility": {
      "minIncome": 20000,
      "minCreditScore": 650
    },
    "limits": {
      "max": 150000,
      "available": 150000
    },
    "billingDate": 4,
    "popularityScore": 78
  },
  {
    "bank": "Citibank",
    "cardName": "Cashback Credit Card",
    "network": "Visa",
    "cardType": "Cashback",
    "rewardType": "cashback",
    "baseRewardRate": 5,
    "categories": {
      "shopping": 5,
      "travel": 1,
      "fuel": 1,
      "dining": 5,
      "groceries": 3
    },
    "bestFor": ["Cashback", "Dining", "Shopping", "Online Shopping"],
    "rewardRateText": "5% cashback on dining & shopping; 1% on other spends",
    "perks": [],
    "fees": {
      "joining": 0,
      "annual": 0,
      "waiverSpend": 0
    },
    "eligibility": {
      "minIncome": 25000,
      "minCreditScore": 690
    },
    "limits": {
      "max": 250000,
      "available": 250000
    },
    "billingDate": 16,
    "popularityScore": 84
  },
  {
    "bank": "Yes Bank",
    "cardName": "YES First Business Credit Card",
    "network": "Visa",
    "cardType": "Shopping",
    "rewardType": "points",
    "baseRewardRate": 5,
    "categories": {
      "shopping": 5,
      "travel": 3,
      "fuel": 2,
      "dining": 3,
      "groceries": 2
    },
    "bestFor": ["Business Expenses", "Corporate", "Shopping", "Travel"],
    "rewardRateText": "5X reward points on business spends; 2X on travel",
    "perks": ["LOUNGE_ACCESS", "FUEL_WAIVER", "BUSINESS_BENEFITS"],
    "fees": {
      "joining": 2000,
      "annual": 2000,
      "waiverSpend": 150000
    },
    "eligibility": {
      "minIncome": 45000,
      "minCreditScore": 710
    },
    "limits": {
      "max": 500000,
      "available": 500000
    },
    "billingDate": 19,
    "popularityScore": 85
  },
  {
    "bank": "RBL",
    "cardName": "BankBazaar Credit Card",
    "network": "Visa",
    "cardType": "Cashback",
    "rewardType": "cashback",
    "baseRewardRate": 1,
    "categories": {
      "shopping": 1,
      "travel": 1,
      "fuel": 1,
      "dining": 1,
      "groceries": 1
    },
    "bestFor": ["Cashback", "All Purpose", "Low Income"],
    "rewardRateText": "1% cashback on all spends",
    "perks": [],
    "fees": {
      "joining": 0,
      "annual": 0,
      "waiverSpend": 0
    },
    "eligibility": {
      "minIncome": 15000,
      "minCreditScore": 600
    },
    "limits": {
      "max": 100000,
      "available": 100000
    },
    "billingDate": 21,
    "popularityScore": 70
  },
  {
    "bank": "HDFC",
    "cardName": "Tata Neu Infinity Credit Card",
    "network": "RuPay",
    "cardType": "Shopping",
    "rewardType": "cashback",
    "baseRewardRate": 5,
    "categories": {
      "shopping": 5,
      "travel": 1,
      "fuel": 1,
      "dining": 2,
      "groceries": 3
    },
    "bestFor": ["Tata Brands", "BigBasket", "Croma", "Westside", "Shopping"],
    "rewardRateText": "5% NeuCoins on Tata brands; 1% on other spends",
    "perks": [],
    "fees": {
      "joining": 1500,
      "annual": 1500,
      "waiverSpend": 150000
    },
    "eligibility": {
      "minIncome": 30000,
      "minCreditScore": 680
    },
    "limits": {
      "max": 300000,
      "available": 300000
    },
    "billingDate": 17,
    "popularityScore": 91
  },
  {
    "bank": "ICICI",
    "cardName": "HPCL Super Saver Credit Card",
    "network": "Visa",
    "cardType": "Fuel",
    "rewardType": "cashback",
    "baseRewardRate": 3,
    "categories": {
      "shopping": 1,
      "travel": 1,
      "fuel": 3,
      "dining": 1,
      "groceries": 1
    },
    "bestFor": ["Fuel", "HPCL", "Petrol", "Diesel", "Cashback"],
    "rewardRateText": "3% cashback on HPCL fuel; 0.5% on other spends",
    "perks": ["FUEL_WAIVER"],
    "fees": {
      "joining": 0,
      "annual": 0,
      "waiverSpend": 0
    },
    "eligibility": {
      "minIncome": 20000,
      "minCreditScore": 640
    },
    "limits": {
      "max": 150000,
      "available": 150000
    },
    "billingDate": 23,
    "popularityScore": 81
  },
  {
    "bank": "SBI",
    "cardName": "SimplySAVE Credit Card",
    "network": "Visa",
    "cardType": "Cashback",
    "rewardType": "cashback",
    "baseRewardRate": 2,
    "categories": {
      "shopping": 2,
      "travel": 1,
      "fuel": 1,
      "dining": 2,
      "groceries": 2
    },
    "bestFor": ["Dining", "Groceries", "Cashback", "Utilities"],
    "rewardRateText": "2% cashback on dining & groceries; 1% on other spends",
    "perks": ["DINING_DISCOUNT"],
    "fees": {
      "joining": 499,
      "annual": 499,
      "waiverSpend": 100000
    },
    "eligibility": {
      "minIncome": 20000,
      "minCreditScore": 650
    },
    "limits": {
      "max": 150000,
      "available": 150000
    },
    "billingDate": 24,
    "popularityScore": 77
  },
  {
    "bank": "Axis",
    "cardName": "My Zone Credit Card",
    "network": "Visa",
    "cardType": "Shopping",
    "rewardType": "points",
    "baseRewardRate": 2,
    "categories": {
      "shopping": 2,
      "travel": 1,
      "fuel": 1,
      "dining": 2,
      "groceries": 1
    },
    "bestFor": ["Shopping", "Entertainment", "Movies", "Dining"],
    "rewardRateText": "2X reward points on shopping & entertainment",
    "perks": ["MOVIE_OFFER", "DINING_DISCOUNT"],
    "fees": {
      "joining": 500,
      "annual": 500,
      "waiverSpend": 50000
    },
    "eligibility": {
      "minIncome": 20000,
      "minCreditScore": 650
    },
    "limits": {
      "max": 150000,
      "available": 150000
    },
    "billingDate": 25,
    "popularityScore": 76
  },
  {
    "bank": "Kotak",
    "cardName": "White Credit Card",
    "network": "Visa",
    "cardType": "Travel",
    "rewardType": "points",
    "baseRewardRate": 3,
    "categories": {
      "shopping": 2,
      "travel": 3,
      "fuel": 1,
      "dining": 2,
      "groceries": 1
    },
    "bestFor": ["Travel", "Lounge Access", "Domestic Travel"],
    "rewardRateText": "3 reward points per ₹100 spent on travel",
    "perks": ["LOUNGE_ACCESS", "TRAVEL_INSURANCE"],
    "fees": {
      "joining": 2999,
      "annual": 2999,
      "waiverSpend": 200000
    },
    "eligibility": {
      "minIncome": 50000,
      "minCreditScore": 730
    },
    "limits": {
      "max": 600000,
      "available": 600000
    },
    "billingDate": 26,
    "popularityScore": 84
  },
  {
    "bank": "IDFC First",
    "cardName": "Vistara Infinite Credit Card",
    "network": "Visa",
    "cardType": "Travel",
    "rewardType": "miles",
    "baseRewardRate": 4,
    "categories": {
      "shopping": 2,
      "travel": 4,
      "fuel": 1,
      "dining": 2,
      "groceries": 1
    },
    "bestFor": ["Vistara", "Travel", "Miles", "Flight Bookings"],
    "rewardRateText": "4X Club Vistara points on Vistara flights; 2X on other travel",
    "perks": ["LOUNGE_ACCESS", "TRAVEL_INSURANCE", "TRAVEL_VOUCHER"],
    "fees": {
      "joining": 3000,
      "annual": 3000,
      "waiverSpend": 300000
    },
    "eligibility": {
      "minIncome": 40000,
      "minCreditScore": 720
    },
    "limits": {
      "max": 500000,
      "available": 500000
    },
    "billingDate": 27,
    "popularityScore": 88
  }
]


export default creditCards