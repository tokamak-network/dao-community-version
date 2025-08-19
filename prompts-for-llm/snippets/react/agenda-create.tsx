// React example: Agenda Create Form
import React, { useState } from 'react';

const AgendaCreate: React.FC = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [actions, setActions] = useState([{ contract: '', signature: '', params: '' }]);
  const [announcementUrl, setAnnouncementUrl] = useState('');
  const [snapshotUrl, setSnapshotUrl] = useState('');

  const handleActionChange = (idx: number, field: string, value: string) => {
    setActions(actions => actions.map((a, i) => i === idx ? { ...a, [field]: value } : a));
  };

  const addAction = () => setActions([...actions, { contract: '', signature: '', params: '' }]);
  const removeAction = (idx: number) => setActions(actions => actions.filter((_, i) => i !== idx));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Submit logic here
    alert('Agenda submitted!');
  };

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Title:
        <input value={title} onChange={e => setTitle(e.target.value)} required />
      </label>
      <label>
        Description:
        <textarea value={description} onChange={e => setDescription(e.target.value)} required />
      </label>
      <div>
        <b>Execution Actions:</b>
        {actions.map((action, idx) => (
          <div key={idx}>
            <input placeholder="Contract Address" value={action.contract} onChange={e => handleActionChange(idx, 'contract', e.target.value)} required />
            <input placeholder="Function Signature" value={action.signature} onChange={e => handleActionChange(idx, 'signature', e.target.value)} required />
            <input placeholder="Params" value={action.params} onChange={e => handleActionChange(idx, 'params', e.target.value)} />
            <button type="button" onClick={() => removeAction(idx)} disabled={actions.length === 1}>Remove</button>
          </div>
        ))}
        <button type="button" onClick={addAction}>Add Action</button>
      </div>
      <label>
        Announcement URL:
        <input type="url" value={announcementUrl} onChange={e => setAnnouncementUrl(e.target.value)} />
      </label>
      <label>
        Snapshot URL:
        <input type="url" value={snapshotUrl} onChange={e => setSnapshotUrl(e.target.value)} />
      </label>
      <button type="submit">Submit Agenda</button>
    </form>
  );
};

export default AgendaCreate;