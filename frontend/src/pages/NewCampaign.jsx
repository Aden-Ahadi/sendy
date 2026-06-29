import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, PaperPlaneTilt, UploadSimple, File, Warning, CheckCircle } from '@phosphor-icons/react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import EmailEditor from '../components/EmailEditor';
import { api } from '../lib/api';
import { buildPreviewHtml } from '../lib/emailPreview';

// ── Shell picker thumbnails ────────────────────────────────────────────────

function MinimalThumb() {
  return (
    <div className="w-full h-[72px] rounded-[5px] bg-[#f0ede7] overflow-hidden flex items-center justify-center p-2">
      <div className="w-full h-full bg-white rounded-[4px] px-3 py-2.5 flex flex-col gap-1.5">
        <div className="h-2 w-2/5 bg-[#d4d0ca] rounded-[2px]" />
        <div className="h-1.5 w-full bg-[#e8e5de] rounded-[2px]" />
        <div className="h-1.5 w-4/5 bg-[#e8e5de] rounded-[2px]" />
        <div className="h-1.5 w-full bg-[#e8e5de] rounded-[2px]" />
      </div>
    </div>
  );
}

function BrandedThumb() {
  return (
    <div className="w-full h-[72px] rounded-[5px] bg-[#f0ede7] overflow-hidden flex flex-col">
      {/* Logo bar */}
      <div className="bg-white border-b border-[#eaeaea] h-[22px] flex items-center justify-center flex-shrink-0">
        <div className="w-7 h-3 bg-[#ccc] rounded-[2px]" />
      </div>
      {/* Body */}
      <div className="flex-1 bg-white px-3 py-2 flex flex-col gap-1.5">
        <div className="h-1.5 w-2/5 bg-[#d4d0ca] rounded-[2px]" />
        <div className="h-1.5 w-full bg-[#e8e5de] rounded-[2px]" />
        <div className="h-1.5 w-3/4 bg-[#e8e5de] rounded-[2px]" />
      </div>
      {/* Footer */}
      <div className="bg-[#f5f4f0] h-[12px] border-t border-[#eaeaea]" />
    </div>
  );
}

const SHELLS = [
  {
    id:          'minimal',
    label:       'Minimal',
    description: 'Clean white card — content only, no branding chrome',
    Thumb:       MinimalThumb,
  },
  {
    id:          'branded',
    label:       'Branded',
    description: 'Huawei ICT Academy logo header + address footer',
    Thumb:       BrandedThumb,
  },
];

// ── Page ──────────────────────────────────────────────────────────────────

const DEFAULT_SHELL = 'branded';

