# Card Recommendation System - Code Explanation

## 🎯 Overview
This system recommends credit cards based on user input (amount + purpose), prioritizing the user's existing cards first.

---

## 📋 Code Flow Diagram

```
User Input → Extract Amount & Purpose → Try AI Recommendation → Fallback Scoring → Return Results
     ↓                ↓                        ↓                      ↓
 "pay 1000         Amount: ₹1000           AI returns 3 IDs     Score cards by
  for amazon"      Purpose: "amazon"       OR fails            amount & purpose
```

---

## 🔍 Detailed Code Breakdown

### 1. **Authentication & Setup** (Lines 10-31)
```javascript
await dbConnect();
const {userId} = await verifyAuth(request);
const user = await User.findById(userId).populate("cards").lean();
```
- Connects to database
- Verifies user is logged in
- Fetches user with their cards

---

### 2. **Extract Amount & Purpose** (Lines 33-57)
```javascript
const extractAmountAndPurpose = (text) => {
  // Regex to find amount: "1000 rs", "₹1000", "1000 rupees"
  const amountMatch = text.match(/(?:₹|rs|rupees?|INR)\s*(\d+...)/i);
  
  // Find purpose keywords like "amazon", "fuel", "travel"
  const purpose = purposeKeywords.find(keyword => lowerText.includes(keyword));
}
```

**Example:**
- Input: `"i want to pay 1000 rs for amazon"`
- Extracted: `{ amount: 1000, purpose: "amazon" }`

---

### 3. **Prepare AI Prompt** (Lines 62-105)

#### User Cards Info (Lines 63-68)
Formats each user card with:
- ID, Bank, Card Name
- Categories (Shopping: 5x, Travel: 1x, etc.)
- Best For tags
- Reward rate text

#### AI Prompt Structure (Lines 76-105)
```
User request: "pay 1000 for amazon"
Transaction Amount: ₹1000
Purpose/Category: amazon

User's existing cards (PRIORITIZE THESE FIRST):
[Card details...]

Available database cards (ONLY if user has < 3 cards):
[Card details...]

RECOMMENDATION CRITERIA:
1. Consider amount
2. Purpose-specific matching
3. CRITICAL: Prioritize user cards first
```

---

### 4. **Scoring Function** (Lines 107-162)

This is the **fallback system** that runs if AI fails.

#### Scoring Logic:
```javascript
scoreCards(cards, amount, purpose, isUserCard)
```

**Scoring Breakdown:**

| Factor | Score | Example |
|--------|-------|---------|
| **User Card Boost** | +1000 | Ensures user cards always ranked first |
| **Purpose Match** | +10 per multiplier | Amazon → Shopping 5x = +50 points |
| **Best For Match** | +20 | Card with "amazon" in bestFor |
| **Special Perks** | +15 | Amazon Pay card with amazonPrime perk |
| **Suitable Limit** | +10 | Card limit ≥ amount × 1.2 |
| **No Annual Fee** | +5 | Free cards get bonus |
| **Popularity** | +0-100 | Based on popularityScore |

**Example Scoring:**
```
Card: Amazon Pay ICICI
- User card: +1000
- Shopping 5x for "amazon": +50
- Best for "amazon": +20
- amazonPrime perk: +15
- No annual fee: +5
Total Score: 1090
```

---

### 5. **AI Recommendation** (Lines 164-218)

#### Step 1: Call AI (Lines 166-172)
```javascript
const ai = new GoogleGenAI({});
const response = await ai.models.generateContent({
  model: "gemini-3-flash-preview",
  contents: aiPrompt,
});
```

#### Step 2: Parse Response (Lines 174-195)
```javascript
// Extract JSON array from AI response
// Handles: ["id1","id2","id3"] or ```json ["id1","id2","id3"] ```
let jsonMatch = aiResponseText.match(/\[.*\]/s);
const parsed = JSON.parse(jsonMatch[0]);
```

#### Step 3: Validate & Prioritize (Lines 197-210)
```javascript
// Separate user cards from database cards
const userCardMatches = parsedIds.filter(id => userCardIds.includes(id));
const dbCardMatches = parsedIds.filter(id => !userCardIds.includes(id));

// If user has 3+ cards: only use user cards
if (user.cards.length >= 3) {
  recommendedCardIds = userCardMatches.slice(0, 3);
} else {
  // Combine: user cards first, then database cards
  recommendedCardIds = [...userCardMatches, ...dbCardMatches].slice(0, 3);
}
```

---

### 6. **Fallback Scoring** (Lines 220-253)

