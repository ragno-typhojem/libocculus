const { Resend } = require('resend');

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // ✅ API Key kontrolü
    const apiKey = process.env.RESEND_API_KEY;
    
    console.log('🔑 API Key var mı?', apiKey ? 'Evet' : 'Hayır');
    console.log('🔑 API Key ilk 10 karakter:', apiKey ? apiKey.substring(0, 10) : 'YOK');

    if (!apiKey) {
      throw new Error('RESEND_API_KEY environment variable tanımlı değil');
    }

    const resend = new Resend(apiKey);

    const { email, otp } = JSON.parse(event.body);

    console.log('📧 Email:', email);
    console.log('🔢 OTP:', otp);

    if (!email || !otp) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Email ve OTP gerekli' })
      };
    }

    // ✅ Email gönder
    console.log('📤 Resend.emails.send çağrılıyor...');

    const { data, error } = await resend.emails.send({
      from: 'ODTÜ Libocculus <ragnogamescorp@gmail.com>',
      to: [email],
      subject: '[ODTÜ] Doğrulama Kodu - Libocculus',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; 
              line-height: 1.6; 
              color: #333; 
              margin: 0; 
              padding: 0; 
              background-color: #f9fafb;
            }
            .container { 
              max-width: 600px; 
              margin: 40px auto; 
              background: white;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header { 
              background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); 
              color: white; 
              padding: 40px 30px; 
              text-align: center; 
            }
            .header h1 {
              margin: 0;
              font-size: 36px;
              font-weight: bold;
            }
            .header p {
              margin: 10px 0 0 0;
              opacity: 0.95;
              font-size: 16px;
            }
            .content { 
              padding: 40px 30px; 
            }
            .content h2 {
              color: #1f2937;
              margin-top: 0;
              font-size: 24px;
            }
            .content p {
              color: #4b5563;
              font-size: 16px;
              margin: 16px 0;
            }
            .otp-box {
              background: linear-gradient(135deg, #fee2e2 0%, #fef3c7 100%);
              padding: 32px;
              text-align: center;
              border-radius: 12px;
              margin: 32px 0;
              border: 2px solid #fecaca;
            }
            .otp-code {
              font-size: 56px;
              font-weight: bold;
              letter-spacing: 16px;
              color: #dc2626;
              font-family: 'Courier New', monospace;
              margin: 0;
              text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
            }
            .warning-box {
              background: #fef3c7;
              border-left: 4px solid #f59e0b;
              padding: 16px;
              margin: 24px 0;
              border-radius: 4px;
            }
            .warning-box p {
              margin: 0;
              color: #92400e;
              font-size: 14px;
            }
            .info-box {
              background: #dbeafe;
              border-left: 4px solid #3b82f6;
              padding: 16px;
              margin: 24px 0;
              border-radius: 4px;
            }
            .info-box p {
              margin: 0;
              color: #1e40af;
              font-size: 14px;
            }
            .footer { 
              text-align: center; 
              padding: 30px; 
              background: #f9fafb;
              color: #9ca3af; 
              font-size: 13px; 
            }
            .footer p {
              margin: 8px 0;
            }
            .footer strong {
              color: #6b7280;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📚 Libocculus</h1>
              <p>ODTÜ Kampüs Doluluk Takip Sistemi</p>
            </div>
            
            <div class="content">
              <h2>Merhaba ODTÜ'lü! 👋</h2>
              
              <p>Libocculus hesabınızı oluşturmak için doğrulama kodunuz:</p>
              
              <div class="otp-box">
                <p class="otp-code">${otp}</p>
              </div>
              
              <div class="warning-box">
                <p>
                  ⏰ <strong>Önemli:</strong> Bu kod <strong>10 dakika</strong> geçerlidir.
                </p>
              </div>
              
              <div class="info-box">
                <p>
                  🔒 <strong>Güvenlik:</strong> Bu kodu kimseyle paylaşmayın. Libocculus ekibi asla bu kodu sizden istemez.
                </p>
              </div>
              
              <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">
                Eğer bu hesabı siz oluşturmadıysanız, bu e-postayı görmezden gelebilirsiniz.
              </p>
            </div>
            
            <div class="footer">
              <p><strong>ODTÜ Bilgisayar Topluluğu</strong></p>
              <p>Libocculus - Kampüs Doluluk Takip Sistemi</p>
              <p style="margin-top: 16px; font-size: 12px;">
                Bu mail otomatik gönderilmiştir. Lütfen yanıtlamayın.
              </p>
            </div>
          </div>
        </body>
        </html>
      `
    });

    if (error) {
      console.error('❌ Resend error:', error);
      throw new Error(error.message || 'Email gönderilemedi');
    }

    console.log('✅ Email başarıyla gönderildi:', data);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, data })
    };

  } catch (err) {
    console.error('❌ Function error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: err.message,
        stack: err.stack
      })
    };
  }
};
