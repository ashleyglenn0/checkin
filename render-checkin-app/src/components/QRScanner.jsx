import React, { useState } from 'react';
import { QrReader } from 'react-qr-reader';
import { useNavigate } from 'react-router-dom';

const QRScanner = () => {
  const [scanResult, setScanResult] = useState(null);
  const navigate = useNavigate();

  const handleScan = (result) => {
    if (result) {
      setScanResult(result.text || result);  // Handles different result formats
      navigate(result.text || result);       // Navigate to the scanned URL
    }
  };

  const handleError = (error) => {
    console.error('QR Scan Error:', error);
  };

  return (
    <div className="qr-scanner-container">
      <h2>Scan QR Code</h2>
      <QrReader
        delay={300}
        onError={handleError}
        onResult={handleScan}
        constraints={{ facingMode: 'environment' }} // Back camera by default
        style={{ width: '100%' }}
      />
      {scanResult && <p>Scanned: {scanResult}</p>}
    </div>
  );
};

export default QRScanner;
