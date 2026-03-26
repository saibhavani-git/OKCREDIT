/**
 * Catalog seed data. `monthlyCap` = max total reward value (₹) per calendar month on the card
 * (aligned with issuer T&Cs / FAQs where available). `null` = no published monthly cap in our model.
 * Quarterly caps (e.g. Flipkart Axis) use a rough monthly proxy for simulation.
 */
const creditCards=[
  {
    "bank": "HDFC",
    "cardName": "Millennia Credit Card",
    "network": "Visa",
    "cardType": "Cashback",
    "rewardType": "cashback",
    "pointValueInr": null,
    "pointValueSource": "",
    "baseRewardRate": 0.5,
    "categories": {
      "shopping": 3,
      "travel": 0.5,
      "fuel": 0.5,
      "dining": 1,
      "groceries": 1
    },
    "bestFor": ["Online Shopping", "Amazon", "Flipkart", "Myntra", "Cashback"],
    "rewardRateText": "3% cashback on Amazon, Flipkart, Myntra; 0.5% on other spends",
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
      "max": 250000,
      "available": 250000
    },
    "billingDate": 5,
    "popularityScore": 88,
    "monthlyCap": 2000
  },
  {
    "bank": "HDFC",
    "cardName": "Regalia Gold",
    "network": "Visa",
    "cardType": "Travel",
    "rewardType": "points",
    "pointValueInr": 0.25,
    "pointValueSource": "https://www.hdfcbank.com/personal/pay/cards/credit-cards/regalia-gold-credit-card",
    "baseRewardRate": 2,
    "categories": {
      "shopping": 1,
      "travel": 3,
      "fuel": 0.5,
      "dining": 2,
      "groceries": 0.5
    },
    "bestFor": ["Travel", "Lounge Access", "International Travel", "Flight Bookings"],
    "rewardRateText": "3 reward points per ₹100 on travel; 2X on dining",
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
      "max": 500000,
      "available": 500000
    },
    "billingDate": 10,
    "popularityScore": 85,
    "monthlyCap": 8000
  },
  {
    "bank": "HDFC",
    "cardName": "Diners Club Black",
    "network": "Amex",
    "cardType": "Travel",
    "rewardType": "miles",
    "pointValueInr": 0.5,
    "pointValueSource": "https://www.hdfcbank.com/personal/pay/cards/credit-cards/diners-club-black-credit-card",
    "baseRewardRate": 2,
    "categories": {
      "shopping": 1,
      "travel": 3,
      "fuel": 0.5,
      "dining": 2,
      "groceries": 0.5
    },
    "bestFor": ["Premium Travel", "Luxury", "International Travel", "Miles"],
    "rewardRateText": "3X miles on travel; 2X on dining & shopping",
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
      "max": 800000,
      "available": 800000
    },
    "billingDate": 15,
    "popularityScore": 82,
    "monthlyCap": null
  },
  {
    "bank": "ICICI",
    "cardName": "Amazon Pay Credit Card",
    "network": "Visa",
    "cardType": "Shopping",
    "rewardType": "cashback",
    "pointValueInr": null,
    "pointValueSource": "",
    "baseRewardRate": 0.5,
    "categories": {
      "shopping": 3,
      "travel": 0.5,
      "fuel": 0.5,
      "dining": 0.5,
      "groceries": 1
    },
    "bestFor": ["Amazon", "Online Shopping", "Cashback", "Prime Members"],
    "rewardRateText": "3% cashback on Amazon; 0.5% on other spends",
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
    "popularityScore": 92,
    "monthlyCap": null
  },
  {
    "bank": "ICICI",
    "cardName": "Coral Credit Card",
    "network": "Visa",
    "cardType": "Basic",
    "rewardType": "points",
    "pointValueInr": 0.25,
    "pointValueSource": "https://www.icicibank.com/personal-banking/cards/credit-card/coral-credit-card",
    "baseRewardRate": 1,
    "categories": {
      "shopping": 1,
      "travel": 1,
      "fuel": 0.5,
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
    "popularityScore": 72,
    "monthlyCap": 4000
  },
  {
    "bank": "ICICI",
    "cardName": "Emerald Private Metal",
    "network": "Visa",
    "cardType": "Travel",
    "rewardType": "miles",
    "pointValueInr": 0.35,
    "pointValueSource": "https://www.icicibank.com/personal-banking/cards/credit-card/emeralde-private-metal-credit-card",
    "baseRewardRate": 2,
    "categories": {
      "shopping": 1,
      "travel": 3,
      "fuel": 0.5,
      "dining": 2,
      "groceries": 0.5
    },
    "bestFor": ["Premium Travel", "Luxury", "International", "Miles"],
    "rewardRateText": "3X miles on travel; 2X on dining & shopping",
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
      "max": 1000000,
      "available": 1000000
    },
    "billingDate": 20,
    "popularityScore": 80,
    "monthlyCap": null
  },
  {
    "bank": "SBI",
    "cardName": "SimplyCLICK Credit Card",
    "network": "Visa",
    "cardType": "Shopping",
    "rewardType": "cashback",
    "pointValueInr": null,
    "pointValueSource": "",
    "baseRewardRate": 0.5,
    "categories": {
      "shopping": 3,
      "travel": 0.5,
      "fuel": 0.5,
      "dining": 1,
      "groceries": 1.5
    },
    "bestFor": ["Online Shopping", "Amazon", "Flipkart", "Cashback"],
    "rewardRateText": "3% cashback on online shopping; 0.5% on other spends",
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
    "popularityScore": 84,
    "monthlyCap": 750
  },
  {
    "bank": "SBI",
    "cardName": "Elite Credit Card",
    "network": "Visa",
    "cardType": "Travel",
    "rewardType": "points",
    "pointValueInr": 0.25,
    "pointValueSource": "https://www.sbicard.com/en/personal/credit-cards/travel/elite.page",
    "baseRewardRate": 1.5,
    "categories": {
      "shopping": 1,
      "travel": 2,
      "fuel": 0.5,
      "dining": 1,
      "groceries": 0.5
    },
    "bestFor": ["Travel", "Lounge Access", "Domestic Travel"],
    "rewardRateText": "2 reward points per ₹100 on travel",
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
      "max": 600000,
      "available": 600000
    },
    "billingDate": 8,
    "popularityScore": 82,
    "monthlyCap": 10000
  },
  {
    "bank": "SBI",
    "cardName": "BPCL Octane Credit Card",
    "network": "Visa",
    "cardType": "Fuel",
    "rewardType": "cashback",
    "pointValueInr": null,
    "pointValueSource": "",
    "baseRewardRate": 0.25,
    "categories": {
      "shopping": 0.25,
      "travel": 0.25,
      "fuel": 2.5,
      "dining": 0.25,
      "groceries": 0.25
    },
    "bestFor": ["Fuel", "BPCL", "Petrol", "Diesel", "Cashback"],
    "rewardRateText": "2.5% cashback on BPCL fuel; 0.25% on other spends",
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
    "popularityScore": 78,
    "monthlyCap": 4000
  },
  {
    "bank": "Axis",
    "cardName": "Flipkart Axis Bank Credit Card",
    "network": "Visa",
    "cardType": "Shopping",
    "rewardType": "cashback",
    "pointValueInr": null,
    "pointValueSource": "",
    "baseRewardRate": 0.5,
    "categories": {
      "shopping": 3,
      "travel": 0.5,
      "fuel": 0.5,
      "dining": 0.5,
      "groceries": 1
    },
    "bestFor": ["Flipkart", "Online Shopping", "Cashback"],
    "rewardRateText": "3% cashback on Flipkart; 0.5% on other spends",
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
    "popularityScore": 90,
    "monthlyCap": 5000
  },
  {
    "bank": "Axis",
    "cardName": "Magnus Credit Card",
    "network": "Visa",
    "cardType": "Travel",
    "rewardType": "miles",
    "pointValueInr": 0.25,
    "pointValueSource": "https://www.axisbank.com/retail/cards/credit-card/rewards-credit-cards",
    "baseRewardRate": 2,
    "categories": {
      "shopping": 1,
      "travel": 3,
      "fuel": 0.5,
      "dining": 1.5,
      "groceries": 0.5
    },
    "bestFor": ["Travel", "Lounge Access", "International", "Miles"],
    "rewardRateText": "3X miles on travel; 1.5X on dining",
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
      "max": 1200000,
      "available": 1200000
    },
    "billingDate": 22,
    "popularityScore": 84,
    "monthlyCap": null
  },
  {
    "bank": "Axis",
    "cardName": "Ace Credit Card",
    "network": "Visa",
    "cardType": "Cashback",
    "rewardType": "cashback",
    "pointValueInr": null,
    "pointValueSource": "",
    "baseRewardRate": 0.5,
    "categories": {
      "shopping": 1,
      "travel": 0.5,
      "fuel": 0.5,
      "dining": 1,
      "groceries": 1
    },
    "bestFor": ["Cashback", "Bill Payments", "Utilities", "Groceries"],
    "rewardRateText": "1% cashback on bill payments & utilities; 0.5% on other spends",
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
    "popularityScore": 76,
    "monthlyCap": 1000
  },
  {
    "bank": "Kotak",
    "cardName": "League Platinum Credit Card",
    "network": "Visa",
    "cardType": "Travel",
    "rewardType": "points",
    "pointValueInr": 0.25,
    "pointValueSource": "https://www.kotak.com/en/personal-banking/cards/credit-cards/reward-points-program.html",
    "baseRewardRate": 1,
    "categories": {
      "shopping": 1,
      "travel": 1.5,
      "fuel": 0.5,
      "dining": 1,
      "groceries": 0.5
    },
    "bestFor": ["Travel", "Lounge Access", "Domestic Travel"],
    "rewardRateText": "1.5 reward points per ₹100 on travel",
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
      "max": 400000,
      "available": 400000
    },
    "billingDate": 11,
    "popularityScore": 78,
    "monthlyCap": 6000
  },
  {
    "bank": "Kotak",
    "cardName": "PVR Platinum Credit Card",
    "network": "Visa",
    "cardType": "Shopping",
    "rewardType": "points",
    "pointValueInr": 0.25,
    "pointValueSource": "https://www.kotak.com/en/personal-banking/cards/credit-cards/reward-points-program.html",
    "baseRewardRate": 1,
    "categories": {
      "shopping": 2,
      "travel": 0.5,
      "fuel": 0.5,
      "dining": 1,
      "groceries": 0.5
    },
    "bestFor": ["Movies", "Entertainment", "PVR", "Shopping"],
    "rewardRateText": "2X reward points on PVR & entertainment; 0.5X on other spends",
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
    "popularityScore": 74,
    "monthlyCap": 4000
  },
  {
    "bank": "IDFC First",
    "cardName": "First Classic Credit Card",
    "network": "Visa",
    "cardType": "Basic",
    "rewardType": "cashback",
    "pointValueInr": null,
    "pointValueSource": "",
    "baseRewardRate": 0.5,
    "categories": {
      "shopping": 0.5,
      "travel": 0.5,
      "fuel": 0.5,
      "dining": 0.5,
      "groceries": 0.5
    },
    "bestFor": ["First Time Users", "Basic Needs", "Low Income"],
    "rewardRateText": "0.5% cashback on all spends",
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
    "popularityScore": 68,
    "monthlyCap": 3000
  },
  {
    "bank": "IDFC First",
    "cardName": "First Wealth Credit Card",
    "network": "Visa",
    "cardType": "Travel",
    "rewardType": "points",
    "pointValueInr": 0.25,
    "pointValueSource": "https://www.idfcfirstbank.com/credit-card/rewards",
    "baseRewardRate": 2,
    "categories": {
      "shopping": 1,
      "travel": 2.5,
      "fuel": 0.5,
      "dining": 1.5,
      "groceries": 0.5
    },
    "bestFor": ["Travel", "Lounge Access", "Premium Benefits"],
    "rewardRateText": "2.5 reward points per ₹100 on travel; 1.5X on dining",
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
      "max": 600000,
      "available": 600000
    },
    "billingDate": 13,
    "popularityScore": 82,
    "monthlyCap": 15000
  },
  {
    "bank": "Standard Chartered",
    "cardName": "Super Value Titanium Credit Card",
    "network": "Visa",
    "cardType": "Cashback",
    "rewardType": "cashback",
    "pointValueInr": null,
    "pointValueSource": "",
    "baseRewardRate": 0.5,
    "categories": {
      "shopping": 1,
      "travel": 0.5,
      "fuel": 0.5,
      "dining": 1,
      "groceries": 1
    },
    "bestFor": ["Cashback", "Groceries", "Dining", "Utilities"],
    "rewardRateText": "1% cashback on groceries & dining; 0.5% on other spends",
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
    "popularityScore": 74,
    "monthlyCap": 1000
  },
  {
    "bank": "Citibank",
    "cardName": "Cashback Credit Card",
    "network": "Visa",
    "cardType": "Cashback",
    "rewardType": "cashback",
    "pointValueInr": null,
    "pointValueSource": "",
    "baseRewardRate": 0.5,
    "categories": {
      "shopping": 2,
      "travel": 0.5,
      "fuel": 0.5,
      "dining": 2,
      "groceries": 1
    },
    "bestFor": ["Cashback", "Dining", "Shopping", "Online Shopping"],
    "rewardRateText": "2% cashback on dining & shopping; 0.5% on other spends",
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
    "popularityScore": 80,
    "monthlyCap": 1000
  },
  {
    "bank": "Yes Bank",
    "cardName": "YES First Business Credit Card",
    "network": "Visa",
    "cardType": "Shopping",
    "rewardType": "points",
    "pointValueInr": 0.25,
    "pointValueSource": "https://www.yesbank.in/personal-banking/yes-individual/cards/credit-cards/yes-first-business-credit-card",
    "baseRewardRate": 1.5,
    "categories": {
      "shopping": 2,
      "travel": 1.5,
      "fuel": 0.5,
      "dining": 1,
      "groceries": 0.5
    },
    "bestFor": ["Business Expenses", "Corporate", "Shopping", "Travel"],
    "rewardRateText": "2X reward points on business spends; 1.5X on travel",
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
      "max": 400000,
      "available": 400000
    },
    "billingDate": 19,
    "popularityScore": 80,
    "monthlyCap": 12000
  },
  {
    "bank": "RBL",
    "cardName": "BankBazaar Credit Card",
    "network": "Visa",
    "cardType": "Cashback",
    "rewardType": "cashback",
    "pointValueInr": null,
    "pointValueSource": "",
    "baseRewardRate": 0.5,
    "categories": {
      "shopping": 0.5,
      "travel": 0.5,
      "fuel": 0.5,
      "dining": 0.5,
      "groceries": 0.5
    },
    "bestFor": ["Cashback", "All Purpose", "Low Income"],
    "rewardRateText": "0.5% cashback on all spends",
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
    "popularityScore": 66,
    "monthlyCap": 2000
  },
  {
    "bank": "HDFC",
    "cardName": "Tata Neu Infinity Credit Card",
    "network": "RuPay",
    "cardType": "Shopping",
    "rewardType": "cashback",
    "pointValueInr": null,
    "pointValueSource": "",
    "baseRewardRate": 0.5,
    "categories": {
      "shopping": 3,
      "travel": 0.5,
      "fuel": 0.5,
      "dining": 1,
      "groceries": 2
    },
    "bestFor": ["Tata Brands", "BigBasket", "Croma", "Westside", "Shopping"],
    "rewardRateText": "3% NeuCoins on Tata brands; 0.5% on other spends",
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
    "popularityScore": 86,
    "monthlyCap": 1000
  },
  {
    "bank": "ICICI",
    "cardName": "HPCL Super Saver Credit Card",
    "network": "Visa",
    "cardType": "Fuel",
    "rewardType": "cashback",
    "pointValueInr": null,
    "pointValueSource": "",
    "baseRewardRate": 0.25,
    "categories": {
      "shopping": 0.25,
      "travel": 0.25,
      "fuel": 2,
      "dining": 0.25,
      "groceries": 0.25
    },
    "bestFor": ["Fuel", "HPCL", "Petrol", "Diesel", "Cashback"],
    "rewardRateText": "2% cashback on HPCL fuel; 0.25% on other spends",
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
    "popularityScore": 76,
    "monthlyCap": 2500
  },
  {
    "bank": "SBI",
    "cardName": "SimplySAVE Credit Card",
    "network": "Visa",
    "cardType": "Cashback",
    "rewardType": "cashback",
    "pointValueInr": null,
    "pointValueSource": "",
    "baseRewardRate": 0.5,
    "categories": {
      "shopping": 1,
      "travel": 0.5,
      "fuel": 0.5,
      "dining": 1,
      "groceries": 1
    },
    "bestFor": ["Dining", "Groceries", "Cashback", "Utilities"],
    "rewardRateText": "1% cashback on dining & groceries; 0.5% on other spends",
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
    "popularityScore": 73,
    "monthlyCap": 1000
  },
  {
    "bank": "Axis",
    "cardName": "My Zone Credit Card",
    "network": "Visa",
    "cardType": "Shopping",
    "rewardType": "points",
    "pointValueInr": 0.25,
    "pointValueSource": "https://www.axisbank.com/retail/cards/credit-card/rewards-credit-cards",
    "baseRewardRate": 1,
    "categories": {
      "shopping": 1.5,
      "travel": 0.5,
      "fuel": 0.5,
      "dining": 1,
      "groceries": 0.5
    },
    "bestFor": ["Shopping", "Entertainment", "Movies", "Dining"],
    "rewardRateText": "1.5X reward points on shopping & entertainment",
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
    "popularityScore": 72,
    "monthlyCap": 5000
  },
  {
    "bank": "Kotak",
    "cardName": "White Credit Card",
    "network": "Visa",
    "cardType": "Travel",
    "rewardType": "points",
    "pointValueInr": 0.25,
    "pointValueSource": "https://www.kotak.com/en/personal-banking/cards/credit-cards/reward-points-program.html",
    "baseRewardRate": 1.5,
    "categories": {
      "shopping": 1,
      "travel": 2,
      "fuel": 0.5,
      "dining": 1,
      "groceries": 0.5
    },
    "bestFor": ["Travel", "Lounge Access", "Domestic Travel"],
    "rewardRateText": "2 reward points per ₹100 on travel",
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
      "max": 500000,
      "available": 500000
    },
    "billingDate": 26,
    "popularityScore": 80,
    "monthlyCap": 10000
  },
  {
    "bank": "IDFC First",
    "cardName": "Vistara Infinite Credit Card",
    "network": "Visa",
    "cardType": "Travel",
    "rewardType": "miles",
    "pointValueInr": 0.5,
    "pointValueSource": "https://www.idfcfirstbank.com/credit-card/club-vistara-idfc-first-credit-card",
    "baseRewardRate": 2,
    "categories": {
      "shopping": 0.5,
      "travel": 2.5,
      "fuel": 0.5,
      "dining": 1,
      "groceries": 0.5
    },
    "bestFor": ["Vistara", "Travel", "Miles", "Flight Bookings"],
    "rewardRateText": "2.5X Club Vistara points on Vistara flights; 1X on other travel",
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
    "popularityScore": 84,
    "monthlyCap": 15000
  }
]


export default creditCards
