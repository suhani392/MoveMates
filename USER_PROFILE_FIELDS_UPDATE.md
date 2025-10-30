# User Profile Fields Update - Complete Implementation

## Overview
This document outlines all the new fields added to Walker and Wanderer profiles throughout the MoveMates application.

## New Fields Added

### For Both Walker and Wanderer:
1. **Date of Birth (DOB)** - Required field with date picker
2. **Gender** - Required field (Male/Female/Other)
3. **Mother Tongue** - Required field
4. **Preferred Languages** - Required field
5. **Contact Number** - Required field
6. **Alternate Contact Number** - Optional field
7. **Email** - Required field (pre-filled from signup)
8. **Address** - Required field

### Additional Fields for Walker Only:
1. **Alternate Address** - Optional field
2. **Aadhar Number** - Required field (12 digits)
3. **PAN Number** - Required field (10 characters)
4. **Documents Upload** - Required (ID proof, certificates, etc.)

## Files Modified

### 1. DatePickerInput Component (NEW)
**File:** `components/DatePickerInput.tsx`
- Reusable date picker component
- Uses `@react-native-community/datetimepicker`
- Formats date as DD/MM/YYYY
- Supports maximum/minimum date constraints

### 2. ProfileDetailsScreen
**File:** `screens/ProfileDetailsScreen.tsx`
**Changes:**
- Added DOB field with DatePickerInput component
- Added gender selection with toggle buttons
- Added mother tongue input
- Added preferred languages input
- Added contact number and alternate contact number
- Added email field (read-only, from signup)
- Added address field
- For Walkers: Added alternate address, Aadhar number, PAN number
- Updated validation to ensure all required fields are filled
- Updated data submission to include all new fields

### 3. EditProfileScreen
**File:** `screens/EditProfileScreen.tsx`
**Changes:**
- Added all new fields for editing existing profiles
- Added DOB field with DatePickerInput
- Added gender selection buttons
- Added mother tongue, preferred languages
- Added contact numbers (primary and alternate)
- Added email and address fields
- For Walkers: Added alternate address, Aadhar, and PAN fields
- Updated data fetching to load all new fields
- Updated save functionality to persist all new fields

### 4. ProfileScreen
**File:** `screens/ProfileScreen.tsx`
**Changes:**
- Reorganized profile display into sections:
  - Personal Information (DOB, Gender, Age)
  - Contact Information (Contact numbers, Email, Address)
  - Language Preferences (Mother Tongue, Preferred Languages)
  - About, Walking Pace, Hobbies
- Added new styles for info rows and labels
- Displays all fields conditionally based on availability

### 5. WalkerProfileScreen
**File:** `screens/WalkerProfileScreen.tsx`
**Changes:**
- Added display for DOB, Gender, Age
- Added Mother Tongue and Preferred Languages
- Added Contact Number and Email
- Maintains existing fields (Pace, Hobbies, Experience, Rate)

### 6. UserDetailsScreen (Admin Panel)
**File:** `screens/UserDetailsScreen.tsx`
**Status:** Already had all fields implemented
- Displays DOB, Age, Gender, Mother Tongue, Preferred Language
- Shows Contact info, Alternate contact, Email, Address
- For Walkers: Shows Alternate address, Aadhar no., PAN no.
- Displays uploaded documents with view/download links

### 7. Package.json
**File:** `package.json`
**Changes:**
- Added `@react-native-community/datetimepicker": "9.0.2"` dependency

## Data Structure

### Walker Profile Data:
```javascript
{
  name: string,
  dob: string, // YYYY-MM-DD format
  gender: string, // 'Male' | 'Female' | 'Other'
  motherTongue: string,
  preferredLanguage: string,
  contactNo: string,
  altContactNo: string,
  email: string,
  address: string,
  altAddress: string,
  aadharNo: string, // 12 digits
  panNo: string, // 10 characters
  age: number,
  walkingPace: string,
  hobbies: string,
  languages: string,
  about: string,
  experience: string,
  pricePerHour: number,
  documents: string[], // Array of document names
  role: 'walker'
}
```

