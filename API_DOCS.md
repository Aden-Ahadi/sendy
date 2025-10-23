# Sendy API Documentation

## 🚀 Quick Start

### Installation

```bash
npm install
npm run dev
```

### Environment Variables

Add to your `.env`:

```
JWT_SECRET=your-super-secret-jwt-key-change-this
PORT=3000
```

---

## 📡 API Endpoints

### 1. Health Check

**GET** `/health`

Check if the API is running.

**Response:**

```json
{
  "status": "healthy",
  "service": "Sendy API",
  "version": "1.0.0",
  "timestamp": "2025-10-23T10:00:00.000Z"
}
```

---

### 2. Login (Temporary)

**POST** `/api/auth/login`

Get a JWT token for authentication.

**Request:**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "email": "user@example.com"
  }
}
```

---

### 3. Send Campaign

**POST** `/api/campaigns/send`

Create and send an email campaign.

**Headers:**

```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Request (multipart/form-data):**

- `csv` (file): CSV file with recipients (Name, Email columns)
- `subject` (string): Email subject line

**Response:**

```json
{
  "success": true,
  "campaignId": "campaign_1729677600000",
  "totalRecipients": 221,
  "status": "sending",
  "message": "Campaign started. Emails are being sent in the background."
}
```

---

### 4. Get Campaign Status

**GET** `/api/campaigns/:campaignId`

Get the status of a campaign.

**Headers:**

```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response:**

```json
{
  "campaignId": "campaign_1729677600000",
  "total": 221,
  "successful": 220,
  "failed": 1,
  "status": "completed",
  "logs": [...]
}
```

---

### 5. Get Campaign Logs

**GET** `/api/campaigns/:campaignId/logs`

Get detailed logs for a campaign.

**Headers:**

```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response:**

```json
{
  "campaignId": "campaign_1729677600000",
  "logs": [
    {
      "recipient": "user@example.com",
      "status": "success",
      "timestamp": "2025-10-23T10:00:00.000Z",
      "attempts": 1
    }
  ],
  "summary": {
    "total": 221,
    "successful": 220,
    "failed": 1,
    "successRate": "99.55%"
  }
}
```

---

### 6. Add Verified Sender (User Email Setup)

**POST** `/api/settings/sender`

Allow users to add their own email address for sending campaigns.

**Headers:**

```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Request:**

```json
{
  "fromName": "Sarah Johnson",
  "fromEmail": "sarah@startup.com",
  "replyTo": "sarah@startup.com",
  "address": "123 Main St",
  "city": "New York",
  "country": "United States"
}
```

**Response:**

```json
{
  "success": true,
  "senderId": 12345,
  "verificationStatus": "pending",
  "message": "Verification email sent. Check your inbox to verify."
}
```

---

### 7. Check Sender Verification Status

**GET** `/api/settings/sender/:senderId`

Check if a user's email has been verified.

**Headers:**

```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response:**

```json
{
  "id": 12345,
  "email": "sarah@startup.com",
  "name": "Sarah Johnson",
  "verified": true,
  "status": "verified"
}
```

---

### 8. Resend Verification Email

**POST** `/api/settings/sender/:senderId/resend`

Resend the verification email if user didn't receive it.

**Headers:**

```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response:**

```json
{
  "success": true,
  "message": "Verification email resent. Check your inbox."
}
```

---

## 🧪 Testing with cURL

### 1. Health Check

```bash
curl http://localhost:3000/health
```

### 2. Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"test@example.com\",\"password\":\"test123\"}"
```

### 3. Send Campaign

```bash
curl -X POST http://localhost:3000/api/campaigns/send \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "csv=@data/emails.csv" \
  -F "subject=Test Campaign"
```

### 4. Get Campaign Status

```bash
curl http://localhost:3000/api/campaigns/campaign_1729677600000 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🔐 Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Note:** The current login endpoint is temporary. In production, this will be replaced by Supabase authentication.

---

## 📝 Next Steps

1. **Deploy to Railway:** Connect your GitHub repo and deploy
2. **Add Supabase Auth:** Replace temporary login with proper authentication
3. **Add Rate Limiting:** Prevent API abuse
4. **Add Webhooks:** Notify frontend of campaign progress
5. **Add Templates:** Allow users to create and manage templates

---

## 🐛 Error Handling

All errors return a JSON response with an error message:

```json
{
  "error": "Error description",
  "details": "Additional error details"
}
```

**Status Codes:**

- `200` - Success
- `400` - Bad Request (missing parameters)
- `401` - Unauthorized (no token)
- `403` - Forbidden (invalid token)
- `404` - Not Found (campaign doesn't exist)
- `500` - Internal Server Error
