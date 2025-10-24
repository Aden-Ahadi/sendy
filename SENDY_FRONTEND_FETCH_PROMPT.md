# Sendy Frontend Fetch Integration – Prompt & Guide

## Overview

This guide explains how your frontend should send requests to the Sendy Express backend to send emails. It includes a sample fetch code, required fields, and best practices for handling the response and updating your UI.

---

## 1. Backend Endpoint

- **URL:** `http://localhost:3000/api/campaigns/send`
- **Method:** `POST`
- **Request Type:** `multipart/form-data`
- **No authentication required.**

---

## 2. Required Fields

Your frontend must send the following fields in the request:

- `recipientsFile`: The file input (CSV, XLSX, or XLS) containing recipient names and emails
- `subject`: Email subject (string)
- `emailContent`: Email body (HTML or plain text, string)
- `senderName`: Name to appear in the “From” field (string)
- `replyTo`: Email for replies (string)
- `smtp.useDefault`: `true` or `false` (string or boolean)
- `smtp.user`/`smtp.pass`: Only required if `useDefault` is `false`

---

## 3. Sample Fetch Code (React/JS)

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
  body: formData,
})
  .then((res) => res.json())
  .then((data) => {
    // Handle the response here
    console.log("Sendy response:", data);
    // Update your UI with success/failure info
    // Example: show a message or update campaign status
  })
  .catch((err) => {
    // Handle errors (network, backend, etc.)
    console.error("Sendy error:", err);
    // Show error message in your UI
  });
```

---

## 4. UI Update Best Practices

- After receiving the response, update your UI to show campaign status, success/failure, and any error messages.
- Always check for `data.success` and display per-recipient results if available.
- Log the response to the console for debugging.

---

## 5. Troubleshooting

- If you get a 200 status but no UI update, make sure you are handling the response and updating state/UI.
- If you get an error, check the browser console and Network tab for details.
- Make sure the backend is running and the endpoint URL is correct.

---

## 6. Example UI Flow

1. User selects a CSV/Excel file and fills out the form.
2. User clicks "Send".
3. Frontend sends the fetch request as shown above.
4. On success, show a confirmation and campaign status.
5. On error, show an error message.

---

## 7. Notes

- No authentication or special headers are required.
- The backend expects `multipart/form-data` with the correct field names.
- For Gmail, users must generate an App Password: https://myaccount.google.com/apppasswords

---

## 8. Contact

For questions or issues, contact the backend maintainer.
