'use client';

/**
 * Form building blocks shared by the admin page editors (ConditionPageEditor
 * and SitePageEditor). A section is described as data —
 *   { k: 'title', label: 'Heading', t: 'textarea' }
 * — and rendered by <Fields>. Types:
 *   text (default) · textarea · number · url · select (options) · checkbox
 *   cta         { label, href }
 *   strings     string[] edited one per line
 *   paragraphs  string[] edited with a blank line between
 *   group       nested object with its own `fields`
 *   list        array of objects with `item` fields (add / reorder / remove)
 *   keyedLists  { [name]: item[] } — one list per name taken from the sibling
 *               field `keysFrom` (e.g. FAQ answers per tab)
 * Styles live in CMS_FIELDS_CSS (prefix cf-).
 */

const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);

export const emptyItem = (fields) => Object.fromEntries(fields.map((f) => [
  f.k,
  f.t === 'strings' || f.t === 'paragraphs' || f.t === 'list' ? []
    : f.t === 'number' ? 0
      : f.t === 'checkbox' ? false
        : f.t === 'cta' ? { label: '', href: '' }
          : f.t === 'group' ? emptyItem(f.fields)
            : f.t === 'keyedLists' ? {}
              : '',
]));

/** Drop the blank lines kept while typing in the one-per-line fields; trim trailing space. */
export function tidy(value) {
  if (Array.isArray(value)) return value.map(tidy).filter((x) => !(typeof x === 'string' && !x.trim()));
  if (isObj(value)) return Object.fromEntries(Object.entries(value).map(([k, x]) => [k, tidy(x)]));
  return typeof value === 'string' ? value.replace(/\s+$/, '') : value;
}

export function Field({ f, value, onChange, parent }) {
  const label = f.label || f.k;
  switch (f.t) {
    case 'textarea':
      return (
        <label className="cf-f"><span>{label}</span>
          <textarea rows={f.rows || 3} value={value ?? ''} onChange={(e) => onChange(e.target.value)} />
        </label>
      );
    case 'number':
      return (
        <label className="cf-f"><span>{label}</span>
          <input type="number" value={value ?? ''} placeholder={f.placeholder || ''}
            onChange={(e) => onChange(e.target.value === '' ? (f.nullable ? null : '') : Number(e.target.value))} />
        </label>
      );
    case 'checkbox':
      return (
        <label className="cf-check">
          <input type="checkbox" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} />
          <span>{label}</span>
        </label>
      );
    case 'select':
      return (
        <label className="cf-f"><span>{label}</span>
          <select value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
            <option value="">—</option>
            {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </label>
      );
    case 'cta':
      return (
        <fieldset className="cf-group"><legend>{label}</legend>
          <input placeholder="Button text" value={value?.label ?? ''} onChange={(e) => onChange({ ...(value || {}), label: e.target.value })} />
          <input placeholder="Link, e.g. /book-malayali-psychologists" value={value?.href ?? ''} onChange={(e) => onChange({ ...(value || {}), href: e.target.value })} />
        </fieldset>
      );
    case 'strings':
      return (
        <label className="cf-f"><span>{label}</span>
          <textarea rows={f.rows || 3} value={(value || []).join('\n')} onChange={(e) => onChange(e.target.value.split('\n'))} />
        </label>
      );
    case 'paragraphs':
      return (
        <label className="cf-f"><span>{label}</span>
          <textarea rows={f.rows || 8} value={(value || []).join('\n\n')} onChange={(e) => onChange(e.target.value.split(/\n\n/))} />
        </label>
      );
    case 'group':
      return (
        <fieldset className="cf-group"><legend>{label}</legend>
          <Fields fields={f.fields} value={value} onChange={onChange} />
        </fieldset>
      );
    case 'list':
      return <ListEditor label={label} items={value} fields={f.item} onChange={onChange} />;
    case 'keyedLists': {
      const names = (parent?.[f.keysFrom] || []).filter((n) => String(n).trim());
      const v = isObj(value) ? value : {};
      return (
        <div className="cf-keyed">
          <p className="cf-keyed-h">{label}</p>
          {names.map((name) => (
            <ListEditor key={name} label={name} items={v[name]} fields={f.item} onChange={(x) => onChange({ ...v, [name]: x })} />
          ))}
        </div>
      );
    }
    default:
      return (
        <label className="cf-f"><span>{label}</span>
          <input type={f.t === 'url' ? 'url' : 'text'} value={value ?? ''} placeholder={f.placeholder || ''} onChange={(e) => onChange(e.target.value)} />
        </label>
      );
  }
}

