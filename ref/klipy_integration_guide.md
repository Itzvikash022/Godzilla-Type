# Klipy API Integration Guide & Schema Reference

This document serves as a reference for the Klipy Multi-Media API integration used within Godzilla-Type. It details the internal structures, available endpoints, and specific JSON schemas requires to properly fetch and parse GIFs, Stickers, Memes, and Video Clips.

## 🔗 Base Configuration
- **Base URL:** `https://api.klipy.com/api/v1`
- **Authentication:** Provided dynamically via the `VITE_KLIPY_APP_KEY` environment variable. In the endpoints, this is passed directly as an early path parameter.
- **Client Identifier:** A standard URL parameter (`customer_id=godzilla-type-client`) is sent with all requests to track app-specific usage on the Partner Dashboard.

## Available Endpoints

The core integration relies on two primary REST endpoints supporting four media types (`gifs`, `stickers`, `static-memes`, `clips`).

### 1. Search Endpoint
Used when the user explicitly searches for a query.
```
GET /{KLIPY_APP_KEY}/{MEDIA_TYPE}/search?q={QUERY}&customer_id={ID}&per_page={LIMIT}
```

### 2. Trending Endpoint
Used as a fallback when the search input is empty, fetching immediate popular localized content.
```
GET /{KLIPY_APP_KEY}/{MEDIA_TYPE}/trending?customer_id={ID}&per_page={LIMIT}
```

---

## 🏗️ Detailed JSON Response Schema

The Klipy API structure is remarkably similar to legacy providers like Tenor but contains **a critical architectural difference in how video files (`clips`) are formed compared to image files (`gifs`, `stickers`, `memes`)**.

All endpoints return a top-level `data` array containing standard item metadata (IDs, titles). The divergence happens inside the `file` object.

### Scenario A: Image Media (GIFs, Stickers, Memes)
For image-based media, the `file` object contains nested quality tiers (`hd`, `md`, `sd`). Inside these tiers, the actual formats (`gif`, `webp`, `png`) are **JSON Objects** containing dimensions and the URL string.

```json
{
  "id": "item_12345",
  "title": "Good Morning Sun",
  "file": {
    "hd": { // High Definition Tier
      "gif": {
        "url": "https://static.klipy.com/.../hq.gif",
        "width": 498,
        "height": 498,
        "size": 4001918
      },
      "webp": {
        "url": "https://static.klipy.com/.../hq.webp",
        "width": 498,
        "height": 498,
        "size": 295220
      }
    },
    "sd": { /* Standard Definition Tier */ }
  }
}
```

### Scenario B: Video Media (Clips)
For video `clips`, the `file` object is flattened. The formats (`mp4`, `webp`, `gif`) are **direct string URLs**, not objects. The dimensions are completely separated into an accompanying `file_meta` object.

```json
{
  "id": "clip_98765",
  "title": "Dramatic Look Scene",
  "file": {
    "mp4": "https://static.klipy.com/.../clip.mp4",
    "webp": "https://static.klipy.com/.../clip.webp",
    "gif": "https://static.klipy.com/.../clip.gif"
  },
  "file_meta": {
    "mp4": {
      "width": 1280,
      "height": 720,
      "size": 2500000
    }
  }
}
```

---

## 🛠️ The Implementation (`klipyService.ts`)

To handle this discrepancy without runtime crashes (where an `<img>` tag receives `[object Object]` instead of a string), Godzilla-Type uses a unified type interceptor and extractor.

### 1. The Disjunctive TypeScript Interface
We define a union type handling both string and object possibilities:
```typescript
interface KlipyMediaFormat {
    url: string;
    width?: number;
    height?: number;
}

type KlipyMediaOrString = KlipyMediaFormat | string;

export interface KlipyItem {
    id: string;
    title: string;
    file: {
        gif?: KlipyMediaOrString;
        webp?: KlipyMediaOrString;
        mp4?: KlipyMediaOrString;
        hd?: {
             // ... nested types
        };
    };
}
```

### 2. The Smart Extractor
A helper function safely collapses to a raw string regardless of the incoming schema:
```typescript
function extractUrl(media?: KlipyMediaOrString): string | undefined {
    if (!media) return undefined;
    if (typeof media === 'string') return media; // Clip Schema (Direct String)
    return media.url; // Image Schema (Nested Object)
}
```

### 3. Progressive Degradation
Finally, we assemble the best available URLs. We prioritize `.webp` (and `.gif` / `.png`) over `.mp4` for chat stability natively.

```typescript
export function getKlipyMainUrl(item: KlipyItem): string {
    const f = item.file;
    return extractUrl(f.hd?.mp4) || extractUrl(f.mp4) || extractUrl(f.hd?.webp) || extractUrl(f.webp) || '';
}
```

## Future Scope
- **Audio Decoding:** Future clip expansions might integrate `useAudio` if Klipy extends mp4 formats with explicit un-muted tracks.
- **Pagination:** Implementing infinite scrolling by utilizing the `page=` parameter alongside `per_page=12`.
