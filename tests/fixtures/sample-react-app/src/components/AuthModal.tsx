import React from 'react';

const API_URL = 'https://api.example.com';

export const AuthModal = ({ isOpen }: { isOpen: boolean }) => {
  if (!isOpen) return null;
  return (
    <div className="modal">
      <h2>Sign In</h2>
      <p>Connecting to {API_URL}</p>
    </div>
  );
};
