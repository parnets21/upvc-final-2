const Lead = require('../../models/Admin/lead');
const User = require('../../models/Buyer/User');
const Seller = require('../../models/Seller/Seller');
const WindowSubOption = require('../../models/Admin/WindowSubOptions');
const Category = require('../../models/Admin/Category');
const Quote = require('../../models/Buyer/Quote');
const mongoose = require('mongoose');





exports.createLead = async (req, res) => {

  
  try {

    const { quotes, contactInfo, projectInfo, categoryId } = req.body;

    if (!req.user || !req.user._id) {
      console.log('❌ Authentication failed: No user in request');
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required. Please login.' 
      });
    }

    console.log('✅ Authentication verified, fetching buyer...');
    const buyer = await User.findById(req.user._id);
    if (!buyer) {
      console.log('❌ Buyer not found for ID:', req.user._id);
      return res.status(404).json({ success: false, message: 'Buyer not found' });
    }

    console.log('✅ Buyer found:', buyer.name || buyer.mobileNumber);
    console.log('📧 Buyer Email:', buyer.email);
    console.log('📱 Buyer Mobile:', buyer.mobileNumber);

    // ⭐ CHECK FOR ACTIVE LEADS (48-HOUR VALIDATION) ⭐
    console.log('\n🔍 Checking for active leads within 48 hours...');
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const existingLead = await Lead.findOne({
      buyer: req.user._id,
      createdAt: { $gt: fortyEightHoursAgo }
    }).sort({ createdAt: -1 });

    if (existingLead) {
      const leadCreatedAt = new Date(existingLead.createdAt);
      const hoursRemaining = Math.ceil((48 - (Date.now() - leadCreatedAt) / (1000 * 60 * 60)));
      
      console.log('🚫 ACTIVE LEAD FOUND - BLOCKING REQUEST');
      console.log('  Lead ID:', existingLead._id);
      console.log('  Created At:', leadCreatedAt);
      console.log('  Hours Remaining:', hoursRemaining);
      
      return res.status(400).json({
        success: false,
        message: `You already have an active lead. Please wait ${hoursRemaining} hours before creating a new one.`,
        hoursRemaining,
        existingLeadId: existingLead._id
      });
    }
    
    console.log('✅ No active leads found. Proceeding with lead creation...');

    if (!categoryId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Category ID is required' 
      });
    }
const category = await Category.findById(categoryId);
    if (!category) {
      console.log('Category not found for ID:', categoryId);
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
console.log('Category found:', category.name);
if (!quotes || !Array.isArray(quotes) || quotes.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'At least one quote is required' 
      });
    }
let totalSqft = 0;
    let totalQuantity = 0;
const validatedQuotes = [];
for (const quote of quotes) {
      console.log("Processing quote:", quote);
      
      if (!quote.product) {
        return res.status(400).json({ 
          success: false, 
          message: 'Product ID is required for each quote' 
        });
      }

      const product = await WindowSubOption.findById(quote.product);
      if (!product) {
        console.log('Product not found for ID:', quote.product);
        return res.status(404).json({ 
          success: false, 
          message: `Product not found for ID: ${quote.product}` 
        });
      }

      const { height, width, quantity } = quote;

      if (!height || !width || !quantity) {
        return res.status(400).json({
          success: false,
          message: 'Each quote must include height, width, and quantity',
        });
      }

      // Calculate sqft - use provided sqft or calculate from height/width
      // Frontend sends height/width in feet, so calculation is: height * width
      const sqft = quote.sqft || (height * width);
      const quoteSqftTotal = sqft * quantity;

      totalSqft += quoteSqftTotal;
      totalQuantity += quantity;

      validatedQuotes.push({
        productType: quote.productType,
        product: quote.product,
        color: quote.color,
        installationLocation: quote.installationLocation,
        height: height,
        width: width,
        quantity: quantity,
        remark: quote.remark || '',
        sqft: sqft,
        isGenerated: quote.isGenerated !== undefined ? quote.isGenerated : true
      });
    }
validatedQuotes.forEach((q, idx) => {
      console.log(`  Quote ${idx + 1}: Product=${q.product}, Sqft=${q.sqft}, Qty=${q.quantity}`);
    });

    // ⭐ MINIMUM ORDER VALIDATION: 100 SQFT ⭐
    console.log('\n🔍 Validating minimum order quantity...');
    console.log(`  Total Sqft: ${totalSqft}`);
    
    if (totalSqft < 100) {
      console.log('🚫 ORDER REJECTED - Below minimum 100 sqft');
      return res.status(400).json({
        success: false,
        message: `Minimum order quantity is 100 sqft. Your current order is ${totalSqft} sqft. Please add more items to meet the minimum requirement.`,
        currentSqft: totalSqft,
        minimumRequired: 100,
        shortfall: 100 - totalSqft
      });
    }
    
    console.log('✅ Minimum order quantity met');

    if (quotes.some(q => q._id)) {
      const bulkOps = quotes
        .filter(q => q._id) 
        .map(q => ({
          updateOne: {
            filter: { _id: q._id, buyer: req.user._id },
            update: { $set: { isGenerated: q.isGenerated !== undefined ? q.isGenerated : true } }
          }
        }));
      
      if (bulkOps.length > 0) {
        console.log("Updating quotes:", bulkOps.length);
        try {
          await Quote.bulkWrite(bulkOps);
        } catch (error) {
          console.error('Error updating quotes:', error);
        }
      }
    }
    // ⭐ NEW: Category-based pricing and escrow calculation
    const PRICE_PER_SQFT = {
      premium: 550,
      mid: 450,
      economy: 350
    };
const ESCROW_PERCENTAGE = {
      premium: 7.5,
      mid: 7.5,
      economy: 5.0
    };
    const categoryName = category.name.toLowerCase();
    const pricePerSqft = PRICE_PER_SQFT[categoryName] || PRICE_PER_SQFT.mid;
