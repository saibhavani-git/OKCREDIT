# Visual Flow - Card Recommendation System

## 📊 Complete Request Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    USER INPUT                                │
│         "i want to pay 1000 rs for amazon"                  │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│           STEP 1: EXTRACT INFORMATION                        │
│  • Amount: ₹1000                                            │
│  • Purpose: "amazon"                                        │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│           STEP 2: FETCH DATA                                 │
│  • User's existing cards (e.g., 2 cards)                   │
│  • All database cards (e.g., 18 cards)                     │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│           STEP 3: BUILD AI PROMPT                            │
│  • User cards with details                                  │
│  • Database cards (only if user has < 3 cards)             │
│  • Extraction info: Amount ₹1000, Purpose "amazon"         │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│           STEP 4: AI RECOMMENDATION                          │
│                    ┌─────────────┐                          │
│                    │  Gemini AI  │                          │
│                    │   (Try)     │                          │
│                    └──────┬──────┘                          │
│                           │                                 │
│                    ┌──────▼──────┐                          │
│                    │  Success?   │                          │
│                    └──┬───────┬──┘                          │
│                  Yes  │       │  No                         │
│                       ▼       ▼                             │
│            ┌────────────┐  ┌──────────────┐                │
│            │ Parse JSON │  │ Use Fallback │                │
│            │   Array    │  │   Scoring    │                │
│            └─────┬──────┘  └──────┬───────┘                │
│                  │                 │                        │
│                  └────────┬────────┘                        │
│                           │                                 │
└───────────────────────────┼─────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│           STEP 5: PRIORITIZE & VALIDATE                      │
│                                                              │
│  IF user has 3+ cards:                                      │
│    → Only use user's cards                                  │
│                                                              │
│  IF user has < 3 cards:                                     │
│    → User cards first                                       │
│    → Supplement with database cards                         │
│                                                              │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│           STEP 6: MARK DATABASE CARDS                        │
│  • Add `needsToBeAdded: true` flag                          │
│  • Add `isFromDatabase: true` flag                          │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│           STEP 7: RETURN RESPONSE                            │
│  {                                                           │
│    cards: [card1, card2, card3],                            │
│    cardIds: ["id1", "id2", "id3"],                          │
│    message: "You have 2 cards. Recommended 2 existing..."   │
│  }                                                           │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│           STEP 8: FRONTEND DISPLAY                           │
│  • Show recommendation message                               │
│  • Display 3 cards                                           │
│  • Show "ADD THIS CARD" badge on database cards             │
│  • Show "Add Card" button in modal                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Scoring Algorithm Breakdown

### For User Cards:
```
Base Score = 1000 (Priority Boost)

IF purpose = "amazon":
  + (shopping_multiplier × 10)
  + 20 if "amazon" in bestFor
  + 15 if amazonPrime perk exists

IF amount provided:
  + 10 if availableLimit ≥ (amount × 1.2)
  + 5 if amount > 50000 AND cardType ≠ "Basic"

General:
  + popularityScore
  + 5 if annualFee === 0

Total Score = 1000 + purpose_score + amount_score + general_score
```

### For Database Cards:
```
Base Score = 0 (No priority boost)

Same scoring logic as above
But NO +1000 boost

Total Score = purpose_score + amount_score + general_score
```

**Result:** User cards ALWAYS rank higher (score > 1000 vs score < 200)

---

## 🔄 Decision Tree

```
                    User Request
                         │
        ┌────────────────┴────────────────┐
        │                                  │
   Extract Amount                      Extract Purpose
        │                                  │
        └────────────┬─────────────────────┘
                     │
              Build AI Prompt
                     │
        ┌────────────┴────────────┐
        │                         │
   User has ≥ 3 cards       User has < 3 cards
        │                         │
   Show only user          Show user cards first
   cards in prompt              + database cards
        │                         │
        └────────────┬────────────┘
                     │
              Get AI Response
                     │
        ┌────────────┴────────────┐
        │                         │
   AI Succeeds              AI Fails
   (returns IDs)            (returns nothing)
        │                         │
   Validate IDs              Use Scoring Function
        │                         │
   Prioritize User Cards     Score User Cards (boost)
   Over Database Cards       Score Database Cards
        │                         │
        └────────────┬────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
   User has ≥ 3 cards       User has < 3 cards
        │                         │
   Return 3 user           Return X user cards
   cards only              + (3-X) database cards
        │                         │
        └────────────┬────────────┘
                     │
              Mark Database Cards
              (needsToBeAdded: true)
                     │
              Return Response
```

