import { motion } from "framer-motion";
import React, { useState } from "react";
import { FiEye, FiEyeOff, FiFileText, FiLock, FiMail } from "react-icons/fi";
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

	React.useEffect(() => {
		if (user) navigate(from, { replace: true });
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
		} catch {
			setError("An error occurred during login");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="min-h-screen flex">
			{/* Left Panel */}
			<div className="hidden lg:flex w-1/2 bg-slate-900 flex-col justify-between p-12 relative overflow-hidden">
				<div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-transparent to-indigo-800/30" />
				<div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
				<div className="absolute -bottom-40 -left-20 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl" />

				{/* Logo */}
				<div className="relative flex items-center gap-3">
					<div className="w-9 h-9 bg-blue-500 rounded-lg flex items-center justify-center">
						<img
							src="./icon.ico"
							alt="Icon"
							className="w-full h-full object-contain"
						/>
					</div>
					<span className="text-white text-lg font-semibold">
						Ezkar Private Limited
					</span>
				</div>

				{/* Hero Content */}
				<div className="relative">
					<h1 className="text-4xl font-bold text-white leading-tight mb-4">
						The smarter way to
						<span className="text-blue-400 ml-1.5">manage JSON files.</span>
					</h1>
					<p className="text-slate-400 text-base leading-relaxed mb-10">
						Upload, edit, and export your JSON data through a clean, powerful
						interface. No code required.
					</p>
					<div className="space-y-4">
						{[
							{ label: "Upload JSON files instantly" },
							{ label: "Edit fields with precision" },
							{ label: "Download modified files" },
						].map((item, i) => (
							<motion.div
								key={i}
								initial={{ opacity: 0, x: -16 }}
								animate={{ opacity: 1, x: 0 }}
								transition={{ delay: 0.3 + i * 0.1 }}
								className="flex items-center gap-3">
								<div className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
								<span className="text-slate-300 text-sm">{item.label}</span>
							</motion.div>
						))}
					</div>
				</div>

				{/* Footer */}
				<div className="relative text-slate-600 text-xs">
					© 2026 Ezkar Pvt Ltd
				</div>
			</div>

			{/* Right Panel */}
			<div className="flex-1 flex items-center justify-center bg-white p-8">
				<motion.div
					initial={{ opacity: 0, y: 12 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.4 }}
					className="w-full max-w-sm">
					{/* Mobile Logo */}
					<div className="flex items-center gap-2 mb-8 lg:hidden">
						<div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
							<FiFileText size={15} className="text-white" />
						</div>
						<span className="text-slate-800 font-semibold">Ezkar</span>
					</div>

					<div className="mb-8">
						<h2 className="text-2xl font-semibold text-slate-900 mb-1.5">
							Welcome back
						</h2>
						<p className="text-slate-500 text-sm">
							Sign in to your account to continue.
						</p>
					</div>

					{error && (
						<div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-lg mb-6">
							{error}
						</div>
					)}

					<form onSubmit={handleSubmit} className="space-y-4">
						<div>
							<label className="block text-sm font-medium text-slate-700 mb-1.5">
								Email address
							</label>
							<div className="relative">
								<FiMail
									size={16}
									className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
								/>
								<input
									type="email"
									required
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									placeholder="you@company.com"
									className="w-full pl-10 pr-4 py-2.5 text-sm text-slate-900 bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all placeholder:text-slate-400"
								/>
							</div>
						</div>

						<div>
							<label className="block text-sm font-medium text-slate-700 mb-1.5">
								Password
							</label>
							<div className="relative">
								<FiLock
									size={16}
									className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
								/>
								<input
									type={showPassword ? "text" : "password"}
									required
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									placeholder="••••••••"
									className="w-full pl-10 pr-10 py-2.5 text-sm text-slate-900 bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all placeholder:text-slate-400"
								/>
								<button
									type="button"
									onClick={() => setShowPassword((v) => !v)}
									className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
									{showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
								</button>
							</div>
						</div>

						<button
							type="submit"
							disabled={isLoading}
							className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 mt-2">
							{isLoading ? (
								<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
							) : (
								"Sign in"
							)}
						</button>
					</form>

					<p className="text-center text-sm text-slate-500 mt-6">
						Don't have an account?{" "}
						<Link
							to="/signup"
							className="text-blue-600 hover:text-blue-700 font-medium">
							Request access
						</Link>
					</p>
				</motion.div>
			</div>
		</div>
	);
};

export default Login;
