import type { ReactNode } from 'react'
import type { Invitation } from '../lib/data'

export function toTemplateData(invitation: Invitation, rsvp: ReactNode) {
  const [first, ...partners] = invitation.names.split(/\s+(?:&|and|ও|और)\s+/iu)
  const firstEvent = invitation.events[0]
  const dateFormat = new Intl.DateTimeFormat(invitation.language, { dateStyle: 'long', timeZone: invitation.timezone })
  const timeFormat = new Intl.DateTimeFormat(invitation.language, { timeStyle: 'short', timeZone: invitation.timezone })
  return {
    title: invitation.title,
    names: invitation.names,
    groomName: invitation.details?.['groom-name'] || first,
    brideName: invitation.details?.['bride-name'] || partners.join(' & '),
    date: firstEvent ? dateFormat.format(new Date(firstEvent.startsAt)) : '',
    countdownAt: firstEvent?.startsAt,
    venue: firstEvent?.venue,
    story: invitation.story,
    welcomeMessage: invitation.family,
    events: invitation.events.map((event, index) => ({
      id: event.startsAt + ':' + index,
      title: event.name,
      date: dateFormat.format(new Date(event.startsAt)),
      time: timeFormat.format(new Date(event.startsAt)).replace(/[\u00a0\u2009\u202f]/g, ' '),
      venue: event.venue,
      address: event.description,
      mapUrl: event.mapUrl,
    })),
    gallery: invitation.gallery.flatMap(image => image.url ? [image.url] : []),
    artwork: invitation.config?.image,
    guestDetails: (invitation.config?.fields || []).flatMap(field => {
      const value = invitation.details?.[field.key]
      return value && !['groom-name', 'bride-name'].includes(field.key) ? [{ key: field.key, label: field.label, value }] : []
    }),
    musicUrl: invitation.music?.file,
    rsvpEnabled: Boolean(rsvp),
    rsvp,
    mapUrl: firstEvent?.mapUrl,
    address: firstEvent?.description,
  }
}
export type InvitationData = ReturnType<typeof toTemplateData>
