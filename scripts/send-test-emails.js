const https = require('https');

const SENDGRID_API_KEY = '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';
const TO_EMAIL = 'urielaragon@gmail.com';
const FROM_EMAIL = 'noreply@yourdebtcollectors.com';
const FROM_NAME = 'PulseBC Calling System';

function sendEmail(to, subject, htmlContent) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: FROM_EMAIL, name: FROM_NAME },
      subject: subject,
      content: [{ type: 'text/html', value: htmlContent }]
    });

    const options = {
      hostname: 'api.sendgrid.com',
      port: 443,
      path: '/v3/mail/send',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        console.log(`[${subject}] Status: ${res.statusCode}`);
        if (body) console.log(`[${subject}] Response: ${body}`);
        resolve(res.statusCode);
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// Modern PulseBC-styled email template
function buildEmailHTML({ type, closerName, fromName, businessName, businessPhone, businessAddress, dmName, dmPhone, dmEmail, comments, debtorName, amountOwed, percentage, agreementSent, howSent, callBackDate }) {
  const isPC = type === 'potential-client';
  const headerColor = isPC ? '#0891b2' : '#0891b2'; // Teal for both, matching PulseBC accent
  const typeBadge = isPC ? 'POTENTIAL CLIENT' : 'INFO REQUEST';
  const typeEmoji = isPC ? '\u{1F4BC}' : '\u{1F4CB}';
  const greeting = isPC ? 'You Got a Potential Client!' : 'You Got an Info Request!';

  let debtorSection = '';
  if (isPC) {
    debtorSection = `
      <!-- Debtor Details -->
      <tr>
        <td style="padding: 0 40px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
            <tr>
              <td style="padding: 20px 24px; background-color: #f0fdfa; border-radius: 12px; border-left: 4px solid #0891b2;">
                <p style="margin: 0 0 12px 0; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #0891b2; font-family: 'Inter', Arial, sans-serif;">Debtor Details</p>
                <table cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td width="50%" style="padding: 4px 0; vertical-align: top;">
                      <p style="margin: 0; font-size: 12px; color: #64748b; font-family: 'Inter', Arial, sans-serif;">Debtor Name</p>
                      <p style="margin: 2px 0 0 0; font-size: 15px; color: #0f172a; font-weight: 600; font-family: 'Inter', Arial, sans-serif;">${debtorName}</p>
                    </td>
                    <td width="50%" style="padding: 4px 0; vertical-align: top;">
                      <p style="margin: 0; font-size: 12px; color: #64748b; font-family: 'Inter', Arial, sans-serif;">Amount Owed</p>
                      <p style="margin: 2px 0 0 0; font-size: 15px; color: #0f172a; font-weight: 700; font-family: 'Inter', Arial, sans-serif;">${amountOwed}</p>
                    </td>
                  </tr>
                  <tr>
                    <td width="50%" style="padding: 8px 0 4px 0; vertical-align: top;">
                      <p style="margin: 0; font-size: 12px; color: #64748b; font-family: 'Inter', Arial, sans-serif;">Percentage</p>
                      <p style="margin: 2px 0 0 0; font-size: 15px; color: #0f172a; font-weight: 600; font-family: 'Inter', Arial, sans-serif;">${percentage}</p>
                    </td>
                    <td width="50%" style="padding: 8px 0 4px 0; vertical-align: top;">
                      <p style="margin: 0; font-size: 12px; color: #64748b; font-family: 'Inter', Arial, sans-serif;">Agreement Sent?</p>
                      <p style="margin: 2px 0 0 0; font-size: 15px; color: #0f172a; font-weight: 600; font-family: 'Inter', Arial, sans-serif;">${agreementSent} (via ${howSent})</p>
                    </td>
                  </tr>
                  <tr>
                    <td colspan="2" style="padding: 8px 0 4px 0; vertical-align: top;">
                      <p style="margin: 0; font-size: 12px; color: #64748b; font-family: 'Inter', Arial, sans-serif;">Callback Date</p>
                      <p style="margin: 2px 0 0 0; font-size: 15px; color: #0f172a; font-weight: 600; font-family: 'Inter', Arial, sans-serif;">${callBackDate}</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>`;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; padding: 0; background-color: #f1f5f9; }
    @media (max-width: 680px) {
      .email-container { width: 100% !important; }
      .content-row td { display: block !important; width: 100% !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; -webkit-text-size-adjust: none;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f1f5f9; padding: 32px 0;">
    <tr><td align="center">

      <!-- Main Container -->
      <table class="email-container" width="620" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.06);">

        <!-- Top Accent Bar -->
        <tr>
          <td style="height: 4px; background: linear-gradient(90deg, #0891b2 0%, #06b6d4 50%, #22d3ee 100%);"></td>
        </tr>

        <!-- Header -->
        <tr>
          <td style="padding: 28px 40px 20px 40px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="vertical-align: middle;">
                  <table cellpadding="0" cellspacing="0"><tr>
                    <td style="vertical-align: middle; padding-right: 10px;"><img src="https://yourdebtcollectors.com/icon-192.png" height="40" width="40" style="display: block; height: 40px; width: 40px; border: 0; border-radius: 8px;"></td>
                    <td style="vertical-align: middle;"><span style="font-size: 20px; font-weight: 700; color: #0f172a; font-family: 'Inter', Arial, sans-serif;">Pulse<span style="color: #0891b2;">BC</span></span></td>
                  </tr></table>
                </td>
                <td style="vertical-align: middle; text-align: right;">
                  <span style="display: inline-block; padding: 6px 14px; background-color: ${isPC ? '#eff6ff' : '#f0fdfa'}; color: ${isPC ? '#1d4ed8' : '#0891b2'}; font-size: 11px; font-weight: 700; letter-spacing: 1.2px; text-transform: uppercase; border-radius: 20px; font-family: 'Inter', Arial, sans-serif;">${typeBadge}</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Hero Section -->
        <tr>
          <td style="padding: 0 40px 24px 40px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); border-radius: 12px; overflow: hidden;">
              <tr>
                <td style="padding: 32px 32px;">
                  <p style="margin: 0 0 4px 0; font-size: 14px; color: #94a3b8; font-family: 'Inter', Arial, sans-serif;">Hi, ${closerName}!</p>
                  <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 700; color: #ffffff; font-family: 'Inter', Arial, sans-serif;">${greeting}</h1>
                  <p style="margin: 0; font-size: 13px; color: #64748b; font-family: 'Inter', Arial, sans-serif;">Submitted by <span style="color: #22d3ee; font-weight: 600;">${fromName}</span></p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Business + Decision Maker (side by side) -->
        <tr>
          <td style="padding: 0 40px 24px 40px;">
            <table width="100%" cellpadding="0" cellspacing="0" class="content-row">
              <tr>
                <td width="48%" style="vertical-align: top; padding-right: 12px;">
                  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
                    <tr>
                      <td style="padding: 20px 20px;">
                        <p style="margin: 0 0 14px 0; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.2px; color: #0891b2; font-family: 'Inter', Arial, sans-serif;">Business Details</p>
                        <p style="margin: 0; font-size: 12px; color: #64748b; font-family: 'Inter', Arial, sans-serif;">Name</p>
                        <p style="margin: 2px 0 10px 0; font-size: 15px; color: #0f172a; font-weight: 600; font-family: 'Inter', Arial, sans-serif;">${businessName}</p>
                        <p style="margin: 0; font-size: 12px; color: #64748b; font-family: 'Inter', Arial, sans-serif;">Phone</p>
                        <p style="margin: 2px 0 10px 0; font-size: 15px; color: #0f172a; font-weight: 600; font-family: 'Inter', Arial, sans-serif;">${businessPhone}</p>
                        <p style="margin: 0; font-size: 12px; color: #64748b; font-family: 'Inter', Arial, sans-serif;">Address</p>
                        <p style="margin: 2px 0 0 0; font-size: 14px; color: #0f172a; font-weight: 500; font-family: 'Inter', Arial, sans-serif;">${businessAddress}</p>
                      </td>
                    </tr>
                  </table>
                </td>
                <td width="4%"></td>
                <td width="48%" style="vertical-align: top; padding-left: 12px;">
                  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
                    <tr>
                      <td style="padding: 20px 20px;">
                        <p style="margin: 0 0 14px 0; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.2px; color: #0891b2; font-family: 'Inter', Arial, sans-serif;">Decision Maker</p>
                        <p style="margin: 0; font-size: 12px; color: #64748b; font-family: 'Inter', Arial, sans-serif;">Name</p>
                        <p style="margin: 2px 0 10px 0; font-size: 15px; color: #0f172a; font-weight: 600; font-family: 'Inter', Arial, sans-serif;">${dmName}</p>
                        <p style="margin: 0; font-size: 12px; color: #64748b; font-family: 'Inter', Arial, sans-serif;">Phone</p>
                        <p style="margin: 2px 0 10px 0; font-size: 15px; color: #0f172a; font-weight: 600; font-family: 'Inter', Arial, sans-serif;">${dmPhone}</p>
                        <p style="margin: 0; font-size: 12px; color: #64748b; font-family: 'Inter', Arial, sans-serif;">Email</p>
                        <p style="margin: 2px 0 0 0; font-size: 14px; color: #0891b2; font-weight: 500; font-family: 'Inter', Arial, sans-serif;">${dmEmail}</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        ${debtorSection}

        <!-- Comments -->
        <tr>
          <td style="padding: 0 40px 24px 40px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fefce8; border-radius: 12px; border: 1px solid #fde68a;">
              <tr>
                <td style="padding: 20px 24px;">
                  <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.2px; color: #d97706; font-family: 'Inter', Arial, sans-serif;">Comments</p>
                  <p style="margin: 0; font-size: 15px; color: #451a03; line-height: 1.6; font-family: 'Inter', Arial, sans-serif;">${comments}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding: 16px 40px 28px 40px; border-top: 1px solid #f1f5f9;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="text-align: center;">
                  <p style="margin: 0; font-size: 11px; color: #94a3b8; font-family: 'Inter', Arial, sans-serif;">This is an automated notification from PulseBC Calling System.</p>
                  <p style="margin: 4px 0 0 0; font-size: 11px; color: #cbd5e1; font-family: 'Inter', Arial, sans-serif;">Please do not reply to this email.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

      </table>

    </td></tr>
  </table>
</body>
</html>`;
}

async function main() {
  // Email 1: Info Request
  const infoRequestHTML = buildEmailHTML({
    type: 'info-request',
    closerName: 'Carlos Aragon',
    fromName: 'Maria Rodriguez',
    businessName: 'Anderson & Partners Law Firm',
    businessPhone: '(972) 555-8432',
    businessAddress: '4521 Elm Street, Dallas, TX 75201',
    dmName: 'James Anderson',
    dmPhone: '(972) 555-8433',
    dmEmail: 'janderson@andersonlaw.com',
    comments: 'Client is interested in learning more about our debt collection services. They have several outstanding accounts they need help with. Please follow up at your earliest convenience. Best time to reach is mornings before 11am.',
  });

  // Email 2: Potential Client
  const potentialClientHTML = buildEmailHTML({
    type: 'potential-client',
    closerName: 'Carlos Aragon',
    fromName: 'Maria Rodriguez',
    businessName: 'Riverside Medical Group',
    businessPhone: '(818) 555-2197',
    businessAddress: '1200 Riverside Dr, Burbank, CA 91506',
    dmName: 'Dr. Sarah Mitchell',
    dmPhone: '(818) 555-2198',
    dmEmail: 'smitchell@riversidemedical.com',
    comments: 'Spoke with Dr. Mitchell about outstanding patient balances. She confirmed they have multiple accounts over 90 days past due and is ready to move forward. Agreement was sent via email and she confirmed receipt. Scheduled a callback for Friday to finalize terms. Very motivated to get collections started ASAP.',
    debtorName: 'Robert Thompson',
    amountOwed: '$12,450.00',
    percentage: '35%',
    agreementSent: 'Yes',
    howSent: 'Email',
    callBackDate: '03/15/2026',
  });

  console.log('Sending Info Request email to caragon@me.com...');
  await sendEmail(TO_EMAIL, 'Info Request - Anderson & Partners Law Firm', infoRequestHTML);

  console.log('Sending Potential Client email to caragon@me.com...');
  await sendEmail(TO_EMAIL, 'Potential Client - Riverside Medical Group', potentialClientHTML);

  console.log('Done! Both emails sent.');
}

main().catch(console.error);
