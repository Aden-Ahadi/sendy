# Sendy Bulk Email API – Full Frontend Integration Guide

## Overview

This guide provides detailed, step-by-step instructions for connecting a frontend application to the Sendy backend API for bulk email sending. It covers:

- API endpoint and request/response structure
- How to parse and upload CSV files
- How to allow users to choose SMTP method (Sendy or their own Gmail)
- How to send requests from the frontend (with code examples)
- Error handling and best practices

---

## 1. API Endpoint

**POST** `/api/send-bulk`

### Request Body

- `recipients`: Array of `{ name, email }` objects (parsed from CSV)
- `subject`: Email subject (string)
- `htmlContent`: Email body (HTML or plain text, string)
- `senderName`: Name to appear in the “From” field (string)
- `replyTo`: Email for replies (string)
- `smtp`: Object:
  - `useDefault`: `true` to use Sendy SMTP, `false` to use user's Gmail
  - `user`/`pass`: Only required if `useDefault` is `false`

### Example Request (Default SMTP)

```json
{
  "recipients": [
    { "name": "Aden", "email": "adenahadi@gmail.com" },
    { "name": "Jane", "email": "jane@example.com" }
  ],
  "subject": "Your Custom Subject",
  "htmlContent": "<p>Hello {{Name}},</p><p>This is a test email.</p>",
  "senderName": "Your Brand",
  "replyTo": "replyto@example.com",
  "smtp": {
    "useDefault": true
  }
}
```

### Example Request (User's Gmail)

```json
{
  "recipients": [ ... ],
  "subject": "...",
  "htmlContent": "...",
  "senderName": "Aden",
  "replyTo": "adenahadi@gmail.com",
  "smtp": {
    "useDefault": false,
    "user": "user@gmail.com",
    "pass": "app-password"
  }
}
```

### Example Response

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

## 2. Parsing and Uploading CSV in the Frontend

- Use a library like [PapaParse](https://www.papaparse.com/) (JS) to parse CSV files into an array of `{ name, email }` objects.
- Example (React):

```js
import Papa from "papaparse";

function handleCSVUpload(file, setRecipients) {
  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    complete: (results) => {
      setRecipients(results.data); // [{ name: 'Aden', email: 'adenahadi@gmail.com' }, ...]
    },
  });
}
```

---

## 3. Frontend Form Structure

- File input for CSV
- Text inputs for subject, sender name, reply-to, and message (HTML/Plain)
- Radio/select for SMTP method:
  - Default (Sendy SMTP)
  - User Gmail (show Gmail + App Password fields if selected)
- Button to start campaign

---

## 4. Sending the API Request (Frontend Example)

**With Fetch (JS/React):**

```js
async function sendBulkEmail({
  recipients,
  subject,
  htmlContent,
  senderName,
  replyTo,
  smtp,
}) {
  const response = await fetch("/api/send-bulk", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      recipients,
      subject,
      htmlContent,
      senderName,
      replyTo,
      smtp,
    }),
  });
  return response.json();
}
```

**Usage:**

```js
const smtp = useDefault
  ? { useDefault: true }
  : { useDefault: false, user: gmail, pass: appPassword };
const result = await sendBulkEmail({
  recipients,
  subject,
  htmlContent,
  senderName,
  replyTo,
  smtp,
});
```

---

## 5. Error Handling & Progress

- Show a progress bar or status list as emails are sent (poll or use websockets if backend supports it)
- Display per-recipient status from the API response
- Handle and display errors (e.g., invalid email, SMTP failure)

---

## 6. Security & Best Practices

- Never store user SMTP passwords in the frontend or backend after use
- Use HTTPS for all API requests
- Validate all inputs before sending to backend
- For Gmail, instruct users to generate an App Password: https://myaccount.google.com/apppasswords

---

## 7. Example UI Flow

1. User uploads CSV
2. User fills out subject, sender name, reply-to, and message
3. User selects SMTP method and (if needed) enters Gmail/App Password
4. User clicks "Send"
5. Frontend sends POST to `/api/send-bulk`
6. Frontend displays sending progress and results

---

## 8. Backend Notes

- The backend handles all SMTP logic, deliverability, and error reporting
- For custom SMTP, only Gmail address and App Password are needed (host/port are set automatically)
- The backend expects all data in a single JSON POST

---

## 9. Contact

For questions or issues, contact the backend maintainer.
