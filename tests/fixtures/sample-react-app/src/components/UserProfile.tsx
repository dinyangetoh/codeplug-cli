import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { formatDate } from '../utils/formatDate';

export const UserProfile = () => {
  const { user } = useAuth();
  return (
    <div>
      <h1>{user?.name}</h1>
      <p>Joined: {formatDate(user?.createdAt)}</p>
    </div>
  );
};
