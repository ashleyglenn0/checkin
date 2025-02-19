import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getFirestore, doc, getDoc, setDoc, collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import "../styles/taskcheckinstyles.css";

const TaskCheckInForm = () => {
  const [searchParams] = useSearchParams();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [task, setTask] = useState('');
  const [teamLead, setTeamLead] = useState('');
  const [event, setEvent] = useState('');
  const [error, setError] = useState(null);

  const db = getFirestore();

  useEffect(() => {
    setTask(searchParams.get('task') || '');
    setTeamLead(searchParams.get('teamLead') || '');
    setEvent(searchParams.get('event') || '');
  }, [searchParams]);

  const verifyAdminCheckIn = async (first, last) => {
    const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format
    const checkInsRef = collection(db, 'check_ins');
    const q = query(
      checkInsRef,
      where('first_name', '==', first),
      where('last_name', '==', last),
      where('status', '==', 'Checked In'),
      where('timestamp', '>=', today) // Ensure it's for today
    );

    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty; // Returns true if the volunteer is checked in by an admin
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    const timestamp = new Date().toISOString();

    try {
      const isCheckedIn = await verifyAdminCheckIn(firstName, lastName);
      if (!isCheckedIn) {
        setError('This volunteer has not checked in with an admin and cannot check into a task.');
        return;
      }

      const volunteerDocRef = doc(db, 'volunteers', `${firstName}_${lastName}`.toLowerCase());
      const volunteerDoc = await getDoc(volunteerDocRef);

      if (volunteerDoc.exists()) {
        const currentTask = volunteerDoc.data().currentTask;

        if (currentTask && currentTask.id && currentTask.task !== task) {
          const lastTaskRef = doc(db, 'task_checkins', currentTask.id);
          await updateDoc(lastTaskRef, { checkoutTime: timestamp });
        }
      }

      const newTaskCheckinRef = doc(db, 'task_checkins', `${firstName}_${lastName}_${timestamp}`);
      await setDoc(newTaskCheckinRef, {
        first_name: firstName,
        last_name: lastName,
        task,
        checkinTime: timestamp,
        checkoutTime: null,
        teamLead,
        event
      });

      await setDoc(volunteerDocRef, { currentTask: { id: `${firstName}_${lastName}_${timestamp}`, task } }, { merge: true });

      alert(`Checked in: ${firstName} ${lastName} for ${task}`);
      setFirstName('');
      setLastName('');
    } catch (error) {
      console.error('Error checking in:', error);
      setError('Failed to check in. Please try again.');
    }
  };

  return (
    <div className={`task-checkin-form ${event === 'ATL Tech Week' ? 'atl-tech-week' : 'render-event'}`}>
      <h2>Task Check-In Form</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>First Name:</label>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Last Name:</label>
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Task:</label>
          <p>{task}</p>
        </div>
        <div>
          <label>Team Lead:</label>
          <p>{teamLead}</p>
        </div>
        {error && <p className="error">{error}</p>}
        <button type="submit">Check In</button>
      </form>
    </div>
  );
};

export default TaskCheckInForm;
