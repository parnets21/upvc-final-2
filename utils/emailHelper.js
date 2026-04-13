const nodemailer = require('nodemailer');

// Create email transporter
const createTransporter = () => {
  // Note: The function is called createTransport (not createTransporter)
  return nodemailer.createTransport({
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
                  <span class="detail-label">Seller Slots:</span>
                  <span class="detail-value">${3 - (leadData.participatingSellersCount || 0)} / 3 available</span>
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

// Send document rejection email to seller
exports.sendDocumentRejectionEmail = async (sellerEmail, sellerName, documentType, reason) => {
  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: process.env.EMAIL_USER || 'UPVC Connect <noreply@upvcconnect.com>',
      to: sellerEmail,
      subject: `❌ Document Rejected - ${documentType}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
          <h2 style="color:#e74c3c;">Document Rejected</h2>
          <p>Dear ${sellerName},</p>
          <p>Your <strong>${documentType}</strong> has been reviewed and rejected.</p>
          <div style="background:#fdf2f2;border-left:4px solid #e74c3c;padding:16px;border-radius:4px;margin:16px 0;">
            <strong>Reason:</strong> ${reason}
          </div>
          <p>Please re-upload the correct document to proceed.</p>
          <p>Best regards,<br><strong>UPVC Connect Team</strong></p>
        </div>
      `
    });
    return true;
  } catch (error) {
    console.error('❌ Error sending document rejection email:', error);
    throw error;
  }
};

// Send document approval email to seller
exports.sendDocumentApprovalEmail = async (sellerEmail, sellerName, documentType) => {
  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: process.env.EMAIL_USER || 'UPVC Connect <noreply@upvcconnect.com>',
      to: sellerEmail,
      subject: `✅ Document Approved - ${documentType}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
          <h2 style="color:#27ae60;">Document Approved</h2>
          <p>Dear ${sellerName},</p>
          <p>Your <strong>${documentType}</strong> has been approved successfully.</p>
          <p>Best regards,<br><strong>UPVC Connect Team</strong></p>
        </div>
      `
    });
    return true;
  } catch (error) {
    console.error('❌ Error sending document approval email:', error);
    throw error;
  }
};

// Send seller application rejection email
exports.sendSellerRejectionEmail = async (sellerEmail, sellerName, reason) => {
  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: process.env.EMAIL_USER || 'UPVC Connect <noreply@upvcconnect.com>',
      to: sellerEmail,
      subject: '❌ Application Not Approved - UPVC Connect',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
          <h2 style="color:#e74c3c;">Application Not Approved</h2>
          <p>Dear ${sellerName},</p>
          <p>We regret to inform you that your seller application has not been approved.</p>
          <div style="background:#fdf2f2;border-left:4px solid #e74c3c;padding:16px;border-radius:4px;margin:16px 0;">
            <strong>Reason:</strong> ${reason}
          </div>
          <p>If you believe this is a mistake, please contact our support team.</p>
          <p>Best regards,<br><strong>UPVC Connect Team</strong></p>
        </div>
      `
    });
    return true;
  } catch (error) {
    console.error('❌ Error sending seller rejection email:', error);
    throw error;
  }
};


// Send advance payment confirmation email to seller
exports.sendSellerAdvanceConfirmationEmail = async (sellerEmail, sellerName, data) => {
  try {
    const transporter = createTransporter();
    const { buyerName, projectLocation, leadValue, leadId } = data;

    const mailOptions = {
      from: process.env.EMAIL_USER || 'UPVC Connect <noreply@upvcconnect.com>',
      to: sellerEmail,
      subject: '🎉 Congratulations! Buyer Confirmed Advance Payment - Action Required',
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
              background: linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%);
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
              color: #000;
            }
            .cta-button {
              display: inline-block;
              background: #000;
              color: white;
              padding: 15px 40px;
              text-decoration: none;
              border-radius: 8px;
              margin: 20px 0;
              font-weight: bold;
            }
            .warning-box {
              background: #FFF3E0;
              border-left: 4px solid #FF9800;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .footer {
              text-align: center;
              padding: 20px;
              color: #666;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Congratulations!</h1>
              <p style="font-size: 18px; margin: 10px 0 0 0;">You've Been Selected as the Winner!</p>
            </div>
            
            <div class="content">
              <p>Dear ${sellerName},</p>
              
              <p><strong>Great news!</strong> ${buyerName} has selected you as the winner and confirmed that they have paid the advance payment.</p>
              
              <div class="lead-details">
                <h3>Project Details:</h3>
                <div class="detail-row">
                  <span class="detail-label">Buyer:</span>
                  <span class="detail-value">${buyerName}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Location:</span>
                  <span class="detail-value">${projectLocation}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Lead Value:</span>
                  <span class="detail-value">₹${leadValue.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div class="warning-box">
                <strong>⚠️ Action Required:</strong>
                <p style="margin: 10px 0 0 0;">Please verify that you have received the advance payment from the buyer. Open the UPVC Connect app and confirm to finalize the deal.</p>
              </div>

              <p><strong>Important:</strong></p>
              <ul>
                <li>Only confirm if you have actually received the advance payment</li>
                <li>Your escrow deposit will be transferred to UPVC Connect upon confirmation</li>
                <li>The transaction will be finalized and cannot be undone</li>
              </ul>

              <center>
                <p style="margin: 30px 0 10px 0;">Open the app to confirm:</p>
                <a href="upvcconnect://lead/${leadId}/confirm" class="cta-button">
                  Open UPVC Connect App →
                </a>
              </center>

              <p style="margin-top: 30px;">If you have any questions or concerns, please contact our support team immediately.</p>
              
              <p>Best regards,<br>
              <strong>UPVC Connect Team</strong></p>
            </div>
            
            <div class="footer">
              <p>This is an automated email from UPVC Connect. Please do not reply to this email.</p>
              <p>&copy; 2024 UPVC Connect. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('✅ Advance confirmation email sent to:', sellerEmail);
  } catch (error) {
    console.error('❌ Error sending advance confirmation email:', error);
    throw error;
  }
};
