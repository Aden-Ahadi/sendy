# 📸 How to Use Local Images - Step by Step

## Complete Guide with Examples

### Method 1: Simple (Recommended) ⭐

1. **Put your image in the `assets` folder**

   ```
   email_service/
   └── assets/
       └── my-poster.jpg  ← Your image
   ```

2. **Update `.env`:**

   ```env
   INLINE_IMAGE_URL=./assets/my-poster.jpg
   ```

3. **Done!** Run `npm run send`

---

### Method 2: Absolute Path

If you want to use an image from anywhere on your PC:

```env
INLINE_IMAGE_URL=C:\Users\ahadi\Pictures\poster.jpg
```

Or:

```env
INLINE_IMAGE_URL=C:\Users\ahadi\Desktop\webinar-banner.png
```

**Note:** Use full path with backslashes on Windows

---

## 🎯 Quick Test

### Step 1: Add a test image

Copy any image to the `assets` folder. For example:

- Right-click on an image → Copy
- Paste it into: `c:\Users\ahadi\email_service\assets\`
- Rename it to: `poster.jpg` (or keep original name)

### Step 2: Update configuration

Create/edit your `.env` file:

```env
# ... other settings ...

INLINE_IMAGE_URL=./assets/poster.jpg
```

### Step 3: Test with yourself

Create `data/test.csv`:

```csv
Name,Email
Test User,adenahadi@gmail.com
```

Update `.env`:

```env
CSV_FILE_PATH=./data/test.csv
```

Run:

```bash
npm run send
```

Check your email! The image should appear inline (not as an attachment).

---

## 📝 Complete Example

Here's a full working setup:

### File Structure:

```
email_service/
├── assets/
│   └── webinar-poster.jpg     ← Your image here
├── data/
│   └── emails.csv
├── .env
└── ... other files
```

### `.env` file:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false

SMTP_USER=adenahadi@gmail.com
SMTP_PASS=your-app-password

SENDER_NAME=Aden Ahadi
SENDER_EMAIL=adenahadi@gmail.com

EMAIL_SUBJECT=You're Invited: Exclusive Webinar for {{Name}}!

CSV_FILE_PATH=./data/emails.csv
EMAIL_DELAY=2000
MAX_RETRY_ATTEMPTS=3
RETRY_DELAY=5000
LOG_FILE_PATH=./logs/email-log.json

# Local image - just put your image in assets folder
INLINE_IMAGE_URL=./assets/webinar-poster.jpg
```

### `data/emails.csv`:

```csv
Name,Email
John Smith,john@example.com
Sarah Johnson,sarah@example.com
```

### Run:

```bash
npm run send
```

---

## 🎨 Image Best Practices

### Recommended Dimensions

- **Width**: 600px (perfect for most email clients)
- **Height**: 300-400px (for banners)
- **File Size**: Under 500 KB

### Optimization Tips

1. **Compress images** before using:

   - Online: https://tinypng.com/
   - Desktop: Use Paint/Photoshop "Save for Web"

2. **Use correct format**:

   - Photos → `.jpg`
   - Graphics/Logos → `.png`
   - Animations → `.gif`

3. **Test on mobile**: Many people read emails on phones!

---

## ❓ Troubleshooting

### "Image not found" error?

**Check 1:** File exists in assets folder?

```bash
dir assets
```

**Check 2:** Path in `.env` is correct?

```env
INLINE_IMAGE_URL=./assets/your-image.jpg
```

**Check 3:** File extension matches exactly?

- `poster.jpg` not `poster.JPG`
- `banner.png` not `banner.PNG`

### Image appears as attachment instead of inline?

This is correct behavior! The image is sent as an attachment with a Content-ID (CID), which allows it to be displayed inline in the email body. Email clients will show it embedded, not as a downloadable attachment.

### Image looks blurry?

Your image might be too small. Use images at least 600px wide.

### Image takes long to send?

Compress your image or use a smaller file size (under 500 KB recommended).

---

## 🚀 Quick Commands

```bash
# Create assets folder (already done)
mkdir assets

# Check what's in assets folder
dir assets

# Copy an image to assets
copy "C:\path\to\your\image.jpg" assets\

# List all images in assets
dir assets\*.jpg
dir assets\*.png
```

---

## 📧 What Recipients See

When someone receives your email, they'll see:

- ✅ Your personalized message
- ✅ The image embedded inline (not as attachment)
- ✅ Professional layout from the HTML template
- ✅ Their name in the greeting: "Hi John!"

The image appears as part of the email content, not as a separate attachment to download.

---

## 💡 Pro Tips

1. **Keep images in assets folder** - Easier to manage
2. **Use descriptive names** - `webinar-2025.jpg` not `IMG001.jpg`
3. **Test with different email clients** - Gmail, Outlook, Yahoo
4. **Don't use huge images** - Slow to send and load
5. **Have a backup** - Keep original images elsewhere too

---

## ✅ Checklist

Before sending with your local image:

- [ ] Image file exists in `assets/` folder
- [ ] Image is under 1 MB in size
- [ ] `.env` has correct path: `INLINE_IMAGE_URL=./assets/your-image.jpg`
- [ ] Tested with a single email to yourself
- [ ] Image displays correctly (not blurry, right size)
- [ ] Image appears inline, not as attachment

---

**Need more help?** Check `README.md` or `QUICKSTART.md`

**Ready to add your image?** Just drag it into the `assets` folder! 🎉
