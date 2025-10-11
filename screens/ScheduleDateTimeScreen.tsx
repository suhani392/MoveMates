import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';

type ScheduleDateTimeScreenProps = {
  navigation: StackNavigationProp<any>;
};

const ScheduleDateTimeScreen: React.FC<ScheduleDateTimeScreenProps> = ({ navigation }) => {
  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  const [selectedHour, setSelectedHour] = useState(10);
  const [selectedMinute, setSelectedMinute] = useState(15);
  const [selectedPeriod, setSelectedPeriod] = useState<'AM' | 'PM'>('AM');
  const [selectedReminder, setSelectedReminder] = useState('None');
  const [selectedPreference, setSelectedPreference] = useState('Solo');
  const [selectedRecurrence, setSelectedRecurrence] = useState('None');

  const currentMonth = 'October 2025';
  const daysInMonth = 31;
  const startDay = 3; // October 2025 starts on Wednesday

  const renderCalendar = () => {
    const days = ['Sun', 'Mon', 'Tues', 'Wed', 'Thurs', 'Fri'];
    const dates = [];

    // Add empty cells for days before the month starts
    for (let i = 0; i < startDay; i++) {
      dates.push(<View key={`empty-${i}`} style={styles.emptyDay} />);
    }

    // Add date cells
    for (let i = 1; i <= daysInMonth; i++) {
      dates.push(
        <TouchableOpacity
          key={i}
          style={[
            styles.dateCell,
            selectedDate === i && styles.selectedDate,
          ]}
          onPress={() => setSelectedDate(i)}
        >
          <Text style={[
            styles.dateText,
            selectedDate === i && styles.selectedDateText,
          ]}>
            {i}
          </Text>
        </TouchableOpacity>
      );
    }

    return (
      <View style={styles.calendarContainer}>
        <View style={styles.calendarHeader}>
          <TouchableOpacity>
            <MaterialIcons name="chevron-left" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.monthText}>{currentMonth}</Text>
          <TouchableOpacity>
            <MaterialIcons name="chevron-right" size={24} color="#000" />
          </TouchableOpacity>
        </View>
        <View style={styles.daysHeader}>
          {days.map((day) => (
            <Text key={day} style={styles.dayHeaderText}>{day}</Text>
          ))}
        </View>
        <View style={styles.datesGrid}>{dates}</View>
      </View>
    );
  };

  const renderTimePicker = () => {
    return (
      <View style={styles.timePickerContainer}>
        <View style={styles.timeColumn}>
          <TouchableOpacity onPress={() => setSelectedHour(9)}>
            <Text style={styles.timeOption}>9</Text>
          </TouchableOpacity>
          <View style={styles.selectedTimeRow}>
            <Text style={styles.selectedTime}>10</Text>
          </View>
          <TouchableOpacity onPress={() => setSelectedHour(11)}>
            <Text style={styles.timeOption}>11</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.timeSeparator}>:</Text>

        <View style={styles.timeColumn}>
          <TouchableOpacity onPress={() => setSelectedMinute(14)}>
            <Text style={styles.timeOption}>14</Text>
          </TouchableOpacity>
          <View style={styles.selectedTimeRow}>
            <Text style={styles.selectedTime}>15</Text>
          </View>
          <TouchableOpacity onPress={() => setSelectedMinute(16)}>
            <Text style={styles.timeOption}>16</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.timeColumn}>
          <TouchableOpacity onPress={() => setSelectedPeriod('PM')}>
            <Text style={styles.timeOption}>PM</Text>
          </TouchableOpacity>
          <View style={styles.selectedTimeRow}>
            <Text style={styles.selectedTime}>AM</Text>
          </View>
          <TouchableOpacity>
            <Text style={styles.timeOption}></Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialIcons name="close" size={28} color="#000000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Schedule the Walk</Text>
          <View style={{ width: 28 }} />
        </View>

        {/* Calendar */}
        {renderCalendar()}

        {/* Time Picker */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Time</Text>
          {renderTimePicker()}
        </View>

        {/* Reminder */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reminder</Text>
          <View style={styles.optionsRow}>
            {['None', '5 minutes before', '15 minutes before', '30 minutes before'].map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.optionChip,
                  selectedReminder === option && styles.selectedChip,
                ]}
                onPress={() => setSelectedReminder(option)}
              >
                <Text style={[
                  styles.optionText,
                  selectedReminder === option && styles.selectedOptionText,
                ]}>
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Preference */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preference</Text>
          <View style={styles.optionsRow}>
            {['Solo', 'Group', 'Pet'].map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.optionChip,
                  selectedPreference === option && styles.selectedChip,
                ]}
                onPress={() => setSelectedPreference(option)}
              >
                <Text style={[
                  styles.optionText,
                  selectedPreference === option && styles.selectedOptionText,
                ]}>
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recurrence */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recurrence</Text>
          <View style={styles.optionsRow}>
            {['None', 'Daily', 'Weekly'].map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.optionChip,
                  selectedRecurrence === option && styles.selectedChip,
                ]}
                onPress={() => setSelectedRecurrence(option)}
              >
                <Text style={[
                  styles.optionText,
                  selectedRecurrence === option && styles.selectedOptionText,
                ]}>
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Choose Walker Button */}
        <TouchableOpacity 
          style={styles.chooseButton}
          onPress={() => navigation.navigate('ChooseWalker')}
        >
          <Text style={styles.chooseButtonText}>Choose a Walker</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
  },
  calendarContainer: {
    backgroundColor: '#F7EDD9',
    borderRadius: 15,
    padding: 20,
    marginBottom: 25,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  monthText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  daysHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  dayHeaderText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000000',
    width: 40,
    textAlign: 'center',
  },
  datesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  emptyDay: {
    width: '14.28%',
    aspectRatio: 1,
  },
  dateCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  selectedDate: {
    backgroundColor: '#000000',
  },
  dateText: {
    fontSize: 14,
    color: '#000000',
  },
  selectedDateText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 15,
  },
  timePickerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 15,
    paddingVertical: 20,
  },
  timeColumn: {
    alignItems: 'center',
    marginHorizontal: 15,
  },
  timeOption: {
    fontSize: 18,
    color: '#999999',
    paddingVertical: 8,
  },
  selectedTimeRow: {
    backgroundColor: '#D9DFF7',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginVertical: 8,
  },
  selectedTime: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
  },
  timeSeparator: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    marginHorizontal: 10,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  optionChip: {
    backgroundColor: '#E8F6E9',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginRight: 10,
    marginBottom: 10,
  },
  selectedChip: {
    backgroundColor: '#4CAF50',
  },
  optionText: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '500',
  },
  selectedOptionText: {
    color: '#FFFFFF',
  },
  chooseButton: {
    backgroundColor: '#000000',
    borderRadius: 30,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 20,
  },
  chooseButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default ScheduleDateTimeScreen;
