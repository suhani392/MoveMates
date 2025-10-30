import { 
  collection, 
  addDoc, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc,
  orderBy,
  Timestamp,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebaseConfig';

export interface WalkRequest {
  id?: string;
  wandererId: string;
  wandererName: string;
  wandererImage?: string;
  walkerId: string;
  walkerName: string;
  walkerImage?: string;
  walkType?: string; // 'route', 'nearby', 'exploringWalk', 'helpingHand', 'suggestiveWalk'
  pickup: string;
  destination: string;
  meetingPoint?: string;
  duration?: number;
  scheduledDate: string;
  scheduledTime: string;
  preference: string;
  status: 'pending' | 'accepted' | 'declined' | 'completed' | 'cancelled';
  createdAt: Timestamp;
  acceptedAt?: Timestamp;
  declinedAt?: Timestamp;
  notes?: string;
  pricePerHour?: number;
  estimatedDuration?: string;
}

export class WalkRequestService {
  // Create a new walk request
  static async createRequest(requestData: Omit<WalkRequest, 'id' | 'createdAt' | 'status'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'walkRequests'), {
        ...requestData,
        status: 'pending',
        createdAt: Timestamp.now(),
      });
      console.log('Walk request created with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error creating walk request:', error);
      throw error;
    }
  }

  // Get requests for a specific walker
  static subscribeToWalkerRequests(walkerId: string, callback: (requests: WalkRequest[]) => void) {
    const requestsRef = collection(db, 'walkRequests');
    const requestsQuery = query(
      requestsRef,
      where('walkerId', '==', walkerId)
    );

    return onSnapshot(
      requestsQuery,
      (snapshot) => {
        const requests: WalkRequest[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        } as WalkRequest));
        
        // Filter for pending requests only on client side
        const filteredRequests = requests.filter(request => 
          request.status === 'pending'
        );
        
        // Sort by createdAt descending on the client side
        filteredRequests.sort((a, b) => {
          const aTime = a.createdAt?.toMillis() || 0;
          const bTime = b.createdAt?.toMillis() || 0;
          return bTime - aTime;
        });
        
        callback(filteredRequests);
      },
      (error) => {
        console.error('WalkRequestService: Error fetching walker requests:', error);
        callback([]);
      }
    );
  }

  // Get requests for a specific wanderer
  static subscribeToWandererRequests(wandererId: string, callback: (requests: WalkRequest[]) => void) {
    const requestsRef = collection(db, 'walkRequests');
    const requestsQuery = query(
      requestsRef,
      where('wandererId', '==', wandererId),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(
      requestsQuery,
      (snapshot) => {
        const requests: WalkRequest[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        } as WalkRequest));
        callback(requests);
      },
      (error) => {
        console.error('Error fetching wanderer requests:', error);
        callback([]);
      }
    );
  }

  // Accept a walk request
  static async acceptRequest(requestId: string, wandererId: string, walkerName: string) {
    try {
      await updateDoc(doc(db, 'walkRequests', requestId), {
        status: 'accepted',
        acceptedAt: Timestamp.now(),
      });
      // Add notification for wanderer
      await addDoc(collection(db, 'notifications'), {
        userId: wandererId,
        walkRequestId: requestId,
        type: 'walk.accepted',
        title: 'Your Walk Request Was Accepted',
        body: `Walker ${walkerName} accepted your walk request and will see you soon!`,
        timestamp: serverTimestamp(),
        read: false,
      });
      console.log('Walk request accepted:', requestId);
    } catch (error) {
      console.error('Error accepting walk request:', error);
      throw error;
    }
  }

  // Decline a walk request
  static async declineRequest(requestId: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'walkRequests', requestId), {
        status: 'declined',
        declinedAt: Timestamp.now(),
      });
      console.log('Walk request declined:', requestId);
    } catch (error) {
      console.error('Error declining walk request:', error);
      throw error;
    }
  }

  // Cancel a walk request (by wanderer)
  static async cancelRequest(requestId: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'walkRequests', requestId), {
        status: 'cancelled',
      });
      console.log('Walk request cancelled:', requestId);
    } catch (error) {
      console.error('Error cancelling walk request:', error);
      throw error;
    }
  }

  // Complete a walk request
  static async completeRequest(requestId: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'walkRequests', requestId), {
        status: 'completed',
      });
      console.log('Walk request completed:', requestId);
    } catch (error) {
      console.error('Error completing walk request:', error);
      throw error;
    }
  }
}
