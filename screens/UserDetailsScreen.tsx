import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Image, TouchableOpacity, Linking, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import { getStorage, ref as storageRef, getDownloadURL } from 'firebase/storage';
import { db } from '../firebaseConfig';

// Keep types loose to avoid navigator type errors
type Props = { navigation: any; route: any };

const getPhotoUrl = (u: any): string | null => {
  if (!u) return null;
  const keys = ['profileImage','profileImageUrl','image','photoURL','photoUrl','avatar','avatarUrl','profilePic','profile_picture','profile_photo_url','imageUrl','picture','pic'];
  for (const k of keys) {
    const v = u?.[k];
    if (typeof v === 'string' && v.length > 0) return v;
  }
  if (Array.isArray(u?.images) && u.images[0]) return u.images[0];
  if (Array.isArray(u?.photos) && u.photos[0]) return u.photos[0];
  return null;
};

const formatDate = (ts: any): string => {
  try {
    if (!ts) return '-';
    if (ts instanceof Timestamp) return new Date(ts.toDate()).toLocaleString();
    if (typeof ts?.seconds === 'number') return new Date(ts.seconds * 1000).toLocaleString();
    if (typeof ts === 'number') return new Date(ts).toLocaleString();
    if (typeof ts === 'string') return ts;
    return '-';
  } catch { return '-'; }
};

const openUrl = async (url?: string) => {
  if (!url) return;
  try {
    let finalUrl = url;
    if (finalUrl.startsWith('gs://')) {
      const storage = getStorage();
      finalUrl = await getDownloadURL(storageRef(storage, finalUrl));
    }
    const supported = await Linking.canOpenURL(finalUrl);
    if (supported) await Linking.openURL(finalUrl);
    else Alert.alert('Cannot open', 'Unsupported URL: ' + finalUrl);
  } catch (e) {
    Alert.alert('Cannot open', 'Failed to open the document.');
  }
};

const SectionTitle: React.FC<{ title: string }> = ({ title }) => (
  <Text style={styles.sectionTitle}>{title}</Text>
);

const Row: React.FC<{ label: string; value?: string | number | null }> = ({ label, value }) => (
  <View style={styles.row}>
    <Text style={styles.rowLabel}>{label}</Text>
    <Text style={styles.rowValue}>{(value !== undefined && value !== null && String(value).trim() !== '') ? String(value) : '-'}</Text>
  </View>
);

