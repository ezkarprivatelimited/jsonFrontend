import { createContext, useContext, useEffect, useMemo, useState } from "react";
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

	const fetchUserProfile = async () => {
		try {
			const response = await api.get(API_ENDPOINTS.ME);
			const userData = response.data.user || response.data.data || response.data;
			setUser(userData);
			localStorage.setItem("user", JSON.stringify(userData));
		} catch (err) {
			console.error("Profile fetch error:", err);
			if (err.response?.status === 401) {
				setUser(null);
				localStorage.removeItem("user");
				sessionStorage.removeItem("user");
			}
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		const storedUser = localStorage.getItem("user") || sessionStorage.getItem("user");
		if (storedUser) {
			try {
				setUser(JSON.parse(storedUser));
			} catch (e) {
				console.error("Error parsing stored user", e);
			}
		}
		fetchUserProfile();
	}, []);

	const login = async (email, password, rememberMe = false) => {
		try {
			const response = await api.post(API_ENDPOINTS.LOGIN, {
				email,
				password,
				rememberMe,
			});

			const { user: userData, success } = response.data;

			if (success || userData) {
				// The backend sets the HttpOnly cookie automatically here.
				// We only need to manage the user profile state.
				const storage = rememberMe ? localStorage : sessionStorage;
				
				if (userData) {
					storage.setItem("user", JSON.stringify(userData));
					setUser(userData);
				}

				await fetchUserProfile();
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

	const logout = async () => {
		try {
			await api.post(API_ENDPOINTS.LOGOUT);
		} catch (err) {
			console.error("Logout error:", err);
		} finally {
			localStorage.removeItem("user");
			sessionStorage.removeItem("user");
			setUser(null);
		}
	};

	const value = useMemo(
		() => ({
			user,
			loading,
			login,
			logout,
			refreshUser: fetchUserProfile,
		}),
		[user, loading],
	);

	return (
		<AuthContext.Provider value={value}>
			{!loading && children}
		</AuthContext.Provider>
	);
};
