import type { Transaction } from 'firebase-admin/firestore';
import type { IGroupJoin, IJoinResponse } from '@beyond-js/groups/interfaces';
import type { User } from '@aimpact/agents-client/users';
import { ErrorGenerator } from '@beyond-js/groups/errors';
import { Response } from '@beyond-js/response/main';
import config from '@beyond-js/groups/config';
import { STATUS } from '@beyond-js/groups/status';
import { Mailer } from '../mail';

import type { IClassroomData, IOrganizationData, IPeopleData } from '@aimpact/ailearn-api/data/interfaces';

export const request = async (
	params: IGroupJoin,
	group: IOrganizationData | IClassroomData,
	user: User,
	transaction: Transaction
): Promise<Response<IJoinResponse>> => {
	const { entity, collection } = params;

	const parents: Record<string, string> = {};
	parents[entity.collectionName] = group.id;

	const data = {
		uid: user.uid,
		email: user.email,
		name: user.displayName,
		photoUrl: user.photoURL,
		authorized: false
	};
	const response = await collection.people.set({ id: user.uid, data, parents, transaction });
	if (response.error) throw new Response({ error: response.error });

	//SendMail
	const { MAIL_TEMPLATES_JOIN } = process.env;
	if (!MAIL_TEMPLATES_JOIN) {
		throw new Response({ error: ErrorGenerator.mailTemplatesNotDefined('join') });
	}
	const specs = {
		name: user.displayName,
		groupType: entity.name,
		groupName: group.name,
		appUrl: config.params.applicationUrl,
		applicationName: config.params.applicationName,
		actionUrl: `${config.params.applicationUrl}/${entity.name}s/view/${group.id}`
	};
	const entries = await collection
		.doc({ id: group.id })
		.collection('People')
		.where('notifications', '==', true)
		.get();
	const tpl = parseInt(MAIL_TEMPLATES_JOIN);

	const promises: Promise<any>[] = [];
	entries.docs.map(entry => {
		const people = <IPeopleData>entry.data();
		people.email && promises.push(Mailer.send(tpl, people.email, specs));
	});
	const results = await Promise.all(promises);
	const errors = results.find(result => !!result.error);
	if (errors) throw new Response({ error: ErrorGenerator.mailNotSend() });

	const joinResponse: IJoinResponse = { joined: true, status: STATUS.pending };
	joinResponse[entity.name] = { id: group.id, name: group.name };

	return new Response({ data: joinResponse });
};