const leadValue = Math.round(totalSqft * pricePerSqft);
  const escrowPercentage = ESCROW_PERCENTAGE[categoryName] || ESCROW_PERCENTAGE.mid;
    const calculatedEscrow = Math.round((leadValue * escrowPercentage) / 100);
    const escrowDepositAmount = Math.min(calculatedEscrow, 6500); // Cap at ₹6,500
    const maxSlots = 3;
const lead = new Lead({
      buyer: req.user._id,
      quotes: validatedQuotes,
      contactInfo,
      projectInfo,
      category: categoryId,
      totalSqft,
      totalQuantity,
      pricePerSqft: pricePerSqft,
      leadValue: leadValue,
      escrowDepositAmount: escrowDepositAmount,
      maxSellers: 3,
      participatingSellersCount: 0,
      status: 'new',
    });
    await lead.save();
    try {
      const Seller = require('../../models/Seller/Seller');
      const Category = require('../../models/Admin/Category');
      const { sendNewLeadNotification, saveSellerNotification } = require('../../utils/notificationHelper');
      const { sendNewLeadEmail } = require('../../utils/emailHelper');

      // Get category details
      const category = await Category.findById(categoryId);
      const categoryName = category ? category.name : 'N/A';

  
      const leadPincode = projectInfo?.pincode || '';
      const leadArea = projectInfo?.area || '';
      const leadAddress = projectInfo?.address || '';
      
      console.log('🔍 Searching for sellers with:');
      console.log('  Pincode:', leadPincode);
      console.log('  Area:', leadArea);
      console.log('  Address:', leadAddress);
      
      // Build query to match by pincode OR city (case-insensitive)
      const sellerQuery = {
        status: 'approved',
        isActive: true,
        $or: []
      };
      
      // Match by pincode if available
      if (leadPincode) {
        sellerQuery.$or.push({ pinCode: leadPincode });
      }
      
      // Match by city (case-insensitive) - try area first, then address
      if (leadArea) {
        sellerQuery.$or.push({ city: new RegExp(leadArea, 'i') });
      }
      if (leadAddress && leadAddress !== leadArea) {
        sellerQuery.$or.push({ city: new RegExp(leadAddress, 'i') });
      }
      if (sellerQuery.$or.length === 0) {
        console.log('⚠️ No location criteria available for seller matching');
        throw new Error('No location criteria for seller matching');
      }
      
      const matchingSellers = await Seller.find(sellerQuery);

      console.log(`✅ Found ${matchingSellers.length} matching sellers`);

      if (matchingSellers.length > 0) {
        const leadData = {
          leadId: lead._id.toString(),
          categoryName: categoryName,
          location: leadArea || leadAddress || 'N/A',
          totalSqft: totalSqft,
          participatingSellersCount: 0,
          maxSellers: 3,
          buyerName: buyer.name || 'A buyer'
        };
        let notificationsSent = 0;
        let emailsSent = 0;

        for (const seller of matchingSellers) {
          console.log(`\n📤 Notifying seller: ${seller.companyName || seller.phoneNumber}`);
          if (seller.fcmToken) {
            try {
              await sendNewLeadNotification(seller.fcmToken, {
                leadId: lead._id.toString(),
                buyerName: buyer.name || 'a buyer',
                city: leadArea || leadAddress || 'your area'
              });
              notificationsSent++;
              console.log(`  ✅ Push notification sent to ${seller.companyName}`);
            } catch (notifError) {
              console.error(`  ❌ Failed to send push notification to ${seller.companyName}:`, notifError.message);
            }
          } else {
            console.log(`  ⚠️ No FCM token for ${seller.companyName}`);
          }

          // Save notification to database
          try {
            await saveSellerNotification(seller._id, leadData);
            console.log(`  ✅ Notification saved to database for ${seller.companyName}`);
          } catch (dbError) {
            console.error(`  ❌ Failed to save notification to database:`, dbError.message);
          }

          // Send email notification if email exists
          if (seller.email) {
            try {
              await sendNewLeadEmail(
                seller.email,
                seller.companyName || seller.contactPerson || 'Seller',
                leadData
              );
              emailsSent++;
              console.log(`  ✅ Email sent to ${seller.email}`);
            } catch (emailError) {
              console.error(`  ❌ Failed to send email to ${seller.email}:`, emailError.message);
            }
          } else {
            console.log(`  ⚠️ No email for ${seller.companyName}`);
          }
        }

  

       
      } else {
        console.log('⚠️ No matching sellers found for this lead');
      }
    } catch (notificationError) {
      console.error('❌ Error sending notifications to sellers:', notificationError);
      // Don't fail the lead creation if notifications fail
    }


    res.status(201).json({
      success: true,
      message: 'Lead created successfully',
      lead
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

exports.getAllLeads = async (req, res) => {
    try {
    
    const { status, buyerId, sellerId, categoryId, page = 1, limit = 100 } = req.query;
    const filter = {};

    // Valid status values
    const validStatuses = ['new', 'in-progress', 'closed', 'cancelled'];
    
    console.log('\n🔍 Building filter criteria...');
    // If status is provided, validate and normalize it
    if (status) {
      const statusMap = {
        'active': 'in-progress',
        'pending': 'new',
        'sold': 'closed'
      };
      const normalizedStatus = statusMap[status] || status;
      if (validStatuses.includes(normalizedStatus)) {
        filter.status = normalizedStatus;
        console.log(`✅ Status filter applied: ${status} -> ${normalizedStatus}`);
      } else {
        console.log(`⚠️ Invalid status provided: ${status}, skipping status filter`);
      }
    }

    if (buyerId) {
      filter.buyer = buyerId;
      console.log('✅ Buyer filter applied:', buyerId);
    }
    if (categoryId) {
      filter.category = categoryId;
      console.log('✅ Category filter applied:', categoryId);
    }
    // Also check for 'category' param (from frontend)
    if (req.query.category && !categoryId) {
      filter.category = req.query.category;
      console.log('✅ Category filter applied:', req.query.category);
    }
    // Brand filter - filter by seller's brandOfProfileUsed
    if (req.query.brand) {
      // We need to filter leads where at least one seller has this brand
      // This is complex, so we'll do it after fetching
      console.log('✅ Brand filter will be applied:', req.query.brand);
    }
    if (sellerId) {
      filter['seller.sellerId'] = sellerId;
      console.log('✅ Seller filter applied:', sellerId);
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const pageSize = Math.max(1, Math.min(100, parseInt(limit, 10) || 100));

    console.log('\n📊 Query Parameters:');
    console.log('Filter:', JSON.stringify(filter, null, 2));
    console.log('Page:', pageNum, 'Limit:', pageSize);
    console.log('Skip:', (pageNum - 1) * pageSize);

    // Use lean() to avoid validation errors on invalid status values
    // We'll filter and normalize statuses in the results
    const [total, leads] = await Promise.all([
      Lead.countDocuments(filter),
      Lead.find(filter)
        .populate('buyer', 'name email phoneNumber')
        .populate('seller.sellerId', 'companyName brandOfProfileUsed contactPerson phoneNumber businessProfileVideo visitingCard yearsInBusiness status isActive')
        .populate('category', 'name description videoUrl')
        .populate('quotes.product', 'title features videoUrl')
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * pageSize)
        .limit(pageSize)
        .lean(), // Use lean() to get plain objects and avoid validation errors
    ]);

  
    
    // DEBUG: Log seller array for first lead
  
    
    if (leads.length > 0) {
      
      // Log all leads details
      console.log('\n📋 All Leads Details:');
      const now = new Date();
      const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
      
      let visibleCount = 0;
      let filteredOutCount = 0;
      const filteredReasons = {
        tooOld: 0,
        noSlots: 0,
        wrongStatus: 0
      };
      
      leads.forEach((lead, index) => {
        const createdAt = new Date(lead.createdAt);
        const hoursSinceCreation = (now - createdAt) / (1000 * 60 * 60);
        const isWithin48Hours = createdAt >= fortyEightHoursAgo;
        const hasAvailableSlots = (lead.participatingSellersCount || 0) < 3;
        const statusMatch = lead.status === 'new' || lead.status === 'in-progress';
        const isVisible = isWithin48Hours && hasAvailableSlots && statusMatch;
        
        if (isVisible) {
          visibleCount++;
        } else {
          filteredOutCount++;
          if (!isWithin48Hours) filteredReasons.tooOld++;
          if (!hasAvailableSlots) filteredReasons.noSlots++;
          if (!statusMatch) filteredReasons.wrongStatus++;
        }
        if (!isVisible) {
          const reasons = [];
          if (!isWithin48Hours) reasons.push('Too old (>48h)');
          if (!hasAvailableSlots) reasons.push('All 3 sellers joined');
          if (!statusMatch) reasons.push(`Wrong status (${lead.status})`);
          console.log(`    ❌ Filtered Out Reason: ${reasons.join(', ')}`);
        }
      });
      
      console.log('\n📊 Lead Visibility Summary:');
      console.log(`  ✅ Visible Leads: ${visibleCount}`);
      console.log(`  ❌ Filtered Out: ${filteredOutCount}`);
      if (filteredOutCount > 0) {
        console.log('  📋 Filter Reasons:');
        console.log(`    - Too old (>48h): ${filteredReasons.tooOld}`);
        console.log(`    - All 3 sellers joined: ${filteredReasons.noSlots}`);
        console.log(`    - Wrong status: ${filteredReasons.wrongStatus}`);
      }
    } else {
      console.log('⚠️ No leads found matching the criteria');
    }

    // Normalize status values in the results
    let normalizedLeads = leads.map(lead => {
      const statusMap = {
        'active': 'in-progress',
        'pending': 'new',
        'sold': 'closed'
      };
      
      if (lead.status && !validStatuses.includes(lead.status)) {
        lead.status = statusMap[lead.status] || 'new';
      }
      
      return lead;
    });

    // Apply brand filter if provided (filter by seller's brandOfProfileUsed)
    if (req.query.brand) {
      const brandFilter = req.query.brand;
      normalizedLeads = normalizedLeads.filter(lead => {
        // Check if any seller in this lead has the specified brand
        if (lead.seller && lead.seller.length > 0) {
          return lead.seller.some(s => 
            s.sellerId && s.sellerId.brandOfProfileUsed === brandFilter
          );
        }
        return false;
      });
      console.log(`✅ Brand filter applied: ${brandFilter}, remaining leads: ${normalizedLeads.length}`);
    }

    // Manual populate fallback: handles cases where native driver writes bypassed Mongoose populate
    const sellerIdsToFetch = new Set();
    normalizedLeads.forEach(lead => {
      (lead.seller || []).forEach(s => {
        if (s.sellerId && !s.sellerId.companyName) {
          sellerIdsToFetch.add(s.sellerId.toString());
        }
      });
    });

    if (sellerIdsToFetch.size > 0) {
      console.log('🔧 Manual populate needed for seller IDs:', [...sellerIdsToFetch]);
      const sellerDocs = await Seller.find(
        { _id: { $in: [...sellerIdsToFetch] } },
        'companyName brandOfProfileUsed contactPerson phoneNumber'
      ).lean();
      const sellerMap = {};
      sellerDocs.forEach(s => { sellerMap[s._id.toString()] = s; });

      normalizedLeads = normalizedLeads.map(lead => ({
        ...lead,
        seller: (lead.seller || []).map(s => {
          const sid = s.sellerId?.toString?.() || String(s.sellerId);
          if (sid && sellerMap[sid]) {
            return { ...s, sellerId: sellerMap[sid] };
          }
          return s;
        })
      }));
    }

    res.status(200).json({
      success: true,
      total,
      page: pageNum,
      limit: pageSize,
      count: normalizedLeads.length,
      leads: normalizedLeads
    });
  } catch (error) {
   
    
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get single lead by ID
exports.getLeadById = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id)
      .populate('buyer')
      .populate('seller.sellerId')
      .populate('category')
      .populate('quotes.product');

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    res.status(200).json({
      success: true,
      lead
    });
  } catch (error) {
    console.error('Error fetching lead:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};
exports.purchaseLead = async (req, res) => {
  try {
    const { leadId, price } = req.body;
    const sellerId = req.seller._id;

    if (!leadId || !sellerId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request. Missing parameters.'
      });
    }

    const seller = await Seller.findById(sellerId);
    if (!seller) {
      return res.status(404).json({ success: false, message: 'Seller not found' });
    }

    // Check if seller documents are approved
    const docStatuses = [
      seller.gstCertificateStatus,
      ...(seller.visitingCard ? [seller.visitingCardStatus] : []),
      ...(seller.businessProfileVideo ? [seller.businessProfileVideoStatus] : []),
    ];

    const allDocsApproved = docStatuses.every(s => s === 'approved');
    if (!allDocsApproved) {
      return res.status(403).json({
        success: false,
        message: 'Your documents are under verification. You can purchase leads once all documents are approved.',
        documentStatuses: {
          gstCertificate: seller.gstCertificateStatus,
          visitingCard: seller.visitingCard ? seller.visitingCardStatus : 'not_uploaded',
          businessProfileVideo: seller.businessProfileVideo ? seller.businessProfileVideoStatus : 'not_uploaded',
        }
      });
    }

    const leadObjectId = typeof leadId === 'string' ? new mongoose.Types.ObjectId(leadId) : leadId;
    const LeadCollection = Lead.collection;
    const leadDoc = await LeadCollection.findOne({ _id: leadObjectId });
    
    if (!leadDoc) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    const lead = {
      ...leadDoc,
      _id: leadDoc._id.toString()
    };

    // Get category for pricing calculation
    const Category = require('../../models/Admin/Category');
    const category = await Category.findById(lead.category);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    // Normalize status
    const validStatuses = ['new', 'in-progress', 'closed', 'cancelled'];
    const statusMap = {
      'active': 'in-progress',
      'pending': 'new',
      'sold': 'closed'
    };
    
    let normalizedStatus = lead.status;
    if (lead.status && !validStatuses.includes(lead.status)) {
      normalizedStatus = statusMap[lead.status] || 'new';
      await LeadCollection.updateOne(
        { _id: leadObjectId },
        { $set: { status: normalizedStatus } }
      );
      lead.status = normalizedStatus;
    }

    // Check if seller already purchased this lead
    const alreadyPurchased = lead.seller?.some(s => s.sellerId.toString() === sellerId.toString());
    if (alreadyPurchased) {
      return res.status(400).json({
        success: false,
        message: 'You have already purchased access to this lead'
      });
    }

    // Check if 3 sellers limit reached
    const currentSellerCount = lead.seller?.length || 0;
    if (currentSellerCount >= 3) {
      return res.status(400).json({
        success: false,
        message: 'This lead already has 3 participating sellers. No more slots available.'
      });
    }

    // Calculate escrow deposit
    const PRICE_PER_SQFT = {
      premium: 550,
      mid: 450,
      economy: 350
    };

    const ESCROW_PERCENTAGE = {
      premium: 7.5,
      mid: 7.5,
      economy: 5.0
    };

    const categoryName = category.name.toLowerCase();
    const pricePerSqft = PRICE_PER_SQFT[categoryName] || PRICE_PER_SQFT.mid;
    const leadValue = Math.round(lead.totalSqft * pricePerSqft);
    const escrowPercentage = ESCROW_PERCENTAGE[categoryName] || ESCROW_PERCENTAGE.mid;
    const calculatedEscrow = Math.round((leadValue * escrowPercentage) / 100);
    const escrowDepositAmount = Math.min(calculatedEscrow, 6500); // Cap at ₹6,500

    // Check brand limit (max 2 per brand per city)
    const sellersInCity = await Seller.find({ 
      city: lead.projectInfo.area || lead.projectInfo.address || lead.projectInfo.city,
      status: 'approved',
      isActive: true
    });

    const brandCounts = {};
    sellersInCity.forEach(s => {
      if (s.brandOfProfileUsed) {
        brandCounts[s.brandOfProfileUsed] = (brandCounts[s.brandOfProfileUsed] || 0) + 1;
      }
    });

    const brandsAtLimit = Object.entries(brandCounts)
      .filter(([_, count]) => count >= 2)
      .map(([brand]) => brand);

    if (brandsAtLimit.includes(seller.brandOfProfileUsed)) {
      return res.status(400).json({
        success: false,
        message: `Your brand in this city is already registered by 2 other fabricators. Maximum limit reached.`,
        brandsAtLimit
      });
    }

    const now = new Date();
    
    // Add seller to lead
    const newSellers = [...(lead.seller || [])];
    newSellers.push({ 
      sellerId,
      escrowPaid: escrowDepositAmount,
      purchasedAt: now,
      paymentStatus: 'paid'
    });

    const newParticipatingCount = newSellers.length;
    let finalStatus = normalizedStatus;
    
    // If 3 sellers joined, move to in-progress
    if (newParticipatingCount >= 3) {
      finalStatus = 'in-progress';
    }

    // Add lead to seller's leads array
    if (!seller.leads.includes(leadId)) {
      seller.leads.push(leadId);
      await seller.save();
    }
    
    const updateData = {
      $set: {
        seller: newSellers,
        participatingSellersCount: newParticipatingCount,
        status: finalStatus
      }
    };

    await LeadCollection.updateOne(
      { _id: leadObjectId },
      updateData
    );
    
    // Fetch updated lead
    const updatedLeadDoc = await LeadCollection.findOne({ _id: leadObjectId });
    const updatedLead = updatedLeadDoc ? {
      ...updatedLeadDoc,
      _id: updatedLeadDoc._id.toString()
    } : null;

    // Notify buyer about seller participation
    try {
      const { sendBuyerLeadPurchasedNotification, saveBuyerNotification } = require('../../utils/notificationHelper');
      const buyer = await User.findById(lead.buyer);
      if (buyer) {
        const notifData = {
          leadId: leadId.toString(),
          sellerName: seller.companyName || seller.contactPerson || 'A seller',
          location: lead.projectInfo?.area || lead.projectInfo?.address || 'your area',
          remainingSlots: 3 - newParticipatingCount,
        };

        if (buyer.fcmToken) {
          try {
            await sendBuyerLeadPurchasedNotification(buyer.fcmToken, notifData);
          } catch (e) {
            console.error('❌ Failed to send buyer FCM notification:', e.message);
          }
        }
        await saveBuyerNotification(buyer._id, notifData);
      }
    } catch (notifError) {
      console.error('❌ Error notifying buyer of lead purchase:', notifError);
    }

    res.status(200).json({
      success: true,
      message: `Successfully purchased lead access. Escrow deposit: ₹${escrowDepositAmount}`,
      lead: updatedLead,
      escrowPaid: escrowDepositAmount,
      leadValue: leadValue,
      participatingSellers: newParticipatingCount,
      remainingSlots: 3 - newParticipatingCount
    });

  } catch (error) {
    console.error('Error purchasing lead:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

exports.updateLeadStatus = async (req, res) => {
  try {
    const { leadId, status } = req.body;

    // Valid status values from Lead schema
    const validStatuses = ['new', 'in-progress', 'closed', 'cancelled'];
    
    // Map frontend status values to schema values
    const statusMap = {
      'active': 'in-progress',
      'pending': 'new',
      'sold': 'closed'
    };

    // Normalize status: if it's in the map, use the mapped value, otherwise use as-is
    let normalizedStatus = statusMap[status] || status;

    // Validate status
    if (!validStatuses.includes(normalizedStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Valid values are: ${validStatuses.join(', ')}`,
        received: status,
        normalized: normalizedStatus
      });
    }

    const lead = await Lead.findByIdAndUpdate(
      leadId,
      { status: normalizedStatus },
      { new: true, runValidators: true }
    );

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Lead status updated successfully',
      lead
    });
  } catch (error) {
    console.error('Error updating lead status:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};
exports.calculateLeadPrice = async (req, res) => {
  try {
    const { quotes, categoryId } = req.body;

    if (!quotes || !Array.isArray(quotes)) {
      return res.status(400).json({
        success: false,
        message: 'Quotes array is required'
      });
    }

    if (!categoryId) {
      return res.status(400).json({
        success: false,
        message: 'Category ID is required'
      });
    }

    // Get category for pricing
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Calculate total square feet
    const totalSqft = quotes.reduce((total, quote) => {
      const sqft = quote.sqft || (quote.height * quote.width);
      return total + (sqft * quote.quantity);
    }, 0);

    // NEW category-based pricing
    const PRICE_PER_SQFT = {
      premium: 550,
      mid: 450,
      economy: 350
    };

    const ESCROW_PERCENTAGE = {
      premium: 7.5,
      mid: 7.5,
      economy: 5.0
    };

    const categoryName = category.name.toLowerCase();
    const pricePerSqft = PRICE_PER_SQFT[categoryName] || PRICE_PER_SQFT.mid;
    const leadValue = Math.round(totalSqft * pricePerSqft);
    const escrowPercentage = ESCROW_PERCENTAGE[categoryName] || ESCROW_PERCENTAGE.mid;
    const calculatedEscrow = Math.round((leadValue * escrowPercentage) / 100);
    const escrowDepositAmount = Math.min(calculatedEscrow, 6500); // Cap at ₹6,500

    res.status(200).json({
      success: true,
      totalSqft,
      pricePerSqft,
      leadValue,
      escrowDepositAmount,
      escrowPercentage,
      category: category.name
    });
  } catch (error) {
    console.error('Error calculating lead price:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};
exports.getCities = async (req, res) => {
  try {
    console.log('\n📍 [ADMIN] getCities called');
    
    // First, let's check what fields actually exist in the leads
    const sampleLeads = await Lead.find({}).limit(3).lean();
    console.log('🔍 Sample lead projectInfo structures:');
    sampleLeads.forEach((lead, index) => {
      console.log(`  Lead ${index + 1}:`, JSON.stringify(lead.projectInfo, null, 2));
    });
    
    // Try multiple approaches to get cities
    const citiesFromAddressCity = await Lead.distinct('projectInfo.address.city');
    const citiesFromCity = await Lead.distinct('projectInfo.city');
    const citiesFromArea = await Lead.distinct('projectInfo.area'); // Sometimes area contains city info

    
    // Combine all possible city sources
    const allCities = [
      ...citiesFromAddressCity,
      ...citiesFromCity,
      ...citiesFromArea
    ];
    
    // Filter out null/undefined values, deduplicate, and sort
    const validCities = [...new Set(allCities)]
      .filter(city => city && typeof city === 'string' && city.trim())
      .sort();
    
    console.log('✅ Final cities found:', validCities.length, validCities);
    
    res.status(200).json({
      success: true,
      data: validCities
    });
  } catch (error) {
    console.error('❌ Error fetching cities:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};
exports.getLeadsByCity = async (req, res) => {
  try {
    const { city } = req.params;
    const { page = 1, limit = 10, status, search } = req.query;
    
    console.log(`\n🏙️ [ADMIN] getLeadsByCity called for city: ${city}`);
    
    const filter = {
      $or: [
        { 'projectInfo.address.city': city },
        { 'projectInfo.city': city },
        { 'projectInfo.area': city }
      ]
    };
    
    if (status) {
      filter.status = status;
    }
    
    if (search) {
      filter.$and = filter.$and || [];
      filter.$and.push({
        $or: [
          { 'contactInfo.name': { $regex: search, $options: 'i' } },
          { 'projectInfo.name': { $regex: search, $options: 'i' } },
          { 'contactInfo.contactNumber': { $regex: search, $options: 'i' } }
        ]
      });
    }
    
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const pageSize = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
    
    const [total, leads] = await Promise.all([
      Lead.countDocuments(filter),
      Lead.find(filter)
        .populate('buyer', 'name email phoneNumber')
        .populate('seller.sellerId', 'companyName brandOfProfileUsed contactPerson phoneNumber')
        .populate('category', 'name description')
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * pageSize)
        .limit(pageSize)
        .lean()
    ]);
    
    console.log(`✅ Found ${leads.length} leads in ${city}`);
    
    res.status(200).json({
      success: true,
      total,
      page: pageNum,
      limit: pageSize,
      data: leads
    });
  } catch (error) {
    console.error('❌ Error fetching leads by city:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};
exports.getExpiredLeads = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    console.log('\n⏰ [ADMIN] getExpiredLeads called');
    
    const now = new Date();
    const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    
    const filter = {
      createdAt: { $lt: fortyEightHoursAgo }
    };
    
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const pageSize = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
    
    const [total, leads] = await Promise.all([
      Lead.countDocuments(filter),
      Lead.find(filter)
        .populate('buyer', 'name email phoneNumber')
        .populate('seller.sellerId', 'companyName brandOfProfileUsed contactPerson phoneNumber')
        .populate('category', 'name description')
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * pageSize)
        .limit(pageSize)
        .lean()
    ]);
    
    console.log(`✅ Found ${leads.length} expired leads`);
    
    res.status(200).json({
      success: true,
      total,
      page: pageNum,
      limit: pageSize,
      data: leads
    });
  } catch (error) {
    console.error('❌ Error fetching expired leads:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};
exports.getLeadAnalytics = async (req, res) => {
  try {
    console.log('\n📊 [ADMIN] getLeadAnalytics called');
    
    const now = new Date();
    const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    
    const [totalLeads, activeLeads, expiredLeads, revenueData] = await Promise.all([
      Lead.countDocuments({}),
      Lead.countDocuments({
        createdAt: { $gte: fortyEightHoursAgo },
        participatingSellersCount: { $lt: 3 },
        status: { $in: ['new', 'in-progress'] }
      }),
      Lead.countDocuments({
        createdAt: { $lt: fortyEightHoursAgo }
      }),
      Lead.aggregate([
        {
          $match: {
            seller: { $exists: true, $ne: [] }
          }
        },
        {
          $unwind: '$seller'
        },
        {
          $group: {
            _id: null,
            totalRevenue: {
              $sum: { $ifNull: ['$seller.pricePaid', 0] }
            }
          }
        }
      ])
    ]);
    
    const analytics = {
      totalLeads,
      activeLeads,
      expiredLeads,
      totalRevenue: revenueData[0]?.totalRevenue || 0
    };
    
    console.log('✅ Analytics calculated:', analytics);
    
    res.status(200).json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('❌ Error fetching lead analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};
exports.getCityAnalytics = async (req, res) => {
  try {
    console.log('\n🏙️ [ADMIN] getCityAnalytics called');
    
    const cityStats = await Lead.aggregate([
      {
        $addFields: {
          city: {
            $ifNull: [
              '$projectInfo.address.city',
              {
                $ifNull: [
                  '$projectInfo.city',
                  '$projectInfo.area'
                ]
              }
            ]
          }
        }
      },
      {
        $group: {
          _id: '$city',
          totalLeads: { $sum: 1 },
          totalRevenue: {
            $sum: {
              $reduce: {
                input: { $ifNull: ['$seller', []] },
                initialValue: 0,
                in: { $add: ['$$value', { $ifNull: ['$$this.pricePaid', 0] }] }
              }
            }
          },
          avgSqft: { $avg: '$totalSqft' }
        }
      },
      {
        $match: {
          _id: { $ne: null }
        }
      },
      {
        $sort: { totalLeads: -1 }
      }
    ]);
    
    console.log(`✅ City analytics for ${cityStats.length} cities`);
    
    res.status(200).json({
      success: true,
      data: cityStats
    });
  } catch (error) {
    console.error('❌ Error fetching city analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};
exports.getBrandAnalytics = async (req, res) => {
  try {
    console.log('\n🏷️ [ADMIN] getBrandAnalytics called');
    
    const brandStats = await Lead.aggregate([
      {
        $unwind: { path: '$seller', preserveNullAndEmptyArrays: true }
      },
      {
        $lookup: {
          from: 'sellers',
          localField: 'seller.sellerId',
          foreignField: '_id',
          as: 'sellerInfo'
        }
      },
      {
        $unwind: { path: '$sellerInfo', preserveNullAndEmptyArrays: true }
      },
      {
        $group: {
          _id: '$sellerInfo.brandOfProfileUsed',
          totalPurchases: { $sum: 1 },
          totalRevenue: {
            $sum: { $ifNull: ['$seller.pricePaid', 0] }
          },
          uniqueLeads: { $addToSet: '$_id' }
        }
      },
      {
        $match: {
          _id: { $ne: null }
        }
      },
      {
        $addFields: {
          uniqueLeadsCount: { $size: '$uniqueLeads' }
        }
      },
      {
        $project: {
          uniqueLeads: 0
        }
      },
      {
        $sort: { totalPurchases: -1 }
      }
    ]);
    
    console.log(`✅ Brand analytics for ${brandStats.length} brands`);
    
    res.status(200).json({
      success: true,
      data: brandStats
    });
  } catch (error) {
    console.error('❌ Error fetching brand analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};
exports.getComprehensiveLeadDetails = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`\n🔍 [ADMIN] getComprehensiveLeadDetails called for lead: ${id}`);
    
    const lead = await Lead.findById(id)
      .populate('buyer', 'name email phoneNumber mobileNumber')
      .populate('seller.sellerId', 'companyName brandOfProfileUsed contactPerson phoneNumber city businessProfileVideo visitingCard yearsInBusiness status isActive')
      .populate('category', 'name description')
      .populate('quotes.product', 'title features')
      .lean();
    
    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }
    
    console.log('✅ Comprehensive lead details fetched');
    
    res.status(200).json({
      success: true,
      data: lead
    });
  } catch (error) {
    console.error('❌ Error fetching comprehensive lead details:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};
exports.getLeadPurchaseHistory = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`\n💰 [ADMIN] getLeadPurchaseHistory called for lead: ${id}`);
    
    const lead = await Lead.findById(id)
      .populate({
        path: 'seller.sellerId',
        select: 'companyName brandOfProfileUsed contactPerson phoneNumber email city businessProfileVideo visitingCard yearsInBusiness status isActive'
      })
      .lean();
    
    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }
    
    // Transform seller data into purchase history format
    const purchaseHistory = lead.seller.map(purchase => ({
      sellerName: purchase.sellerId?.companyName || purchase.sellerId?.contactPerson || 'Unknown',
      sellerEmail: purchase.sellerId?.email || '',
      sellerPhone: purchase.sellerId?.phoneNumber || '',
      sellerCompany: purchase.sellerId?.companyName || '',
      sellerCity: purchase.sellerId?.city || '',
      brandOfProfileUsed: purchase.sellerId?.brandOfProfileUsed || '',
      amount: purchase.pricePaid || 0,
      pricePaid: purchase.pricePaid || 0,
      purchaseDate: purchase.purchasedAt || purchase.createdAt,
      purchasedAt: purchase.purchasedAt || purchase.createdAt,
      paymentStatus: 'completed', // Default status
      yearsInBusiness: purchase.sellerId?.yearsInBusiness || 0,
      sellerStatus: purchase.sellerId?.status || 'unknown'
    }));
    
    console.log(`✅ Purchase history with ${purchaseHistory.length} purchases`);
    
    res.status(200).json({
      success: true,
      data: purchaseHistory
    });
  } catch (error) {
    console.error('❌ Error fetching lead purchase history:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};
exports.getLeadVisibilityStatus = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`\n👁️ [ADMIN] getLeadVisibilityStatus called for lead: ${id}`);
    
    const lead = await Lead.findById(id).lean();
    
    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }
    
    const now = new Date();
    const createdAt = new Date(lead.createdAt);
    const hoursSinceCreation = (now - createdAt) / (1000 * 60 * 60);
    const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    
    const isWithin48Hours = createdAt >= fortyEightHoursAgo;
    const hasAvailableSlots = (lead.participatingSellersCount || 0) < 3;
    const validStatus = ['new', 'in-progress'].includes(lead.status);
    
    const isVisible = isWithin48Hours && hasAvailableSlots && validStatus;
    
    const reasons = [];
    if (!isWithin48Hours) reasons.push('Lead is older than 48 hours');
    if (!hasAvailableSlots) reasons.push('All 3 sellers have joined');
    if (!validStatus) reasons.push(`Invalid status: ${lead.status}`);
    
    const visibilityStatus = {
      isVisible,
      hoursSinceCreation,
      isWithin48Hours,
      hasAvailableSlots,
      participatingSellers: lead.participatingSellersCount || 0,
      maxSellers: 3,
      validStatus,
      reasons: reasons.length > 0 ? reasons : null
    };
    
    console.log('✅ Visibility status calculated:', { isVisible, reasons: reasons.length });
    
    res.status(200).json({
      success: true,
      data: visibilityStatus
    });
  } catch (error) {
    console.error('❌ Error fetching lead visibility status:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};
exports.getLeadTimeline = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`\n📅 [ADMIN] getLeadTimeline called for lead: ${id}`);
    
    const lead = await Lead.findById(id)
      .populate('seller.sellerId', 'companyName contactPerson')
      .lean();
    
    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }
    
    const timeline = [];
    
    // Lead created event
    timeline.push({
      type: 'created',
      title: 'Lead Created',
      description: `Lead created for ${lead.projectInfo?.name || 'project'} in ${lead.projectInfo?.address?.city || 'unknown city'}`,
      timestamp: lead.createdAt
    });
    
    // Purchase events
    lead.seller.forEach(purchase => {
      timeline.push({
        type: 'purchased',
        title: 'Lead Purchased',
        description: `Purchased by ${purchase.sellerId?.companyName || purchase.sellerId?.contactPerson || 'Unknown seller'}`,
        timestamp: purchase.purchasedAt || lead.createdAt
      });
    });
    
    // Check if expired
    const now = new Date();
    const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    if (new Date(lead.createdAt) < fortyEightHoursAgo) {
      timeline.push({
        type: 'expired',
        title: 'Lead Expired',
        description: 'Lead is no longer visible to sellers (>48 hours old)',
        timestamp: new Date(new Date(lead.createdAt).getTime() + 48 * 60 * 60 * 1000)
      });
    }
    
    // Sort timeline by timestamp
    timeline.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    console.log(`✅ Timeline with ${timeline.length} events`);
    
    res.status(200).json({
      success: true,
      data: timeline
    });
  } catch (error) {
    console.error('❌ Error fetching lead timeline:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};
exports.getLeadInvoices = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`\n🧾 [ADMIN] getLeadInvoices called for lead: ${id}`);
    
    // This is a placeholder - implement based on your actual invoice system
    const invoices = [];
    
    console.log(`✅ Found ${invoices.length} invoices`);
    
    res.status(200).json({
      success: true,
      data: invoices
    });
  } catch (error) {
    console.error('❌ Error fetching lead invoices:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};
exports.getLeadDetails = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`\n📋 [ADMIN] getLeadDetails (basic) called for lead: ${id}`);
    
    const lead = await Lead.findById(id)
      .populate('buyer', 'name email phoneNumber')
      .populate('seller.sellerId', 'companyName brandOfProfileUsed contactPerson phoneNumber')
      .populate('category', 'name description')
      .lean();
    
    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }
    
    console.log('✅ Basic lead details fetched');
    
    res.status(200).json({
      success: true,
      data: lead
    });
  } catch (error) {
    console.error('❌ Error fetching basic lead details:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};
exports.getLeadPurchases = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`\n💰 [ADMIN] getLeadPurchases (basic) called for lead: ${id}`);
    
    const lead = await Lead.findById(id)
      .populate('seller.sellerId', 'companyName contactPerson phoneNumber email city')
      .lean();
    
    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }
    
    // Transform seller data into purchase format
    const purchases = lead.seller.map(purchase => ({
      buyerName: purchase.sellerId?.companyName || purchase.sellerId?.contactPerson || 'Unknown',
      buyerEmail: purchase.sellerId?.email || '',
      buyerPhone: purchase.sellerId?.phoneNumber || '',
      buyerCompany: purchase.sellerId?.companyName || '',
      buyerCity: purchase.sellerId?.city || '',
      amount: purchase.pricePaid || 0,
      purchaseDate: purchase.purchasedAt || purchase.createdAt,
      paymentStatus: 'completed'
    }));
    
    console.log(`✅ Found ${purchases.length} purchases (basic)`);
    
    res.status(200).json({
      success: true,
      data: purchases
    });
  } catch (error) {
    console.error('❌ Error fetching basic lead purchases:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};
exports.getAllLeadsAdmin = async (req, res) => {
  try {
    console.log('\n🔍 [ADMIN] getAllLeadsAdmin called');
    console.log('📋 Query params:', JSON.stringify(req.query, null, 2));
    
    const { 
      status, 
      page = 1, 
      limit = 10, 
      search, 
      dateFrom, 
      dateTo,
      minPrice,
      maxPrice,
      minSqft,
      maxSqft
    } = req.query;
    
    const filter = {};
    
    // Status filter
    if (status && status !== 'all') {
      const statusMap = {
        'active': 'in-progress',
        'pending': 'new',
        'sold': 'closed'
      };
      filter.status = statusMap[status] || status;
    }
    
    // Search filter
    if (search) {
      filter.$or = [
        { 'contactInfo.name': { $regex: search, $options: 'i' } },
        { 'projectInfo.name': { $regex: search, $options: 'i' } },
        { 'contactInfo.contactNumber': { $regex: search, $options: 'i' } },
        { 'contactInfo.email': { $regex: search, $options: 'i' } }
      ];
    }
    
    // Date range filter
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) filter.createdAt.$lte = new Date(dateTo + 'T23:59:59.999Z');
    }
    
    // Price range filter (using leadValue)
    if (minPrice) {
      filter.leadValue = { ...filter.leadValue, $gte: parseFloat(minPrice) };
    }
    if (maxPrice) {
      filter.leadValue = { ...filter.leadValue, $lte: parseFloat(maxPrice) };
    }
    
    // Sqft range filter
    if (minSqft) filter.totalSqft = { ...filter.totalSqft, $gte: parseFloat(minSqft) };
    if (maxSqft) filter.totalSqft = { ...filter.totalSqft, $lte: parseFloat(maxSqft) };
    
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const pageSize = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
    
    console.log('🔍 Filter:', JSON.stringify(filter, null, 2));
    
    const [total, leads] = await Promise.all([
      Lead.countDocuments(filter),
      Lead.find(filter)
        .populate('buyer', 'name email phoneNumber mobileNumber')
        .populate('seller.sellerId', 'companyName brandOfProfileUsed contactPerson mobileNumber email phoneNumber city businessProfileVideo visitingCard yearsInBusiness status isActive')
        .populate('category', 'name description')
        .populate('quotes.product', 'title features')
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * pageSize)
        .limit(pageSize)
        .lean()
    ]);
    
    // Enhance leads with calculated fields and flatten buyer info
    const enhancedLeads = leads.map(lead => {
      const now = new Date();
      const createdAt = new Date(lead.createdAt);
      const hoursSinceCreation = (now - createdAt) / (1000 * 60 * 60);
      const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
      
      const isWithin48Hours = createdAt >= fortyEightHoursAgo;
      const hasAvailableSlots = (lead.participatingSellersCount || 0) < 3;
      const validStatus = ['new', 'in-progress'].includes(lead.status);
      const isVisible = isWithin48Hours && hasAvailableSlots && validStatus;
      
      // Calculate total revenue from actual purchases
      const totalRevenue = (lead.seller || []).reduce((sum, s) => sum + (s.pricePaid || 0), 0);
      
      return {
        ...lead,
        // Flatten buyer information for easier access
        name: lead.contactInfo?.name || 'N/A',
        mobileNumber: lead.contactInfo?.contactNumber || lead.contactInfo?.whatsappNumber || 'N/A',
        email: lead.contactInfo?.email || 'N/A',
        city: lead.projectInfo?.area || 'N/A',
        location: lead.projectInfo?.name || 'N/A',
        address: lead.projectInfo?.address || 'N/A',
        pincode: lead.projectInfo?.pincode || 'N/A',
        categoryId: lead.category,
        estimatedValue: lead.leadValue || 0,
        purchaseCount: lead.seller?.length || 0,
        totalRevenue: totalRevenue,
        isVisible,
        hoursSinceCreation,
        isExpired: !isWithin48Hours
      };
    });
    
    console.log(`✅ Found ${enhancedLeads.length} comprehensive admin leads`);
    
    res.status(200).json({
      success: true,
      total,
      page: pageNum,
      limit: pageSize,
      count: enhancedLeads.length,
      leads: enhancedLeads,
      data: enhancedLeads
    });
  } catch (error) {
    console.error('❌ Error fetching comprehensive admin leads:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};
exports.extendLeadExpiry = async (req, res) => {
  try {
    const { id } = req.params;
    const { days } = req.body;
    
    console.log(`\n⏰ [ADMIN] extendLeadExpiry called for lead: ${id}, days: ${days}`);
    
    if (!days || days <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid number of days'
      });
    }
    
    const lead = await Lead.findById(id);
    
    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }
    const currentCreatedAt = new Date(lead.createdAt);
    const newCreatedAt = new Date(currentCreatedAt.getTime() + (days * 24 * 60 * 60 * 1000));
    
    lead.createdAt = newCreatedAt;
    await lead.save();
    
    console.log(`✅ Lead expiry extended by ${days} days`);
    
    res.status(200).json({
      success: true,
      message: `Lead expiry extended by ${days} days`,
      lead
    });
  } catch (error) {
    console.error('❌ Error extending lead expiry:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};