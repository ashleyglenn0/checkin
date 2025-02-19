import React from 'react';
import { QRCodeCanvas } from 'qrcode.react';

const admins = [
  { id: 'admin_ashley', name: 'Ashley' },
  { id: 'admin_mikal', name: 'Mikal' },
  { id: 'admin_reba', name: 'Reba' }
];

const teamLeads = [
  { id: 'teamlead1', name: 'John Doe', task: 'Registration' },
  { id: 'teamlead2', name: 'Jane Smith', task: 'Setup' },
  { id: 'teamlead3', name: 'Sam Taylor', task: 'Tech Support' }
];

const QRGenerator = () => {
  const appUrl = 'https://volunteercheckin-3659e.web.app/checkin';

  return (
    <div>
      <h2>Admin QR Codes</h2>
      <div style={{ display: 'flex', gap: '20px' }}>
        {admins.map(admin => (
          <div key={admin.id} style={{ textAlign: 'center' }}>
            <QRCodeCanvas
              value={`${appUrl}?admin_id=${admin.id}`}
              size={200}
              level="H"
            />
            <p>{admin.name}</p>
          </div>
        ))}
      </div>

      <h2>Team Lead QR Codes</h2>
      <div style={{ display: 'flex', gap: '20px' }}>
        {teamLeads.map(lead => (
          <div key={lead.id} style={{ textAlign: 'center' }}>
            <QRCodeCanvas
              value={`${appUrl}?teamlead_id=${lead.id}&task=${encodeURIComponent(lead.task)}`}
              size={200}
              level="H"
            />
            <p>{lead.name} - {lead.task}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QRGenerator;
