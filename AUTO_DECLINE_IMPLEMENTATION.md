# Automatic Decline System - Implementation Complete

## Overview
When a buyer selects one seller as the winner (clicks "ADVANCE PAID"), all other sellers are automatically marked as declined.

## Changes Made

### 1. Database Schema Updates

**Lead Model** (`upvc-final-2/models/Admin/lead.js`):

Added new fields to seller entries:
```javascript
seller: [{
  // ... existing fields
  
  // NEW FIELDS
  sellerStatus: {
    type: String,
    enum: ['active', 'declined', 'winner'],
    default: 'active'
  },
  declinedAt: {
    type: Date
  },
  
  // Updated enum
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded', 'transferred_to_revenue', 'declined'],
    default: 'paid'
  }
}]
```

**Status Values:**
- `active` - Seller is still in consideration
- `declined` - Seller was not selected (auto-declined)
- `winner` - Seller was selected as winner

### 2. Backend Logic Updates

**Transaction Controller** (`upvc-final-2/controllers/Buyer/transactionController.js`):

#### When Buyer Selects Winner:
```javascript
// Mark winner and decline other sellers
lead.seller.forEach(sellerEntry => {
  if (sellerEntry.sellerId._id.toString() === sellerId.toString()) {
    // Mark as winner
    sellerEntry.sellerStatus = 'winner';
  } else {
    // Mark as declined
    sellerEntry.sellerStatus = 'declined';
    sellerEntry.declinedAt = new Date();
  }
});
```

#### Notifications Sent:
1. **Winner Notification** - "🎉 Congratulations! You Won!"
2. **Decline Notifications** - "❌ Lead Declined" (to all other sellers)

### 3. Notification System

**New Notification Functions** (`upvc-final-2/utils/notificationHelper.js`):

```javascript
// Send decline notification
exports.sendSellerDeclineNotification = async (fcmToken, data) => {
  // Push notification
  title: '❌ Lead Declined'
  body: '{Buyer} has selected another seller. Your escrow will be refunded soon.'
}

// Save decline notification
exports.saveSellerDeclineNotification = async (sellerId, data) => {
  // In-app notification
}
```

### 4. Frontend UI Updates

**TransactionPage** (`UPVC/src/screens/Buyer/Dashboard/TransactionPage.jsx`):

#### Seller Card States:

**Active Seller (No winner selected yet):**
```
┌─────────────────────────────────────┐
│ Seller Name                         │
│ Location                            │
│ Contact details                     │
│                                     │
│ [DECLINE]    [ADVANCE PAID]         │
│ 🏷️ Get 5% discount                 │
└─────────────────────────────────────┘
```

**Declined Seller:**
```
┌─────────────────────────────────────┐
│ Seller Name (grayed out)            │
│ Location                            │
│ Contact details                     │
│                                     │
│ ❌ Declined                         │
└─────────────────────────────────────┘
```

**Winner Seller:**
```
┌─────────────────────────────────────┐
│ Seller Name                         │
│ Location                            │
│ Contact details                     │
│                                     │
│ ✅ Selected as Winner               │
└─────────────────────────────────────┘
```

#### Visual Changes:
- Declined cards: Grayed out (opacity 0.6, gray background)
- Winner card: Green badge "Selected as Winner"
- Declined card: Red badge "Declined"
- Buttons hidden for declined/winner sellers

### 5. Complete Flow

```
1. Buyer creates lead
   ↓
2. 3 sellers purchase lead (all status: 'active')
   ↓
3. Buyer navigates to TransactionPage
   ↓
4. Buyer sees all 3 sellers with DECLINE/ADVANCE PAID buttons
   ↓
5. Buyer clicks "ADVANCE PAID" on Seller A
   ↓
6. Backend automatically:
   - Sets Seller A status: 'winner'
   - Sets Seller B status: 'declined'
   - Sets Seller C status: 'declined'
   - Sends win notification to Seller A
   - Sends decline notifications to Seller B & C
   ↓
7. Frontend refreshes:
   - Seller A shows: "✅ Selected as Winner"
   - Seller B shows: "❌ Declined" (grayed out)
   - Seller C shows: "❌ Declined" (grayed out)
   ↓
8. Seller A confirms win
   ↓
9. Escrow processed:
   - Seller A: Escrow → Platform Revenue
   - Seller B: Escrow → Refunded (98%)
   - Seller C: Escrow → Refunded (98%)
```

## API Response Format

### GET `/api/buyers/leads/:leadId/transaction`

**Response includes sellerStatus:**
```json
{
  "success": true,
  "lead": { ... },
  "sellers": [
    {
      "id": "seller1_id",
      "businessName": "Company A",
      "sellerStatus": "winner",
      ...
    },
    {
      "id": "seller2_id",
      "businessName": "Company B",
      "sellerStatus": "declined",
      ...
    },
    {
      "id": "seller3_id",
      "businessName": "Company C",
      "sellerStatus": "declined",
      ...
    }
  ]
}
```

## Error Prevention

### "Winner Already Selected" Error - FIXED

**Problem:** Buyer could click "ADVANCE PAID" multiple times

**Solution:** 
1. Check if winner already exists before allowing selection
2. Frontend shows status badges instead of buttons after selection
3. Backend validates winner not already set

**Code:**
```javascript
// Backend validation
if (lead.winnerSellerId) {
  return res.status(400).json({
    success: false,
    message: 'Winner already selected for this lead'
  });
}
```

## Benefits

1. **Automatic Process** - No manual decline needed
2. **Clear Status** - Visual indication of declined sellers
3. **Notifications** - All sellers informed immediately
4. **No Confusion** - Only one winner possible
5. **Clean UI** - Declined sellers clearly marked

## Testing Checklist

- [x] Create lead with 3 sellers
- [x] Navigate to TransactionPage
- [x] Verify all 3 sellers show DECLINE/ADVANCE PAID buttons
- [x] Click ADVANCE PAID on one seller
- [x] Verify winner selected successfully
- [x] Verify other 2 sellers automatically marked as declined
- [x] Verify UI updates:
  - Winner shows green "Selected as Winner" badge
  - Declined sellers show red "Declined" badge
  - Declined sellers grayed out
  - Buttons hidden for all sellers
- [x] Verify notifications sent:
  - Winner receives win notification
  - Declined sellers receive decline notification
- [x] Verify cannot select winner again (error message)
- [x] Seller confirms win
- [x] Verify escrow processed correctly

## Files Modified

### Backend:
- `upvc-final-2/models/Admin/lead.js` - Added sellerStatus and declinedAt fields
- `upvc-final-2/controllers/Buyer/transactionController.js` - Auto-decline logic, return sellerStatus
- `upvc-final-2/utils/notificationHelper.js` - Added decline notification functions

### Frontend:
- `UPVC/src/screens/Buyer/Dashboard/TransactionPage.jsx` - Show status badges, hide buttons for declined/winner

## Status

✅ Database schema updated
✅ Auto-decline logic implemented
✅ Decline notifications added
✅ Frontend UI updated with status badges
✅ Grayed out declined sellers
✅ Winner already selected error prevented
✅ Ready for production

