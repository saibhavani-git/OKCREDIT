# Quick Reference Guide - Card Recommendation

## 🎯 What This System Does

**Input:** User says "i want to pay 1000 rs for amazon"  
**Output:** 3 recommended cards (prioritizing user's existing cards)

---

## 🔑 Key Rules

1. **User cards come FIRST** - Always recommended before database cards
2. **Only 3 cards** - Always returns exactly 3 recommendations
3. **Smart supplementation** - If user has < 3 cards, adds database cards
4. **Purpose-aware** - Matches cards based on "amazon", "fuel", "travel", etc.
5. **Amount-aware** - Ensures cards have sufficient credit limits

---

## 📍 Code Sections Explained

### Section 1: Extract Amount & Purpose (Lines 33-57)
**What it does:** Finds money amount and purpose from user text  
**Input:** `"pay 1000 rs for amazon"`  
**Output:** `{ amount: 1000, purpose: "amazon" }`

---

### Section 2: AI Prompt Building (Lines 62-105)
**What it does:** Creates instructions for AI  
**Key points:**
- Shows user's cards with full details
- Shows database cards ONLY if user has < 3 cards
- Tells AI to prioritize user cards

---

### Section 3: Scoring Function (Lines 107-162)
**What it does:** Fallback system to rank cards  
**Scoring breakdown:**
```
User Card: +1000 (automatic boost)
Purpose Match: +10 to +50 points
Best For Match: +20 points
Special Perks: +15 points
Suitable Limit: +10 points
No Fee: +5 points
Popularity: 0-100 points
```

**Example:**
- User card for "amazon": ~1100+ points
- Database card for "amazon": ~100 points
- **Result:** User cards always rank higher

---

### Section 4: AI Recommendation (Lines 164-218)
**What it does:** Tries to get recommendations from AI  
**Process:**
1. Call Gemini AI with prompt
2. Parse JSON response: `["id1", "id2", "id3"]`
3. Validate IDs exist
4. Separate user cards from database cards
5. Prioritize user cards

**If AI fails:** Falls back to scoring function (Section 3)

---

### Section 5: Fallback Scoring (Lines 220-253)
**When it runs:** If AI fails or returns invalid IDs  
**Process:**
1. Score all user cards (with +1000 boost)
2. Take top user cards (up to 3)
3. If user has < 3 cards:
   - Score database cards (no boost)
   - Add top database cards to reach 3 total

---

### Section 6: Mark Database Cards (Lines 260-272)
**What it does:** Adds flags to identify cards from database  
**Flags added:**
- `needsToBeAdded: true` - Card is from database
- `isFromDatabase: true` - Same as above

---

### Section 7: Return Response (Lines 279-285)
**What it returns:**
```json
{
  "cards": [card1, card2, card3],
  "cardIds": ["id1", "id2", "id3"],
  "message": "You have 2 cards. Recommended 2 existing and 1 new..."
}
```

---

## 🎨 Frontend Display

### What User Sees:
1. **Recommendation Message** - Explains the breakdown
2. **3 Cards** - Displayed in grid
3. **"ADD THIS CARD" Badge** - Yellow badge on database cards
4. **Modal** - Click card to see details
5. **Add Button** - In modal for database cards

---

## 🔄 Flow Summary

```
User Input
    ↓
Extract Amount & Purpose
    ↓
Build AI Prompt
    ↓
Try AI → Success? → Parse & Validate
    ↓ No
Use Scoring Function
    ↓
Prioritize User Cards
    ↓
Mark Database Cards
    ↓
Return Response
    ↓
Frontend Displays Cards
```

---

## 💡 Important Notes

1. **Line 184:** `userCardIds` is defined here
2. **Line 191:** Commented line (can be removed)
3. **Line 198:** Uses `userCardIds` from line 184
4. **Line 261:** Re-defines `userCardIds` (different scope)

**Why line 261 re-defines?**  
- Different code block scope
- Safe to redefine locally

---

## 🐛 Common Issues & Fixes

### Issue 1: Same cards always shown
**Fix:** Check if `amount` and `purpose` are being extracted correctly

### Issue 2: Database cards not showing "ADD THIS CARD"
**Fix:** Check if `needsToBeAdded` flag is being set correctly

### Issue 3: AI returns wrong cards
**Fix:** Fallback scoring will handle it automatically

---

## 🧪 Test Cases

### Test 1: User has 5 cards, requests "amazon"
**Expected:** 3 cards from user's collection  
**Message:** "All recommendations from your existing 5 cards"

### Test 2: User has 2 cards, requests "fuel"
**Expected:** 2 user cards + 1 database fuel card  
**Message:** "Recommended 2 existing and 1 new card"

### Test 3: User has 1 card, requests "travel"
**Expected:** 1 user card + 2 database travel cards  
**Message:** "Recommended 1 existing and 2 new cards"

---

## 📚 File Locations

- **Backend:** `app/api/getrecommendation/route.js`
- **Frontend:** `app/recommendCards/page.jsx`
- **Card Model:** `app/models/cards.js`
- **Database Seeds:** `app/seeds/db.seeds.js`

---

## 🔗 Related Functions

- `extractAmountAndPurpose()` - Parses user input
- `scoreCards()` - Ranks cards by score
- `verifyAuth()` - Checks user authentication
- `dbConnect()` - Connects to MongoDB

---

## 📝 Summary

**The system prioritizes user's existing cards and only suggests new cards when needed. It uses AI first, then falls back to smart scoring. The frontend clearly shows which cards need to be added.**

