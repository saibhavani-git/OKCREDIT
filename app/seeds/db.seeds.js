import dotenv from 'dotenv'
// Load environment variables from .env file
dotenv.config();

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
    
    // Clear cards/offers. Users are only removed if SEED_CLEAR_USERS=true
    // (otherwise registered accounts stay; card ObjectIds are re-created below).
    console.log("Clearing cards and offers...");
    await CreditCard.deleteMany({});
    await Offer.deleteMany({});

    if (process.env.SEED_CLEAR_USERS === "true") {
      await User.deleteMany({});
      console.log("✓ Cleared users (SEED_CLEAR_USERS=true)");
    } else {
      console.log(
        "✓ Kept existing users (set SEED_CLEAR_USERS=true to wipe all users)"
      );
    }
    
    // Insert cards
    console.log("Inserting cards...");
    const insertedCards = await CreditCard.insertMany(creditCards);
    console.log(`✓ Inserted ${insertedCards.length} cards`);
    const insertedOffers = await Offer.insertMany(offersData);
    console.log(`✓ Inserted ${insertedOffers.length} offers`);

    console.log("\nDatabase seeded successfully!");
    
    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
    
  }
}

seedDB();


