# Sendy API – Backend Integration & Endpoint Reference

## Overview

This documentation provides all technical details for integrating your frontend with the Sendy backend, including server info, authentication, campaign sending, file upload, and example API calls.

---

## 1. Server Details

- **Port:** 3000 (default)
- **Base URL:** http://localhost:3000

---

## 2. API Endpoints Structure

| Endpoint            | Method | Description                         |
| ------------------- | ------ | ----------------------------------- |
| /health             | GET    | Health check (no auth required)     |
| /api/auth/login     | POST   | Authenticate, returns JWT token     |
| /api/campaigns/send | POST   | Send bulk emails (CSV/Excel upload) |

---

## 3. Authentication

- **Method:** JWT tokens
- **Login Endpoint:** `POST /api/auth/login`
- **Request Body:**
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
- **Usage:** Include `Authorization: Bearer <JWT_TOKEN>` header in all protected requests.

---

## 4. Email Sending

- **Endpoint:** `POST /api/campaigns/send`
- **Request Type:** `multipart/form-data`
- **Fields:**
  - `recipientsFile`: File input (CSV, XLSX, or XLS)
  - `subject`: Email subject
  - `emailContent`: Email body (HTML or plain text)
  - `senderName`: Name for the "From" field
  - `replyTo`: Reply-to email address
  - `smtp.useDefault`: `true` or `false`
  - `smtp.user`/`smtp.pass`: Only if `useDefault` is `false`
- **Headers:** `Authorization: Bearer <JWT_TOKEN>`
- **Response Example:**
  ```json
  {
    "success": true,
    "results": [
      { "email": "adenahadi@gmail.com", "status": "sent" },
      {
        "email": "jane@example.com",
        "status": "failed",
        "error": "Invalid address"
      }
    ]
  }
  ```

---

## 5. File Processing

- **Upload Field:** `recipientsFile`
- **Supported Formats:** CSV, XLSX, XLS
- **Expected Columns:** `Name`, `Email` (case-insensitive)
- **Backend parses file and validates each row.**

---

## 6. Example API Calls

**Authenticate:**

```js
fetch("http://localhost:3000/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "your@email.com", password: "yourpassword" }),
})
  .then((res) => res.json())
  .then((data) => {
    /* save data.token */
  });
```

**Send Campaign:**

```js
const formData = new FormData();
formData.append("recipientsFile", file); // CSV or Excel file
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

**Health Check:**

```js
fetch("http://localhost:3000/health")
  .then((res) => res.json())
  .then((data) => console.log(data));
```

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

## 8. Notes

- All endpoints require the JWT token except `/health` and `/api/auth/login`.
- File uploads must use the `recipientsFile` field.
- For Gmail, users must generate an App Password: https://myaccount.google.com/apppasswords

---

## 9. Contact

For questions or issues, contact the backend maintainer.
