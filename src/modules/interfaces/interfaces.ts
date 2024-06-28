import type { Organizations, Classrooms } from '@aimpact/ailearn-api/data/model';
import type { RoleType } from '@aimpact/ailearn-api/data/interfaces';

export interface IGroupBase {
	entity: { name: 'organization' | 'classroom'; collectionName: 'Organizations' | 'Classrooms' };
	collection: Organizations | Classrooms;
}
export interface IGroupInvite extends IGroupBase {
	id: string;
	email: string;
	name: string;
	role: RoleType;
}
export interface IGroupJoin extends IGroupBase {
	code: string;
}
export interface IGroupApprove extends IGroupBase {
	uid: string;
	role: RoleType;
	id: string;
}
export interface IResponseBase {
	classroom?: { id: string; name: string };
	organization?: { id: string; name: string };
	status: string;
}
export interface IJoinResponse extends IResponseBase {
	joined: boolean;
}
export interface IInviteResponse extends IResponseBase {
	invited: boolean;
}
export interface IApproveResponse extends IResponseBase {
	approved: boolean;
}
