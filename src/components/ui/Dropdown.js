"use client";

import { useState, useEffect, useRef } from "react";
import Button from "./Button";
import { X } from "lucide-react";
import DateFormat from "../DateFormate";

export default function Dropdown({ label, children ,data ,submit,id}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  console.log(id)
// console.log("messages response ",submit);
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative  text-left w-[20%]" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between  px-4 py-2 text-sm font-medium text-gray-700 bg-white w-fit border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
      >
        {label}
        <span className="ml-2 transition-transform duration-200" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
          ▼
        </span>
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300" 
            onClick={() => setIsOpen(false)} 
          />
          <div 
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white border border-gray-200 rounded-xl shadow-2xl transform transition-all duration-300 ease-out opacity-100 scale-100 z-50"
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">{label}</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-full hover:bg-gray-100 transition-colors duration-200"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-4 space-y-2 grid grid-cols-1">
            <div className="bg-gray-50 rounded-lg p-4 shadow-sm">
                <p className="text-gray-800 font-medium text-base leading-relaxed mb-3">{data?.messages?.[0]?.text}</p>
                <div className="flex items-center">
                  <span className="text-sm text-gray-600">{DateFormat(data?.date)}</span>
                </div>
              </div>
              {children}
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-end space-x-2">
              <Button
                variant="secondary"
                size="small"
                // onClick={()=>submit(id)}
                onClick={() => (submit,setIsOpen(false))}
                className="flex items-center gap-2"
              >
                Done
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

