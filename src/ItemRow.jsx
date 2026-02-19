import React from 'react';
import { FaTrash } from 'react-icons/fa';
import EditableValue from './EditableField';

const EditableItemRow = ({ item, index, editing, onValueChange, onDelete }) => {
  return (
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-3 text-sm text-gray-900">{item.SlNo}</td>
      <td className="px-4 py-3 text-sm text-gray-900">
        <EditableValue
          value={item.PrdDesc}
          onSave={(val) => onValueChange('PrdDesc', val)}
          editing={editing}
          className="text-sm"
        />
      </td>
      <td className="px-4 py-3 text-sm text-gray-900 text-right">
        <EditableValue
          value={item.HsnCd}
          onSave={(val) => onValueChange('HsnCd', val)}
          editing={editing}
          className="text-sm"
        />
      </td>
      <td className="px-4 py-3 text-sm text-gray-900 text-right">
        <EditableValue
          value={item.Qty}
          onSave={(val) => onValueChange('Qty', parseFloat(val) || 0)}
          editing={editing}
          type="number"
          className="text-sm"
        />
      </td>
      <td className="px-4 py-3 text-sm text-gray-900 text-right">
        <EditableValue
          value={item.Unit}
          onSave={(val) => onValueChange('Unit', val)}
          editing={editing}
          className="text-sm"
        />
      </td>
      <td className="px-4 py-3 text-sm text-gray-900 text-right">
        <EditableValue
          value={item.UnitPrice}
          onSave={(val) => onValueChange('UnitPrice', parseFloat(val) || 0)}
          editing={editing}
          type="number"
          className="text-sm"
        />
      </td>
      <td className="px-4 py-3 text-sm text-gray-900 text-right">
        <EditableValue
          value={item.GstRt}
          onSave={(val) => onValueChange('GstRt', parseFloat(val) || 0)}
          editing={editing}
          type="number"
          className="text-sm"
        />
      </td>
      <td className="px-4 py-3 text-sm text-gray-900 text-right">
        ₹{parseFloat(item.IgstAmt).toFixed(2)}
      </td>
      <td className="px-4 py-3 text-sm text-gray-900 text-right">
        ₹{parseFloat(item.TotItemVal).toFixed(2)}
      </td>
      {editing && (
        <td className="px-4 py-3 text-sm text-gray-900 text-center">
          <button
            onClick={onDelete}
            className="text-red-500 hover:text-red-700 transition-colors"
          >
            <FaTrash />
          </button>
        </td>
      )}
    </tr>
  );
};

export default EditableItemRow;