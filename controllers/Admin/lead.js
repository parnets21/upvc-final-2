const Lead = require('../../models/Admin/lead');
const User = require('../../models/Buyer/User');
const Seller = require('../../models/Seller/Seller');
const WindowSubOption = require('../../models/Admin/WindowSubOptions');
const Category = require('../../models/Admin/Category');
const Quote = require('../../models/Buyer/Quote');
const mongoose = require('mongoose');

// Log that this file is loaded
console.log('\n✅✅✅ Lead Controller File Loaded ✅✅✅');
console.log('📁 File: controllers/Admin/lead.js');
console.log('⏰ Loaded at:', new Date().toISOString());
console.log('========================================\n');

// Create a new lead
// exports.createLead = async (req, res) => {
//   try {
//     const { quotes, contactInfo, projectInfo, categoryId, totalSqft } = req.body;
//     // console.log("totalSqft : " , totalSqft)
//     // Validate buyer exists
//     const buyer = await User.findById({_id : req.user._id});
//     if (!buyer) {
//       return res.status(404).json({ success: false, message: 'Buyer not found' });
//     }

//     // Validate category exists
//     const category = await Category.findById(categoryId);
//     if (!category) {
//       return res.status(404).json({ success: false, message: 'Category not found' });
//     }

//     // Validate all products in quotes exist
//     for (const quote of quotes) {
//       const product = await WindowSubOption.findById(quote.product);
//       if (!product) {
//         return res.status(404).json({ 
//           success: false, 
//           message: `Product not found for ID: ${quote.product}` 
//         });
//       }
//     }
     
//     const lead = new Lead({
//       buyer: req.user._id,
//       quotes,
//       contactInfo,
//       projectInfo,
//       category: categoryId, 
//     });

//     await lead.save();
    

//     res.status(201).json({
//       success: true,
//       message: 'Lead created successfully',
//       lead
//     });
//   } catch (error) {
//     console.error('Error creating lead:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Internal server error',
//       error: error.message
//     });
//   }
// };

