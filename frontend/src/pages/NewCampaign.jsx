import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

const PLACEHOLDER_HINT = `Use {{Name}} and {{Email}} anywhere in subject or body.`;

export default function NewCampaign() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [subject, setSubject] = useState('');
  const [replyTo, setReplyTo] = useState('');
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [emailContent, setEmailContent] = useState('');
  const [tab, setTab] = useState('editor'); // 'editor' | 'preview'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);

  function handleFileDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  }

  function handleFileChange(e) {
    if (e.target.files[0]) setFile(e.target.files[0]);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!file) return setError('Please upload a recipients file.');
    if (!emailContent.trim()) return setError('Email content cannot be empty.');
    setError('');
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('recipientsFile', file);
      formData.append('subject', subject);
      formData.append('emailContent', emailContent);
      if (replyTo) formData.append('replyTo', replyTo);

      const data = await api.sendCampaign(formData);
      setSuccess(data);
    } catch (err) {
      setError(err?.message || 'Failed to start campaign.');
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div>
        <div style={{ maxWidth: 500, margin: '60px auto', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🚀</div>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Campaign Started!</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>
            Sending to {success.totalRecipients} recipients in the background.
            Emails are being sent and logged in real time.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <Link to={`/campaigns/${success.campaignId}`} className="btn btn-primary">
              View Campaign
            </Link>
            <Link to="/" className="btn btn-secondary">
              All Campaigns
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 720 }}>
      <Link to="/" className="back-link">← Back to Campaigns</Link>

      <div className="page-header" style={{ marginBottom: 20 }}>
        <div>
          <h1>New Campaign</h1>
          <div className="page-title-sub">{PLACEHOLDER_HINT}</div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {error && <div className="alert alert-error">{error}</div>}

        {/* Subject */}
        <div className="form-group">
          <label>
            Subject
            <span className="label-hint">supports {'{{Name}}'}</span>
          </label>
          <input
            type="text"
            value={subject}
            onChange={e => setSubject(e.target.value)}
            placeholder="Hello {{Name}}, you're invited!"
            required
          />
        </div>

        {/* Reply-to */}
        <div className="form-group">
          <label>
            Reply-to Email
            <span className="label-hint">optional — where replies go</span>
          </label>
          <input
            type="email"
            value={replyTo}
            onChange={e => setReplyTo(e.target.value)}
            placeholder="you@company.com"
          />
        </div>

        {/* Recipients file */}
        <div className="form-group">
          <label>Recipients File</label>
          <div
            className={`drop-zone ${dragOver ? 'drag-over' : ''}`}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleFileDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            <div className="drop-zone-icon">📄</div>
            <div className="drop-zone-text">
              {file ? file.name : 'Drop CSV or Excel file here'}
            </div>
            <div className="drop-zone-sub">
              {file
                ? `${(file.size / 1024).toFixed(1)} KB — click to change`
                : 'Must have Name and Email columns — click to browse'}
            </div>
          </div>
        </div>

        {/* Email content editor */}
        <div className="form-group">
          <label>Email Content (HTML)</label>
          <div className="editor-wrap">
            <div className="editor-tabs">
              <button
                type="button"
                className={`editor-tab ${tab === 'editor' ? 'active' : ''}`}
                onClick={() => setTab('editor')}
              >
                Editor
              </button>
              <button
                type="button"
                className={`editor-tab ${tab === 'preview' ? 'active' : ''}`}
                onClick={() => setTab('preview')}
              >
                Preview
              </button>
            </div>
            <div className="editor-body">
              {tab === 'editor' ? (
                <textarea
                  value={emailContent}
                  onChange={e => setEmailContent(e.target.value)}
                  placeholder={`<h1>Hello {{Name}}!</h1>\n<p>Your personalized message here...</p>`}
                  rows={14}
                  style={{ width: '100%', padding: '12px 14px' }}
                />
              ) : (
                <div className="editor-preview">
                  {emailContent.trim() ? (
                    <iframe
                      title="Email Preview"
                      srcDoc={emailContent.replace('{{Name}}', 'John').replace('{{Email}}', 'john@example.com')}
                      sandbox="allow-same-origin"
                    />
                  ) : (
                    <div className="editor-preview-empty">
                      Write some HTML to see a preview
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={loading}
          >
            {loading ? 'Starting campaign…' : '✉ Send Campaign'}
          </button>
          <Link to="/" className="btn btn-secondary btn-lg">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
