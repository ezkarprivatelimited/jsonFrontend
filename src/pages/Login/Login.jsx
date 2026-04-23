import { motion } from "framer-motion";
import React, { useState } from "react";
import {
	FiEye,
	FiEyeOff,
	FiLayers,
	FiLock,
	FiLogIn,
	FiMail,
} from "react-icons/fi";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

const Login = () => {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [showPassword, setShowPassword] = useState(false);

	const { login, user } = useAuth();
	const navigate = useNavigate();
	const location = useLocation();

	const from = location.state?.from?.pathname || "/";

	// If user is already logged in, redirect them immediately
	React.useEffect(() => {
		if (user) {
			navigate(from, { replace: true });
		}
	}, [user, navigate, from]);

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError("");
		setIsLoading(true);

		try {
			const result = await login(email, password);
			if (result.success) {
				navigate(from, { replace: true });
			} else {
				setError(result.error || "Invalid credentials");
			}
		} catch (err) {
			setError("An error occurred during login");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-zinc-50 p-6 relative font-sans antialiased">
			<motion.div
				initial={{ opacity: 0, scale: 0.98 }}
				animate={{ opacity: 1, scale: 1 }}
				transition={{ duration: 0.4, ease: "easeOut" }}
				className="w-full max-w-md bg-white border border-zinc-200 p-8 rounded-2xl shadow-sm z-10">
				<div className="text-center mb-8">
					<div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-100">
						<FiLayers className="text-xl text-white" />
					</div>
					<h2 className="text-xl font-bold text-zinc-900 tracking-tight">
						Sign in to your account
					</h2>
					<p className="text-sm text-zinc-500 mt-1">
						Enter your credentials to access the platform
					</p>
				</div>

				{error && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						className="bg-rose-50 border border-rose-100 text-rose-600 p-3 rounded-lg text-xs mb-6 text-center font-semibold">
						{error}
					</motion.div>
				)}

				<form onSubmit={handleSubmit} className="space-y-5">
					<div className="space-y-1.5">
						<label className="text-xs font-semibold text-zinc-700 ml-1">
							Email address
						</label>
						<div className="relative group">
							<div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400 group-focus-within:text-indigo-600 transition-colors">
								<FiMail size={18} />
							</div>
							<input
								type="email"
								required
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								className="w-full bg-white border border-zinc-200 text-zinc-900 rounded-xl py-2.5 pl-10 pr-4 focus:outline-none focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600/30 transition-all text-sm placeholder:text-zinc-400"
								placeholder="name@company.com"
							/>
						</div>
					</div>

					<div className="space-y-1.5">
						<label className="text-xs font-semibold text-zinc-700 ml-1">
							Password
						</label>
						<div className="relative group">
							<div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400 group-focus-within:text-indigo-600 transition-colors">
								<FiLock size={18} />
							</div>
							<input
								type={showPassword ? "text" : "password"}
								required
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								className="w-full bg-white border border-zinc-200 text-zinc-900 rounded-xl py-2.5 pl-10 pr-10 focus:outline-none focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600/30 transition-all text-sm placeholder:text-zinc-400"
								placeholder="••••••••"
							/>
							<button
								type="button"
								onClick={() => setShowPassword((v) => !v)}
								className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-400 hover:text-indigo-600 transition-colors">
								{showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
							</button>
						</div>
					</div>

					<div className="flex items-center justify-between text-xs py-1">
						{/* <label className="flex items-center space-x-2 cursor-pointer group">
							<input
								type="checkbox"
								className="w-4 h-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
							/>
							<span className="text-zinc-500 group-hover:text-zinc-900 transition-colors">
								Remember me
							</span>
						</label> */}
						{/* <a
							href="#"
							className="text-indigo-600 hover:text-indigo-700 font-semibold transition-colors">
							Forgot password?
						</a> */}
					</div>

					<button
						type="submit"
						disabled={isLoading}
						className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-semibold py-3 rounded-xl transition-all shadow-sm active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 mt-2">
						{isLoading ? (
							<div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
						) : (
							<>
								<span>Sign in</span>
								<FiLogIn className="text-lg" />
							</>
						)}
					</button>
				</form>

				<p className="text-center text-xs text-zinc-400 mt-6">
					Don't have an account?{" "}
					<Link
						to="/signup"
						className="text-indigo-600 font-semibold hover:text-indigo-700">
						Request access
					</Link>
				</p>
			</motion.div>
		</div>
	);
};

export default Login;
