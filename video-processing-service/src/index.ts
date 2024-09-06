import express from "express";
import { convertVideo, deleteProcessedVideo, deleteRawVideo, downloadRawVideo, getThumbnailBucketName, setupDirectories, uploadProcesedVideo, uploadThumbnail, deleteThumbnail } from "./storage"; 
import { isVideoNew, setVideo } from "./firestore";
import path from 'path';


setupDirectories();

const app = express();
app.use(express.json());

app.post('/process-video', async (req, res) => {
    
   // Get the bucket and filename from the Cloud Pub/Sub message
   let data;
   try {
        const message = Buffer.from(req.body.message.data, 'base64').toString('utf8');
        data = JSON.parse(message); //parse message to find the fileName, this comes from googles Pub/Sub tutorial
        if(!data.name) {
            throw new Error ('Invalid message payload recieved.');
        } 
    }catch (error) {
        console.error(error);
        return res.status(400).send('Bad Request: missing filename.')
    }

    const inputFileName = data.name; // Format of <UID>-<DATE>.<EXTENSION>
    const outputFileName = `processed-${inputFileName}`;
    const videoId = inputFileName.split('.')[0];

    if(!isVideoNew(videoId)){
        return res.status(400).send('Bad Request: video alreadyer processing or processed');
    } else {
        await setVideo(videoId, {
            id: videoId,
            uid: videoId.split('-')[0],
            status: 'processing'
        });
    }
    //Download the raw video from Cloud Storage.
    await downloadRawVideo(inputFileName);

    await setVideo(videoId, {
        status: 'processed',
        filename: outputFileName
        });

    // Convert video to 360p.
    try{
        await convertVideo(inputFileName, outputFileName);
    } catch (err) {
        await Promise.all([
            deleteRawVideo(inputFileName),
            deleteProcessedVideo(outputFileName)
        ]);
        console.log("files deleted");
        return res.status(500).send('Internal Server Error: video processing failed.');
    }
    // Uload the processed video to Cloud Storage.
    await uploadProcesedVideo(outputFileName);

    await Promise.all([
        deleteRawVideo(inputFileName),
        deleteProcessedVideo(outputFileName)
    ]);
    const thumbnailBuffer = await sharp(thumbnailFile).resize(300,300).crop(sharp.gravity.center).toBuffer();
    return res.status(200).send('Processing finished succesfully');
});


app.post('/upload-thumbnail', async (req, res) => {
    const {videoId, thumbnail, filename} = req.body;

    if(!videoId || !thumbnail || !filename) {
        return res.status(400).send('Bad Request: Missing videoID or thumbnail');
    }
    const ext = path.extname(filename).toLowerCase();
    //may need to check for allowed file types?
    const thumbnailFileName = `thumbnail-${videoId}${ext}`

    try {
        await uploadThumbnail(thumbnail, thumbnailFileName);

        await setVideo(videoId, {
            thumbnail: `gs://${getThumbnailBucketName()}/${thumbnailFileName}`
        });

        res.status(200).send("Thumbnail uploaded successfully");
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal server error failed to upload thumbnail');
    }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Servier is running on port ${port}`);
});

