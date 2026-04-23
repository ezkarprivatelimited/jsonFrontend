import { useEffect, useRef, useState } from "react";
import {
	FaArrowLeft,
	FaDownload,
	FaEdit,
	FaFileInvoice,
	FaPlus,
	FaSave,
	FaTimes,
	FaTrash,
} from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/axios";
import { API_ENDPOINTS } from "../../api/endpoints";
import { useAuth } from "../../contexts/AuthContext";

const FileDetails = () => {
	const navigate = useNavigate();
	const { fileId } = useParams();
	const { user } = useAuth();
	const isAdmin = user?.role === "admin";
	const isTrader = user?.role === "trader"; // trader vs manufacturer

	const [fileData, setFileData] = useState(null);
	const [originalData, setOriginalData] = useState(null);
	const [editableData, setEditableData] = useState(null);
	const [originalTaxAmounts, setOriginalTaxAmounts] = useState({});
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [editing, setEditing] = useState(false);
	const [saveStatus, setSaveStatus] = useState("");
	const [othChrgManual, setOthChrgManual] = useState(false);
	const [isIntraState, setIsIntraState] = useState(false);
	const [originalTotItemVal, setOriginalTotItemVal] = useState(0);
	const [originalOthChrg, setOriginalOthChrg] = useState(0);
	const [originalAssVal, setOriginalAssVal] = useState(0);

	// Refs so updateTotals always reads current values synchronously
	const origAssValRef = useRef(0);
	const origOthChrgRef = useRef(0);
	const origTotInvValRef = useRef(0);

	useEffect(() => {
		const fetchFileData = async () => {
			try {
				setLoading(true);
				setError(null);
				const response = await api.get(`${API_ENDPOINTS.FILE_PATH}/${fileId}`);
				let data = response.data;

				// Normalize: handles both { file: [...] } and { data: [...] }
				if (data.file && Array.isArray(data.file)) {
					data = { data: data.file };
				}

				setFileData(data);
				const deepCopy = structuredClone(data);
				setOriginalData(deepCopy);
				setEditableData(deepCopy);

				const sellerState = data?.data?.[0]?.SellerDtls?.Stcd || "";
				const buyerState = data?.data?.[0]?.BuyerDtls?.Stcd || "";
				const intraState = sellerState === buyerState && sellerState !== "";
				setIsIntraState(intraState);

				setOthChrgManual(false);
				setLoading(false);
			} catch (err) {
				console.error("Fetch error:", err);
				setError("Failed to load invoice data");
				setLoading(false);
			}
		};

		if (fileId) fetchFileData();
	}, [fileId]);

	const isTobaccoItem = (item) =>
		item.HsnCd === "24011090" ||
		item.PrdDesc?.toLowerCase().includes("asha jyoti mrp 4") ||
		item.PrdDesc?.toLowerCase().includes("unmanufactured tobacco");

	const calculateAutoOtherCharges = (items) => {
		let tobaccoAssAmt = 0;
		items.forEach((item) => {
			if (isTobaccoItem(item)) {
				tobaccoAssAmt += Number(item.AssAmt || 0);
			}
		});
		return Number((tobaccoAssAmt * 0.18).toFixed(2));
	};

	const handleDownloadOriginal = async () => {
		try {
			const response = await api.get(
				`${API_ENDPOINTS.FILE_PATH}/${fileId}/download`,
				{ responseType: "blob" },
			);
			const blob = new Blob([response.data], { type: "application/json" });
			const url = URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.href = url;
			link.download = `invoice_${fileId}.json`;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			URL.revokeObjectURL(url);
		} catch (err) {
			console.error("Download failed:", err);
			alert("Could not download original file");
		}
	};

	const handleDownloadCurrent = () => {
		if (!fileData) return;
		const jsonString = JSON.stringify(fileData, null, 2);
		const blob = new Blob([jsonString], { type: "application/json" });
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = url;
		const dateStr = new Date().toISOString().slice(0, 10);
		link.download = `invoice_${fileId}_edited_${dateStr}.json`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);
	};

	const startEditing = () => {
		const copy = structuredClone(fileData);
		setEditableData(copy);

		// Store original tax amounts
		const taxMap = {};
		copy.data[0].ItemList.forEach((item) => {
			taxMap[item.SlNo] = {
				igst: Number(item.IgstAmt || 0),
				cgst: Number(item.CgstAmt || 0),
				sgst: Number(item.SgstAmt || 0),
			};
		});
		setOriginalTaxAmounts(taxMap);

		// Store original totals for trader adjustment
		const origTotItemVal = copy.data[0].ItemList.reduce(
			(sum, item) => sum + Number(item.TotItemVal || 0),
			0,
		);
		const origAssVal = copy.data[0].ItemList.reduce(
			(sum, item) => sum + Number(item.AssAmt || 0),
			0,
		);
		setOriginalTotItemVal(origTotItemVal);
		setOriginalAssVal(origAssVal);
		setOriginalOthChrg(Number(copy.data[0].ValDtls?.OthChrg || 0));

		// Set refs for synchronous access inside updateTotals
		origAssValRef.current = origAssVal;
		origOthChrgRef.current = Number(copy.data[0].ValDtls?.OthChrg || 0);
		origTotInvValRef.current = Number(copy.data[0].ValDtls?.TotInvVal || 0);

		setOthChrgManual(false);
		setEditing(true);
		setSaveStatus("");
	};

	const cancelEditing = () => {
		setEditableData(null);
		setOriginalTaxAmounts({});
		setOriginalTotItemVal(0);
		setOriginalAssVal(0);
		setOriginalOthChrg(0);
		origAssValRef.current = 0;
		origOthChrgRef.current = 0;
		origTotInvValRef.current = 0;
		setOthChrgManual(false);
		setEditing(false);
		setSaveStatus("");
	};

	const handleItemChange = (index, field, value) => {
		setEditableData((prev) => {
			if (!prev) return prev;
			const newData = structuredClone(prev);
			const item = newData.data[0].ItemList[index];

			// Allow empty strings for numeric fields
			if (["Qty", "UnitPrice", "Discount"].includes(field)) {
				item[field] = value === "" ? "" : parseFloat(value) || 0;
			} else if (field === "GstRt") {
				// Don't allow changing GST rate as it would affect tax amounts
				return prev;
			} else {
				item[field] = value;
			}

			// Recalculate amounts based on quantity, price, and discount only
			const qty = Number(item.Qty || 0);
			const unitPrice = Number(item.UnitPrice || 0);
			const discount = Number(item.Discount || 0);

			const gross = qty * unitPrice;
			const discAmt = gross * (discount / 100);
			const taxable = gross - discAmt;

			// Preserve original tax amounts
			const originalTax = originalTaxAmounts[item.SlNo] || {
				igst: 0,
				cgst: 0,
				sgst: 0,
			};

			// Keep the original tax values
			item.IgstAmt = originalTax.igst;
			item.CgstAmt = originalTax.cgst;
			item.SgstAmt = originalTax.sgst;

			item.TotAmt = Number(taxable.toFixed(2));
			item.AssAmt = Number(taxable.toFixed(2));

			const totalTax =
				Number(item.IgstAmt || 0) +
				Number(item.CgstAmt || 0) +
				Number(item.SgstAmt || 0);
			item.TotItemVal = Number((taxable + totalTax).toFixed(2));

			updateTotals(newData);
			return newData;
		});
	};

	const updateTotals = (data) => {
		if (!data?.data?.[0]?.ItemList) return;
		const items = data.data[0].ItemList;

		let assVal = 0;
		let cgstVal = 0;
		let sgstVal = 0;
		let igstVal = 0;
		let totItemValBase = 0;

		items.forEach((item) => {
			assVal += Number(item.AssAmt || 0);
			cgstVal += Number(item.CgstAmt || 0);
			sgstVal += Number(item.SgstAmt || 0);
			igstVal += Number(item.IgstAmt || 0);
			totItemValBase += Number(item.TotItemVal || 0);
		});

		const valDtls = data.data[0].ValDtls || {};
		valDtls.AssVal = Number(assVal.toFixed(2));
		valDtls.CgstVal = Number(cgstVal.toFixed(2));
		valDtls.SgstVal = Number(sgstVal.toFixed(2));
		valDtls.IgstVal = Number(igstVal.toFixed(2));
		valDtls.CesVal = 0;
		valDtls.Discount = 0;

		if (!othChrgManual) {
			// Absorb AssAmt delta into OthChrg, TotInvVal locked to original backend value
			const assValDelta = assVal - origAssValRef.current;
			valDtls.OthChrg = Number(
				(origOthChrgRef.current - assValDelta).toFixed(2),
			);
		}

		// TotInvVal always locked to original backend value
		valDtls.TotInvVal = origTotInvValRef.current;
	};

	const handleOthChrgChange = (e) => {
		const value = parseFloat(e.target.value) || 0;
		setEditableData((prev) => {
			if (!prev) return prev;
			const newData = structuredClone(prev);
			const valDtls = newData.data[0].ValDtls || {};
			valDtls.OthChrg = Number(value.toFixed(2));
			setOthChrgManual(true);
			updateTotals(newData);
			return newData;
		});
	};

	const addNewItem = () => {
		setEditableData((prev) => {
			if (!prev) return prev;
			const newData = structuredClone(prev);
			const items = newData.data[0].ItemList;
			const newSlNo = String(items.length + 1);

			const newItem = {
				SlNo: newSlNo,
				PrdDesc: "New Product",
				IsServc: "N",
				HsnCd: "",
				Qty: 1,
				FreeQty: 0,
				Unit: "BAG",
				UnitPrice: 0,
				TotAmt: 0,
				Discount: 0,
				AssAmt: 0,
				GstRt: isIntraState ? 5 : 18,
				IgstAmt: 0,
				CgstAmt: 0,
				SgstAmt: 0,
				CesRt: 0,
				CesAmt: 0,
				CesNonAdvlAmt: 0,
				TotItemVal: 0,
			};

			items.push(newItem);

			setOriginalTaxAmounts((prev) => ({
				...prev,
				[newSlNo]: { igst: 0, cgst: 0, sgst: 0 },
			}));

			updateTotals(newData);
			return newData;
		});
	};

	const deleteItem = (index) => {
		setEditableData((prev) => {
			if (!prev) return prev;
			const newData = structuredClone(prev);
			const items = newData.data[0].ItemList;
			const deletedSlNo = items[index].SlNo;

			items.splice(index, 1);

			// Renumber items
			items.forEach((item, i) => {
				item.SlNo = String(i + 1);
			});

			setOriginalTaxAmounts((prev) => {
				const updated = { ...prev };
				delete updated[deletedSlNo];
				return updated;
			});

			updateTotals(newData);
			return newData;
		});
	};

	const hasChanges = () => {
		if (!editableData || !originalData) return false;
		return JSON.stringify(editableData) !== JSON.stringify(originalData);
	};

	const handleSave = async () => {
		if (!hasChanges()) {
			setSaveStatus("nochange");
			setTimeout(() => setSaveStatus(""), 2000);
			cancelEditing();
			return;
		}

		setSaveStatus("saving");

		try {
			const payload = {
				ItemList: editableData.data[0].ItemList,
				ValDtls: editableData.data[0].ValDtls,
			};
			await api.post(
				`${API_ENDPOINTS.FILE_PATH}/${fileId}/update-items`,
				payload,
			);
			const committed = structuredClone(editableData);
			setFileData(committed);
			setOriginalData(committed);

			setSaveStatus("success");
			setTimeout(() => setSaveStatus(""), 3000);
			cancelEditing();
		} catch (err) {
			console.error("Save failed:", err);
			setSaveStatus("error");
			setTimeout(() => setSaveStatus(""), 4000);
		}
	};

	if (loading)
		return (
			<div className="min-h-screen flex items-center justify-center text-lg">
				Loading invoice...
			</div>
		);
	if (error || !fileData?.data?.[0]) {
		return (
			<div className="min-h-screen flex items-center justify-center text-red-600 text-xl">
				{error || "Invoice not found"}
			</div>
		);
	}

	const displayData = editing ? editableData : fileData;
	const invoice = displayData.data[0];
	const items = invoice.ItemList || [];
	const valDtls = invoice.ValDtls || {};

	const totalAmount = items.reduce(
		(sum, item) => sum + Number(item.TotAmt || 0),
		0,
	);
	const totalTaxable = items.reduce(
		(sum, item) => sum + Number(item.AssAmt || 0),
		0,
	);
	const totalCGST = items.reduce(
		(sum, item) => sum + Number(item.CgstAmt || 0),
		0,
	);
	const totalSGST = items.reduce(
		(sum, item) => sum + Number(item.SgstAmt || 0),
		0,
	);
	const totalIGST = items.reduce(
		(sum, item) => sum + Number(item.IgstAmt || 0),
		0,
	);
	const totalItemVal = items.reduce(
		(sum, item) => sum + Number(item.TotItemVal || 0),
		0,
	);

	// Calculate column span for grand total row
	const baseColSpan = 10;
	const taxColSpan = isIntraState ? 2 : 1;

	return (
		<div className="min-h-screen bg-gray-50 pb-12">
			{/* Sticky Header */}
			<div className="bg-white shadow-sm  z-20">
				<div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
					<button
						onClick={() => navigate(-1)}
						className="flex items-center gap-2 text-gray-700 hover:text-blue-700 font-medium">
						<FaArrowLeft /> Back
					</button>

					<div className="flex flex-wrap items-center gap-3 sm:gap-4">
						{saveStatus === "saving" && (
							<span className="text-blue-600 font-medium">Saving...</span>
						)}
						{saveStatus === "success" && (
							<span className="text-green-600 font-medium">
								✓ Saved successfully
							</span>
						)}
						{saveStatus === "error" && (
							<span className="text-red-600 font-medium">Save failed</span>
						)}
						{saveStatus === "nochange" && (
							<span className="text-gray-500">No changes to save</span>
						)}

						{isAdmin &&
							(editing ? (
								<>
									<button
										onClick={handleSave}
										disabled={!hasChanges() || saveStatus === "saving"}
										className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-5 py-2 rounded flex items-center gap-2 shadow-sm font-medium">
										<FaSave /> Save
									</button>
									<button
										onClick={cancelEditing}
										className="bg-gray-600 hover:bg-gray-700 text-white px-5 py-2 rounded flex items-center gap-2 shadow-sm font-medium">
										<FaTimes /> Cancel
									</button>
								</>
							) : (
								<button
									onClick={startEditing}
									className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded flex items-center gap-2 shadow-sm font-medium">
									<FaEdit /> Edit Items
								</button>
							))}
						<button
							onClick={handleDownloadOriginal}
							className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded flex items-center gap-2 shadow-sm font-medium">
							<FaDownload /> Original
						</button>

						{/* <button
              onClick={handleDownloadCurrent}
              className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded flex items-center gap-2 shadow-sm font-medium"
            >
              <FaDownload /> Current
            </button> */}
					</div>
				</div>
			</div>

			{/* Main Content */}
			<div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
				{/* Invoice Header Card */}
				<div className="bg-white rounded-xl shadow mb-6 overflow-hidden">
					<div className="bg-linear-to-r from-blue-600 to-indigo-600 text-white p-6">
						<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
							<div className="flex items-center gap-4">
								<FaFileInvoice className="text-5xl opacity-90" />
								<div>
									<h1 className="text-2xl md:text-3xl font-bold">
										TAX INVOICE
									</h1>
									<p className="text-blue-100 mt-1">
										{invoice.TranDtls?.TaxSch || "GST"} •{" "}
										{invoice.TranDtls?.SupTyp || "B2B"}
										{isIntraState ? " • Intra-State" : " • Inter-State"}
									</p>
								</div>
							</div>
							<div className="text-right">
								<div className="text-3xl font-bold">
									₹{Number(valDtls.TotInvVal || 0).toFixed(2)}
								</div>
								<div className="text-blue-100 mt-2 text-sm">
									<strong>Invoice No:</strong> {invoice.DocDtls?.No || "-"}
									<br />
									<strong>Date:</strong> {invoice.DocDtls?.Dt || "-"}
								</div>
							</div>
						</div>
					</div>

					<div className="p-6 grid md:grid-cols-2 gap-8 border-t">
						<div>
							<h3 className="font-semibold text-gray-800 mb-3 text-lg">
								Seller
							</h3>
							<div className="text-sm space-y-1.5">
								<p>
									<span className="text-gray-500">GSTIN:</span>{" "}
									{invoice.SellerDtls?.Gstin || "-"}
								</p>
								<p>
									<span className="text-gray-500">Name:</span>{" "}
									{invoice.SellerDtls?.LglNm || "-"}
								</p>
								<p>
									<span className="text-gray-500">Place:</span>{" "}
									{invoice.SellerDtls?.Loc || "-"}
								</p>
								<p>
									<span className="text-gray-500">State Code:</span>{" "}
									{invoice.SellerDtls?.Stcd || "-"}
								</p>
							</div>
						</div>
						<div>
							<h3 className="font-semibold text-gray-800 mb-3 text-lg">
								Buyer
							</h3>
							<div className="text-sm space-y-1.5">
								<p>
									<span className="text-gray-500">GSTIN:</span>{" "}
									{invoice.BuyerDtls?.Gstin || "-"}
								</p>
								<p>
									<span className="text-gray-500">Name:</span>{" "}
									{invoice.BuyerDtls?.LglNm || "-"}
								</p>
								<p>
									<span className="text-gray-500">Place:</span>{" "}
									{invoice.BuyerDtls?.Loc || "-"}
								</p>
								<p>
									<span className="text-gray-500">State Code:</span>{" "}
									{invoice.BuyerDtls?.Stcd || "-"}
								</p>
							</div>
						</div>
					</div>
				</div>

				{/* Items Table */}
				<div className="bg-white rounded-xl shadow overflow-hidden mb-8">
					<div className="p-6 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
						<h2 className="text-xl font-semibold text-gray-800">Items</h2>
						{editing && (
							<button
								onClick={addNewItem}
								className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded flex items-center gap-2 text-sm font-medium">
								<FaPlus size={14} /> Add Item
							</button>
						)}
					</div>

					<div className="overflow-x-auto">
						<table className="min-w-full divide-y divide-gray-200 text-sm">
							<thead className="bg-gray-100">
								<tr>
									<th className="px-4 py-3 text-left font-semibold">Sl</th>
									<th className="px-4 py-3 text-left font-semibold">
										Description
									</th>
									<th className="px-4 py-3 text-left font-semibold">HSN/SAC</th>
									<th className="px-4 py-3 text-left font-semibold">Unit</th>
									<th className="px-4 py-3 text-right font-semibold">Qty</th>
									<th className="px-4 py-3 text-right font-semibold">Rate</th>
									<th className="px-4 py-3 text-right font-semibold">Disc %</th>
									<th className="px-4 py-3 text-right font-semibold">Amount</th>
									<th className="px-4 py-3 text-right font-semibold">
										Taxable
									</th>
									<th className="px-4 py-3 text-right font-semibold">GST %</th>
									{isIntraState ? (
										<>
											<th className="px-4 py-3 text-right font-semibold">
												CGST
											</th>
											<th className="px-4 py-3 text-right font-semibold">
												SGST
											</th>
										</>
									) : (
										<th className="px-4 py-3 text-right font-semibold">IGST</th>
									)}
									<th className="px-4 py-3 text-right font-semibold">Total</th>
									{editing && (
										<th className="px-4 py-3 text-center font-semibold">
											Action
										</th>
									)}
								</tr>
							</thead>
							<tbody className="divide-y divide-gray-200">
								{items.map((item, idx) => (
									<tr
										key={item.SlNo || idx}
										className="hover:bg-gray-50 transition">
										<td className="px-4 py-3">{item.SlNo}</td>
										<td className="px-4 py-3">
											{editing ? (
												<input
													className="w-full border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
													value={item.PrdDesc ?? ""}
													onChange={(e) =>
														handleItemChange(idx, "PrdDesc", e.target.value)
													}
												/>
											) : (
												item.PrdDesc || "-"
											)}
										</td>
										<td className="px-4 py-3">
											{editing ? (
												<input
													className="w-28 border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
													value={item.HsnCd ?? ""}
													onChange={(e) =>
														handleItemChange(idx, "HsnCd", e.target.value)
													}
												/>
											) : (
												item.HsnCd || "-"
											)}
										</td>
										<td className="px-4 py-3">{item.Unit || "-"}</td>
										<td className="px-4 py-3 text-right">
											{editing ? (
												<input
													type="number"
													className="w-20 border border-gray-300 rounded px-2 py-1 text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
													value={item.Qty ?? ""}
													onChange={(e) =>
														handleItemChange(idx, "Qty", e.target.value)
													}
												/>
											) : (
												Number(item.Qty ?? 0).toFixed(0)
											)}
										</td>
										<td className="px-4 py-3 text-right">
											{editing ? (
												<input
													type="number"
													step="0.01"
													className="w-24 border border-gray-300 rounded px-2 py-1 text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
													value={item.UnitPrice ?? ""}
													onChange={(e) =>
														handleItemChange(idx, "UnitPrice", e.target.value)
													}
												/>
											) : (
												Number(item.UnitPrice ?? 0).toFixed(2)
											)}
										</td>
										<td className="px-4 py-3 text-right">
											{editing ? (
												<input
													type="number"
													step="0.01"
													className="w-20 border border-gray-300 rounded px-2 py-1 text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
													value={item.Discount ?? ""}
													onChange={(e) =>
														handleItemChange(idx, "Discount", e.target.value)
													}
												/>
											) : (
												Number(item.Discount ?? 0).toFixed(2)
											)}
										</td>
										<td className="px-4 py-3 text-right font-medium">
											{Number(item.TotAmt ?? 0).toFixed(2)}
										</td>
										<td className="px-4 py-3 text-right font-medium">
											{Number(item.AssAmt ?? 0).toFixed(2)}
										</td>
										<td className="px-4 py-3 text-right">
											{item.GstRt ? Number(item.GstRt).toFixed(1) : "—"}
										</td>

										{/* Tax columns - always show original values */}
										{isIntraState ? (
											<>
												<td className="px-4 py-3 text-right">
													{item.CgstAmt ? Number(item.CgstAmt).toFixed(2) : "—"}
												</td>
												<td className="px-4 py-3 text-right">
													{item.SgstAmt ? Number(item.SgstAmt).toFixed(2) : "—"}
												</td>
											</>
										) : (
											<td className="px-4 py-3 text-right">
												{item.IgstAmt ? Number(item.IgstAmt).toFixed(2) : "—"}
											</td>
										)}

										<td className="px-4 py-3 text-right font-bold text-blue-700">
											{Number(item.TotItemVal ?? 0).toFixed(2)}
										</td>

										{editing && (
											<td className="px-4 py-3 text-center">
												<button
													onClick={() => deleteItem(idx)}
													className="text-red-600 hover:text-red-800 transition"
													title="Delete item">
													<FaTrash size={16} />
												</button>
											</td>
										)}
									</tr>
								))}

								{/* Grand Totals Row */}
								<tr className="bg-gray-50 font-semibold">
									<td colSpan={7} className="px-4 py-3 text-right">
										Grand Total
									</td>
									<td className="px-4 py-3 text-right text-green-700">
										{totalAmount.toFixed(2)}
									</td>
									<td className="px-4 py-3 text-right text-green-700">
										{totalTaxable.toFixed(2)}
									</td>
									<td className="px-4 py-3 text-right"></td>
									{isIntraState ? (
										<>
											<td className="px-4 py-3 text-right text-green-700">
												{totalCGST.toFixed(2)}
											</td>
											<td className="px-4 py-3 text-right text-green-700">
												{totalSGST.toFixed(2)}
											</td>
										</>
									) : (
										<td className="px-4 py-3 text-right text-green-700">
											{totalIGST.toFixed(2)}
										</td>
									)}
									<td className="px-4 py-3 text-right text-blue-800">
										{totalItemVal.toFixed(2)}
									</td>
									{editing && <td></td>}
								</tr>
							</tbody>
						</table>
					</div>
				</div>

				{/* Value Details */}
				<div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
					<div className="px-6 py-4 bg-gray-50 border-b">
						<h3 className="text-lg font-semibold text-gray-800">
							Value Details
						</h3>
					</div>

					<div className="p-6">
						<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
							<div className="bg-gray-50 p-4 rounded-lg text-center">
								<p className="text-sm text-gray-600">AssVal</p>
								<p className="text-xl font-bold mt-1">
									₹{Number(valDtls.AssVal || 0).toFixed(2)}
								</p>
							</div>
							<div className="bg-gray-50 p-4 rounded-lg text-center">
								<p className="text-sm text-gray-600">CGST</p>
								<p className="text-xl font-bold mt-1">
									₹{Number(valDtls.CgstVal || 0).toFixed(2)}
								</p>
							</div>
							<div className="bg-gray-50 p-4 rounded-lg text-center">
								<p className="text-sm text-gray-600">SGST</p>
								<p className="text-xl font-bold mt-1">
									₹{Number(valDtls.SgstVal || 0).toFixed(2)}
								</p>
							</div>
							<div className="bg-gray-50 p-4 rounded-lg text-center">
								<p className="text-sm text-gray-600">IGST</p>
								<p className="text-xl font-bold text-emerald-700 mt-1">
									₹{Number(valDtls.IgstVal || 0).toFixed(2)}
								</p>
							</div>
							<div className="bg-gray-50 p-4 rounded-lg text-center">
								<p className="text-sm text-gray-600">Cess</p>
								<p className="text-xl font-bold mt-1">
									₹{Number(valDtls.CesVal || 0).toFixed(2)}
								</p>
							</div>
							<div className="bg-gray-50 p-4 rounded-lg text-center">
								<p className="text-sm text-gray-600">Discount</p>
								<p className="text-xl font-bold text-rose-600 mt-1">
									₹{Number(valDtls.Discount || 0).toFixed(2)}
								</p>
							</div>
							<div className="bg-gray-50 p-4 rounded-lg text-center">
								<p className="text-sm text-gray-600">Other Charges</p>
								{editing ? (
									<input
										type="number"
										step="0.01"
										className="w-full text-center text-xl font-bold border border-gray-300 rounded py-2 focus:outline-none focus:ring-2 focus:ring-amber-500 mt-1"
										value={valDtls.OthChrg ?? ""}
										onChange={handleOthChrgChange}
									/>
								) : (
									<p className="text-xl font-bold text-amber-700 mt-1">
										₹{Number(valDtls.OthChrg || 0).toFixed(2)}
									</p>
								)}
								{editing &&
									isTrader &&
									!othChrgManual &&
									(() => {
										const delta =
											Number(valDtls.OthChrg || 0) - originalOthChrg;
										return delta !== 0 ? (
											<p
												className={`text-xs mt-1 font-medium ${delta < 0 ? "text-red-500" : "text-green-600"}`}>
												{delta > 0 ? "+" : ""}
												{delta.toFixed(2)} adjusted
											</p>
										) : null;
									})()}
							</div>
							<div className="bg-gray-50 p-4 rounded-lg text-center">
								<p className="text-sm text-gray-600">Round Off</p>
								<p className="text-xl font-bold text-purple-700 mt-1">
									₹{Number(valDtls.RndOffAmt || 0).toFixed(2)}
								</p>
							</div>
						</div>

						<div className="bg-blue-50 p-6 rounded-xl text-center border border-blue-100">
							<div className="flex flex-col sm:flex-row items-center justify-between gap-4">
								<span className="text-lg font-medium text-blue-800">
									Total Invoice Value
								</span>
								<span className="text-3xl font-bold text-blue-900">
									₹{Number(valDtls.TotInvVal || 0).toFixed(2)}
								</span>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default FileDetails;
