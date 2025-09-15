import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { api } from './api';
import dayjs from 'dayjs';

// ---------- Tiny Modal ----------
function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(720px, 92vw)', maxHeight: '80vh', overflow: 'auto',
          background: '#111826', color: '#e5e7eb', // dark theme-friendly
          borderRadius: 12, padding: 20, boxShadow: '0 10px 30px rgba(0,0,0,0.4)'
        }}
      >
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12}}>
          <h3 style={{margin:0, fontSize:20}}>{title}</h3>
          <button onClick={onClose} style={{padding:'6px 10px', borderRadius:8, border:'1px solid #374151'}}>Close</button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
}

// ---------- Table Row ----------
function Row({ t, onCheck, onDelete, onViewSummary }) {
  return (
    <tr>
      <td style={{ wordBreak: 'break-all' }}>{t.url}</td>
      <td>{t.mode}</td>
      <td>{t.selector || <em>none</em>}</td>
      <td>{t.targetPrice ?? '-'}</td>
      <td>{t.lastValue ?? '-'}</td>
      <td>{t.usedBrowserLast ?? '-'}</td>
      <td>
        {t.error ? (
          <span style={{ color: 'crimson' }}>{t.error}</span>
        ) : t.lastCheckedAt ? (
          dayjs(t.lastCheckedAt).fromNow()
        ) : (
          '-'
        )}
      </td>
      <td style={{whiteSpace:'nowrap'}}>
        {t.mode === 'content' && t.lastSummary ? (
          <button onClick={() => onViewSummary(t)} style={{marginRight:8}}>View</button>
        ) : null}
        <button onClick={() => onCheck(t._id)} style={{marginRight:8}}>Check</button>
        <button onClick={() => onDelete(t._id)} style={{ color: 'crimson' }}>Delete</button>
      </td>
    </tr>
  );
}

function App() {
  const [items, setItems] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState(null); // { url, summary, selector, lastCheckedAt }

  const { register, handleSubmit, reset, watch } = useForm({
    defaultValues: { url: '', mode: 'price', selector: '', targetPrice: '', checkIntervalMins: 15 }
  });
  const mode = watch('mode');

  async function load() {
    const { data } = await api.get('/trackers');
    setItems(data);
  }
  useEffect(() => { load(); }, []);

  async function onCreate(form) {
    const clean = {
      url: form.url.trim(),
      mode: form.mode,
      selector: form.selector || undefined,
      targetPrice: form.mode === 'price' && form.targetPrice ? Number(form.targetPrice) : undefined,
      checkIntervalMins: Number(form.checkIntervalMins || 15)
    };
    await api.post('/trackers', clean);
    reset({ url: '', mode: form.mode, selector: '', targetPrice: '', checkIntervalMins: 15 });
    load();
  }

  async function onCheck(id) {
    await api.post(`/trackers/${id}/check`);
    load();
  }

  async function onDelete(id) {
    await api.delete(`/trackers/${id}`);
    load();
  }

  function onViewSummary(t) {
    setModalData({
      url: t.url,
      selector: t.selector,
      lastCheckedAt: t.lastCheckedAt,
      summary: t.lastSummary
    });
    setModalOpen(true);
  }

  return (
    <div style={{ maxWidth: 1000, margin: '2rem auto', fontFamily: 'ui-sans-serif, system-ui' }}>
      <h2>Web Monitor & Price Tracker</h2>

      <form
        onSubmit={handleSubmit(onCreate)}
        style={{
          display: 'grid',
          gap: 8,
          gridTemplateColumns: '1fr 120px 1fr 1fr 120px auto',
          alignItems: 'end'
        }}
      >
        <div style={{ gridColumn: '1 / span 6' }}>
          <label>
            URL<br />
            <input {...register('url', { required: true })} placeholder="https://..." style={{ width: '100%' }} />
          </label>
        </div>

        <label>
          Mode<br />
          <select {...register('mode')}>
            <option value="price">price</option>
            <option value="content">content</option>
          </select>
        </label>

        <label>
          Selector (optional)<br />
          <input {...register('selector')} placeholder="#price .amount or .main-content" />
        </label>

        {mode === 'price' ? (
          <label>
            Target Price<br />
            <input type="number" step="0.01" {...register('targetPrice')} placeholder="e.g. 999.00" />
          </label>
        ) : (
          <div />
        )}

        <label>
          Interval (mins)<br />
          <input type="number" {...register('checkIntervalMins')} />
        </label>

        <div>
          <button type="submit">Add</button>
        </div>
      </form>

      <div style={{ marginTop: 24 }}>
        <table width="100%" cellPadding="6" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f2f2f2', color: '#000' }}>
              <th>URL</th>
              <th>Mode</th>
              <th>Selector</th>
              <th>Target</th>
              <th>Last Value</th>
              <th>Via</th>
              <th>Last Check</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((t) => (
              <Row
                key={t._id}
                t={t}
                onCheck={onCheck}
                onDelete={onDelete}
                onViewSummary={onViewSummary}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Page Summary"
      >
        {modalData ? (
          <div style={{lineHeight:1.5}}>
            <div style={{fontSize:14, color:'#9ca3af', marginBottom:8}}>
              <div><b>URL:</b> <span style={{wordBreak:'break-all'}}>{modalData.url}</span></div>
              {modalData.selector ? <div><b>Selector:</b> {modalData.selector}</div> : null}
              {modalData.lastCheckedAt ? <div><b>Last Checked:</b> {dayjs(modalData.lastCheckedAt).format('YYYY-MM-DD HH:mm')}</div> : null}
            </div>
            <div style={{fontSize:16}}>
              {modalData.summary || 'No summary available.'}
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

export default App;
