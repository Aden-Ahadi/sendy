import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, PaperPlaneTilt, UploadSimple, File, Warning, CheckCircle } from '@phosphor-icons/react';
import { BroadcastIcon } from '../components/icons';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import EmailEditor from '../components/EmailEditor';
import { api } from '../lib/api';
import { buildPreviewHtml } from '../lib/emailPreview';

function MinimalThumb() {
  return (
    <div className="w-full h-[72px] rounded-[5px] bg-[#f0ede7] dark:bg-[#1e1d1b] overflow-hidden flex items-center justify-center p-2">
      <div className="w-full h-full bg-white dark:bg-[#252320] rounded-[4px] px-3 py-2.5 flex flex-col gap-1.5">
        <div className="h-2 w-2/5 bg-[#d4d0ca] dark:bg-[#3a3835] rounded-[2px]" />
        <div className="h-1.5 w-full bg-[#e8e5de] dark:bg-[#2e2c29] rounded-[2px]" />
        <div className="h-1.5 w-4/5 bg-[#e8e5de] dark:bg-[#2e2c29] rounded-[2px]" />
        <div className="h-1.5 w-full bg-[#e8e5de] dark:bg-[#2e2c29] rounded-[2px]" />
      </div>
    </div>
  );
}

function BrandedThumb() {
  return (
    <div className="w-full h-[72px] rounded-[5px] bg-[#f0ede7] dark:bg-[#1e1d1b] overflow-hidden flex flex-col">
      <div className="bg-white dark:bg-[#252320] border-b border-[#eaeaea] dark:border-[rgba(255,250,240,0.07)] h-[22px] flex items-center justify-center flex-shrink-0">
        <div className="w-7 h-3 bg-[#ccc] dark:bg-[#3a3835] rounded-[2px]" />
      </div>
      <div className="flex-1 bg-white dark:bg-[#252320] px-3 py-2 flex flex-col gap-1.5">
        <div className="h-1.5 w-2/5 bg-[#d4d0ca] dark:bg-[#3a3835] rounded-[2px]" />
        <div className="h-1.5 w-full bg-[#e8e5de] dark:bg-[#2e2c29] rounded-[2px]" />
        <div className="h-1.5 w-3/4 bg-[#e8e5de] dark:bg-[#2e2c29] rounded-[2px]" />
      </div>
      <div className="bg-[#f5f4f0] dark:bg-[#1a1917] h-[12px] border-t border-[#eaeaea] dark:border-[rgba(255,250,240,0.07)]" />
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

const DEFAULT_SHELL = 'branded';

export default function NewCampaign() {
  const fileInputRef = useRef(null);

  const [shell,       setShell]       = useState(DEFAULT_SHELL);
  const [subject,     setSubject]     = useState('');
  const [file,        setFile]        = useState(null);
  const [dragOver,    setDragOver]    = useState(false);
  const [emailHtml,   setEmailHtml]   = useState('');
  const [previewTab,  setPreviewTab]  = useState('editor');
  const [editorKey,   setEditorKey]   = useState(0);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState('');
  const [success,     setSuccess]     = useState(null);

  function handleCancel() {
    setShell(DEFAULT_SHELL);
    setSubject('');
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
        <div className="w-14 h-14 rounded-full bg-[#EDF3EC] dark:bg-[#1a2e1c] flex items-center justify-center mb-5">
          <CheckCircle size={28} weight="fill" className="text-[#346538]" />
        </div>
        <h2
          className="text-[20px] font-bold tracking-[-0.025em] text-[#202020] dark:text-[#edeae4] mb-2"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Campaign started
        </h2>
        <p className="text-[15px] text-[#646464] dark:text-[#8a8680] mb-7 max-w-[300px] leading-relaxed">
          Sending to {success.totalRecipients} recipients using the{' '}
          <span className="font-medium text-[#202020] dark:text-[#edeae4]">{shell}</span> template.
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
        className="inline-flex items-center gap-1.5 text-[#8d8d8d] dark:text-[#625e59] hover:text-[#202020] dark:hover:text-[#edeae4] text-[15px] font-medium mb-7 transition-colors duration-150"
      >
        <ArrowLeft size={14} />
        Back
      </Link>

      <h1
        className="text-[22px] font-bold tracking-[-0.025em] text-[#202020] dark:text-[#edeae4] mb-1"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        New campaign
      </h1>
      <p className="text-[15px] text-[#646464] dark:text-[#8a8680] mb-7 leading-relaxed">
        Use{' '}
        <span className="font-mono text-[14px] bg-[#f3f0e8] dark:bg-[#252320] text-[#8d8d8d] dark:text-[#625e59] px-1.5 py-0.5 rounded-[4px]">{'{{Name}}'}</span>
        {' '}and{' '}
        <span className="font-mono text-[14px] bg-[#f3f0e8] dark:bg-[#252320] text-[#8d8d8d] dark:text-[#625e59] px-1.5 py-0.5 rounded-[4px]">{'{{Email}}'}</span>
        {' '}to personalise each message.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="flex items-center gap-2.5 bg-red-50 dark:bg-[#2a1515] border border-red-100 dark:border-red-900/40 rounded-full px-4 py-3 text-red-600 dark:text-red-400 text-[15px]">
            <Warning size={14} weight="fill" className="flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Template shell picker */}
        <div className="space-y-3">
          <label className="block text-[15px] font-medium text-[#202020] dark:text-[#edeae4]">Email format</label>
          <div className="grid grid-cols-2 gap-3">
            {SHELLS.map(({ id, label, description, Thumb }) => (
              <button
                key={id}
                type="button"
                onClick={() => setShell(id)}
                className={cn(
                  'text-left rounded-[10px] border p-3 transition-all duration-150 space-y-2',
                  shell === id
                    ? 'border-[#202020] dark:border-[#edeae4] bg-white dark:bg-[#1c1b19] shadow-[0_0_0_1px_#202020] dark:shadow-[0_0_0_1px_#edeae4]'
                    : 'border-[rgba(32,32,32,0.12)] dark:border-[rgba(255,250,240,0.10)] bg-white dark:bg-[#1c1b19] hover:border-[rgba(32,32,32,0.28)] dark:hover:border-[rgba(255,250,240,0.22)]'
                )}
              >
                <Thumb />
                <div>
                  <div className="text-[12.5px] font-semibold text-[#202020] dark:text-[#edeae4]">{label}</div>
                  <div className="text-[14px] text-[#8d8d8d] dark:text-[#625e59] leading-snug mt-0.5">{description}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <Separator className="bg-[rgba(32,32,32,0.08)] dark:bg-[rgba(255,250,240,0.07)]" />

        {/* Subject */}
        <div className="space-y-2">
          <label className="block text-[15px] font-medium text-[#202020] dark:text-[#edeae4]">Subject line</label>
          <Input
            type="text"
            value={subject}
            onChange={e => setSubject(e.target.value)}
            placeholder="Hello {{Name}}, here's what's new"
            required
          />
        </div>

        <Separator className="bg-[rgba(32,32,32,0.08)] dark:bg-[rgba(255,250,240,0.07)]" />

        {/* Recipients file */}
        <div className="space-y-2">
          <label className="block text-[15px] font-medium text-[#202020] dark:text-[#edeae4]">Recipients file</label>
          <div
            className={cn(
              'relative border-2 border-dashed rounded-[10px] px-6 py-8 text-center cursor-pointer transition-all duration-150',
              dragOver
                ? 'border-[#ea2804]/40 bg-[#ea2804]/[0.04]'
                : file
                ? 'border-[rgba(32,32,32,0.2)] dark:border-[rgba(255,250,240,0.15)] bg-[#f3f0e8] dark:bg-[#252320]'
                : 'border-[rgba(32,32,32,0.15)] dark:border-[rgba(255,250,240,0.10)] hover:border-[rgba(32,32,32,0.3)] dark:hover:border-[rgba(255,250,240,0.22)] hover:bg-[#f3f0e8]/60 dark:hover:bg-[#252320]/60'
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
                <File size={24} weight="fill" className="text-[#202020] dark:text-[#edeae4]" />
                <div className="text-[15px] font-semibold text-[#202020] dark:text-[#edeae4]">{file.name}</div>
                <div className="text-[14px] text-[#8d8d8d] dark:text-[#625e59]">
                  {(file.size / 1024).toFixed(1)} KB — click to change
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <UploadSimple size={24} className="text-[#8d8d8d] dark:text-[#625e59]" />
                <div className="text-[15px] font-medium text-[#202020] dark:text-[#edeae4]">Drop CSV or Excel file here</div>
                <div className="text-[14px] text-[#8d8d8d] dark:text-[#625e59]">
                  Must have Name and Email columns — click to browse
                </div>
              </div>
            )}
          </div>
        </div>

        <Separator className="bg-[rgba(32,32,32,0.08)] dark:bg-[rgba(255,250,240,0.07)]" />

        {/* Email editor + preview */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-[15px] font-medium text-[#202020] dark:text-[#edeae4]">Email body</label>
            <div className="flex items-center gap-1 bg-[#f3f0e8] dark:bg-[#252320] rounded-full p-0.5">
              {['editor', 'preview'].map(tab => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setPreviewTab(tab)}
                  className={cn(
                    'px-3.5 py-1.5 text-[14px] font-medium rounded-full transition-all duration-100',
                    previewTab === tab
                      ? 'bg-white dark:bg-[#2a2825] text-[#202020] dark:text-[#edeae4] shadow-sm'
                      : 'text-[#8d8d8d] dark:text-[#625e59] hover:text-[#202020] dark:hover:text-[#edeae4]'
                  )}
                >
                  {tab === 'editor' ? 'Write' : 'Preview email'}
                </button>
              ))}
            </div>
          </div>

          <div className={previewTab === 'editor' ? '' : 'hidden'}>
            <EmailEditor key={editorKey} onChange={setEmailHtml} />
          </div>

          {previewTab === 'preview' && (
            <div className="border border-[rgba(32,32,32,0.12)] dark:border-[rgba(255,250,240,0.10)] rounded-[10px] overflow-hidden bg-[#f5f4f0] dark:bg-[#111110] min-h-[360px]">
              {previewHtml ? (
                <iframe
                  title="Email preview"
                  srcDoc={previewHtml}
                  sandbox="allow-same-origin"
                  className="w-full h-[480px] border-none"
                />
              ) : (
                <div className="flex items-center justify-center h-[360px] text-[#8d8d8d] dark:text-[#625e59] text-[15px]">
                  Write some content first to see a preview
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <Button type="submit" disabled={loading} className="gap-1.5">
            <PaperPlaneTilt size={19} weight="fill" />
            {loading ? 'Starting...' : 'Send campaign'}
          </Button>
          <button
            type="button"
            onClick={handleCancel}
            className={cn(buttonVariants({ variant: 'ghost' }), 'text-[#646464] dark:text-[#8a8680]')}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
