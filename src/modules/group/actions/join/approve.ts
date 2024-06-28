import type { IGroupJoin, IJoinResponse } from '@beyond-js/groups/interfaces';
import type { Transaction } from 'firebase-admin/firestore';
import type { User } from '@aimpact/agents-client/users';
import { Response } from '@beyond-js/response/main';
import { STATUS } from '@beyond-js/groups/status';

import type { IClassroomData, IOrganizationData, RoleType } from '@aimpact/ailearn-api/data/interfaces';

export const approve = async (
	params: IGroupJoin,
	group: IOrganizationData | IClassroomData,
	role: RoleType,
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
		role,
		authorized: true
	};
	const response = await collection.people.set({ id: user.uid, data, parents, transaction });
	if (response.error) throw new Response({ error: response.error });

	const deleted = await collection.people.delete({ id: user.email, parents, transaction });
	if (deleted.error) throw new Response({ error: deleted.error });

	// Update people on Organization document
	const people = group.people;
	people.push({ uid: user.uid, name: user.displayName, photoUrl: user.photoURL, role });

	const responseMerge = await collection.merge({ id: group.id, data: { people }, transaction });
	if (responseMerge.error) throw new Response({ error: responseMerge.error });

	const joinResponse: IJoinResponse = { joined: true, status: STATUS.authorized };
	joinResponse[entity.name] = { id: group.id, name: group.name };

	return new Response({ data: joinResponse });
};
