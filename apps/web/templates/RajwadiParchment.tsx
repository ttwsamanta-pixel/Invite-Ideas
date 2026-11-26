import type { InvitationData } from './adapter'
import { CinematicStory } from './CinematicStory'

export default function RajwadiParchment({ data }: { data: InvitationData }) {
  return <CinematicStory theme="parchment" data={data} />
}
