import React, { useState } from 'react';

const EditableValue = ({ value, onSave, editing, type = 'text', className = '' }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);

  const handleBlur = () => {
    setIsEditing(false);
    if (editValue !== value) {
      onSave(editValue);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      setIsEditing(false);
      if (editValue !== value) {
        onSave(editValue);
      }
    }
  };

  if (!editing) {
    return <span className={className}>{value}</span>;
  }

  if (isEditing) {
    return (
      <input
        type={type}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleBlur}
        onKeyPress={handleKeyPress}
        className={`w-full px-2 py-1 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
        autoFocus
        step={type === 'number' ? '0.01' : undefined}
      />
    );
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      className={`cursor-pointer hover:bg-yellow-50 px-2 py-1 rounded border border-transparent hover:border-yellow-300 transition-all ${className}`}
    >
      {value}
    </div>
  );
};

export default EditableValue;