import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Alert,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { MaterialIcons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';

type ScheduleDateTimeScreenProps = {
  navigation: StackNavigationProp<any>;
  route: RouteProp<{ 
    params: { 
      pickup?: string; 
      destination?: string;
      walkType?: 'route' | 'nearby';
      meetingPoint?: string;
      meetingPointCoord?: { latitude: number; longitude: number };
      duration?: number;
    } 
  }, 'params'>;
};

const ITEM_HEIGHT = 50;

const ScheduleDateTimeScreen: React.FC<ScheduleDateTimeScreenProps> = ({ navigation, route }) => {
  // State management
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedHour, setSelectedHour] = useState(10);
  const [selectedMinute, setSelectedMinute] = useState(0);
  const [selectedPeriod, setSelectedPeriod] = useState<'AM' | 'PM'>('AM');
  const [selectedReminder, setSelectedReminder] = useState('None');
  const [selectedPreference, setSelectedPreference] = useState('Solo');
  const [selectedRecurrence, setSelectedRecurrence] = useState('None');
  const { userData } = useAuth();

  // Debug route params
  useEffect(() => {
    console.log('ScheduleDateTimeScreen route params:', route.params);
  }, [route.params]);

  // Refs for ScrollViews
  const hourScrollRef = useRef<ScrollView>(null);
  const minuteScrollRef = useRef<ScrollView>(null);

  // Generate hours and minutes
  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  // Initialize scroll positions
  useEffect(() => {
    setTimeout(() => {
      hourScrollRef.current?.scrollTo({ y: (selectedHour - 1) * ITEM_HEIGHT, animated: false });
      minuteScrollRef.current?.scrollTo({ y: selectedMinute * ITEM_HEIGHT, animated: false });
    }, 100);
  }, []);

  const reminderOptions = ['None', '5 min before', '15 min before', '30 min before'];
  const preferenceOptions = ['Solo', 'Group', 'Pet'];
  const recurrenceOptions = ['None', 'Daily', 'Weekly'];

  const handleChooseWalker = () => {
    // Validate required fields
    if (!selectedDate) {
      Alert.alert('Missing Information', 'Please select a date for your walk.');
      return;
    }
    
    // Note: Time is always set with default values (10:00 AM), so no need to validate
    // But we can add a check if needed
    
    // Validate preference is selected (it has a default value, but we check anyway)
    if (!selectedPreference) {
      Alert.alert('Missing Information', 'Please select a preference.');
      return;
    }
    
    const walkType = route.params?.walkType || 'route';
    
    const scheduleData = {
      walkType,
      pickup: route.params?.pickup || '',
      destination: route.params?.destination || '',
      meetingPoint: route.params?.meetingPoint || '',
      meetingPointCoord: route.params?.meetingPointCoord,
      duration: route.params?.duration,
      scheduledDate: selectedDate,
      scheduledTime: `${selectedHour.toString().padStart(2, '0')}:${selectedMinute.toString().padStart(2, '0')} ${selectedPeriod}`,
      preference: selectedPreference,
      reminder: selectedReminder,
      recurrence: selectedRecurrence,
      wandererName: userData?.name || 'Unknown Wanderer',
      wandererImage: userData?.profileImage || userData?.image,
      estimatedDuration: walkType === 'nearby' && route.params?.duration 
        ? `${route.params.duration} minutes` 
        : '30-45 minutes',
    };
    
    console.log('Schedule Data:', scheduleData);
    navigation.navigate('ChooseWalker', { scheduleData });
  };

  const handleHourScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const index = Math.round(offsetY / ITEM_HEIGHT);
    if (index >= 0 && index < hours.length) {
      setSelectedHour(hours[index]);
    }
  };

  const handleMinuteScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const index = Math.round(offsetY / ITEM_HEIGHT);
    if (index >= 0 && index < minutes.length) {
      setSelectedMinute(minutes[index]);
    }
  };

  const renderScrollPicker = (
    data: number[],
    selectedValue: number,
    scrollRef: React.RefObject<ScrollView | null>,
    onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void,
    type: 'hour' | 'minute'
  ) => {
    return (
      <View style={styles.scrollPickerContainer}>
        {/* Selection indicator overlay - behind the numbers */}
        <View style={styles.selectionIndicator} pointerEvents="none" />
        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          snapToInterval={ITEM_HEIGHT}
          decelerationRate="fast"
          onMomentumScrollEnd={onScroll}
          onScrollEndDrag={onScroll}
          contentContainerStyle={styles.scrollPickerContent}
          nestedScrollEnabled={true}
          scrollEnabled={true}
        >
          {data.map((item, index) => {
            const isSelected = item === selectedValue;
            return (
              <TouchableOpacity
                key={index}
                style={styles.wheelItem}
                onPress={() => {
                  scrollRef.current?.scrollTo({ y: index * ITEM_HEIGHT, animated: true });
                  if (type === 'hour') {
                    setSelectedHour(item);
                  } else {
                    setSelectedMinute(item);
                  }
                }}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.wheelItemText,
                    isSelected && styles.wheelItemTextSelected,
                  ]}
                >
                  {type === 'minute' ? item.toString().padStart(2, '0') : item.toString()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  const markedDates = selectedDate
    ? {
        [selectedDate]: {
          selected: true,
          selectedColor: '#D9DFF7',
          selectedTextColor: '#000000',
        },
      }
    : {};

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialIcons name="close" size={28} color="#2C3E50" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Schedule the Walk</Text>
          <View style={{ width: 28 }} />
        </View>

        {/* Calendar Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Date</Text>
          <View style={styles.calendarContainer}>
            <Calendar
              current={new Date().toISOString().split('T')[0]}
              minDate={new Date().toISOString().split('T')[0]}
              onDayPress={(day) => {
                setSelectedDate(day.dateString);
              }}
              markedDates={markedDates}
              theme={{
                backgroundColor: '#FFFFFF',
                calendarBackground: '#FFFFFF',
                textSectionTitleColor: '#8E8E93',
                selectedDayBackgroundColor: '#D9DFF7',
                selectedDayTextColor: '#000000',
                todayTextColor: '#6C63FF',
                dayTextColor: '#2C3E50',
                textDisabledColor: '#D1D1D6',
                dotColor: '#D9DFF7',
                selectedDotColor: '#000000',
                arrowColor: '#000000',
                monthTextColor: '#2C3E50',
                indicatorColor: '#D9DFF7',
                textDayFontWeight: '500',
                textMonthFontWeight: '700',
                textDayHeaderFontWeight: '600',
                textDayFontSize: 15,
                textMonthFontSize: 18,
                textDayHeaderFontSize: 13,
              }}
              style={styles.calendar}
            />
          </View>
          {selectedDate && (
            <Text style={styles.selectedDateText}>
              Selected: {new Date(selectedDate).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
          )}
        </View>

        {/* Time Picker Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Time</Text>
          <View style={styles.timePickerContainer}>
            <View style={styles.timePickerWrapper}>
              {/* Hour Picker */}
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerLabel}>Hour</Text>
                {renderScrollPicker(hours, selectedHour, hourScrollRef, handleHourScroll, 'hour')}
              </View>

              <Text style={styles.timeSeparator}>:</Text>

              {/* Minute Picker */}
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerLabel}>Minute</Text>
                {renderScrollPicker(minutes, selectedMinute, minuteScrollRef, handleMinuteScroll, 'minute')}
              </View>

              {/* AM/PM Toggle */}
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerLabel}>Period</Text>
                <View style={styles.periodToggle}>
                  <TouchableOpacity
                    style={[
                      styles.periodButton,
                      selectedPeriod === 'AM' && styles.periodButtonActive,
                    ]}
                    onPress={() => setSelectedPeriod('AM')}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.periodText,
                        selectedPeriod === 'AM' && styles.periodTextActive,
                      ]}
                    >
                      AM
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.periodButton,
                      selectedPeriod === 'PM' && styles.periodButtonActive,
                    ]}
                    onPress={() => setSelectedPeriod('PM')}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.periodText,
                        selectedPeriod === 'PM' && styles.periodTextActive,
                      ]}
                    >
                      PM
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Selected Time Display */}
            <View style={styles.selectedTimeDisplay}>
              <MaterialIcons name="access-time" size={24} color="#6C63FF" />
              <Text style={styles.selectedTimeText}>
                {selectedHour.toString().padStart(2, '0')}:{selectedMinute.toString().padStart(2, '0')} {selectedPeriod}
              </Text>
            </View>
          </View>
        </View>

        {/* Reminder Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reminder</Text>
          <View style={styles.optionsRow}>
            {reminderOptions.map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.optionChip,
                  styles.reminderChip,
                  selectedReminder === option && styles.reminderChipSelected,
                ]}
                onPress={() => setSelectedReminder(option)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.optionText,
                    styles.reminderText,
                    selectedReminder === option && styles.reminderTextSelected,
                  ]}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Preference Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preference</Text>
          <View style={styles.optionsRow}>
            {preferenceOptions.map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.optionChip,
                  styles.preferenceChip,
                  selectedPreference === option && styles.preferenceChipSelected,
                ]}
                onPress={() => setSelectedPreference(option)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.optionText,
                    styles.preferenceText,
                    selectedPreference === option && styles.preferenceTextSelected,
                  ]}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recurrence Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recurrence</Text>
          <View style={styles.optionsRow}>
            {recurrenceOptions.map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.optionChip,
                  styles.recurrenceChip,
                  selectedRecurrence === option && styles.recurrenceChipSelected,
                ]}
                onPress={() => setSelectedRecurrence(option)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.optionText,
                    styles.recurrenceText,
                    selectedRecurrence === option && styles.recurrenceTextSelected,
                  ]}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Choose Walker Button */}
        <TouchableOpacity
          style={styles.chooseButton}
          onPress={handleChooseWalker}
          activeOpacity={0.8}
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
    fontSize: 22,
    fontWeight: '700',
    color: '#2C3E50',
    letterSpacing: 0.5,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#2C3E50',
    marginBottom: 15,
    letterSpacing: 0.3,
  },
  calendarContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
    paddingBottom: 15,
  },
  calendar: {
    borderRadius: 20,
  },
  selectedDateText: {
    marginTop: 12,
    fontSize: 15,
    color: '#6C63FF',
    fontWeight: '600',
    textAlign: 'center',
  },
  timePickerContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  timePickerWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  pickerColumn: {
    flex: 1,
    alignItems: 'center',
  },
  pickerLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  scrollPickerContainer: {
    height: 150,
    width: '90%',
    position: 'relative',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    overflow: 'hidden',
  },
  scrollPickerContent: {
    paddingVertical: 50,
    alignItems: 'center',
  },
  wheelItem: {
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  wheelItemText: {
    fontSize: 18,
    color: '#B0B0B0',
    fontWeight: '500',
  },
  wheelItemTextSelected: {
    fontSize: 28,
    color: '#2C3E50',
    fontWeight: '700',
  },
  selectionIndicator: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: ITEM_HEIGHT,
    marginTop: -ITEM_HEIGHT / 2,
    backgroundColor: '#D9DFF7',
    borderTopWidth: 2,
    borderBottomWidth: 2,
    borderColor: '#D9DFF7',
  },
  timeSeparator: {
    fontSize: 32,
    fontWeight: '700',
    color: '#000000',
    marginHorizontal: 5,
    marginTop: 30,
  },
  periodToggle: {
    flexDirection: 'column',
    gap: 8,
  },
  periodButton: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    minWidth: 60,
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: '#D9DFF7',
    shadowColor: '#D9DFF7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  periodText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  periodTextActive: {
    color: '#000000',
    fontWeight: '700',
  },
  selectedTimeDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 12,
  },
  selectedTimeText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#6C63FF',
    letterSpacing: 1,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  optionChip: {
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginRight: 10,
    marginBottom: 10,
    borderWidth: 2,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  // Reminder styles
  reminderChip: {
    backgroundColor: '#E8F6E9',
    borderColor: '#E8F6E9',
  },
  reminderChipSelected: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  reminderText: {
    color: '#000000',
  },
  reminderTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  // Preference styles
  preferenceChip: {
    backgroundColor: '#E8F6E9',
    borderColor: '#E8F6E9',
  },
  preferenceChipSelected: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  preferenceText: {
    color: '#000000',
  },
  preferenceTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  // Recurrence styles
  recurrenceChip: {
    backgroundColor: '#E8F6E9',
    borderColor: '#E8F6E9',
  },
  recurrenceChipSelected: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  recurrenceText: {
    color: '#000000',
  },
  recurrenceTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  chooseButton: {
    backgroundColor: '#000000',
    borderRadius: 25,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  chooseButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

export default ScheduleDateTimeScreen;
