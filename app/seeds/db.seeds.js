import dotenv from 'dotenv'
// Load environment variables from .env file
dotenv.config();

import mongoose from "mongoose";
import bcrypt from 'bcryptjs';

import dbConnect from "../lib/db.js";
import CreditCard from "../models/cards.js";
import User from "../models/user.js";
import creditCards from "../data/creditCards.js";
import offersData from '../data/offers.js';
import Offer from '../models/offers.js'

// Test if environment variables loaded
console.log("MONGODB_URI =", process.env.MONGODB_URI); // This should print your URI

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
    const insertedCards = await CreditCard.insertMany(creditCards);
    console.log(`✓ Inserted ${insertedCards.length} cards`);
    const insertedOffers= await Offer.insertMany(offersData)
    // Create a test user with some cards
    console.log("Creating test user...");
    const hashedPassword = await bcrypt.hash("password123", 10);
    
    // Assign first 3 cards to the test user
   
    console.log("\nDatabase seeded successfully!");
    
    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
}

seedDB();


