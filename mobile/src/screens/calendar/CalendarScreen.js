import { useCallback, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import styles from './CalendarScreen.styles';

LocaleConfig.locales['pt-br'] = {
  monthNames: ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'],
  monthNamesShort: ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'],
  dayNames: ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'],
  dayNamesShort: ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'],
};
LocaleConfig.defaultLocale = 'pt-br';

function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}min`;
  if (m > 0) return `${m}min ${String(s).padStart(2, '0')}s`;
  return `${s}s`;
}

export default function CalendarScreen() {
  const [sessionsByDate, setSessionsByDate] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      fetchSessions();
    }, [])
  );

  async function fetchSessions() {
    setLoading(true);
    try {
      const { data } = await api.get('/sessions/by-date');
      setSessionsByDate(data);
    } catch {
      setSessionsByDate({});
    } finally {
      setLoading(false);
    }
  }

  const markedDates = Object.keys(sessionsByDate).reduce((acc, date) => {
    acc[date] = {
      marked: true,
      dotColor: '#E8FF47',
      selected: date === selectedDate,
      selectedColor: '#E8FF47',
    };
    return acc;
  }, {});

  if (selectedDate && !markedDates[selectedDate]) {
    markedDates[selectedDate] = { selected: true, selectedColor: '#2a2a2a' };
  }

  const selectedSessions = selectedDate ? (sessionsByDate[selectedDate] || []) : [];

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color="#E8FF47" size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Calendar
        markedDates={markedDates}
        onDayPress={(day) => setSelectedDate(day.dateString)}
        theme={{
          backgroundColor: '#121212',
          calendarBackground: '#1E1E1E',
          textSectionTitleColor: '#aaa',
          selectedDayBackgroundColor: '#E8FF47',
          selectedDayTextColor: '#121212',
          todayTextColor: '#E8FF47',
          todayBackgroundColor: 'transparent',
          dayTextColor: '#fff',
          textDisabledColor: '#444',
          dotColor: '#E8FF47',
          selectedDotColor: '#121212',
          arrowColor: '#E8FF47',
          monthTextColor: '#fff',
          textMonthFontWeight: 'bold',
          textDayFontSize: 14,
          textMonthFontSize: 16,
          textDayHeaderFontSize: 12,
        }}
        style={styles.calendar}
      />

      <View style={styles.detailContainer}>
        {selectedDate ? (
          selectedSessions.length > 0 ? (
            <FlatList
              data={selectedSessions}
              keyExtractor={(_, i) => String(i)}
              ListHeaderComponent={
                <Text style={styles.detailTitle}>
                  {new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR', {
                    weekday: 'long', day: 'numeric', month: 'long',
                  })}
                </Text>
              }
              renderItem={({ item }) => (
                <View style={styles.sessionCard}>
                  <View style={styles.sessionIcon}>
                    <Ionicons name="barbell-outline" size={20} color="#E8FF47" />
                  </View>
                  <View style={styles.sessionInfo}>
                    <Text style={styles.sessionName}>{item.workout_name}</Text>
                    <View style={styles.sessionStatsRow}>
                      <Ionicons name="time-outline" size={13} color="#aaa" />
                      <Text style={styles.sessionStat}>{formatDuration(item.duration_seconds)}</Text>
                      {item.calories_burned != null && (
                        <>
                          <Text style={styles.sessionStatDivider}>·</Text>
                          <Ionicons name="flame-outline" size={13} color="#E8FF47" />
                          <Text style={[styles.sessionStat, { color: '#E8FF47' }]}>
                            ~{Math.round(item.calories_burned)} kcal
                          </Text>
                        </>
                      )}
                    </View>
                  </View>
                </View>
              )}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={40} color="#333" />
              <Text style={styles.emptyText}>Nenhum treino registrado neste dia</Text>
            </View>
          )
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="hand-left-outline" size={40} color="#333" />
            <Text style={styles.emptyText}>Selecione um dia para ver os treinos</Text>
          </View>
        )}
      </View>
    </View>
  );
}
