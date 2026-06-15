'use client';

type SecurityRuleContext = {
  path: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete' | 'write';
  requestResourceData?: any;
};

// Simplified request object for the error. No auth info.
interface SecurityRuleRequest {
  method: string;
  path: string;
  resource?: {
    data: any;
  };
}

/**
 * Builds a simplified, formatted error message for the LLM.
 * @param requestObject The simplified request object.
 * @returns A string containing the error message and the JSON payload.
 */
function buildErrorMessage(requestObject: SecurityRuleRequest): string {
  return `Missing or insufficient permissions: The following request was denied by Firestore Security Rules:
${JSON.stringify(requestObject, null, 2)}`;
}

/**
 * A custom error class designed to be consumed by an LLM for debugging.
 * It structures the error information to mimic the request object
 * available in Firestore Security Rules, but omits auth details to prevent runtime crashes.
 */
export class FirestorePermissionError extends Error {
  public readonly request: SecurityRuleRequest;

  constructor(context: SecurityRuleContext) {
    const requestObject: SecurityRuleRequest = {
      method: context.operation,
      path: `/databases/(default)/documents/${context.path}`,
      resource: context.requestResourceData ? { data: context.requestResourceData } : undefined,
    };
    super(buildErrorMessage(requestObject));
    this.name = 'FirebaseError';
    this.request = requestObject;
  }
}
