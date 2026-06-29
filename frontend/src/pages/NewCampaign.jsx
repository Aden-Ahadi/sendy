import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, PaperPlaneTilt, UploadSimple, File, Warning, CheckCircle } from '@phosphor-icons/react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import EmailEditor from '../components/EmailEditor';
import { api } from '../lib/api';

export default function NewCampaign() {
  const fileInputRef = useRef(null);

  const [subject, setSubject] = useState('');
  const [replyTo, setReplyTo] = useState('');
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [emailHtml, setEmailHtml] = useState('');
  const [previewTab, setPreviewTab] = useState('editor');
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
    if (!file) return setError('Upload a recipients file to continue.');
    if (!emailHtml || emailHtml === '<p></p>') return setError('Email content cannot be empty.');
    setError('');
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('recipientsFile', file);
      formData.append('subject', subject);
      formData.append('emailContent', emailHtml);
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
        <h2 className="text-[20px] font-bold tracking-[-0.025em] text-[#202020] mb-2">Campaign started</h2>
        <p className="text-[13.5px] text-[#646464] mb-7 max-w-[300px] leading-relaxed">
          Sending to {success.totalRecipients} recipients in the background.
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

  return (
    <div className="max-w-[640px]">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-[#8d8d8d] hover:text-[#202020] text-[13px] font-medium mb-7 transition-colors duration-150"
      >
        <ArrowLeft size={14} />
        Back
      </Link>

      <h1 className="text-[22px] font-bold tracking-[-0.025em] text-[#202020] mb-1" style={{ fontFamily: 'var(--font-display)' }}>New campaign</h1>
      <p className="text-[13px] text-[#646464] mb-7 leading-relaxed">
        Use <span className="font-medium text-[#202020]">Name</span> and <span className="font-medium text-[#202020]">Email</span> tokens in curly braces to personalize each message.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="flex items-center gap-2.5 bg-red-50 border border-red-100 rounded-full px-4 py-3 text-red-600 text-[13px]">
            <Warning size={14} weight="fill" className="flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Subject */}
        <div className="space-y-2">
          <label className="block text-[13px] font-medium text-[#202020]">Subject line</label>
          <Input
            type="text"
            value={subject}
            onChange={e => setSubject(e.target.value)}
            placeholder="Hello {{Name}}, here's what's new"
            required
          />
          <p className="text-[12px] text-[#8d8d8d]">
            Supports personalization tokens, e.g. {'{{Name}}'}
          </p>
        </div>

        <Separator className="bg-[rgba(32,32,32,0.08)]" />

        {/* Reply-to */}
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

        {/* File drop zone */}
        <div className="space-y-2">
          <label className="block text-[13px] font-medium text-[#202020]">Recipients file</label>
          <div
            className={`relative border-2 border-dashed rounded-[10px] px-6 py-8 text-center cursor-pointer transition-all duration-150 ${
              dragOver
                ? 'border-[#ea2804]/40 bg-[#ea2804]/[0.04]'
                : file
                ? 'border-[rgba(32,32,32,0.2)] bg-[#f3f0e8]'
                : 'border-[rgba(32,32,32,0.15)] hover:border-[rgba(32,32,32,0.3)] hover:bg-[#f3f0e8]/60'
            }`}
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

        {/* Email editor */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-[13px] font-medium text-[#202020]">Email</label>
            <div className="flex items-center gap-1 bg-[#f3f0e8] rounded-full p-0.5">
              {['editor', 'preview'].map(tab => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setPreviewTab(tab)}
                  className={`px-3.5 py-1.5 text-[12px] font-medium rounded-full transition-all duration-100 ${
                    previewTab === tab
                      ? 'bg-white text-[#202020] shadow-sm'
                      : 'text-[#8d8d8d] hover:text-[#202020]'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {previewTab === 'editor' ? (
            <EmailEditor onChange={setEmailHtml} />
          ) : (
            <div className="border border-[rgba(32,32,32,0.12)] rounded-[10px] overflow-hidden bg-white min-h-[320px]">
              {emailHtml && emailHtml !== '<p></p>' ? (
                <iframe
                  title="Email preview"
                  srcDoc={emailHtml
                    .replace(/\{\{Name\}\}/g, 'Jane')
                    .replace(/\{\{Email\}\}/g, 'jane@example.com')}
                  sandbox="allow-same-origin"
                  className="w-full h-[400px] border-none"
                />
              ) : (
                <div className="flex items-center justify-center h-[320px] text-[#8d8d8d] text-[13px]">
                  Write some content first to see a preview
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <Button type="submit" disabled={loading}>
            <PaperPlaneTilt size={14} weight="fill" />
            {loading ? 'Starting...' : 'Send campaign'}
          </Button>
          <Link to="/" className={cn(buttonVariants({ variant: 'ghost' }), 'text-[#646464]')}>
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