### Wanderer Profile Data:
```javascript
{
  name: string,
  dob: string, // YYYY-MM-DD format
  gender: string, // 'Male' | 'Female' | 'Other'
  motherTongue: string,
  preferredLanguage: string,
  contactNo: string,
  altContactNo: string,
  email: string,
  address: string,
  age: number,
  walkingPace: string,
  hobbies: string,
  languages: string,
  about: string,
  role: 'wanderer'
}
```

## Date of Birth (DOB) Format

The DOB field uses a standardized date picker component with the following features:

### Display Format:
- **User Interface:** DD/MM/YYYY (e.g., 15/08/1990)
- **Storage Format:** YYYY-MM-DD (e.g., 1990-08-15)

### Implementation:
```typescript
// DatePickerInput Component
<DatePickerInput
  label="Date of Birth"
  value={dob}
  onChange={setDob}
  placeholder="Select your date of birth"
  required
  maximumDate={new Date()} // Prevents future dates
/>
```

### Features:
- **Platform-specific UI:**
  - iOS: Spinner-style picker
  - Android: Calendar-style picker
- **Validation:** Maximum date set to current date (no future dates)
- **Format conversion:** Automatically converts between Date object and string
- **Required field indicator:** Shows asterisk (*) for required fields

### Usage in Forms:
1. **ProfileDetailsScreen:** Used during signup for new users
2. **EditProfileScreen:** Used for editing existing user profiles
3. **Display:** Formatted as localized date string in profile views

## Installation Instructions

1. Install the new dependency:
```bash
npm install
```

2. For iOS (if applicable):
```bash
cd ios && pod install && cd ..
```

## Validation Rules

### Required Fields (Both Roles):
- Name
- Date of Birth
- Gender
- Mother Tongue
- Preferred Languages
- Contact Number
- Email
- Address

### Required Fields (Walker Only):
- Aadhar Number (12 digits)
- PAN Number (10 characters)
- Price Per Hour
- At least one document upload

### Optional Fields:
- Alternate Contact Number
- Alternate Address (Walker only)
- Age (auto-calculated from DOB if not provided)
- Walking Pace
- Hobbies
- Languages
- About
- Experience (Walker only)

## User Flow

### New User Signup:
1. User enters basic info (name, email, password, phone) in SignUpScreen
2. User selects role (Walker/Wanderer) in RoleSelectionScreen
3. User fills complete profile in ProfileDetailsScreen with all new fields
4. Account is created with all information

### Existing User Profile Edit:
1. User navigates to Profile → Edit Profile
2. All existing data is pre-filled
3. User can update any field including new ones
4. Changes are saved to Firestore

### Admin View:
1. Admin can view all user details in UserDetailsScreen
2. All fields are displayed in organized sections
3. Documents can be viewed/downloaded

## TypeScript Notes

The TypeScript lints showing "Property does not exist on type 'UserData'" are expected and can be safely ignored. The application uses dynamic Firestore data, and these properties exist at runtime. The codebase uses type assertions (`as any`) where necessary to handle the dynamic nature of user data.

## Testing Checklist

- [ ] New users can sign up with all required fields
- [ ] DOB picker works on both iOS and Android
- [ ] Gender selection buttons work correctly
- [ ] All fields save properly to Firestore
- [ ] Existing users can edit their profiles
- [ ] Profile screen displays all new fields
- [ ] Walker profile shows additional walker-specific fields
- [ ] Admin panel displays all user details correctly
- [ ] Document upload works for walkers
- [ ] Validation prevents submission with missing required fields

## Future Enhancements

1. Add field validation for Aadhar (must be 12 digits)
2. Add field validation for PAN (must match pattern: AAAAA9999A)
3. Add phone number validation
4. Add email format validation
5. Consider adding profile completion percentage indicator
6. Add ability to verify contact numbers via OTP
