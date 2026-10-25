'use client';

/**
 * Operations: bookings, sessions, slots and clients, at three levels.
 *
 *   Everyone  →  a team  →  one therapist
 *
 * The level is a breadcrumb rather than three pages: every panel below takes
 * the same scope, so moving down narrows the figures without changing what is
 * on screen. Sending the scope to the API rather than filtering here keeps the
 * totals authoritative — a team's number is the server's, not a subtraction.
 *
 * Two distinctions the panels keep apart on purpose, because the marketing
 * brief is explicit that they are different questions:
 *
 *   Booking time is when the client made the reservation. Session time is when
 *   the appointment is. A client booking at 3 PM for a 9 PM session counts
 *   once in each, at different hours.
 *
 *   Slots opened during the period, slots bookable now, and slots whose
 *   appointment falls in the period are three measurements. They sit in
 *   separate cards and are never added together.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { N, compact, Section, Col, Columns, AreaChart, BarList, fmtDay } from './ui';

const ALL = 'all';

/** A scope string the API understands, and a label for the breadcrumb. */
const scopeOf = (team, therapist) => {
  if (therapist) return `therapist:${therapist.id}`;
  if (team) return `team:${team.id}`;
  return ALL;
};

const pct = (part, whole) => (whole > 0 ? Math.round((part / whole) * 100) : 0);

/* ------------------------------------------------------------------ pieces */

function Kpi({ title, value, sub, hint }) {
  return (
    <div className="wx-kpi">
      <span className="wx-kpi-t">
        {title}
        {hint && <span className="wx-info" title={hint}>ⓘ</span>}
      </span>
      <div className="wx-kpi-row"><b>{value}</b></div>
      {sub && <small>{sub}</small>}
    </div>
  );
}

/**
 * Hour-band distribution. Empty bands are kept so quiet hours read as quiet.
 *
 * The busiest band is read back off the bars rather than taken from the API,
 * so the caption always describes the chart above it. Trusting a separate peak
 * field let a disagreement print as "61 of 56 (109%)".
 */
function Distribution({ bands, empty }) {
  const total = bands.reduce((a, b) => a + b.sessions, 0);
  if (!total) return <p className="wx-empty">{empty}</p>;
  const peak = bands.reduce((a, b) => (b.sessions > a.sessions ? b : a), bands[0]);
  return (
    <>
      <Columns rows={bands.map((b) => ({ label: b.label.split('–')[0], value: b.sessions }))} />
      {peak.sessions > 0 && (
        <p className="wx-note">
          Busiest: <b>{peak.label}</b> — {N(peak.sessions)} of {N(total)} ({pct(peak.sessions, total)}%)
        </p>
      )}
    </>
  );
}

function Table({ head, rows, empty }) {
  if (!rows.length) return <p className="wx-empty">{empty}</p>;
  return (
    <div className="wx-tablewrap">
      <table className="wx-table">
        <thead><tr>{head.map((h) => <th key={h}>{h}</th>)}</tr></thead>
        <tbody>{rows}</tbody>
      </table>
    </div>
  );
}

/* ------------------------------------------------------------------- page */

