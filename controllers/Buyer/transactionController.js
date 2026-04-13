const Lead = require('../../models/Admin/lead');
const Seller = require('../../models/Seller/Seller');
const User = require('../../models/Buyer/User');
const mongoose = require('mongoose');

exports.getLeadTransaction = async (req, res) => {
  try {
    const { leadId } = req.params;
    const buyerId = req.user._id;

    console.log('📊 Fetching transaction data for lead:', leadId, 'buyer:', buyerId);

    const lead = await Lead.findById(leadId)
      .populate('buyer', 'name email mobileNumber')
      .populate('category', 'name')
      .populate({
        path: 'seller.sellerId',
        select: 'companyName contactPerson city phoneNumber brandOfProfileUsed yearsInBusiness'
      });

    if (!lead) {
      console.log('❌ Lead not found:', leadId);
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    console.log('✅ Lead found:', {
      leadId: lead._id,
      buyerId: lead.buyer._id,
      sellerCount: lead.seller?.length || 0,
      participatingSellersCount: lead.participatingSellersCount
    });

    // Verify buyer owns this lead
    if (lead.buyer._id.toString() !== buyerId.toString()) {
      console.log('❌ Unauthorized access - buyer mismatch');
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access'
      });
    }

    // Check if at least 1 seller has paid escrow
    if (!lead.seller || lead.seller.length < 1) {
      console.log('❌ No sellers participated yet');
      return res.status(400).json({
        success: false,
        message: 'Transaction can only be finalized when at least 1 seller has participated'
      });
    }

    // Format sellers data
    const sellers = lead.seller.map((s, index) => {
      console.log(`Seller ${index}:`, {
        id: s.sellerId?._id,
        businessName: s.sellerId?.companyName,
        escrowPaid: s.escrowPaid,
        sellerStatus: s.sellerStatus
      });
      
      return {
        id: s.sellerId._id,
        businessName: s.sellerId.companyName,
        contactPerson: s.sellerId.contactPerson,
        city: s.sellerId.city,
        phoneNumber: s.sellerId.phoneNumber,
        brandName: s.sellerId.brandOfProfileUsed,
        yearsInBusiness: s.sellerId.yearsInBusiness,
        escrowDeposit: s.escrowPaid,
        purchasedAt: s.purchasedAt,
        paymentStatus: s.paymentStatus,
        sellerStatus: s.sellerStatus || 'active'
      };
    });

    console.log('✅ Formatted sellers:', sellers.length);

    const leadDetails = {
      leadId: lead._id,
      location: lead.projectInfo.area || lead.projectInfo.address,
      category: lead.category.name,
      sqft: lead.totalSqft,
      leadValue: lead.leadValue,
      pricePerSqft: lead.pricePerSqft,
      escrowDepositAmount: lead.escrowDepositAmount,
      winnerSelected: lead.winnerSellerId ? true : false,
      winnerConfirmed: lead.transactionConfirmed || false
    };

    res.status(200).json({
      success: true,
      lead: leadDetails,
      sellers
    });

  } catch (error) {
    console.error('Error fetching transaction data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transaction data',
      error: error.message
    });
  }
};
exports.selectWinningSeller = async (req, res) => {
  try {
    const { leadId } = req.params;
    const { sellerId } = req.body;
    const buyerId = req.user._id;

    if (!sellerId) {
      return res.status(400).json({
        success: false,
        message: 'Seller ID is required'
      });
    }

    const lead = await Lead.findById(leadId)
      .populate('buyer', 'name email mobileNumber fcmToken')
      .populate({
        path: 'seller.sellerId',
        select: 'companyName contactPerson phoneNumber fcmToken'
      });

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    // Verify buyer owns this lead
    if (lead.buyer._id.toString() !== buyerId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access'
      });
    }

    // Check if at least 1 seller participated
    if (!lead.seller || lead.seller.length < 1) {
      return res.status(400).json({
        success: false,
        message: 'Cannot select winner until at least 1 seller has participated'
      });
    }

    // Check if winner already selected
    if (lead.winnerSellerId) {
      return res.status(400).json({
        success: false,
        message: 'Winner has already been selected for this lead'
      });
    }

    // Verify seller participated in this lead
    const sellerParticipated = lead.seller.some(
      s => s.sellerId._id.toString() === sellerId.toString()
    );

    if (!sellerParticipated) {
      return res.status(400).json({
        success: false,
        message: 'Selected seller did not participate in this lead'
      });
    }

    // Update lead with winner (pending seller confirmation)
    lead.winnerSellerId = sellerId;
    lead.buyerConfirmedAt = new Date();
    lead.transactionStatus = 'pending_seller_confirmation';
    
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
    
    await lead.save({ validateModifiedOnly: true });

    // Get winner details
    const winnerSeller = lead.seller.find(
      s => s.sellerId._id.toString() === sellerId.toString()
    );

    // Send notification to winning seller (FCM + Email)
    try {
      const { sendSellerWinNotification, saveSellerNotification } = require('../../utils/notificationHelper');
      const { sendSellerAdvanceConfirmationEmail } = require('../../utils/emailHelper');
      
      const notifData = {
        leadId: lead._id.toString(),
        buyerName: lead.buyer.name,
        projectLocation: lead.projectInfo.area || lead.projectInfo.address,
        leadValue: lead.leadValue
      };

      // Send FCM notification
      if (winnerSeller.sellerId.fcmToken) {
        await sendSellerWinNotification(winnerSeller.sellerId.fcmToken, notifData);
      }
      
      // Save in-app notification
      await saveSellerNotification(winnerSeller.sellerId._id, notifData);

      // Send email notification
      if (winnerSeller.sellerId.email) {
        await sendSellerAdvanceConfirmationEmail(
          winnerSeller.sellerId.email,
          winnerSeller.sellerId.contactPerson || winnerSeller.sellerId.companyName,
          {
            buyerName: lead.buyer.name,
            projectLocation: lead.projectInfo.area || lead.projectInfo.address,
            leadValue: lead.leadValue,
            leadId: lead._id.toString()
          }
        );
      }
    } catch (notifError) {
      console.error('Error sending winner notification:', notifError);
    }

    // Send decline notifications to losing sellers
    try {
      const Seller = require('../../models/Seller/Seller');
      
      for (const sellerEntry of lead.seller) {
        if (sellerEntry.sellerId._id.toString() !== sellerId.toString()) {
          const loserSeller = await Seller.findById(sellerEntry.sellerId._id);
          
          const declineData = {
            projectLocation: lead.projectInfo.area || lead.projectInfo.address,
            buyerName: lead.buyer.name
          };

          // Send push notification if FCM token exists
          if (loserSeller && loserSeller.fcmToken) {
            const { sendSellerDeclineNotification } = require('../../utils/notificationHelper');
            await sendSellerDeclineNotification(loserSeller.fcmToken, declineData);
          }
          
          // Save in-app notification
          const { saveSellerDeclineNotification } = require('../../utils/notificationHelper');
          await saveSellerDeclineNotification(sellerEntry.sellerId._id, declineData);
        }
      }
    } catch (notifError) {
      console.error('Error sending decline notifications:', notifError);
    }

    res.status(200).json({
      success: true,
      message: 'Winner selected successfully. Waiting for seller confirmation.',
      leadId: lead._id,
      winnerId: sellerId,
      status: 'pending_seller_confirmation'
    });

  } catch (error) {
    console.error('Error selecting winner:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to select winner',
      error: error.message
    });
  }
};
exports.sellerConfirmWin = async (req, res) => {
  try {
    const { leadId } = req.params;
    const sellerId = req.seller._id;

    const lead = await Lead.findById(leadId)
      .populate('buyer', 'name email mobileNumber fcmToken')
      .populate({
        path: 'seller.sellerId',
        select: 'companyName contactPerson phoneNumber email'
      });

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    // Check if this seller is the selected winner
    if (!lead.winnerSellerId || lead.winnerSellerId.toString() !== sellerId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not the selected winner for this lead'
      });
    }

    // Check if buyer has confirmed advance payment
    if (lead.transactionStatus !== 'pending_seller_confirmation') {
      return res.status(400).json({
        success: false,
        message: 'Buyer has not confirmed advance payment yet'
      });
    }

    // Check if already confirmed
    if (lead.transactionConfirmed) {
      return res.status(400).json({
        success: false,
        message: 'Transaction already confirmed'
      });
    }

    // Confirm transaction
    lead.transactionConfirmed = true;
    lead.sellerConfirmedAt = new Date();
    lead.transactionStatus = 'confirmed';
    lead.status = 'closed';
    await lead.save({ validateModifiedOnly: true });

    // Execute escrow logic
    await executeEscrowLogic(lead);

    res.status(200).json({
      success: true,
      message: 'Advance payment confirmed successfully! Escrow processed.',
      leadId: lead._id,
      status: 'confirmed'
    });

  } catch (error) {
    console.error('Error confirming advance payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to confirm transaction',
      error: error.message
    });
  }
};

