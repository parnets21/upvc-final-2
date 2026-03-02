const nodemailerModule = require('nodemailer');

// Handle both CommonJS and ES module imports
const nodemailer = nodemailerModule.default || nodemailerModule;

// Create email transporter
const createTransporter = () => {
  // Verify nodemailer is loaded correctly
  if (!nodemailer || typeof nodemailer.createTransporter !== 'function') {
    console.error('❌ Nodemailer not loaded correctly!');
    console.error('Nodemailer type:', typeof nodemailer);
    console.error('Nodemailer keys:', nodemailer ? Object.keys(nodemailer) : 'null');
    console.error('Module type:', typeof nodemailerModule);
    console.error('Module keys:', nodemailerModule ? Object.keys(nodemailerModule) : 'null');
    throw new Error('Nodemailer module not loaded correctly. Please run: npm install nodemailer');
  }

  return nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER || 'your-email@gmail.com',
      pass: process.env.EMAIL_PASSWORD || 'your-app-password'
    }
  });
};

// Send new lead email to seller
exports.sendNewLeadEmail = async (sellerEmail, sellerName, leadData) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_USER || 'UPVC Connect <noreply@upvcconnect.com>',
      to: sellerEmail,
      subject: '🎯 New Lead Available - UPVC Connect',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f9f9f9;
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .content {
              background: white;
              padding: 30px;
              border-radius: 0 0 10px 10px;
            }
            .lead-details {
              background: #f5f5f5;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
            }
            .detail-row {
              display: flex;
              justify-content: space-between;
              padding: 10px 0;
              border-bottom: 1px solid #e0e0e0;
            }
            .detail-label {
              font-weight: bold;
              color: #666;
            }
            .detail-value {
              color: #333;
            }
            .cta-button {
              display: inline-block;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 15px 30px;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
              font-weight: bold;
            }
            .footer {
              text-align: center;
              color: #999;
              font-size: 12px;
              margin-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎯 New Lead Available!</h1>
              <p>A potential customer is looking for UPVC products in your area</p>
            </div>
            <div class="content">
              <p>Dear ${sellerName},</p>
              <p>Great news! A new lead has been posted on UPVC Connect that matches your service area.</p>
              
              <div class="lead-details">
                <h3>Lead Details:</h3>
                <div class="detail-row">
                  <span class="detail-label">Category:</span>
                  <span class="detail-value">${leadData.categoryName}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Location:</span>
                  <span class="detail-value">${leadData.location}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Total Area:</span>
                  <span class="detail-value">${leadData.totalSqft} sqft</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Available Slots:</span>
                  <span class="detail-value">${leadData.availableSlots} / ${leadData.maxSlots}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Posted By:</span>
                  <span class="detail-value">${leadData.buyerName}</span>
                </div>
              </div>

              <p><strong>⏰ Act Fast!</strong> Slots are limited and will be allocated on a first-come, first-served basis.</p>
              
              <center>
                <a href="https://upvcconnect.com/seller/leads/${leadData.leadId}" class="cta-button">
                  View Lead Details →
                </a>
              </center>

              <p>Don't miss this opportunity to grow your business!</p>
              
              <p>Best regards,<br>
              <strong>UPVC Connect Team</strong></p>
            </div>
            <div class="footer">
              <p>This is an automated notification from UPVC Connect</p>
              <p>© ${new Date().getFullYear()} UPVC Connect. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully to:', sellerEmail);
    return true;
  } catch (error) {
    console.error('❌ Error sending email:', error);
    throw error;
  }
};
