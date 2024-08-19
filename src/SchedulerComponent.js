import React, { useState, useEffect } from 'react';
import { Scheduler, DayView, WeekView, MonthView, Appointments, AppointmentForm, AppointmentTooltip, Toolbar, DateNavigator, ViewSwitcher, AllDayPanel } from '@devexpress/dx-react-scheduler-material-ui';
import { ViewState, EditingState, IntegratedEditing } from '@devexpress/dx-react-scheduler';
import { db } from './firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import 'devextreme/dist/css/dx.common.css';
import 'devextreme/dist/css/dx.light.css';
import { locale } from 'devextreme/localization';

locale(navigator.language);

const SchedulerComponent = () => {
  const [data, setData] = useState([]);
  const [currentViewName, setCurrentViewName] = useState('Week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [editingAppointment, setEditingAppointment] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const querySnapshot = await getDocs(collection(db, 'events'));
      const events = querySnapshot.docs.map(doc => {
        const eventData = doc.data();
        return {
          id: doc.id,
          startDate: new Date(eventData.startDate).toISOString(),
          endDate: new Date(eventData.endDate).toISOString(),
          title: eventData.title,
          notes: eventData.notes,
          allDay: eventData.allDay || false,
          rRule: eventData.rRule || null,
        };
      });
      setData(events);
    };

    fetchData();
  }, []);

  const commitChanges = async ({ added, changed, deleted }) => {
    if (added) {
      const newEvent = {
        startDate: new Date(added.startDate).toISOString(),
        endDate: new Date(added.endDate).toISOString(),
        title: added.title,
        notes: added.notes,
        allDay: added.allDay || false,
        rRule: added.rRule || null,
      };
      const docRef = await addDoc(collection(db, 'events'), newEvent);
      setData(prevData => [...prevData, { id: docRef.id, ...newEvent }]);
    }
    if (changed) {
      const updatedData = data.map(event => {
        if (changed[event.id]) {
          return {
            ...event,
            ...changed[event.id],
            startDate: new Date(changed[event.id].startDate).toISOString(),
            endDate: new Date(changed[event.id].endDate).toISOString(),
          };
        }
        return event;
      });
      setData(updatedData);
      Object.keys(changed).forEach(async id => {
        await updateDoc(doc(db, 'events', id), {
          startDate: new Date(changed[id].startDate).toISOString(),
          endDate: new Date(changed[id].endDate).toISOString(),
          title: changed[id].title,
          notes: changed[id].notes,
          allDay: changed[id].allDay || false,
          rRule: changed[id].rRule || null,
        });
      });
    }
    if (deleted !== undefined) {
      const updatedData = data.filter(event => event.id !== deleted);
      setData(updatedData);
      await deleteDoc(doc(db, 'events', deleted));
    }
  };

  return (
    <Scheduler data={data} locale="pl-PL">
      <ViewState
        currentDate={currentDate}
        onCurrentDateChange={setCurrentDate}
        currentViewName={currentViewName}
        onCurrentViewNameChange={setCurrentViewName}
      />
      <EditingState
        onCommitChanges={commitChanges}
        editingAppointment={editingAppointment}
        onEditingAppointmentChange={setEditingAppointment}
      />
      <IntegratedEditing />
      <DayView startDayHour={9} endDayHour={19} />
      <WeekView startDayHour={9} endDayHour={19} />
      <MonthView />
      <AllDayPanel />
      <Toolbar />
      <DateNavigator />
      <ViewSwitcher />
      <Appointments />
      <AppointmentTooltip showOpenButton showDeleteButton />
      <AppointmentForm />
    </Scheduler>
  );
};

export default SchedulerComponent;