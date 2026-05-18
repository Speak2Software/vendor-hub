/**
 * MessagingCenter — shared 1:1 messaging UI used by both vendors and managers.
 *
 * Props:
 *   threads        — enriched thread list: [{ vendorId, communityId, otherPartyName, lastMessage, unreadCount }]
 *   availableParties — parties you can start a new conversation with:
 *                      [{ vendorId, communityId, name }]
 *   onRefresh      — called after send/read so parent can reload thread list
 */

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  getDirectMessageThread,
  sendDirectMessage,
  markThreadRead,
} from '../utils/storage'

function fmtTime(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}
function fmtDate(iso) {
  const d = new Date(iso)
  const today = new Date()
  if (d.toDateString() === today.toDateString()) return fmtTime(iso)
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

export default function MessagingCenter({ threads = [], availableParties = [], onRefresh }) {
  const { user } = useAuth()
  const [activeThread, setActiveThread] = useState(null)
  const [messages,     setMessages]     = useState([])
  const [newMsg,       setNewMsg]       = useState('')
  const [sending,      setSending]      = useState(false)
  const [showNew,      setShowNew]      = useState(false)
  const bottomRef = useRef(null)
  const inputRef  = useRef(null)

  async function openThread(thread) {
    setActiveThread(thread)
    setShowNew(false)
    const msgs = await getDirectMessageThread(thread.vendorId, thread.communityId)
    setMessages(msgs)
    await markThreadRead(thread.vendorId, thread.communityId)
    onRefresh?.()
  }

  async function startNewThread(party) {
    setShowNew(false)
    // Check if thread already exists
    const existing = threads.find(
      (t) => t.vendorId === party.vendorId && t.communityId === party.communityId,
    )
    if (existing) {
      openThread({ ...existing, otherPartyName: party.name })
    } else {
      // Start fresh thread
      setActiveThread({ vendorId: party.vendorId, communityId: party.communityId, otherPartyName: party.name })
      setMessages([])
    }
  }

  async function handleSend(e) {
    e.preventDefault()
    if (!newMsg.trim() || !activeThread || sending) return
    setSending(true)
    try {
      const msg = await sendDirectMessage({
        vendorId:    activeThread.vendorId,
        communityId: activeThread.communityId,
        body:        newMsg.trim(),
      })
      setMessages((prev) => [...prev, msg])
      setNewMsg('')
      onRefresh?.()
    } finally {
      setSending(false)
    }
  }

  // Scroll to bottom whenever messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input when opening a thread
  useEffect(() => {
    if (activeThread) setTimeout(() => inputRef.current?.focus(), 100)
  }, [activeThread])

  const totalUnread = threads.reduce((sum, t) => sum + (t.unreadCount || 0), 0)

  // ── New conversation picker ────────────────────────────────────────────────
  if (showNew) {
    const existingKeys = new Set(threads.map((t) => `${t.vendorId}|${t.communityId}`))
    return (
      <div>
        <button
          onClick={() => setShowNew(false)}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 mb-4"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Back
        </button>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Start a conversation with…</p>
        {availableParties.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-6">No parties available to message yet.</p>
        ) : (
          <div className="space-y-2">
            {availableParties.map((party) => {
              const key = `${party.vendorId}|${party.communityId}`
              return (
                <button
                  key={key}
                  onClick={() => startNewThread(party)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all text-left"
                >
                  <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-sm font-semibold text-blue-700 flex-shrink-0">
                    {party.name?.charAt(0) || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{party.name}</p>
                    {existingKeys.has(key) && (
                      <p className="text-xs text-blue-500">Existing conversation</p>
                    )}
                  </div>
                  <svg className="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                  </svg>
                </button>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  // ── Conversation view ──────────────────────────────────────────────────────
  if (activeThread) {
    return (
      <div className="flex flex-col" style={{ height: 460 }}>
        {/* Header */}
        <div className="flex items-center gap-3 pb-3 mb-3 border-b border-gray-100 flex-shrink-0">
          <button
            onClick={() => setActiveThread(null)}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            Back
          </button>
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-semibold text-blue-700 flex-shrink-0">
            {activeThread.otherPartyName?.charAt(0) || '?'}
          </div>
          <p className="text-sm font-semibold text-gray-900 truncate">{activeThread.otherPartyName}</p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 min-h-0">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <p className="text-2xl mb-2">👋</p>
              <p className="text-sm font-medium text-gray-600">Start the conversation</p>
              <p className="text-xs text-gray-400 mt-1">Send your first message below.</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.senderId === user.id
              return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 ${
                    isMe
                      ? 'bg-blue-600 text-white rounded-br-sm'
                      : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                  }`}>
                    <p className="text-sm leading-relaxed break-words">{msg.body}</p>
                    <p className={`text-[10px] mt-1 ${isMe ? 'text-blue-200' : 'text-gray-400'}`}>
                      {fmtTime(msg.sentAt)}
                    </p>
                  </div>
                </div>
              )
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="flex gap-2 pt-3 border-t border-gray-100 mt-3 flex-shrink-0">
          <input
            ref={inputRef}
            type="text"
            value={newMsg}
            onChange={(e) => setNewMsg(e.target.value)}
            placeholder="Type a message…"
            className="flex-1 text-sm border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={!newMsg.trim() || sending}
            className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-40 transition-colors flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
            </svg>
            Send
          </button>
        </form>
      </div>
    )
  }

  // ── Thread list ────────────────────────────────────────────────────────────
  return (
    <div>
      {/* New message button */}
      {availableParties.length > 0 && (
        <div className="flex justify-end mb-3">
          <button
            onClick={() => setShowNew(true)}
            className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            New message
          </button>
        </div>
      )}

      {threads.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-3xl mb-3">💬</p>
          <p className="text-sm font-medium text-gray-500">No conversations yet</p>
          <p className="text-xs text-gray-400 mt-1 mb-4">
            Direct messages will appear here.
          </p>
          {availableParties.length > 0 && (
            <button
              onClick={() => setShowNew(true)}
              className="text-xs font-semibold text-blue-600 hover:underline"
            >
              Start your first conversation →
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-1.5">
          {threads.map((thread) => {
            const key = `${thread.vendorId}-${thread.communityId}`
            const hasUnread = (thread.unreadCount || 0) > 0
            const last = thread.lastMessage
            return (
              <button
                key={key}
                onClick={() => openThread(thread)}
                className="w-full text-left flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-50 border border-gray-100 hover:border-gray-200 transition-all"
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                  hasUnread ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'
                }`}>
                  {thread.otherPartyName?.charAt(0) || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-sm truncate ${hasUnread ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
                      {thread.otherPartyName}
                    </p>
                    <span className="text-[11px] text-gray-400 flex-shrink-0">{fmtDate(last.sentAt)}</span>
                  </div>
                  <p className={`text-xs truncate mt-0.5 ${hasUnread ? 'text-gray-700' : 'text-gray-400'}`}>
                    {last.senderId === user.id ? 'You: ' : ''}{last.body}
                  </p>
                </div>
                {hasUnread && (
                  <span className="w-5 h-5 bg-blue-600 text-white text-[10px] font-black rounded-full flex items-center justify-center flex-shrink-0">
                    {thread.unreadCount}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
