import React, { useRef, useState } from "react";

export default function FileDnD({
  width = "100%",
  height = "100%",
  className = "",
  onFileDrop = (files) => console.log(files),
}) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length) {
      onFileDrop(files);
    }
  };

  const handleClick = () => {
    inputRef.current && inputRef.current.click();
  };

  const handleInputChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length) {
      onFileDrop(files);
    }
  };

  return (
    <div
      className={`
                file-dnd
                ${className}
                flex items-center justify-center cursor-pointer
                border-2 border-dashed rounded-lg
                transition-colors duration-200
                ${isDragging ? " border-blue-400" : " border-gray-300"}
            `}
      style={{
        width,
        height,
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleInputChange}
      />
      <span className="text-gray-500 text-center select-none">
        {isDragging
          ? "Drop files here..."
          : "Drag & drop files here, or click to select"}
      </span>
    </div>
  );
}
