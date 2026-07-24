import { PASSWORD_RESET_CONFIRMATION_TEMPLATE, PASSWORD_RESET_REQUEST_TEMPLATE, VERIFICATION_EMAIL_TEMPLATE, WELCOME_EMAIL_TEMPLATE } from "./emailTemplates.js"
import transport, { sender } from "../mailtrap/nodemailer.js";


export const sendVerificationEmail = async (email, token) => {
    try {
        const response = await transport.sendMail({
            from: `"${sender.name}" <${sender.email}>`,
            to: email,
            subject: "Verify your email address",
            html: VERIFICATION_EMAIL_TEMPLATE.replace("{@verification_token@}", token),
            // category: "Email Verification",
        })
        console.log("Email sent successfully:", response)
    } catch (error) {
        console.error("Failed to send verification", error)
        throw new Error(`Failed to send verification email: ${error}`)
    }
}


export const sendWelcomeEmail = async (name, email) => {
    try {
        const response = await transport.sendMail({
            from: `"${sender.name}" <${sender.email}>`,
            to: email,
            subject: "Welcome to our platform",
            html: WELCOME_EMAIL_TEMPLATE.replace("{@user_name@}", name),
            // category: "Welcome Email",
        })
        console.log("Welcome Email sent successfully:", response)
    } catch (error) {
        console.error("Failed to send welcome email", error)
        throw new Error(`Failed to send welcome email: ${error}`)
    }
}


export const sendPasswordResetEmail = async (email, resetURL) => {
    try {
        const response = await transport.sendMail({
            from: `"${sender.name}" <${sender.email}>`,
            to: email,
            subject: "Password Reset Request",
            html: PASSWORD_RESET_REQUEST_TEMPLATE.replace("{@reset_url@}", resetURL),
            // category: "Password Reset",
        })
        console.log("Password Reset Email sent successfully:", response)
    } catch (error) {
        console.error("Failed to send password reset email", error)
        throw new Error(`Failed to send password reset email: ${error}`)
    }
}


export const sendResetPasswordconfirmationEmail = async (email) => {
    try {
        const response = await transport.sendMail({
            from: `"${sender.name}" <${sender.email}>`,
            to: email,
            subject: "Your password has been reset",
            html: PASSWORD_RESET_CONFIRMATION_TEMPLATE,
            // category: "Password Reset Confirmation",
        })
        console.log("Password Reset Confirmation Email sent successfully:", response)
    } catch (error) {
        console.error("Failed to send password reset confirmation email", error)
        throw new Error(`Failed to send password reset confirmation email: ${error}`)
    }
}
