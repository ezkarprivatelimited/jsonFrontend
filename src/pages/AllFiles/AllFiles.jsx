import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import {
	FaFileAlt,
	FaFileArchive,
	FaFileAudio,
	FaFileCode,
	FaFileExcel,
	FaFileImage,
	FaFilePdf,
	FaFileVideo,
	FaFileWord,
} from "react-icons/fa";
import {
	FiAlertCircle,
	FiChevronRight,
	FiGrid,
	FiList,
	FiSearch,
	FiUploadCloud,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { API_ENDPOINTS } from "../../api/endpoints";
import { useAuth } from "../../contexts/AuthContext";

const EXT_CONFIG = {
	pdf: {
		icon: FaFilePdf,
		color: "text-rose-500",
		bg: "bg-rose-50",
		ring: "ring-rose-100",
	},
	json: {
		icon: FaFileCode,
		color: "text-amber-500",
		bg: "bg-amber-50",
		ring: "ring-amber-100",
	},
	doc: {
		icon: FaFileWord,
		color: "text-blue-500",
		bg: "bg-blue-50",
		ring: "ring-blue-100",
	},
	docx: {
		icon: FaFileWord,
		color: "text-blue-500",
		bg: "bg-blue-50",
		ring: "ring-blue-100",
	},
	xls: {
		icon: FaFileExcel,
		color: "text-emerald-500",
		bg: "bg-emerald-50",
		ring: "ring-emerald-100",
	},
	xlsx: {
		icon: FaFileExcel,
		color: "text-emerald-500",
		bg: "bg-emerald-50",
		ring: "ring-emerald-100",
	},
	jpg: {
		icon: FaFileImage,
		color: "text-purple-500",
		bg: "bg-purple-50",
		ring: "ring-purple-100",
	},
	png: {
		icon: FaFileImage,
		color: "text-purple-500",
		bg: "bg-purple-50",
		ring: "ring-purple-100",
	},
	mp4: {
		icon: FaFileVideo,
		color: "text-pink-500",
		bg: "bg-pink-50",
		ring: "ring-pink-100",
	},
	mp3: {
		icon: FaFileAudio,
		color: "text-indigo-500",
		bg: "bg-indigo-50",
		ring: "ring-indigo-100",
	},
	zip: {
		icon: FaFileArchive,
		color: "text-orange-500",
		bg: "bg-orange-50",
		ring: "ring-orange-100",
	},
};
const DEFAULT_CFG = {
	icon: FaFileAlt,
	color: "text-zinc-400",
	bg: "bg-zinc-50",
	ring: "ring-zinc-100",
};

const getExt = (name) => name.split(".").pop().toLowerCase();
const getCfg = (name) => EXT_CONFIG[getExt(name)] || DEFAULT_CFG;

const FileIcon = ({ name, size = "text-2xl" }) => {
	const cfg = getCfg(name);
	const Icon = cfg.icon;
	return (
		<div
			className={`${cfg.bg} ring-1 ${cfg.ring} p-3 rounded-2xl flex items-center justify-center`}>
			<Icon className={`${size} ${cfg.color}`} />
		</div>
	);
};

const formatSize = (bytes) => {
	if (!bytes) return "—";
	const k = 1024;
	const sizes = ["B", "KB", "MB", "GB"];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

const formatDate = (d) =>
	new Date(d).toLocaleDateString("en-IN", {
		day: "numeric",
		month: "short",
		year: "numeric",
	});

// ─── Main Component ───────────────────────────────────────────────────────────
const FileList = () => {
	const { user, refreshUser } = useAuth();
	const isAdmin = user?.role === "admin";
	const navigate = useNavigate();

	const [files, setFiles] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [searchTerm, setSearchTerm] = useState("");
	const [viewMode, setViewMode] = useState("grid");
	const [sortBy, setSortBy] = useState("name");
	const [selectedCategory, setSelectedCategory] = useState("all");
	const [uploading, setUploading] = useState(false);
	const [uploadError, setUploadError] = useState(null);

	const fetchFiles = async () => {
		// Files are already synced via user state in AuthContext
		// We only need this if we want to manually trigger a refresh
		setLoading(false);
	};

	useEffect(() => {
		if (user?.files) {
			setFiles(
				user.files.map((f) => ({
					id: f._id,
					name: f.originalname || f.filename,
					realName: f.filename,
					size: f.size,
					modified: f.createdAt,
					type: getExt(f.originalname || f.filename),
				})),
			);
		}
		setLoading(false);
	}, [user]);

	useEffect(() => {
		fetchFiles();
	}, []);

	const handleFileUpload = async (e) => {
		const selectedFile = e.target.files?.[0];
		if (!selectedFile) return;
		if (!selectedFile.name.toLowerCase().endsWith(".json")) {
			setUploadError("Only JSON files are allowed");
			return;
		}
		const formData = new FormData();
		formData.append("file", selectedFile);
		try {
			setUploading(true);
			setUploadError(null);
			const res = await api.post(API_ENDPOINTS.FILE_UPLOAD, formData, {
				headers: { "Content-Type": "multipart/form-data" },
			});
			const newFileId = res.data.fileId || res.data.data._id;
			navigate(`/file/${encodeURIComponent(newFileId)}`);
		} catch {
			setUploadError("Upload failed. Please try again.");
		} finally {
			setUploading(false);
		}
	};

	const categories = useMemo(
		() => ["all", ...new Set(files.map((f) => f.type))],
		[files],
	);

	const filteredFiles = useMemo(() => {
		let r = [...files];
		if (searchTerm)
			r = r.filter((f) =>
				f.name.toLowerCase().includes(searchTerm.toLowerCase()),
			);
		if (selectedCategory !== "all")
			r = r.filter((f) => f.type === selectedCategory);
		r.sort((a, b) => {
			if (sortBy === "name") return a.name.localeCompare(b.name);
			if (sortBy === "type") return a.type.localeCompare(b.type);
			if (sortBy === "size") return b.size - a.size;
			return 0;
		});
		return r;
	}, [files, searchTerm, selectedCategory, sortBy]);

	// ── Loading ──
	if (loading)
		return (
			<div className="flex flex-col items-center justify-center py-32">
				<div className="w-10 h-10 border-2 border-zinc-200 border-t-indigo-600 rounded-full animate-spin" />
				<p className="mt-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">
					Loading files
				</p>
			</div>
		);

	// ── Error ──
	if (error)
		return (
			<div className="flex flex-col items-center justify-center py-32 gap-3">
				<FiAlertCircle className="text-red-400 text-4xl" />
				<p className="text-zinc-600 font-medium">{error}</p>
			</div>
		);

	return (
		<div className="space-y-6">
			{/* ── Header ── */}
			<div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
				<div>
					<h1 className="text-2xl font-bold text-zinc-900 tracking-tight">
						File Explorer
					</h1>
					<p className="text-sm text-zinc-500 mt-0.5">
						{files.length} {files.length === 1 ? "file" : "files"} in your
						workspace
					</p>
				</div>

				<div className="flex items-center gap-2">
					<label
						className={`cursor-pointer ${uploading ? "pointer-events-none" : ""}`}>
						<input
							type="file"
							accept=".json"
							onChange={handleFileUpload}
							className="hidden"
						/>
						<div
							className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white shadow-sm transition-all
							${uploading ? "bg-zinc-300" : "bg-indigo-600 hover:bg-indigo-700 active:scale-95"}`}>
							<FiUploadCloud size={16} />
							{uploading ? "Uploading…" : "Upload JSON"}
						</div>
					</label>
					<div className="flex bg-white border border-zinc-200 rounded-xl p-1 gap-0.5">
						<button
							onClick={() => setViewMode("grid")}
							className={`p-2 rounded-lg transition-colors ${viewMode === "grid" ? "bg-zinc-100 text-zinc-900" : "text-zinc-400 hover:text-zinc-600"}`}>
							<FiGrid size={16} />
						</button>
						<button
							onClick={() => setViewMode("list")}
							className={`p-2 rounded-lg transition-colors ${viewMode === "list" ? "bg-zinc-100 text-zinc-900" : "text-zinc-400 hover:text-zinc-600"}`}>
							<FiList size={16} />
						</button>
					</div>
				</div>
			</div>

			{/* ── Upload error ── */}
			<AnimatePresence>
				{uploadError && (
					<motion.div
						initial={{ opacity: 0, y: -8 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0 }}
						className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-medium">
						<FiAlertCircle size={16} /> {uploadError}
					</motion.div>
				)}
			</AnimatePresence>

			{/* ── Filters ── */}
			<div className="bg-white border border-zinc-200 rounded-2xl p-3 flex flex-col md:flex-row gap-3 shadow-sm">
				{/* Search */}
				<div className="relative flex-1">
					<FiSearch
						className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
						size={15}
					/>
					<input
						type="text"
						placeholder="Search files…"
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 rounded-xl text-sm font-medium text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all"
					/>
				</div>

				{/* Category pills */}
				<div className="flex gap-1.5 flex-wrap">
					{categories.map((cat) => (
						<button
							key={cat}
							onClick={() => setSelectedCategory(cat)}
							className={`px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wide transition-colors ${
								selectedCategory === cat
									? "bg-indigo-600 text-white"
									: "bg-zinc-50 text-zinc-500 hover:bg-zinc-100"
							}`}>
							{cat === "all" ? "All" : cat}
						</button>
					))}
				</div>

				{/* Sort */}
				<select
					value={sortBy}
					onChange={(e) => setSortBy(e.target.value)}
					className="px-3 py-2.5 bg-zinc-50 rounded-xl text-xs font-bold uppercase tracking-wide text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all">
					<option value="name">Name</option>
					<option value="type">Type</option>
					<option value="size">Size</option>
				</select>
			</div>

			{/* ── Empty state ── */}
			{filteredFiles.length === 0 && (
				<div className="bg-white border-2 border-dashed border-zinc-100 rounded-2xl py-20 flex flex-col items-center gap-3">
					<div className="w-14 h-14 bg-zinc-50 rounded-2xl flex items-center justify-center">
						<FiSearch className="text-zinc-300" size={24} />
					</div>
					<p className="text-sm font-bold text-zinc-400">
						No files match your search
					</p>
					<p className="text-xs text-zinc-300">Try adjusting your filters</p>
				</div>
			)}

			{/* ── Grid view ── */}
			{filteredFiles.length > 0 && viewMode === "grid" && (
				<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
					{filteredFiles.map((file, idx) => (
						<motion.div
							key={file.id}
							initial={{ opacity: 0, y: 12 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: idx * 0.03 }}
							whileHover={{ y: -3, transition: { duration: 0.15 } }}
							onClick={() => navigate(`/file/${file.id}`)}
							className="group bg-white border border-zinc-200 hover:border-indigo-200 hover:shadow-md rounded-2xl p-5 cursor-pointer transition-all flex flex-col items-center gap-3">
							<FileIcon name={file.name} size="text-2xl" />
							<div className="w-full text-center">
								<p className="text-xs font-bold text-zinc-800 truncate group-hover:text-indigo-600 transition-colors">
									{file.name}
								</p>
								<p className="text-[10px] text-zinc-400 mt-0.5 font-medium">
									{formatSize(file.size)} · {formatDate(file.modified)}
								</p>
							</div>
							<span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-400 group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-colors">
								.{file.type}
							</span>
						</motion.div>
					))}
				</div>
			)}

			{/* ── List view ── */}
			{filteredFiles.length > 0 && viewMode === "list" && (
				<div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
					{/* List header */}
					<div className="grid grid-cols-12 px-5 py-3 border-b border-zinc-100 bg-zinc-50">
						<span className="col-span-6 text-xs font-bold text-zinc-400 uppercase tracking-wide">
							Name
						</span>
						<span className="col-span-2 text-xs font-bold text-zinc-400 uppercase tracking-wide">
							Type
						</span>
						<span className="col-span-2 text-xs font-bold text-zinc-400 uppercase tracking-wide">
							Size
						</span>
						<span className="col-span-2 text-xs font-bold text-zinc-400 uppercase tracking-wide">
							Modified
						</span>
					</div>
					{filteredFiles.map((file, idx) => (
						<motion.div
							key={file.id}
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							transition={{ delay: idx * 0.02 }}
							onClick={() => navigate(`/file/${file.id}`)}
							className="group grid grid-cols-12 items-center px-5 py-3.5 border-b border-zinc-50 last:border-0 hover:bg-zinc-50 cursor-pointer transition-colors">
							<div className="col-span-6 flex items-center gap-3 min-w-0">
								<FileIcon name={file.name} size="text-base" />
								<span className="text-sm font-semibold text-zinc-800 truncate group-hover:text-indigo-600 transition-colors">
									{file.name}
								</span>
							</div>
							<div className="col-span-2">
								<span className="text-xs font-bold uppercase tracking-wide px-2 py-1 rounded-lg bg-zinc-100 text-zinc-500">
									.{file.type}
								</span>
							</div>
							<span className="col-span-2 text-sm text-zinc-500 font-medium">
								{formatSize(file.size)}
							</span>
							<div className="col-span-2 flex items-center justify-between">
								<span className="text-sm text-zinc-400">
									{formatDate(file.modified)}
								</span>
								<FiChevronRight
									className="text-zinc-300 group-hover:text-indigo-500 transition-colors"
									size={16}
								/>
							</div>
						</motion.div>
					))}
				</div>
			)}
		</div>
	);
};

export default FileList;
