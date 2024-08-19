import React, { useState, useEffect } from 'react';
import { Scheduler, DayView, WeekView, MonthView, Appointments, AppointmentForm, AppointmentTooltip } from '@devexpress/dx-react-scheduler-material-ui';
import { ViewState } from '@devexpress/dx-react-scheduler';
import { db } from './firebase';
import { collection, getDocs} from 'firebase/firestore';
import 'devextreme/dist/css/dx.common.css';
import 'devextreme/dist/css/dx.light.css';
import { locale } from 'devextreme/localization';

locale(navigator.language);

const SchedulerComponent = () => {
  const [data, setData] = useState([]);
  const [currentViewName, setCurrentViewName] = useState('Week');

  useEffect(() => {
    const fetchData = async () => {
      const querySnapshot = await getDocs(collection(db, 'events'));
      const events = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setData(events);
    };

    fetchData();
  }, []);

  //TODO: Implement onCommitChanges function

  return (
    <Scheduler data={data}>
      <ViewState currentViewName={currentViewName} onCurrentViewNameChange={setCurrentViewName} />
      {/* <EditingState onCommitChanges={} /> */}
      <DayView />
      <WeekView />
      <MonthView />
      <Appointments />
      <AppointmentTooltip showOpenButton showDeleteButton />
      <AppointmentForm />
    </Scheduler>
  );
};

export default SchedulerComponent;