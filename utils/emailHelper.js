const nodemailer = require('nodemailer');

// Email configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'upvcconnect2025@gmail.com',
    pass: 'ycop wdir vszj jfch' // App password
  }
});

// Send document rejection email
const sendDocumentRejectionEmail = async (sellerEmail, sellerName, documentType, rejectionReason) => {
  const mailOptions = {
    from: {
      name: 'UPVC Connect',
      address: 'upvcconnect2025@gmail.com'
    },
    to: sellerEmail,
    subject: `Document Rejected - ${documentType}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .alert-box { background: #fee; border-left: 4px solid #f44; padding: 15px; margin: 20px 0; border-radius: 5px; }
          .reason-box { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; border: 1px solid #ddd; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔴 Document Rejected</h1>
          </div>
          <div class="content">
            <p>Dear <strong>${sellerName}</strong>,</p>
            
            <div class="alert-box">
              <p><strong>⚠️ Your ${documentType} has been rejected</strong></p>
            </div>
            
            <p>We regret to inform you that your submitted document could not be approved at this time.</p>
            
            <div class="reason-box">
              <p><strong>Rejection Reason:</strong></p>
              <p>${rejectionReason}</p>
            </div>
            
            <p><strong>What to do next:</strong></p>
            <ul>
              <li>Review the rejection reason carefully</li>
              <li>Prepare a corrected version of your ${documentType}</li>
              <li>Re-upload the document through your seller dashboard</li>
              <li>Ensure the document meets all requirements</li>
            </ul>
            
            <p style="text-align: center;">
              <a href="https://upvcconnect.com" class="button">Go to Dashboard</a>
            </p>
            
            <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
            
            <p>Best regards,<br><strong>UPVC Connect Team</strong></p>
          </div>
          <div class="footer">
            <p>© 2025 UPVC Connect. All rights reserved.</p>
            <p>This is an automated email. Please do not reply directly to this message.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Document rejection email sent to ${sellerEmail}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending document rejection email:', error);
    return false;
  }
};

// Send seller application rejection email
const sendSellerRejectionEmail = async (sellerEmail, sellerName, rejectionReason) => {
  const mailOptions = {
    from: {
      name: 'UPVC Connect',
      address: 'upvcconnect2025@gmail.com'
    },
    to: sellerEmail,
    subject: 'Application Rejected - UPVC Connect',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f44 0%, #c33 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .alert-box { background: #fee; border-left: 4px solid #f44; padding: 15px; margin: 20px 0; border-radius: 5px; }
          .reason-box { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; border: 1px solid #ddd; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>❌ Application Rejected</h1>
          </div>
          <div class="content">
            <p>Dear <strong>${sellerName}</strong>,</p>
            
            <div class="alert-box">
              <p><strong>⚠️ Your seller application has been rejected</strong></p>
            </div>
            
            <p>We regret to inform you that your application to join UPVC Connect as a seller has not been approved at this time.</p>
            
            <div class="reason-box">
              <p><strong>Rejection Reason:</strong></p>
              <p>${rejectionReason}</p>
            </div>
            
            <p>We appreciate your interest in partnering with us. If you believe this decision was made in error or if you would like to reapply after addressing the concerns mentioned above, please contact our support team.</p>
            
            <p>Thank you for your understanding.</p>
            
            <p>Best regards,<br><strong>UPVC Connect Team</strong></p>
          </div>
          <div class="footer">
            <p>© 2025 UPVC Connect. All rights reserved.</p>
            <p>This is an automated email. Please do not reply directly to this message.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Seller rejection email sent to ${sellerEmail}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending seller rejection email:', error);
    return false;
  }
};

// Send document approval email
const sendDocumentApprovalEmail = async (sellerEmail, sellerName, documentType) => {
  const mailOptions = {
    from: {
      name: 'UPVC Connect',
      address: 'upvcconnect2025@gmail.com'
    },
    to: sellerEmail,
    subject: `Document Approved - ${documentType}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .success-box { background: #efe; border-left: 4px solid #4f4; padding: 15px; margin: 20px 0; border-radius: 5px; }
          .button { display: inline-block; background: #11998e; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Document Approved</h1>
          </div>
          <div class="content">
            <p>Dear <strong>${sellerName}</strong>,</p>
            
            <div class="success-box">
              <p><strong>🎉 Great news! Your ${documentType} has been approved</strong></p>
            </div>
            
            <p>Congratulations! Your submitted document has been reviewed and approved by our team.</p>
            
            <p style="text-align: center;">
              <a href="https://upvcconnect.com" class="button">Go to Dashboard</a>
            </p>
            
            <p>You can now access all features available to verified sellers on UPVC Connect.</p>
            
            <p>Best regards,<br><strong>UPVC Connect Team</strong></p>
          </div>
          <div class="footer">
            <p>© 2025 UPVC Connect. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Document approval email sent to ${sellerEmail}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending document approval email:', error);
    return false;
  }
};

module.exports = {
  sendDocumentRejectionEmail,
  sendSellerRejectionEmail,
  sendDocumentApprovalEmail
};
