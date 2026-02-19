import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import {
  FaArrowLeft, FaSave, FaEdit, FaTimes, FaPlus, FaTrash,
  FaFileInvoice, FaDownload
} from 'react-icons/fa';

const FileDetails = () => {
  const navigate = useNavigate();
  const { fileName } = useParams();
  const decodedFileName = decodeURIComponent(fileName);

  const [fileData, setFileData] = useState(null);
  const [originalData, setOriginalData] = useState(null);
  const [editableData, setEditableData] = useState(null);
  const [originalIgstAmounts, setOriginalIgstAmounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const [othChrgManual, setOthChrgManual] = useState(false);

  useEffect(() => {
    const fetchFileData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await axios.get(
          `https://auto.ezkar.in/file/${encodeURIComponent(decodedFileName)}`
        );
        const data = response.data;

        setFileData(data);
        const deepCopy = structuredClone ? structuredClone(data) : JSON.parse(JSON.stringify(data));
        setOriginalData(deepCopy);
        setEditableData(deepCopy);
        setOthChrgManual(false);
        setLoading(false);
      } catch (err) {
        console.error('Fetch error:', err);
        setError('Failed to load invoice data');
        setLoading(false);
      }
    };

    fetchFileData();
  }, [decodedFileName]);

  const isTobaccoItem = (item) =>
    item.HsnCd === '24011090' ||
    item.PrdDesc?.toLowerCase().includes('asha jyoti mrp 4') ||
    item.PrdDesc?.toLowerCase().includes('unmanufactured tobacco');

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
      const response = await axios.get(
        `https://auto.ezkar.in/file/${encodeURIComponent(decodedFileName)}/download`,
        { responseType: 'blob' }
      );

      const blob = new Blob([response.data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = decodedFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      navigate(-1);
    } catch (err) {
      console.error('Download failed:', err);
      alert('Could not download original file');
    }
  };

  const handleDownloadCurrent = () => {
    if (!fileData) return;
    const jsonString = JSON.stringify(fileData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const dateStr = new Date().toISOString().slice(0, 10);
    link.download = `${decodedFileName.replace(/\.json$/i, '')}_edited_${dateStr}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const startEditing = () => {
    const copy = structuredClone ? structuredClone(fileData) : JSON.parse(JSON.stringify(fileData));
    setEditableData(copy);

    // Preserve original IGST amounts per item (keyed by SlNo)
    const igstMap = {};
    copy.data[0].ItemList.forEach((item) => {
      igstMap[item.SlNo] = Number(item.IgstAmt || 0);
    });
    setOriginalIgstAmounts(igstMap);

    setOthChrgManual(false);
    setEditing(true);
    setSaveStatus('');
  };

  const cancelEditing = () => {
    setEditableData(null);
    setOriginalIgstAmounts({});
    setOthChrgManual(false);
    setEditing(false);
    setSaveStatus('');
  };

  const handleItemChange = (index, field, value) => {
    setEditableData((prev) => {
      if (!prev) return prev;
      const newData = structuredClone ? structuredClone(prev) : JSON.parse(JSON.stringify(prev));
      const item = newData.data[0].ItemList[index];

      if (['Qty', 'UnitPrice', 'GstRt', 'Discount'].includes(field)) {
        item[field] = value === '' ? 0 : parseFloat(value) || 0;
      } else {
        item[field] = value;
      }

      const qty = Number(item.Qty || 0);
      const unitPrice = Number(item.UnitPrice || 0);
      const discount = Number(item.Discount || 0);

      const gross = qty * unitPrice;
      const discAmt = gross * (discount / 100);
      const taxable = gross - discAmt;

      // ────────────────────────────────────────────────
      // Keep ORIGINAL IGST amount — do NOT recalculate
      const originalIgst = originalIgstAmounts[item.SlNo] || 0;
      item.IgstAmt = Number(originalIgst.toFixed(2));
      // ────────────────────────────────────────────────

      item.TotAmt = Number(taxable.toFixed(2));
      item.AssAmt = Number(taxable.toFixed(2));
      item.TotItemVal = Number((taxable + originalIgst).toFixed(2));

      item.CgstAmt = 0;
      item.SgstAmt = 0;

      updateTotals(newData);
      return newData;
    });
  };

  const updateTotals = (data) => {
    if (!data?.data?.[0]?.ItemList) return;
    const items = data.data[0].ItemList;

    let assVal = 0;
    let igstVal = 0;
    let totInvValBase = 0;

    items.forEach((item) => {
      assVal += Number(item.AssAmt || 0);
      igstVal += Number(item.IgstAmt || 0);          // uses preserved original value
      totInvValBase += Number(item.TotItemVal || 0);
    });

    const valDtls = data.data[0].ValDtls || {};
    valDtls.AssVal = Number(assVal.toFixed(2));
    valDtls.IgstVal = Number(igstVal.toFixed(2));
    valDtls.CgstVal = 0;
    valDtls.SgstVal = 0;
    valDtls.CesVal = 0;
    valDtls.Discount = 0;

    if (!othChrgManual) {
      valDtls.OthChrg = calculateAutoOtherCharges(items);
    }

    const othChrg = Number(valDtls.OthChrg || 0);
    const rndOff = Number(valDtls.RndOffAmt || 0);
    valDtls.TotInvVal = Number((totInvValBase + othChrg + rndOff).toFixed(2));
  };

  const handleOthChrgChange = (e) => {
    const value = parseFloat(e.target.value) || 0;
    setEditableData((prev) => {
      if (!prev) return prev;
      const newData = structuredClone ? structuredClone(prev) : JSON.parse(JSON.stringify(prev));
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
      const newData = structuredClone ? structuredClone(prev) : JSON.parse(JSON.stringify(prev));
      const items = newData.data[0].ItemList;
      const newSlNo = String(items.length + 1);

      const newItem = {
        SlNo: newSlNo,
        PrdDesc: 'New Product',
        IsServc: 'N',
        HsnCd: '',
        Qty: 1,
        FreeQty: 0,
        Unit: 'BAG',
        UnitPrice: 0,
        TotAmt: 0,
        Discount: 0,
        AssAmt: 0,
        GstRt: 18,
        IgstAmt: 0,               // new items → IGST = 0
        CgstAmt: 0,
        SgstAmt: 0,
        CesRt: 0,
        CesAmt: 0,
        CesNonAdvlAmt: 0,
        TotItemVal: 0,
      };

      items.push(newItem);

      // Also store 0 as "original" IGST for new item
      setOriginalIgstAmounts((prev) => ({
        ...prev,
        [newSlNo]: 0,
      }));

      updateTotals(newData);
      return newData;
    });
  };

  const deleteItem = (index) => {
    setEditableData((prev) => {
      if (!prev) return prev;
      const newData = structuredClone ? structuredClone(prev) : JSON.parse(JSON.stringify(prev));
      const items = newData.data[0].ItemList;
      const deletedSlNo = items[index].SlNo;

      items.splice(index, 1);

      // Renumber SlNo
      items.forEach((item, i) => {
        item.SlNo = String(i + 1);
      });

      // Clean up original IGST map
      setOriginalIgstAmounts((prev) => {
        const updated = { ...prev };
        delete updated[deletedSlNo];
        // Re-key remaining items if needed (optional - usually not necessary)
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
      setSaveStatus('nochange');
      setTimeout(() => setSaveStatus(''), 2000);
      cancelEditing();
      return;
    }

    setSaveStatus('saving');

    try {
      const payload = {
        ItemList: editableData.data[0].ItemList,
        ValDtls: editableData.data[0].ValDtls,
      };

      await axios.post(
        `https://auto.ezkar.in/file/${encodeURIComponent(decodedFileName)}/update-items`,
        payload,
        { headers: { 'Content-Type': 'application/json' } }
      );

      const committed = structuredClone ? structuredClone(editableData) : JSON.parse(JSON.stringify(editableData));
      setFileData(committed);
      setOriginalData(committed);

      setSaveStatus('success');
      setTimeout(() => setSaveStatus(''), 3000);
      cancelEditing();
    } catch (err) {
      console.error('Save failed:', err);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(''), 4000);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-lg">Loading invoice...</div>;
  if (error || !fileData?.data?.[0]) {
    return <div className="min-h-screen flex items-center justify-center text-red-600 text-xl">{error || 'Invoice not found'}</div>;
  }

  const displayData = editing ? editableData : fileData;
  const invoice = displayData.data[0];
  const items = invoice.ItemList || [];
  const valDtls = invoice.ValDtls || {};

  const totalAmount = items.reduce((sum, item) => sum + Number(item.TotAmt || 0), 0);
  const totalTaxable = items.reduce((sum, item) => sum + Number(item.AssAmt || 0), 0);
  const totalIGST = items.reduce((sum, item) => sum + Number(item.IgstAmt || 0), 0);
  const totalItemVal = items.reduce((sum, item) => sum + Number(item.TotItemVal || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Sticky Header */}
      <div className="bg-white shadow-sm sticky top-0 z-20">
        <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-700 hover:text-blue-700 font-medium"
          >
            <FaArrowLeft /> Back
          </button>

          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            {saveStatus === 'saving' && <span className="text-blue-600 font-medium">Saving...</span>}
            {saveStatus === 'success' && <span className="text-green-600 font-medium">✓ Saved successfully</span>}
            {saveStatus === 'error' && <span className="text-red-600 font-medium">Save failed</span>}
            {saveStatus === 'nochange' && <span className="text-gray-500">No changes to save</span>}

            {editing ? (
              <>
                <button
                  onClick={handleSave}
                  disabled={!hasChanges() || saveStatus === 'saving'}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-5 py-2 rounded flex items-center gap-2 shadow-sm font-medium"
                >
                  <FaSave /> Save
                </button>
                <button
                  onClick={cancelEditing}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-5 py-2 rounded flex items-center gap-2 shadow-sm font-medium"
                >
                  <FaTimes /> Cancel
                </button>
              </>
            ) : (
              <button
                onClick={startEditing}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded flex items-center gap-2 shadow-sm font-medium"
              >
                <FaEdit /> Edit Items
              </button>
            )}

            <button
              onClick={handleDownloadOriginal}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded flex items-center gap-2 shadow-sm font-medium"
            >
              <FaDownload /> Original
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Invoice Header Card */}
        <div className="bg-white rounded-xl shadow mb-6 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="flex items-center gap-4">
                <FaFileInvoice className="text-5xl opacity-90" />
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold">TAX INVOICE</h1>
                  <p className="text-blue-100 mt-1">
                    {invoice.TranDtls?.TaxSch || 'GST'} • {invoice.TranDtls?.SupTyp || 'B2B'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">₹{Number(valDtls.TotInvVal || 0).toFixed(2)}</div>
                <div className="text-blue-100 mt-2 text-sm">
                  <strong>Invoice No:</strong> {invoice.DocDtls?.No || '-'}<br />
                  <strong>Date:</strong> {invoice.DocDtls?.Dt || '-'}
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 grid md:grid-cols-2 gap-8 border-t">
            <div>
              <h3 className="font-semibold text-gray-800 mb-3 text-lg">Seller</h3>
              <div className="text-sm space-y-1.5">
                <p><span className="text-gray-500">GSTIN:</span> {invoice.SellerDtls?.Gstin || '-'}</p>
                <p><span className="text-gray-500">Name:</span> {invoice.SellerDtls?.LglNm || '-'}</p>
                <p><span className="text-gray-500">Place:</span> {invoice.SellerDtls?.Loc || '-'}</p>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 mb-3 text-lg">Buyer</h3>
              <div className="text-sm space-y-1.5">
                <p><span className="text-gray-500">GSTIN:</span> {invoice.BuyerDtls?.Gstin || '-'}</p>
                <p><span className="text-gray-500">Name:</span> {invoice.BuyerDtls?.LglNm || '-'}</p>
                <p><span className="text-gray-500">Place:</span> {invoice.BuyerDtls?.Loc || '-'}</p>
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
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded flex items-center gap-2 text-sm font-medium"
              >
                <FaPlus size={14} /> Add Item
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Sl</th>
                  <th className="px-4 py-3 text-left font-semibold">Description</th>
                  <th className="px-4 py-3 text-left font-semibold">HSN/SAC</th>
                  <th className="px-4 py-3 text-left font-semibold">Unit</th>
                  <th className="px-4 py-3 text-right font-semibold">Qty</th>
                  <th className="px-4 py-3 text-right font-semibold">Rate</th>
                  <th className="px-4 py-3 text-right font-semibold">Disc %</th>
                  <th className="px-4 py-3 text-right font-semibold">Amount</th>
                  <th className="px-4 py-3 text-right font-semibold">Taxable</th>
                  <th className="px-4 py-3 text-right font-semibold">GST %</th>
                  <th className="px-4 py-3 text-right font-semibold">IGST</th>
                  <th className="px-4 py-3 text-right font-semibold">Total</th>
                  {editing && <th className="px-4 py-3 text-center font-semibold">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {items.map((item, idx) => (
                  <tr key={item.SlNo || idx} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3">{item.SlNo}</td>
                    <td className="px-4 py-3">
                      {editing ? (
                        <input
                          className="w-full border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={item.PrdDesc ?? ''}
                          onChange={(e) => handleItemChange(idx, 'PrdDesc', e.target.value)}
                        />
                      ) : (
                        item.PrdDesc || '-'
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {editing ? (
                        <input
                          className="w-28 border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={item.HsnCd ?? ''}
                          onChange={(e) => handleItemChange(idx, 'HsnCd', e.target.value)}
                        />
                      ) : (
                        item.HsnCd || '-'
                      )}
                    </td>
                    <td className="px-4 py-3">{item.Unit || '-'}</td>
                    <td className="px-4 py-3 text-right">
                      {editing ? (
                        <input
                          type="number"
                          className="w-20 border border-gray-300 rounded px-2 py-1 text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={item.Qty ?? 0}
                          onChange={(e) => handleItemChange(idx, 'Qty', e.target.value)}
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
                          value={item.UnitPrice ?? 0}
                          onChange={(e) => handleItemChange(idx, 'UnitPrice', e.target.value)}
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
                          value={item.Discount ?? 0}
                          onChange={(e) => handleItemChange(idx, 'Discount', e.target.value)}
                        />
                      ) : (
                        Number(item.Discount ?? 0).toFixed(2)
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">{Number(item.TotAmt ?? 0).toFixed(2)}</td>
                    <td className="px-4 py-3 text-right font-medium">{Number(item.AssAmt ?? 0).toFixed(2)}</td>
                    <td className="px-4 py-3 text-right">
                      {editing ? (
                        <input
                          type="number"
                          step="0.1"
                          className="w-16 border border-gray-300 rounded px-2 py-1 text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={item.GstRt ?? 0}
                          onChange={(e) => handleItemChange(idx, 'GstRt', e.target.value)}
                        />
                      ) : (
                        Number(item.GstRt ?? 0).toFixed(1)
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">{Number(item.IgstAmt ?? 0).toFixed(2)}</td>
                    <td className="px-4 py-3 text-right font-bold text-blue-700">
                      {Number(item.TotItemVal ?? 0).toFixed(2)}
                    </td>
                    {editing && (
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => deleteItem(idx)}
                          className="text-red-600 hover:text-red-800 transition"
                          title="Delete item"
                        >
                          <FaTrash size={16} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}

                {/* Grand Totals Row */}
                <tr className="bg-gray-50 font-semibold">
                  <td colSpan={7} className="px-4 py-3 text-right">Grand Total</td>
                  <td className="px-4 py-3 text-right text-green-700">{totalAmount.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right text-green-700">{totalTaxable.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right"></td>
                  <td className="px-4 py-3 text-right text-green-700">{totalIGST.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right text-blue-800">{totalItemVal.toFixed(2)}</td>
                  {editing && <td></td>}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Value Details */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
          <div className="px-6 py-4 bg-gray-50 border-b">
            <h3 className="text-lg font-semibold text-gray-800">Value Details</h3>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <p className="text-sm text-gray-600">AssVal</p>
                <p className="text-xl font-bold mt-1">₹{Number(valDtls.AssVal || 0).toFixed(2)}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <p className="text-sm text-gray-600">IGST</p>
                <p className="text-xl font-bold text-emerald-700 mt-1">₹{Number(valDtls.IgstVal || 0).toFixed(2)}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <p className="text-sm text-gray-600">CGST</p>
                <p className="text-xl font-bold mt-1">₹{Number(valDtls.CgstVal || 0).toFixed(2)}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <p className="text-sm text-gray-600">SGST</p>
                <p className="text-xl font-bold mt-1">₹{Number(valDtls.SgstVal || 0).toFixed(2)}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <p className="text-sm text-gray-600">Cess</p>
                <p className="text-xl font-bold mt-1">₹{Number(valDtls.CesVal || 0).toFixed(2)}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <p className="text-sm text-gray-600">Discount</p>
                <p className="text-xl font-bold text-rose-600 mt-1">₹{Number(valDtls.Discount || 0).toFixed(2)}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <p className="text-sm text-gray-600">Other Charges</p>
                {editing ? (
                  <input
                    type="number"
                    step="0.01"
                    className="w-full text-center text-xl font-bold border border-gray-300 rounded py-2 focus:outline-none focus:ring-2 focus:ring-amber-500 mt-1"
                    value={valDtls.OthChrg ?? ''}
                    onChange={handleOthChrgChange}
                  />
                ) : (
                  <p className="text-xl font-bold text-amber-700 mt-1">
                    ₹{Number(valDtls.OthChrg || 0).toFixed(2)}
                  </p>
                )}
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
                <span className="text-lg font-medium text-blue-800">Total Invoice Value</span>
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