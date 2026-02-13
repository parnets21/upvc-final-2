# Document Approval/Rejection Feature

## Overview
Implemented individual document approval/rejection system for seller documents (GST Certificate, Visiting Card, Business Profile Video) in the admin panel.

## Changes Made

### 1. Database Model Updates (`models/Seller/Seller.js`)

Added status and rejection reason fields for each document type:

```javascript
// For GST Certificate
gstCertificateStatus: {
  type: String,
  enum: ["pending", "approved", "rejected"],
  default: "pending",
},
gstCertificateRejectionReason: {
  type: String,
  trim: true,
},

// For Visiting Card
visitingCardStatus: {
  type: String,
  enum: ["pending", "approved", "rejected"],
  default: "pending",
},
visitingCardRejectionReason: {
  type: String,
  trim: true,
},

// For Business Profile Video
businessProfileVideoStatus: {
  type: String,
  enum: ["pending", "approved", "rejected"],
  default: "pending",
},
businessProfileVideoRejectionReason: {
  type: String,
  trim: true,
}
```

### 2. Backend Controller (`controllers/Seller/sellerController.js`)

#### Updated `getSellerDocuments` function:
- Now returns document status (pending/approved/rejected)
- Returns rejection reason if document is rejected

#### Added `approveDocument` function:
- Approves a specific document
- Clears any previous rejection reason
- Validates document type and existence

#### Added `rejectDocument` function:
- Rejects a specific document with a reason
- Requires rejection reason (mandatory)
- Validates document type and existence

### 3. Backend Routes (`routes/Admin/sellerManagement.js`)

Added new routes:
```javascript
router.put('/sellers/:sellerId/documents/:documentType/approve', adminController.approveDocument);
router.put('/sellers/:sellerId/documents/:documentType/reject', adminController.rejectDocument);
```

**Valid document types:**
- `gstCertificate`
- `visitingCard`
- `businessProfileVideo`

### 4. Frontend Service (`Upvc Web/src/services/admin/sellerService.js`)

Added API methods:
```javascript
approveDocument: (sellerId, documentType) => 
  api.put(`/seller/managment/sellers/${sellerId}/documents/${documentType}/approve`),
  
rejectDocument: (sellerId, documentType, data) => 
  api.put(`/seller/managment/sellers/${sellerId}/documents/${documentType}/reject`, data),
```

### 5. Frontend UI (`Upvc Web/src/pages/admin/Sellers.jsx`)

#### Enhanced Documents Modal:
- Shows document status badge (Pending/Approved/Rejected)
- Displays rejection reason if document is rejected
- Added "Approve" button (hidden if already approved)
- Added "Reject" button (hidden if already rejected)
- Improved UI with better styling and layout

#### Added Handler Functions:
- `handleApproveDocument(sellerId, documentType)` - Approves a document
- `handleRejectDocument(sellerId, documentType)` - Rejects a document with reason prompt

## API Endpoints

### Get Seller Documents
```
GET /api/seller/managment/sellers/:sellerId/documents
```

**Response:**
```json
{
  "success": true,
  "seller": {
    "id": "seller_id",
    "companyName": "Company Name"
  },
  "documents": {
    "gstCertificate": {
      "exists": true,
      "path": "/uploads/sellers/file.pdf",
      "type": "GST Certificate",
      "status": "pending",
      "rejectionReason": null
    },
    "visitingCard": {
      "exists": true,
      "path": "/uploads/sellers/card.jpg",
      "type": "Visiting Card",
      "status": "approved",
      "rejectionReason": null
    },
    "businessProfileVideo": {
      "exists": false,
      "path": null,
      "type": "Business Profile Video",
      "status": "pending",
      "rejectionReason": null
    }
  }
}
```

### Approve Document
```
PUT /api/seller/managment/sellers/:sellerId/documents/:documentType/approve
```

**Parameters:**
- `sellerId` - Seller's MongoDB ID
- `documentType` - One of: `gstCertificate`, `visitingCard`, `businessProfileVideo`

**Response:**
```json
{
  "success": true,
  "message": "Document approved successfully",
  "documentType": "gstCertificate",
  "status": "approved"
}
```

### Reject Document
```
PUT /api/seller/managment/sellers/:sellerId/documents/:documentType/reject
```

**Parameters:**
- `sellerId` - Seller's MongoDB ID
- `documentType` - One of: `gstCertificate`, `visitingCard`, `businessProfileVideo`

**Body:**
```json
{
  "reason": "Document is not clear/valid"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Document rejected successfully",
  "documentType": "gstCertificate",
  "status": "rejected",
  "rejectionReason": "Document is not clear/valid"
}
```

## User Flow

1. Admin navigates to Sellers page
2. Clicks "View (X/3)" button in Documents column
3. Documents modal opens showing all three documents
4. For each document:
   - Status badge shows current state (Pending/Approved/Rejected)
   - If rejected, rejection reason is displayed
   - "View" button to open document in new tab
   - "Approve" button (if not already approved)
   - "Reject" button (if not already rejected)
5. When clicking Reject:
   - Prompt appears asking for rejection reason
   - Reason is required (cannot be empty)
6. After approval/rejection:
   - Success message shown
   - Documents modal refreshes to show updated status

## Status Badge Colors

- **Pending**: Yellow background (`bg-yellow-100 text-yellow-800`)
- **Approved**: Green background (`bg-green-100 text-green-800`)
- **Rejected**: Red background (`bg-red-100 text-red-800`)

## Notes

- Document approval/rejection is independent of seller account approval
- Each document can be approved or rejected individually
- Rejection reason is mandatory when rejecting a document
- Approving a document clears any previous rejection reason
- Documents can be re-approved after rejection and vice versa
- All existing sellers will have documents in "pending" status by default

## Future Enhancements (Optional)

1. Email notification to seller when document is rejected with reason
2. Allow seller to re-upload rejected documents
3. Document version history
4. Bulk approve/reject multiple documents
5. Admin comments/notes on documents
6. Document expiry dates (especially for GST certificates)
