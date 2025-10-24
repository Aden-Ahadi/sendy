# Sendy Bulk Email API – Frontend Integration Guide (CSV & Excel)

## Overview

This backend now supports uploading both CSV and Excel files (.csv, .xlsx, .xls) for recipient lists. The API will automatically parse and validate either format.

---

## 1. API Endpoint

**POST** `/api/campaigns/send`

### Request (multipart/form-data)

- `recipientsFile`: The file input (CSV or Excel) containing recipient names and emails
- `subject`: Email subject (string)
- `emailContent`: Email body (HTML or plain text, string)
- `senderName`: Name to appear in the “From” field (string)
- `replyTo`: Email for replies (string)
- `smtp.useDefault`: `true` to use Sendy SMTP, `false` to use user's Gmail
- `smtp.user`/`smtp.pass`: Only required if `useDefault` is `false`

### Example Frontend (JS/React)

```js
const formData = new FormData();
formData.append("recipientsFile", file); // file from file input (CSV or Excel)
formData.append("subject", subject);
formData.append("emailContent", htmlContent);
formData.append("senderName", senderName);
formData.append("replyTo", replyTo);
formData.append("smtp.useDefault", useDefault);
if (!useDefault) {
  formData.append("smtp.user", gmail);
  formData.append("smtp.pass", appPassword);
}

fetch("/api/campaigns/send", {
  method: "POST",
  headers: { Authorization: `Bearer ${token}` },
  body: formData,
});
```

### File Format

- **CSV**: Must have columns `Name` and `Email` (case-insensitive)
- **Excel**: First sheet must have columns `Name` and `Email` (case-insensitive)

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

## 2. Frontend File Handling

- Accept both `.csv`, `.xlsx`, and `.xls` in your file input:
  ```html
  <input
    type="file"
    accept=".csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
  />
  ```
- Use [SheetJS (xlsx)](https://sheetjs.com/) to preview Excel files if needed, or just send the file directly to the backend as shown above.

---

## 3. Notes

- The backend will parse and validate the file, returning errors for invalid/missing data.
- For Gmail, users must generate an App Password: https://myaccount.google.com/apppasswords
- All other API fields remain the same as before.

---

## 4. Contact

For questions or issues, contact the backend maintainer.
