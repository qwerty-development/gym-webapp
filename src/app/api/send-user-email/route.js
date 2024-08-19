import nodemailer from 'nodemailer'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import fetch from 'node-fetch'

export async function POST(request) {
	const {
		user_name,
		user_email,
		activity_name,
		activity_price,
		activity_date,
		start_time,
		end_time,
		coach_name,
		user_wallet
	} = await request.json()

	const transporter = nodemailer.createTransport({
		service: 'gmail',
		auth: {
			user: process.env.EMAIL_USER,
			pass: process.env.EMAIL_PASS
		}
	})

	// Create PDF
	const pdfDoc = await PDFDocument.create()
	const page = pdfDoc.addPage([600, 400])
	const { width, height } = page.getSize()
	const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
	const fontSize = 12

	// Load the logo image
	const logoImageUrl =
		'https://fitnessvista.app/_next/image?url=%2Fimages%2Flogo.png&w=256&q=75' // Replace with your actual image URL
	const logoImageBuffer = await fetch(logoImageUrl).then(res =>
		res.arrayBuffer()
	)
	const logo = await pdfDoc.embedPng(logoImageBuffer)

	// Get the dimensions of the image
	const logoDims = logo.scale(0.5) // Scale the image as needed

	page.drawImage(logo, {
		x: 50,
		y: height - 50 - logoDims.height,
		width: logoDims.width,
		height: logoDims.height
	})

	page.drawText('Booking Receipt', {
		x: 50,
		y: height - 50 - logoDims.height - 20,
		size: 24,
		font,
		color: rgb(0, 0.53, 0.71)
	})

	// Draw a line under the title
	page.drawLine({
		start: { x: 50, y: height - 50 - logoDims.height - 30 },
		end: { x: 550, y: height - 50 - logoDims.height - 30 },
		thickness: 1,
		color: rgb(0, 0.53, 0.71)
	})

	// Define common settings for the text
	const textOptions = {
		x: 50,
		size: fontSize,
		font,
		color: rgb(0, 0, 0)
	}

	// Draw the text fields
	page.drawText(`Activity: ${activity_name}`, {
		...textOptions,
		y: height - 100 - logoDims.height
	})
	page.drawText(`Coach: ${coach_name}`, {
		...textOptions,
		y: height - 120 - logoDims.height
	})
	page.drawText(`Date: ${activity_date}`, {
		...textOptions,
		y: height - 140 - logoDims.height
	})
	page.drawText(`Time: ${start_time} - ${end_time}`, {
		...textOptions,
		y: height - 160 - logoDims.height
	})
	page.drawText(`Name: ${user_name}`, {
		...textOptions,
		y: height - 180 - logoDims.height
	})
	page.drawText(`Wallet: ${user_wallet} credits`, {
		...textOptions,
		y: height - 200 - logoDims.height
	})
	page.drawText(`Activity Price: ${activity_price} credits`, {
		...textOptions,
		y: height - 220 - logoDims.height
	})

	// Draw a line above the footer
	page.drawLine({
		start: { x: 50, y: height - 280 - logoDims.height },
		end: { x: 550, y: height - 280 - logoDims.height },
		thickness: 1,
		color: rgb(0, 0.53, 0.71)
	})

	// Draw the footer text
	page.drawText(`© 2024 Qwerty. All rights reserved.`, {
		x: 50,
		y: height - 300 - logoDims.height,
		size: fontSize - 2,
		font,
		color: rgb(0.5, 0.5, 0.5)
	})

	const pdfBytes = await pdfDoc.save()

	const mailOptions = {
		from: 'noreply@notqwerty.com',
		to: user_email,
		subject: `Booking Receipt: ${activity_name} on ${activity_date} at ${start_time} - ${end_time}`,
		html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Booking Receipt</title>
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
              .content .activity-name {
                  font-size: 28px;
                  font-weight: bold;
                  margin: 20px 0;
              }
              .content .calendar {
                  display: inline-block;
                  padding: 10px;
                  border: 1px solid #ddd;
                  border-radius: 5px;
                  margin: 20px 0;
              }
              .content .calendar .date {
                  font-size: 20px;
                  font-weight: bold;
              }
              .content .calendar .time {
                  font-size: 16px;
                  color: #555;
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
                  <h1>Booking Receipt</h1>
              </div>
              <div class="content">
                  <div class="activity-name">${activity_name}</div>
                  <p>with ${coach_name}</p>
                  <div class="calendar">
                      <div class="date">${activity_date}</div>
                  </div>
                  <div class="time">${start_time} - ${end_time}</div>
                  <p><strong>Name:</strong> ${user_name}</p>
                  <p><strong>Wallet:</strong> ${user_wallet} credits</p>
                  <p><strong>Activity Price:</strong> ${activity_price} credits</p>
              </div>
              <div class="footer">
                  <p>&copy; 2024 Qwerty. All rights reserved.</p>
              </div>
          </div>
      </body>
      </html>
    `,
		attachments: [
			{
				filename: 'BookingReceipt.pdf',
				content: pdfBytes,
				contentType: 'application/pdf'
			}
		]
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
