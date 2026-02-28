### Disease Detection + Expert Chat Integration Plan

---

## Module 1: Prediction & Result Display

### Backend

- **FastAPI ML service (existing)**
  - `/predict`:
    - Input: file + `crop` (`tomato|maize|potato`)
    - Output: `{ crop, class, generalName, confidence, probabilities }`

- **Node/Express backend**

  - **Config**
    - `DISEASE_API_BASE_URL` → base URL of FastAPI service.

  - **DB: `disease_predictions` (single history table)**  
    - `id` (PK)  
    - `userId` (FK → `users.id`)  
    - `crop` (text)  
    - `predictedDisease` (text) – model label/id  
    - `generalName` (text) – user‑friendly disease name  
    - `imageUrl` (text) – stored leaf image (Cloudinary, etc.)  
    - `diseaseConfidence` (numeric)  
    - `createdAt` (timestamp, default now)

  - **Route: `POST /api/disease/predict`**
    - Auth: farmer (any plan).
    - Input: `multipart/form-data`
      - `file`: image
      - `crop`: string
    - Steps:
      1. Validate `crop`.
      2. Upload image → `imageUrl`.
      3. Forward file + crop to FastAPI `/predict`.
      4. Insert row in `disease_predictions` with model result + `imageUrl`.
      5. Return JSON:
         ```json
         {
           "predictionId": 123,
           "crop": "tomato",
           "predictedDisease": "early_blight",
           "generalName": "Early Blight",
           "diseaseConfidence": 0.94,
           "imageUrl": "https://...",
           "probabilities": { "early_blight": 0.94, "healthy": 0.03 }
         }
         ```

  - **Optional: `GET /api/disease/predictions/my`**
    - List a user’s past predictions from `disease_predictions`.

### Frontend

- **Disease Detection page**
  - UI:
    - Select `crop`.
    - Upload image.
    - “Analyze” button.
  - Behavior:
    - On submit → `POST /api/disease/predict`.
    - Show:
      - Predicted disease + confidence.
      - (Optional) probabilities chart.
      - If user is **Pro**:
        - Show **“Verify with expert”** button (needs `predictionId` + `imageUrl` from response).

---

## Module 2: “Verify with Expert” via Chat

### Idea

- Pro farmer clicks **Verify with expert**.
- A chat opens (or existing conversation is used).
- First message automatically contains:
  - Leaf image.
  - Model’s prediction + confidence.
- Expert replies in normal chat thread.
- Link between prediction and chat is stored in the **messages** table.

### Backend: Chat Integration

- **Assumed existing tables**
  - `conversations` (or `chats`): `id`, `farmerId`, `expertId`, ...
  - `messages`: `id`, `conversationId`, `senderId`, `content`, `createdAt`, ...

- **Extend `messages` schema**
  - Add (nullable) fields:
    - `predictionId` (FK → `disease_predictions.id`)
    - `imageUrl` (or reuse existing attachment field)

- **Route: `POST /api/disease/predictions/:id/verify-with-expert`**
  - Auth: farmer with **Pro** subscription.
  - Input: `predictionId` in URL.
  - Steps:
    1. Load `disease_predictions` row; ensure `userId` == current user.
    2. Resolve/create a conversation with an expert:
       - Use existing matching conversation or create new `conversations` row.
    3. Insert a `messages` row:
       - `conversationId`
       - `senderId` (farmer or system)
       - `content` (summary), e.g.:  
         _"Please verify this prediction: Tomato – Early Blight (confidence 94%)."_
       - `predictionId`
       - `imageUrl`
    4. Return:
       ```json
       {
         "conversationId": "...",
         "messageId": "...",
         "predictionId": 123
       }
       ```

### Frontend: Chat Behavior

- **On Disease Detection page**
  - When **“Verify with expert”** clicked:
    - Call `POST /api/disease/predictions/:id/verify-with-expert`.
    - Navigate to chat UI focused on returned `conversationId`.

- **In Chat UI**
  - When rendering each message:
    - If `message.predictionId` is present:
      - Show a **disease verification card** inside the message:
        - Leaf image.
        - Crop.
        - Model’s disease name + confidence.
        - Label like “Model prediction”.
  - Expert replies as usual (no extra schema required for reply).

