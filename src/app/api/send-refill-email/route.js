// src/app/api/send-refill-email/route.js
import nodemailer from 'nodemailer'

export async function POST(request) {
	const { user_name, user_email, user_wallet, creditsAdded } =
		await request.json()

	const transporter = nodemailer.createTransport({
		service: 'gmail',
		auth: {
			user: process.env.EMAIL_USER,
			pass: process.env.EMAIL_PASS
		}
	})

	const mailOptions = {
		from: 'noreply@notqwerty.com',
		to: user_email,
		subject: 'Credits Refilled Successfully',
		html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Credits Refilled</title>
          <style>
              body {
                  font-family: Arial, sans-serif;
                  background-color: #f4f4f4;
                  margin: 0;
                  padding: 0;
                  color: #333;
              }
              .container {
                  width: 100%;
                  padding: 20px;
                  background-color: #fff;
                  max-width: 600px;
                  margin: 20px auto;
                  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
              }
              .header {
                  background-color: #4CAF50;
                  color: #fff;
                  padding: 10px 0;
                  text-align: center;
              }
              .header h1 {
                  margin: 0;
                  font-size: 24px;
              }
              .content {
                  padding: 20px;
                  text-align: center;
              }
              .content p {
                  margin: 0 0 10px;
                  line-height: 1.6;
                  text-align: left;
              }
              .content p strong {
                  display: block;
                  margin-bottom: 5px;
                  color: #555;
              }
              .footer {
                  text-align: center;
                  padding: 10px 0;
                  background-color: #f4f4f4;
                  color: #777;
                  font-size: 12px;
              }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <h1>Credits Refilled</h1>
              </div>
              <div class="content">
                  <p><strong>Name:</strong> ${user_name}</p>
                  <p><strong>Wallet:</strong> ${user_wallet}</p>
                  <p><strong>New Credits:</strong> ${creditsAdded}</p>
                  <p>Thank you for refilling your credits. If you have any questions, feel free to contact our support.</p>
              </div>
              <div class="footer">
                  <p>&copy; 2024 NotQwerty. All rights reserved.</p>
              </div>
          </div>
      </body>
      </html>
    `
	}

	try {
		await transporter.sendMail(mailOptions)
		return new Response(
			JSON.stringify({ message: 'Email sent successfully' }),
			{ status: 200 }
		)
	} catch (error) {
		console.error(error)
		return new Response(JSON.stringify({ error: 'Failed to send email' }), {
			status: 500
		})
	}
}