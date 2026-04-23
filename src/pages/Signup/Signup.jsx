import { motion } from "framer-motion";
import { useState } from "react";
import {
	FiBriefcase,
	FiCheckCircle,
	FiEye,
	FiEyeOff,
	FiLayers,
	FiLock,
	FiMail,
	FiPhone,
	FiUser,
	FiUserPlus,
} from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { API_ENDPOINTS } from "../../api/endpoints";

const ROLE_OPTIONS = [
	{
		value: "trader",
		label: "Trader",
		desc: "I buy and sell goods",
		icon: "🛒",
	},
	{
		value: "manufacturer",
		label: "Manufacturer",
		desc: "I manufacture goods",
		icon: "🏭",
	},
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

	const set = (field) => (e) =>
		setForm((prev) => ({ ...prev, [field]: e.target.value }));

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError("");

		if (!form.role) {
			setError("Please select your account type");
			return;
		}
		if (!/^\d{10}$/.test(form.phone)) {
			setError("Enter a valid 10-digit mobile number");
			return;
		}
		if (form.password !== form.confirmPassword) {
			setError("Passwords do not match");
			return;
		}
		if (form.password.length < 6) {
			setError("Password must be at least 6 characters");
			return;
		}

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
			<div className="min-h-screen flex items-center justify-center bg-zinc-50 p-6 font-sans antialiased">
				<motion.div
					initial={{ opacity: 0, scale: 0.95 }}
					animate={{ opacity: 1, scale: 1 }}
					className="w-full max-w-md bg-white border border-zinc-200 p-10 rounded-2xl shadow-sm text-center">
					<div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
						<FiCheckCircle className="text-green-600 text-3xl" />
					</div>
					<h2 className="text-xl font-bold text-zinc-900 mb-2">
						Request Submitted!
					</h2>
					<p className="text-sm text-zinc-500 mb-6">
						Your account request has been sent to the admin for approval. You'll
						be able to log in once it's approved.
					</p>
					<button
						onClick={() => navigate("/login")}
						className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-semibold py-3 rounded-xl transition-all text-sm">
						Back to Login
					</button>
				</motion.div>
			</div>
		);
	}

	return (
		<div className="min-h-screen flex items-center justify-center bg-zinc-50 p-6 font-sans antialiased">
			<motion.div
				initial={{ opacity: 0, scale: 0.98 }}
				animate={{ opacity: 1, scale: 1 }}
				transition={{ duration: 0.4, ease: "easeOut" }}
				className="w-full max-w-lg bg-white border border-zinc-200 p-8 rounded-2xl shadow-sm">
				{/* Header */}
				<div className="text-center mb-8">
					<div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-100">
						<FiLayers className="text-xl text-white" />
					</div>
					<h2 className="text-xl font-bold text-zinc-900 tracking-tight">
						Create an account
					</h2>
					<p className="text-sm text-zinc-500 mt-1">
						Submit a request — admin will approve your access
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
					{/* Account Type */}
					<div className="space-y-2">
						<label className="text-xs font-semibold text-zinc-700 ml-1">
							Who are you? *
						</label>
						<div className="grid grid-cols-2 gap-3">
							{ROLE_OPTIONS.map((opt) => (
								<button
									key={opt.value}
									type="button"
									onClick={() =>
										setForm((prev) => ({ ...prev, role: opt.value }))
									}
									className={`flex flex-col items-center gap-1.5 p-4 rounded-xl border-2 transition-all text-sm font-bold ${
										form.role === opt.value
											? "border-indigo-600 bg-indigo-50 text-indigo-700"
											: "border-zinc-200 text-zinc-500 hover:border-zinc-300 hover:bg-zinc-50"
									}`}>
									<span className="text-2xl">{opt.icon}</span>
									<span>{opt.label}</span>
									<span className="text-[10px] font-normal text-zinc-400">
										{opt.desc}
									</span>
								</button>
							))}
						</div>
					</div>

					{/* Name + Phone */}
					<div className="grid grid-cols-2 gap-4">
						<Field
							label="Full Name"
							icon={<FiUser size={16} />}
							type="text"
							placeholder="John Doe"
							value={form.name}
							onChange={set("name")}
							required
						/>
						<Field
							label="Phone Number"
							icon={<FiPhone size={16} />}
							type="tel"
							placeholder="10-digit mobile number"
							value={form.phone}
							onChange={(e) => {
								const val = e.target.value.replace(/\D/g, "").slice(0, 10);
								setForm((prev) => ({ ...prev, phone: val }));
							}}
							required
						/>
					</div>

					{/* Email */}
					<Field
						label="Email Address"
						icon={<FiMail size={16} />}
						type="email"
						placeholder="name@company.com"
						value={form.email}
						onChange={set("email")}
						required
					/>

					{/* GST Number */}
					<Field
						label="GST Number"
						icon={<FiBriefcase size={16} />}
						type="text"
						placeholder="22AAAAA0000A1Z5"
						value={form.gstNumber}
						onChange={set("gstNumber")}
						required
						maxLength={15}
						style={{ textTransform: "uppercase" }}
					/>

					{/* Password + Confirm */}
					<div className="grid grid-cols-2 gap-4">
						<PasswordField
							label="Password"
							placeholder="••••••••"
							value={form.password}
							onChange={set("password")}
							required
						/>
						<PasswordField
							label="Confirm Password"
							placeholder="••••••••"
							value={form.confirmPassword}
							onChange={set("confirmPassword")}
							required
						/>
					</div>

					<button
						type="submit"
						disabled={loading}
						className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-semibold py-3 rounded-xl transition-all shadow-sm active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2">
						{loading ? (
							<div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
						) : (
							<>
								<span>Submit Request</span>
								<FiUserPlus />
							</>
						)}
					</button>
				</form>

				<p className="text-center text-xs text-zinc-400 mt-6">
					Already have an account?{" "}
					<Link
						to="/login"
						className="text-indigo-600 font-semibold hover:text-indigo-700">
						Sign in
					</Link>
				</p>
			</motion.div>
		</div>
	);
};

const Field = ({ label, icon, ...props }) => (
	<div className="space-y-1.5">
		<label className="text-xs font-semibold text-zinc-700 ml-1">{label}</label>
		<div className="relative group">
			<div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400 group-focus-within:text-indigo-600 transition-colors">
				{icon}
			</div>
			<input
				{...props}
				className="w-full bg-white border border-zinc-200 text-zinc-900 rounded-xl py-2.5 pl-10 pr-4 focus:outline-none focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600/30 transition-all text-sm placeholder:text-zinc-400"
			/>
		</div>
	</div>
);

const PasswordField = ({ label, ...props }) => {
	const [show, setShow] = useState(false);
	return (
		<div className="space-y-1.5">
			<label className="text-xs font-semibold text-zinc-700 ml-1">
				{label}
			</label>
			<div className="relative group">
				<div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400 group-focus-within:text-indigo-600 transition-colors">
					<FiLock size={16} />
				</div>
				<input
					{...props}
					type={show ? "text" : "password"}
					className="w-full bg-white border border-zinc-200 text-zinc-900 rounded-xl py-2.5 pl-10 pr-10 focus:outline-none focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600/30 transition-all text-sm placeholder:text-zinc-400"
				/>
				<button
					type="button"
					onClick={() => setShow((v) => !v)}
					className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-400 hover:text-indigo-600 transition-colors">
					{show ? <FiEyeOff size={15} /> : <FiEye size={15} />}
				</button>
			</div>
		</div>
	);
};

export default Signup;
