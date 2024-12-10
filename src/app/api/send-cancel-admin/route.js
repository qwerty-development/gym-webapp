// src/app/api/sendAdminEmail/route.js
import nodemailer from 'nodemailer'

function generateCancelEmailHTML(recipient, bookingDetails) {
	const isAdmin = recipient === 'admin'
	return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Booking Cancellation</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
            }
            .container {
                background-color: #f9f9f9;
                border: 1px solid #e0e0e0;
                border-radius: 5px;
                padding: 20px;
            }
            .header {
                background-color: #f44336;
                color: white;
                text-align: center;
                padding: 10px;
                border-radius: 5px 5px 0 0;
            }
            .content {
                background-color: white;
                padding: 20px;
                border-radius: 0 0 5px 5px;
            }
            .booking-details {
                background-color: #f5f5f5;
                border: 1px solid #e0e0e0;
                border-radius: 5px;
                padding: 15px;
                margin-bottom: 20px;
            }
            .booking-details p {
                margin: 5px 0;
            }
            .footer {
                text-align: center;
                margin-top: 20px;
                font-size: 0.8em;
                color: #777;
            }
            .cta-button {
                display: inline-block;
                background-color: #4CAF50;
                color: white;
                text-decoration: none;
                padding: 10px 20px;
                border-radius: 5px;
                margin-top: 20px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Booking Cancellation</h1>
            </div>
            <div class="content">
                <p>Dear ${isAdmin ? 'Admin' : bookingDetails.coach_name},</p>
                <p>A booking has been cancelled. Here are the details:</p>

                <div class="booking-details">
                    <p><strong>Activity:</strong> ${
											bookingDetails.activity_name
										}</p>
                    <p><strong>Date:</strong> ${
											bookingDetails.activity_date
										}</p>
                    <p><strong>Time:</strong> ${bookingDetails.start_time} - ${
		bookingDetails.end_time
	}</p>
                    <p><strong>Client:</strong> ${bookingDetails.user_name}</p>
                    <p><strong>Client Email:</strong> ${
											bookingDetails.user_email
										}</p>
                    ${
											isAdmin
												? `<p><strong>Coach:</strong> ${bookingDetails.coach_name}</p>`
												: ''
										}
                </div>


            </div>
            <div class="footer">
                <p>&copy; ${new Date().getFullYear()} NotQwerty. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
  `
}

export async function POST(request) {
	try {
		const bookingDetails = await request.json()

		const transporter = nodemailer.createTransport({
			service: 'gmail',
			auth: {
				user: process.env.EMAIL_USER,
				pass: process.env.EMAIL_PASS
			}
		})

		const adminMailOptions = {
			from: 'noreply@notqwerty.com',
			to: 'fitnessvista27@gmail.com',
			subject: `Booking Cancelation:${bookingDetails.user_name}${bookingDetails.activity_name} on ${bookingDetails.activity_date} at ${bookingDetails.start_time} - ${bookingDetails.end_time} with ${bookingDetails.coach_name}`,
			html: generateCancelEmailHTML('admin', bookingDetails)
		}

		const coachMailOptions = {
			from: 'noreply@notqwerty.com',
			to: bookingDetails.coach_email,
			subject: `Cancelled Booking:${bookingDetails.user_name}${bookingDetails.activity_name} on ${bookingDetails.activity_date} at ${bookingDetails.start_time} - ${bookingDetails.end_time} `,
			html: generateCancelEmailHTML('coach', bookingDetails)
		}

		await transporter.sendMail(adminMailOptions)
		await transporter.sendMail(coachMailOptions)

		return new Response(
			JSON.stringify({ message: 'Cancellation emails sent successfully' }),
			{ status: 200 }
		)
	} catch (error) {
		console.error('Error sending cancellation emails:', error)
		return new Response(
			JSON.stringify({ error: 'Failed to send cancellation emails' }),
			{
				status: 500
			}
		)
	}
}
