import type { IGroupBase, IGroupJoin, IGroupInvite, IGroupApprove } from '@beyond-js/groups/interfaces';
import type { IOrganizationData, IClassroomData, IPeopleData, IPeopleBase } from '@aimpact/ailearn-api/data/interfaces';
import type { User } from '@aimpact/agents-client/users';
import * as dotenv from 'dotenv';
import { Join } from './actions/join';
import { Invite } from './actions/invite';
import { Approve } from './actions/approve';
import { ErrorGenerator } from '@beyond-js/groups/errors';
import { Response } from '@beyond-js/response/main';

dotenv.config();

export /*bundle*/ abstract class Group {
	static async join(params: IGroupJoin, user: User) {
		return Join.process(params, user);
	}

	static async invite(params: IGroupInvite, user: User) {
		return Invite.process(params, user);
	}

	static async approve(params: IGroupApprove, user: User) {
		return Approve.process(params, user);
	}

	static async getPeople(
		params: IGroupBase,
		group: IOrganizationData | IClassroomData,
		user: User
	): Promise<Response<IPeopleData[] | IPeopleBase[]>> {
		const { entity, collection } = params;

		const parents: Record<string, string> = {};
		parents[entity.collectionName] = group.id;

		// 1. Validate permissions for return people
		const response = await collection.people.data({ id: user.uid, parents });
		if (response.error) return new Response({ error: response.error });

		// User not exists on group
		if (!response.data.exists) {
			return new Response({
				error: ErrorGenerator.userNotAuthorizedOnGroup({ entity: { name: group.name }, id: group.id })
			});
		}

		// 2. Check user is a manager of the group
		if (response.data.data.role !== 'manager') return new Response({ data: group.people });

		// 3. Read and return all the docs of the group's 'People' subcollection
		const entries = await collection.doc({ id: group.id }).collection('People').get();
		const people: IPeopleData[] = entries.docs.map(entry => <IPeopleData>entry.data());

		return new Response({ data: people });
	}

	static async removeMember(classroom: string, uid: string, member: string) {
		// 1. Avoid to remove the same member
	}

	static async removeInvitation(classroom: string, uid: string, email: string) {}
}
