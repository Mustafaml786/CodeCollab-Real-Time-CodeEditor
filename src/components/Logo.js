import React from 'react';

const Logo = () => {
    return (
        <div className="logoWrapper">
            <div className="logoContent">
                <svg 
                    width="32" 
                    height="32" 
                    viewBox="0 0 32 32" 
                    fill="none" 
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path 
                        d="M6 6L26 26M26 6L6 26" 
                        stroke="#2563eb" 
                        strokeWidth="3" 
                        strokeLinecap="round" 
                    />
                    <path 
                        d="M16 4L28 16L16 28L4 16L16 4" 
                        stroke="#2563eb" 
                        strokeWidth="3" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                    />
                </svg>
                <span className="logoText">CodeCollab</span>
            </div>
        </div>
    );
};

export default Logo; 