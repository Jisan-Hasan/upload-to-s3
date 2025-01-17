const express = require("express");
const multer = require("multer");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { config } = require("dotenv");
const fs = require("fs");

config();

const app = express();
const port = 5000;

const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
    forcePathStyle: true,
    // endpoint: `http://localhost:5000/upload`,
});

const upload = multer({ storage: multer.memoryStorage() });

app.post("/upload", upload.array("files", 10), async (req, res) => {
    try {
        const files = req.files;

        const fileUrls = [];

        for (const file of files) {
            const params = {
                Bucket: process.env.S3_BUCKET_NAME,
                Key: `${Date.now()}_${file.originalname}`,
                Body: file.buffer,
                ContentType: file.mimetype,
            };

            // Upload file to S3
            const command = new PutObjectCommand(params);
            await s3.send(command);

            // Construct the URL
            const url = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${params.Key}`;

            fileUrls.push(url);
        }

        res.json({
            message: "Files uploaded successfully",
            urls: fileUrls,
        });
    } catch (error) {
        console.error("Error uploading files:", error);
        res.status(500).send("Error uploading files");
    }
});

app.get("/", (req, res) =>
    res.json({ message: "Welcome to file uploader with aws sdk v3!" })
);

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
