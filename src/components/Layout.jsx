import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import {
	FiChevronLeft,
	FiChevronRight,
	FiFolder,
	FiLogOut,
	FiMenu,
	FiUser,
	FiUsers,
	FiX,
} from "react-icons/fi";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const Layout = ({ children }) => {
	const { user, logout } = useAuth();
	const navigate = useNavigate();
	const location = useLocation();
	const [isSidebarOpen, setIsSidebarOpen] = useState(true);
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

	const handleLogout = () => {
		// Both calls are synchronous — React batches them into one render.
		// user becomes null at the same time as the URL becomes /login,
		// so the Login page never sees a logged-in user and won't redirect back.
		logout();
		navigate("/login", { replace: true });
	};

	const isAdmin = user?.role === "admin";

	const navLinks = [
		{ name: "File Explorer", path: "/", icon: <FiFolder size={20} /> },
		// { name: "", path: "/files", icon: <FiFolder size={20} /> },
		// { name: "Activity", path: "/activity", icon: <FiActivity size={20} /> },
		// { name: "Settings", path: "/settings", icon: <FiSettings size={20} /> },
		...(isAdmin
			? [
					{
						name: "Manage Users",
						path: "/manage-users",
						icon: <FiUsers size={20} />,
					},
				]
			: []),
	];

	return (
		<div className="h-screen bg-zinc-50 flex font-sans text-zinc-900 antialiased overflow-hidden">
			{/* --- SIDEBAR (Desktop) --- */}
			<aside
				className={`hidden md:flex flex-col bg-white border-r border-zinc-200 transition-all duration-300 ease-in-out z-30 relative overflow-hidden ${
					isSidebarOpen ? "w-64" : "w-20"
				}`}>
				<div className="h-16 flex items-center px-4 border-b border-zinc-100 shrink-0 overflow-hidden justify-between">
					<div className="flex items-center gap-3">
						<div className="w-8 h-8 rounded-lg shrink-0 overflow-hidden rounded-full">
							<img
								src="/icon.ico"
								alt="Ezkar"
								className="w-full h-full object-cover"
							/>
						</div>
						<AnimatePresence>
							{isSidebarOpen && (
								<motion.span
									initial={{ opacity: 0, x: -10 }}
									animate={{ opacity: 1, x: 0 }}
									exit={{ opacity: 0, x: -10 }}
									className="font-bold text-base tracking-tight whitespace-nowrap text-blue-600">
									JSON Editor
								</motion.span>
							)}
						</AnimatePresence>
					</div>

					{/* Main Toggle Button next to Logo */}
					<button
						onClick={() => setIsSidebarOpen(!isSidebarOpen)}
						className={`p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-50 hover:text-indigo-600 transition-all ${!isSidebarOpen ? "mx-auto" : ""}`}>
						{isSidebarOpen ? (
							<FiChevronLeft size={18} />
						) : (
							<FiChevronRight size={18} />
						)}
					</button>
				</div>

				<nav className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-1 custom-scrollbar">
					{navLinks.map((link) => (
						<Link
							key={link.path}
							to={link.path}
							className={`flex items-center px-3 py-2.5 rounded-xl transition-all duration-200 group relative ${
								location.pathname === link.path
									? "bg-indigo-50 text-indigo-700 font-bold"
									: "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"
							}`}>
							<span
								className={`shrink-0 ${location.pathname === link.path ? "text-indigo-600" : "group-hover:text-indigo-500"}`}>
								{link.icon}
							</span>
							<AnimatePresence>
								{isSidebarOpen && (
									<motion.span
										initial={{ opacity: 0, width: 0 }}
										animate={{ opacity: 1, width: "auto" }}
										exit={{ opacity: 0, width: 0 }}
										className="ml-3 text-sm whitespace-nowrap overflow-hidden">
										{link.name}
									</motion.span>
								)}
							</AnimatePresence>

							{!isSidebarOpen && (
								<div className="absolute left-full ml-4 px-2 py-1 bg-zinc-900 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap font-bold uppercase tracking-widest shadow-lg">
									{link.name}
								</div>
							)}
						</Link>
					))}
				</nav>

				<div className="p-4 border-t border-zinc-100 mt-auto">
					<button
						onClick={handleLogout}
						className={`flex items-center rounded-xl transition-all duration-200 group relative overflow-hidden ${
							isSidebarOpen
								? "px-4 py-3 bg-rose-50 text-rose-600 hover:bg-rose-100 w-full"
								: "p-3 text-zinc-400 hover:text-rose-600 w-full justify-center"
						}`}>
						<FiLogOut size={20} className="shrink-0" />
						{isSidebarOpen && (
							<span className="ml-3 text-sm font-bold whitespace-nowrap">
								Sign out
							</span>
						)}
					</button>
				</div>
			</aside>

			{/* --- MOBILE SIDEBAR DRAWER --- */}
			<AnimatePresence>
				{isMobileMenuOpen && (
					<>
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							onClick={() => setIsMobileMenuOpen(false)}
							className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm z-40 md:hidden"
						/>
						<motion.aside
							initial={{ x: "-100%" }}
							animate={{ x: 0 }}
							exit={{ x: "-100%" }}
							transition={{ type: "spring", damping: 25, stiffness: 200 }}
							className="fixed inset-y-0 left-0 w-72 bg-white z-50 md:hidden flex flex-col">
							<div className="h-16 flex items-center justify-between px-6 border-b border-zinc-100">
								<Link to="/" className="flex items-center gap-3">
									<div className="w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-lg shadow-indigo-100">
										<img
											src="/icon.ico"
											alt="Ezkar"
											className="w-full h-full object-contain"
										/>
									</div>
									<span className="font-bold text-base text-blue-600  tracking-tight">
										JSON Editor
									</span>
								</Link>
								<button
									onClick={() => setIsMobileMenuOpen(false)}
									className="text-zinc-400 hover:text-zinc-600">
									<FiX size={20} />
								</button>
							</div>
							<nav className="flex-1 p-4 space-y-2">
								{navLinks.map((link) => (
									<Link
										key={link.path}
										to={link.path}
										onClick={() => setIsMobileMenuOpen(false)}
										className={`flex items-center px-4 py-3 rounded-xl text-sm font-bold transition-all ${
											location.pathname === link.path
												? "bg-indigo-50 text-indigo-700"
												: "text-zinc-500 hover:bg-zinc-50"
										}`}>
										<span className="mr-3">{link.icon}</span>
										{link.name}
									</Link>
								))}
							</nav>
							<div className="p-4 border-t border-zinc-100">
								<button
									onClick={handleLogout}
									className="w-full flex items-center px-4 py-3 rounded-xl text-sm font-bold text-rose-600 hover:bg-rose-50">
									<FiLogOut className="mr-3" /> Sign out
								</button>
							</div>
						</motion.aside>
					</>
				)}
			</AnimatePresence>

			{/* --- MAIN WRAPPER --- */}
			<div className="flex-1 flex flex-col min-w-0 overflow-hidden">
				{/* --- NAVBAR --- */}
				<header className="h-16 bg-white border-b border-zinc-200 flex items-center justify-between px-4 md:px-8 shrink-0 z-20">
					<div className="flex items-center gap-4">
						<button
							onClick={() => setIsMobileMenuOpen(true)}
							className="md:hidden p-2 text-zinc-500 hover:bg-zinc-50 rounded-lg transition-colors">
							<FiMenu size={20} />
						</button>
					</div>

					<div className="flex items-center gap-3 md:gap-6">
						<div className="hidden sm:flex flex-col items-end mr-1">
							<span className="text-xs font-bold text-zinc-900">
								{user?.name || user?.email || "Admin User"}
							</span>
							<span className="text-[10px] text-zinc-400 font-bold uppercase tracking-tighter">
								{user?.role}
							</span>
						</div>

						<div className="relative group">
							<button className="w-9 h-9 bg-zinc-100 rounded-full flex items-center justify-center border border-zinc-200 group-hover:border-indigo-300 transition-all">
								<FiUser className="text-zinc-600 group-hover:text-indigo-600 transition-colors" />
							</button>

							<div className="absolute right-0 mt-2 w-48 bg-white border border-zinc-200 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all py-2 z-50">
								<button
									onClick={handleLogout}
									className="w-full flex items-center px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors">
									<FiLogOut className="mr-2" /> Sign out
								</button>
							</div>
						</div>
					</div>
				</header>

				{/* --- PAGE CONTENT --- */}
				<main className="flex-1 overflow-y-auto bg-zinc-50/50 px-4 custom-scrollbar py-2">
					<motion.div
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.3 }}
						className=" mx-auto">
						{children}
					</motion.div>
				</main>
			</div>
		</div>
	);
};

export default Layout;
