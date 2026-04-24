import {
	createContext,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import api from "../api/axios";
import { API_ENDPOINTS } from "../api/endpoints";

const AuthContext = createContext();

export const useAuth = () => {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return context;
};

export const AuthProvider = ({ children }) => {
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);
	const isFetching = useRef(false);

	const fetchUserProfile = async (force = false) => {
		// If already in-flight, skip
		if (isFetching.current) return;

		// If not forced and already have a user, skip
		if (!force && user) return;

		try {
			isFetching.current = true;
			const response = await api.get(API_ENDPOINTS.ME);
			const userData =
				response.data.user || response.data.data || response.data;
			setUser(userData);
		} catch (err) {
			console.error("Profile fetch error:", err);
			// Only log out on the initial auth check (not forced).
			// A forced refresh failing (e.g. backend restart) should NOT
			// clear an already-authenticated user.
			if (!force) {
				setUser(null);
			}
		} finally {
			isFetching.current = false;
			setLoading(false);
		}
	};

	// Always fetch from API on mount — no localStorage
	useEffect(() => {
		fetchUserProfile();
	}, []);

	const login = async (email, password, rememberMe = false) => {
		try {
			const response = await api.post(API_ENDPOINTS.LOGIN, {
				email,
				password,
				rememberMe,
			});

			const { success, user: userData } = response.data;

			if (success || userData) {
				// Always fetch full profile from /me to get files and latest data
				await fetchUserProfile(true);
				return { success: true };
			}
			return { success: false, error: "Authentication failed" };
		} catch (err) {
			console.error("Login error:", err);
			return {
				success: false,
				error: err.response?.data?.message || "Invalid credentials",
			};
		}
	};

	const logout = () => {
		// Clear user state immediately (synchronous) so the login page
		// never sees a logged-in user and redirects back
		setUser(null);

		// Fire-and-forget the server-side session invalidation
		api.post(API_ENDPOINTS.LOGOUT).catch((err) =>
			console.error("Logout API error:", err),
		);
	};

	const refreshUser = async () => {
		await fetchUserProfile(true);
	};

	const value = useMemo(
		() => ({
			user,
			loading,
			login,
			logout,
			refreshUser,
		}),
		[user, loading],
	);

	return (
		<AuthContext.Provider value={value}>
			{!loading && children}
		</AuthContext.Provider>
	);
};
