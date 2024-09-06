// 1. GCS file interactions
// 2. Local file interactions

import { Storage} from '@google-cloud/storage';
import fs, { fdatasyncSync } from 'fs';
import ffmpeg from 'fluent-ffmpeg';

const storage = new Storage();

const rawVideoBucketName = "koranimal-yt-raw-videos";
const processedVideoBucketName = "koranimal-yt-processed-videos";
const thumbnailBucketName = "koranimal-yt-thumbnails";
const rawThumbnailBucketName ="koranimal-yt-raw-thumbnails"

const localRawVideoPath = "./raw-videos";
const localProcessedVideoPath = "./processed-videos";
const localThumbnailPath = "./thumbnails";
/**
 * Creates the local directories for raw and processed videos.
 */
export function setupDirectories() {
    ensureDirectoryExistence(localRawVideoPath);
    ensureDirectoryExistence(localProcessedVideoPath);
    ensureDirectoryExistence(localThumbnailPath);
}

export function getThumbnailBucketName(){
    return thumbnailBucketName;
}

/**
 * @param rawVideoName Name of the file to convert from {@link localRawVideoPath}.
 * @param processedVideoName Name of the file to convert to {@link localProcessedVideoPath}.
 * @returns A promise that resolves when the video has been converted.
 */
export function convertVideo(rawVideoName: string, processedVideoName: string){
    return new Promise<void>((resolve, reject) => {
        ffmpeg(`${localRawVideoPath}/${rawVideoName}`)
        .outputOptions('-vf', 'scale=-1:360') //scales the video to 360p
        .on("end", () => {
            resolve();
        })
        .on("error",(err: any) => {
            console.log("An error occurred: " + err.message);
            reject(err);
        })
        .save(`${localProcessedVideoPath}/${processedVideoName}`)
    })

}

/**
 * @param fileName - The name of the file to download
 * {@link rawVideoBucketName} bucket into the {@link localRawVideoPath}
 * @returns A promise that resolves when the file has been downloaded.
 */
export async function downloadRawVideo(fileName: string) {
    await storage.bucket(rawVideoBucketName)
        .file(fileName)
        .download({ destination: `${localRawVideoPath}/${fileName}`,});

    console.log(`gs://${rawVideoBucketName}/${fileName} downloaded - to ${localRawVideoPath}/${fileName}.`)    
    // since this function is async it has to return a promise  
}

/**
 * @param fileName - The name of the file to upload from the
 * {@link localProcessedVideoPath} bucket into the {@link processedVideoBucketName}
 * @returns a promise that resolves when the file has been uploaded.
 */
export async function uploadProcesedVideo(fileName: string){
    console.log("in uploading");
    const bucket = storage.bucket(processedVideoBucketName);

    await storage.bucket(processedVideoBucketName)
    .upload(`${localProcessedVideoPath}/${fileName}`,{destination: fileName,})
    console.log(`${localProcessedVideoPath}/${fileName} uploaded to gs://${processedVideoBucketName}/${fileName}.`); 
    await bucket.file(fileName).makePublic();
}

/** 
 * Uploads a thumbnail to the thumbnail bucket.
 * @param thumbnailData - base64 thumbnail data
 * @param fileName - name to save the thumbnail as
 */
export async function uploadThumbnail(thumbnailData: string, fileName: string){
    const filePath = `${localThumbnailPath}/${fileName}`;

    const thumbnailBuffer = Buffer.from(thumbnailData, 'base64');
    fs.writeFileSync(filePath, thumbnailBuffer);

    await storage.bucket(thumbnailBucketName).upload(filePath, { destination : fileName});
    console.log(`${filePath} uploaded to gs://${thumbnailBucketName}/${fileName}.`);

}
/**
 * @param fileName - The name of the file to be deleted from the
 * {@link localProcessedVideoPath} folder.
 * @returns A promise that resolves when the file has been deleted.
 */
export function deleteProcessedVideo(fileName: string){
    return deleteFile(`${localProcessedVideoPath}/${fileName}`);
}

/**
 * @param fileName - The name of the file to be deleted from the
 * {@link localRawVideoPath} folder.
 * @returns A promise that resolves when the file has been deleted.
 */
export function deleteRawVideo(fileName: string){
    return deleteFile(`${localRawVideoPath}/${fileName}`);
}

/**
 * @param fileName - The name of the file to be deleted from the
 * {@link localThumbnailPath} folder.
 * @returns A promise that resolves when the file has been deleted.
 */
export function deleteThumbnail(fileName: string){
    return deleteFile(`${localThumbnailPath}/${fileName}`);
}

/**
 * @param filePath - The path of the file to delete
 * @returns a promise that resolves when the file has been deleted.
 */
function deleteFile(filePath: string): Promise<void>{
    return new Promise((resolve, reject) =>{  
        if(fs.existsSync(filePath)) {
            fs.unlink(filePath, (err) =>{
                if(err){
                    console.log(`Failed to delete file at ${filePath}`,err);
                    reject(err);
                } else {
                    console.log(`File deleted at ${filePath}`);
                    resolve();
                }
            })
        }   else {
            console.log(`File not found at ${filePath}, skipping the delete.`);
            resolve();
        }
    }); 
}


/**
 * Ensures a directory exists, creating it if necessary.
 * @param  {string} dirPath - The directory to check.
 */
function ensureDirectoryExistence(dirPath: string) { 
    if(!fs.existsSync(dirPath)){
        fs.mkdirSync(dirPath, {recursive: true}); // recursive: true enables the ability to create nested directories.
        console.log(`Directory created at ${dirPath}`);
    }
}