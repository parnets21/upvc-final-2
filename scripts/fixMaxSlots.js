const mongoose = require('mongoose');
const Lead = require('../models/Admin/lead');
require('dotenv').config();

const fixMaxSlots = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Find all leads with maxSlots not equal to 6 or undefined
    const leadsToFix = await Lead.find({
      $or: [
        { maxSlots: { $ne: 6 } },
        { maxSlots: { $exists: false } }
      ]
    });

    console.log(`\n📊 Found ${leadsToFix.length} leads with incorrect maxSlots`);

    if (leadsToFix.length === 0) {
      console.log('✅ All leads already have correct maxSlots value');
      process.exit(0);
    }

    // Update each lead
    let updated = 0;
    for (const lead of leadsToFix) {
      const oldMaxSlots = lead.maxSlots;
      const oldAvailableSlots = lead.availableSlots;
      
      // Calculate how many slots were sold
      const slotsSold = (oldMaxSlots || 1) - (oldAvailableSlots || 0);
      
      // Set maxSlots to 6
      lead.maxSlots = 6;
      
      // Adjust availableSlots: 6 - slotsSold
      lead.availableSlots = Math.max(0, 6 - slotsSold);
      
      await lead.save();
      updated++;
      
      console.log(`\n✅ Updated Lead ${lead._id}:`);
      console.log(`   Old: maxSlots=${oldMaxSlots}, availableSlots=${oldAvailableSlots}`);
      console.log(`   New: maxSlots=${lead.maxSlots}, availableSlots=${lead.availableSlots}`);
      console.log(`   Slots sold: ${slotsSold}`);
    }

    console.log(`\n✅ Successfully updated ${updated} leads`);
    console.log('✅ All leads now have maxSlots = 6');

  } catch (error) {
    console.error('❌ Error fixing maxSlots:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
    process.exit(0);
  }
};

fixMaxSlots();
