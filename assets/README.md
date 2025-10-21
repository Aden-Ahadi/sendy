# 🖼️ Assets Folder

Place your email images here!

## Quick Instructions

1. **Copy your image** to this folder

   - Example: `poster.jpg`, `banner.png`, `webinar-image.jpg`

2. **Update `.env` file** with the image path:

   ```env
   INLINE_IMAGE_URL=./assets/your-image-name.jpg
   ```

3. **That's it!** The image will be embedded in your emails.

## Supported Image Formats

- ✅ `.jpg` / `.jpeg`
- ✅ `.png`
- ✅ `.gif`
- ✅ `.webp`

## Recommended Specifications

- **Width**: 600-800 pixels (for email clients)
- **File Size**: Under 1 MB (for fast loading)
- **Format**: JPG for photos, PNG for graphics/logos
- **Aspect Ratio**: 16:9 or 4:3 works well

## Example

If you have a file called `poster.jpg` in this folder:

```
email_service/
└── assets/
    └── poster.jpg  ← Your image here
```

Then in `.env`:

```env
INLINE_IMAGE_URL=./assets/poster.jpg
```

## Using Multiple Images

The current template supports one main inline image. If you need multiple images:

1. Edit `templates/email.html`
2. Add more `<img>` tags with different `cid:` references
3. Update `src/services/emailService.js` to add more attachments

## Troubleshooting

**Image not displaying?**

- Check the file path is correct
- Ensure the image file exists in this folder
- Verify the file extension matches (case-sensitive on some systems)
- Test with a different image format

**Image too large in email?**

- Resize the image before adding it here
- Use online tools like: https://imageresizer.com/
- Recommended width: 600-800px

---

**Ready?** Just drag and drop your image into this folder! 🚀
