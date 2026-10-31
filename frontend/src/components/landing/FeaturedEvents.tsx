'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Calendar, Users } from 'lucide-react';
import { FEATURED_EVENTS, QUICK_FILTER_TABS } from '@/lib/mock-data';
import type { EventSession } from '@/types/mahjong';

interface FeaturedEventsProps {
  onSelectEvent: (event: EventSession) => void;
}

export default function FeaturedEvents({ onSelectEvent }: FeaturedEventsProps) {
  const [activeTab, setActiveTab] = useState('all');

  const filteredEvents = FEATURED_EVENTS.filter((event) => {
    if (activeTab === 'all') return true;
    return event.category === activeTab;
  });

  return (
    <section id="events" className="landing-section">
      <div className="landing-container">
        {/* Section Header */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: '16px', marginBottom: '28px' }}>
          <div>
            <div className="landing-section-subtitle">
              Katalog Sesi Pilihan
            </div>
            <h2 className="landing-section-title">
              Jadwal Sesi & Turnamen Pekan Ini
            </h2>
            <p className="landing-section-desc">
              Pilih sesi bertanding dengan meja otomatis Amos Rexx III di Game House MahjongYuks.
            </p>
          </div>

          {/* Quick Filter Tabs */}
          <div className="landing-events-tabs">
            {QUICK_FILTER_TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`landing-events-tab ${isActive ? 'active' : ''}`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Structured 3-Column Catalog Grid */}
        <div className="landing-events-grid">
          {filteredEvents.map((event) => {
            const isFewSeats = event.seatsRemaining < 5;
            return (
              <div key={event.id} className="landing-event-card">
                {/* Image Header */}
                <div className="landing-event-img-wrap">
                  <Image
                    src={event.image}
                    alt={event.title}
                    fill
                    style={{ objectFit: 'cover' }}
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />

                  {/* Top-Left Category Pill */}
                  <div className="landing-event-badge">
                    {event.categoryLabel}
                  </div>

                  {/* Top-Right Seat Availability */}
                  {isFewSeats && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        backgroundColor: 'rgba(184, 134, 11, 0.92)',
                        backdropFilter: 'blur(6px)',
                        WebkitBackdropFilter: 'blur(6px)',
                        color: '#FFFFFF',
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '4px 10px',
                        borderRadius: '4px',
                        letterSpacing: '0.02em',
                      }}
                    >
                      Sisa {event.seatsRemaining} Kursi
                    </div>
                  )}
                </div>

                {/* Card Body */}
                <div className="landing-event-body">
                  {/* Meta Row: Venue + Date & Time */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: '#78807B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      {event.venue}
                    </span>
                    <span style={{ fontSize: '12px', fontWeight: 500, color: '#4A524D' }}>
                      {event.dateTime}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="landing-event-title">
                    {event.title}
                  </h3>

                  {/* Concise Summary */}
                  <p className="landing-event-desc">
                    {event.description}
                  </p>

                  {/* Tags */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
                    {event.tags.map((tag, tIdx) => (
                      <span
                        key={tIdx}
                        style={{
                          fontSize: '11px',
                          color: '#4A524D',
                          backgroundColor: '#F2EFE9',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          border: '1px solid #E4E0D8',
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Price & Primary CTA */}
                  <div className="landing-event-footer">
                    <div className="landing-event-price">
                      {event.price} <span>{event.priceUnit}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => onSelectEvent(event)}
                      className="landing-btn-reserve"
                      style={{ padding: '8px 14px', fontSize: '12px' }}
                    >
                      <span>Pesan Kursi</span>
                      <ArrowRight size={13} strokeWidth={2} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
