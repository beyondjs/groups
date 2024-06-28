import type { IOrganizationData, IClassroomData } from '@aimpact/ailearn-api/data/interfaces';
import type { IGroupApprove, IApproveResponse } from '@beyond-js/groups/interfaces';
import type { Transaction } from 'firebase-admin/firestore';
import type { User } from '@aimpact/agents-client/users';
import { Response } from '@beyond-js/response/main';
import { ErrorGenerator } from '@beyond-js/groups/errors';
import { db } from '@beyond-js/firestore-collection/db';
import config from '@beyond-js/groups/config';
import { Mailer } from './mail';
import { STATUS } from '@beyond-js/groups/status';

export class Approve {
	static async process(params: IGroupApprove, user: User) {
		try {
			return await db.runTransaction(async (transaction: Transaction) => {
				let error;
				const { id, entity, collection } = params;
				const parents: Record<string, string> = {};
				parents[entity.collectionName] = id;

				// Get group data
				let group: IOrganizationData | IClassroomData;
				({ group, error } = await (async () => {
					const { data, error } = await collection.data({ id, transaction });
					if (error) return { error: error };
					return !data.exists ? { error: data.error } : { group: data.data };
				})());
				if (error) throw new Response({ error });

				// 1. Validate user permissions
				let people;
				({ people, error } = await (async () => {
					const { data, error } = await collection.people.data({ id: user.uid, parents, transaction });
					if (error) return { error };
					if (!data.exists) return { error: ErrorGenerator.userNotAuthorizedOnGroup(params) };
					if (data.data.role !== 'manager') return { error: ErrorGenerator.userNotAuthorizedOnGroup(params) };

					// 1.1 Check if uid exists on People Collection
					const peopleResponse = await collection.people.data({ id: params.uid, parents, transaction });
					if (peopleResponse.error) return { error: peopleResponse.error };
					if (!peopleResponse.data.exists) return { error: peopleResponse.data.error };

					return { people: peopleResponse.data.data };
				})());
				if (error) throw new Response({ error });

				// Authorization already true
				// 2. validate authorized
				if (people.authorized) {
					const approveResponse: IApproveResponse = { approved: true, status: STATUS.already };
					approveResponse[entity.name] = { id, name: group.name };
					return new Response({ data: approveResponse });
				}

				// 3. change authorized true
				people.authorized = true;
				people.role = params.role;
				const peopleSetResponse = await collection.people.set({
					id: params.uid,
					data: people,
					parents,
					transaction
				});
				if (peopleSetResponse.error) throw new Response({ error: peopleSetResponse.error });

				// 4. update people on group Collection
				const items = group.people;
				items.push({ uid: people.uid, name: people.name, photoUrl: people.photoUrl, role: params.role });
				const groupSetResponse = await collection.merge({ id, data: { people: items }, transaction });
				if (groupSetResponse.error) throw new Response({ error: groupSetResponse.error });

				// 5. send Mail Notification
				const { MAIL_TEMPLATES_APPROVE } = process.env;
				if (!MAIL_TEMPLATES_APPROVE) {
					throw new Response({ error: ErrorGenerator.mailTemplatesNotDefined('approve') });
				}
				const specs = {
					name: people.name,
					groupType: entity.name,
					groupName: group.name,
					appUrl: config.params.applicationUrl,
					applicationName: config.params.applicationName,
					actionUrl: `${config.params.applicationUrl}/${entity.name}s/view/${group.id}`
				};

				const tpl = parseInt(MAIL_TEMPLATES_APPROVE);
				const response = await Mailer.send(tpl, people.email, specs);
				if (response.error) throw new Response({ error: ErrorGenerator.mailNotSend() });

				const approveResponse: IApproveResponse = { approved: true, status: STATUS.authorized };
				approveResponse[entity.name] = { id, name: group.name };

				return new Response({ data: approveResponse });
			});
		} catch (exc) {
			const code = `B0010`;
			if (exc instanceof Response) return exc;
			return new Response({ error: ErrorGenerator.internalErrorTrace({ code, exc }) });
		}
	}
}
