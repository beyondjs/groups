import * as postmark from 'postmark';
import * as dotenv from 'dotenv';

dotenv.config();
const { MAIL_TOKEN, MAIL_SENDER } = process.env;

export /*bundle*/ abstract class Mailer {
	static async send(templateId: number, email: string, specs: object) {
		const client = new postmark.ServerClient(MAIL_TOKEN);
		const { ErrorCode, MessageID } = await client.sendEmailWithTemplate(
			{
				From: MAIL_SENDER,
				To: email,
				TemplateId: templateId,
				TemplateModel: specs,
				MessageStream: 'outbound'
			},
			function (error, result) {
				return error ? { error } : { result };
			}
		);

		return { error: ErrorCode ?? void 0 };
	}
}
