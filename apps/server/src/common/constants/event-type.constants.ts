export const EventType = {
  STAFF_CREATED: 'staff.created',
  STAFF_UPDATED: 'staff.updated',
  INTAKE_SUBMITTED: 'intake.submitted',
  AUDIT_APPROVED: 'audit.approved',
  AUDIT_REJECTED: 'audit.rejected',
  LISTING_STATUS_CHANGED: 'listing.status_changed',
  CREDENTIAL_STATUS_CHANGED: 'credential.status_changed',
  EXTERNAL_EVENT_RECEIVED: 'external.event_received',
} as const;
