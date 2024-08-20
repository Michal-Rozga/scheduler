import React, { useState, useEffect } from 'react';
import {
  Scheduler, DayView, WeekView, MonthView,
  Appointments, AppointmentForm, AppointmentTooltip,
  Toolbar, DateNavigator, ViewSwitcher, 
  AllDayPanel, EditRecurrenceMenu,
} from '@devexpress/dx-react-scheduler-material-ui';
import { ViewState, EditingState, IntegratedEditing } from '@devexpress/dx-react-scheduler';
import { db } from './firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import 'devextreme/dist/css/dx.common.css';
import 'devextreme/dist/css/dx.light.css';
import { locale } from 'devextreme/localization';
import { RRule, RRuleSet } from 'rrule';

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

  const validateDate = (dateString) => {
    const date = new Date(dateString);
    return !isNaN(date) && dateString !== '';
  };

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
        for (const id of Object.keys(changed)) {
          const updatedFields = changed[id];
          const event = data.find(event => event.id === id);
  
          if (event) {
            const startDate = updatedFields.startDate ? new Date(updatedFields.startDate) : new Date(event.startDate);
            const endDate = updatedFields.endDate ? new Date(updatedFields.endDate) : new Date(event.endDate);
  
            if (isNaN(startDate) || isNaN(endDate)) {
              console.error('Invalid date in changed event:', updatedFields);
              throw new RangeError('Invalid date in changed event');
            }
  
            const updatedEvent = {
              ...event,
              ...updatedFields,
              startDate: startDate.toISOString(),
              endDate: endDate.toISOString(),
              rRule: updatedFields.rRule || event.rRule,
            };
  
            setData(prevData =>
              prevData.map(e => (e.id === id ? updatedEvent : e))
            );
  
            await updateDoc(doc(db, 'events', id), updatedEvent);
          }
        }
      }
  
      if (deleted !== undefined) {
        const eventToDelete = data.find(event => event.id === deleted);
        if (eventToDelete) {
          if (eventToDelete.rRule) {
            const rrule = RRule.fromString(eventToDelete.rRule);
            const rruleSet = new RRuleSet();
            rruleSet.rrule(rrule);
  
            const occurrences = rrule.all();
            const eventStartDate = new Date(eventToDelete.startDate);
  
            const updatedData = data.filter(event => {
              const eventDate = new Date(event.startDate);
              return !occurrences.some(occurrence =>
                eventDate.getTime() === occurrence.getTime()
              );
            });
  
            setData(updatedData);
  
            await deleteDoc(doc(db, 'events', deleted));
  
            const querySnapshot = await getDocs(collection(db, 'events'));
            const events = querySnapshot.docs.map(doc => ({
              id: doc.id,
              startDate: new Date(doc.data().startDate).toISOString(),
              endDate: new Date(doc.data().endDate).toISOString(),
              title: doc.data().title,
              notes: doc.data().notes,
              allDay: doc.data().allDay || false,
              rRule: doc.data().rRule || null,
            }));
            setData(events);
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