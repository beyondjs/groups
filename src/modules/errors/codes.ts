export /*bundle*/ enum ErrorCodes {
	internalServerError = 500,
	userNotAuthorizedOnGroup = 403,
	userAlreadyExistOnGroup = 300,
	invitationAlreadyExists,
	joinWaitingToConfirm,
	invitationNotValid,
	mailTemplatesNotDefined,
	mailNotSend,
	codeNotFound
}
