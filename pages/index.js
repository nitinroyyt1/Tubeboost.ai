import Head from 'next/head';
import { useState } from 'react';

function getVideoId(url) {
  try {
    const u = new URL(url.trim());
    if (u.hostname.includes('youtu.be')) return u.pathname.slice(1).split('?')[0];
    return u.searchParams.get('v');
  } catch { return null; }
}

export default function Home() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultTitle, setResultTitle] = useState('');
  const [resultType, setResultType] = useState('');
  const [resultData, setResultData] = useState(null);
  const [copied, setCopied] = useState(false);

  async function callAPI(prompt, action) {
    const res = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, action }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'API error');
    return data.result;
  }

  async function handleAction(action) {
    const trimmed = url.trim();
    if (!trimmed) { alert('Pehle YouTube URL paste karein!'); return; }
    const videoId = getVideoId(trimmed);
    if (!videoId) { alert('Valid YouTube URL nahi hai!'); return; }

    if (action === 'thumbnail') {
      setResultTitle('THUMBNAIL DOWNLOADER');
      setResultType('thumbnail');
      setResultData(videoId);
      return;
    }
    if (action === 'video' || action === 'audio') {
      setResultTitle(action === 'video' ? 'VIDEO DOWNLOAD' : 'AUDIO DOWNLOAD');
      setResultType('dl');
      setResultData(action);
      return;
    }

    const prompts = {
      tags: `YouTube Video URL: ${trimmed}\n\nIs video ke liye 18 high-ranking SEO tags generate karo. Sirf numbered list do.`,
      transcript: `YouTube Video URL: ${trimmed}\n\n3 key takeaway bullet points likho aur ek SEO description suggest karo.`,
      title: `YouTube Video URL: ${trimmed}\n\n3 click-worthy SEO titles generate karo har ek ke saath ek reason. Numbered list mein.`,
      description: `YouTube Video URL: ${trimmed}\n\nEk full SEO-optimized YouTube description likho jisme hook, keywords, hashtags aur call to action ho.`,
    };

    const titles = {
      tags: 'SEO TAG EXTRACTOR',
      transcript: 'VIDEO SUMMARY',
      title: 'TITLE OPTIMIZER',
      description: 'DESCRIPTION OPTIMIZER',
    };

    setResultTitle(titles[action]);
    setResultType('loading');
    setResultData(null);
    setLoading(true);

    try {
      const result = await callAPI(prompts[action], action);
      if (action === 'tags') {
        const lines = result.split('\n').filter(l => l.trim());
        const tags = lines.map(l => l.replace(/^\d+[\.\)]\s*/, '').replace(/\*+/g, '').trim()).filter(Boolean);
        setResultType('tags');
        setResultData(tags.slice(0, 18));
      } else {
        setResultType('text');
        setResultData(result);
      }
    } catch (err) {
      setResultType('error');
      setResultData(err.message);
    } finally {
      setLoading(false);
    }
  }

  function copyAll() {
    let text = '';
    if (resultType === 'tags' && Array.isArray(resultData)) text = resultData.join(', ');
    else if (resultType === 'text') text = resultData;
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <>
      <Head>
        <title>TubeBoost AI</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet" />
      </Head>
      <div className="page">
        <div className="container">
          <header>
            <div className="badge"><span className="dot" />AI Powered • YouTube SEO Tool</div>
            <h1>TUBE<span>BOOST</span> AI</h1>
            <p className="subtitle">Your Ultimate YouTube Assistant</p>
          </header>

          <div className="input-section">
            <div className="input-label">YouTube Video URL</div>
            <input type="text" value={url} onChange={e => setUrl(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAction('title')} placeholder="https://www.youtube.com/watch?v=..." />
            <div className="buttons-grid">
              {[
                { action: 'tags', icon: '🏷️', label: 'Extract Tags', sub: '18 SEO keywords' },
                { action: 'transcript', icon: '📝', label: 'Get Summary', sub: 'Key takeaways' },
                { action: 'title', icon: '✍️', label: 'Optimize Title', sub: '3 CTR titles' },
                { action: 'description', icon: '📄', label: 'Optimize Description', sub: 'SEO + hashtags' },
                { action: 'thumbnail', icon: '🖼️', label: 'Download Thumbnail', sub: 'HD quality' },
                { action: 'video', icon: '🎬', label: 'Download Video', sub: 'Pro Feature' },
                { action: 'audio', icon: '🎵', label: 'Download Audio', sub: 'Pro Feature' },
              ].map(({ action, icon, label, sub }) => (
                <button key={action} className="action-btn" onClick={() => handleAction(action)}>
                  <span className="btn-icon">{icon}</span>
                  <span className="btn-text"><strong>{label}</strong><small>{sub}</small></span>
                </button>
              ))}
            </div>
          </div>

          {resultType && (
            <div className="result-area">
              <div className="result-header">
                <span className="result-title">{resultTitle}</span>
                {(resultType === 'text' || resultType === 'tags') && (
                  <button className="copy-btn" onClick={copyAll}>{copied ? '✓ Copied!' : '⎘ Copy All'}</button>
                )}
              </div>
              {resultType === 'loading' && <div className="loading-dots"><span className="ld"/><span className="ld"/><span className="ld"/><span style={{marginLeft:8,color:'#666',fontSize:13}}>AI processing...</span></div>}
              {resultType === 'text' && <div className="result-content" dangerouslySetInnerHTML={{__html: resultData.replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>').replace(/\n/g,'<br/>')}} />}
              {resultType === 'tags' && Array.isArray(resultData) && (
                <div className="tags-container">
                  {resultData.map((tag, i) => (
                    <span key={i} className="tag-chip" style={{animationDelay:`${i*0.04}s`}} onClick={() => navigator.clipboard.writeText(tag)} title="Click to copy">{tag}</span>
                  ))}
                </div>
              )}
              {resultType === 'thumbnail' && (
                <div className="thumbnail-display">
                  <img src={`https://img.youtube.com/vi/${resultData}/maxresdefault.jpg`} onError={e => { e.target.src=`https://img.youtube.com/vi/${resultData}/hqdefault.jpg`; }} alt="Thumbnail" />
                  <div className="thumb-actions">
                    <a className="thumb-btn" href={`https://img.youtube.com/vi/${resultData}/maxresdefault.jpg`} download target="_blank" rel="noreferrer">⬇ HD</a>
                    <a className="thumb-btn" href={`https://img.youtube.com/vi/${resultData}/hqdefault.jpg`} download target="_blank" rel="noreferrer">⬇ HQ</a>
                  </div>
                </div>
              )}
              {resultType === 'dl' && (
                <div className="dl-info"><div className="dl-note"><strong>Pro Feature</strong><br/><br/>Video/Audio download ke liye backend server chahiye. Abhi sirf AI features available hain.</div></div>
              )}
              {resultType === 'error' && <div className="error-msg">Error: {resultData}</div>}
            </div>
          )}
          <footer>TUBEBOOST AI • Built for YouTube Creators</footer>
        </div>
      </div>
      <style jsx global>{`
        *{margin:0;padding:0;box-sizing:border-box}
        :root{--red:#FF0000;--red-glow:#ff000040;--dark:#0a0a0a;--dark2:#111;--dark3:#1a1a1a;--border:#2a2a2a;--text:#e8e8e8;--muted:#666;--gold:#FFD700;--green:#00FF88}
        body{background:var(--dark);color:var(--text);font-family:'DM Sans',sans-serif;min-height:100vh}
        .page{min-height:100vh;background:radial-gradient(ellipse 80% 50% at 50% -20%,#ff000015 0%,transparent 60%)}
        .container{max-width:860px;margin:0 auto;padding:0 20px}
        header{padding:48px 0 28px;text-align:center}
        .badge{display:inline-flex;align-items:center;gap:8px;background:rgba(255,0,0,.1);border:1px solid rgba(255,0,0,.3);padding:5px 14px;border-radius:100px;font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--red);letter-spacing:2px;margin-bottom:18px}
        .dot{width:6px;height:6px;background:var(--red);border-radius:50%;animation:pulse 1.5s ease-in-out infinite}
        @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(.8)}}
        h1{font-family:'Bebas Neue',sans-serif;font-size:clamp(48px,10vw,88px);letter-spacing:2px;line-height:.95}
        h1 span{color:var(--red);text-shadow:0 0 40px var(--red-glow)}
        .subtitle{color:var(--muted);font-size:14px;margin-top:10px}
        .input-section{background:var(--dark2);border:1px solid var(--border);border-radius:16px;padding:24px;margin:28px 0 20px}
        .input-label{font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:3px;color:var(--muted);text-transform:uppercase;margin-bottom:10px}
        input[type="text"]{width:100%;background:var(--dark3);border:1px solid var(--border);border-radius:10px;padding:14px 18px;color:var(--text);font-family:'DM Sans',sans-serif;font-size:15px;outline:none;transition:border-color .2s}
        input[type="text"]:focus{border-color:var(--red);box-shadow:0 0 0 3px rgba(255,0,0,.1)}
        input[type="text"]::placeholder{color:var(--muted)}
        .buttons-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-top:16px}
        .action-btn{display:flex;align-items:center;gap:10px;background:var(--dark3);border:1px solid var(--border);border-radius:10px;padding:13px 16px;color:var(--text);font-family:'DM Sans',sans-serif;cursor:pointer;transition:all .2s;text-align:left;width:100%}
        .action-btn:hover{border-color:var(--red);background:rgba(255,0,0,.06);transform:translateY(-1px)}
        .btn-icon{font-size:20px;width:32px;text-align:center;flex-shrink:0}
        .btn-text{display:flex;flex-direction:column}
        .btn-text strong{font-weight:600;font-size:13px}
        .btn-text small{color:var(--muted);font-size:11px;margin-top:2px}
        .result-area{background:var(--dark2);border:1px solid var(--border);border-radius:16px;overflow:hidden;margin-bottom:40px;animation:fadeIn .3s ease}
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        .result-header{display:flex;align-items:center;justify-content:space-between;padding:13px 20px;border-bottom:1px solid var(--border);background:var(--dark3)}
        .result-title{font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:2px;color:var(--red);text-transform:uppercase}
        .copy-btn{background:rgba(255,255,255,.05);border:1px solid var(--border);border-radius:6px;padding:6px 14px;color:var(--text);font-family:'JetBrains Mono',monospace;font-size:11px;cursor:pointer;transition:all .2s}
        .copy-btn:hover{border-color:var(--green);color:var(--green)}
        .loading-dots{display:flex;align-items:center;gap:6px;padding:24px 20px}
        .ld{width:7px;height:7px;background:var(--red);border-radius:50%;animation:bounce 1.2s ease-in-out infinite}
        .ld:nth-child(2){animation-delay:.2s}.ld:nth-child(3){animation-delay:.4s}
        @keyframes bounce{0%,100%{transform:translateY(0);opacity:.4}50%{transform:translateY(-7px);opacity:1}}
        .result-content{padding:20px;font-size:14px;line-height:1.9;white-space:pre-wrap}
        .tags-container{padding:18px;display:flex;flex-wrap:wrap;gap:8px}
        .tag-chip{background:rgba(255,0,0,.08);border:1px solid rgba(255,0,0,.25);border-radius:100px;padding:5px 13px;font-size:12px;font-family:'JetBrains Mono',monospace;color:#ff9999;cursor:pointer;transition:all .15s;animation:tagIn .3s ease backwards}
        .tag-chip:hover{background:rgba(255,0,0,.18);border-color:var(--red);color:#fff}
        @keyframes tagIn{from{opacity:0;transform:scale(.8)}to{opacity:1;transform:scale(1)}}
        .thumbnail-display{padding:20px;text-align:center}
        .thumbnail-display img{max-width:100%;border-radius:10px;border:1px solid var(--border)}
        .thumb-actions{display:flex;gap:10px;justify-content:center;margin-top:14px;flex-wrap:wrap}
        .thumb-btn{background:var(--dark3);border:1px solid var(--border);border-radius:8px;padding:8px 16px;color:var(--text);font-size:12px;font-family:'JetBrains Mono',monospace;text-decoration:none;transition:all .2s}
        .thumb-btn:hover{border-color:var(--gold);color:var(--gold)}
        .dl-info{padding:20px}
        .dl-note{background:rgba(255,184,0,.08);border:1px solid rgba(255,184,0,.2);border-radius:10px;padding:16px;font-size:13px;color:#ffcc66;line-height:1.8}
        .dl-note strong{color:var(--gold)}
        .error-msg{padding:20px;color:#ff6666;font-size:13px}
        footer{text-align:center;padding:10px 0 48px;color:var(--muted);font-size:12px;font-family:'JetBrains Mono',monospace}
        @media(max-width:600px){.buttons-grid{grid-template-columns:1fr}h1{font-size:48px}}
      `}</style>
    </>
  );
    }
