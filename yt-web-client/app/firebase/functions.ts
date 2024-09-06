import {httpsCallable} from 'firebase/functions';
import {functions} from './firebase';


const generateUploadUrlFunction = httpsCallable(functions, 'generateUploadUrl');
const generateThumbnailUrlFunction = httpsCallable(functions, 'generateThumbnailUrl');
const getVideosFunction = httpsCallable(functions, 'getVideos');
const getThumbnailsFunction = httpsCallable(functions, 'getThumbnails');

export interface Video {
    id?: string,
    uid?: string,
    filename?: string,
    status?: 'processing' | 'processed',
    title?: string, 
    description?: string
}

export async function uploadVideo(file: File, thumbnail: File) {
    const response: any = await generateUploadUrlFunction({
        // the splitter returns an array based on where the '.' are
        // the last entry in the array will be the filetype
        videoFileExtension: file.name.split('.').pop(),
        thumbnailFileExtension: thumbnail.name.split('.').pop()
    });
    
    // Upload the file with the signed url
    const videoUploadResult = await fetch(response?.data?.videoUrl,  {
        method: 'PUT',
        body: file,
        headers: {
            'Content-Type': file.type,
        },
    });

    const thumbnailUploadResult = await fetch(response?.data?.thumbnailUrl,  {
        method: 'PUT',
        body: thumbnail,
        headers: {
            'Content-Type': thumbnail.type,
        },
    });

    return {videoUploadResult, thumbnailUploadResult};
}

export async function uploadThumbnail(file: File){
    const response: any = await generateThumbnailUrlFunction({
      fileExtension: file.name.split('.').pop()
    });

    const uploadResult = await fetch(response?.data?.url, {
        method: 'PUT',
        body: file,
        headers: {
            'Content-Type': file.type,
        },
    });
    return uploadResult;
}

export async function getVideos() {
    const response: any = await getVideosFunction();
    return response.data as Video[];
}

export async function getThumbnails() {
    const response: any = await getThumbnailsFunction();
    return response.data;
}