/** Every field of one object. */
export function Fields({ fields, value, onChange }) {
  const v = isObj(value) ? value : {};
  return fields.map((f) => (
    <Field key={f.k} f={f} value={v[f.k]} parent={v} onChange={(x) => onChange({ ...v, [f.k]: x })} />
  ));
}

export function ListEditor({ label, items, fields, onChange }) {
  const list = Array.isArray(items) ? items : [];
  const move = (i, d) => {
    const t = i + d;
    if (t < 0 || t >= list.length) return;
    const next = [...list];
    [next[i], next[t]] = [next[t], next[i]];
    onChange(next);
  };
  return (
    <div className="cf-list">
      <div className="cf-list-h">
        <span>{label} · {list.length}</span>
        <button type="button" onClick={() => onChange([...list, emptyItem(fields)])}>+ Add</button>
      </div>
      {list.map((it, i) => (
        <div key={i} className="cf-item">
          <div className="cf-item-h">
            <span>#{i + 1}</span>
            <span className="cf-item-tools">
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up">↑</button>
              <button type="button" onClick={() => move(i, 1)} disabled={i === list.length - 1} aria-label="Move down">↓</button>
              <button type="button" className="is-danger" onClick={() => onChange(list.filter((_, j) => j !== i))}>Remove</button>
            </span>
          </div>
          <Fields fields={fields} value={it} onChange={(x) => onChange(list.map((o, j) => (j === i ? x : o)))} />
        </div>
      ))}
    </div>
  );
}

export const CMS_FIELDS_CSS = `
.cf-f{display:flex;flex-direction:column;gap:5px;margin:0 0 12px;}
.cf-f span{font-size:12px!important;font-weight:600;color:#4B5563!important;}
.cf-f input,.cf-f textarea,.cf-f select,.cf-group input{
  width:100%;border:1px solid #D5DDD8;border-radius:8px;padding:8px 10px;font-size:13px!important;font-family:inherit;color:#111;background:#fff;}
.cf-f textarea{resize:vertical;line-height:1.45;}
.cf-f input:focus,.cf-f textarea:focus,.cf-f select:focus,.cf-group input:focus{outline:none;border-color:#189E4F;box-shadow:0 0 0 2px rgba(24,158,79,.15);}
.cf-check{display:flex;align-items:center;gap:8px;margin:0 0 12px;font-size:13px;color:#111;}
.cf-group{border:1px solid #E2E8E4;border-radius:8px;padding:8px 10px 4px;margin:0 0 12px;display:grid;gap:6px;}
.cf-group legend{font-size:12px;font-weight:600;color:#4B5563;padding:0 4px;}
.cf-group > input{margin-bottom:6px;}
.cf-list{margin-top:6px;}
.cf-list-h{display:flex;justify-content:space-between;align-items:center;margin:6px 0 8px;font-size:12px;font-weight:700;color:#111;}
.cf-list-h button{background:#EAF9E4;color:#012F23;border:0;border-radius:6px;padding:5px 10px;font-size:12px;font-weight:600;cursor:pointer;}
.cf-item{border:1px solid #E2E8E4;border-radius:10px;padding:10px 12px 2px;margin:0 0 10px;background:#FBFCFB;}
.cf-item .cf-item{background:#fff;}
.cf-item-h{display:flex;justify-content:space-between;align-items:center;margin:0 0 8px;font-size:12px;color:#6B7280;}
.cf-item-tools{display:flex;gap:4px;}
.cf-item-tools button{background:#fff;border:1px solid #E2E8E4;border-radius:6px;padding:2px 8px;font-size:12px;cursor:pointer;}
.cf-item-tools button:disabled{opacity:.35;cursor:default;}
.cf-item-tools .is-danger{color:#B42318;}
.cf-keyed-h{font-size:12px;font-weight:700;color:#111;margin:10px 0 4px;}
`;
