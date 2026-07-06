import { ApiError } from '../../utils/ApiError.js';

export const sendEmail = async ({ to, subject, html }) => {
  try {
    const response = await fetch('https://smtp.maileroo.com/send', {
      method: 'POST',
      headers: {
        'X-API-Key': process.env.MAILEROO_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'noreply@yourdomain.com', // Replace with verified domain
        to,
        subject,
        html
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to send email via Maileroo');
    }

    return data;
  } catch (error) {
    console.error('Email Service Error:', error);
    throw new ApiError(500, 'Could not send email');
  }
};
