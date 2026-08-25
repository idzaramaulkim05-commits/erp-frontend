import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const AktivasiInstalasiView: React.FC = () => {
  const { user } = useAuth();
  const role = user?.role ?? 'superadmin';
  const redirectTarget = role === 'field_tech'
    ? '/app/pengerjaan-instalasi-lapangan'
    : '/app/qc-instalasi-noc';

  return <Navigate to={redirectTarget} replace />;
};