---

## 📝 Example Walkthrough

### Input: `"pay 5000 for fuel"`

#### Step 1: Extraction
```
Amount: ₹5000
Purpose: "fuel"
```

#### Step 2: User Data
```
User Cards: 2 cards
- HDFC Millennia (shopping: 5x, fuel: 1x)
- ICICI Amazon Pay (shopping: 5x, fuel: 1x)
```

#### Step 3: Scoring

**HDFC Millennia (User Card):**
- User boost: +1000
- Fuel category: 1x → +10
- Suitable limit: +10
- Popularity: +95
- **Total: 1115**

**ICICI Amazon Pay (User Card):**
- User boost: +1000
- Fuel category: 1x → +10
- Suitable limit: +10
- Popularity: +98
- **Total: 1118**

**Axis IndianOil (Database Card):**
- User boost: 0
- Fuel category: 4x → +40
- Fuel card type: +15
- Fuel waiver: +5
- Popularity: +85
- **Total: 145** (but still lower than user cards!)

#### Step 4: Result
```
Recommended Cards:
1. ICICI Amazon Pay (score: 1118) - User card
2. HDFC Millennia (score: 1115) - User card
3. Axis IndianOil (score: 145) - Database card [needsToBeAdded: true]
```

#### Step 5: Frontend Display
```
Message: "You have 2 card(s). We've recommended 2 from your existing cards 
          and 1 new card(s) that you should consider adding."

Card 1: ICICI Amazon Pay [User's card]
Card 2: HDFC Millennia [User's card]
Card 3: Axis IndianOil [🟡 ADD THIS CARD badge]
```

---

## 🎨 Frontend Component Flow

```
recommendCards/page.jsx
         │
         ├── useEffect (on page load)
         │      │
         │      ├── Extract prompt from URL
         │      │
         │      └── Fetch from /api/getrecommendation
         │             │
         │             ├── Success
         │             │      │
         │             │      ├── Store cards
         │             │      └── Store message
         │             │
         │             └── Error
         │                    └── Show error message
         │
         ├── Render Cards
         │      │
         │      ├── Show recommendation message
         │      │
         │      ├── Display 3 cards
         │      │      │
         │      │      ├── User's card → Normal display
         │      │      │
         │      │      └── Database card → "ADD THIS CARD" badge
         │      │
         │      └── Card Modal (on click)
         │             │
         │             ├── Show card details
         │             │
         │             └── If needsToBeAdded:
         │                    Show "Add Card" button
         │                    → Calls /api/userCards (POST)
         │                    → Adds card to user's collection
```

---

## 🔍 Key Variables Explained

| Variable | Purpose | Example |
|----------|---------|---------|
| `amount` | Extracted transaction amount | `1000` |
| `purpose` | Extracted purpose keyword | `"amazon"` |
| `userCardIds` | Array of user's card IDs | `["id1", "id2"]` |
| `databaseCards` | All cards from database | `[{...}, {...}]` |
| `recommendedCardIds` | Final 3 card IDs to return | `["id1", "id2", "id5"]` |
| `needsToBeAdded` | Flag for database cards | `true` / `false` |
| `recommendationScore` | Calculated score for ranking | `1115` |

---

## 💡 Pro Tips

1. **User cards always win** due to +1000 boost
2. **Purpose matching** is more important than amount
3. **Database cards** are only shown if user has < 3 cards
4. **Scoring system** ensures fair ranking even without AI
5. **Frontend badges** make it clear which cards need action

