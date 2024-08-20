import React, { useState, useEffect } from 'react';
import {
  Scheduler, DayView, WeekView, MonthView,
  Appointments, AppointmentForm, AppointmentTooltip,
  Toolbar, DateNavigator, ViewSwitcher, 
  AllDayPanel, EditRecurrenceMenu,
} from '@devexpress/dx-react-scheduler-material-ui';
import { ViewState, EditingState, IntegratedEditing,} from '@devexpress/dx-react-scheduler';
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
    try {
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
            const startDate = new Date(changed[event.id].startDate);
            const endDate = new Date(changed[event.id].endDate);
  
            if (isNaN(startDate) || isNaN(endDate)) {
              console.error('Invalid date in changed event:', changed[event.id]);
              throw new RangeError('Invalid date in changed event');
            }
  
            let updatedEvent = {
              ...event,
              ...changed[event.id],
              startDate: startDate.toISOString(),
              endDate: endDate.toISOString(),
            };
  
            if (!changed[event.id].rRule) {
              updatedEvent = {
                ...updatedEvent,
                rRule: null,
              };
            }
  
            return updatedEvent;
          }
          return event;
        });
  
        setData(updatedData);
  
        for (const id of Object.keys(changed)) {
          const startDate = new Date(changed[id].startDate);
          const endDate = new Date(changed[id].endDate);
  
          if (isNaN(startDate) || isNaN(endDate)) {
            console.error('Invalid date in changed event:', changed[id]);
            throw new RangeError('Invalid date in changed event');
          }
  
          const updatedEvent = {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            title: changed[id].title,
            notes: changed[id].notes,
            allDay: changed[id].allDay || false,
          };
  
          if (!changed[id].rRule) {
            updatedEvent.rRule = null;
          }
  
          await updateDoc(doc(db, 'events', id), updatedEvent);
        }
      }
  
      if (deleted !== undefined) {
        const eventToDelete = data.find(event => event.id === deleted);
        if (eventToDelete) {
          if (eventToDelete.rRule) {
            setData(prevData => prevData.filter(event => event.id !== deleted));
            await deleteDoc(doc(db, 'events', deleted));
          } else {
            setData(prevData => prevData.filter(event => event.id !== deleted));
            await deleteDoc(doc(db, 'events', deleted));
          }
        }
      }
    } catch (error) {
      console.error('Error in commitChanges:', error);
    }
  };
  

  return (
    <Scheduler data={data} locale="pl-PL" recurrenceEditMode="occurrence">
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
        allowDeleting={true}
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
      <EditRecurrenceMenu />
      <AppointmentTooltip showOpenButton showDeleteButton />
      <AppointmentForm />
    </Scheduler>
  );
};

export default SchedulerComponent;