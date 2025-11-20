import Mailgun from 'mailgun.js'
import formData from 'form-data'

interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

class EmailService {
  private mg: any
  private domain: string
  private fromEmail: string

  constructor() {
    const mailgun = new Mailgun(formData)
    
    this.mg = mailgun.client({
      username: 'api',
      key: process.env.MAILGUN_API_KEY || '',
    })
    
    this.domain = process.env.MAILGUN_DOMAIN || ''
    this.fromEmail = process.env.MAILGUN_FROM_EMAIL || 'noreply@zakazivac.app'
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const messageData = {
        from: `Zakazivač <${this.fromEmail}>`,
        to: [options.to],
        subject: options.subject,
        html: options.html,
        text: options.text || this.stripHtml(options.html),
      }

      console.log('📧 Sending email via Mailgun:', {
        to: options.to,
        subject: options.subject,
        domain: this.domain,
      })

      const result = await this.mg.messages.create(this.domain, messageData)
      
      console.log('✅ Email sent successfully:', result.id)
      return true
    } catch (error) {
      console.error('❌ Failed to send email:', error)
      return false
    }
  }

  async sendVerificationEmail(email: string, name: string, verificationToken: string): Promise<boolean> {
    const verificationUrl = `${process.env.NEXTAUTH_URL}/auth/verify/${verificationToken}`
    
    const html = this.getVerificationEmailTemplate(name, verificationUrl)
    
    return this.sendEmail({
      to: email,
      subject: 'Potvrdite svoj nalog - Zakazivač',
      html,
    })
  }

  private getVerificationEmailTemplate(name: string, verificationUrl: string): string {
    return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Potvrdite svoj nalog</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f5f5f5;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: white;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            overflow: hidden;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
          }
          .content {
            padding: 40px 30px;
          }
          .button {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            padding: 15px 30px;
            border-radius: 5px;
            font-weight: bold;
            margin: 20px 0;
            text-align: center;
          }
          .footer {
            background-color: #f8f9fa;
            padding: 20px 30px;
            text-align: center;
            color: #666;
            border-top: 1px solid #eee;
          }
          .logo {
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 10px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">📅 Zakazivač</div>
            <p>Dobrodošli u naš sistem za zakazivanje termina</p>
          </div>
          
          <div class="content">
            <h2>Zdravo ${name}!</h2>
            
            <p>Hvala vam što ste se registrovali na Zakazivač platformu. Da biste završili registraciju, potrebno je da potvrdite svoj email i postavite svoj password.</p>
            
            <p>Kliknite na dugme ispod da potvrdite svoj nalog:</p>
            
            <div style="text-align: center;">
              <a href="${verificationUrl}" class="button">Potvrdite nalog</a>
            </div>
            
            <p>Ili kopirajte i nalepite ovaj link u vaš browser:</p>
            <p style="word-break: break-all; color: #667eea;">${verificationUrl}</p>
            
            <p><strong>Napomena:</strong> Ovaj link je valjan 24 sata. Ako ne potvrdite svoj nalog u tom periodu, moraćete ponovo da se registrujete.</p>
            
            <p>Ako niste kreirali nalog, možete ignorisati ovaj email.</p>
          </div>
          
          <div class="footer">
            <p>© 2025 Zakazivač. Sva prava zadržana.</p>
            <p>Ovaj email je automatski generisan, molimo vas ne odgovarajte.</p>
          </div>
        </div>
      </body>
    </html>
    `
  }

  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
  }
}

export const emailService = new EmailService()