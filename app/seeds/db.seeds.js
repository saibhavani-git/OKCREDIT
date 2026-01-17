import dotenv from 'dotenv'
// Load environment variables from .env file
dotenv.config();

import mongoose from "mongoose";
import bcrypt from 'bcryptjs';

import dbConnect from "../lib/db.js";
import CreditCard from "../models/cards.js";
import User from "../models/user.js";

// Test if environment variables loaded
console.log("MONGODB_URI =", process.env.MONGODB_URI); // This should print your URI


const cards = [
  {
    bank: "HDFC",
    cardName: "Millennia Credit Card",
    network: "Visa",
    cardType: "Cashback",
    rewardType: "cashback",
    baseRewardRate: 1,
    categories: { shopping: 5, travel: 1, fuel: 1, dining: 2, groceries: 2 },
    bestFor: ["online shopping"],
    rewardRateText: "5% cashback on Amazon & Flipkart",
    perks: { loungeAccess: false, fuelWaiver: true, amazonPrime: false },
    annualFee: 1000,
    joiningFee: 1000,
    feeWaiverSpend: 100000,
    eligibility: { minIncome: 35000, minCreditScore: 700 },
    maxLimit: 300000,
    availableLimit: 300000,
    billingDate: 5,
    image: "/images/hdfc-millennia.png",
    popularityScore: 95
  },
  {
    bank: "HDFC",
    cardName: "Regalia Gold",
    network: "Visa",
    cardType: "Travel",
    rewardType: "points",
    baseRewardRate: 1,
    categories: { shopping: 2, travel: 4, fuel: 1, dining: 3, groceries: 1 },
    bestFor: ["travel", "lounge access"],
    rewardRateText: "4 reward points per ₹150",
    perks: { loungeAccess: true, fuelWaiver: false, amazonPrime: false },
    annualFee: 2500,
    joiningFee: 2500,
    feeWaiverSpend: 300000,
    eligibility: { minIncome: 50000, minCreditScore: 750 },
    maxLimit: 600000,
    availableLimit: 600000,
    billingDate: 10,
    image: "/images/hdfc-regalia.png",
    popularityScore: 92
  },
  {
    bank: "ICICI",
    cardName: "Amazon Pay ICICI",
    network: "Visa",
    cardType: "Cashback",
    rewardType: "cashback",
    baseRewardRate: 1,
    categories: { shopping: 5, travel: 2, fuel: 1, dining: 2, groceries: 2 },
    bestFor: ["amazon shopping"],
    rewardRateText: "5% cashback for Prime users",
    perks: { loungeAccess: false, fuelWaiver: true, amazonPrime: true },
    annualFee: 0,
    joiningFee: 0,
    eligibility: { minIncome: 30000, minCreditScore: 700 },
    maxLimit: 250000,
    availableLimit: 250000,
    billingDate: 12,
    image: "/images/icici-amazon.png",
    popularityScore: 98
  },
  {
    bank: "SBI",
    cardName: "SimplyCLICK",
    network: "Visa",
    cardType: "Shopping",
    rewardType: "points",
    baseRewardRate: 1,
    categories: { shopping: 10, travel: 1, fuel: 1, dining: 2, groceries: 1 },
    bestFor: ["online shopping"],
    rewardRateText: "10X reward points on partners",
    perks: { loungeAccess: false, fuelWaiver: false, amazonPrime: false },
    annualFee: 499,
    joiningFee: 499,
    eligibility: { minIncome: 25000, minCreditScore: 680 },
    maxLimit: 200000,
    availableLimit: 200000,
    billingDate: 15,
    image: "/images/sbi-simplyclick.png",
    popularityScore: 90
  },
  {
    bank: "Axis",
    cardName: "Flipkart Axis Bank",
    network: "Visa",
    cardType: "Cashback",
    rewardType: "cashback",
    baseRewardRate: 1,
    categories: { shopping: 5, travel: 2, fuel: 1, dining: 2, groceries: 2 },
    bestFor: ["flipkart shopping"],
    rewardRateText: "5% cashback on Flipkart",
    perks: { loungeAccess: false, fuelWaiver: false, amazonPrime: false },
    annualFee: 1000,
    joiningFee: 1000,
    eligibility: { minIncome: 30000, minCreditScore: 700 },
    maxLimit: 350000,
    availableLimit: 350000,
    billingDate: 7,
    image: "/images/axis-flipkart.png",
    popularityScore: 94
  },

  /* -------- Fuel Cards -------- */
  {
    bank: "Axis",
    cardName: "IndianOil Axis",
    network: "Visa",
    cardType: "Fuel",
    rewardType: "cashback",
    baseRewardRate: 4,
    categories: { shopping: 1, travel: 1, fuel: 4, dining: 1, groceries: 1 },
    bestFor: ["fuel"],
    rewardRateText: "4% fuel savings",
    perks: { loungeAccess: false, fuelWaiver: true, amazonPrime: false },
    annualFee: 500,
    joiningFee: 500,
    eligibility: { minIncome: 25000, minCreditScore: 680 },
    maxLimit: 200000,
    availableLimit: 200000,
    billingDate: 20,
    image: "/images/axis-iocl.png",
    popularityScore: 85
  },

  /* -------- Beginner Cards -------- */
  {
    bank: "Kotak",
    cardName: "811 DreamDifferent",
    network: "Visa",
    cardType: "Basic",
    rewardType: "points",
    baseRewardRate: 0.5,
    categories: { shopping: 1, travel: 1, fuel: 1, dining: 1, groceries: 1 },
    bestFor: ["beginners"],
    rewardRateText: "Reward points on spends",
    perks: { loungeAccess: false, fuelWaiver: false, amazonPrime: false },
    annualFee: 0,
    joiningFee: 0,
    eligibility: { minIncome: 15000, minCreditScore: 650 },
    maxLimit: 100000,
    availableLimit: 100000,
    billingDate: 25,
    image: "/images/kotak-811.png",
    popularityScore: 80
  },

  /* -------- IDFC -------- */
  {
    bank: "IDFC First",
    cardName: "Millennia",
    network: "Visa",
    cardType: "Cashback",
    rewardType: "points",
    baseRewardRate: 1,
    categories: { shopping: 6, travel: 2, fuel: 2, dining: 2, groceries: 2 },
    bestFor: ["online shopping"],
    rewardRateText: "Up to 6X rewards",
    perks: { loungeAccess: false, fuelWaiver: true, amazonPrime: false },
    annualFee: 0,
    joiningFee: 0,
    eligibility: { minIncome: 25000, minCreditScore: 700 },
    maxLimit: 250000,
    availableLimit: 250000,
    billingDate: 18,
    image: "/images/idfc-millennia.png",
    popularityScore: 87
  },

  /* -------- More Shopping Cards -------- */
  {
    bank: "SBI",
    cardName: "Prime Credit Card",
    network: "Visa",
    cardType: "Shopping",
    rewardType: "points",
    baseRewardRate: 1,
    categories: { shopping: 8, travel: 3, fuel: 1, dining: 4, groceries: 2 },
    bestFor: ["online shopping", "amazon", "flipkart"],
    rewardRateText: "10X reward points on online shopping",
    perks: { loungeAccess: true, fuelWaiver: false, amazonPrime: false },
    annualFee: 2999,
    joiningFee: 2999,
    feeWaiverSpend: 200000,
    eligibility: { minIncome: 40000, minCreditScore: 720 },
    maxLimit: 500000,
    availableLimit: 500000,
    billingDate: 8,
    image: "/images/sbi-prime.png",
    popularityScore: 91
  },
  {
    bank: "ICICI",
    cardName: "Coral Credit Card",
    network: "Visa",
    cardType: "Shopping",
    rewardType: "points",
    baseRewardRate: 1,
    categories: { shopping: 4, travel: 2, fuel: 1, dining: 3, groceries: 2 },
    bestFor: ["online shopping", "dining"],
    rewardRateText: "4X reward points on shopping",
    perks: { loungeAccess: false, fuelWaiver: false, amazonPrime: false },
    annualFee: 500,
    joiningFee: 500,
    feeWaiverSpend: 50000,
    eligibility: { minIncome: 20000, minCreditScore: 680 },
    maxLimit: 180000,
    availableLimit: 180000,
    billingDate: 14,
    image: "/images/icici-coral.png",
    popularityScore: 83
  },

  /* -------- More Travel Cards -------- */
  {
    bank: "Axis",
    cardName: "Vistara Infinite",
    network: "Mastercard",
    cardType: "Travel",
    rewardType: "miles",
    baseRewardRate: 1.5,
    categories: { shopping: 1, travel: 12, fuel: 1, dining: 4, groceries: 1 },
    bestFor: ["travel", "vistara flights", "lounge access"],
    rewardRateText: "12 CV points per ₹200 on Vistara",
    perks: { loungeAccess: true, fuelWaiver: false, amazonPrime: false },
    annualFee: 10000,
    joiningFee: 10000,
    feeWaiverSpend: 500000,
    eligibility: { minIncome: 75000, minCreditScore: 750 },
    maxLimit: 800000,
    availableLimit: 800000,
    billingDate: 5,
    image: "/images/axis-vistara.png",
    popularityScore: 88
  },
  {
    bank: "HDFC",
    cardName: "Diners Club Black",
    network: "Mastercard",
    cardType: "Travel",
    rewardType: "miles",
    baseRewardRate: 1,
    categories: { shopping: 2, travel: 8, fuel: 1, dining: 5, groceries: 1 },
    bestFor: ["travel", "lounge access", "international travel"],
    rewardRateText: "5 reward points per ₹150",
    perks: { loungeAccess: true, fuelWaiver: false, amazonPrime: false },
    annualFee: 10000,
    joiningFee: 10000,
    feeWaiverSpend: 800000,
    eligibility: { minIncome: 100000, minCreditScore: 750 },
    maxLimit: 1000000,
    availableLimit: 1000000,
    billingDate: 2,
    image: "/images/hdfc-diners-black.png",
    popularityScore: 93
  },

  /* -------- More Cashback Cards -------- */
  {
    bank: "Standard Chartered",
    cardName: "Super Value Titanium",
    network: "Visa",
    cardType: "Cashback",
    rewardType: "cashback",
    baseRewardRate: 2,
    categories: { shopping: 5, travel: 2, fuel: 3, dining: 2, groceries: 3 },
    bestFor: ["cashback", "shopping", "fuel"],
    rewardRateText: "5% cashback on online shopping",
    perks: { loungeAccess: false, fuelWaiver: true, amazonPrime: false },
    annualFee: 0,
    joiningFee: 0,
    eligibility: { minIncome: 30000, minCreditScore: 700 },
    maxLimit: 300000,
    availableLimit: 300000,
    billingDate: 22,
    image: "/images/scb-super-value.png",
    popularityScore: 86
  },
  {
    bank: "Citibank",
    cardName: "Cashback Credit Card",
    network: "Visa",
    cardType: "Cashback",
    rewardType: "cashback",
    baseRewardRate: 1,
    categories: { shopping: 5, travel: 1, fuel: 1, dining: 5, groceries: 3 },
    bestFor: ["cashback", "dining", "shopping"],
    rewardRateText: "5% cashback on dining and shopping",
    perks: { loungeAccess: false, fuelWaiver: false, amazonPrime: false },
    annualFee: 0,
    joiningFee: 0,
    eligibility: { minIncome: 25000, minCreditScore: 690 },
    maxLimit: 250000,
    availableLimit: 250000,
    billingDate: 16,
    image: "/images/citi-cashback.png",
    popularityScore: 84
  },

  /* -------- More Fuel Cards -------- */
  {
    bank: "SBI",
    cardName: "BPCL Octane Credit Card",
    network: "Visa",
    cardType: "Fuel",
    rewardType: "cashback",
    baseRewardRate: 4.25,
    categories: { shopping: 1, travel: 1, fuel: 6, dining: 1, groceries: 1 },
    bestFor: ["fuel", "bpcl"],
    rewardRateText: "6.25% valueback on BPCL fuel",
    perks: { loungeAccess: false, fuelWaiver: true, amazonPrime: false },
    annualFee: 499,
    joiningFee: 499,
    eligibility: { minIncome: 20000, minCreditScore: 680 },
    maxLimit: 200000,
    availableLimit: 200000,
    billingDate: 11,
    image: "/images/sbi-bpcl.png",
    popularityScore: 82
  },
  {
    bank: "ICICI",
    cardName: "HPCL Super Saver",
    network: "Visa",
    cardType: "Fuel",
    rewardType: "cashback",
    baseRewardRate: 4,
    categories: { shopping: 1, travel: 1, fuel: 5, dining: 1, groceries: 1 },
    bestFor: ["fuel", "hpcl"],
    rewardRateText: "5% savings on HPCL fuel",
    perks: { loungeAccess: false, fuelWaiver: true, amazonPrime: false },
    annualFee: 199,
    joiningFee: 199,
    eligibility: { minIncome: 18000, minCreditScore: 670 },
    maxLimit: 150000,
    availableLimit: 150000,
    billingDate: 9,
    image: "/images/icici-hpcl.png",
    popularityScore: 81
  },

  /* -------- Dining & Food Cards -------- */
  {
    bank: "HDFC",
    cardName: "Swiggy Credit Card",
    network: "Visa",
    cardType: "Cashback",
    rewardType: "cashback",
    baseRewardRate: 2,
    categories: { shopping: 2, travel: 1, fuel: 1, dining: 10, groceries: 2 },
    bestFor: ["swiggy", "food delivery", "dining"],
    rewardRateText: "10% cashback on Swiggy",
    perks: { loungeAccess: false, fuelWaiver: false, amazonPrime: false },
    annualFee: 500,
    joiningFee: 500,
    feeWaiverSpend: 50000,
    eligibility: { minIncome: 20000, minCreditScore: 680 },
    maxLimit: 200000,
    availableLimit: 200000,
    billingDate: 6,
    image: "/images/hdfc-swiggy.png",
    popularityScore: 89
  },
  {
    bank: "Axis",
    cardName: "Zomato Edition Credit Card",
    network: "Visa",
    cardType: "Cashback",
    rewardType: "cashback",
    baseRewardRate: 2,
    categories: { shopping: 2, travel: 1, fuel: 1, dining: 10, groceries: 2 },
    bestFor: ["zomato", "food delivery", "dining"],
    rewardRateText: "10% cashback on Zomato",
    perks: { loungeAccess: false, fuelWaiver: false, amazonPrime: false },
    annualFee: 500,
    joiningFee: 500,
    feeWaiverSpend: 50000,
    eligibility: { minIncome: 20000, minCreditScore: 680 },
    maxLimit: 200000,
    availableLimit: 200000,
    billingDate: 13,
    image: "/images/axis-zomato.png",
    popularityScore: 90
  },

  /* -------- More General Purpose Cards -------- */
  {
    bank: "Kotak",
    cardName: "PVR Platinum Credit Card",
    network: "Visa",
    cardType: "Shopping",
    rewardType: "points",
    baseRewardRate: 1,
    categories: { shopping: 6, travel: 2, fuel: 1, dining: 4, groceries: 2 },
    bestFor: ["movies", "entertainment", "shopping"],
    rewardRateText: "Buy 1 Get 1 on PVR tickets",
    perks: { loungeAccess: false, fuelWaiver: false, amazonPrime: false },
    annualFee: 500,
    joiningFee: 500,
    eligibility: { minIncome: 25000, minCreditScore: 690 },
    maxLimit: 250000,
    availableLimit: 250000,
    billingDate: 17,
    image: "/images/kotak-pvr.png",
    popularityScore: 79
  },
  {
    bank: "Yes Bank",
    cardName: "YES First Business Card",
    network: "Visa",
    cardType: "Shopping",
    rewardType: "points",
    baseRewardRate: 1,
    categories: { shopping: 5, travel: 3, fuel: 2, dining: 3, groceries: 2 },
    bestFor: ["business expenses", "shopping"],
    rewardRateText: "5X reward points on business spends",
    perks: { loungeAccess: true, fuelWaiver: true, amazonPrime: false },
    annualFee: 2000,
    joiningFee: 2000,
    feeWaiverSpend: 150000,
    eligibility: { minIncome: 45000, minCreditScore: 710 },
    maxLimit: 500000,
    availableLimit: 500000,
    billingDate: 21,
    image: "/images/yes-first-business.png",
    popularityScore: 85
  }
];


async function seedDB() {
  try {
    await dbConnect();
    
    // Clear all existing data
    console.log("Clearing existing data...");
    await CreditCard.deleteMany({});
    await User.deleteMany({});
    console.log("✓ Cleared all cards and users");
    
    // Insert cards
    console.log("Inserting cards...");
    const insertedCards = await CreditCard.insertMany(cards);
    console.log(`✓ Inserted ${insertedCards.length} cards`);
    
    // Create a test user with some cards
    console.log("Creating test user...");
    const hashedPassword = await bcrypt.hash("password123", 10);
    
    // Assign first 3 cards to the test user
    const userCards = insertedCards.slice(0, 3).map(card => card._id);
    
    const testUser = await User.create({
      username: "testuser",
      email: "test@example.com",
      password: hashedPassword,
      cards: userCards
    });
    
    console.log(`✓ Created test user: ${testUser.email}`);
    console.log(`✓ Assigned ${userCards.length} cards to test user`);
    console.log("\nTest user credentials:");
    console.log("Email: test@example.com");
    console.log("Password: password123");
    console.log("\nDatabase seeded successfully!");
    
    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
}

seedDB();


