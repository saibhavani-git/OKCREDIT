import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import dbConnect from "../../lib/db";
import User from "../../models/user";
import CreditCard from "../../models/cards";
import {verifyAuth } from "../../lib/auth"; 


export async function POST(request) {
  try {
    await dbConnect();

    //  Auth
    const {userId} = await verifyAuth(request);
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    //  User + cards
    const user = await User.findById(userId).populate("cards").lean();
    if (!user || !user.cards?.length) {
      return NextResponse.json({ message: "No cards found" }, { status: 404 });
    }

    //  Request body
    const { prompt } = await request.json();
    if (!prompt) {
      return NextResponse.json(
        { message: "User input is required" },
        { status: 400 }
      );
    }

    //  Extract amount and purpose from prompt
    const extractAmountAndPurpose = (text) => {
      const amountMatch = text.match(/(?:₹|rs|rupees?|INR)\s*(\d+(?:,\d{3})*(?:\.\d{2})?)|(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:₹|rs|rupees?|INR)/i);
      let amount = null;
      if (amountMatch) {
        amount = parseFloat(amountMatch[1] || amountMatch[2]?.replace(/,/g, ''));
      }

      // Common purpose keywords
      const purposeKeywords = [
        'amazon', 'flipkart', 'myntra', 'swiggy', 'zomato', 'uber', 'ola',
        'travel', 'flight', 'hotel', 'booking', 'makemytrip', 'goibibo',
        'fuel', 'petrol', 'diesel', 'bharat petrol', 'iocl', 'hp',
        'dining', 'restaurant', 'food', 'cafe',
        'groceries', 'bigbasket', 'grocers',
        'shopping', 'online shopping', 'offline shopping'
      ];
      
      const lowerText = text.toLowerCase();
      const purpose = purposeKeywords.find(keyword => lowerText.includes(keyword)) || null;

      return { amount, purpose };
    };

    const { amount, purpose } = extractAmountAndPurpose(prompt);

    //  Fetch all cards from database
    const databaseCards = await CreditCard.find().lean();

    //  Enhanced AI prompt with amount and purpose - only database cards
    const databaseCardsInfo = databaseCards
      .map(c => 
        `ID: ${c._id} | ${c.bank} ${c.cardName} | Type: ${c.cardType} | Categories: Shopping:${c.categories?.shopping || 1}x, Travel:${c.categories?.travel || 1}x, Fuel:${c.categories?.fuel || 1}x | Best For: ${c.bestFor?.join(', ') || 'general'} | Reward: ${c.rewardRateText || 'standard'}`
      )
      .join("\n");

    
    //  Fallback scoring function (used if AI fails or for backup)
    const scoreCards = (cards, amount, purpose) => {
      return cards.map(card => {
        let score = 0;
        
        // Purpose-based scoring
        if (purpose) {
          const lowerPurpose = purpose.toLowerCase();
          if (lowerPurpose === 'amazon' || lowerPurpose === 'flipkart') {
            score += (card.categories?.shopping || 1) * 10;
            if (card.bestFor?.some(bf => bf.toLowerCase().includes(lowerPurpose))) {
              score += 20;
            }
            if (lowerPurpose === 'amazon' && card.perks?.amazonPrime) {
              score += 15;
            }
          } else if (lowerPurpose === 'travel' || lowerPurpose === 'flight' || lowerPurpose === 'hotel') {
            score += (card.categories?.travel || 1) * 10;
            if (card.cardType === 'Travel') score += 15;
          } else if (lowerPurpose === 'fuel' || lowerPurpose === 'petrol' || lowerPurpose === 'diesel') {
            score += (card.categories?.fuel || 1) * 10;
            if (card.cardType === 'Fuel') score += 15;
          } else if (lowerPurpose === 'dining' || lowerPurpose === 'food' || lowerPurpose === 'swiggy' || lowerPurpose === 'zomato') {
            score += (card.categories?.dining || 1) * 10;
            if (card.bestFor?.some(bf => bf.toLowerCase().includes(lowerPurpose))) {
              score += 20;
            }
          } else if (lowerPurpose === 'shopping') {
            score += (card.categories?.shopping || 1) * 10;
          }
        }
        
        // Amount-based scoring
        if (amount) {
          // Prefer cards with suitable limits (not too low, not unnecessarily high)
          if (card.availableLimit >= amount * 1.2) {
            score += 10;
          }
          // For large amounts, prefer premium cards
          if (amount > 50000 && card.cardType !== 'Basic') {
            score += 5;
          }
        }
        
        // General scoring
        score += card.popularityScore || 0;
        if (card.annualFee === 0) score += 5;
        
        return { ...card, recommendationScore: score };
      }).sort((a, b) => b.recommendationScore - a.recommendationScore);
    };

    let recommendedCardIds = [];
    
    // try {
    //   // Try AI recommendation first
    //   const ai = new GoogleGenAI({});
    //   const response = await ai.models.generateContent({
    //     model: "gemini-3-flash-preview",
    //     contents: aiPrompt,
    //   });

    //   const aiResponseText = response.text?.trim() || '';
      
    //   // Try to parse JSON array from AI response
    //   // Handle cases where response might be wrapped in markdown code blocks
    //   let jsonMatch = aiResponseText.match(/\[.*\]/s);
    //   if (jsonMatch) {
    //     try {
    //       const parsed = JSON.parse(jsonMatch[0]);
    //       if (Array.isArray(parsed) && parsed.length > 0) {
    //         // Validate that IDs exist in database cards
    //         const allDatabaseIds = databaseCards.map(c => c._id.toString());
            
    //         // Filter and validate parsed IDs are from database
    //         recommendedCardIds = parsed
    //           .slice(0, 3)
    //           .map(id => id.toString())
    //           .filter(id => allDatabaseIds.includes(id));
    //       }
    //     } catch (e) {
    //       console.log("Failed to parse AI response as JSON:", e);
    //     }
    //   }
    // } catch (aiError) {
    //   console.error("AI recommendation failed:", aiError);
    // }

    //  If AI didn't provide valid IDs, use fallback scoring from database only
    if (recommendedCardIds.length === 0) {
      // Convert database cards to plain objects
      const dbCardsPlain = databaseCards.map(c => ({
        ...c,
        _id: c._id.toString()
      }));
      
      // Score all database cards based on amount and purpose
      const scoredCards = scoreCards(dbCardsPlain, amount, purpose);
      
      // Take top 3 cards from database
      recommendedCardIds = scoredCards.slice(0, 3).map(c => c._id);
    }

    //  Fetch the actual card objects
    const recommendedCards = await CreditCard.find({
      _id: { $in: recommendedCardIds }
    }).lean();

    //  Mark which cards user already has and which need to be added
    const userCardIds = user.cards.map(c => c._id.toString());
    const cardsWithSource = recommendedCardIds.map(id => {
      const card = recommendedCards.find(c => c._id.toString() === id.toString());
      if (card) {
        const userHasCard = userCardIds.includes(id.toString());
        return {
          ...card,
          isFromDatabase: true, // All cards are from database
          needsToBeAdded: !userHasCard, // Only mark as needs to be added if user doesn't have it
          userAlreadyHas: userHasCard // Flag to indicate if user already owns this card
        };
      }
      return null;
    }).filter(Boolean);

    //  Reorder to match recommendation priority
    const orderedCards = recommendedCardIds
      .map(id => cardsWithSource.find(c => c._id.toString() === id.toString()))
      .filter(Boolean);

    // Count how many cards user already has vs new recommendations
    const userHasCount = orderedCards.filter(c => c.userAlreadyHas).length;
    const newCardsCount = orderedCards.filter(c => c.needsToBeAdded).length;

    return NextResponse.json({
      cards: orderedCards,
      cardIds: recommendedCardIds,
      message: newCardsCount > 0 
        ? `Based on your request, we've recommended 3 cards. ${userHasCount > 0 ? `You already have ${userHasCount} of these card(s). ` : ''}${newCardsCount > 0 ? `Consider adding ${newCardsCount} new card(s) for better benefits.` : ''}`
        : `Based on your request, we've recommended 3 cards. You already have all of these cards in your collection.`
    });
  } catch (error) {
    console.error("Error generating recommendation:", error);

    return NextResponse.json(
      { message: "Failed to generate recommendation" },
      { status: 500 }
    );
  }
}