Runs if AI fails or returns invalid IDs.

#### Process:
```javascript
// 1. Score user cards with priority boost
const scoredUserCards = scoreCards(userCardsPlain, amount, purpose, true);
const topUserCards = scoredUserCards.slice(0, Math.min(3, user.cards.length));

// 2. If user has < 3 cards, supplement with database cards
if (user.cards.length < 3) {
  const scoredDbCards = scoreCards(additionalCards, amount, purpose, false);
  // Add top database cards to reach 3 total
}
```

---

### 7. **Mark Database Cards** (Lines 260-272)

Identifies which cards need to be added:
```javascript
cardsWithSource = recommendedCardIds.map(id => {
  const card = recommendedCards.find(c => c._id === id);
  return {
    ...card,
    needsToBeAdded: !userCardIds.includes(id) // true if from database
  };
});
```

---

### 8. **Return Response** (Lines 279-285)

```javascript
return NextResponse.json({
  cards: orderedCards,           // Array of card objects
  cardIds: recommendedCardIds,   // Array of IDs
  message: "You have 2 card(s). We've recommended 2 from your existing cards and 1 new card(s)..."
});
```

---

## 🔄 Complete Flow Example

### Input: `"pay 5000 for fuel"`

1. **Extract:**
   - Amount: ₹5000
   - Purpose: "fuel"

2. **AI Prompt:**
   - Shows user's cards with fuel category multipliers
   - Shows database fuel cards if user has < 3 cards

3. **AI Returns:** `["userCardId1", "dbCardId5", "userCardId2"]`

4. **Validate:**
   - userCardId1 → User's card ✅
   - dbCardId5 → Database card (fuel card) ✅
   - userCardId2 → User's card ✅

5. **Result:**
   ```json
   {
     "cards": [
       { "cardName": "Axis IndianOil", "needsToBeAdded": false },
       { "cardName": "SBI BPCL", "needsToBeAdded": true },  // ← From database
       { "cardName": "ICICI HPCL", "needsToBeAdded": false }
     ],
     "message": "You have 2 card(s). We've recommended 2 from existing cards and 1 new card(s)..."
   }
   ```

---

## 🎨 Frontend Display (app/recommendCards/page.jsx)

### Key Features:

1. **Message Display:**
   ```jsx
   {recommendationMessage && (
     <div className="bg-blue-900/20">
       <p>{recommendationMessage}</p>
     </div>
   )}
   ```

2. **"ADD THIS CARD" Badge:**
   ```jsx
   {card.needsToBeAdded && (
     <span className="bg-yellow-500">ADD THIS CARD</span>
   )}
   ```

3. **Add Button in Modal:**
   ```jsx
   {selectedCard.needsToBeAdded && (
     <button onClick={addCardToCollection}>
       Add This Card to My Collection
     </button>
   )}
   ```

---

## 🔑 Key Concepts

### Priority System:
1. **User Cards First:** Always recommended before database cards
2. **Scoring Boost:** User cards get +1000 points to ensure priority
3. **Smart Supplementation:** Only uses database cards if user has < 3 cards

### Purpose Matching:
- **Amazon** → High shopping multipliers, Amazon Pay cards
- **Fuel** → Fuel category cards (Axis IndianOil, SBI BPCL)
- **Travel** → Travel cards with high travel multipliers
- **Dining** → Cards with high dining multipliers

### Amount Consideration:
- Ensures card limit ≥ amount × 1.2
- For large amounts (>₹50k), prefers premium cards

---

## 🐛 Notes on Your Commented Line

Line 191 has `userCardIds` commented out, but it's already defined on **line 184**, so the code still works correctly. The variable is used on line 198 for filtering.

You can safely remove the commented line 191 since `userCardIds` is already available from line 184.

---

## 💡 Why This Design?

1. **Reliability:** AI + Fallback scoring = always returns results
2. **User-First:** Prioritizes cards user already owns
3. **Context-Aware:** Considers amount AND purpose
4. **Transparency:** Shows which cards need to be added

---

## 🚀 Testing Scenarios

### Scenario 1: User has 5 cards
- Input: "pay 2000 for amazon"
- Result: All 3 from user's cards
- Message: "All recommendations from your existing 5 card(s)."

### Scenario 2: User has 2 cards
- Input: "pay 5000 for fuel"
- Result: 2 user cards + 1 database fuel card
- Database card shows "ADD THIS CARD" badge

### Scenario 3: User has 1 card
- Input: "pay 1000 for travel"
- Result: 1 user card + 2 database travel cards
- Message explains breakdown

