/**
 * Cal.com V2 API Types (version: 2024-08-13)
 *
 * Types for the Cal.com booking API responses used by the
 * coaching sessions dashboard widget.
 */

export interface CalcomAttendee {
	name: string;
	email: string;
	timeZone: string;
	language?: string;
	absent: boolean;
}

export interface CalcomHost {
	id: number;
	name: string;
	email: string;
	username: string;
	timeZone: string;
}

export interface CalcomEventType {
	id: number;
	slug: string;
}

export type CalcomBookingStatus =
	| "cancelled"
	| "accepted"
	| "rejected"
	| "pending";

export interface CalcomBooking {
	id: number;
	uid: string;
	title: string;
	description: string;
	status: CalcomBookingStatus;
	start: string;
	end: string;
	duration: number;
	eventTypeId: number;
	eventType: CalcomEventType;
	location: string;
	meetingUrl?: string;
	hosts: CalcomHost[];
	attendees: CalcomAttendee[];
	guests?: string[];
	absentHost: boolean;
	createdAt: string;
	updatedAt: string | null;
	metadata?: Record<string, string>;
}

export interface CalcomPaginationMeta {
	totalItems: number;
	remainingItems: number;
	returnedItems: number;
	itemsPerPage: number;
	currentPage: number;
	totalPages: number;
	hasNextPage: boolean;
	hasPreviousPage: boolean;
}

export interface CalcomBookingsResponse {
	status: "success" | "error";
	data: CalcomBooking[];
	pagination: CalcomPaginationMeta;
}

export type CalcomBookingFilterStatus =
	| "upcoming"
	| "recurring"
	| "past"
	| "cancelled"
	| "unconfirmed";
