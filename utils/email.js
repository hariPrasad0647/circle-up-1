const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: Number(process.env.MAIL_PORT),
  secure: Number(process.env.MAIL_PORT) === 465,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASSWORD,
  },
});

const sendOtpEmail = async (to, code) => {
  const minutes = Math.floor(Number(process.env.OTP_EXPIRES_IN || 300) / 60);
  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to,
    subject: 'Your CircleUp verification code',
    html: `<p>Your verification code is <b>${code}</b>. It expires in ${minutes} minutes.</p>`,
  });
};

module.exports = { sendOtpEmail };
