import { ErrorCodes } from './codes';
import { BusinessErrorManager } from './manager';

export /*bundle*/ class ErrorGenerator {
	static internalServerError(exc: Error) {
		return new BusinessErrorManager(ErrorCodes.internalServerError, `Internal server error`, exc);
	}

	static internalErrorTrace(specs?: { code?: string; message?: string; exc?: Error }) {
		const { code, message, exc } = specs;
		return new BusinessErrorManager(
			ErrorCodes.internalServerError,
			`Internal server error ${code ? `[${code}]` : ''} ${message ? `: ${message}` : ''}`,
			exc
		);
	}

	static userNotAuthorizedOnGroup(group: { entity: { name: string }; id: string }) {
		return new BusinessErrorManager(
			ErrorCodes.userNotAuthorizedOnGroup,
			`User not authorized on ${group.entity.name} "${group.id}".`
		);
	}

	static joinWaitingToConfirm(email: string) {
		return new BusinessErrorManager(
			ErrorCodes.joinWaitingToConfirm,
			`The join request of user "${email}" is waiting to be confirmed.`
		);
	}

	static invitationAlreadyExists(email: string, entity: string, id: string) {
		return new BusinessErrorManager(
			ErrorCodes.invitationAlreadyExists,
			`There is already an invitation for "${email}" in the ${entity} "${id}".`
		);
	}

	static userAlreadyExistOnGroup(email: string, entity: string) {
		return new BusinessErrorManager(
			ErrorCodes.userAlreadyExistOnGroup,
			`User "${email}" is already authorized in the ${entity}.`
		);
	}

	static mailTemplatesNotDefined(template: string) {
		return new BusinessErrorManager(
			ErrorCodes.mailTemplatesNotDefined,
			`Could not send email to user. "${template}" not defined`
		);
	}

	static mailNotSend() {
		return new BusinessErrorManager(ErrorCodes.mailNotSend, `Could not send email to user.`);
	}

	static invitationNotValid(email: string, entity: string) {
		return new BusinessErrorManager(
			ErrorCodes.invitationNotValid,
			`The "${email}" invitation in the ${entity} is inactive.`
		);
	}

	static codeNotFound(code: string, entity: string) {
		return new BusinessErrorManager(
			ErrorCodes.codeNotFound,
			`Code "${code}" not valid for ${entity}. Please check the code and try again.`
		);
	}
}
