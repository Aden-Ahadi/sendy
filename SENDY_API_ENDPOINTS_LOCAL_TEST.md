# Sendy API – Endpoint Reference & Local Testing Guide

## Overview

This guide details the specific API endpoints, request formats, and step-by-step instructions for connecting your frontend to the Sendy backend (running locally). It includes example requests for both authentication and sending campaigns with CSV/Excel uploads.

---

## 1. API Base URL (Local)

```
http://localhost:3000
```

(Replace `3000` with your backend port if different)

---

## 2. Authentication Endpoint

### `POST /api/auth/login`

- **Purpose:** Obtain a JWT token for authenticated requests.
- **Request Body (JSON):**
  ```json
  {
    "email": "your@email.com",
    "password": "yourpassword"
  }
  ```
- **Response:**
  ```json
  {
    "token": "<JWT_TOKEN>",
    "user": { "email": "your@email.com" }
  }
  ```
- **Usage:** Save the `token` and include it as a Bearer token in all subsequent requests.

---

## 3. Send Campaign Endpoint (CSV/Excel Upload)

### `POST /api/campaigns/send`

- **Purpose:** Send bulk emails using a CSV or Excel file of recipients.
- **Request Type:** `multipart/form-data`
- **Headers:**
  - `Authorization: Bearer <JWT_TOKEN>`
- **Fields:**
  - `recipientsFile`: File input (CSV, XLSX, or XLS)
  - `subject`: Email subject (string)
  - `emailContent`: Email body (HTML or plain text)
  - `senderName`: Name for the "From" field
  - `replyTo`: Reply-to email address
  - `smtp.useDefault`: `true` or `false` (string or boolean)
  - `smtp.user`/`smtp.pass`: Only if `useDefault` is `false`

#### Example (JS/React):

```js
const formData = new FormData();
formData.append("recipientsFile", file); // file from file input
formData.append("subject", subject);
formData.append("emailContent", htmlContent);
formData.append("senderName", senderName);
formData.append("replyTo", replyTo);
formData.append("smtp.useDefault", useDefault);
if (!useDefault) {
  formData.append("smtp.user", gmail);
  formData.append("smtp.pass", appPassword);
}

fetch("http://localhost:3000/api/campaigns/send", {
  method: "POST",
  headers: { Authorization: `Bearer ${token}` },
  body: formData,
})
  .then((res) => res.json())
  .then((data) => console.log(data));
```

---

## 4. Health Check Endpoint

### `GET /health`

- **Purpose:** Confirm backend is running.
- **Response:**
  ```json
  {
    "status": "healthy",
    "service": "Sendy API",
    "version": "1.0.0",
    "timestamp": "..."
  }
  ```

---

## 5. Testing Locally – Step-by-Step

1. Start your backend: `node src/api/server.js`
2. Use the `/health` endpoint to confirm it’s running.
3. Authenticate via `/api/auth/login` to get a JWT token.
4. Use the `/api/campaigns/send` endpoint to upload your CSV/Excel and send a campaign.
5. Check the response for per-recipient status.

---

## 6. Notes

- All endpoints require the JWT token except `/health` and `/api/auth/login`.
- File uploads must use the `recipientsFile` field.
- For Gmail, users must generate an App Password: https://myaccount.google.com/apppasswords

---

## 7. Example cURL for Local Testing

```sh
# Authenticate
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","password":"yourpassword"}'

# Send Campaign (replace <TOKEN> and <PATH_TO_FILE>)
curl -X POST http://localhost:3000/api/campaigns/send \
  -H "Authorization: Bearer <TOKEN>" \
  -F "recipientsFile=@<PATH_TO_FILE>" \
  -F "subject=Test Subject" \
  -F "emailContent=<p>Hello {{Name}}</p>" \
  -F "senderName=Your Brand" \
  -F "replyTo=reply@example.com" \
  -F "smtp.useDefault=true"
```

---

## 8. Contact

For questions or issues, contact the backend maintainer.
