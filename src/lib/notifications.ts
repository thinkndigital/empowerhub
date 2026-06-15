import { addDoc, collection, serverTimestamp, type Firestore } from "firebase/firestore";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";

type NotificationData = {
    userId: string;
    title: string;
    description: string;
    link: string;
};

export function sendNotification(db: Firestore, data: NotificationData) {
    const notificationPayload = {
        ...data,
        isRead: false,
        createdAt: serverTimestamp(),
    };
    addDoc(collection(db, 'notifications'), notificationPayload)
    .catch(error => {
        console.error("Error sending notification:", error);
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: 'notifications',
            operation: 'create',
            requestResourceData: notificationPayload,
        }));
    });
}
