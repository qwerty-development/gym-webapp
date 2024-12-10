import nodemailer from 'nodemailer'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import fetch from 'node-fetch'

export async function POST(request) {
	const {
		user_name,
		user_email,
		creditsAdded,
		user_wallet,
		newCredits,

		sale
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
		x: width / 2 - logoDims.width / 2,
		y: height - 50 - logoDims.height,
		width: logoDims.width,
		height: logoDims.height
	})

	page.drawText('Booking Invoice', {
		x: 50,
		y: height - 50 - logoDims.height - 20,
		size: 24,
		font,
		color: rgb(0.21, 0.47, 0.23)
	})

	// Draw a line under the title
	page.drawLine({
		start: { x: 50, y: height - 50 - logoDims.height - 30 },
		end: { x: 550, y: height - 50 - logoDims.height - 30 },
		thickness: 1,
		color: rgb(0.21, 0.47, 0.23)
	})

	// Define common settings for the text
	const textOptions = {
		size: fontSize,
		font,
		color: rgb(0, 0, 0)
	}

	// Define the x position for the columns
	const leftColumnX = 50
	const rightColumnX = 350

	// Draw user information on the left side
	page.drawText('Billed To:', {
		...textOptions,
		x: leftColumnX,
		y: height - 100 - logoDims.height,
		size: fontSize + 2,
		color: rgb(0.21, 0.47, 0.23)
	})
	page.drawText(`Name: ${user_name}`, {
		...textOptions,
		x: leftColumnX,
		y: height - 120 - logoDims.height
	})
	page.drawText(`Email: ${user_email}`, {
		...textOptions,
		x: leftColumnX,
		y: height - 140 - logoDims.height
	})
	page.drawText(`Wallet: ${user_wallet} credits`, {
		...textOptions,
		x: leftColumnX,
		y: height - 160 - logoDims.height
	})
	page.drawText(`Paid: ${newCredits}$`, {
		...textOptions,
		x: leftColumnX,
		y: height - 180 - logoDims.height
	})
	page.drawText(`Credits Added: ${creditsAdded} credits`, {
		...textOptions,
		x: leftColumnX,
		y: height - 200 - logoDims.height
	})
	page.drawText(`Discount: ${sale}%`, {
		...textOptions,
		x: leftColumnX,
		y: height - 220 - logoDims.height
	})
	page.drawText(`New Balance: ${user_wallet + creditsAdded}`, {
		...textOptions,
		x: leftColumnX,
		y: height - 240 - logoDims.height
	})

	// Draw company information on the right side
	page.drawText('Contact Information:', {
		...textOptions,
		x: rightColumnX,
		y: height - 100 - logoDims.height,
		size: fontSize + 2,
		color: rgb(0.21, 0.47, 0.23)
	})
	page.drawText('Email: fitnessvista27@gmail.com', {
		...textOptions,
		x: rightColumnX,
		y: height - 120 - logoDims.height
	})
	page.drawText('Address:', {
		...textOptions,
		x: rightColumnX,
		y: height - 140 - logoDims.height
	})
	page.drawText('Block D, 7th Floor', {
		...textOptions,
		x: rightColumnX,
		y: height - 160 - logoDims.height
	})
	page.drawText('Urban Dreams, Pierre Gemayel St.,', {
		...textOptions,
		x: rightColumnX,
		y: height - 180 - logoDims.height
	})
	page.drawText('Beirut, Lebanon', {
		...textOptions,
		x: rightColumnX,
		y: height - 200 - logoDims.height
	})
	page.drawText('Phone: +96181377353', {
		...textOptions,
		x: rightColumnX,
		y: height - 220 - logoDims.height
	})

	// Draw a line above the footer
	page.drawLine({
		start: { x: 50, y: height - 280 - logoDims.height },
		end: { x: 550, y: height - 280 - logoDims.height },
		thickness: 1,
		color: rgb(0.21, 0.47, 0.23)
	})

	// Draw the footer text
	page.drawText('© 2024 Qwerty. All rights reserved.', {
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
		subject: `Credits Refill: ${newCredits} credits added to your account`,
		html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Refill Invoice</title>
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
            <h1>Credits Refill Invoice</h1>
        </div>
        <div class="content">
            <p><strong>Name:</strong> ${user_name}</p>
            <p><strong>Email:</strong> ${user_email}</p>
            <p><strong>Wallet:</strong> ${user_wallet} credits</p>
        </div>
        <div class="content">
            <p><strong>Paid:</strong> ${newCredits}$</p>
                        <p><strong>Discount %:</strong> ${sale}</p>
            <p><strong>New Credits:</strong> ${creditsAdded}</p>

            <p><strong>New Balance:</strong> ${user_wallet + creditsAdded}</p>
            <p>Thank you for refilling your credits. If you have any questions, feel free to contact our support.</p>
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
				filename: 'BookingInvoice.pdf',
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