exports.createLead = async (req, res) => {
  // IMMEDIATE LOG - This will definitely show up
  console.log('\n');
  console.log('========================================');
  console.log('🚀🚀🚀 [BUYER BACKEND] createLead FUNCTION CALLED 🚀🚀🚀');
  console.log('========================================');
  console.log('📅 Timestamp:', new Date().toISOString());
  console.log('👤 User from token:', req.user?._id);
  console.log('📦 Request body:', JSON.stringify(req.body, null, 2));
  console.log('📋 Request headers:', JSON.stringify(req.headers, null, 2));
  
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

    console.log('\n📊 Quote Processing Summary:');
    console.log('✅ Total Sqft calculated:', totalSqft);
    console.log('✅ Total Quantity:', totalQuantity);
    console.log('✅ Validated Quotes Count:', validatedQuotes.length);
    validatedQuotes.forEach((q, idx) => {
      console.log(`  Quote ${idx + 1}: Product=${q.product}, Sqft=${q.sqft}, Qty=${q.quantity}`);
    });

    // Update quotes in database if they have _id (existing quotes)
    if (quotes.some(q => q._id)) {
      const bulkOps = quotes
        .filter(q => q._id) // Only update quotes that have _id
        .map(q => ({
          updateOne: {
            filter: { _id: q._id, buyer: req.user._id }, // Also verify buyer owns the quote
            update: { $set: { isGenerated: q.isGenerated !== undefined ? q.isGenerated : true } }
          }
        }));
      
      if (bulkOps.length > 0) {
        console.log("Updating quotes:", bulkOps.length);
        try {
          await Quote.bulkWrite(bulkOps);
        } catch (error) {
          console.error('Error updating quotes:', error);
          // Don't fail the lead creation if quote update fails
        }
      }
    }

    // Calculate dynamic slots and pricing
    const basePricePerSqft = 10.50;
    const baseValue = totalSqft * basePricePerSqft;
    const targetProfit = 6250;
    
    let maxSlots, dynamicSlotPrice, overProfit;
    
    if (baseValue * 6 > targetProfit) {
      // Calculate optimal slots to keep near target profit
      maxSlots = Math.max(1, Math.floor(targetProfit / baseValue));
      dynamicSlotPrice = targetProfit / maxSlots;
      overProfit = true;
    } else {
      // For smaller leads, keep 6 slots
      maxSlots = 6;
      dynamicSlotPrice = baseValue;
      overProfit = false;
    }

    const lead = new Lead({
      buyer: req.user._id,
      quotes: validatedQuotes,
      contactInfo,
      projectInfo,
      category: categoryId,
      totalSqft,
      totalQuantity,
      pricePerSqft: 10.5,
      basePricePerSqft: basePricePerSqft,
      availableSlots: maxSlots,
      maxSlots: maxSlots,
      dynamicSlotPrice: dynamicSlotPrice,
      overProfit: overProfit,
      status: 'new', // Explicitly set status to 'new' to ensure it's visible to sellers
      // pricePerSqft: totalSqft > 0 ? 6250 / (totalSqft * 6) : 0,
    });

    console.log('\n💾 Saving lead to database...');
    console.log('📊 Lead Status (before save):', lead.status);
    console.log('🎰 Available Slots (before save):', lead.availableSlots);
    console.log('📏 Total Sqft (before save):', lead.totalSqft);
    
    await lead.save();
    console.log('✅ Lead saved successfully');
    console.log('📊 Lead Status (after save):', lead.status);
    console.log('🆔 Lead ID (after save):', lead._id);

    console.log('\n✅ [BUYER BACKEND] Lead Created Successfully!');
    console.log('🆔 Lead ID:', lead._id);
    console.log('👤 Buyer:', buyer.name || buyer.mobileNumber);
    console.log('📧 Buyer Email:', buyer.email);
    console.log('📏 Total Sqft:', totalSqft);
    console.log('📦 Total Quantity:', totalQuantity);
    console.log('🎰 Available Slots:', lead.availableSlots);
    console.log('🎰 Max Slots:', lead.maxSlots);
    console.log('💰 Dynamic Slot Price:', lead.dynamicSlotPrice);
    console.log('💰 Base Price Per Sqft:', lead.basePricePerSqft);
    console.log('📊 Status:', lead.status, '(Should be "new" for seller visibility)');
    console.log('📅 Created At:', lead.createdAt);
    console.log('📍 Project Address:', projectInfo?.address);
    console.log('📍 Project Area:', projectInfo?.area);
    console.log('📍 Pincode:', projectInfo?.pincode);
    console.log('🏷️ Category ID:', categoryId);
    console.log('📋 Contact Name:', contactInfo?.name);
    console.log('📱 Contact Number:', contactInfo?.contactNumber);
    console.log('📧 Contact Email:', contactInfo?.email);
    console.log('\n🔍 Lead Visibility Check:');
    console.log('  ✅ Status is "new":', lead.status === 'new');
    console.log('  ✅ Has available slots:', lead.availableSlots > 0);
    console.log('  ✅ Created within last 48h:', true, '(just created)');
    console.log('  ✅ Should be visible to sellers:', lead.status === 'new' && lead.availableSlots > 0);
    console.log('========================================\n');

    res.status(201).json({
      success: true,
      message: 'Lead created successfully',
      lead
    });

  } catch (error) {
    console.error('\n❌ [BUYER BACKEND] Error creating lead');
    console.error('📅 Timestamp:', new Date().toISOString());
    console.error('📝 Error Message:', error.message);
    console.error('📊 Error Name:', error.name);
    console.error('📦 Error Stack:', error.stack);
    console.error('🔍 Error Details:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    console.error('========================================\n');
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get all leads with filters
exports.getAllLeads = async (req, res) => {
  // IMMEDIATE LOG - This will definitely show up
  console.log('\n');
  console.log('========================================');
  console.log('🟢🟢🟢 [SELLER BACKEND] getAllLeads FUNCTION CALLED 🟢🟢🟢');
  console.log('========================================');
  console.log('📅 Timestamp:', new Date().toISOString());
  console.log('📋 Request Query:', JSON.stringify(req.query, null, 2));
  console.log('👤 Seller from token:', req.seller?._id || 'No seller token (public access)');
  
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

    console.log('\n📊 Database Query Results:');
    console.log('✅ Total leads found:', total);
    console.log('✅ Leads returned in this page:', leads.length);
    
    if (leads.length > 0) {
      console.log('\n📋 Sample Lead Details:');
      console.log('🆔 Lead ID:', leads[0]._id);
      console.log('🎰 Available Slots:', leads[0].availableSlots);
      console.log('📊 Status:', leads[0].status);
      console.log('📅 Created At:', leads[0].createdAt);
      console.log('📏 Total Sqft:', leads[0].totalSqft);
      console.log('👤 Buyer:', leads[0].buyer?.name || leads[0].buyer?._id);
      console.log('🏷️ Category:', leads[0].category?.name || leads[0].category?._id);
      console.log('👥 Sellers Count:', leads[0].seller?.length || 0);
      
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
        const hasAvailableSlots = lead.availableSlots > 0;
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
        
        console.log(`\n  Lead ${index + 1}:`);
        console.log(`    🆔 ID: ${lead._id}`);
        console.log(`    📊 Status: ${lead.status} ${statusMatch ? '✅' : '❌'}`);
        console.log(`    📅 Created At: ${lead.createdAt}`);
        console.log(`    ⏰ Hours Since Creation: ${hoursSinceCreation.toFixed(2)}`);
        console.log(`    ⏰ Within 48 Hours: ${isWithin48Hours ? '✅' : '❌'}`);
        console.log(`    🎰 Available Slots: ${lead.availableSlots} ${hasAvailableSlots ? '✅' : '❌'}`);
        console.log(`    📏 Total Sqft: ${lead.totalSqft}`);
        console.log(`    🎰 Max Slots: ${lead.maxSlots || 'N/A'}`);
        console.log(`    💰 Dynamic Slot Price: ${lead.dynamicSlotPrice || 'N/A'}`);
        console.log(`    👥 Sellers Count: ${lead.seller?.length || 0}`);
        console.log(`    👁️ Visible to Sellers: ${isVisible ? '✅ YES' : '❌ NO'}`);
        if (!isVisible) {
          const reasons = [];
          if (!isWithin48Hours) reasons.push('Too old (>48h)');
          if (!hasAvailableSlots) reasons.push('No available slots');
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
        console.log(`    - No available slots: ${filteredReasons.noSlots}`);
        console.log(`    - Wrong status: ${filteredReasons.wrongStatus}`);
      }
    } else {
      console.log('⚠️ No leads found matching the criteria');
    }

    // Normalize status values in the results
    const normalizedLeads = leads.map(lead => {
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

    console.log('\n✅ [SELLER BACKEND] Sending response');
    console.log('📊 Response Summary:');
    console.log('  Success: true');
    console.log('  Total Leads: ', total);
    console.log('  Page: ', pageNum);
    console.log('  Limit: ', pageSize);
    console.log('  Count in Response: ', normalizedLeads.length);
    console.log('========================================\n');
    
    res.status(200).json({
      success: true,
      total,
      page: pageNum,
      limit: pageSize,
      count: normalizedLeads.length,
      leads: normalizedLeads
    });
  } catch (error) {
    console.error('\n❌ [SELLER BACKEND] Error fetching leads');
    console.error('📅 Timestamp:', new Date().toISOString());
    console.error('📝 Error Message:', error.message);
    console.error('📊 Error Name:', error.name);
    console.error('📦 Error Stack:', error.stack);
    console.error('========================================\n');
    
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

// Seller purchases a lead
// exports.purchaseLead = async (req, res) => {
//   try {
//     const { leadId } = req.body;
//     const sellerId = req.seller._id
//     // Validate lead exists
//     const lead = await Lead.findById(leadId);
//     if (!lead) {
//       return res.status(404).json({
//         success: false,
//         message: 'Lead not found'
//       });
//     }

//     // Validate seller exists
//     const seller = await Seller.findById(sellerId);
//     if (!seller) {
//       return res.status(404).json({
//         success: false,
//         message: 'Seller not found'
//       });
//     }

//     // Check if lead has available slots
//     if (lead.availableSlots <= 0) {
//       return res.status(400).json({
//         success: false,
//         message: 'No available slots left for this lead'
//       });
//     }

//         // Get all sellers in the same city as the project
//     const sellersInCity = await Seller.find({ 
//       city: lead.projectInfo.address.city, // Assuming city is in projectInfo.address
//       status: 'approved',
//       isActive: true
//     });

//     // Count brands in the city
//     const brandCounts = {};
//     sellersInCity.forEach(seller => {
//       if (seller.brandOfProfileUsed) {
//         brandCounts[seller.brandOfProfileUsed] = 
//           (brandCounts[seller.brandOfProfileUsed] || 0) + 1;
//       }
//     });

//     // Check if any brand has reached the limit (2 sellers)
//     const brandsAtLimit = Object.entries(brandCounts)
//       .filter(([_, count]) => count >= 2)
//       .map(([brand]) => brand);

//     if (brandsAtLimit.length > 0) {
//       return res.status(400).json({
//         success: false,
//         message: `Oops you have missed the bus by a whisker. Your brand in your city is already registered by 2 other fabricators.`,
//         brandsAtLimit
//       });
//     }

//     // Check if seller already purchased this lead
//     const alreadyPurchased = lead.seller.some(s => s.sellerId.toString() === sellerId);
//     if (alreadyPurchased) {
//       return res.status(400).json({
//         success: false,
//         message: 'Seller already purchased this lead'
//       });
//     }

//     // Add seller to lead and decrease available slots
//     lead.seller.push({ sellerId });
//     lead.availableSlots -= 1;
    
//     // Update status if all slots are taken
//     if (lead.availableSlots === 0) {
//       lead.status = 'in-progress';
//     }

//     await lead.save();

//     res.status(200).json({
//       success: true,
//       message: 'Lead purchased successfully',
//       lead
//     });
//   } catch (error) {
//     console.error('Error purchasing lead:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Internal server error',
//       error: error.message
//     });
//   }
// };

exports.purchaseLead = async (req, res) => {
  try {
    const { leadId, slotsToBuy, useFreeQuota, freeSqftToUse, price } = req.body;
    // console.log("price : " , price)
    // return
    const sellerId = req.seller._id

    if (!leadId || !sellerId || !slotsToBuy || slotsToBuy <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request. Missing or invalid parameters.'
      });
    }

    // Convert leadId to ObjectId if it's a string
    const leadObjectId = typeof leadId === 'string' ? new mongoose.Types.ObjectId(leadId) : leadId;
    
    // Fetch lead using native collection to avoid any validation
    const LeadCollection = Lead.collection;
    const leadDoc = await LeadCollection.findOne({ _id: leadObjectId });
    
    if (!leadDoc) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }
    
    // Convert MongoDB document to plain object
    const lead = {
      ...leadDoc,
      _id: leadDoc._id.toString()
    };

    // Normalize status immediately after fetching to prevent validation errors
    const validStatuses = ['new', 'in-progress', 'closed', 'cancelled'];
    const statusMap = {
      'active': 'in-progress',
      'pending': 'new',
      'sold': 'closed'
    };
    
    let normalizedStatus = lead.status;
    if (lead.status && !validStatuses.includes(lead.status)) {
      normalizedStatus = statusMap[lead.status] || 'new';
      console.log(`Normalizing status from '${lead.status}' to '${normalizedStatus}'`);
      // Update the status in the database directly using native collection to prevent validation errors
      await LeadCollection.updateOne(
        { _id: leadObjectId },
        { $set: { status: normalizedStatus } }
      );
      // Update the lead object in memory
      lead.status = normalizedStatus;
    }

    const seller = await Seller.findById(sellerId);
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Seller not found'
      });
    }
    console.log("Seller : " , seller)

    // Check if total sqft is <= 50 and seller already purchased this lead
    if (lead.totalSqft <= 50) {
      console.log("Yes less than 50")
      const alreadyPurchased = lead.seller.some(s => s.sellerId.toString() === sellerId.toString());
      console.log("alreadyPurchased : " , alreadyPurchased )
      if (alreadyPurchased) {
        return res.status(400).json({
          success: false,
          // message: 'You have already purchased this small lead (≤ 50 sqft). Duplicate purchase is not allowed.'
          message: 'You can only purchase this lead once'
          // have already purchased this small lead (≤ 50 sqft). Duplicate purchase is not allowed.'
        });
      }
    }

     // Verify the seller has enough remaining quota if using free quota
    // if (useFreeQuota) {
    //   // const seller = await Seller.findById(req.sellerId);
    //   if (seller.freeQuota.currentMonthQuota < freeSqftToUse) {
    //     return res.status(400).json({ 
    //       success: false,
    //       message: 'Not enough free quota remaining'
    //     });
    //   }
      
    //   // Deduct the freeSqftToUse from the seller's quota
    //   seller.freeQuota.currentMonthQuota -= freeSqftToUse;
    //   await seller.save();
    // }

    // Check quota reset
    const now = new Date();
    if (now >= seller.freeQuota.nextResetDate) {
      seller.freeQuota.currentMonthQuota = 500;
      seller.freeQuota.usedQuota = 0;
      seller.freeQuota.nextResetDate = new Date(now);
      seller.freeQuota.nextResetDate.setMonth(now.getMonth() + 1);
      await seller.save();
    }

    // Calculate pricing
    const pricePerSqft = lead.basePricePerSqft; // 10.5
    const leadSqft = lead.totalSqft;
    const totalSqft = leadSqft * slotsToBuy;
    let freeSqftUsed = 0;
    let paidSqft = totalSqft;
    let actualPrice = paidSqft * pricePerSqft;

    if (useFreeQuota && seller.freeQuota.currentMonthQuota > 0) {
      // Check if already used quota for this lead
      const alreadyUsed = seller.quotaUsage.some(u => u.leadId.equals(leadId));
      
      if (!alreadyUsed) {
        // Calculate maximum free sqft (max 100 per transaction)
        // freeSqftUsed = Math.min(100, seller.freeQuota.currentMonthQuota, leadSqft);
        
        paidSqft = totalSqft - freeSqftToUse;
        actualPrice = paidSqft * pricePerSqft;
        console.log("Deatils : " ,freeSqftToUse , paidSqft , actualPrice)
        // return
        // Update seller's quota
        seller.freeQuota.currentMonthQuota -= freeSqftToUse;
        seller.freeQuota.usedQuota += freeSqftToUse;
        
        // Record quota usage
        seller.quotaUsage.push({
          leadId,
          sqftUsed: freeSqftToUse,
          date: now
        });
      }
    }

    const sellersInCity = await Seller.find({ 
      city: lead.projectInfo.area || lead.projectInfo.address || lead.projectInfo.city,
      status: 'approved',
      isActive: true
    });

    const brandCounts = {};
    sellersInCity.forEach(seller => {
      if (seller.brandOfProfileUsed) {
        brandCounts[seller.brandOfProfileUsed] = 
          (brandCounts[seller.brandOfProfileUsed] || 0) + 1;
      }
    });

    const brandsAtLimit = Object.entries(brandCounts)
      .filter(([_, count]) => count >= 2)
      .map(([brand]) => brand);

    if (brandsAtLimit.includes(seller.brandOfProfileUsed)) {
      return res.status(400).json({
        success: false,
        message: `Oops you have missed the bus by a whisker. Your brand in your city is already registered by 2 other fabricators.`,
        brandsAtLimit
      });
    }
 
    const pricePerSlot = actualPrice / slotsToBuy;
    const freePerSlot = freeSqftToUse / slotsToBuy;

    // slotsToBuy=6


    // Build the new seller array (avoid modifying lead object directly)
    const newSellers = [...(lead.seller || [])];
    for (let i = 0; i < slotsToBuy; i++) {
      newSellers.push({ 
        sellerId,
        purchasedAt: now,
        pricePaid: pricePerSlot,
        freeQuotaUsed: freePerSlot, // Distributed evenly but from single 100 limit
      });
    }

    const newAvailableSlots = lead.availableSlots - slotsToBuy;
    
    // Determine final status
    let finalStatus = normalizedStatus;
    if (newAvailableSlots === 0) {
      finalStatus = 'in-progress';
    }

    // Ensure status is valid (redefine statusMap and validStatuses for this scope)
    const validStatusesForUpdate = ['new', 'in-progress', 'closed', 'cancelled'];
    const statusMapForUpdate = {
      'active': 'in-progress',
      'pending': 'new',
      'sold': 'closed'
    };
    
    if (finalStatus && !validStatusesForUpdate.includes(finalStatus)) {
      finalStatus = statusMapForUpdate[finalStatus] || 'new';
    }

    // Avoid duplicate entries in seller.leads
    if (!seller.leads.includes(leadId)) {
      seller.leads.push(leadId);
    }

    // Use updateOne with runValidators: false to bypass validation completely
    // This prevents errors if status was invalid in the database
    console.log('Updating lead with status:', finalStatus);
    console.log('Valid statuses:', validStatusesForUpdate);
    console.log('Status is valid:', validStatusesForUpdate.includes(finalStatus));
    
    // Ensure finalStatus is definitely valid
    if (!validStatusesForUpdate.includes(finalStatus)) {
      finalStatus = statusMapForUpdate[finalStatus] || 'new';
      console.log('Final status normalized to:', finalStatus);
    }
    
    const updateData = {
      $set: {
        seller: newSellers,
        price: price,
        availableSlots: newAvailableSlots,
        status: finalStatus
      }
    };

    // Use MongoDB's native collection to bypass Mongoose validation completely
    // This ensures no validation errors even if status was invalid
    console.log('Updating lead with native collection:', {
      leadId: leadObjectId,
      finalStatus,
      updateData
    });
    
    try {
      await LeadCollection.updateOne(
        { _id: leadObjectId },
        updateData
      );
      console.log('Lead updated successfully using native collection');
    } catch (updateError) {
      console.error('Error updating lead with native collection:', updateError);
      throw updateError;
    }
    
    // Fetch the updated lead using native collection to avoid any validation
    const updatedLeadDoc = await LeadCollection.findOne({ _id: leadObjectId });
    
    // Convert MongoDB document to plain object
    const updatedLead = updatedLeadDoc ? {
      ...updatedLeadDoc,
      _id: updatedLeadDoc._id.toString()
    } : null;
    
    // Normalize status in the fetched lead if needed (safety check)
    if (updatedLead && updatedLead.status && !validStatusesForUpdate.includes(updatedLead.status)) {
      console.log('Warning: Fetched lead still has invalid status:', updatedLead.status);
      const correctedStatus = statusMapForUpdate[updatedLead.status] || 'new';
      // Update it again using native collection
      await LeadCollection.updateOne(
        { _id: leadObjectId },
        { $set: { status: correctedStatus } }
      );
      // Update the object in memory
      updatedLead.status = correctedStatus;
    }
    
    // Save seller
    await seller.save();
    
    res.status(200).json({
      success: true,
      message: 'Lead purchased successfully',
      lead: updatedLead || lead,
      actualPricePaid: actualPrice,
      freeSqftUsed: freeSqftToUse,
      paidSqft: paidSqft,
      pricePerSqft: pricePerSqft,
      // monthlyQuotaRemaining: seller.freeQuota.currentMonthQuota
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

// Update lead status
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

// Calculate price for a lead (utility endpoint)
exports.calculateLeadPrice = async (req, res) => {
  try {
    const { quotes } = req.body;

    if (!quotes || !Array.isArray(quotes)) {
      return res.status(400).json({
        success: false,
        message: 'Quotes array is required'
      });
    }

    // Calculate total square feet
    const totalSqft = quotes.reduce((total, quote) => {
      const sqft = (quote.height * quote.width * quote.quantity) / 144;
      return total + sqft;
    }, 0);

    // Calculate price per square foot
    const pricePerSqft = 6250 / (totalSqft * 6);

    res.status(200).json({
      success: true,
      totalSqft,
      pricePerSqft
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

exports.getSellerQuota = async (req, res) => {
  try {
    const seller = await Seller.findById(req.seller._id).select('freeQuota');
    
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Seller not found'
      });
    }
    seller.checkQuotaReset();
    if (seller.isModified()) await seller.save();

    res.json({
      success: true,
      remainingQuota: seller.freeQuota?.currentMonthQuota,
      nextReset: seller.freeQuota?.nextResetDate
    });
  } catch (error) {
    console.error('Error fetching seller quota:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
};

// Get all cities from leads
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
    
    console.log('🏙️ Cities from projectInfo.address.city:', citiesFromAddressCity);
    console.log('🏙️ Cities from projectInfo.city:', citiesFromCity);
    console.log('🏙️ Cities from projectInfo.area:', citiesFromArea);
    
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

// Get leads by city
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

// Get expired leads
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

// Get lead analytics
exports.getLeadAnalytics = async (req, res) => {
  try {
    console.log('\n📊 [ADMIN] getLeadAnalytics called');
    
    const now = new Date();
    const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    
    const [totalLeads, activeLeads, expiredLeads, revenueData] = await Promise.all([
      Lead.countDocuments({}),
      Lead.countDocuments({
        createdAt: { $gte: fortyEightHoursAgo },
        availableSlots: { $gt: 0 },
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
              $sum: {
                $multiply: ['$dynamicSlotPrice', 1]
              }
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

// Get city analytics
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
              $multiply: [
                { $size: { $ifNull: ['$seller', []] } },
                { $ifNull: ['$dynamicSlotPrice', 0] }
              ]
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

// Get brand analytics
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
            $sum: { $ifNull: ['$seller.pricePaid', '$dynamicSlotPrice', 0] }
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

// Get comprehensive lead details
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

// Get lead purchase history
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
      amount: purchase.pricePaid || lead.dynamicSlotPrice || 0,
      pricePaid: purchase.pricePaid || lead.dynamicSlotPrice || 0,
      freeQuotaUsed: purchase.freeQuotaUsed || 0,
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

// Get lead visibility status
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
    const hasAvailableSlots = lead.availableSlots > 0;
    const validStatus = ['new', 'in-progress'].includes(lead.status);
    
    const isVisible = isWithin48Hours && hasAvailableSlots && validStatus;
    
    const reasons = [];
    if (!isWithin48Hours) reasons.push('Lead is older than 48 hours');
    if (!hasAvailableSlots) reasons.push('No available slots remaining');
    if (!validStatus) reasons.push(`Invalid status: ${lead.status}`);
    
    const visibilityStatus = {
      isVisible,
      hoursSinceCreation,
      isWithin48Hours,
      hasAvailableSlots,
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

// Get lead timeline
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

// Get lead invoices (placeholder - implement based on your invoice system)
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

// Get lead details (basic version - fallback)
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

// Get lead purchases (basic version - fallback)
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
      amount: purchase.pricePaid || lead.dynamicSlotPrice || 0,
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

// Get comprehensive admin leads (enhanced version of getAllLeads)
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
    
    // Price range filter
    if (minPrice || maxPrice) {
      filter.$expr = {};
      const priceConditions = [];
      
      if (minPrice) {
        priceConditions.push({
          $gte: [
            { $multiply: ['$totalSqft', '$basePricePerSqft'] },
            parseFloat(minPrice)
          ]
        });
      }
      
      if (maxPrice) {
        priceConditions.push({
          $lte: [
            { $multiply: ['$totalSqft', '$basePricePerSqft'] },
            parseFloat(maxPrice)
          ]
        });
      }
      
      if (priceConditions.length > 0) {
        filter.$expr = priceConditions.length === 1 ? priceConditions[0] : { $and: priceConditions };
      }
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
        .populate('seller.sellerId', 'companyName brandOfProfileUsed contactPerson phoneNumber city businessProfileVideo visitingCard yearsInBusiness status isActive')
        .populate('category', 'name description')
        .populate('quotes.product', 'title features')
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * pageSize)
        .limit(pageSize)
        .lean()
    ]);
    
    // Enhance leads with calculated fields
    const enhancedLeads = leads.map(lead => {
      const now = new Date();
      const createdAt = new Date(lead.createdAt);
      const hoursSinceCreation = (now - createdAt) / (1000 * 60 * 60);
      const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
      
      const isWithin48Hours = createdAt >= fortyEightHoursAgo;
      const hasAvailableSlots = lead.availableSlots > 0;
      const validStatus = ['new', 'in-progress'].includes(lead.status);
      const isVisible = isWithin48Hours && hasAvailableSlots && validStatus;
      
      return {
        ...lead,
        estimatedValue: lead.totalSqft * (lead.basePricePerSqft || 10.5),
        purchaseCount: lead.seller?.length || 0,
        totalRevenue: (lead.seller?.length || 0) * (lead.dynamicSlotPrice || 0),
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

// Extend lead expiry
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
    
    // Extend the creation date by the specified number of days
    // This effectively extends the 48-hour visibility window
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