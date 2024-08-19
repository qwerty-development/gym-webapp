// src/app/api/sendAdminEmail/route.js
import nodemailer from 'nodemailer'

export async function POST(request) {
	const {
		user_name,
		user_email,
		activity_name,
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

	const mailOptions = {
		from: 'noreply@notqwerty.com',
		to: user_email, // Replace with your admin email
		subject: `Cancelled Booking: ${activity_name} on ${activity_date} at ${start_time} - ${end_time}`,
		html: `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Cancelled Booking Receipt</title>
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
                background-color: #f44336;
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
                <h1>Cancelled Booking</h1>
            </div>
            <div class="content">
                <div class="activity-name">${activity_name}</div>
                <div class="calendar">
                    <div class="date">${activity_date}</div>
                    <div class="time">${start_time} - ${end_time}</div>
                </div>
                <p><strong>Name:</strong> ${user_name}</p>
                <p><strong>Coach Name:</strong> ${coach_name}</p>
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
