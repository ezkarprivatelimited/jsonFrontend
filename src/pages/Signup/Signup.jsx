import { motion } from "framer-motion";
import { useState } from "react";
import {
	FiBriefcase,
	FiEye,
	FiEyeOff,
	FiFileText,
	FiLock,
	FiMail,
	FiPhone,
	FiUser,
} from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { API_ENDPOINTS } from "../../api/endpoints";

const ROLES = [
	{ value: "trader", label: "Trader", icon: "🛒" },
	{ value: "manufacturer", label: "Manufacturer", icon: "🏭" },
];

const Signup = () => {
	const navigate = useNavigate();
	const [form, setForm] = useState({
		name: "",
		email: "",
		phone: "",
		gstNumber: "",
		role: "",
		password: "",
		confirmPassword: "",
	});
	const [error, setError] = useState("");
	const [success, setSuccess] = useState(false);
	const [loading, setLoading] = useState(false);
	const [showPwd, setShowPwd] = useState(false);
	const [showConfirm, setShowConfirm] = useState(false);

	const set = (field) => (e) =>
		setForm((prev) => ({ ...prev, [field]: e.target.value }));

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError("");
		if (!form.role) return setError("Please select your account type");
		if (!/^\d{10}$/.test(form.phone))
			return setError("Enter a valid 10-digit mobile number");
		if (form.password !== form.confirmPassword)
			return setError("Passwords do not match");
		if (form.password.length < 6)
			return setError("Password must be at least 6 characters");

		setLoading(true);
		try {
			await api.post(API_ENDPOINTS.SIGNUP, {
				name: form.name,
				email: form.email,
				phone: form.phone,
				gstin: form.gstNumber,
				role: form.role,
				password: form.password,
			});
			setSuccess(true);
		} catch (err) {
			setError(
				err.response?.data?.message || "Registration failed. Please try again.",
			);
		} finally {
			setLoading(false);
		}
	};

	if (success) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-slate-50">
				<motion.div
					initial={{ opacity: 0, scale: 0.96 }}
					animate={{ opacity: 1, scale: 1 }}
					className="bg-white border border-slate-200 rounded-xl p-10 max-w-sm w-full text-center shadow-sm">
					<div className="w-14 h-14 bg-green-50 border border-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
						<span className="text-2xl">✓</span>
					</div>
					<h2 className="text-xl font-semibold text-slate-900 mb-2">
						Request Submitted
					</h2>
					<p className="text-slate-500 text-sm mb-6">
						Your account request has been sent. You'll be able to log in once an
						admin approves it.
					</p>
					<button
						onClick={() => navigate("/login")}
						className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2.5 rounded-lg transition-colors">
						Back to Login
					</button>
				</motion.div>
			</div>
		);
	}

	return (
		<div className="min-h-screen flex">
			{/* Left Panel */}
			<div className="hidden lg:flex w-5/12 bg-slate-900 flex-col justify-between p-12 relative overflow-hidden">
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

				{/* Hero */}
				<div className="relative">
					<h1 className="text-3xl font-bold text-white leading-snug mb-4">
						Effortless JSON Management
					</h1>
					<p className="text-slate-400 text-sm leading-relaxed mb-8">
						Upload, edit, and export JSON files with a clean professional
						interface. No code required.
					</p>
					<div className="space-y-3">
						{[
							"Smart data visualization",
							"One-click field editing",
							"Production-ready exports",
						].map((f, i) => (
							<motion.div
								key={i}
								initial={{ opacity: 0, x: -12 }}
								animate={{ opacity: 1, x: 0 }}
								transition={{ delay: 0.3 + i * 0.1 }}
								className="flex items-center gap-3">
								<div className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
								<span className="text-slate-300 text-sm">{f}</span>
							</motion.div>
						))}
					</div>
				</div>

				<div className="relative text-slate-600 text-xs">
					© 2026 Ezkar Pvt Ltd
				</div>
			</div>

			{/* Right Panel */}
			<div className="flex-1 bg-white overflow-y-auto">
				<div className="min-h-full flex items-center justify-center p-8">
					<motion.div
						initial={{ opacity: 0, y: 12 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.4 }}
						className="w-full max-w-md py-4">
						{/* Mobile Logo */}
						<div className="flex items-center gap-2 mb-7 lg:hidden">
							<div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
								<FiFileText size={15} className="text-white" />
							</div>
							<span className="text-slate-800 font-semibold">Ezkar</span>
						</div>

						<div className="mb-7">
							<h2 className="text-2xl font-semibold text-slate-900 mb-1.5">
								Create an account
							</h2>
							<p className="text-slate-500 text-sm">
								Submit a request — admin will approve your access.
							</p>
						</div>

						{error && (
							<div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-lg mb-5">
								{error}
							</div>
						)}

						<form onSubmit={handleSubmit} className="space-y-4">
							{/* Role */}
							<div>
								<label className="block text-sm font-medium text-slate-700 mb-2">
									Account type
								</label>
								<div className="grid grid-cols-2 gap-3">
									{ROLES.map((r) => (
										<button
											key={r.value}
											type="button"
											onClick={() => setForm((p) => ({ ...p, role: r.value }))}
											className={`flex items-center gap-2.5 px-4 py-3 rounded-lg border text-sm transition-all ${
												form.role === r.value
													? "border-blue-500 bg-blue-50 text-blue-700"
													: "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
											}`}>
											<span className="text-lg">{r.icon}</span>
											<span className="font-medium">{r.label}</span>
										</button>
									))}
								</div>
							</div>

							{/* Name + Phone */}
							<div className="grid grid-cols-2 gap-3">
								<div>
									<label className="block text-sm font-medium text-slate-700 mb-1.5">
										Full name
									</label>
									<div className="relative">
										<FiUser
											size={15}
											className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
										/>
										<input
											type="text"
											required
											value={form.name}
											onChange={set("name")}
											placeholder="John Doe"
											className="w-full pl-9 pr-3 py-2.5 text-sm text-slate-900 border border-slate-200 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all placeholder:text-slate-400"
										/>
									</div>
								</div>
								<div>
									<label className="block text-sm font-medium text-slate-700 mb-1.5">
										Mobile
									</label>
									<div className="relative">
										<FiPhone
											size={15}
											className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
										/>
										<input
											type="tel"
											required
											value={form.phone}
											onChange={(e) => {
												const v = e.target.value
													.replace(/\D/g, "")
													.slice(0, 10);
												setForm((p) => ({ ...p, phone: v }));
											}}
											placeholder="9876543210"
											className="w-full pl-9 pr-3 py-2.5 text-sm text-slate-900 border border-slate-200 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all placeholder:text-slate-400"
										/>
									</div>
								</div>
							</div>

							{/* Email */}
							<div>
								<label className="block text-sm font-medium text-slate-700 mb-1.5">
									Email address
								</label>
								<div className="relative">
									<FiMail
										size={15}
										className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
									/>
									<input
										type="email"
										required
										value={form.email}
										onChange={set("email")}
										placeholder="you@company.com"
										className="w-full pl-9 pr-3 py-2.5 text-sm text-slate-900 border border-slate-200 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all placeholder:text-slate-400"
									/>
								</div>
							</div>

							{/* GSTIN */}
							<div>
								<label className="block text-sm font-medium text-slate-700 mb-1.5">
									GSTIN
								</label>
								<div className="relative">
									<FiBriefcase
										size={15}
										className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
									/>
									<input
										type="text"
										required
										value={form.gstNumber}
										onChange={set("gstNumber")}
										placeholder="22AAAAA0000A1Z5"
										maxLength={15}
										className="w-full pl-9 pr-3 py-2.5 text-sm text-slate-900 border border-slate-200 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all placeholder:text-slate-400 uppercase"
									/>
								</div>
							</div>

							{/* Passwords */}
							<div className="grid grid-cols-2 gap-3">
								<div>
									<label className="block text-sm font-medium text-slate-700 mb-1.5">
										Password
									</label>
									<div className="relative">
										<FiLock
											size={15}
											className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
										/>
										<input
											type={showPwd ? "text" : "password"}
											required
											value={form.password}
											onChange={set("password")}
											placeholder="••••••••"
											className="w-full pl-9 pr-9 py-2.5 text-sm text-slate-900 border border-slate-200 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all placeholder:text-slate-400"
										/>
										<button
											type="button"
											onClick={() => setShowPwd((v) => !v)}
											className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
											{showPwd ? <FiEyeOff size={15} /> : <FiEye size={15} />}
										</button>
									</div>
								</div>
								<div>
									<label className="block text-sm font-medium text-slate-700 mb-1.5">
										Confirm
									</label>
									<div className="relative">
										<FiLock
											size={15}
											className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
										/>
										<input
											type={showConfirm ? "text" : "password"}
											required
											value={form.confirmPassword}
											onChange={set("confirmPassword")}
											placeholder="••••••••"
											className="w-full pl-9 pr-9 py-2.5 text-sm text-slate-900 border border-slate-200 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all placeholder:text-slate-400"
										/>
										<button
											type="button"
											onClick={() => setShowConfirm((v) => !v)}
											className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
											{showConfirm ? (
												<FiEyeOff size={15} />
											) : (
												<FiEye size={15} />
											)}
										</button>
									</div>
								</div>
							</div>

							<button
								type="submit"
								disabled={loading}
								className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 mt-1">
								{loading ? (
									<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
								) : (
									"Submit Request"
								)}
							</button>
						</form>

						<p className="text-center text-sm text-slate-500 mt-6">
							Already have an account?{" "}
							<Link
								to="/login"
								className="text-blue-600 hover:text-blue-700 font-medium">
								Sign in
							</Link>
						</p>
					</motion.div>
				</div>
			</div>
		</div>
	);
};

export default Signup;
