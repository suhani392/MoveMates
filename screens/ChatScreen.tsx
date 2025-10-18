import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { collection, query, where, onSnapshot, addDoc, orderBy, Timestamp, serverTimestamp, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';
import { useAuth } from '../contexts/AuthContext';

type ChatScreenProps = {
  navigation: StackNavigationProp<any>;
  route: any;
};

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  createdAt: any;
  delivered?: boolean;
  read?: boolean;
}

const ChatScreen: React.FC<ChatScreenProps> = ({ navigation, route }) => {
  const { userId, userName, userImage } = route.params;
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [isReceiverOnline, setIsReceiverOnline] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const currentUser = auth.currentUser;
  const { userData } = useAuth();

  // Listen to receiver's online status
  useEffect(() => {
    if (!userId) return;

    const userRef = doc(db, 'users', userId);
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const userData = docSnap.data();
        setIsReceiverOnline(userData?.isOnline === true);
      }
    });

    return () => unsubscribe();
  }, [userId]);

  // Subscribe to messages and mark as delivered/read
  useEffect(() => {
    if (!currentUser || !userId) return;

    // Create a chat ID that's consistent regardless of who initiates
    const chatId = [currentUser.uid, userId].sort().join('_');

    // Subscribe to messages
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const messagesQuery = query(messagesRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(
      messagesQuery,
      async (snapshot) => {
        const messagesList: Message[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        } as Message));
        setMessages(messagesList);
        
        // Mark messages as read when current user opens the chat
        const chatId = [currentUser.uid, userId].sort().join('_');
        for (const message of messagesList) {
          if (message.receiverId === currentUser.uid && !message.read) {
            const messageRef = doc(db, 'chats', chatId, 'messages', message.id);
            await updateDoc(messageRef, {
              delivered: true,
              read: true,
            }).catch(() => {});
          }
        }
        
        // Scroll to bottom when new messages arrive
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      },
      (error) => {
        console.error('Error fetching messages:', error);
      }
    );

    return () => unsubscribe();
  }, [currentUser, userId]);

  // Mark messages as delivered when receiver comes online
  useEffect(() => {
    if (!currentUser || !userId || !isReceiverOnline) return;

    const chatId = [currentUser.uid, userId].sort().join('_');
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    
    // Find undelivered messages sent by current user
    const undeliveredQuery = query(
      messagesRef,
      where('senderId', '==', currentUser.uid),
      where('delivered', '==', false)
    );

    onSnapshot(undeliveredQuery, async (snapshot) => {
      for (const docSnap of snapshot.docs) {
        const messageRef = doc(db, 'chats', chatId, 'messages', docSnap.id);
        await updateDoc(messageRef, {
          delivered: true,
        }).catch(() => {});
      }
    });
  }, [currentUser, userId, isReceiverOnline]);

  const handleSendMessage = async () => {
    if (!messageText.trim() || !currentUser || sending) return;

    // Store message text and clear input immediately for better UX
    const textToSend = messageText.trim();
    setMessageText('');
    setSending(true);

    try {
      const chatId = [currentUser.uid, userId].sort().join('_');
      const messagesRef = collection(db, 'chats', chatId, 'messages');

      // Send the message
      await addDoc(messagesRef, {
        senderId: currentUser.uid,
        receiverId: userId,
        text: textToSend,
        createdAt: Timestamp.now(),
        delivered: false,
        read: false,
      });

      // Create notification for the receiver (don't await - fire and forget)
      const notificationsRef = collection(db, 'notifications');
      addDoc(notificationsRef, {
        userId: userId, // Receiver of the notification
        type: 'message',
        title: 'New Message',
        message: `${userData?.name || 'Someone'} sent you a message: "${textToSend.substring(0, 50)}${textToSend.length > 50 ? '...' : ''}"`,
        timestamp: serverTimestamp(),
        read: false,
        relatedUserId: currentUser.uid,
        relatedUserName: userData?.name || 'User',
        relatedUserImage: userData?.profileImage || userData?.image || '',
      }).catch(err => console.error('Error creating notification:', err));

    } catch (error) {
      console.error('Error sending message:', error);
      // Optionally restore the message text on error
      // setMessageText(textToSend);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
    return `${formattedHours}:${formattedMinutes} ${ampm}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color="#000000" />
          </TouchableOpacity>
          
          <View style={styles.headerInfo}>
            {userImage ? (
              <Image source={{ uri: userImage }} style={styles.headerAvatar} />
            ) : (
              <View style={styles.headerAvatarPlaceholder}>
                <MaterialIcons name="person" size={20} color="#CCCCCC" />
              </View>
            )}
            <Text style={styles.headerName}>{userName}</Text>
          </View>
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="chat-bubble-outline" size={60} color="#CCCCCC" />
              <Text style={styles.emptyText}>No messages yet</Text>
              <Text style={styles.emptySubtext}>Start the conversation!</Text>
            </View>
          ) : (
            messages.map((message) => {
              const isMyMessage = message.senderId === currentUser?.uid;
              return (
                <View
                  key={message.id}
                  style={[
                    styles.messageBubble,
                    isMyMessage ? styles.myMessage : styles.theirMessage,
                  ]}
                >
                  <Text style={[
                    styles.messageText,
                    isMyMessage ? styles.myMessageText : styles.theirMessageText,
                  ]}>
                    {message.text}
                  </Text>
                  <View style={styles.messageFooter}>
                    <Text style={[
                      styles.messageTime,
                      isMyMessage ? styles.myMessageTime : styles.theirMessageTime,
                    ]}>
                      {formatTime(message.createdAt)}
                    </Text>
                    {isMyMessage && (
                      <View style={styles.tickContainer}>
                        {message.read ? (
                          // Blue double tick (read)
                          <View style={styles.doubleTick}>
                            <MaterialIcons name="done-all" size={16} color="#4A9EFF" />
                          </View>
                        ) : message.delivered ? (
                          // Grey double tick (delivered)
                          <View style={styles.doubleTick}>
                            <MaterialIcons name="done-all" size={16} color="#999999" />
                          </View>
                        ) : (
                          // Single grey tick (sent)
                          <MaterialIcons name="done" size={16} color="#999999" />
                        )}
                      </View>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>

        {/* Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            value={messageText}
            onChangeText={setMessageText}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendButton, !messageText.trim() && styles.sendButtonDisabled]}
            onPress={handleSendMessage}
            disabled={!messageText.trim() || sending}
          >
            <MaterialIcons 
              name="send" 
              size={24} 
              color={messageText.trim() ? '#FFFFFF' : '#CCCCCC'} 
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingTop: 50,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    padding: 5,
    marginRight: 10,
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  headerAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  messagesContent: {
    padding: 15,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666666',
    marginTop: 20,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999999',
    marginTop: 8,
  },
  messageBubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 18,
    marginBottom: 10,
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#000000',
    borderBottomRightRadius: 4,
  },
  theirMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#E8F0FE',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
    marginBottom: 4,
  },
  myMessageText: {
    color: '#FFFFFF',
  },
  theirMessageText: {
    color: '#000000',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
    gap: 4,
  },
  messageTime: {
    fontSize: 11,
  },
  myMessageTime: {
    color: '#CCCCCC',
  },
  theirMessageTime: {
    color: '#666666',
  },
  tickContainer: {
    marginLeft: 4,
  },
  doubleTick: {
    marginLeft: -2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  input: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
    marginRight: 10,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#F3F4F6',
  },
});

export default ChatScreen;
