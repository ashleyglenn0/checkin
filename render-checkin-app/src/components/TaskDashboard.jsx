import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFirestore, collection, query, where, onSnapshot } from 'firebase/firestore';
import '../styles/taskdashboardstyles.css';

const TaskDashboard = () => {
  const [taskCheckIns, setTaskCheckIns] = useState({});
  const [selectedEvent, setSelectedEvent] = useState('ATL Tech Week'); // Default event
  const db = getFirestore();
  const navigate = useNavigate();

  const tasks = selectedEvent === 'ATL Tech Week'
    ? ['Registration', 'Room Setup', 'Tech Support', 'Food Service', 'Stage Crew', 'General Support']
    : ['Registration', 'Swag Distribution', 'Tech Support', 'Check-in Desk', 'Room Setup', 'General Support'];

  useEffect(() => {
    if (!selectedEvent) return;

    const q = query(collection(db, 'task_checkins'), where('event', '==', selectedEvent));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = {};
      snapshot.forEach((doc) => {
        const checkIn = doc.data();
        if (!data[checkIn.task]) {
          data[checkIn.task] = [];
        }
        data[checkIn.task].push({ id: doc.id, ...checkIn });
      });
      setTaskCheckIns(data);
    });

    return () => unsubscribe();
  }, [selectedEvent, db]);

  const calculateTimeSpent = (checkinTime) => {
    const now = new Date();
    const checkinDate = new Date(checkinTime);
    const diffMs = now - checkinDate;
    const diffMins = Math.floor(diffMs / 60000);
    return diffMins;
  };

  return (
    <div className={`task-dashboard-container ${selectedEvent === 'ATL Tech Week' ? 'atl-tech-week-theme' : 'render-event-theme'}`}>
      {/* Event Toggle Button */}
      <div className="event-toggle">
        <button
          className={selectedEvent === 'ATL Tech Week' ? 'active' : ''}
          onClick={() => setSelectedEvent('ATL Tech Week')}
        >
          ATL Tech Week
        </button>
        <button
          className={selectedEvent === 'Render' ? 'active' : ''}
          onClick={() => setSelectedEvent('Render')}
        >
          Render
        </button>
      </div>

      <h2>{selectedEvent} Task Dashboard</h2>
      {tasks.map((task) => (
        <details key={task} className="task-panel">
          <summary>{task}</summary>
          <table>
            <thead>
              <tr>
                <th>Volunteer</th>
                <th>Team Lead</th>
                <th>Check-in Time</th>
                <th>Time Spent (mins)</th>
              </tr>
            </thead>
            <tbody>
              {taskCheckIns[task] && taskCheckIns[task].map((volunteer) => (
                <tr key={volunteer.id}>
                  <td>{volunteer.firstName} {volunteer.lastName}</td>
                  <td>{volunteer.teamLead}</td>
                  <td>{new Date(volunteer.checkinTime).toLocaleTimeString()}</td>
                  <td>{calculateTimeSpent(volunteer.checkinTime)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      ))}

      {/* Bottom Buttons */}
      <div className="dashboard-buttons">
        <button onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
        <button onClick={() => console.log('Exporting report...')}>Export to Report</button>
      </div>
    </div>
  );
};

export default TaskDashboard;
