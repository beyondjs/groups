import type { IGroupInvite, IInviteResponse } from '@beyond-js/groups/interfaces';
import type { Transaction } from 'firebase-admin/firestore';
import type { User } from '@aimpact/agents-client/users';
import { Response } from '@beyond-js/response/main';
import { ErrorGenerator } from '@beyond-js/groups/errors';
import { db } from '@beyond-js/firestore-collection/db';
import config from '@beyond-js/groups/config';
import { STATUS } from '@beyond-js/groups/status';
import { Mailer } from './mail';

export class Invite {
	static async process(params: IGroupInvite, user: User) {
		// 1. Look for the user (uid)
		// 2. Check user is a teacher, otherwise return with an error
		// 3. Regiter the user in the People's subcollection
		// 4. Send the invited an email
		try {
			return await db.runTransaction(async (transaction: Transaction) => {
				const { id, entity, collection, name, role } = params;
				const email = params.email.toLocaleLowerCase();

				const response = await collection.data({ id, transaction });
				if (response.error) throw new Response({ error: response.error });
				if (!response.data.exists) throw new Response({ error: response.data.error });
				const groupData = response.data.data;

				const parents: Record<string, string> = {};
				parents[entity.collectionName] = id;
				const managerCheck = await collection.people.data({ id: user.uid, parents, transaction });
				if (managerCheck.error) throw new Response({ error: managerCheck.error });
				if (!managerCheck.data.exists)
					throw new Response({ error: ErrorGenerator.userNotAuthorizedOnGroup(params) });
				if (managerCheck.data.data.role !== 'manager')
					throw new Response({ error: ErrorGenerator.userNotAuthorizedOnGroup(params) });

				const peopleResponse = await collection.people.data({ id: email, parents, transaction });
				if (peopleResponse.error) throw new Response({ error: peopleResponse.error });
				if (peopleResponse.data.exists) {
					if (peopleResponse.data.data.authorized) {
						throw new Response({
							error: ErrorGenerator.userAlreadyExistOnGroup(email, params.entity.name)
						});
					}
					throw new Response({
						error: ErrorGenerator.invitationAlreadyExists(email, params.entity.name, params.id)
					});
				}

				const data = { email, name, role, invited: true };
				const peopleSet = await collection.people.set({ id: email, parents, data, transaction });
				if (peopleSet.error) throw new Response({ error: peopleSet.error });

				// send mail
				const specs = {
					name,
					groupType: entity.name,
					groupName: groupData.name,
					code: groupData.joinSpecs.code,
					appUrl: config.params.applicationUrl,
					actionUrl: `${config.params.applicationUrl}/${entity.name}s/join?code=${groupData.joinSpecs.code}`
				};

				const { MAIL_TEMPLATES_INVITE } = process.env;
				if (!MAIL_TEMPLATES_INVITE) {
					throw new Response({ error: ErrorGenerator.mailTemplatesNotDefined('invite') });
				}
				const tpl = parseInt(MAIL_TEMPLATES_INVITE);
				const { error } = await Mailer.send(tpl, email, specs);
				if (error) throw new Response({ error: ErrorGenerator.mailNotSend() });

				const inviteResponse: IInviteResponse = { invited: true, status: STATUS.invited };
				inviteResponse[entity.name] = { id, name: groupData.name };

				return new Response({ data: inviteResponse });
			});
		} catch (exc) {
			const code = `B0014`;
			if (exc instanceof Response) return exc;
			return new Response({ error: ErrorGenerator.internalErrorTrace({ code, exc }) });
		}
	}
}
