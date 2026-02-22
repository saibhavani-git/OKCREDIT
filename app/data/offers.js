const offersData=[
    {
  merchant: "Amazon",
  description: "5% cashback on online shopping",
  rewardType: "CASHBACK",
  rewardValue: 5,
  validCards: [
    { bank: "HDFC", cardName: "Millennia Credit Card" }
  ],
  minTransactionAmount: 1000,
  maxRewardCap: 1000,
  validFrom: new Date("2026-01-01"),
  validTill: new Date("2026-03-31"),
  priority: 1,
  isActive: true
}
,
{
  merchant: "MakeMyTrip",
  description: "8X reward points on flights & hotels",
  rewardType: "REWARD_POINTS",
  rewardValue: 8,
  validCards: [
    { bank: "HDFC", cardName: "Regalia Gold" }
  ],
  minTransactionAmount: 5000,
  maxRewardCap: 6000,
  validFrom: new Date("2026-01-10"),
  validTill: new Date("2026-04-30"),
  priority: 1,
  isActive: true
}
,{
  merchant: "Zomato",
  description: "15% cashback on dining & delivery",
  rewardType: "CASHBACK",
  rewardValue: 15,
  validCards: [
    { bank: "HDFC", cardName: "Diners Club Black" }
  ],
  minTransactionAmount: 300,
  maxRewardCap: 1500,
  validFrom: new Date("2026-01-01"),
  validTill: new Date("2026-02-28"),
  priority: 0,
  isActive: true
}
,{
  merchant: "Amazon",
  description: "5% unlimited cashback for Prime users",
  rewardType: "CASHBACK",
  rewardValue: 5,
  validCards: [
    { bank: "ICICI", cardName: "Amazon Pay Credit Card" }
  ],
  minTransactionAmount: 0,
  maxRewardCap: null,
  validFrom: new Date("2026-01-01"),
  validTill: new Date("2026-12-31"),
  priority: 0,
  isActive: true
}
,{
  merchant: "Paytm",
  description: "10% cashback on utility bill payments",
  rewardType: "CASHBACK",
  rewardValue: 10,
  validCards: [
    { bank: "ICICI", cardName: "Coral Credit Card" }
  ],
  minTransactionAmount: 500,
  maxRewardCap: 300,
  validFrom: new Date("2026-01-05"),
  validTill: new Date("2026-03-31"),
  priority: 2,
  isActive: true
}
,{
  merchant: "Flipkart",
  description: "10X reward points on Flipkart purchases",
  rewardType: "REWARD_POINTS",
  rewardValue: 10,
  validCards: [
    { bank: "SBI", cardName: "SimplyCLICK Credit Card" }
  ],
  minTransactionAmount: 1000,
  maxRewardCap: 2000,
  validFrom: new Date("2026-01-01"),
  validTill: new Date("2026-03-31"),
  priority: 1,
  isActive: true
}
,{
  merchant: "Flipkart",
  description: "5% instant discount on Flipkart",
  rewardType: "DISCOUNT",
  rewardValue: 5,
  validCards: [
    { bank: "Axis", cardName: "Flipkart Axis Bank Credit Card" }
  ],
  minTransactionAmount: 1000,
  maxRewardCap: 750,
  validFrom: new Date("2026-01-01"),
  validTill: new Date("2026-06-30"),
  priority: 0,
  isActive: true
}
,{
  merchant: "Vistara",
  description: "12% reward points on flight bookings",
  rewardType: "REWARD_POINTS",
  rewardValue: 12,
  validCards: [
    { bank: "Axis", cardName: "Magnus Credit Card" }
  ],
  minTransactionAmount: 10000,
  maxRewardCap: 10000,
  validFrom: new Date("2026-01-01"),
  validTill: new Date("2026-12-31"),
  priority: 0,
  isActive: true
}
,{
  merchant: "Google Pay",
  description: "5% cashback on bill payments & recharges",
  rewardType: "CASHBACK",
  rewardValue: 5,
  validCards: [
    { bank: "Axis", cardName: "Ace Credit Card" }
  ],
  minTransactionAmount: 300,
  maxRewardCap: 500,
  validFrom: new Date("2026-01-01"),
  validTill: new Date("2026-03-31"),
  priority: 1,
  isActive: true
}
,{
  merchant: "PVR Cinemas",
  description: "Buy 1 Get 1 movie ticket every month",
  rewardType: "DISCOUNT",
  rewardValue: 50,
  validCards: [
    { bank: "HDFC", cardName: "PVR Platinum Credit Card" }
  ],
  minTransactionAmount: 0,
  maxRewardCap: 500,
  validFrom: new Date("2026-01-01"),
  validTill: new Date("2026-12-31"),
  priority: 1,
  isActive: true
}

]

export default offersData;