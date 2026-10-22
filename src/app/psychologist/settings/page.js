"use client";
import { useState, useEffect } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { psychologistApi } from "../../../lib/backendApi";
import TherapistTimeBlocking from "../../../components/TherapistTimeBlocking";
import { 
  AlertCircle,
  CheckCircle,
  Calendar,
  CalendarOff,
  RefreshCw
} from "lucide-react";

export default function PsychologistSettings() {
  const { user, token } = useAuth();
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  // Google Calendar states
  const [isCalendarConnected, setIsCalendarConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [calendarError, setCalendarError] = useState(null);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Whether Google Calendar is connected drives the rest of this page, so it is
  // checked as soon as there is a signed-in therapist to check it for.
  useEffect(() => {
    if (user) checkCalendarStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const checkCalendarStatus = async () => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001/api';
      const url = backendUrl.endsWith('/api') 
        ? `${backendUrl}/psychologists/google-calendar/status`
        : `${backendUrl}/api/psychologists/google-calendar/status`;
        
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setIsCalendarConnected(data.connected || false);
        setLastSyncTime(data.lastSync ? new Date(data.lastSync) : null);
        
        // Fetch calendar events if connected
        if (data.connected) {
          fetchCalendarEvents();
        }
      }
    } catch (error) {
      console.error('Error checking calendar status:', error);
    }
  };
  
  const fetchCalendarEvents = async () => {
    try {
      setIsLoadingEvents(true);
      
      // Fetch next 60 days of events
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 60);
      
      // 1. Fetch Google Calendar events (ALL events from their Gmail calendar)
      let googleEvents = [];
      try {
        const googleData = await psychologistApi.getGoogleCalendarEvents({
          timeMin: startDate.toISOString(),
          timeMax: endDate.toISOString()
        });
        
        if (googleData.success) {
          googleEvents = (googleData.events || []).map(event => ({
            ...event,
            source: 'google_calendar',
            isExternal: true
          }));
        }
      } catch (error) {
        console.error('Error fetching Google events:', error);
      }
      
      // 2. Fetch Koott sessions (your platform bookings)
      let koottEvents = [];
      try {
        const sessionsData = await psychologistApi.getSessions();
        const sessions = sessionsData.data?.sessions || sessionsData.data || [];
        
        console.log('🔍 Raw sessions data:', sessions);
        
        // Convert sessions to calendar event format
        koottEvents = sessions
          .filter(session => session.status !== 'cancelled')
          .map(session => {
            // Parse time to add 1 hour for end time
            const [hours, minutes] = session.scheduled_time.split(':');
            const startDateTime = new Date(`${session.scheduled_date}T${session.scheduled_time}`);
            const endDateTime = new Date(startDateTime);
            endDateTime.setHours(endDateTime.getHours() + 1);
            
            return {
              summary: `Koott - ${session.client_name || 'Client'}`,
              start: {
                dateTime: `${session.scheduled_date}T${session.scheduled_time}`
              },
              end: {
                dateTime: endDateTime.toISOString()
              },
              description: `Status: ${session.status}${session.meeting_link ? '\n📹 Online Session' : ''}`,
              source: 'koott',
              isExternal: false,
              sessionId: session.id,
              status: session.status,
              clientName: session.client_name
            };
          });
      } catch (error) {
        console.error('Error fetching Koott sessions:', error);
      }
      
      // Combine both sources
      const allEvents = [...googleEvents, ...koottEvents];
      setCalendarEvents(allEvents);
      
      console.log('📅 Calendar Events Loaded:', {
        googleEvents: googleEvents.length,
        koottEvents: koottEvents.length,
        total: allEvents.length,
        sample: allEvents.slice(0, 2)
      });
      
    } catch (error) {
      console.error('Error fetching calendar events:', error);
    } finally {
      setIsLoadingEvents(false);
    }
  };
  
  // The Google sign-in URL comes from the backend, built with the same OAuth client
  // that later exchanges the code (/google-calendar/connect). Building it here with
  // NEXT_PUBLIC_GOOGLE_CLIENT_ID broke the flow: that client is a different Google
  // project (Google reports it deleted) and NEXT_PUBLIC_GOOGLE_REDIRECT_URI points at
  // the site-login callback, not /auth/google-calendar/callback.
  const handleConnectGoogleCalendar = async () => {
    setCalendarError(null);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001/api';
      const base = backendUrl.endsWith('/api') ? backendUrl : `${backendUrl}/api`;
      const redirectUri = `${window.location.origin}/auth/google-calendar/callback`;
      const response = await fetch(
        `${base}/psychologists/google-calendar/auth-url?redirect_uri=${encodeURIComponent(redirectUri)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.data?.url) {
        setCalendarError(data?.message || 'Google Calendar integration is not configured. Please contact support.');
        return;
      }
      window.location.href = data.data.url;
    } catch (error) {
      console.error('Google Calendar connect failed:', error);
      setCalendarError('Could not start the Google Calendar connection. Please try again.');
    }
  };
  
  const handleDisconnectGoogleCalendar = async () => {
    try {
      setIsSyncing(true);
      setCalendarError(null);
      
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001/api';
      const url = backendUrl.endsWith('/api') 
        ? `${backendUrl}/psychologists/google-calendar/disconnect`
        : `${backendUrl}/api/psychologists/google-calendar/disconnect`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        setIsCalendarConnected(false);
        setLastSyncTime(null);
        setSuccess('Google Calendar disconnected successfully');
      } else {
        const data = await response.json();
        setCalendarError(data.message || 'Failed to disconnect calendar');
      }
    } catch (error) {
      console.error('Error disconnecting calendar:', error);
      setCalendarError('Failed to disconnect Google Calendar');
    } finally {
      setIsSyncing(false);
    }
  };
  
  const handleSyncNow = async () => {
    try {
      setIsSyncing(true);
      setCalendarError(null);
      
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001/api';
      const url = backendUrl.endsWith('/api') 
        ? `${backendUrl}/availability-controller/sync-google-calendar`
        : `${backendUrl}/api/availability-controller/sync-google-calendar`;
      
      // Set date range for sync (next 30 days)
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          psychologist_id: user.id,
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0]
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setLastSyncTime(new Date());
        setSuccess(`Synced successfully! Processed ${data.data?.blockedSlots?.length || 0} external bookings.`);
        // Refresh calendar events after sync
        fetchCalendarEvents();
      } else {
        const data = await response.json();
        setCalendarError(data.message || 'Failed to sync calendar');
      }
    } catch (error) {
      console.error('Error syncing calendar:', error);
      setCalendarError('Failed to sync with Google Calendar');
    } finally {
      setIsSyncing(false);
    }
  };
  
  const formatEventTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };
  
  const getEventColor = (summary, source) => {
    // Koott events are always green
    if (source === 'koott') {
      return 'bg-green-100 border-green-400 text-green-900';
    }
    
    // External events colored by type
    const lower = summary?.toLowerCase() || '';
    if (lower.includes('betterhelp') || lower.includes('therapy') || lower.includes('session')) {
      return 'bg-purple-100 border-purple-300 text-purple-800';
    }
    if (lower.includes('talkspace') || lower.includes('counseling')) {
      return 'bg-[#025545]/10 border-[#025545]/30 text-[#025545]';
    }
    if (lower.includes('meeting') || lower.includes('call')) {
      return 'bg-orange-100 border-orange-300 text-orange-800';
    }
    return 'bg-gray-100 border-gray-300 text-gray-800';
  };
  
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    return { daysInMonth, startingDayOfWeek, year, month };
  };
  
  const getEventsForDate = (date) => {
    const toYmdLocal = (d) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    const dateStr = toYmdLocal(date);
    return calendarEvents.filter(event => {
      const startStr = event.start?.dateTime || event.start?.date;
      if (!startStr) return false;
      const evDateStr = toYmdLocal(new Date(startStr));
      return evDateStr === dateStr;
    });
  };
  
  const navigateMonth = (direction) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + direction);
    setCurrentMonth(newMonth);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 text-lg">User not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h6 className="font-semibold text-gray-900">Calendar &amp; Availability</h6>
          <p className="mt-1 text-sm text-gray-600">
            Connect your Google Calendar, see what is on it, and block the time you
            are not available.
          </p>
        </div>
      </div>

      {/* Profile Form */}
      <div className="mt-8">
        <div className="space-y-8">
          {/* Google Calendar Integration */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
              <p className="font-medium text-gray-900 text-sm sm:text-base flex items-center">
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                Google Calendar Integration
              </p>
            </div>
            <div className="px-4 sm:px-6 py-4 sm:py-6 space-y-4">
              <div className="flex items-start">
                <div className="flex-1">
                  <p className="text-sm text-gray-700 mb-4">
                    Connect your Google Calendar to automatically prevent double bookings. When you have sessions booked on other platforms (BetterHelp, Talkspace, etc.), those time slots will be automatically blocked on Koott.
                  </p>
                  
                  {isCalendarConnected ? (
                    <div className="space-y-4">
                      <div className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                        <span className="text-sm text-green-700 font-medium">Google Calendar Connected</span>
                      </div>
                      
                      {lastSyncTime && (
                        <p className="text-xs text-gray-500">
                          Last synced: {lastSyncTime.toLocaleString()}
                        </p>
                      )}
                      
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={handleSyncNow}
                          disabled={isSyncing}
                          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#025545] disabled:opacity-50"
                        >
                          {isSyncing ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-700 mr-2"></div>
                              Syncing...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2" />
                              Sync Now
                            </>
                          )}
                        </button>
                        
                        <button
                          type="button"
                          onClick={handleDisconnectGoogleCalendar}
                          disabled={isSyncing}
                          className="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                        >
                          Disconnect Calendar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleConnectGoogleCalendar}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[#025545] hover:bg-[#012f23] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#025545]"
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      Connect Google Calendar
                    </button>
                  )}
                  
                  {calendarError && (
                    <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-3">
                      <p className="text-sm text-red-700">{calendarError}</p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="mt-4 bg-[#025545]/10 border border-[#025545]/20 rounded-md p-4">
                <p className="text-sm font-medium text-[#012f23] mb-2">How it works:</p>
                <ul className="text-xs text-[#025545] space-y-1 list-disc list-inside">
                  <li>System syncs your calendar every 30 minutes automatically</li>
                  <li>Bookings from other platforms are detected and blocked here</li>
                  <li>Prevents double bookings across all your therapy platforms</li>
                  <li>Read-only access - we never modify your calendar</li>
                </ul>
              </div>
              
              {/* Calendar Events Display */}
              {isCalendarConnected && (
                <div className="mt-6">
                  {/* Month Calendar View */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm font-semibold text-gray-900">Calendar View - Bookings from Other Platforms</p>
                      <button
                        onClick={fetchCalendarEvents}
                        disabled={isLoadingEvents}
                        className="text-xs text-[#025545] hover:text-[#012f23] flex items-center gap-1"
                      >
                        {isLoadingEvents ? (
                          <>
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-[#025545]"></div>
                            Loading...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="h-3 w-3" />
                            Refresh
                          </>
                        )}
                      </button>
                    </div>
                    
                    {/* Calendar Header */}
                    <div className="bg-white border rounded-lg p-2 sm:p-3 w-full max-w-2xl mx-auto overflow-x-auto">
                      <div className="flex items-center justify-between mb-2 sm:mb-3">
                        <button
                          onClick={() => navigateMonth(-1)}
                          className="p-1 sm:p-1.5 hover:bg-gray-100 rounded-full"
                        >
                          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                        <p className="font-semibold text-sm sm:text-base">
                          {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </p>
                        <button
                          onClick={() => navigateMonth(1)}
                          className="p-1 sm:p-1.5 hover:bg-gray-100 rounded-full"
                        >
                          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                      
                      {/* Calendar Grid */}
                      <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                          <div key={day} className="text-center text-[10px] sm:text-xs font-semibold text-gray-600 py-1 sm:py-1.5">
                            {day}
                          </div>
                        ))}
                        
                        {(() => {
                          const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentMonth);
                          const days = [];
                          
                          // Empty cells before first day
                          for (let i = 0; i < startingDayOfWeek; i++) {
                            days.push(
                              <div key={`empty-${i}`} className="aspect-square"></div>
                            );
                          }
                          
                          // Days of month
                          for (let day = 1; day <= daysInMonth; day++) {
                            const date = new Date(year, month, day);
                            const eventsForDay = getEventsForDate(date);
                            const isToday = date.toDateString() === new Date().toDateString();
                            const isSelected = date.toDateString() === selectedDate.toDateString();
                            
                            days.push(
                              <button
                                key={day}
                                onClick={() => setSelectedDate(date)}
                                className={`aspect-square text-[10px] sm:text-xs rounded transition-colors ${
                                  isToday ? 'bg-[#025545]/10 font-bold' : ''
                                } ${
                                  isSelected ? 'ring-1 sm:ring-2 ring-[#025545]' : ''
                                } ${
                                  eventsForDay.length > 0 ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-gray-100'
                                }`}
                              >
                                <div className="flex flex-col items-center justify-center h-full">
                                  <span className={eventsForDay.length > 0 ? 'text-red-700 font-semibold' : ''}>{day}</span>
                                  {eventsForDay.length > 0 && (
                                    <div className="flex gap-0.5 mt-0.5">
                                      {eventsForDay.slice(0, 3).map((_, i) => (
                                        <div key={i} className="w-0.5 h-0.5 sm:w-1 sm:h-1 bg-red-500 rounded-full"></div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </button>
                            );
                          }
                          
                          return days;
                        })()}
                      </div>
                    </div>
                  </div>
                  
                  {/* Selected Date Events */}
                  <div className="bg-white border rounded-lg p-4">
                    <p className="text-sm font-semibold text-gray-900 mb-3">
                      Events for {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                    
                    {(() => {
                      const dayEvents = getEventsForDate(selectedDate);
                      return dayEvents.length > 0 ? (
                        <div className="space-y-2">
                          {dayEvents.map((event, index) => (
                            <div
                              key={index}
                              className={`p-3 rounded-lg border ${getEventColor(event.summary, event.source)}`}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <p className="font-medium text-sm">{event.summary || 'Untitled Event'}</p>
                                  <p className="text-xs mt-1 opacity-80">
                                    {new Date(event.start.dateTime || event.start.date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                                    {event.end && ` - ${new Date(event.end.dateTime || event.end.date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`}
                                  </p>
                                  {event.location && (
                                    <p className="text-xs mt-1 opacity-70">📍 {event.location}</p>
                                  )}
                                  {event.description && (
                                    <p className="text-xs mt-2 opacity-60">{event.description}</p>
                                  )}
                                </div>
                                <div className="ml-3">
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                    event.source === 'koott' 
                                      ? 'bg-green-200 text-green-900' 
                                      : 'bg-white/50'
                                  }`}>
                                    {event.source === 'koott' ? 'Koott' : 'External'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-600">No events on this date</p>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Blocking your own time */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
              <p className="font-medium text-gray-900 text-sm sm:text-base flex items-center">
                <CalendarOff className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                Block your time
              </p>
            </div>
            <TherapistTimeBlocking calendarConnected={isCalendarConnected} />
          </div>

          {/* Error and Success Messages */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <p className="ml-3 text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex">
                <CheckCircle className="h-5 w-5 text-green-400" />
                <p className="ml-3 text-sm text-green-700">{success}</p>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}









