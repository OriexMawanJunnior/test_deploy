export function createResponse(message: string, status: number, data?: any) {
	const err = new Error(message) as { status?: number; data?: any, isHttpError?: boolean };
	err.status = status;
	err.data = data;
	err.isHttpError = true;
	throw err;
}

export function isValidUUID(uuid: string) {
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(uuid);
}

