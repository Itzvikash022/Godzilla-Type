import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';
import dotenv from 'dotenv';
import path from 'path';

// Load the server's .env file
dotenv.config({ path: path.resolve(__dirname, '../../server/.env') });

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function main() {
    console.log("Cloud Name:", process.env.CLOUDINARY_CLOUD_NAME);

    // Create a dummy 1x1 transparent PNG buffer
    const buf = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');

    const stream = cloudinary.uploader.upload_stream(
        {
            folder: 'godzilla-type/memes',
            public_id: 'test-upload',
            resource_type: 'image',
            overwrite: false,
        },
        (error, result) => {
            if (error) {
                console.error("❌ CLOUDINARY ERROR:", JSON.stringify(error, null, 2));
            } else {
                console.log("✅ CLOUDINARY SUCCESS:", result?.secure_url);
            }
        }
    );

    const readable = Readable.from(buf);
    readable.pipe(stream);
}

main().catch(console.error);
