import { Request, Response, RequestHandler } from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

// ── Constants ─────────────────────────────────────────────────────────────────
const MAX_IMAGE_BYTES = 2 * 1024 * 1024; // 2 MB
const MAX_SOUND_BYTES = 500 * 1024;       // 500 KB
const ALLOWED_IMAGE_TYPES = ['image/webp', 'image/gif', 'image/png', 'image/jpeg'];
const ALLOWED_AUDIO_TYPES = ['audio/mpeg', 'audio/mp3', 'audio/ogg'];

// ── Multer Setup (in-memory, no disk writes) ──────────────────────────────────
export const memeUploadMiddleware: RequestHandler = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_IMAGE_BYTES },
}).fields([
    { name: 'image', maxCount: 1 },
    { name: 'sound', maxCount: 1 },
]);

// ── Cloudinary Config (Deferred) ──────────────────────────────────────────────
function ensureCloudinaryConfig() {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
    });
}

// ── Upload Buffer to Cloudinary ───────────────────────────────────────────────
function uploadBufferToCloudinary(
    buffer: Buffer,
    publicId: string,
    resourceType: 'image' | 'video' | 'raw'
): Promise<string> {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder: 'godzilla-type/memes',
                public_id: publicId,
                resource_type: resourceType,
                overwrite: false,
            },
            (error, result) => {
                if (error || !result) return reject(error);
                resolve(result.secure_url);
            }
        );
        const readable = Readable.from(buffer);
        readable.pipe(stream);
    });
}

// ── Main Handler ──────────────────────────────────────────────────────────────
export async function memeUploadHandler(req: Request, res: Response) {
    try {
        ensureCloudinaryConfig();

        const files = req.files as { [fieldname: string]: Express.Multer.File[] };

        // ── Validate image
        const imageFile = files['image']?.[0];
        if (!imageFile) {
            return res.status(400).json({ error: 'Image file is required.' });
        }
        if (!ALLOWED_IMAGE_TYPES.includes(imageFile.mimetype)) {
            return res.status(400).json({ error: 'Image must be WebP, GIF, PNG or JPEG.' });
        }
        if (imageFile.size > MAX_IMAGE_BYTES) {
            return res.status(400).json({ error: 'Image exceeds 2MB limit.' });
        }

        // ── Validate optional sound
        const soundFile = files['sound']?.[0];
        if (soundFile) {
            if (!ALLOWED_AUDIO_TYPES.includes(soundFile.mimetype)) {
                return res.status(400).json({ error: 'Sound must be MP3 or OGG.' });
            }
            if (soundFile.size > MAX_SOUND_BYTES) {
                return res.status(400).json({ error: 'Sound exceeds 500KB limit.' });
            }
        }

        // ── Upload to Cloudinary
        const memeId = uuidv4();

        // Extract base name from original image file (e.g. "chill-guy.webp" -> "chill-guy")
        const originalName = imageFile.originalname || 'meme';
        const safeBaseName = originalName
            .replace(/\.[^/.]+$/, '')             // Remove extension
            .replace(/[^a-zA-Z0-9-]/g, '-')       // Replace unsafe chars with dashes
            .replace(/-+/g, '-')                  // Remove duplicate dashes
            .toLowerCase();

        // Provide the same base name for both image and audio, ensuring they group together
        const publicId = `${safeBaseName}-${memeId.slice(0, 8)}`;

        const imageUrl = await uploadBufferToCloudinary(imageFile.buffer, publicId, 'image');

        let soundUrl: string | undefined;
        if (soundFile) {
            soundUrl = await uploadBufferToCloudinary(soundFile.buffer, publicId, 'video');
        }

        // ── Respond with URLs — the client will save metadata to Convex directly
        return res.status(200).json({ memeId, imageUrl, soundUrl });

    } catch (err: any) {
        console.error('Meme upload error:', err);
        return res.status(500).json({ error: 'Upload failed. Please try again.' });
    }
}
