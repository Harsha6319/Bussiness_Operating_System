import twilio from 'twilio';
import { ApiError } from '../../utils/ApiError.js';

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

export const sendSMS = async ({ to, body }) => {
  try {
    const message = await client.messages.create({
      body,
      to,
      from: process.env.TWILIO_PHONE_NUMBER || '+1234567890' // Replace with your Twilio number
    });

    return message;
  } catch (error) {
    console.error('SMS Service Error:', error);
    throw new ApiError(500, 'Could not send SMS');
  }
};