exports.sellerIgnoreAdvance = async (req, res) => {
  try {
    const { leadId } = req.params;
    const sellerId = req.seller._id;

    const lead = await Lead.findById(leadId)
      .populate('buyer', 'name email mobileNumber fcmToken')
      .populate({
        path: 'seller.sellerId',
        select: 'companyName contactPerson phoneNumber email'
      });

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    // Check if this seller is the selected winner
    if (!lead.winnerSellerId || lead.winnerSellerId.toString() !== sellerId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not the selected winner for this lead'
      });
    }

    // Check if buyer has confirmed advance payment
    if (lead.transactionStatus !== 'pending_seller_confirmation') {
      return res.status(400).json({
        success: false,
        message: 'Buyer has not confirmed advance payment yet'
      });
    }

    // Reset winner selection
    lead.winnerSellerId = null;
    lead.buyerConfirmedAt = null;
    lead.transactionStatus = 'active';
    
    // Reset all seller statuses back to active
    lead.seller.forEach(sellerEntry => {
      sellerEntry.sellerStatus = 'active';
      sellerEntry.declinedAt = null;
    });
    
    await lead.save({ validateModifiedOnly: true });

    // Notify buyer that seller ignored the advance payment
    try {
      const { sendBuyerAdvanceIgnoredNotification, saveBuyerAdvanceIgnoredNotification } = require('../../utils/notificationHelper');
      
      const winnerSeller = lead.seller.find(
        s => s.sellerId._id.toString() === sellerId.toString()
      );

      const notifData = {
        sellerName: winnerSeller.sellerId.companyName || winnerSeller.sellerId.contactPerson,
        projectLocation: lead.projectInfo.area || lead.projectInfo.address
      };

      if (lead.buyer.fcmToken) {
        await sendBuyerAdvanceIgnoredNotification(lead.buyer.fcmToken, notifData);
      }
      await saveBuyerAdvanceIgnoredNotification(lead.buyer._id, notifData);
    } catch (notifError) {
      console.error('Error sending buyer notification:', notifError);
    }

    res.status(200).json({
      success: true,
      message: 'Advance payment ignored. Selection has been cancelled.',
      leadId: lead._id,
      status: 'active'
    });

  } catch (error) {
    console.error('Error ignoring advance payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process request',
      error: error.message
    });
  }
};
async function executeEscrowLogic(lead) {
  try {
    console.log('🔄 Executing escrow logic for lead:', lead._id);
const winnerId = lead.winnerSellerId.toString();
    const GATEWAY_FEE_PERCENTAGE = 2;
    const { 
      sendSellerRefundNotification, 
      saveSellerRefundNotification,
      sendBuyerTransactionConfirmedNotification,
      saveBuyerTransactionConfirmedNotification
    } = require('../../utils/notificationHelper');

    const Seller = require('../../models/Seller/Seller');
    const User = require('../../models/Buyer/User');
    const winnerSeller = await Seller.findById(winnerId);
    const buyer = await User.findById(lead.buyer);

    for (const sellerEntry of lead.seller) {
      const sellerId = sellerEntry.sellerId._id.toString();
      const escrowAmount = sellerEntry.escrowPaid;

      if (sellerId === winnerId) {
        console.log(`✅ Winner (${sellerId}): Escrow ₹${escrowAmount} → Platform Revenue`);
        
        sellerEntry.paymentStatus = 'transferred_to_revenue';
        sellerEntry.escrowTransferredAt = new Date();
      } else {
        const gatewayFee = Math.round((escrowAmount * GATEWAY_FEE_PERCENTAGE) / 100);
        const refundAmount = escrowAmount - gatewayFee;
        
        console.log(`💸 Loser (${sellerId}): Refunding ₹${refundAmount} (₹${gatewayFee} gateway fee)`);
        
        sellerEntry.paymentStatus = 'refunded';
        sellerEntry.refundAmount = refundAmount;
        sellerEntry.gatewayFee = gatewayFee;
        sellerEntry.refundedAt = new Date();
        try {
          const loserSeller = await Seller.findById(sellerId);
          const refundData = {
            refundAmount,
            gatewayFee,
            projectLocation: lead.projectInfo.area || lead.projectInfo.address
          };

          if (loserSeller.fcmToken) {
            await sendSellerRefundNotification(loserSeller.fcmToken, refundData);
          }
          await saveSellerRefundNotification(sellerId, refundData);
        } catch (notifError) {
          console.error('Error sending refund notification:', notifError);
        }
      }
    }
await lead.save({ validateModifiedOnly: true });
    try {
      const confirmData = {
        sellerName: winnerSeller.companyName || winnerSeller.contactPerson,
        projectLocation: lead.projectInfo.area || lead.projectInfo.address
      };

      if (buyer.fcmToken) {
        await sendBuyerTransactionConfirmedNotification(buyer.fcmToken, confirmData);
      }
      await saveBuyerTransactionConfirmedNotification(buyer._id, confirmData);
    } catch (notifError) {
      console.error('Error sending buyer confirmation notification:', notifError);
    }
    console.log('✅ Escrow logic executed successfully');
  } catch (error) {
    console.error('❌ Error executing escrow logic:', error);
    throw error;
  }
}
exports.getSellerLeadStatus = async (req, res) => {
  try {
    const { leadId } = req.params;
    const sellerId = req.seller._id;

    const lead = await Lead.findById(leadId)
      .populate('buyer', 'name mobileNumber')
      .populate('category', 'name');

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    // Check if seller participated
    const sellerEntry = lead.seller.find(
      s => s.sellerId.toString() === sellerId.toString()
    );

    if (!sellerEntry) {
      return res.status(403).json({
        success: false,
        message: 'You did not participate in this lead'
      });
    }

    const isWinner = lead.winnerSellerId && lead.winnerSellerId.toString() === sellerId.toString();
    const needsConfirmation = isWinner && !lead.transactionConfirmed;

    res.status(200).json({
      success: true,
      leadId: lead._id,
      category: lead.category.name,
      location: lead.projectInfo.area || lead.projectInfo.address,
      leadValue: lead.leadValue,
      escrowPaid: sellerEntry.escrowPaid,
      paymentStatus: sellerEntry.paymentStatus,
      isWinner,
      needsConfirmation,
      transactionStatus: lead.transactionStatus,
      buyerConfirmedAt: lead.buyerConfirmedAt,
      sellerConfirmedAt: lead.sellerConfirmedAt,
      refundAmount: sellerEntry.refundAmount,
      gatewayFee: sellerEntry.gatewayFee
    });

  } catch (error) {
    console.error('Error fetching seller lead status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch lead status',
      error: error.message
    });
  }
};
module.exports = exports;
