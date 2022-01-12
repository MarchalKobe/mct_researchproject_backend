import nodemailer from 'nodemailer';

export const sendEmail = async (email: string, url: string) => {
    const testAccount = await nodemailer.createTestAccount();

    const transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: testAccount.user, // generated ethereal user
            pass: testAccount.pass, // generated ethereal password
        },
    });

    let info = await transporter.sendMail({
        from: '"Code Assignment" <noreply@codeassignment.com>',
        to: email,
        subject: 'Confirm email',
        text: url,
        html: `<a href="${url}">link</a>`,
    });

    console.log(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
};