export default function NewCampaign() {
  const fileInputRef = useRef(null);

  const [shell,       setShell]       = useState(DEFAULT_SHELL);
  const [subject,     setSubject]     = useState('');
  const [replyTo,     setReplyTo]     = useState('');
  const [file,        setFile]        = useState(null);
  const [dragOver,    setDragOver]    = useState(false);
  const [emailHtml,   setEmailHtml]   = useState('');
  const [previewTab,  setPreviewTab]  = useState('editor');
  const [editorKey,   setEditorKey]   = useState(0); // bump to force-reset the Tiptap editor
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState('');
  const [success,     setSuccess]     = useState(null);

  function handleCancel() {
    setShell(DEFAULT_SHELL);
    setSubject('');
    setReplyTo('');
    setFile(null);
    setDragOver(false);
    setEmailHtml('');
    setPreviewTab('editor');
    setError('');
    setEditorKey(k => k + 1);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

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
    if (!file) return setError('Upload a recipients file to continue.');
    if (!emailHtml || emailHtml === '<p></p>') return setError('Email content cannot be empty.');
    setError('');
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('recipientsFile', file);
      formData.append('subject',        subject);
      formData.append('emailContent',   emailHtml);
      formData.append('templateShell',  shell);
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
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-14 h-14 rounded-full bg-[#f0faf5] flex items-center justify-center mb-5">
          <CheckCircle size={28} weight="fill" className="text-[#2b9a66]" />
        </div>
        <h2
          className="text-[20px] font-bold tracking-[-0.025em] text-[#202020] mb-2"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Campaign started
        </h2>
        <p className="text-[13.5px] text-[#646464] mb-7 max-w-[300px] leading-relaxed">
          Sending to {success.totalRecipients} recipients using the{' '}
          <span className="font-medium text-[#202020]">{shell}</span> template.
        </p>
        <div className="flex items-center gap-3">
          <Link to={`/campaigns/${success.campaignId}`} className={cn(buttonVariants({ size: 'sm' }))}>
            View campaign
          </Link>
          <Link to="/" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>
            All campaigns
          </Link>
        </div>
      </div>
    );
  }

  const previewHtml = buildPreviewHtml(
    shell,
    emailHtml
      .replace(/\{\{Name\}\}/g,  'Amara Diallo')
      .replace(/\{\{Email\}\}/g, 'amara@example.com')
  );

  return (
    <div className="max-w-[640px]">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-[#8d8d8d] hover:text-[#202020] text-[13px] font-medium mb-7 transition-colors duration-150"
      >
        <ArrowLeft size={14} />
        Back
      </Link>

      <h1
        className="text-[22px] font-bold tracking-[-0.025em] text-[#202020] mb-1"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        New campaign
      </h1>
      <p className="text-[13px] text-[#646464] mb-7 leading-relaxed">
        Use{' '}
        <span className="font-mono text-[12px] bg-[#f3f0e8] text-[#8d8d8d] px-1.5 py-0.5 rounded-[4px]">{'{{Name}}'}</span>
        {' '}and{' '}
        <span className="font-mono text-[12px] bg-[#f3f0e8] text-[#8d8d8d] px-1.5 py-0.5 rounded-[4px]">{'{{Email}}'}</span>
        {' '}to personalise each message.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="flex items-center gap-2.5 bg-red-50 border border-red-100 rounded-full px-4 py-3 text-red-600 text-[13px]">
            <Warning size={14} weight="fill" className="flex-shrink-0" />
            {error}
          </div>
        )}

        {/* ── Template shell picker ── */}
        <div className="space-y-3">
          <label className="block text-[13px] font-medium text-[#202020]">Email format</label>
          <div className="grid grid-cols-2 gap-3">
            {SHELLS.map(({ id, label, description, Thumb }) => (
              <button
                key={id}
                type="button"
                onClick={() => setShell(id)}
                className={cn(
                  'text-left rounded-[10px] border p-3 transition-all duration-150 space-y-2',
                  shell === id
                    ? 'border-[#202020] bg-white shadow-[0_0_0_1px_#202020]'
                    : 'border-[rgba(32,32,32,0.12)] bg-white hover:border-[rgba(32,32,32,0.28)]'
                )}
              >
                <Thumb />
                <div>
                  <div className="text-[12.5px] font-semibold text-[#202020]">{label}</div>
                  <div className="text-[11.5px] text-[#8d8d8d] leading-snug mt-0.5">{description}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <Separator className="bg-[rgba(32,32,32,0.08)]" />

        {/* ── Subject ── */}
        <div className="space-y-2">
          <label className="block text-[13px] font-medium text-[#202020]">Subject line</label>
          <Input
            type="text"
            value={subject}
            onChange={e => setSubject(e.target.value)}
            placeholder="Hello {{Name}}, here's what's new"
            required
          />
        </div>

        <Separator className="bg-[rgba(32,32,32,0.08)]" />

        {/* ── Reply-to ── */}
        <div className="space-y-2">
          <label className="block text-[13px] font-medium text-[#202020]">
            Reply-to <span className="text-[#8d8d8d] font-normal">optional</span>
          </label>
          <Input
            type="email"
            value={replyTo}
            onChange={e => setReplyTo(e.target.value)}
            placeholder="you@company.com"
          />
        </div>

        <Separator className="bg-[rgba(32,32,32,0.08)]" />

        {/* ── Recipients file ── */}
        <div className="space-y-2">
          <label className="block text-[13px] font-medium text-[#202020]">Recipients file</label>
          <div
            className={cn(
              'relative border-2 border-dashed rounded-[10px] px-6 py-8 text-center cursor-pointer transition-all duration-150',
              dragOver
                ? 'border-[#ea2804]/40 bg-[#ea2804]/[0.04]'
                : file
                ? 'border-[rgba(32,32,32,0.2)] bg-[#f3f0e8]'
                : 'border-[rgba(32,32,32,0.15)] hover:border-[rgba(32,32,32,0.3)] hover:bg-[#f3f0e8]/60'
            )}
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
              className="hidden"
            />
            {file ? (
              <div className="flex flex-col items-center gap-2">
                <File size={24} weight="fill" className="text-[#202020]" />
                <div className="text-[13.5px] font-semibold text-[#202020]">{file.name}</div>
                <div className="text-[12px] text-[#8d8d8d]">
                  {(file.size / 1024).toFixed(1)} KB — click to change
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <UploadSimple size={24} className="text-[#8d8d8d]" />
                <div className="text-[13.5px] font-medium text-[#202020]">Drop CSV or Excel file here</div>
                <div className="text-[12px] text-[#8d8d8d]">
                  Must have Name and Email columns — click to browse
                </div>
              </div>
            )}
          </div>
        </div>

        <Separator className="bg-[rgba(32,32,32,0.08)]" />

        {/* ── Email editor + preview ── */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-[13px] font-medium text-[#202020]">Email body</label>
            <div className="flex items-center gap-1 bg-[#f3f0e8] rounded-full p-0.5">
              {['editor', 'preview'].map(tab => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setPreviewTab(tab)}
                  className={cn(
                    'px-3.5 py-1.5 text-[12px] font-medium rounded-full transition-all duration-100',
                    previewTab === tab
                      ? 'bg-white text-[#202020] shadow-sm'
                      : 'text-[#8d8d8d] hover:text-[#202020]'
                  )}
                >
                  {tab === 'editor' ? 'Write' : 'Preview email'}
                </button>
              ))}
            </div>
          </div>

          {/* Editor stays mounted so Tiptap's internal state survives tab switches — only visibility toggles */}
          <div className={previewTab === 'editor' ? '' : 'hidden'}>
            <EmailEditor key={editorKey} onChange={setEmailHtml} />
          </div>

          {previewTab === 'preview' && (
            <div className="border border-[rgba(32,32,32,0.12)] rounded-[10px] overflow-hidden bg-[#f5f4f0] min-h-[360px]">
              {previewHtml ? (
                <iframe
                  title="Email preview"
                  srcDoc={previewHtml}
                  sandbox="allow-same-origin"
                  className="w-full h-[480px] border-none"
                />
              ) : (
                <div className="flex items-center justify-center h-[360px] text-[#8d8d8d] text-[13px]">
                  Write some content first to see a preview
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Actions ── */}
        <div className="flex items-center gap-3 pt-2">
          <Button type="submit" disabled={loading} className="gap-1.5">
            <PaperPlaneTilt size={14} weight="fill" />
            {loading ? 'Starting...' : 'Send campaign'}
          </Button>
          <button
            type="button"
            onClick={handleCancel}
            className={cn(buttonVariants({ variant: 'ghost' }), 'text-[#646464]')}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
