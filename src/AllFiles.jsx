import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaFileAlt,
  FaFilePdf,
  FaFileWord,
  FaFileExcel,
  FaFileArchive,
  FaFileImage,
  FaFileVideo,
  FaFileAudio,
  FaFileCode,
  FaInfoCircle,
  FaSearch,
  FaSortAmountDown,
  FaThLarge,
  FaList,
  FaCloudUploadAlt,
  FaRegClock,
  FaRegFolder,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";

const API_BASE = "http://localhost:5000";

const FileList = () => {
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

  // ===============================
  // FETCH FILES
  // ===============================
  const fetchFiles = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE}/file`);

      const filesWithMetadata = (response.data.files || []).map(
        (fileName) => ({
          name: fileName,
          size: Math.floor(Math.random() * 1000000) + 1000,
          modified: new Date().toISOString(),
          type: fileName.split(".").pop().toLowerCase(),
        })
      );

      setFiles(filesWithMetadata);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch files");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  // ===============================
  // UPLOAD FILE
  // ===============================
  const handleFileUpload = async (event) => {
    const selectedFile = event.target.files?.[0];
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

      // Optional: you can get the server response if your backend returns something useful
      const response = await axios.post(`${API_BASE}/file/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Refresh file list
      await fetchFiles();

      // Redirect to the newly uploaded file's detail page
      const uploadedFileName = selectedFile.name;
      navigate(`/file/${encodeURIComponent(uploadedFileName)}`);

    } catch (err) {
      console.error("Upload error:", err);
      setUploadError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  // ===============================
  // FILTER + SORT (MEMOIZED)
  // ===============================
  const filteredFiles = useMemo(() => {
    let result = [...files];

    if (searchTerm) {
      result = result.filter((file) =>
        file.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== "all") {
      result = result.filter((file) => file.type === selectedCategory);
    }

    result.sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "type") return a.type.localeCompare(b.type);
      if (sortBy === "size") return b.size - a.size;
      return 0;
    });

    return result;
  }, [files, searchTerm, selectedCategory, sortBy]);

  const getCategories = () => {
    const types = [...new Set(files.map((f) => f.type))];
    return ["all", ...types];
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (
      parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const handleFileClick = (fileName) => {
    navigate(`/file/${encodeURIComponent(fileName)}`);
  };

  const getFileIcon = (fileName, size = "text-6xl") => {
    const extension = fileName.split(".").pop().toLowerCase();

    const iconMap = {
      pdf: { icon: FaFilePdf, color: "text-red-500" },
      json: { icon: FaFileCode, color: "text-yellow-500" },
      doc: { icon: FaFileWord, color: "text-blue-500" },
      docx: { icon: FaFileWord, color: "text-blue-500" },
      xls: { icon: FaFileExcel, color: "text-green-500" },
      xlsx: { icon: FaFileExcel, color: "text-green-500" },
      jpg: { icon: FaFileImage, color: "text-purple-500" },
      png: { icon: FaFileImage, color: "text-purple-500" },
      mp4: { icon: FaFileVideo, color: "text-pink-500" },
      mp3: { icon: FaFileAudio, color: "text-indigo-500" },
      zip: { icon: FaFileArchive, color: "text-orange-500" },
    };

    const defaultIcon = { icon: FaFileAlt, color: "text-gray-500" };
    const fileIcon = iconMap[extension] || defaultIcon;
    const IconComponent = fileIcon.icon;

    return <IconComponent className={`${size} ${fileIcon.color}`} />;
  };

  // ===============================
  // LOADING
  // ===============================
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-20 w-20 border-4 border-blue-300 border-t-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading files...</p>
        </div>
      </div>
    );
  }

  // ===============================
  // ERROR
  // ===============================
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center">
          <FaInfoCircle className="text-red-500 text-4xl mx-auto mb-3" />
          <p className="text-gray-700">{error}</p>
        </div>
      </div>
    );
  }

  // ===============================
  // MAIN UI
  // ===============================
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-blue-600">
              File Explorer
            </h1>
            <p className="text-gray-600 flex items-center gap-2">
              <FaRegFolder />
              Total Files: {files.length}
            </p>
          </div>

          <div className="flex items-center gap-3">

            {/* Upload Button */}
            <label className="relative cursor-pointer">
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-white transition-colors
                ${uploading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                  }`}
              >
                <FaCloudUploadAlt />
                {uploading ? "Uploading..." : "Upload JSON"}
              </div>
            </label>

            {/* View Toggle */}
            <button
              onClick={() =>
                setViewMode(viewMode === "grid" ? "list" : "grid")
              }
              className="bg-white shadow px-3 py-2 rounded-lg"
            >
              {viewMode === "grid" ? <FaList /> : <FaThLarge />}
            </button>
          </div>
        </div>

        {/* Upload Error */}
        {uploadError && (
          <div className="mb-4 p-3 bg-red-100 text-red-600 rounded-lg text-sm">
            {uploadError}
          </div>
        )}

        {/* SEARCH */}
        <div className="bg-white p-4 rounded-xl shadow mb-6 flex gap-3 flex-wrap">
          <div className="relative flex-1">
            <FaSearch className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search files..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="border px-3 py-2 rounded-lg"
          >
            {getCategories().map((cat) => (
              <option key={cat} value={cat}>
                {cat === "all" ? "All Files" : `.${cat}`}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="border px-3 py-2 rounded-lg"
          >
            <option value="name">Sort by Name</option>
            <option value="type">Sort by Type</option>
            <option value="size">Sort by Size</option>
          </select>
        </div>

        {/* FILE LIST */}
        {filteredFiles.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            No files found
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFiles.map((file, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.05 }}
                onClick={() => handleFileClick(file.name)}
                className="bg-white p-6 rounded-xl shadow cursor-pointer"
              >
                <div className="flex justify-center mb-4">
                  {getFileIcon(file.name)}
                </div>
                <h3 className="text-center font-semibold truncate">
                  {file.name}
                </h3>
                <p className="text-center text-sm text-gray-500">
                  {formatFileSize(file.size)}
                </p>
                <p className="text-center text-xs text-gray-400">
                  {formatDate(file.modified)}
                </p>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow divide-y">
            {filteredFiles.map((file, index) => (
              <div
                key={index}
                onClick={() => handleFileClick(file.name)}
                className="flex items-center p-4 hover:bg-gray-50 cursor-pointer"
              >
                <div className="mr-4">
                  {getFileIcon(file.name, "text-3xl")}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold truncate">
                    {file.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {formatFileSize(file.size)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FileList;