export default function Operations({ request, dates, rangeControl }) {
  const [teams, setTeams] = useState([]);
  const [people, setPeople] = useState([]);
  const [team, setTeam] = useState(null);
  const [therapist, setTherapist] = useState(null);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const scope = scopeOf(team, therapist);
  const { from, to } = dates;

  // Teams never change with the date range, so they are fetched once.
  useEffect(() => {
    let off = false;
    request('ops/teams')
      .then((j) => { if (!off) setTeams(j.data || []); })
      .catch(() => { if (!off) setTeams([]); });
    return () => { off = true; };
  }, [request]);

  // The therapist list follows the team, so drilling into Team B offers only
  // Team B's therapists.
  useEffect(() => {
    let off = false;
    const s = team ? `team:${team.id}` : ALL;
    request(`ops/therapists?scope=${encodeURIComponent(s)}`)
      .then((j) => { if (!off) setPeople(j.data || []); })
      .catch(() => { if (!off) setPeople([]); });
    return () => { off = true; };
  }, [request, team]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const j = await request(`ops/overview?from=${from}&to=${to}&scope=${encodeURIComponent(scope)}`);
      setData(j.data);
    } catch (e) {
      setError(e.message || 'Could not load this report.');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [request, from, to, scope]);

  useEffect(() => { load(); }, [load]);

  const nameOf = useMemo(() => {
    const byId = new Map(people.map((p) => [p.id, p.name]));
    return (id) => byId.get(id) || 'Therapist';
  }, [people]);

  if (error) {
    return (
      <div className="wx-card">
        <b>Couldn’t load this report</b>
        <p>{error}</p>
        <button type="button" className="wx-link" onClick={load}>Try again</button>
      </div>
    );
  }
  if (loading && !data) return <p className="wx-empty">Loading…</p>;
  if (!data) return null;

  const { kpis, bookingTime, sessionTime, clients, slotOpenings, slots } = data;

  return (
    <>
      <div className="wx-ops-bar">
        <nav className="wx-crumbs" aria-label="Report level">
          <button type="button" className="wx-link" onClick={() => { setTeam(null); setTherapist(null); }} aria-current={!team ? 'page' : undefined}>
            All of Koott
          </button>
          {team && (
            <>
              <span aria-hidden>›</span>
              <button type="button" className="wx-link" onClick={() => setTherapist(null)} aria-current={!therapist ? 'page' : undefined}>
                {team.name}
              </button>
            </>
          )}
          {therapist && (<><span aria-hidden>›</span><span>{therapist.name}</span></>)}
        </nav>
        <div className="wx-ops-picks">
          <label>Team
            <select
              value={team?.id || ''}
              onChange={(e) => {
                setTeam(teams.find((t) => t.id === e.target.value) || null);
                setTherapist(null);
              }}
            >
              <option value="">All teams</option>
              {teams.map((t) => <option key={t.id} value={t.id}>{t.name} ({t.therapists})</option>)}
            </select>
          </label>
          <label>Therapist
            <select
              value={therapist?.id || ''}
              onChange={(e) => setTherapist(people.find((p) => p.id === e.target.value) || null)}
            >
              <option value="">All therapists</option>
              {people.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </label>
        </div>
      </div>

      <div className="wx-range">{rangeControl}{loading && <span className="wx-muted">Updating…</span>}</div>

      <Section title="At a glance">
        <div className="wx-kpis wx-kpis-4">
          <Kpi title="Sessions" value={N(kpis.sessions)} sub={`${N(clients.sessions.new)} new · ${N(clients.sessions.returning)} returning`} />
          <Kpi title="New clients" value={N(kpis.newClients)} sub={`${N(kpis.returningClients)} returning`} hint="People booking with Koott for the first time, counted once each." />
          <Kpi title="Peak booking hour" value={kpis.peakBookingHour || '—'} hint="When clients make reservations." />
          <Kpi title="Peak session hour" value={kpis.peakSessionHour || '—'} hint="When appointments are scheduled." />
          <Kpi title="Slots opened" value={N(kpis.slotsOpened)} sub={`${N(kpis.slotsOpenedByPeople)} by a person`} hint="Opened during this period. The nightly job opens most of them; the second figure counts therapists and admins only." />
          <Kpi title="Bookable now" value={N(kpis.slotsBookable)} sub={`of ${N(kpis.slotsScheduled)} in this period`} hint="Slots in this period that nobody has taken." />
        </div>
      </Section>

      <Section title="When clients book, and when they meet">
        <Col title="Booking time" info="When the reservation was made, not when the session is.">
          <Distribution bands={bookingTime.bands} empty="No bookings were made in this period." />
        </Col>
        <Col title="Session time" info="When the appointment is scheduled.">
          <Distribution bands={sessionTime.bands} empty="No sessions fall in this period." />
        </Col>
      </Section>

      <Section title="Slots">
        <Col title="Available by day" info="Slots whose appointment falls on that day, and how many are still bookable.">
          {slots.byDay.length
            ? <AreaChart rows={slots.byDay.map((d) => ({ label: fmtDay(d.date), slots: d.slots, bookable: d.bookable }))} keys={[{ key: 'slots', label: 'Total' }, { key: 'bookable', label: 'Bookable' }]} height={200} />
            : <p className="wx-empty">No availability recorded for these dates.</p>}
        </Col>
        <Col title="How far ahead slots open" info="Days between opening a slot and the appointment itself.">
          {slotOpenings.total ? (
            <BarList rows={[
              { label: 'Same day', value: slotOpenings.leadTime.sameDay },
              { label: 'Within 3 days', value: slotOpenings.leadTime.within3 },
              { label: 'Within a week', value: slotOpenings.leadTime.within7 },
              { label: 'More than a week', value: slotOpenings.leadTime.beyond7 },
            ]} />
          ) : <TrackingNote since={slotOpenings.trackingSince} />}
        </Col>
      </Section>

      {!therapist && (
        <Section title={team ? `Therapists in ${team.name}` : 'Teams'}>
          <Col title={team ? 'Slots opened per therapist' : 'Compare teams'}>
            {team ? (
              <Table
                head={['Therapist', 'Slots in period', 'Bookable']}
                empty="No availability for these therapists in this period."
                rows={slots.perTherapist.map((r) => (
                  <tr key={r.psychologistId}>
                    <td>
                      <button type="button" className="wx-link" onClick={() => setTherapist({ id: r.psychologistId, name: nameOf(r.psychologistId) })}>
                        {nameOf(r.psychologistId)}
                      </button>
                    </td>
                    <td>{N(r.slots)}</td>
                    <td>{N(r.bookable)}</td>
                  </tr>
                ))}
              />
            ) : (
              <Table
                head={['Team', 'Therapists', '']}
                empty="No teams yet."
                rows={teams.map((t) => (
                  <tr key={t.id}>
                    <td>{t.name}</td>
                    <td>{N(t.therapists)}</td>
                    <td><button type="button" className="wx-link" onClick={() => { setTeam(t); setTherapist(null); }}>View more</button></td>
                  </tr>
                ))}
              />
            )}
          </Col>
        </Section>
      )}

      <Section title="Slot opening history">
        <Col title="Every slot, and when it was opened" info="The appointment it is for, and the moment it became bookable.">
          {slotOpenings.openings.length ? (
            <>
              <Table
                head={['Therapist', 'Appointment', 'Start', 'Opened on', 'At', 'Notice', 'By']}
                empty=""
                rows={slotOpenings.openings.slice(0, 100).map((o, i) => (
                  <tr key={`${o.psychologistId}-${o.slotDate}-${o.slotTime}-${i}`}>
                    <td>{nameOf(o.psychologistId)}</td>
                    <td>{fmtDay(o.slotDate)}</td>
                    <td>{String(o.slotTime || '').slice(0, 5)}</td>
                    <td>{fmtDay(o.openedDate)}</td>
                    <td>{new Date(o.openedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' })}</td>
                    <td>{o.sameDay ? 'Same day' : `${o.leadDays}d ahead`}</td>
                    <td>{o.actor}</td>
                  </tr>
                ))}
              />
              {slotOpenings.openings.length > 100 && (
                <p className="wx-note">Showing the 100 most recent of {N(slotOpenings.openings.length)}.</p>
              )}
            </>
          ) : <TrackingNote since={slotOpenings.trackingSince} />}
        </Col>
      </Section>
    </>
  );
}

/**
 * Said plainly when there is nothing to show, because an empty chart would
 * otherwise read as "no slots were opened" when the truth is "nobody was
 * recording". Availability stores only the current state, so the months before
 * tracking began cannot be reconstructed.
 */
function TrackingNote({ since }) {
  return (
    <p className="wx-empty">
      {since
        ? <>No slots were opened in this period. Opening history has been recorded since <b>{fmtDay(String(since).slice(0, 10))}</b>; anything before that was not tracked.</>
        : <>Slot opening history starts from the first slot opened after this feature went live. Nothing has been recorded yet, and earlier openings cannot be recovered — availability only ever stored the current state.</>}
    </p>
  );
}

export const OPERATIONS_CSS = `
.wx-ops-bar{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px;padding:0 0 12px}
.wx-crumbs{display:flex;align-items:center;gap:8px;font-size:13.5px;color:#162D3D;flex-wrap:wrap}
.wx-crumbs [aria-current="page"]{font-weight:600;text-decoration:none;color:#162D3D}
.wx-ops-picks{display:flex;gap:10px;flex-wrap:wrap}
.wx-ops-picks label{display:flex;align-items:center;gap:6px;font-size:12.5px;color:#6B7C8D}
.wx-ops-picks select{font:inherit;font-size:13px;padding:5px 8px;border:1px solid #D7DEE6;border-radius:6px;background:#fff;color:#162D3D;max-width:200px}
.wx-kpis-4{grid-template-columns:repeat(3,minmax(0,1fr))}
.wx-note{margin:8px 0 0;font-size:12.5px;color:#6B7C8D}
.wx-tablewrap{overflow-x:auto}
.wx-table{width:100%;border-collapse:collapse;font-size:13px}
.wx-table th{text-align:left;font-weight:600;color:#6B7C8D;padding:6px 10px 6px 0;border-bottom:1px solid #E7ECF2;white-space:nowrap}
.wx-table td{padding:7px 10px 7px 0;border-bottom:1px solid #F1F4F8;color:#162D3D;white-space:nowrap}
.wx-table tr:last-child td{border-bottom:0}
@media (max-width:900px){
  .wx-kpis-4{grid-template-columns:repeat(2,minmax(0,1fr))}
  .wx-ops-bar{flex-direction:column;align-items:stretch}
  .wx-ops-picks select{max-width:none;width:100%}
  .wx-ops-picks label{flex:1 1 140px}
}
@media (max-width:560px){
  .wx-kpis-4{grid-template-columns:1fr}
}
`;
