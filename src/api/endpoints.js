const BASE = "/api/v1";

export const API_ENDPOINTS = {
	LOGIN: `${BASE}/auth/login`,
	LOGOUT: `${BASE}/auth/logout`,
	ME: `${BASE}/auth/me`,
	FILE_PATH: `${BASE}/file`,
	FILE_UPLOAD: `${BASE}/file`,
	USERS: `${BASE}/user`,
	USER_STATUS: (id) => `${BASE}/user/${id}`,
	SIGNUP: `${BASE}/user`,
};
