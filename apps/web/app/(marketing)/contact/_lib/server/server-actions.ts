"use server";

import { getMailer } from "@kit/mailers";
import { getSenderEmail, validateEmailForSending } from "@kit/mailers-shared";
import { enhanceAction } from "@kit/next/actions";
import { z } from "zod";

import { ContactEmailSchema } from "../contact-email.schema";

const contactEmail = z
	.string()
	.describe("The email where you want to receive the contact form submissions.")
	.parse(process.env.CONTACT_EMAIL);

const emailFrom = getSenderEmail();

export const sendContactEmail = enhanceAction(
	async (data) => {
		// Validate sender email before attempting to send
		const emailValidation = validateEmailForSending(data.email);
		if (!emailValidation.isValid) {
			throw new Error(`Invalid email address: ${emailValidation.error}`);
		}

		// Skip sending in test environment
		if (!emailValidation.shouldSend) {
			return {};
		}

		const mailer = await getMailer();

		await mailer.sendEmail({
			to: contactEmail,
			from: emailFrom,
			subject: "Contact Form Submission",
			html: `
        <p>
          You have received a new contact form submission.
        </p>

        <p>Name: ${data.name}</p>
        <p>Email: ${data.email}</p>
        <p>Message: ${data.message}</p>
      `,
		});

		return {};
	},
	{
		schema: ContactEmailSchema,
		auth: false,
	},
);
