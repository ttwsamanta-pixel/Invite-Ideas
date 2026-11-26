import type { InvitationData } from './adapter'
import { CinematicStory } from './CinematicStory'

export default function RoyalPalaceGates({ data }: { data: InvitationData }) {
  return <CinematicStory theme="royal" data={data} />
}