const UserDetailsScreen: React.FC<Props> = ({ navigation, route }) => {
  const { userId, role } = route.params || {};
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'users', userId));
        setUser(snap.exists() ? { id: snap.id, ...snap.data() } : null);
      } catch (e) {
        Alert.alert('Error', 'Failed to load user details');
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  const photoUrl = useMemo(() => getPhotoUrl(user), [user]);

  const norm = (val: any): string | undefined => {
    if (val == null) return undefined;
    if (Array.isArray(val)) return val.filter(Boolean).join(', ');
    return String(val);
  };

  const derivedAge = useMemo(() => {
    if (user?.age) return String(user.age);
    const dobStr = user?.dob ? String(user.dob) : undefined;
    if (!dobStr) return undefined;
    const d = new Date(dobStr);
    if (isNaN(d.getTime())) return undefined;
    const now = new Date();
    let age = now.getFullYear() - d.getFullYear();
    const m = now.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
    return String(age);
  }, [user]);

  const badgeText = (user?.role || role) === 'walker' ? 'Walker' : (user?.role || role) === 'wanderer' ? 'Wanderer' : (user?.role || role || '').toString();

  const primaryPhone = useMemo(() => user?.contactNo || user?.phone || user?.phoneNumber, [user]);
  const alternatePhone = useMemo(() => user?.altContactNo || user?.alternateContact, [user]);
  const motherTongue = useMemo(() => user?.motherTongue, [user]);
  const preferredLanguage = useMemo(() => user?.preferredLanguage || user?.languages, [user]);

  const buildDocuments = (): Array<{ label: string; url?: string }> => {
    const docs: Array<{ label: string; url?: string }> = [];
    const d = user?.documents;
    if (!d) return docs;
    if (!Array.isArray(d) && typeof d === 'object') {
      if (d.aadhaar) docs.push({ label: 'Aadhaar card', url: d.aadhaar });
      if (d.pan) docs.push({ label: 'PAN card', url: d.pan });
      if (d.addressProof) docs.push({ label: 'Address proof', url: d.addressProof });
      if (Array.isArray(d.other)) {
        d.other.forEach((u: any, idx: number) => {
          if (typeof u === 'string') docs.push({ label: `Other document ${idx + 1}`, url: u });
          else if (u && typeof u === 'object') docs.push({ label: u.name || `Other document ${idx + 1}`, url: u.url || u.link });
        });
      }
      return docs;
    }
    if (Array.isArray(d) && d.every((x: any) => typeof x === 'string')) {
      d.forEach((name: string, idx: number) => docs.push({ label: name }));
      return docs;
    }
    if (Array.isArray(d) && d.every((x: any) => typeof x === 'object')) {
      d.forEach((item: any, idx: number) => docs.push({ label: item.name || `Document ${idx + 1}`, url: item.url || item.link }));
      return docs;
    }
    return docs;
  };

  const documents = useMemo(buildDocuments, [user]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>User Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {loading ? (
          <Text style={styles.subtle}>Loading...</Text>
        ) : !user ? (
          <Text style={styles.subtle}>User not found</Text>
        ) : (
          <>
            <View style={styles.card}>
              <View style={styles.profileRow}>
                <View style={styles.avatarCircle}>
                  {photoUrl ? (
                    <Image source={{ uri: photoUrl }} style={styles.avatarImg} />
                  ) : (
                    <MaterialIcons name="person" size={36} color="#666" />
                  )}
                </View>
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <Text style={styles.name}>{user?.name || '-'}</Text>
                  <Text style={styles.badge}>{badgeText}</Text>
                </View>
              </View>
            </View>

            <View style={styles.card}>
              <SectionTitle title="Basic information" />
              <Row label="DOB" value={norm(user?.dob)} />
              <Row label="Age" value={derivedAge} />
              <Row label="Gender" value={norm(user?.gender)} />
              <Row label="Mother tongue" value={norm(motherTongue)} />
              <Row label="Preferred language" value={norm(preferredLanguage)} />
              <Row label="Date joined" value={formatDate(user?.createdAt)} />
            </View>

            <View style={styles.card}>
              <SectionTitle title="Contact info" />
              <Row label="Contact no." value={norm(primaryPhone)} />
              <Row label="Alternate contact no." value={norm(alternatePhone)} />
              <Row label="Email" value={norm(user?.email)} />
              <Row label="Address" value={norm(user?.address)} />
              {(user?.role === 'walker' || role === 'walker') && (
                <Row label="Alternate address" value={norm(user?.altAddress)} />
              )}
            </View>

            {(user?.role === 'walker' || role === 'walker') && (
              <View style={styles.card}>
                <SectionTitle title="Identification" />
                <Row label="Aadhaar no." value={norm(user?.aadharNo)} />
                <Row label="PAN no." value={norm(user?.panNo)} />
              </View>
            )}

            {(user?.role === 'walker' || role === 'walker') && (
              <View style={styles.card}>
                <SectionTitle title="Uploaded documents" />
                {documents.length === 0 ? (
                  <Text style={styles.subtle}>-</Text>
                ) : (
                  documents.map((d, idx) => (
                    <View style={styles.docRow} key={`${d.label}-${idx}`}>
                      <Text style={styles.docLabel}>{d.label}</Text>
                      <View style={styles.docActions}>
                        {d.url ? (
                          <TouchableOpacity onPress={() => openUrl(d.url)}><Text style={styles.docLink}>View/Download</Text></TouchableOpacity>
                        ) : (
                          <Text style={[styles.docLink, { color: '#999' }]}>No file</Text>
                        )}
                      </View>
                    </View>
                  ))
                )}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { height: 56, backgroundColor: 'rgba(0,0,0,0.8)', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingTop: 20 },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  content: { padding: 16 },
  subtle: { color: '#666', marginTop: 10 },
  card: { backgroundColor: '#F5F5F5', borderRadius: 12, padding: 14, marginBottom: 12 },
  profileRow: { flexDirection: 'row', alignItems: 'center' },
  avatarCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarImg: { width: '100%', height: '100%', resizeMode: 'cover' },
  name: { fontSize: 18, fontWeight: '800', color: '#000' },
  badge: { marginTop: 2, color: '#000', fontWeight: '600' },
  sectionTitle: { fontSize: 16, fontWeight: '800', marginBottom: 8, color: '#000' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  rowLabel: { color: '#333', fontWeight: '600' },
  rowValue: { color: '#000', maxWidth: '60%', textAlign: 'right' },
  docRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  docLabel: { color: '#000', fontWeight: '600' },
  docActions: { flexDirection: 'row' },
  docLink: { color: '#1E88E5', fontWeight: '700' },
});

export default UserDetailsScreen;
