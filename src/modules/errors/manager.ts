import { ErrorManager } from '@beyond-js/response/main';

export /*bundle*/ class BusinessErrorManager extends ErrorManager {
	get is(): '@beyond-js/groups/error' {
		return '@beyond-js/groups/error';
	}
}
