import * as functions from "firebase-functions";
import * as logger from "firebase-functions/logger";
import {initializeApp} from "firebase-admin/app";
import {Firestore} from "firebase-admin/firestore";
import {Storage} from "@google-cloud/storage";
import {onCall} from "firebase-functions/v2/https";

initializeApp();

const firestore = new Firestore();
const storage = new Storage();

const rawVideoBucketName = "koranimal-yt-raw-videos";
const rawThumbnailBucketName = "koranimal-yt-thumbnails";

const videoCollectionId = "videos";

export interface Video {
  id?: string,
  uid?: string,
  filename?: string,
  status?: "processing" | "processed",
  title?: string,
  description?: string
  thumbnail?: string
}

export const createUser = functions.auth.user().onCreate((user) => {
  const userInfo = {
    uid: user.uid,
    email: user.email,
    photoUrl: user.photoURL,
  };
    // if the collection or document doesn't exist this line of code will
    // create it
  firestore.collection("users").doc(user.uid).set(userInfo);
  // stringify makes it easer to read the info
  logger.info(`User Created: ${JSON.stringify(userInfo)}`);
  return;
});

export const generateUploadUrl = onCall({maxInstances: 1}, async (request) => {
  // Check if user is authenticated
  if (!request.auth) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "The function must be called while authenticated."
    );
  }

  const auth = request.auth;
  const data = request.data;
  const videoBucket = storage.bucket(rawVideoBucketName);
  const thumbnailBucket = storage.bucket(rawThumbnailBucketName);

  // Generate a unique filename
  const videoFileName = `${auth.uid}-${Date.now()}.${data.videoFileExtension}`;
  const thumbnailFileName = `${auth.uid}-${Date.now()}.${data.thumbnailFileExtension}`;


  // Get a v4 signed URL for uploading file
  const [videoUrl] = await videoBucket.file(videoFileName).getSignedUrl({
    version: "v4",
    action: "write",
    expires: Date.now() + 15 *60 *1000, // 15 minutes
  });

  const [thumbnailUrl] = await thumbnailBucket.file(thumbnailFileName).getSignedUrl({
    version: "v4",
    action: "write",
    expires: Date.now() + 15 *60 *1000, // 15 minutes
  });

  return {videoUrl, videoFileName, thumbnailUrl, thumbnailFileName};
});

// export const generateThumbnailUrl = onCall({maxInstances: 1}, async(request) => {
//   if(!request.auth) {
//     throw new functions.https.HttpsError(
//       "failed-precondition", "the function must be called while authenticated"
//     );
//   }
//   const auth = request.auth;
//   const data = request.data;
//   const bucket = storage.bucket(thumbnailBucketName);

//   const fileName = `${auth.uid}-${Date.now()}.${data.fileExtension}`;

//   const [url] = await bucket.file(fileName).getSignedUrl({
//     version: "v4",
//     action: "write",
//     expires: Date.now() + 15 *60 *1000,
//   });

//   return {url, fileName};
// });

export const getVideos = onCall({maxInstances: 1}, async () => {
  const querySnapshot =
    await firestore.collection(videoCollectionId).limit(10).get();
  return querySnapshot.docs.map((doc) => doc.data());
});

export const getThumbnails = onCall({maxInstances: 1}, async () => {
  const querySnapshot =
    await firestore.collection(videoCollectionId).limit(10).get();
    const thumbnails = querySnapshot.docs.map((doc) => {
      const video = doc.data() as Video;
      return {
        id: video.id,
        thumbnail: video.thumbnail,
      };
    });
  return thumbnails;
});



export const generateToken = onCall({maxInstances: 1}, async () =>{

});


